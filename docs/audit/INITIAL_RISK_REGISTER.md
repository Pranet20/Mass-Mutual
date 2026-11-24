# Initial Risk Register & Mitigation Strategy

## 1. Risk Matrix

| Risk ID | Category | Risk Description | Inherent Severity | Mitigation Implemented | Residual Severity | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | Security | Unconfigured JWT secret key in cloud environments. | **Critical (P0)** | Configured default secret in Dockerfile; enforced 100k iteration PBKDF2 password hashing. | Low | `backend/services/auth.py`, Check 01 in `verify_production_readiness.py`. |
| **RSK-02** | Data Integrity | Accidentally using SQLite in production instead of PostgreSQL. | **High (P0)** | Automated `load_to_postgres.py` and PostgreSQL connection checks in Docker entrypoint. | Low | Database health check 02/20 passes. |
| **RSK-03** | Compliance | Spilling or overflow on printed audit reports creating uncertified pages. | **High (P1)** | Adjusted `.report-page` CSS to `box-sizing: border-box`, reduced table padding, compacted attestation box. | Low | Verified HTML generation in Pytest; tested across standard A4 boundaries. |
| **RSK-04** | Security | Brute force attacks against employee/manager login endpoints. | **Medium (P1)** | Implemented sliding-window in-memory IP rate limiter (15 attempts/minute). | Low | Rate limiter returns HTTP 429 upon threshold breach. |
| **RSK-05** | Reliability | Unhandled UI errors causing blank client screen during executive demo. | **High (P1)** | React `ErrorBoundary` wraps root component and reports crash to backend diagnostics. | Low | Tested with synthetic crash event; Incident ID generated. |
| **RSK-06** | Privacy | Inability for employees to delete accounts under GDPR. | **Medium (P2)** | Created self-service `DELETE /api/users/me` endpoint with PII anonymization. | Low | Tested via automated Python test; user removed, employee marked deactivated. |
| **RSK-07** | Operations | Inability to track server performance and client load. | **Medium (P2)** | Built APM request latency ring buffer and `GET /api/metrics` endpoint. | Low | Metrics endpoint live and reporting healthy latency. |
