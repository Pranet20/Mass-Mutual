# CHANGELOG: AUDIT FIXES & PRODUCTION HARDENING
**Project**: Corporate Travel Analytics — MassMutual PS-04  
**Date**: November 25, 2026  
**Auditor**: Senior Software Architect & Lead Security/Data Engineer  

---

## [Version 2.1.0] - 2026-11-25: Audit Hardening & Production Enhancements

### 1. Schema & Data Warehouse Reconciliation
- **Reconciled `vw_travel` Schema to 37 Columns**:
  - Identified schema drift where `business_group` was omitted from data dictionaries.
  - Updated `backend/services/data_dictionary.py` to include `business_group` (VARCHAR(100)) and updated column count to 37.
  - Synchronized `backend/services/export.py` across all CSV, Excel, and PDF export logic.
  - Updated `DATA_DICTIONARY.md` with complete 37-column specifications.
  - Added Pytest assertion `test_36_business_group_in_vw_travel_and_fact` and `test_38_powerbi_source_contract_vw_travel_schema`.

### 2. Implementation of 7 Production Features
1. **User Behavior & Telemetry Analytics**:
   - Added `UserAnalyticsEvent` database table in `backend/database/models.py`.
   - Created `backend/services/telemetry.py` with batch recording and summary statistics.
   - Added endpoints `POST /api/analytics/track`, `POST /api/analytics/batch`, `GET /api/analytics/summary`.
   - Built client-side telemetry tracker `frontend/src/utils/analytics.js`.
2. **Crash Reporting & Error Diagnostics**:
   - Added `AppCrashLog` database model for capturing unhandled runtime crashes.
   - Built `frontend/src/components/ErrorBoundary.jsx` capturing React component stacks and auto-submitting diagnostics to `POST /api/analytics/crash-report`.
   - Added administrative triage endpoint `GET /api/analytics/crashes`.
3. **Privacy Policy & Corporate Data Governance**:
   - Implemented `GET /api/legal/privacy-policy` endpoint.
   - Built `frontend/src/components/PrivacyPolicyModal.jsx` displaying categorized corporate data usage, retention policies, and GDPR traveler rights.
4. **Shimmer Loading States**:
   - Created `frontend/src/components/LoadingSkeleton.jsx` with card, table, chart, and page shimmer skeletons.
   - Integrated into `Dashboard.jsx`, `Pipeline.jsx`, `Employees.jsx`, and `PowerBI.jsx`.
5. **Actionable Error States**:
   - Built `frontend/src/components/ErrorAlert.jsx` featuring error category icons, diagnostic correlation IDs, and retry callback buttons (`onRetry`).
6. **Self-Service Account Deletion**:
   - Implemented `delete_user_account(email, password)` in `backend/services/auth.py`.
   - Added `DELETE /api/users/me` endpoint with cryptographic password re-verification and traveler PII anonymization.
   - Created `frontend/src/components/AccountDeletionModal.jsx`.
7. **APM Request Latency & Health Probes**:
   - Added global request timing middleware in `backend/main.py` injecting `X-Response-Time` and `X-Request-ID`.
   - Created rolling latency ring buffer in `backend/services/telemetry.py`.
   - Added `GET /api/metrics` exposing total requests, status code distributions, and p50/p95/p99 latencies.
   - Enhanced `GET /health` with database pool liveness check.

### 3. Power BI Embedding & UI Integration
- **Direct Power BI Component Integration**:
  - Imported `PowerBIReportEmbed.jsx` into `frontend/src/pages/PowerBI.jsx`.
  - Added a top-level mode switcher:
    - *Interactive Analytical Suite (Native Recharts canvas with direct `vw_travel` feed)*
    - *Power BI Embedded Service (official `powerbi-client-react` component)*
  - Added full Azure Entra ID credential setup modal, report config form, and simulated fallback mode.
  - Linked `Download .pbix` action to `/api/powerbi/pbix`.

### 4. Comprehensive Audit & Documentation Deliverables
- Authored root documentation suite:
  - `COMPLETE_AUDIT_REPORT.md`
  - `DEFECT_REGISTER.md`
  - `REQUIREMENTS_TRACEABILITY.md`
  - `KPI_RECONCILIATION.md`
  - `DATA_DICTIONARY.md`
  - `TESTING_REPORT.md`
  - `SECURITY_REVIEW.md`
  - `POWERBI_STATUS.md`
  - `PRODUCTION_READINESS.md`
  - `CHANGELOG_AUDIT_FIXES.md`
  - `README.md` (updated)

### 5. Automated Verification & Quality Assurance
- Automated Pytest Suite: **61 / 61 tests passing** in 44.62s.
- Production Readiness Runner: **20 / 20 checks passing** in 12.30s.
- Frontend Build: Vite 6 compiled **2,278 modules in 44.24s with 0 errors**.
- Zero Financial Variance: Verified exact ₹0.00 spend variance between fact table and `vw_travel`.
