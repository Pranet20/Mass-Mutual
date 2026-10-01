# Corporate Travel & Expense Intelligence Platform (PS-04)

[![CI Pipeline](https://github.com/Pranet20/Mass-Mutual/actions/workflows/ci.yml/badge.svg)](https://github.com/Pranet20/Mass-Mutual/actions/workflows/ci.yml)
[![Tests: 44 Passed](https://img.shields.io/badge/Tests-44%20Passed-brightgreen)](TEST_CASES.md)
[![Verification: 20/20 Checks](https://img.shields.io/badge/Verification-20%2F20%20Checks%20Passed-brightgreen)](scripts/verify_production_readiness.py)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.1.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![Power BI](https://img.shields.io/badge/Power_BI-Governed_vw__travel-F2C811.svg)](powerbi/)

An enterprise-grade multi-tier ETL, data warehousing, and business intelligence platform engineered to ingest multi-vendor corporate travel records, execute automated data cleansing, apply temporal Slowly Changing Dimension (SCD Type 2) enrichments, enforce business rules, support audited manual overrides, and expose an authoritative 37-column analytical view (`vw_travel`) to Power BI, executive React dashboards, and AI services.

---

## 🏛️ System Architecture & Data Flow

```
Vendor Travel CSVs (Q3/Q4 2026)
    ↓
1. Ingestion & Staging (SHA-256 Idempotency & Batch Auditing)
    ↓
2. Cleansing & Validation (ISO-8601 Date Parsing, FX Lineage, Deduplication)
    ↓ [Quarantines bad records to quarantined_records]
3. Master Data Enrichment (SCD Type 2 Employee Join & ISO-3166 Country Mapping)
    ↓
4. Business Rules Engine (Travelled Flag, Domestic/Cross-Border Classification, Routing)
    ↓
5. Governed Overrides Layer (Analyst Overrides with Immutable Audit Trail)
    ↓
6. Fact Storage (fact_travel_tickets)
    ↓
7. Governed Single Source of Truth View (vw_travel - 37 Columns)
    ├── PostgreSQL (localhost:5433)
    ├── Microsoft Power BI Desktop (DirectQuery & Import)
    ├── FastAPI REST & Analytics Services (localhost:8000)
    └── React Executive UI (localhost:3000)
```

For complete technical documentation:
- Architecture & ER Diagrams: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Schema & Data Dictionary: [`DATA_DICTIONARY.md`](./DATA_DICTIONARY.md)
- Derivation Logic & Thresholds: [`BUSINESS_RULES.md`](./BUSINESS_RULES.md)
- Lineage & Traceability: [`DATA_LINEAGE.md`](./DATA_LINEAGE.md)
- Security & RBAC Protocols: [`SECURITY.md`](./SECURITY.md)
- Power BI 5-Page PBIR Specification: [`POWERBI_SETUP.md`](./POWERBI_SETUP.md)
- Requirement Traceability Matrix: [`REQUIREMENT_TRACEABILITY.md`](./REQUIREMENT_TRACEABILITY.md)
- Automated Test Inventory: [`TEST_CASES.md`](./TEST_CASES.md)

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Node.js 18+ and npm
- PostgreSQL 16 (or SQLite fallback)
- Microsoft Power BI Desktop (for `.pbix` reports)

### 1. Clone the Repository
```bash
git clone https://github.com/Pranet20/Mass-Mutual.git
cd Mass-Mutual
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
*(Configure `DATABASE_URL`, `JWT_SECRET_KEY`, and `ALLOWED_ORIGINS` in `.env`)*

### 3. Backend Setup & Single-Command Verification
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed sample data & run initial pipeline
python backend/seed_data.py
python backend/pipeline/validation.py

# Run master 20-point production readiness verification
python scripts/verify_production_readiness.py

# Start FastAPI server
python backend/main.py
```
*Backend API runs at: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`)*

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Or 'npm run dev' for development server
```
*Frontend application runs at: `http://localhost:3000`*

### 5. Running with Docker Compose
```bash
docker-compose up --build -d
```

---

## 🧪 Automated Verification Suite

Run all automated unit, integration, and security tests:

```bash
pytest -q
```
```text
............................................                             [100%]
44 passed in 5.12s (100% Pass Rate)
```

Run the master 20-point production verification checklist:
```bash
python scripts/verify_production_readiness.py
```
```text
VERIFICATION SUMMARY: 20/20 CHECKS PASSED (100% Target)
ALL 20 PRODUCTION READINESS CHECKS CONFIRMED! READY FOR CLIENT PANEL PRESENTATION.
```

---

## 📊 Power BI & Governed BI Reporting

The governed view **`vw_travel`** exposes 36 standardized attributes:

- **Star Schema Data Model**: Detailed in [`powerbi/DataModel.md`](./powerbi/DataModel.md)
- **14 Production DAX Measures**: Ready in [`powerbi/Measures.dax`](./powerbi/Measures.dax)
- **Power Query M Transformation Script**: Located in [`powerbi/PowerQuery.m`](./powerbi/PowerQuery.m)
- **Setup & DirectQuery Guide**: Located in [`powerbi/PowerBI_Setup_Guide.md`](./powerbi/PowerBI_Setup_Guide.md)
- **Power BI Template / Report**: [`powerbi/Corporate_Travel_Analytics.pbix`](./powerbi/Corporate_Travel_Analytics.pbix)

### Core Required Power BI Visuals:
1. **Travel Volume & Spend Timeline**: Line & Clustered Column Chart (Monthly trend from `vw_travel[travel_date]`).
2. **Spend by Business Division**: Clustered Bar Chart sorted descending by `[Total Completed Spend INR]`.
3. **Travel Route & Country Distribution**: Donut Chart showing Domestic vs Cross-Border vs Multi-Country.
4. **Interactive Slicers**: Travel Date Range, Business Unit, Trip Classification, and Ticket Status.
5. **Top KPI Cards**: Total Spend (`₹1.41 Cr`), Total Flown Trips (`242`), Average Fare (`₹58.3K`), Cross-Border Share (`60.1%`).

---

## 🔒 Security & Governance

- **Password Hashing**: PBKDF2-HMAC-SHA256 with 100,000 iterations and per-user 16-byte random salts.
- **Stateless Authentication**: HS256 JWT tokens with strict signature validation and no silent fallbacks.
- **Granular RBAC**: Role-based access control for `admin`, `manager`, and `employee` personas.
- **Audit Lineage**: Complete SHA-256 batch tracing, error quarantine isolation, and immutable manual override logs.
- **C-Suite Briefing**: Live 5-page printable PDF report generation formatted in Indian Standard Time (IST).

---

## 📁 Repository Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Automated linting & pytest workflow
│       └── cd.yml                    # Container build & deployment workflow
├── backend/
│   ├── database/
│   │   └── models.py                 # SQLAlchemy models & vw_travel view definition
│   ├── pipeline/
│   │   ├── ingestion.py              # SHA-256 ingestion & batch auditing
│   │   ├── cleansing.py              # ISO dates, deduplication & FX lineage
│   │   ├── enrichment.py             # SCD Type 2 employee & geo enrichment
│   │   ├── business_rules.py         # Business rule derivations & overrides
│   │   └── validation.py             # End-to-end pipeline orchestrator
│   ├── services/
│   │   ├── auth.py                   # PBKDF2 hashing, JWT & RBAC dependencies
│   │   ├── export.py                 # 5-page C-Suite report generator (IST)
│   │   ├── ai_assistant.py           # Role-aware AI assistant & grievances
│   │   ├── forecasting.py            # Predictive spend analytics
│   │   └── data_dictionary.py        # 36-column metadata registry
│   ├── tests/
│   │   ├── test_pipeline.py          # 27 end-to-end pipeline test cases
│   │   └── test_system.py            # 7 system & model verification tests
│   └── main.py                       # FastAPI application & router endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/                    # Dashboard, PowerBI, Reports, Overrides, etc.
│   │   └── context/                  # AuthContext with token persistence
│   └── package.json                  # React + Vite dependencies
├── powerbi/
│   ├── Corporate_Travel_Analytics.pbix # Power BI report file
│   ├── DataModel.md                  # 36-column data dictionary & Star Schema
│   ├── Measures.dax                  # 14 production DAX measures
│   ├── PowerQuery.m                  # Power Query M transformation scripts
│   ├── Report_Design.md              # 5-page Power BI visual specifications
│   └── PowerBI_Setup_Guide.md        # DirectQuery & Import connection guide
├── Dockerfile                        # Multi-stage production container
├── docker-compose.yml                # Backend + PostgreSQL 16 stack
├── ARCHITECTURE.md                   # System architecture & Mermaid diagrams
├── REQUIREMENT_TRACEABILITY.md       # 46-point RTM mapping
├── TEST_CASES.md                     # 41-point test suite documentation
├── requirements.txt                  # Python dependencies
└── README.md                         # Project documentation
```

---

## 📜 License
Licensed under the Apache 2.0 License.
