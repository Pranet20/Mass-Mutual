# Cost Control and Abuse Prevention Audit

## 1. Denial of Service & Abuse Protections

- **Login Brute-Force Rate Limiting**: Sliding-window rate limiter restricts IP addresses to 15 login attempts per 60-second window, mitigating credential stuffing.
- **File Upload Restrictions**: Ingestion endpoint validates MIME type and limits CSV payload size to 10 MB maximum, preventing disk or memory exhaustion.
- **Unbounded Query Prevention**: API endpoints enforce strict pagination (`limit=50`, `offset=0`) and parameterized aggregations.
- **Client Crash Loop Protection**: Error Boundary throttles automated crash reports to avoid inundating the server during render loops.

---

## 2. Cloud Cost Governance
- Containerized application deployed on Render free/standard tier with minimal memory footprint (~180 MB backend, ~40 MB database).
- Static frontend assets bundled and cached via immutable cache headers (`Cache-Control: public, max-age=31536000, immutable`).
