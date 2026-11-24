# Database and Data Integrity Audit

## 1. Database Architecture & Engine Configuration
The platform is engineered to run against **PostgreSQL** in production, with fallback compatibility for local developer SQLite testing.

- **Connection Pool**: `create_engine` configured with connection pool recycling (`pool_pre_ping=True`, `pool_recycle=3600`).
- **Financial Precision**: All monetary values use `Numeric(18, 2)` to eliminate IEEE 754 floating-point rounding errors. FX rates utilize `Numeric(18, 4)`.

---

## 2. Table Catalog & Constraint Audit

| Table Name | Grain / Purpose | Primary Key | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `staging_tickets` | Raw CSV staging audit trail | `staging_id` | Preserves verbatim vendor payload |
| `cleansed_tickets` | Cleaned and deduplicated tickets | `cleansed_id` | Index on `ticket_id`, duplicate flag |
| `quarantined_records` | Data quality error isolation | `id` | Categorized by error code |
| `employee_master` | SCD Type 2 employee demographics | `id` | Temporal index on `(employee_id, effective_start_date, effective_end_date)` |
| `country_reference` | Sovereign country and ISO codes | `country_name` | ISO alpha-2 reference |
| `fx_rates` | Treasury point-in-time conversion rates | `id` | Unique on `(currency, effective_date)` |
| `fact_travel_tickets` | Authoritative star schema fact table | `ticket_id` | Foreign keys to employee and country |
| `manual_overrides` | Analyst exemptions and overrides | `ticket_id` | 1:1 with fact ticket |
| `manual_override_audits` | Audit trail of all overrides | `audit_id` | Cryptographic change history |
| `pipeline_batch_audits` | Ingestion batch execution ledger | `batch_id` | Index on `source_file_hash` |
| `users` | Authenticated users & credentials | `id` | Unique index on `email` |
| `user_analytics_events` | APM and client telemetry events | `id` | Index on `event_type`, `created_at` |
| `app_crash_logs` | Unhandled client crash diagnostics | `id` | Unique index on `crash_id` |

---

## 3. Governed View Contract: `vw_travel`
The core reporting view `vw_travel` joins `fact_travel_tickets` with point-in-time `employee_master` records and `country_reference`, guaranteeing zero discrepancies between PostgreSQL storage and Power BI metrics.
