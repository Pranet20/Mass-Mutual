import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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

def test_pbix_download_unauthorized():
    """Accessing /api/powerbi/pbix without credentials must return 401 Unauthorized."""
    response = client.get("/api/powerbi/pbix")
    assert response.status_code == 401

def test_pbix_download_authorized(auth_headers):
    """Authenticated request with Bearer header retrieves valid binary .pbix deliverable."""
    response = client.get("/api/powerbi/pbix", headers=auth_headers)
    assert response.status_code == 200
    assert response.headers.get("content-type") == "application/octet-stream"
    assert "Corporate_Travel_Analytics.pbix" in response.headers.get("content-disposition", "")
    # PBIX is a ZIP-packaged OLE archive; begins with standard PK header bytes
    assert response.content[:2] == b"PK"
    assert len(response.content) > 50000

def test_token_api_failure_handling():
    """Testing with malformed or expired JWT Bearer token returns 401."""
    bad_headers = {"Authorization": "Bearer invalid_expired_or_forged_token_xyz"}
    response = client.get("/api/powerbi/embed-config", headers=bad_headers)
    assert response.status_code == 401

def test_distinct_trip_calculations_and_grain(auth_headers):
    """Verify trip metrics strictly use distinct trip_id rather than row/leg counts."""
    from database.models import SessionLocal, FactTravelTicket
    from sqlalchemy import func

    session = SessionLocal()
    expected_total_tickets = session.query(FactTravelTicket).count()
    expected_flown_tickets = session.query(FactTravelTicket).filter_by(travelled_flag='Y').count()
    expected_distinct_trips = session.query(func.count(func.distinct(FactTravelTicket.trip_id))).scalar()
    expected_flown_trips = session.query(func.count(func.distinct(FactTravelTicket.trip_id))).filter(FactTravelTicket.travelled_flag == 'Y').scalar()
    session.close()

    response = client.get("/api/powerbi/analytics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    kpis = data["kpis"]
    # Distinct trips must be less than or equal to total ticket legs
    assert kpis["total_trips"] <= kpis["total_tickets"]
    assert kpis["flown_trips"] <= kpis["flown_tickets"]
    assert kpis["total_trips"] == expected_distinct_trips
    assert kpis["total_tickets"] == expected_total_tickets
    assert kpis["flown_trips"] == expected_flown_trips
    assert kpis["flown_tickets"] == expected_flown_tickets

    # Check dashboard stats endpoint grain
    stats_resp = client.get("/api/dashboard/stats", headers=auth_headers)
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert s_data["kpis"]["total_trips"] == expected_distinct_trips
    assert s_data["kpis"]["total_tickets"] == expected_total_tickets
    assert s_data["kpis"]["active_trips"] == expected_flown_trips

    # Verify by_business_group has both trip_count and leg_count, with trip_count <= leg_count
    for bg in s_data["by_business_group"]:
        assert bg["trip_count"] <= bg["leg_count"]

    # Verify by_travel_summary has both count (distinct trips) and leg_count
    for summary in s_data["by_travel_summary"]:
        assert summary["count"] <= summary["leg_count"]

def test_authoritative_fx_and_budget_integrity(auth_headers):
    """Verify that fx_rates and allowances are returned authoritatively from the database without invented numbers."""
    response = client.get("/api/powerbi/analytics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "fx_rates" in data
    assert len(data["fx_rates"]) > 0
    # Every FX rate must have currency, rate, label, and effective_date
    for fx in data["fx_rates"]:
        assert fx["currency"] != "INR"
        assert fx["rate"] > 0
        assert "effective_date" in fx
        assert "Corporate Treasury" in fx.get("source", "")

