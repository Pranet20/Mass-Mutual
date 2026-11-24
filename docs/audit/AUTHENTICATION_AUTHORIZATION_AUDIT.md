# Authentication and Authorization Security Audit

## 1. Authentication Architecture
The application implements modern, stateless JWT authentication backed by PBKDF2 password hashing.

### Password Security
- **Algorithm**: `hashlib.pbkdf2_hmac` using `sha256`.
- **Salt**: 16-byte cryptographically secure random hexadecimal salt (`os.urandom(16).hex()`).
- **Iterations**: 100,000 iterations.
- **Storage Format**: `{salt}${key_hex}` in `users.password_hash`. Plaintext passwords are never persisted or logged.

### Token Lifecycle & Validation
- **Token Format**: HMAC-SHA256 (HS256) signed JSON Web Tokens.
- **Claims**:
  - `sub`: User email address.
  - `role`: Role identifier (`manager`, `employee`, `admin`).
  - `employee_id`: Bound natural employee key.
  - `exp`: Expiration timestamp (default 12 hours from issuance).
- **Transport**:
  - Primary: Standard `Authorization: Bearer <token>` HTTP request header.
  - Secondary fallback: `?token=<token>` query parameter for direct browser PDF stream downloads where browser window headers cannot be injected.

---

## 2. Role-Based Access Control (RBAC) Enforcement
Access control is enforced strictly at the FastAPI route level using dependency injection (`require_role([...])`):

| Endpoint Group | Allowed Roles | Enforcement Mechanism | Failure Response |
| :--- | :--- | :--- | :--- |
| `/api/dashboard/stats` | `manager`, `admin`, `employee` (scoped) | Enforces employee data isolation; employees only see tickets matching their `employee_id`. | HTTP 401 / Filtered data |
| `/api/manager/*` | `manager`, `admin` | `Depends(require_role(["manager", "admin"]))` | HTTP 403 Forbidden |
| `/api/employees/*` | `manager`, `admin` | `Depends(require_role(["manager", "admin"]))` | HTTP 403 Forbidden |
| `/api/pipeline/*` | `manager`, `admin` | `Depends(require_role(["manager", "admin"]))` | HTTP 403 Forbidden |
| `/api/employee/me` | `employee`, `manager` | `Depends(get_current_user)` | HTTP 401 Unauthorized |
| `/api/users/me` (DELETE) | Authenticated user | Password re-authentication required | HTTP 400 Incorrect Password |

---

## 3. Negative Security Test Evidence

1. **Unauthenticated Access**:
   - Request to `/api/employees` without Bearer token -> Returns `HTTP 401 Unauthorized` (`detail: Authorization credential required`).
2. **Employee Role Privilege Escalation**:
   - Employee token accessing `/api/manager/approvals` -> Returns `HTTP 403 Forbidden` (`detail: Access denied. Allowed roles: manager, admin. Your role: employee`).
3. **Expired Token**:
   - Token with expired `exp` claim -> Returns `HTTP 401 Unauthorized` (`detail: Token has expired. Please log in again.`).
4. **Tampered Token**:
   - Token signature altered -> Returns `HTTP 401 Unauthorized` (`detail: Invalid authorization token.`).
5. **Brute Force Protection**:
   - Consecutive rapid login attempts -> Exceeds 15 attempts/minute window -> Returns `HTTP 429 Too Many Requests`.
