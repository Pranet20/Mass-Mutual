# Power BI Data Model Specification — `vw_travel`

## Overview
The data model for the Corporate Travel Analytics platform is organized as a unified analytical view (`vw_travel`) conforming to an enterprise Star Schema representation. Each record represents an individual travel ticket enriched with SCD Type 2 employee history, geographic master data, financial FX lineage, policy compliance evaluations, and audited analyst overrides.

---

## Authoritative Data Dictionary (36 Governed Attributes)

### 1. Primary Keys & Identifiers
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `ticket_id` | `VARCHAR(50)` | Unique travel ticket number (Fact Key) | `TCK-8001` |
| `trip_id` | `VARCHAR(50)` | Associated multi-leg itinerary identifier | `TRP-101` |
| `batch_id` | `VARCHAR(50)` | ETL Ingestion batch identifier | `BATCH_20260904_183224_195145` |
| `employee_id` | `VARCHAR(50)` | Corporate employee identifier (Dimension Key) | `EMP-1001` |

### 2. Employee Master Dimension (Point-in-Time SCD Type 2)
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `employee_name` | `VARCHAR(100)` | Full name of the traveling employee | `Rajesh Sharma` |
| `business_unit` | `VARCHAR(100)` | Business Unit at the time of travel | `Global Technology` |
| `department` | `VARCHAR(100)` | Department at the time of travel | `Software Engineering` |

### 3. Temporal & Booking Dates
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `issue_date` | `VARCHAR(30)` / `DATE` | Date ticket was booked/issued (ISO `YYYY-MM-DD`) | `2026-01-05` |
| `travel_date` | `VARCHAR(30)` / `DATE` | Departure travel date (ISO `YYYY-MM-DD`) | `2026-01-12` |
| `return_date` | `VARCHAR(30)` / `DATE` | Return arrival date (ISO `YYYY-MM-DD`) | `2026-01-15` |

### 4. Route & Geographic Dimension
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `origin_city` | `VARCHAR(100)` | Departure city | `Bengaluru` |
| `origin_country` | `VARCHAR(100)` | Departure country name | `India` |
| `dest_city` | `VARCHAR(100)` | Arrival destination city | `Mumbai` |
| `dest_country` | `VARCHAR(100)` | Arrival destination country name | `India` |
| `origin_iso` | `VARCHAR(10)` | ISO Alpha-2 country code for origin | `IN` |
| `dest_iso` | `VARCHAR(10)` | ISO Alpha-2 country code for destination | `IN` |

### 5. Financial & Auditable FX Lineage
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `amount_original` | `FLOAT` | Raw transaction amount in booking currency | `14500.00` |
| `currency` | `VARCHAR(10)` | Booking transaction currency code | `INR` |
| `fx_rate` | `FLOAT` | Applied exchange rate to INR | `1.0000` |
| `amount_inr` | `FLOAT` | Total spend converted to INR base currency | `14500.00` |
| `fx_rate_date` | `VARCHAR(30)` | Effective date of the FX conversion rate | `2026-01-01` |
| `fx_source` | `VARCHAR(100)` | Authoritative lineage source of FX conversion | `Corporate Treasury Fixed 2026` |

### 6. Booking Channel & Policy Compliance
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `booking_channel` | `VARCHAR(50)` | Booking channel (`Amadeus GDS`, `Sabre GDS`, `Corporate Portal`) | `Amadeus GDS` |
| `cabin_class` | `VARCHAR(50)` | Travel class (`Economy`, `Premium Economy`, `Business`) | `Economy` |
| `ticket_status` | `VARCHAR(50)` | Booking state (`ISSUED`, `CANCELLED`, `REFUNDED`, `EXCHANGED`) | `ISSUED` |
| `travelled_flag` | `VARCHAR(5)` | Calculated indicator (`Y` if flown, `N` if cancelled/refunded/exchanged) | `Y` |
| `trip_classification` | `VARCHAR(50)` | Route classification (`Domestic`, `Cross-Border`, `Multi-Country`) | `Domestic` |
| `travel_summary` | `VARCHAR(100)` | Standardized route summary label | `Domestic India` |
| `policy_compliance_status` | `VARCHAR(50)` | Compliance status (`COMPLIANT`, `NON_COMPLIANT_CABIN`, etc.) | `COMPLIANT` |
| `policy_violation_reason` | `VARCHAR(200)` | Reason for policy flag if applicable | `None` |
| `approval_status` | `VARCHAR(50)` | Manager approval state (`APPROVED`, `REJECTED`, `PENDING_APPROVAL`) | `APPROVED` |
| `rejection_reason` | `VARCHAR(200)` | Reason for manager rejection if applicable | `None` |

### 7. Governance, Overrides & Cryptographic Lineage
| Column Name | SQL Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `override_applied` | `INTEGER` | `1` if analyst applied manual override, `0` otherwise | `0` |
| `record_hash` | `VARCHAR(64)` | Canonical SHA-256 record hash across business fields | `a7f93b...` |
| `source_file` | `VARCHAR(150)` | Source vendor CSV filename | `travel_raw_tickets.csv` |
| `updated_at` | `DATETIME` | Timestamp of last database record update | `2026-09-04 18:32:24` |

---

## Star Schema Logical Relationship Mapping

```
     ┌────────────────────────────────────────────────────────┐
     │                     Dim_Employee                       │
     │  (employee_id, employee_name, business_unit, dept...)  │
     └───────────────────────────┬────────────────────────────┘
                                 │ 1
                                 │
                                 │ *
┌──────────────────────┐   ┌─────┴────────────────┐   ┌──────────────────────┐
│       Dim_Date       │ 1 │                      │ 1 │     Dim_Geography    │
│ (travel_date, month, ├───┤    Fact_vw_travel    ├───┤  (origin_country,    │
│  quarter, year...)   │ * │ (ticket_id, amount...)│ * │   dest_country, etc.)│
└──────────────────────┘   └─────┬────────────────┘   └──────────────────────┘
                                 │ *
                                 │
                                 │ 1
     ┌───────────────────────────┴────────────────────────────┐
     │                      Dim_FXRate                        │
     │      (currency, fx_rate, fx_rate_date, fx_source)      │
     └────────────────────────────────────────────────────────┘
```
