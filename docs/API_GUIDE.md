# Corporate Travel Analytics: API Guide

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Payload**: `{"email": "manager@travelintelligence.com", "password": "..."}`
- **Response**: `{"access_token": "...", "token_type": "bearer", "role": "manager", "email": "..."}`

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Current authenticated user profile with role and employee ID.

### `DELETE /api/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Payload**: `{"password": "..."}`
- **Response**: Account deletion and employee PII anonymization confirmation.

---

## 2. Analytics & Reporting Endpoints

### `GET /api/dashboard/stats`
- **Query Params**: `quarter` (`Q1`, `Q2`, `Q3`, `Q4`, `ALL`), `business_unit`
- **Response**: Aggregated KPI numbers, monthly spend trend, divisional distribution, route volume ranking.

### `GET /api/forecasting`
- **Response**: Historical actuals, 4-quarter ARIMA/EWMA projection, sensitivity bounds.

### `GET /api/reports/audit-package-html`
- **Response**: Formatted 7-page executive audit package HTML with cryptographic batch log and tri-party sign-off.

### `GET /api/powerbi/embed-config`
- **Response**: Microsoft Power BI embed configuration metadata.

---

## 3. Telemetry, APM & Compliance Endpoints

### `POST /api/analytics/track`
- **Payload**: `{"event_type": "action", "event_name": "button_click", "page_url": "/dashboard"}`
- **Response**: `{"success": true, "event_id": 1}`

### `POST /api/analytics/crash-report`
- **Payload**: `{"error_name": "Error", "error_message": "...", "stack_trace": "..."}`
- **Response**: `{"success": true, "crash_id": "CRASH-..."}`

### `GET /api/legal/privacy-policy`
- **Response**: Structured data protection and privacy policy contract.

### `GET /api/metrics`
- **Response**: System request throughput, status code counts, and latency percentiles.
