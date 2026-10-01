# MassMutual Corporate Travel Analytics — Data Dictionary (PS-04)

This data dictionary defines all governed entities, tables, views, columns, types, and business semantics in the MassMutual Corporate Travel Analytics Warehouse.

---

## 1. Governed Analytical View: `vw_travel`

The primary single source of analytical truth. Consumed identically by Power BI Desktop, React dashboards, executive audit packages, and analytics endpoints.

| Column | Data Type | Nullable | Source Field | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ticket_id` | `VARCHAR(50)` | No | `fact_travel_tickets.ticket_id` | Primary business key for the flight ticket (e.g. `TCK-8001`). |
| `trip_id` | `VARCHAR(50)` | No | `fact_travel_tickets.trip_id` | Grouping key for multi-leg or round-trip journeys (e.g. `TRP-101`). |
| `batch_id` | `VARCHAR(50)` | Yes | `fact_travel_tickets.batch_id` | ETL batch ingestion audit identifier. |
| `employee_id` | `VARCHAR(50)` | No | `fact_travel_tickets.employee_id` | Foreign key referencing `employee_master.employee_id`. |
| `employee_name` | `VARCHAR(100)` | Yes | `fact_travel_tickets.employee_name` | Full name of corporate traveler at the time of travel (SCD-2). |
| `business_unit` | `VARCHAR(100)` | Yes | `fact_travel_tickets.business_unit` | Corporate division/unit (e.g. `Global Technology`, `Finance & Actuarial`). |
| `business_group` | `VARCHAR(100)` | Yes | `fact_travel_tickets.business_group` | High-level organizational group hierarchy. |
| `department` | `VARCHAR(100)` | Yes | `fact_travel_tickets.department` | Functional department (e.g. `Data & AI`, `Internal Audit`). |
| `issue_date` | `VARCHAR(30)` | Yes | `fact_travel_tickets.issue_date` | ISO-8601 date ticket was purchased (`YYYY-MM-DD`). |
| `travel_date` | `VARCHAR(30)` | Yes | `fact_travel_tickets.travel_date` | Departure date used for SCD-2 temporal joins and chronological analysis. |
| `return_date` | `VARCHAR(30)` | Yes | `fact_travel_tickets.return_date` | Date of return leg (`YYYY-MM-DD`). |
| `origin_city` | `VARCHAR(100)` | Yes | `fact_travel_tickets.origin_city` | Departure city name. |
| `origin_country` | `VARCHAR(100)` | Yes | `fact_travel_tickets.origin_country` | Standardized origin country name. |
| `dest_city` | `VARCHAR(100)` | Yes | `fact_travel_tickets.dest_city` | Arrival city name. |
| `dest_country` | `VARCHAR(100)` | Yes | `fact_travel_tickets.dest_country` | Standardized destination country name. |
| `origin_iso` | `VARCHAR(10)` | Yes | `fact_travel_tickets.origin_iso` | ISO 3166-1 alpha-2 origin code (`IN`, `US`, `GB`). |
| `dest_iso` | `VARCHAR(10)` | Yes | `fact_travel_tickets.dest_iso` | ISO 3166-1 alpha-2 destination code (`US`, `DE`, `SG`). |
| `ticket_status` | `VARCHAR(50)` | Yes | `fact_travel_tickets.ticket_status` | Operational booking status (`ISSUED`, `CANCELLED`, `REFUNDED`, `EXCHANGED`). |
| `amount_original` | `NUMERIC(18,2)` | Yes | `fact_travel_tickets.amount_original` | Ticket fare in vendor source currency. |
| `currency` | `VARCHAR(10)` | Yes | `fact_travel_tickets.currency` | 3-letter ISO 4217 currency code (`INR`, `USD`, `GBP`, `EUR`, `SGD`, `CAD`). |
| `fx_rate` | `NUMERIC(18,4)` | Yes | `fact_travel_tickets.fx_rate` | Corporate conversion rate to INR effective on travel date. |
| `amount_inr` | `NUMERIC(18,2)` | Yes | `fact_travel_tickets.amount_inr` | Governed financial metric: Normalized spend in Indian Rupees (INR). |
| `fx_rate_date` | `VARCHAR(30)` | Yes | `fact_travel_tickets.fx_rate_date` | Effective date of applied treasury exchange rate. |
| `fx_source` | `VARCHAR(100)` | Yes | `fact_travel_tickets.fx_source` | Auditable lineage of FX rate (e.g. `Corporate Treasury Fixed 2026`). |
| `booking_channel` | `VARCHAR(50)` | Yes | `fact_travel_tickets.booking_channel` | Procured channel (`Amadeus GDS`, `Sabre GDS`, `Corporate Portal`, `Uber for Business`). |
| `cabin_class` | `VARCHAR(50)` | Yes | `fact_travel_tickets.cabin_class` | Travel cabin class (`Economy`, `Business`, `Premium Economy`). |
| `travelled_flag` | `VARCHAR(5)` | Yes | `fact_travel_tickets.travelled_flag` | Governed binary spend filter: `'Y'` (completed/flown) or `'N'` (cancelled/refunded). |
| `trip_classification`| `VARCHAR(50)` | Yes | `fact_travel_tickets.trip_classification`| Geographic classification: `'Domestic'`, `'Cross-Border'`, or `'Multi-Country'`. |
| `travel_summary` | `VARCHAR(100)` | Yes | `fact_travel_tickets.travel_summary` | High-level route label for executive dashboards (e.g. `IN to US Cross-Border`). |
| `policy_compliance_status` | `VARCHAR(50)` | Yes | `fact_travel_tickets.policy_compliance_status` | Compliance flag: `'COMPLIANT'`, `'NON_COMPLIANT_CABIN'`, or `'NON_COMPLIANT_FARE'`. |
| `policy_violation_reason` | `VARCHAR(200)` | Yes | `fact_travel_tickets.policy_violation_reason` | Human-readable explanation of corporate travel policy violation. |
| `approval_status`| `VARCHAR(50)` | Yes | `fact_travel_tickets.approval_status`| Workflow sign-off state: `'APPROVED'`, `'PENDING'`, or `'REJECTED'`. |
| `rejection_reason`| `VARCHAR(200)` | Yes | `fact_travel_tickets.rejection_reason` | Manager explanation when claim is rejected. |
| `override_applied`| `INTEGER` | Yes | `fact_travel_tickets.override_applied`| Flag: `1` if analyst/manager manual override is active; else `0`. |
| `record_hash` | `VARCHAR(64)` | Yes | `fact_travel_tickets.record_hash` | SHA-256 hash of core ticket attributes for deduplication tracking. |
| `source_file` | `VARCHAR(150)` | Yes | `fact_travel_tickets.source_file` | Name of raw vendor CSV source extract. |
| `updated_at` | `TIMESTAMP` | Yes | `fact_travel_tickets.updated_at` | Timestamp of last fact table publication. |

---

## 2. Core Tables Schema

### 2.1 `fx_rates`
Treasury reference rates for multi-currency conversion to base INR currency.
- `id` (INT, PK, Auto-increment)
- `currency_code` (VARCHAR(10), Indexed, Not Null) — ISO currency (USD, GBP, EUR, CHF, CAD, SGD, AED, JPY, AUD, INR)
- `rate_to_inr` (NUMERIC(18,4), Not Null) — Exchange multiplier to INR
- `effective_date` (VARCHAR(30), Not Null) — Effective date boundary
- `source` (VARCHAR(100)) — Treasury source provider
- `created_at` / `updated_at` (TIMESTAMP)

### 2.2 `employee_master`
Enterprise HR reference master implementing SCD Type-2 temporal history.
- `id` (INT, PK, Auto-increment)
- `employee_id` (VARCHAR(50), Indexed, Not Null)
- `employee_name` (VARCHAR(100), Not Null)
- `email` (VARCHAR(100))
- `business_unit` (VARCHAR(100), Indexed, Not Null)
- `business_group` (VARCHAR(100), Indexed)
- `department` (VARCHAR(100))
- `designation` (VARCHAR(100))
- `location` (VARCHAR(100))
- `manager_id` (VARCHAR(50))
- `effective_start_date` (VARCHAR(30), Not Null) — Temporal start boundary
- `effective_end_date` (VARCHAR(30), Not Null) — Temporal end boundary (`9999-12-31` for active)
- `quarterly_allowance_inr` (NUMERIC(18,2)) — Governed budget ceiling
- `is_current` (INTEGER, Indexed) — `1` for active version, `0` for historical

### 2.3 `country_reference`
Global geographic reference mapping country names to standard ISO codes and regional groupings.
- `country_code` (VARCHAR(10), PK) — ISO Alpha-2 (IN, US, GB, SG, DE, etc.)
- `country_name` (VARCHAR(100), Unique, Not Null)
- `iso_alpha2` (VARCHAR(5))
- `iso_alpha3` (VARCHAR(5))
- `region` (VARCHAR(50)) — APAC, EMEA, AMER
- `is_domestic_base` (INTEGER) — `1` if base operating country (India), else `0`

### 2.4 `staging_tickets`
Raw landed records from vendor CSV extract prior to cleansing.
- `id` (INT, PK, Auto-increment)
- `batch_id` (VARCHAR(50), Indexed, Not Null)
- `ingested_at` (TIMESTAMP)
- `ticket_id`, `trip_id`, `employee_id` (VARCHAR(50))
- `issue_date`, `travel_date`, `return_date` (VARCHAR(30))
- `origin_city`, `origin_country`, `dest_city`, `dest_country` (VARCHAR(100))
- `ticket_status` (VARCHAR(50))
- `amount` (NUMERIC(18,2))
- `currency`, `booking_channel`, `cabin_class` (VARCHAR)
- `record_hash` (VARCHAR(64), Indexed)
- `source_file`, `source_file_hash`, `raw_payload` (TEXT)

### 2.5 `cleansed_tickets`
Standardized, validated, and deduplicated ticket extract.
- Inherits staging fields with trimmed whitespace, title-cased locations, uppercase status.
- `amount_original` (NUMERIC(18,2)), `amount_inr` (NUMERIC(18,2)), `fx_rate` (NUMERIC(18,4))
- `is_duplicate` (INTEGER) — `1` if duplicate record detected, else `0`
- `duplicate_reason` (VARCHAR(200))

### 2.6 `quarantined_records`
Isolated records failing structural or financial data quality constraints.
- `id` (INT, PK, Auto-increment)
- `batch_id` (VARCHAR(50), Indexed, Not Null)
- `ticket_id` (VARCHAR(50), Indexed, Nullable)
- `error_type` (VARCHAR(50), Not Null) — `NULL_TICKET_ID`, `INVALID_AMOUNT`, `UNKNOWN_CURRENCY`, `INVALID_DATE`, `MISSING_TRAVEL_DATE`
- `error_message` (TEXT, Not Null)
- `raw_payload` (TEXT)
- `source_file` (VARCHAR(150))
- `quarantined_at` (TIMESTAMP)
- `is_resolved` (INTEGER)

### 2.7 `manual_overrides` & `manual_override_audits`
Dual-layer analyst exemption and manager sign-off mechanism.
- `manual_overrides`:
  - `ticket_id` (VARCHAR(50), PK)
  - `override_travelled_flag` (VARCHAR(5))
  - `override_classification` (VARCHAR(50))
  - `override_summary` (VARCHAR(100))
  - `override_reason` (TEXT)
  - `created_by` (VARCHAR(100))
  - `created_at` (TIMESTAMP)
  - `approved_by` (VARCHAR(100))
  - `approved_at` (TIMESTAMP)
  - `status` (VARCHAR(50)) — `APPROVED`
- `manual_override_audits`:
  - `id` (INT, PK, Auto-increment)
  - `ticket_id` (VARCHAR(50), Indexed, Not Null)
  - `field_changed` (VARCHAR(50), Not Null)
  - `old_value` (VARCHAR(100))
  - `new_value` (VARCHAR(100))
  - `override_reason` (TEXT)
  - `changed_by` (VARCHAR(100), Not Null)
  - `changed_at` (TIMESTAMP)

### 2.8 `pipeline_batch_audit`
Batch lifecycle and reconciliation ledger.
- `batch_id` (VARCHAR(50), PK)
- `status` (VARCHAR(20)) — `RUNNING`, `SUCCESS`, `ALREADY_PROCESSED`, `FAILED`
- `started_at` / `completed_at` (TIMESTAMP)
- `source_file` (VARCHAR(150))
- `source_file_hash` (VARCHAR(64)) — SHA-256 file checksum
- `records_received`, `records_cleaned`, `records_rejected`, `records_quarantined`, `records_published` (INT)
- `error_message` (TEXT)

### 2.9 `users` & `complaints`
Authentication, RBAC, and operational grievance tracking.
- `users`: `id`, `email` (Unique), `password_hash` (PBKDF2), `name`, `role` (`manager`, `employee`, `admin`), `employee_id`
- `complaints`: `id`, `subject`, `details`, `submitted_by`, `status` (`OPEN`, `RESOLVED`), `created_at`
