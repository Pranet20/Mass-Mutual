# Operations: Incident Response Guide

## 1. Severity Classification

- **SEV-1 (Critical)**: Production application down, database unreachable, or data corruption in `fact_travel_tickets`. Target resolution: < 1 hour.
- **SEV-2 (High)**: Ingestion pipeline failure, Power BI token expiration, or authentication errors for multiple users. Target resolution: < 4 hours.
- **SEV-3 (Medium)**: Client-side crash on specific browser, export formatting anomaly, or minor telemetry disruption. Target resolution: < 24 hours.

---

## 2. Triage & Incident Resolution Workflow

1. **Detection & Alert**:
   - Check `/health` and `/api/metrics` for elevated 5xx error rates (> 5%).
   - Inspect `/api/analytics/crashes` for unhandled UI Error Boundary incidents.
2. **Log Correlation**:
   - Trace affected request using the unique `X-Request-ID` from client error reports.
3. **Database Recovery**:
   - If database connection pool is exhausted, recycle pool via backend restart.
   - If corrupted records are detected, inspect `quarantined_records` table.
4. **Post-Mortem**:
   - Log root cause, affected records, resolution steps, and regression test additions.
