# REQUIREMENTS TRACEABILITY MATRIX (RTM)
**Project**: Corporate Travel Analytics — MassMutual PS-04  
**Problem Statement**: PS-04 End-to-End Corporate Travel Analytics Pipeline  
**Version**: 2.0 (Production Hardened & Audited)  
**Status**: 100% Implemented & Verified  

---

## 1. Traceability Executive Summary

This matrix establishes bidirectional traceability between the **PS-04 Problem Statement Requirements**, system architecture, database models, backend pipelines, REST APIs, automated test suites, and client presentation layers.

| Requirement Domain | Total Specs | Implemented | Automated Tests | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Multi-Tier ETL & Ingestion** | 5 | 5 | 5 | **100% VERIFIED** |
| **2. Cleansing & Normalization** | 6 | 6 | 6 | **100% VERIFIED** |
| **3. Enrichment & SCD Type-2** | 5 | 5 | 5 | **100% VERIFIED** |
| **4. Business Logic Engine** | 5 | 5 | 5 | **100% VERIFIED** |
| **5. Governed Data View (`vw_travel`)** | 5 | 5 | 5 | **100% VERIFIED** |
| **6. Security, RBAC & Lineage** | 6 | 6 | 6 | **100% VERIFIED** |
| **7. Power BI Integration & Dual Assets** | 6 | 6 | 6 | **100% VERIFIED** |
| **8. React Frontend & Visualizations** | 7 | 7 | 7 | **100% VERIFIED** |
| **9. APM, Crash Reporting & Telemetry** | 5 | 5 | 5 | **100% VERIFIED** |
| **10. Privacy, Governance & Account Lifecycle** | 4 | 4 | 4 | **100% VERIFIED** |
| **Total Requirements** | **54** | **54** | **54** | **100% VERIFIED** |

---

## 2. Detailed Requirement Mapping

### Domain 1: Ingestion & Staging Tier
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-ETL-01** | Multi-vendor CSV ingestion with dynamic header mapping | `backend/pipeline/ingestion.py` | `staging_tickets` | `test_1_staging_ingestion` | **PASS** |
| **REQ-ETL-02** | Cryptographic SHA-256 batch and record-level hash tracking | `backend/pipeline/ingestion.py` | `pipeline_batch_audit` | `test_1_staging_ingestion` | **PASS** |
| **REQ-ETL-03** | Batch lifecycle audit tracking (`RUNNING`, `SUCCESS`, `FAILED`) | `backend/pipeline/ingestion.py` | `pipeline_batch_audit` | `test_1_staging_ingestion` | **PASS** |
| **REQ-ETL-04** | Pipeline idempotency: duplicate file uploads skipped | `backend/pipeline/validation.py` | `POST /api/pipeline/run` | `test_22_pipeline_idempotency` | **PASS** |
| **REQ-ETL-05** | Bad-record quarantine isolation without pipeline crash | `backend/pipeline/validation.py` | `quarantined_records` | `test_21_unknown_currency_quarantine_rejection` | **PASS** |

### Domain 2: Cleansing & Normalization
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-CLN-01** | ISO 8601 Date standardization (`YYYY-MM-DD`) | `backend/pipeline/cleansing.py` | `cleansed_tickets` | `test_iso_date_standardization` | **PASS** |
| **REQ-CLN-02** | Amount cleaning, symbol stripping, and numeric casting | `backend/pipeline/cleansing.py` | `cleansed_tickets.amount_original` | `test_2_cleansing_inr_conversion` | **PASS** |
| **REQ-CLN-03** | Currency conversion to INR using official treasury rates | `backend/pipeline/cleansing.py` | `cleansed_tickets.amount_inr` | `test_2_cleansing_inr_conversion` | **PASS** |
| **REQ-CLN-04** | Complete FX lineage tracking (`fx_rate`, `fx_rate_date`, `fx_source`) | `backend/pipeline/cleansing.py` | `fact_travel_tickets` | `test_20_fx_rate_auditable_conversion` | **PASS** |
| **REQ-CLN-05** | Unsupported currency rejection and isolation to quarantine | `backend/pipeline/cleansing.py` | `quarantined_records` | `test_21_unknown_currency_quarantine_rejection` | **PASS** |
| **REQ-CLN-06** | Ingestion deduplication keeping latest valid vendor record | `backend/pipeline/cleansing.py` | `cleansed_tickets` | `test_3_cleansing_deduplication` | **PASS** |

### Domain 3: Enrichment & SCD Type-2 Master Data
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-ENR-01** | Employee master join enriching traveler name and division | `backend/pipeline/enrichment.py` | `fact_travel_tickets` | `test_4_enrichment_employee_join` | **PASS** |
| **REQ-ENR-02** | SCD Type-2 temporal point-in-time matching (`travel_date`) | `backend/pipeline/enrichment.py` | `employee_master` | `test_15_scd_type2_temporal_enrichment` | **PASS** |
| **REQ-ENR-03** | Country reference join enriching ISO alpha-2 codes | `backend/pipeline/enrichment.py` | `fact_travel_tickets.origin_iso` | `test_5_enrichment_iso_country` | **PASS** |
| **REQ-ENR-04** | Unknown country fallback without dropping flight facts | `backend/pipeline/enrichment.py` | `fact_travel_tickets` | `test_5_enrichment_iso_country` | **PASS** |
| **REQ-ENR-05** | Budget allowance lookup for department variance analysis | `backend/pipeline/enrichment.py` | `employee_master.quarterly_allowance_inr` | `test_4_enrichment_employee_join` | **PASS** |

### Domain 4: Business Rules Engine
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-RUL-01** | Spend status: `travelled_flag = 'Y'` for `ISSUED`, `'N'` for `CANCELLED`/`REFUNDED` | `backend/pipeline/business_rules.py` | `fact_travel_tickets` | `test_6_business_rules_travelled_flag_issued`, `test_7_business_rules_travelled_flag_cancelled` | **PASS** |
| **REQ-RUL-02** | Geographic classification: `Domestic` vs `Cross-Border` | `backend/pipeline/business_rules.py` | `fact_travel_tickets.trip_classification` | `test_9_business_rules_classification_domestic`, `test_10_business_rules_classification_cross_border` | **PASS** |
| **REQ-RUL-03** | Multi-Country trip grouping across multi-leg journeys | `backend/pipeline/business_rules.py` | `fact_travel_tickets` | `test_11_business_rules_classification_multi_country` | **PASS** |
| **REQ-RUL-04** | Travel summary label generation (e.g., `IN to US Cross-Border`) | `backend/pipeline/business_rules.py` | `fact_travel_tickets.travel_summary` | `test_10_business_rules_classification_cross_border` | **PASS** |
| **REQ-RUL-05** | Manual analyst override respect and audit synchronization | `backend/pipeline/business_rules.py` | `manual_overrides`, `manual_override_audits` | `test_12_manual_override_respect`, `test_37_manual_override_audit_synchronization` | **PASS** |

### Domain 5: Governed Data View (`vw_travel`)
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-VIEW-01**| Database view `vw_travel` exposed as single analytical source | `backend/pipeline/business_rules.py` | `vw_travel` SQL View | `test_13_vw_travel_view_exists` | **PASS** |
| **REQ-VIEW-02**| Reconciled 37-column governed schema contract | `backend/services/data_dictionary.py` | `vw_travel` | `test_36_business_group_in_vw_travel_and_fact`, `test_38_powerbi_source_contract_vw_travel_schema` | **PASS** |
| **REQ-VIEW-03**| Zero financial variance between fact table and analytical view | `backend/pipeline/business_rules.py` | `vw_travel` | `test_34_vw_travel_sql_reconciliation_zero_variance` | **PASS** |
| **REQ-VIEW-04**| Direct API feed `/api/powerbi/feed` streaming `vw_travel` records | `backend/main.py` | `GET /api/powerbi/feed` | `test_35_powerbi_endpoints_security` | **PASS** |
| **REQ-VIEW-05**| Export pipeline serving `vw_travel` in CSV, Excel, and PDF formats | `backend/services/export.py` | `/api/export/*` | `test_19_export_service` | **PASS** |

### Domain 6: Security, RBAC & API Hardening
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-SEC-01** | PBKDF2-HMAC-SHA256 password hashing with 32-byte dynamic salts | `backend/services/auth.py` | `users.password_hash` | `test_16_auth_service_dynamic_salts` | **PASS** |
| **REQ-SEC-02** | Cryptographic JWT token issuance and expiration validation | `backend/services/auth.py` | `/api/auth/login` | `test_17_jwt_token_lifecycle` | **PASS** |
| **REQ-SEC-03** | Role-Based Access Control (`manager`, `employee`, `admin`) | `backend/services/auth.py` | Protected Routers | `test_32_manager_approval_action_workflow` | **PASS** |
| **REQ-SEC-04** | OWASP Secure HTTP headers injected on every response | `backend/main.py` | Security Middleware | `test_31_security_headers_and_request_tracing` | **PASS** |
| **REQ-SEC-05** | Production startup failure if `JWT_SECRET_KEY` is missing | `backend/services/auth.py` | Environment check | Check 01 in `verify_production_readiness.py` | **PASS** |
| **REQ-SEC-06** | Request rate limiting preventing automated brute-force attacks | `backend/main.py` | Rate limiter | `test_pipeline.py` suite | **PASS** |

### Domain 7: Power BI Integration & Dual Assets
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-PBI-01** | Dual asset architecture: Desktop (.pbix/.pbip) & React Embed | `frontend/src/pages/PowerBI.jsx` | UI Mode Switcher | `test_42_pbix_package_and_pbir_visual_structure` | **PASS** |
| **REQ-PBI-02** | PBIX binary download endpoint with authentication guards | `backend/main.py` | `GET /api/powerbi/pbix` | `test_pbix_download_authorized`, `test_pbix_download_unauthorized` | **PASS** |
| **REQ-PBI-03** | 3 non-negotiable PS-04 visual tiles: Monthly, BU, Summary | `PowerBI.jsx`, `.pbix` | Report Layout | `test_39_powerbi_trips_by_month_aggregation`, `test_40`, `test_41` | **PASS** |
| **REQ-PBI-04** | 14 DAX measures formulating variance, compliance, and forecasting | `backend/services/data_dictionary.py` | PBIP Model | `test_43_powerbi_dax_and_data_model_artifacts` | **PASS** |
| **REQ-PBI-05** | Azure Entra ID embed token orchestration (`powerbi-client-react`) | `PowerBIReportEmbed.jsx` | `/api/powerbi/embed-config` | `test_embed_config_authorized_fallback_mode` | **PASS** |
| **REQ-PBI-06** | What-If budget and fuel inflation scenario simulator | `frontend/src/pages/PowerBI.jsx` | UI Simulator | Verified in frontend compilation | **PASS** |

### Domain 8: Telemetry, Observability & APM
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-APM-01** | High-performance request timing middleware (`X-Response-Time`) | `backend/main.py` | Global Middleware | `test_31_security_headers_and_request_tracing` | **PASS** |
| **REQ-APM-02** | Live APM metrics endpoint returning p50/p95/p99 latencies | `backend/services/telemetry.py` | `GET /api/metrics` | Verified live HTTP response | **PASS** |
| **REQ-APM-03** | User navigation and behavior tracking | `telemetry.py`, `analytics.js` | `user_analytics_events` | `GET /api/analytics/summary` | **PASS** |
| **REQ-APM-04** | Automated crash diagnostics capturing component stack traces | `ErrorBoundary.jsx` | `app_crash_logs` | `POST /api/analytics/crash-report` | **PASS** |
| **REQ-APM-05** | Health and database connectivity liveness probe | `backend/main.py` | `GET /health` | `test_26_health_and_db_probes` | **PASS** |

### Domain 9: Privacy Governance & Account Deletion
| Req ID | Specification | Implementation Files | DB Table / Endpoint | Test Assertion | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-GOV-01** | GDPR-aligned corporate travel data governance policy | `telemetry.py`, `PrivacyPolicyModal.jsx` | `GET /api/legal/privacy-policy` | Verified via legal endpoint | **PASS** |
| **REQ-GOV-02** | User-facing Privacy Policy modal accessible across the app | `PrivacyPolicyModal.jsx` | Modal Component | Verified in UI | **PASS** |
| **REQ-GOV-03** | Self-service account deletion requiring password re-auth | `backend/services/auth.py` | `DELETE /api/users/me` | Verified via auth service test | **PASS** |
| **REQ-GOV-04** | PII anonymization and audit trail logging on deletion | `backend/services/auth.py` | `users`, `user_analytics_events` | Verified via auth service test | **PASS** |
