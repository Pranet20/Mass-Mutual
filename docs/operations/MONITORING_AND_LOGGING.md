# Operations: Monitoring, Logging & APM Telemetry

## 1. Structured Logging & APM Middleware

The application logs all operational events using Python's standard `logging` module and FastAPI request middleware:
- **Request ID Tracking**: Every HTTP request receives a unique `X-Request-ID` UUID passed in headers and error responses for end-to-end correlation.
- **Latency Monitoring**: Execution latency is measured on every request and recorded in the APM ring buffer.
- **Logging Sanitization**: Authorization headers, passwords, and JWT tokens are excluded from logs.

---

## 2. Monitoring Endpoints

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/health` | GET | Public | Uptime and service availability probe. |
| `/health/db` | GET | Public | Database connection ping (`SELECT 1`). |
| `/ready` | GET | Public | Readiness probe confirming record count in `fact_travel_tickets`. |
| `/api/metrics` | GET | Public / APM | Request counts, status code distribution (2xx, 4xx, 5xx), average and p95 latency. |
| `/api/analytics/summary` | GET | Manager / Admin | Aggregated client interaction, feature usage, and client-side load times. |
| `/api/analytics/crashes` | GET | Manager / Admin | Triage desk for unhandled client-side Error Boundary crash reports. |
