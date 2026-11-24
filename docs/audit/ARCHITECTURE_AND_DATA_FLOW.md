# Architecture and Data Flow: End-to-End Analytics Pipeline

## 1. High-Level Architecture Overview

The **Corporate Travel Analytics** system is architected around an authoritative star schema and multi-tier data processing pipeline, transforming raw, multi-currency vendor ticketing CSVs into clean, enriched analytical facts and publishing them to executive dashboards and Microsoft Power BI.

```
+---------------------------------------------------------------------------------------------------+
|                                          DATA INGESTION & PIPELINE                                |
|                                                                                                   |
|  [Daily Raw Tickets CSV]                                                                          |
|            |                                                                                      |
|            v                                                                                      |
|  +------------------------+      +--------------------------+      +---------------------------+  |
|  |   1. INGESTION ENGINE  | ---> |   2. CLEANSING ENGINE    | ---> |   3. ENRICHMENT ENGINE    |  |
|  | - SHA-256 Hash Idempot |      | - Whitespace Trimming    |      | - SCD-2 Employee History  |  |
|  | - Header Validation    |      | - Currency Formatting    |      | - Country Alpha-2 & ISO   |  |
|  | - Chunked Stream Read  |      | - Duplicate Flagging     |      | - Point-in-Time FX Rates  |  |
|  +------------------------+      +--------------------------+      +---------------------------+  |
|                                                                                  |                |
|                                                                                  v                |
|                                                                    +---------------------------+  |
|                                                                    |  4. BUSINESS RULES ENGINE |  |
|                                                                    | - Travelled Flag (Y/N)    |  |
|                                                                    | - Domestic vs Cross-Border|  |
|                                                                    | - Multi-Country Routing   |  |
|                                                                    | - Travel Summary Label    |  |
|                                                                    | - Manual Override Layer   |  |
|                                                                    +---------------------------+  |
+----------------------------------------------------------------------------------|----------------+
                                                                                   v
+---------------------------------------------------------------------------------------------------+
|                                      POSTGRESQL ENTERPRISE STORAGE                                |
|                                                                                                   |
|  [staging_tickets] ----> [cleansed_tickets] ----> [fact_travel_tickets] <----> [quarantined_recs] |
|                                                           |                                       |
|                                                           v                                       |
|                                         +-----------------------------------+                     |
|                                         |     GOVERNED VIEW: vw_travel      |                     |
|                                         |  - 37 Standardized Columns        |                     |
|                                         |  - Zero Currency / Count Variance |                     |
|                                         |  - Point-in-Time SCD-2 Attribution|                     |
|                                         +-----------------------------------+                     |
+-----------------------------------------------------------|---------------------------------------+
                                                            v
+---------------------------------------------------------------------------------------------------+
|                                       CONSUMPTION & PRESENTATION                                  |
|                                                                                                   |
|           +---------------------------------+           +---------------------------------+       |
|           |         FASTAPI BACKEND         |           |       MICROSOFT POWER BI        |       |
|           | - REST Analytics Endpoints      |           | - Corporate_Travel_Analytics.pbix|      |
|           | - APM Telemetry & Crash Logging |           | - PBIP Source Control Project   |       |
|           | - PDF & Executive Audit Exports |           | - Official powerbi-client-react |       |
|           +---------------------------------+           +---------------------------------+       |
|                            |                                                                      |
|                            v                                                                      |
|           +---------------------------------+                                                     |
|           |      REACT / VITE FRONTEND      |                                                     |
|           | - Executive Overview Dashboard  |                                                     |
|           | - Employee Self-Service Portal  |                                                     |
|           | - ErrorBoundary & Telemetry     |                                                     |
|           +---------------------------------+                                                     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Multi-Tier Data Processing Lifecycle

### Tier 1: Ingestion & Idempotency Layer (`backend/pipeline/ingestion.py`)
- Calculates SHA-256 hash of incoming CSV.
- Checks `pipeline_batch_audit` ledger. If the hash exists and was previously processed successfully, the batch is marked `ALREADY_PROCESSED` to prevent duplicate ingestion.
- Validates mandatory headers: `ticket_id, trip_id, employee_id, issue_date, travel_date, return_date, origin_city, origin_country, dest_city, dest_country, status, amount, currency, booking_channel, cabin_class`.
- Streams raw records into `staging_tickets`.

### Tier 2: Cleansing & Deduplication Layer (`backend/pipeline/cleansing.py`)
- Trims whitespace and normalizes text casing.
- Standardizes date formats to ISO-8601 `YYYY-MM-DD`.
- Detects duplicate natural ticket IDs. Duplicate tickets are preserved in `cleansed_tickets` with `is_duplicate=1` for auditability, but filtered from analytical aggregations.

### Tier 3: Validation & Quarantine Isolation (`backend/pipeline/validation.py`)
- Enforces strict validation rules: positive fare amount, recognized currency codes (INR, USD, EUR, GBP, AED, SGD, CAD, CHF, JPY, AUD), valid date sequencing (`issue_date <= travel_date <= return_date`).
- Records failing critical constraints are routed to `quarantined_records` with error codes (`UNKNOWN_CURRENCY`, `INVALID_FARE_AMOUNT`, `DATE_SEQUENCE_VIOLATION`) without halting the pipeline.

### Tier 4: SCD Type-2 Enrichment (`backend/pipeline/enrichment.py`)
- Joins employee master records using point-in-time temporal windows (`effective_start_date <= travel_date <= effective_end_date`).
- Ensures historical employee department/division changes (e.g., Priya Nair moving from Operations & Risk to Finance & Actuarial) are attributed accurately to the division in effect at the exact moment travel occurred.
- Enriches origin and destination countries with standard ISO alpha-2 codes.
- Converts foreign currency fares to INR using point-in-time rates from `fx_rates`.

### Tier 5: Business Logic & Manual Overrides (`backend/pipeline/business_rules.py`)
- **Travelled Flag**: Set to `'Y'` for `ISSUED` status; `'N'` for `CANCELLED`, `REFUNDED`, or `EXCHANGED`.
- **Trip Destination Classification**: `'Domestic'` when origin and destination country match; `'Cross-Border'` otherwise.
- **Multi-Country Routing**: Identifies trips spanning multiple sovereign nations (e.g., `"US to GBS Multi-Country"`).
- **Travel Summary Label**: Combines route type, cabin class, and booking channel into analytical summaries.
- **Override Respect Layer**: Applies authorized analyst overrides from `manual_overrides` table, logging full audit rationale.

---

## 3. Analytical Contract: `public.vw_travel`
The view `vw_travel` exposes 37 governed attributes with zero financial variance between raw source totals and BI figures.
