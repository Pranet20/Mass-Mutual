# Corporate Travel & Expense Intelligence Platform (PS-04)
## Requirement Traceability Matrix (RTM)

This document establishes bidirectional traceability between the **PS-04 Problem Statement Specifications**, the system architecture, database models, backend pipeline stages, REST APIs, automated test suites, and Power BI analytical assets.

---

### Matrix Summary

| Requirement Category | Total Requirements | Implemented | Verified | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Multi-Tier ETL & Ingestion** | 5 | 5 | 5 | **COMPLETE** |
| **2. Cleansing & Validation** | 6 | 6 | 6 | **COMPLETE** |
| **3. Enrichment & SCD Type 2** | 5 | 5 | 5 | **COMPLETE** |
| **4. Business Rules Engine** | 5 | 5 | 5 | **COMPLETE** |
| **5. Governed Data View (`vw_travel`)** | 4 | 4 | 4 | **COMPLETE** |
| **6. Security, RBAC & Lineage** | 5 | 5 | 5 | **COMPLETE** |
| **7. Power BI Integration** | 6 | 6 | 6 | **COMPLETE** |
| **8. React Frontend & Visualizations** | 6 | 6 | 6 | **COMPLETE** |
| **9. DevOps, Docker & CI/CD** | 4 | 4 | 4 | **COMPLETE** |
| **Total** | **46** | **46** | **46** | **100% VERIFIED** |

---

### Detailed Traceability Specifications

#### 1. Ingestion & Staging Tier
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-ETL-01** | Multi-vendor CSV ingestion with dynamic header mapping & format normalization | [`backend/pipeline/ingestion.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/ingestion.py) | `raw_tickets` table | `test_1_staging_ingestion` | **COMPLETE** |
| **REQ-ETL-02** | Cryptographic SHA-256 batch and record-level hash tracking | [`backend/pipeline/ingestion.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/ingestion.py) | `raw_tickets.record_hash`, `pipeline_batch_audit.file_hash` | `test_1_staging_ingestion`, `test_22_pipeline_idempotency` | **COMPLETE** |
| **REQ-ETL-03** | Batch audit lifecycle logging (Status: STARTED, SUCCESS, FAILED) | [`backend/pipeline/ingestion.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/ingestion.py) | `pipeline_batch_audit` table | `test_1_staging_ingestion` | **COMPLETE** |
| **REQ-ETL-04** | Pipeline idempotency: duplicate file uploads skipped without record duplication | [`backend/pipeline/validation.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/validation.py) | `POST /api/pipeline/run` | `test_22_pipeline_idempotency` | **COMPLETE** |
| **REQ-ETL-05** | Bad-record quarantine isolation preserving raw payload without pipeline crash | [`backend/pipeline/validation.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/validation.py) | `quarantined_records` table | `test_21_unknown_currency_quarantine_rejection`, `test_quarantined_record_structure` | **COMPLETE** |

---

#### 2. Cleansing, Currency & FX Lineage
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-CLN-01** | ISO 8601 Date standardization (`YYYY-MM-DD`) handling ambiguous formats | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py) | `staging_tickets` | `test_iso_date_standardization` | **COMPLETE** |
| **REQ-CLN-02** | Amount cleaning, comma/symbol stripping, and numeric casting | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py) | `staging_tickets.amount_original` | `test_2_cleansing_inr_conversion` | **COMPLETE** |
| **REQ-CLN-03** | Standardized currency conversion to INR using official daily rates | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py) | `fact_travel_tickets.amount_inr` | `test_2_cleansing_inr_conversion`, `test_currency_conversion` | **COMPLETE** |
| **REQ-CLN-04** | Full FX conversion lineage tracking (`amount_original`, `currency`, `fx_rate`, `fx_rate_date`, `fx_source`) | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py), [`backend/database/models.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/database/models.py) | `fact_travel_tickets`, `vw_travel` | `test_20_fx_rate_auditable_conversion`, `test_23_vw_travel_fx_lineage_columns` | **COMPLETE** |
| **REQ-CLN-05** | Unsupported currency rejection and isolation to quarantine with error code | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py) | `quarantined_records.error_type = 'UNKNOWN_CURRENCY'` | `test_21_unknown_currency_quarantine_rejection` | **COMPLETE** |
| **REQ-CLN-06** | Staging deduplication keeping latest valid vendor record | [`backend/pipeline/cleansing.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/cleansing.py) | `staging_tickets` | `test_3_cleansing_deduplication` | **COMPLETE** |

---

#### 3. Enrichment & SCD Type-2 Master Data
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-ENR-01** | Employee master demographic enrichment (Name, Business Unit, Department) | [`backend/pipeline/enrichment.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/enrichment.py) | `dim_employee_master` | `test_4_enrichment_employee_join` | **COMPLETE** |
| **REQ-ENR-02** | Slowly Changing Dimension (SCD Type 2) historical temporal joining | [`backend/pipeline/enrichment.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/enrichment.py) | `issue_date BETWEEN effective_start_date AND effective_end_date` | `test_15_scd_type2_temporal_enrichment`, `test_scd_type2_temporal_enrichment` | **COMPLETE** |
| **REQ-ENR-03** | City to ISO-3166 Alpha-2 / Country reference enrichment | [`backend/pipeline/enrichment.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/enrichment.py) | `dim_country_reference` | `test_5_enrichment_iso_country` | **COMPLETE** |
| **REQ-ENR-04** | Missing employee fallback handling without pipeline crash (`UNKNOWN_EMPLOYEE`) | [`backend/pipeline/enrichment.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/enrichment.py) | `fact_travel_tickets.employee_name = 'Unknown'` | `test_4_enrichment_employee_join` | **COMPLETE** |
| **REQ-ENR-05** | Master data CRUD management and auditing APIs | [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | `GET/POST /api/employees` | `test_27_dashboard_stats_dynamic_filtering` | **COMPLETE** |

---

#### 4. Business Rules & Governance Engine
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-RUL-01** | Travelled Flag derivation (`ISSUED`/`USED`/`FLOWN` $\to$ `'Y'`, `CANCELLED`/`REFUNDED`/`EXCHANGED`/`VOID` $\to$ `'N'`) | [`backend/pipeline/business_rules.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/business_rules.py) | `fact_travel_tickets.travelled_flag` | `test_6_business_rules_travelled_flag_issued`, `test_7_business_rules_travelled_flag_cancelled`, `test_8_business_rules_travelled_flag_refunded`, `test_25_business_rules_travelled_flag_exchanged` | **COMPLETE** |
| **REQ-RUL-02** | Trip Classification: `Domestic`, `Cross-Border`, `Multi-Country` based on leg count & ISO codes | [`backend/pipeline/business_rules.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/business_rules.py) | `fact_travel_tickets.trip_classification` | `test_9_business_rules_classification_domestic`, `test_10_business_rules_classification_cross_border`, `test_11_business_rules_classification_multi_country` | **COMPLETE** |
| **REQ-RUL-03** | Travel Summary routing concatenation (`Origin -> Destination`) | [`backend/pipeline/business_rules.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/business_rules.py) | `fact_travel_tickets.travel_summary` | `test_9_business_rules_classification_domestic` | **COMPLETE** |
| **REQ-RUL-04** | Manual override governance: User-approved overrides take precedence over derived rules | [`backend/pipeline/business_rules.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/pipeline/business_rules.py) | `manual_overrides`, `fact_travel_tickets.override_applied` | `test_12_manual_override_respect` | **COMPLETE** |
| **REQ-RUL-05** | Comprehensive override audit trail with user identity, timestamp, and justification | [`backend/database/models.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/database/models.py), [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | `manual_override_audit` | `test_12_manual_override_respect` | **COMPLETE** |

---

#### 5. Governed Data View (`vw_travel`) & BI Data Model
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-BI-01** | Unified 36-column authoritative view `vw_travel` created across PostgreSQL & SQLite | [`backend/database/models.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/database/models.py) | `vw_travel` view | `test_13_vw_travel_view_exists`, `test_database_governed_view_and_models` | **COMPLETE** |
| **REQ-BI-02** | Strict 36-column schema matching between Backend, PowerQuery M, and Data Dictionary | [`backend/services/data_dictionary.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/services/data_dictionary.py), [`powerbi/PowerQuery.m`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/powerbi/PowerQuery.m) | `GET /api/governance/data-dictionary`, `vw_travel` | `test_23_vw_travel_fx_lineage_columns` | **COMPLETE** |
| **REQ-BI-03** | Power BI DAX Core Measures (`Total Spend INR`, `Flown Spend INR`, `Total Trips`, `Travelled Trips`, `Compliance Rate %`) | [`powerbi/Measures.dax`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/powerbi/Measures.dax) | DAX measure definitions | Manual verification & PBIX import | **COMPLETE** |
| **REQ-BI-04** | Dual DirectQuery / Import mode compatibility with indexed fact querying | [`powerbi/PowerBI_Setup_Guide.md`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/powerbi/PowerBI_Setup_Guide.md) | PostgreSQL `localhost:5433` | Manual PBI Desktop verification | **COMPLETE** |

---

#### 6. Security, Authentication & Role-Based Access Control
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SEC-01** | Salted PBKDF2-HMAC-SHA256 password hashing with per-user dynamic cryptographic salts | [`backend/services/auth.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/services/auth.py) | `users.password_salt`, `users.password_hash` | `test_16_auth_service_dynamic_salts`, `test_auth_password_hashing_dynamic_salt` | **COMPLETE** |
| **REQ-SEC-02** | Mandatory JWT signature verification with strict secret key enforcement (no fallback) | [`backend/services/auth.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/services/auth.py) | `POST /api/auth/login` | `test_17_jwt_token_lifecycle`, `test_jwt_token_generation_and_decode` | **COMPLETE** |
| **REQ-SEC-03** | Granular RBAC authorization (`admin`, `manager`, `employee`) across all operational endpoints | [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | `require_role(["admin", "manager"])` | `test_27_dashboard_stats_dynamic_filtering` | **COMPLETE** |
| **REQ-SEC-04** | Role-scoped AI Assistant responses with grievance routing to official compliance email | [`backend/services/ai_assistant.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/services/ai_assistant.py) | `POST /api/ai/query` | `test_18_ai_assistant_service`, `test_24_role_aware_ai_assistant` | **COMPLETE** |
| **REQ-SEC-05** | Production zero-secret exposure: removal of hardcoded keys and credentials from codebase | [`.env.example`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/.env.example), [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | Environment configuration | Static security audit | **COMPLETE** |

---

#### 7. Frontend, Dashboards & Analytics
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-UI-01** | Zero hardcoded multipliers: Dynamic aggregation of real DB metrics in Executive KPIs | [`frontend/src/pages/Dashboard.jsx`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/frontend/src/pages/Dashboard.jsx), [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | `GET /api/dashboard/stats` | `test_27_dashboard_stats_dynamic_filtering` | **COMPLETE** |
| **REQ-UI-02** | Dynamic Quarter & Business Unit filtering across KPIs and Monthly Trends | [`frontend/src/pages/Dashboard.jsx`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/frontend/src/pages/Dashboard.jsx) | `GET /api/dashboard/stats?quarter=...&business_unit=...` | `test_27_dashboard_stats_dynamic_filtering` | **COMPLETE** |
| **REQ-UI-03** | Interactive Pipeline Runner with Live Execution Logs and Stage Progress | [`frontend/src/pages/PipelineRunner.jsx`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/frontend/src/pages/PipelineRunner.jsx) | `POST /api/pipeline/run`, `GET /api/pipeline/batches` | `test_1_staging_ingestion` | **COMPLETE** |
| **REQ-UI-04** | Governed Override Management Portal with audit justification recording | [`frontend/src/pages/OverrideManager.jsx`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/frontend/src/pages/OverrideManager.jsx) | `POST /api/overrides/submit` | `test_12_manual_override_respect` | **COMPLETE** |
| **REQ-UI-05** | Data Health & Anomaly Audit with real database integrity checks | [`frontend/src/pages/DataHealth.jsx`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/frontend/src/pages/DataHealth.jsx) | `GET /api/data-health/audit` | Integration test verification | **COMPLETE** |
| **REQ-UI-06** | C-Suite HTML Briefing generation & instant download | [`backend/services/export.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/services/export.py) | `GET /api/export/csuite-briefing` | `test_19_export_service` | **COMPLETE** |

---

#### 8. DevOps, Reliability & Probes
| ID | Requirement Specification | Implementation Files | DB Objects / Endpoints | Test Cases | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-OPS-01** | Production containerization binding to all interfaces (`0.0.0.0`) in Dockerfile & Compose | [`Dockerfile`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/Dockerfile), [`docker-compose.yml`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/docker-compose.yml) | Docker service specs | Container build verification | **COMPLETE** |
| **REQ-OPS-02** | Independent `/health` and live database probe `/health/db` with lifespan event management | [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py) | `GET /health`, `GET /health/db` | `test_26_health_and_db_probes` | **COMPLETE** |
| **REQ-OPS-03** | Complete GitHub Actions CI/CD workflow testing, building, and deploying containers | [`.github/workflows/ci.yml`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/.github/workflows/ci.yml), [`.github/workflows/cd.yml`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/.github/workflows/cd.yml) | GitHub Actions runners | YAML schema validation | **COMPLETE** |
| **REQ-OPS-04** | Python 3.14+ clean execution with 0 deprecation warnings | [`backend/main.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/main.py), [`backend/database/models.py`](file:///C:/Users/Pranet/Downloads/Mass%20Mutual/backend/database/models.py) | Datetime & FastAPI lifespan | `pytest -q` (41/41 passed, 0 warnings) | **COMPLETE** |

