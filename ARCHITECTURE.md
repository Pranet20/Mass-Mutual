# Corporate Travel & Expense Intelligence Platform (PS-04)
## System Architecture & Technical Specifications

---

### 1. Executive System Overview
The **Corporate Travel & Expense Intelligence Platform** is an enterprise-grade ETL, warehouse analytics, and BI reporting solution engineered to ingest multi-vendor corporate travel records, execute automated data cleansing, apply temporal Slowly Changing Dimension (SCD Type 2) enrichments, derive business rules, support audited manual overrides, and expose an authoritative 36-column analytical view (`vw_travel`) to Power BI, executive dashboards, and AI services.

---

### 2. High-Level Architecture

```mermaid
graph TD
    subgraph Ingestion_Tier["1. Ingestion & Staging"]
        CSV["Vendor Travel CSVs (Q3/Q4 2026)"] --> Ingest["Pipeline Ingestion Engine"]
        Ingest --> SHA["SHA-256 Hash & Batch Tracking"]
        SHA --> Raw["Raw Tickets (raw_tickets)"]
        SHA --> Audit["Batch Audit (pipeline_batch_audit)"]
    end

    subgraph Cleansing_Tier["2. Cleansing & Validation"]
        Raw --> Cleanse["Data Cleansing Engine"]
        Cleanse --> DateStd["ISO-8601 Date Standardization"]
        Cleanse --> FXConv["FX Conversion & Lineage Tracking"]
        Cleanse --> Dedup["Vendor Staging Deduplication"]
        Cleanse --> Quarantine["Quarantine Isolation (quarantined_records)"]
    end

    subgraph Warehouse_Tier["3. Dimensional Enrichment & Rules Engine"]
        Cleanse --> DimEmp["Dim Employee Master (SCD Type 2)"]
        Cleanse --> DimGeo["Dim Country Reference (ISO-3166)"]
        DimEmp & DimGeo --> Rules["Business Rules Engine"]
        Rules --> TrvFlag["Travelled Flag Derivation"]
        Rules --> TripClass["Trip Classification (Domestic/Cross-Border/Multi)"]
        Rules --> Overrides["Manual Overrides & Audit Log"]
        Rules & Overrides --> Fact["Fact Travel Tickets (fact_travel_tickets)"]
    end

    subgraph Consumption_Tier["4. Governed Consumption & BI Layer"]
        Fact --> View["Governed Analytical View (vw_travel - 36 Columns)"]
        View --> FastAPI["FastAPI REST & Analytics Engine"]
        View --> DirectQuery["Power BI Desktop (DirectQuery / Import)"]
        FastAPI --> ReactUI["React Executive Dashboard"]
        FastAPI --> AIAssistant["Role-Aware AI Travel Assistant"]
        FastAPI --> CSuitePDF["C-Suite Briefing Generator"]
    end
```

---

### 3. End-to-End Data Pipeline Flow

```mermaid
sequenceDiagram
    autonumber
    participant Vendor as Vendor CSV Source
    participant Ingest as Ingestion Service
    participant Clean as Cleansing & FX Service
    participant Enrich as SCD-2 & Geo Enrichment
    participant Rules as Business Rules Engine
    participant DB as PostgreSQL / SQLite
    participant BI as Power BI / React Dashboard

    Vendor->>Ingest: Upload Batch CSV
    Ingest->>Ingest: Compute File Hash & Batch ID
    Ingest->>DB: Record Ingestion in raw_tickets & pipeline_batch_audit
    Ingest->>Clean: Trigger Automated Cleansing
    Clean->>Clean: Validate Schema, Currency, & Date Formats
    alt Invalid Format / Unknown Currency
        Clean->>DB: Insert into quarantined_records with error payload
    else Valid Format
        Clean->>Clean: Convert Currency to INR & Retain FX Lineage
        Clean->>Enrich: Pass Cleaned Records
    end
    Enrich->>DB: Query dim_employee_master (SCD Type 2 issue_date between start/end)
    Enrich->>DB: Query dim_country_reference (City -> ISO Alpha-2)
    Enrich->>Rules: Pass Enriched Demographic & Geographic Records
    Rules->>DB: Check for Active Approved Manual Overrides
    Rules->>Rules: Apply Derivations (travelled_flag, trip_classification, travel_summary)
    Rules->>DB: Upsert Fact Records into fact_travel_tickets
    DB->>DB: Update vw_travel Materialization / View Query
    DB->>BI: Serve 36-Column Governed View via SQL / DirectQuery / API
```

---

### 4. Database Schema & Data Models

#### 4.1 Star-Schema Data Model

```mermaid
erDiagram
    fact_travel_tickets ||--o{ dim_employee_master : "temporal employee join"
    fact_travel_tickets ||--o{ dim_country_reference : "origin/dest ISO join"
    fact_travel_tickets ||--o{ manual_overrides : "overrides business rules"
    fact_travel_tickets ||--o{ pipeline_batch_audit : "batch lineage"
    fact_travel_tickets ||--|| vw_travel : "exposes 36-column analytical view"

    fact_travel_tickets {
        string ticket_id PK
        string trip_id
        string batch_id FK
        string employee_id FK
        string employee_name
        string business_unit
        string department
        string issue_date
        string travel_date
        string return_date
        string origin_city
        string origin_country
        string dest_city
        string dest_country
        string origin_iso
        string dest_iso
        string ticket_status
        float amount_original
        string currency
        float fx_rate
        float amount_inr
        string fx_rate_date
        string fx_source
        string booking_channel
        string cabin_class
        string travelled_flag
        string trip_classification
        string travel_summary
        string policy_compliance_status
        string policy_violation_reason
        string approval_status
        string rejection_reason
        boolean override_applied
        string record_hash
        string source_file
        datetime updated_at
    }

    dim_employee_master {
        int id PK
        string employee_id
        string employee_name
        string department
        string business_unit
        string cost_center
        string location
        string effective_start_date
        string effective_end_date
        boolean is_current
    }

    dim_country_reference {
        string city PK
        string country
        string iso_code
        string region
    }

    quarantined_records {
        int id PK
        string batch_id
        string ticket_id
        string error_type
        string error_message
        text raw_payload
        string source_file
        datetime quarantined_at
        string resolution_status
    }
```

#### 4.2 Slowly Changing Dimension (SCD Type 2) Architecture
Employee organizational transfers (e.g. employee transitioning from Engineering to Product Management) are captured with validity intervals (`effective_start_date` and `effective_end_date`).
- When historical tickets are enriched, the join condition matches `ticket.issue_date BETWEEN dim.effective_start_date AND dim.effective_end_date`.
- This guarantees historical spend reporting accurately reflects the employee's department at the time of booking.

#### 4.3 Governed BI View (`vw_travel`)
The database view `vw_travel` serves as the single source of truth for all downstream reporting:
- Direct projection of all 36 canonical fields.
- Available natively in PostgreSQL (`public.vw_travel`) and SQLite.
- Enables seamless DirectQuery and Import mode querying in Power BI Desktop and Power BI Service.

---

### 5. Security & Authentication Architecture

1. **Password Security**: Passwords are saved with salted PBKDF2-HMAC-SHA256 hashing utilizing cryptographically random per-user 16-byte hex salts (`os.urandom(16)`).
2. **JWT Token Lifecycle**: Stateless HS256 JWT tokens with strict signature validation. If `JWT_SECRET_KEY` is not provided in production, the application refuses to start.
3. **Role-Based Access Control (RBAC)**:
   - `admin`: Full system control, pipeline trigger, user management, override approvals.
   - `manager`: Business unit filtering, manual override submission, data health auditing, executive briefing download.
   - `employee`: Scoped profile viewing, personal travel allowance and policy assistance.
4. **Security Headers**: Injected via ASGI middleware on every response (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).

---

### 6. Power BI Integration Architecture

1. **Direct Connection**: Power BI connects to PostgreSQL `localhost:5433` (Database: `travel_analytics`) querying `vw_travel`.
2. **Authoritative PowerQuery M Script**: Located at `powerbi/PowerQuery.m`, enforcing column types, uppercase standardizations, and date parsing.
3. **Standardized DAX Measures**: Located at `powerbi/Measures.dax`, implementing:
   - `Total Spend INR = SUM(vw_travel[amount_inr])`
   - `Flown Spend INR = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = "Y")`
   - `Travelled Trips = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = "Y")`
   - `Compliance Rate % = DIVIDE(CALCULATE(COUNTROWS(vw_travel), vw_travel[policy_compliance_status] = "COMPLIANT"), COUNTROWS(vw_travel), 0)`
4. **Templates & Artifacts**:
   - `powerbi/Corporate_Travel_Analytics.pbix`
   - `powerbi/PowerBI_Setup_Guide.md`
   - `powerbi/DataModel.md`
   - `powerbi/Report_Design.md`

---

### 7. DevOps & Infrastructure

- **Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` defining the backend FastAPI service and PostgreSQL 16 database, binding to `0.0.0.0:8000`.
- **Health Probes**:
  - `GET /health`: Liveness probe for orchestrators.
  - `GET /health/db`: Readiness probe verifying live database connectivity.
- **CI/CD Automation**:
  - `.github/workflows/ci.yml`: Automated linting, static analysis, and pytest validation on all pushes and pull requests.
  - `.github/workflows/cd.yml`: Automated container build, tagging, staging deployment, and health probe verification.
