# Environment Variables Specification

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `ENV` | No | `development` | Environment mode (`development`, `staging`, `production`). |
| `DATABASE_URL` | No | `sqlite:///backend/database/travel_analytics.db` | PostgreSQL connection string in production (`postgresql://user:pass@host:5432/dbname`). |
| `JWT_SECRET_KEY` | Yes (in prod) | Configured in Dockerfile | Cryptographic secret for signing HS256 authentication tokens. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | No | `12` | JWT token validity duration in hours. |
| `ALLOWED_ORIGINS` | No | Localhost origins | Comma-separated CORS allowed origins. |
| `POWERBI_EMBED_TYPE` | No | `app_owns_data` | Embedding type (`app_owns_data` or `user_owns_data`). |
| `POWERBI_TENANT_ID` | Optional | `""` | Microsoft Entra ID Directory (tenant) ID. |
| `POWERBI_CLIENT_ID` | Optional | `""` | Microsoft Entra App registration Application (client) ID. |
| `POWERBI_CLIENT_SECRET` | Optional | `""` | Microsoft Entra App client secret value. |
| `POWERBI_WORKSPACE_ID` | Optional | `""` | Power BI Workspace (group) ID. |
| `POWERBI_REPORT_ID` | Optional | `""` | Power BI published Report ID. |
| `POWERBI_REPORT_WEB_URL` | Optional | `""` | Direct fallback web link to published Power BI Service report. |
