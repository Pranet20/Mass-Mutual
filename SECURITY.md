# MassMutual Corporate Travel Analytics — Security & Governance Architecture (PS-04)

This document details the security posture, authentication protocols, Role-Based Access Control (RBAC), and audit governance enforced across the platform.

---

## 1. Authentication Architecture

- **Password Storage**: Passwords are never stored in plaintext. They are hashed using **PBKDF2-HMAC-SHA256** with $100,000$ iterations and a cryptographically secure, random 16-byte hex salt per user.
- **Token Mechanism**: JSON Web Tokens (JWT) signed via **HMAC-SHA256 (HS256)**.
- **Key Enforcement**: The JWT secret is loaded from the environment variable `JWT_SECRET_KEY` or `SECRET_KEY`. In production mode (`ENV=production`), the application refuses to start if unconfigured or default secrets are detected.
- **Token Expiry**: Default session window is 12 hours (`ACCESS_TOKEN_EXPIRE_HOURS=12`).
- **Flexible Token Delivery**:
  - `Authorization: Bearer <token>` HTTP header (standard Axios and API calls).
  - `?token=<token>` Query parameter (supports Power BI Desktop Web connector and direct browser downloads).

---

## 2. Role-Based Access Control (RBAC)

The system enforces three distinct enterprise roles:

| Role | Permissions & Scopes |
| :--- | :--- |
| **Manager** | View full corporate analytics; approve or reject employee claims; apply analyst exemptions / manual overrides; download executive audit packages; access Power BI data feeds. |
| **Admin** | Full system administration; trigger pipeline runs; configure reference data; manage user accounts. |
| **Employee** | Self-service travel ledger; submit new flight claims; view own profile and historical bookings; register operational complaints. Restriced from manager approvals and pipeline overrides. |

Role enforcement is handled via FastAPI dependency injection:
```python
current_user: User = Depends(require_role(["manager", "admin"]))
```

---

## 3. Defense-in-Depth & Anti-Abuse Measures

### 3.1 Rate Limiting
A sliding-window in-memory rate limiter protects authentication endpoints (`/api/auth/login`). Clients exceeding 15 attempts within 60 seconds are blocked with HTTP `429 Too Many Requests`.

### 3.2 Audit Identity Derivation
Actor identities in audit tables (`manual_override_audits`, `manual_overrides`, batch triggers) are derived strictly from verified JWT token claims (`current_user.email`). The application never relies on untrusted user-supplied request body parameters for actor identity.

### 3.3 Concurrency Control
ETL batch runs are guarded by a non-blocking reentrant lock (`_PIPELINE_EXECUTION_LOCK`). Any simultaneous trigger returns immediate HTTP 409 / `CONCURRENCY_LOCKED` to eliminate race conditions.

---

## 4. Power BI Desktop Endpoint Protection

Power BI endpoints are protected by token authentication while maintaining full compatibility with Power BI Desktop:

| Endpoint | Method | Security Level | Accepted Auth Format |
| :--- | :--- | :--- | :--- |
| `/api/powerbi/feed` | GET | Protected (JWT) | `Bearer <token>` or `?token=<token>` |
| `/api/powerbi/analytics` | GET | Protected (JWT) | `Bearer <token>` or `?token=<token>` |
| `/api/powerbi/pbix` | GET | Protected (JWT) | `Bearer <token>` or `?token=<token>` |
| `/api/powerbi/pbit` | GET | Protected (JWT) | `Bearer <token>` or `?token=<token>` |
