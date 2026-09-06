# Business Test Cases & Verification Documentation (PS-04)

**Problem Statement PS-04**: End-to-End Corporate Travel Analytics Pipeline (Raw Tickets → Warehouse View → Dashboard)  
**Target Domain**: Data Engineering & Enterprise BI Analytics  
**Governed Analytical View**: `vw_travel` (PostgreSQL / SQLite)  
**Verification Suite**: 41 / 41 Tests Passing (**100% Pass Rate**)

---

## 1. Core Business Scenarios & Test Matrix

| Scenario ID | Business Scenario / Module | Description & Input | Expected Outcome & Verification | Result |
| :--- | :--- | :--- | :--- | :--- |
| **SCN-01** | **Raw Ingestion & Audit Traceability** | Ingestion of raw vendor extract `travel_raw_tickets.csv` with SHA-256 idempotency check | Generates unique microsecond batch ID (`BATCH_YYYYMMDD_HHMMSS_ffffff`), computes SHA-256 file hash, and logs ingestion audit trail in `pipeline_batch_audits`. | **PASSED** |
| **SCN-02** | **Data Cleansing & Strict Date Validation** | Standardizes travel/issue/return dates to ISO-8601 (`YYYY-MM-DD`). Rejects invalid or null dates | Dates formatted to `YYYY-MM-DD`. Malformed dates quarantined under `INVALID_TRAVEL_DATE` or `MISSING_TRAVEL_DATE` (zero silent defaulting). | **PASSED** |
| **SCN-03** | **Auditable FX Rates & Multi-Currency** | Foreign currency conversions (`USD`, `GBP`, `EUR`, `SGD`, `AED`, `CAD`, `CHF`, `JPY`, `AUD`) against `FXRate` table | Applies auditable exchange rate, retains `amount_original`, `currency`, `fx_rate`, `fx_rate_date`, and `fx_source`. Unapproved currencies quarantined under `UNKNOWN_CURRENCY`. | **PASSED** |
| **SCN-04** | **Deduplication & Revision Tracking** | Ingestion of duplicate ticket payloads and revised bookings | Computes canonical SHA-256 `record_hash`. Exact duplicates flagged with `is_duplicate = 1`; revised tickets tracked with audit lineage. | **PASSED** |
| **SCN-05** | **SCD Type-2 Employee Master Join** | Joins tickets to `employee_master` based on `employee_id` and temporal point-in-time `travel_date` | Resolves point-in-time role for employees with historical department/allowance transfers (e.g. Priya Nair `EMP-1002` pre-2026 vs 2026+). | **PASSED** |
| **SCN-06** | **Country Reference & ISO Resolution** | Joins departure and arrival country names against `country_reference` | Resolves ISO alpha-2 codes (`origin_iso`, `dest_iso`), alpha-3 codes, and corporate regions (`APAC`, `AMER`, `EMEA`). | **PASSED** |
| **SCN-07** | **Business Rule: Travelled Flag Derivation** | Evaluates booking status (`ISSUED`, `EXCHANGED`, `CANCELLED`, `REFUNDED`) | `ISSUED` and `USED` evaluate to `travelled_flag = 'Y'`; `CANCELLED`, `REFUNDED`, and `EXCHANGED` (original coupon) evaluate to `travelled_flag = 'N'`. | **PASSED** |
| **SCN-08** | **Business Rule: Route Classification** | Evaluates origin vs destination geography | Single country = `Domestic`; differing countries = `Cross-Border`; multi-leg trips across international hubs = `Multi-Country`. | **PASSED** |
| **SCN-09** | **Business Rule: Travel Summary Label** | Generates human-readable routing and classification summary | Labels generated (e.g., `'Domestic India'`, `'IN to US Cross-Border'`, `'IN to GBS Multi-Country'`). | **PASSED** |
| **SCN-10** | **Manual Override Respect Layer** | Analyst exemption recorded in `manual_overrides` table (e.g. ticket `TCK-8012`) | Overrides ETL-derived `travelled_flag`, `trip_classification`, and `travel_summary` with `override_applied = 1` and immutable audit log. | **PASSED** |
| **SCN-11** | **Governed Analytical View (`vw_travel`)** | SQL analytical view exposing 36 standardized columns | Accessible via PostgreSQL (`SELECT * FROM vw_travel;`) and SQLite without schema discrepancies. | **PASSED** |
| **SCN-12** | **Power BI DirectQuery & DAX Layer** | Direct connection to `vw_travel` via Power BI Desktop | Evaluates 14 DAX measures (`Total Spend INR`, `Completed Travel Tickets`, `Cross-Border Spend %`, `Policy Violation Rate %`, `QoQ Spend Growth %`). | **PASSED** |
| **SCN-13** | **Security & Role-Aware Scoping** | JWT authentication and role-based access control | Manager has company-wide visibility; Employee is strictly restricted to personal travel bookings and allowance burn. | **PASSED** |
| **SCN-14** | **Health & Readiness Probes** | Probing `/health` and `/health/db` with lifespan event handling | Liveness returns healthy; readiness verifies active database connectivity. | **PASSED** |

---

## 2. Automated Test Suite Execution

Run the complete test suite from the repository root:

```bash
pytest -q
```

### Execution Output:
```
.........................................                                [100%]
41 passed in 19.35s (100% Pass Rate)
```

### Detailed Test Inventory (41 Tests):
1. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_auth_password_hashing_dynamic_salt` **PASSED**
2. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_currency_conversion` **PASSED**
3. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_database_governed_view_and_models` **PASSED**
4. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_iso_date_standardization` **PASSED**
5. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_jwt_token_generation_and_decode` **PASSED**
6. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_quarantined_record_structure` **PASSED**
7. `backend/services/test_runner.py::TestTravelAnalyticsSystem::test_scd_type2_temporal_enrichment` **PASSED**
8. `backend/tests/test_pipeline.py::test_1_staging_ingestion` **PASSED**
9. `backend/tests/test_pipeline.py::test_2_cleansing_inr_conversion` **PASSED**
10. `backend/tests/test_pipeline.py::test_3_cleansing_deduplication` **PASSED**
11. `backend/tests/test_pipeline.py::test_4_enrichment_employee_join` **PASSED**
12. `backend/tests/test_pipeline.py::test_5_enrichment_iso_country` **PASSED**
13. `backend/tests/test_pipeline.py::test_6_business_rules_travelled_flag_issued` **PASSED**
14. `backend/tests/test_pipeline.py::test_7_business_rules_travelled_flag_cancelled` **PASSED**
15. `backend/tests/test_pipeline.py::test_8_business_rules_travelled_flag_refunded` **PASSED**
16. `backend/tests/test_pipeline.py::test_9_business_rules_classification_domestic` **PASSED**
17. `backend/tests/test_pipeline.py::test_10_business_rules_classification_cross_border` **PASSED**
18. `backend/tests/test_pipeline.py::test_11_business_rules_classification_multi_country` **PASSED**
19. `backend/tests/test_pipeline.py::test_12_manual_override_respect` **PASSED**
20. `backend/tests/test_pipeline.py::test_13_vw_travel_view_exists` **PASSED**
21. `backend/tests/test_pipeline.py::test_14_forecasting_service` **PASSED**
22. `backend/tests/test_pipeline.py::test_15_scd_type2_temporal_enrichment` **PASSED**
23. `backend/tests/test_pipeline.py::test_16_auth_service_dynamic_salts` **PASSED**
24. `backend/tests/test_pipeline.py::test_17_jwt_token_lifecycle` **PASSED**
25. `backend/tests/test_pipeline.py::test_18_ai_assistant_service` **PASSED**
26. `backend/tests/test_pipeline.py::test_19_export_service` **PASSED**
27. `backend/tests/test_pipeline.py::test_20_fx_rate_auditable_conversion` **PASSED**
28. `backend/tests/test_pipeline.py::test_21_unknown_currency_quarantine_rejection` **PASSED**
29. `backend/tests/test_pipeline.py::test_22_pipeline_idempotency` **PASSED**
30. `backend/tests/test_pipeline.py::test_23_vw_travel_fx_lineage_columns` **PASSED**
31. `backend/tests/test_pipeline.py::test_24_role_aware_ai_assistant` **PASSED**
32. `backend/tests/test_pipeline.py::test_25_business_rules_travelled_flag_exchanged` **PASSED**
33. `backend/tests/test_pipeline.py::test_26_health_and_db_probes` **PASSED**
34. `backend/tests/test_pipeline.py::test_27_dashboard_stats_dynamic_filtering` **PASSED**
35. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_auth_password_hashing_dynamic_salt` **PASSED**
36. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_currency_conversion` **PASSED**
37. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_database_governed_view_and_models` **PASSED**
38. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_iso_date_standardization` **PASSED**
39. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_jwt_token_generation_and_decode` **PASSED**
40. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_quarantined_record_structure` **PASSED**
41. `backend/tests/test_system.py::TestTravelAnalyticsSystem::test_scd_type2_temporal_enrichment` **PASSED**

```
