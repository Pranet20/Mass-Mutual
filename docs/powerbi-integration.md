# Microsoft Power BI Embedded Integration Guide

## 1. Executive Summary & Architecture Overview

The MassMutual PS-04 Corporate Travel Analytics platform integrates Microsoft Power BI reports directly into the web application (React + Vite) with backend support from FastAPI and the PostgreSQL warehouse view (`public.vw_travel`).

### End-to-End Architectural Flow

```
[ PostgreSQL Warehouse / vw_travel ]
                 │
                 ▼
  [ Microsoft Power BI Desktop / Service ]
  - PBIP: powerbi/Corporate_Travel_Analytics.pbip
  - PBIX: powerbi/Corporate_Travel_Analytics.pbix
  - Semantic Model: DirectQuery / Scheduled Import from vw_travel
                 │
                 ▼
  [ Microsoft Entra ID (Azure AD) + Power BI Service REST API ]
  - App Registration (Service Principal)
  - Power BI Workspace (Admin / Member permissions)
  - GenerateToken / GetReport REST APIs
                 │
                 ▼
  [ FastAPI Backend Service ]
  - backend/services/powerbi_service.py
  - GET /api/powerbi/embed-config (JWT Authenticated, RBAC enforced)
  - Sanitized response (No client secrets exposed)
                 │
                 ▼
  [ React Frontend Application ]
  - official powerbi-client & powerbi-client-react
  - frontend/src/components/PowerBIReportEmbed.jsx
  - 1-Click Launch Hub (Open Power BI Analytics button)
  - Embedded iFrame / Interactive Fallback / Desktop launch
```

---

## 2. Embedding Model Decision: Option B vs. Option A

| Dimension | Option A: User Owns Data (Embed for your organization) | Option B: App Owns Data (Embed for your customers) - **SELECTED** |
| :--- | :--- | :--- |
| **Authentication Flow** | Interactive popup redirecting every individual user to Microsoft 365 login. | Silent background server-to-server OAuth client credentials flow via Azure AD. |
| **End-User Licensing** | Every corporate portal user requires a Power BI Pro or PPU license. | End users do NOT require individual Power BI licenses; governed by App/Capacity token. |
| **UX & Single Sign-On** | Disruptive login modals, multi-factor prompts inside embedded frames. | Seamless, 1-click zero-friction embedded analytical dashboard within portal. |
| **Security Control** | Client browser talks directly to Entra ID with delegation tokens. | Centralized backend service controls token minting, row-level security, and audit. |

**Rationale**: For the MassMutual PS-04 Corporate Travel Analytics portal, **Option B (App Owns Data)** was chosen as primary to provide immediate, friction-free analytical access across executive, manager, and auditor roles while preventing per-seat licensing blockers.

---

## 3. Microsoft Entra ID & Power BI Service Setup

To connect to a live Power BI Service tenant:

### Step 1: Azure App Registration (Service Principal)
1. Go to **Azure Portal** (`portal.azure.com`) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name: `MassMutual-PowerBI-Embedded`.
3. Account types: *Accounts in this organizational directory only*.
4. Note the **Application (client) ID** and **Directory (tenant) ID**.
5. Navigate to **Certificates & secrets** → **New client secret** → Save value securely.

### Step 2: Power BI Admin Portal Permissions
1. Sign in to **Power BI Admin Portal** (`app.powerbi.com/admin-portal`).
2. Navigate to **Tenant settings** → **Developer settings**:
   - Enable *Service principals can use Fabric APIs* / *Embed content in apps*.
   - Target a specific security group containing your registered Service Principal.

### Step 3: Power BI Workspace Assignment
1. Open your target Power BI Workspace.
2. Click **Manage access** → **Add people or groups**.
3. Add the Service Principal name/App ID as **Admin** or **Member**.
4. Publish `powerbi/Corporate_Travel_Analytics.pbix` to this workspace.
5. Copy the **Workspace ID** (Group GUID) and **Report ID** (Report GUID) from the browser URL.

### Step 4: Configure Backend Environment Variables
In `.env` or system environment:
```ini
POWERBI_EMBED_TYPE=app_owns_data
POWERBI_TENANT_ID=00000000-0000-0000-0000-000000000000
POWERBI_CLIENT_ID=00000000-0000-0000-0000-000000000000
POWERBI_CLIENT_SECRET=your-entra-app-client-secret-here
POWERBI_WORKSPACE_ID=00000000-0000-0000-0000-000000000000
POWERBI_REPORT_ID=00000000-0000-0000-0000-000000000000
POWERBI_REPORT_WEB_URL=https://app.powerbi.com/groups/.../reports/...
```

---

## 4. API Endpoints and Security Safeguards

### `GET /api/powerbi/embed-config`
- **Authentication**: Requires valid JWT Bearer token or authenticated session.
- **Role Verification**: Verified against user session.
- **Response Payload**:
  ```json
  {
    "status": "ready",
    "embed_type": "app_owns_data",
    "report_id": "...",
    "embed_url": "https://app.powerbi.com/reportEmbed?reportId=...",
    "embed_token": "H4sIAAAAAAAE...",
    "token_expiration": "2026-10-12T15:30:00Z",
    "web_report_url": "https://app.powerbi.com/...",
    "desktop_file": "powerbi/Corporate_Travel_Analytics.pbix",
    "report_metadata": {
      "name": "Corporate_Travel_Analytics",
      "pages_count": 5,
      "dataset_source": "public.vw_travel"
    }
  }
  ```
- **Security Guarantees**:
  - `POWERBI_CLIENT_SECRET` is NEVER returned to the client or logged.
  - Short-lived embed tokens (typically 60 minutes) generated on demand.
  - Graceful fallback: If tenant credentials are not configured, returns `status: "fallback_ready"` with clear setup guidance and 1-click Desktop/Web launch options.

---

## 5. Frontend Embedding Implementation

The frontend leverages the official Microsoft libraries:
- `powerbi-client`: Core embedding engine.
- `powerbi-client-react`: Official React lifecycle wrapper (`<PowerBIEmbed />`).

Component path: `frontend/src/components/PowerBIReportEmbed.jsx`

### Key Features:
1. **1-Click Launch Bar**: Immediate access via **"Open Power BI Analytics"** button located in the main portal header and on the Power BI tab.
2. **Dual Mode Resilience**:
   - *Live Mode*: Direct iFrame embedding with page navigation, filter sync, and visual interactions.
   - *Fallback Mode*: Comprehensive 1-click launch card with direct link to Power BI Desktop file, Web report URL, and complete interactive Recharts mirrors for all 5 report pages.
3. **Event Hooks**:
   - `loaded`: Logs diagnostic metadata.
   - `rendered`: Removes loading spinner smoothly.
   - `error`: Catches authentication/licensing errors and surfaces structured troubleshooting tips.

---

## 6. Report Content & Governing Contract Verification

The embedded report mirrors `powerbi/Corporate_Travel_Analytics.pbix` and `Corporate_Travel_Analytics.pbip`, directly sourcing from `public.vw_travel`:

1. **Page 1: Executive Spend Overview**
   - KPI cards: Total Travel Spend (INR), Total Trips, Total Leg Count, Average Ticket Cost.
   - Core visual: `chartTripsByMonth` (`DISTINCTCOUNT(vw_travel[trip_id])` by `travel_date`).
   - Slicers: Fiscal Year, Quarter, Travel Classification.
2. **Page 2: Travel & Route Analytics**
   - Core visual: `chartTripsByTravelSummary` (`DISTINCTCOUNT(vw_travel[trip_id])` by `travel_summary`).
   - Slicers: Booking Channel, Cabin Class, Booking Lead Category.
3. **Page 3: Business Group Analytics**
   - Core visual: `chartTripsByBusinessGroup` (`DISTINCTCOUNT(vw_travel[trip_id])` by `business_group`).
   - Department spend distribution and cost center breakdowns.
4. **Page 4: Policy Compliance & Governance**
   - Compliance rate gauge, Advance Booking violation matrix, Flagged exceptions.
5. **Page 5: FX & Financial Audit**
   - Multi-currency breakdown (USD, EUR, GBP, SGD, AED, INR), Exchange rate variances.

---

## 7. Troubleshooting & Common Pitfalls

| Symptom | Root Cause | Resolution |
| :--- | :--- | :--- |
| `status: "fallback_ready"` | Missing Azure AD environment variables in `.env`. | Provide `POWERBI_CLIENT_ID`, `POWERBI_CLIENT_SECRET`, and `POWERBI_TENANT_ID`. |
| `AADSTS700016: Application not found` | Invalid Client ID or Tenant ID. | Double-check Azure App Registration GUIDs in Azure Portal. |
| `PowerBINotAuthorizedException (403)` | Service Principal is not added to workspace or Tenant setting is disabled. | Add Service Principal as Admin/Member in Power BI workspace and enable developer embedding in Admin portal. |
| Missing `business_group` error | Database view schema out of date. | Ensure `public.vw_travel` has all 37 columns created via migrations/bootstrap script. |
