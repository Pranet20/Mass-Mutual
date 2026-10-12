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
