import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import main
from services.auth import create_access_token

client = TestClient(main.app)

@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "manager@travelintelligence.com", "role": "manager"})
    return {"Authorization": f"Bearer {token}"}

def test_embed_config_unauthorized():
    """Endpoint must enforce authentication (401 without valid token)."""
    response = client.get("/api/powerbi/embed-config")
    assert response.status_code == 401

def test_embed_config_authorized_fallback_mode(auth_headers):
    """When Microsoft credentials are unconfigured or pending, returns structured fallback without leaking secrets."""
    response = client.get("/api/powerbi/embed-config", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "report_metadata" in data
    assert "embed_token" in data
    # Secrets must never be present
    assert "client_secret" not in data
    assert "password" not in data
    assert "POWERBI_CLIENT_SECRET" not in str(data.get("embed_token"))
    assert data["report_metadata"]["governed_source"] == "public.vw_travel"
    assert len(data["report_metadata"]["required_pages"]) == 5

def test_embed_config_with_mocked_microsoft_api(auth_headers):
    """When valid Entra ID credentials are provided, calls Microsoft APIs and returns embed token."""
    mock_token_resp = MagicMock()
    mock_token_resp.status_code = 200
    mock_token_resp.json.return_value = {"access_token": "mock_aad_access_token_123"}

    mock_report_resp = MagicMock()
    mock_report_resp.status_code = 200
    mock_report_resp.json.return_value = {
        "id": "mock-report-id",
        "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=mock-report-id",
        "datasetId": "mock-dataset-id"
    }

    mock_embed_token_resp = MagicMock()
    mock_embed_token_resp.status_code = 200
    mock_embed_token_resp.json.return_value = {
        "token": "mock_powerbi_embed_token_xyz",
        "tokenId": "mock-token-guid",
        "expiration": "2026-10-12T23:59:59Z"
    }

    with patch.dict("os.environ", {
        "POWERBI_TENANT_ID": "mock-tenant-guid",
        "POWERBI_CLIENT_ID": "mock-client-guid",
        "POWERBI_CLIENT_SECRET": "mock-client-secret",
        "POWERBI_WORKSPACE_ID": "mock-workspace-guid",
        "POWERBI_REPORT_ID": "mock-report-guid"
    }):
        with patch("services.powerbi_service.requests.post") as mock_post, \
             patch("services.powerbi_service.requests.get") as mock_get:
            
            # First post: get_azure_ad_token; second post: GenerateToken
            mock_post.side_effect = [mock_token_resp, mock_embed_token_resp]
            mock_get.return_value = mock_report_resp

            from services import powerbi_service
            # Reload module env vars
            powerbi_service.POWERBI_TENANT_ID = "mock-tenant-guid"
            powerbi_service.POWERBI_CLIENT_ID = "mock-client-guid"
            powerbi_service.POWERBI_CLIENT_SECRET = "mock-client-secret"
            powerbi_service.POWERBI_WORKSPACE_ID = "mock-workspace-guid"
            powerbi_service.POWERBI_REPORT_ID = "mock-report-guid"

            response = client.get("/api/powerbi/embed-config", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ready"
            assert data["embed_mode"] == "app_owns_data"
            assert data["embed_token"] == "mock_powerbi_embed_token_xyz"
            assert data["embed_url"] == "https://app.powerbi.com/reportEmbed?reportId=mock-report-id"
            assert "client_secret" not in data

            # Reset service state
            powerbi_service.POWERBI_TENANT_ID = ""
            powerbi_service.POWERBI_CLIENT_ID = ""
            powerbi_service.POWERBI_CLIENT_SECRET = ""
            powerbi_service.POWERBI_WORKSPACE_ID = ""
            powerbi_service.POWERBI_REPORT_ID = ""

def test_embed_config_microsoft_auth_failure(auth_headers):
    """When Entra ID returns HTTP 401/400, handles gracefully without crashing."""
    mock_token_fail = MagicMock()
    mock_token_fail.status_code = 401
    mock_token_fail.text = "Unauthorized"

    from services import powerbi_service
    powerbi_service.POWERBI_TENANT_ID = "invalid-tenant"
    powerbi_service.POWERBI_CLIENT_ID = "invalid-client"
    powerbi_service.POWERBI_CLIENT_SECRET = "invalid-secret"
    powerbi_service.POWERBI_WORKSPACE_ID = "w1"
    powerbi_service.POWERBI_REPORT_ID = "r1"

    with patch("services.powerbi_service.requests.post", return_value=mock_token_fail):
        response = client.get("/api/powerbi/embed-config", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("fallback_ready", "unconfigured")
        assert data["embed_token"] is None

    # Reset
    powerbi_service.POWERBI_TENANT_ID = ""
    powerbi_service.POWERBI_CLIENT_ID = ""
    powerbi_service.POWERBI_CLIENT_SECRET = ""
    powerbi_service.POWERBI_WORKSPACE_ID = ""
    powerbi_service.POWERBI_REPORT_ID = ""
