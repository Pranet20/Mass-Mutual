"""
Power BI Integration Service for MassMutual Corporate Travel Analytics.

Supports:
- Option B (Embed for customers / App owns data) via Microsoft Entra Service Principal & Power BI REST API.
- Option A (Embed for organization / User owns data) metadata.
- Graceful fallback: Provides structured status, prerequisite diagnostics,
  direct Web Report URL fallback, and PBIX desktop deliverable metadata.
"""

import os
import logging
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("powerbi_service")
logger.setLevel(logging.INFO)

# Environment configuration for Power BI Embedding
POWERBI_EMBED_TYPE = os.environ.get("POWERBI_EMBED_TYPE", "app_owns_data").lower() # "app_owns_data" or "user_owns_data"
POWERBI_TENANT_ID = os.environ.get("POWERBI_TENANT_ID", "").strip()
POWERBI_CLIENT_ID = os.environ.get("POWERBI_CLIENT_ID", "").strip()
POWERBI_CLIENT_SECRET = os.environ.get("POWERBI_CLIENT_SECRET", "").strip()
POWERBI_WORKSPACE_ID = os.environ.get("POWERBI_WORKSPACE_ID", "").strip()
POWERBI_REPORT_ID = os.environ.get("POWERBI_REPORT_ID", "").strip()
POWERBI_REPORT_WEB_URL = os.environ.get("POWERBI_REPORT_WEB_URL", "").strip()

# Microsoft Authentication Endpoints
MS_LOGIN_AUTHORITY = "https://login.microsoftonline.com"
POWERBI_API_RESOURCE = "https://analysis.windows.net/powerbi/api"
POWERBI_REST_BASE = "https://api.powerbi.com/v1.0/myorg"


def update_powerbi_runtime_config(new_config: Dict[str, str]) -> Dict[str, Any]:
    """
    Updates Power BI configuration at runtime without requiring application restart.
    Optionally persists updated values into local environment.
    """
    global POWERBI_TENANT_ID, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET
    global POWERBI_WORKSPACE_ID, POWERBI_REPORT_ID, POWERBI_REPORT_WEB_URL, POWERBI_EMBED_TYPE

    if "tenant_id" in new_config:
        POWERBI_TENANT_ID = str(new_config["tenant_id"]).strip()
        os.environ["POWERBI_TENANT_ID"] = POWERBI_TENANT_ID
    if "client_id" in new_config:
        POWERBI_CLIENT_ID = str(new_config["client_id"]).strip()
        os.environ["POWERBI_CLIENT_ID"] = POWERBI_CLIENT_ID
    if "client_secret" in new_config:
        POWERBI_CLIENT_SECRET = str(new_config["client_secret"]).strip()
        os.environ["POWERBI_CLIENT_SECRET"] = POWERBI_CLIENT_SECRET
    if "workspace_id" in new_config:
        POWERBI_WORKSPACE_ID = str(new_config["workspace_id"]).strip()
        os.environ["POWERBI_WORKSPACE_ID"] = POWERBI_WORKSPACE_ID
    if "report_id" in new_config:
        POWERBI_REPORT_ID = str(new_config["report_id"]).strip()
        os.environ["POWERBI_REPORT_ID"] = POWERBI_REPORT_ID
    if "web_report_url" in new_config:
        POWERBI_REPORT_WEB_URL = str(new_config["web_report_url"]).strip()
        os.environ["POWERBI_REPORT_WEB_URL"] = POWERBI_REPORT_WEB_URL
    if "embed_type" in new_config:
        POWERBI_EMBED_TYPE = str(new_config["embed_type"]).strip().lower()
        os.environ["POWERBI_EMBED_TYPE"] = POWERBI_EMBED_TYPE

    return validate_powerbi_config()


def test_azure_powerbi_connection(credentials: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Performs a 3-step live diagnostic verification against Microsoft Entra ID and Power BI REST API:
    1. Azure AD OAuth2 Client Credentials token acquisition
    2. Power BI REST API report metadata & workspace access verification
    3. Power BI REST API Embed Token generation

    Returns detailed diagnostic results without exposing secrets.
    """
    import time
    cfg = {
        "tenant_id": (credentials.get("tenant_id") if credentials else None) or POWERBI_TENANT_ID,
        "client_id": (credentials.get("client_id") if credentials else None) or POWERBI_CLIENT_ID,
        "client_secret": (credentials.get("client_secret") if credentials else None) or POWERBI_CLIENT_SECRET,
        "workspace_id": (credentials.get("workspace_id") if credentials else None) or POWERBI_WORKSPACE_ID,
        "report_id": (credentials.get("report_id") if credentials else None) or POWERBI_REPORT_ID,
    }

    diagnostics = {
        "success": False,
        "step_failed": None,
        "latency_ms": 0,
        "steps": {
            "azure_ad_auth": {"status": "pending", "message": "Awaiting execution"},
            "workspace_access": {"status": "pending", "message": "Awaiting execution"},
            "embed_token_generation": {"status": "pending", "message": "Awaiting execution"},
        },
        "config_summary": {
            "tenant_id_provided": bool(cfg["tenant_id"]),
            "client_id_provided": bool(cfg["client_id"]),
            "client_secret_provided": bool(cfg["client_secret"]),
            "workspace_id_provided": bool(cfg["workspace_id"]),
            "report_id_provided": bool(cfg["report_id"]),
        }
    }

    start_time = time.time()

    # Pre-check required parameters
    missing = [k for k, v in cfg.items() if not v]
    if missing:
        diagnostics["step_failed"] = "configuration_validation"
        diagnostics["error_detail"] = f"Missing required parameter(s): {', '.join(missing)}"
        diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        return diagnostics

    # Step 1: Azure AD OAuth2 Token Acquisition
    token_url = f"{MS_LOGIN_AUTHORITY}/{cfg['tenant_id']}/oauth2/v2.0/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "scope": f"{POWERBI_API_RESOURCE}/.default"
    }

    access_token = None
    try:
        t0 = time.time()
        auth_resp = requests.post(token_url, data=payload, timeout=12)
        auth_ms = round((time.time() - t0) * 1000, 2)

        if auth_resp.status_code == 200:
            token_data = auth_resp.json()
            access_token = token_data.get("access_token")
            diagnostics["steps"]["azure_ad_auth"] = {
                "status": "passed",
                "http_status": 200,
                "latency_ms": auth_ms,
                "message": "Microsoft Entra ID OAuth2 token acquired successfully."
            }
        else:
            err_data = {}
            try:
                err_data = auth_resp.json()
            except Exception:
                pass
            err_msg = err_data.get("error_description", auth_resp.text[:200])
            diagnostics["step_failed"] = "azure_ad_auth"
            diagnostics["steps"]["azure_ad_auth"] = {
                "status": "failed",
                "http_status": auth_resp.status_code,
                "latency_ms": auth_ms,
                "message": f"Authentication failed: {err_msg}"
            }
            diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
            return diagnostics
    except Exception as e:
        diagnostics["step_failed"] = "azure_ad_auth"
        diagnostics["steps"]["azure_ad_auth"] = {
            "status": "failed",
            "message": f"Network exception contacting Microsoft Entra ID: {type(e).__name__} ({str(e)})"
        }
        diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        return diagnostics

    # Step 2: Power BI REST API Report Metadata & Workspace Access
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    report_url = f"{POWERBI_REST_BASE}/groups/{cfg['workspace_id']}/reports/{cfg['report_id']}"
    dataset_id = None
    embed_url = None

    try:
        t0 = time.time()
        r_resp = requests.get(report_url, headers=headers, timeout=12)
        r_ms = round((time.time() - t0) * 1000, 2)

        if r_resp.status_code == 200:
            r_data = r_resp.json()
            embed_url = r_data.get("embedUrl")
            dataset_id = r_data.get("datasetId")
            diagnostics["steps"]["workspace_access"] = {
                "status": "passed",
                "http_status": 200,
                "latency_ms": r_ms,
                "report_name": r_data.get("name"),
                "dataset_id": dataset_id,
                "message": "Workspace and report verified in Power BI Service."
            }
        else:
            diagnostics["step_failed"] = "workspace_access"
            diagnostics["steps"]["workspace_access"] = {
                "status": "failed",
                "http_status": r_resp.status_code,
                "latency_ms": r_ms,
                "message": f"Unable to access report in workspace (HTTP {r_resp.status_code}). Verify Service Principal is added as Member/Admin to the workspace."
            }
            diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
            return diagnostics
    except Exception as e:
        diagnostics["step_failed"] = "workspace_access"
        diagnostics["steps"]["workspace_access"] = {
            "status": "failed",
            "message": f"Network exception contacting Power BI REST API: {type(e).__name__}"
        }
        diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
        return diagnostics

    # Step 3: Power BI REST API Embed Token Generation
    token_url = f"{POWERBI_REST_BASE}/groups/{cfg['workspace_id']}/reports/{cfg['report_id']}/GenerateToken"
    token_payload = {
        "accessLevel": "View",
        "allowSaveAs": False,
        "datasetId": dataset_id
    }

    try:
        t0 = time.time()
        t_resp = requests.post(token_url, headers=headers, json=token_payload, timeout=12)
        t_ms = round((time.time() - t0) * 1000, 2)

        if t_resp.status_code == 200:
            t_data = t_resp.json()
            diagnostics["steps"]["embed_token_generation"] = {
                "status": "passed",
                "http_status": 200,
                "latency_ms": t_ms,
                "expiration": t_data.get("expiration"),
                "token_id": t_data.get("tokenId"),
                "message": "Power BI Embed Token generated successfully."
            }
            diagnostics["success"] = True
            diagnostics["embed_url"] = embed_url
        else:
            diagnostics["step_failed"] = "embed_token_generation"
            diagnostics["steps"]["embed_token_generation"] = {
                "status": "failed",
                "http_status": t_resp.status_code,
                "latency_ms": t_ms,
                "message": f"GenerateToken failed (HTTP {t_resp.status_code}). Ensure workspace is backed by Fabric/Embedded capacity or tenant allows token generation."
            }
    except Exception as e:
        diagnostics["step_failed"] = "embed_token_generation"
        diagnostics["steps"]["embed_token_generation"] = {
            "status": "failed",
            "message": f"Network exception generating embed token: {type(e).__name__}"
        }

    diagnostics["latency_ms"] = round((time.time() - start_time) * 1000, 2)
    return diagnostics


def validate_powerbi_config() -> Dict[str, Any]:
    """
    Validates Microsoft Entra and Power BI credentials and configuration.
    Never exposes client secrets or tokens in output.
    """
    missing_fields = []
    if not POWERBI_TENANT_ID:
        missing_fields.append("POWERBI_TENANT_ID")
    if not POWERBI_CLIENT_ID:
        missing_fields.append("POWERBI_CLIENT_ID")
    if not POWERBI_CLIENT_SECRET:
        missing_fields.append("POWERBI_CLIENT_SECRET")
    if not POWERBI_WORKSPACE_ID:
        missing_fields.append("POWERBI_WORKSPACE_ID")
    if not POWERBI_REPORT_ID:
        missing_fields.append("POWERBI_REPORT_ID")

    is_configured = len(missing_fields) == 0

    return {
        "is_configured": is_configured,
        "missing_fields": missing_fields,
        "embed_type": POWERBI_EMBED_TYPE,
        "has_tenant_id": bool(POWERBI_TENANT_ID),
        "has_client_id": bool(POWERBI_CLIENT_ID),
        "has_client_secret": bool(POWERBI_CLIENT_SECRET),
        "has_workspace_id": bool(POWERBI_WORKSPACE_ID),
        "has_report_id": bool(POWERBI_REPORT_ID),
        "has_web_url": bool(POWERBI_REPORT_WEB_URL)
    }


def get_azure_ad_token() -> Optional[str]:
    """
    Acquires OAuth2 client credentials token from Microsoft Entra ID.
    """
    if not (POWERBI_TENANT_ID and POWERBI_CLIENT_ID and POWERBI_CLIENT_SECRET):
        logger.warning("Microsoft Entra credentials incomplete. Cannot request OAuth token.")
        return None

    token_url = f"{MS_LOGIN_AUTHORITY}/{POWERBI_TENANT_ID}/oauth2/v2.0/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": POWERBI_CLIENT_ID,
        "client_secret": POWERBI_CLIENT_SECRET,
        "scope": f"{POWERBI_API_RESOURCE}/.default"
    }

    try:
        response = requests.post(token_url, data=payload, timeout=10)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            logger.error(f"Entra ID token acquisition failed: HTTP {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error connecting to Entra ID authority: {type(e).__name__}")
        return None


def get_powerbi_embed_config() -> Dict[str, Any]:
    """
    Retrieves genuine Power BI embedding parameters or structured fallback information.
    Response schema guarantees safe information disclosure (no secrets/passwords).
    """
    config_status = validate_powerbi_config()

    report_metadata = {
        "report_name": "MassMutual Corporate Travel Analytics",
        "governed_source": "public.vw_travel",
        "required_pages": [
            "Executive Spend Overview",
            "Travel & Route Analytics",
            "Business Group Analytics",
            "Policy Compliance & Governance",
            "FX & Financial Audit"
        ],
        "kpi_measures": [
            "Trips by Month",
            "Trips by Business Group",
            "Trips by Travel Summary",
            "Total Distinct Trips",
            "Total Ticket Legs",
            "Total Completed Spend INR"
        ]
    }

    # If full Service Principal configuration is present, attempt live token generation
    if config_status["is_configured"]:
        aad_token = get_azure_ad_token()
        if aad_token:
            headers = {
                "Authorization": f"Bearer {aad_token}",
                "Content-Type": "application/json"
            }
            # 1. Fetch Report Metadata from REST API
            report_url = f"{POWERBI_REST_BASE}/groups/{POWERBI_WORKSPACE_ID}/reports/{POWERBI_REPORT_ID}"
            try:
                r_resp = requests.get(report_url, headers=headers, timeout=10)
                if r_resp.status_code == 200:
                    r_data = r_resp.json()
                    embed_url = r_data.get("embedUrl")
                    dataset_id = r_data.get("datasetId")

                    # 2. Generate Embed Token
                    token_url = f"{POWERBI_REST_BASE}/groups/{POWERBI_WORKSPACE_ID}/reports/{POWERBI_REPORT_ID}/GenerateToken"
                    token_payload = {
                        "accessLevel": "View",
                        "allowSaveAs": False,
                        "datasetId": dataset_id
                    }
                    t_resp = requests.post(token_url, headers=headers, json=token_payload, timeout=10)
                    if t_resp.status_code == 200:
                        t_data = t_resp.json()
                        return {
                            "status": "ready",
                            "embed_mode": "app_owns_data",
                            "report_id": POWERBI_REPORT_ID,
                            "workspace_id": POWERBI_WORKSPACE_ID,
                            "embed_url": embed_url,
                            "embed_token": t_data.get("token"),
                            "token_id": t_data.get("tokenId"),
                            "expiration": t_data.get("expiration"),
                            "report_metadata": report_metadata,
                            "web_report_url": POWERBI_REPORT_WEB_URL or f"https://app.powerbi.com/groups/{POWERBI_WORKSPACE_ID}/reports/{POWERBI_REPORT_ID}",
                            "message": "Power BI embedding token generated successfully."
                        }
                    else:
                        logger.warning(f"Power BI REST GenerateToken returned HTTP {t_resp.status_code}")
                else:
                    logger.warning(f"Power BI REST GetReport returned HTTP {r_resp.status_code}")
            except Exception as e:
                logger.error(f"Error calling Power BI REST API: {type(e).__name__}")

    # Fallback response when Microsoft tenant/capacity/credentials are pending
    web_report_url = POWERBI_REPORT_WEB_URL
    if not web_report_url and POWERBI_WORKSPACE_ID and POWERBI_REPORT_ID:
        web_report_url = f"https://app.powerbi.com/groups/{POWERBI_WORKSPACE_ID}/reports/{POWERBI_REPORT_ID}"

    return {
        "status": "fallback_ready" if (web_report_url or config_status["is_configured"]) else "unconfigured",
        "embed_mode": "direct_or_desktop",
        "report_id": POWERBI_REPORT_ID or None,
        "workspace_id": POWERBI_WORKSPACE_ID or None,
        "embed_url": None,
        "embed_token": None,
        "expiration": None,
        "web_report_url": web_report_url or None,
        "desktop_file": "Corporate_Travel_Analytics.pbix",
        "pbip_path": "powerbi/Corporate_Travel_Analytics.pbip",
        "report_metadata": report_metadata,
        "missing_fields": config_status["missing_fields"],
        "message": (
            "Power BI report is accessible via 1-Click Launch or Power BI Desktop. "
            "To enable in-app embedded canvas, configure Microsoft Entra Service Principal credentials in .env."
        )
    }
