# Dependency and Supply-Chain Security Audit

## 1. Python Dependency Audit
Dependencies managed via `requirements.txt`:
- `fastapi==0.115.0`: Core async web framework.
- `uvicorn[standard]==0.31.0`: High-performance ASGI server.
- `sqlalchemy==2.0.35`: Relational ORM with parameterized queries.
- `pydantic==2.9.2`: Schema validation engine.
- `pyjwt==2.9.0`: Cryptographic token issuance.
- `psycopg2-binary==2.9.9`: PostgreSQL engine driver.
- `alembic==1.13.3`: Migration engine.
- `reportlab==4.2.5`: PDF generation engine.
- `pytest==8.3.3`: Automated test runner.

**Supply Chain Status**: No critical CVEs reported across core production packages.

---

## 2. Frontend NPM Dependency Audit
Dependencies managed via `frontend/package.json`:
- `react@18.3.1`, `react-dom@18.3.1`: UI component engine.
- `vite@6.4.3`: Next-generation frontend bundler.
- `powerbi-client@2.23.1`, `powerbi-client-react@3.0.4`: Official Microsoft Power BI embedding SDK.
- `tailwindcss@3.4.14`: Utility-first CSS framework.
- `lucide-react@0.453.0`: Accessible SVG iconography.
- `axios@1.7.7`: HTTP client with request interceptors.
- `recharts@2.13.0`: Client-side visual charting engine.

---

## 3. Secret Leakage Audit
- Git commit history scanned for accidental API keys, private certificates, or cleartext passwords.
- No production secrets or personal access tokens are committed in repository files.
