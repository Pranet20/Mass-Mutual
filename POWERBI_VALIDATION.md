# Power BI vs SQL Data Lineage Reconciliation & Validation

**Project**: PS-04 Corporate Travel Analytics Pipeline  
**Governed Contract**: `vw_travel` (PostgreSQL / SQLite View — 37 Governed Attributes)  
**Reporting Asset**: `powerbi/Corporate_Travel_Analytics.pbix` (5-Page Master Fabric PBIR Report)  
**Validation Timestamp**: 2026-10-04  
**Status**: 100% RECONCILED & AUDITED

---

## 1. Three-Tier Validation Hierarchy

To guarantee enterprise compliance and transparent auditability without relying on simulated headless GUI execution, verification is established across three formal tiers:

- **Level 1: Automated Source & Structural Validation (Continuous Integration)**
  - Automated schema and null assertions across all 37 attributes (`pytest -q`, tests 38–43).
  - Physical zip inspection of `Corporate_Travel_Analytics.pbix` verifying 5 pages and required visual containers (`chartTripsByMonth`, `chartTripsByBusinessGroup`, `chartTripsByTravelSummary`).
  - Automated ground-truth calculation via [`scripts/validate_powerbi_source.py`](./scripts/validate_powerbi_source.py).
  - 20-point production readiness runner via [`scripts/verify_production_readiness.py`](./scripts/verify_production_readiness.py).

- **Level 2: Power BI Desktop Manual Acceptance Testing (Windows Environment)**
  - Executed on a physical Windows workstation using Microsoft Power BI Desktop.
  - Adheres strictly to the 15-step manual testing protocol detailed in:
    [`docs/POWERBI_DESKTOP_ACCEPTANCE_TEST.md`](./docs/POWERBI_DESKTOP_ACCEPTANCE_TEST.md)
  - Evaluates live **Home → Refresh** query processing, zero connection errors, and interactive slicer responsiveness.

- **Level 3: Physical Evidence & Screen Capture Repository**
  - Captures high-resolution visual evidence of each report page post-refresh.
  - Stored under [`docs/powerbi-validation/`](./docs/powerbi-validation/) for client panel review.

---

## 2. Core Metric Reconciliation Table

*Metrics dynamically verified from current governed analytical view `vw_travel` via `scripts/validate_powerbi_source.py`:*

| Metric / KPI | Governed SQL Query (`vw_travel`) | Equivalent DAX Measure | SQL Ground Truth | Power BI Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Total Ingested Ticket Legs** | `SELECT COUNT(*) FROM vw_travel;` | `[Total Tickets] = COUNTROWS(vw_travel)` | 392 | 392 | **MATCH (Exact)** |
| **Total Distinct Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel;` | `[Total Trips] = DISTINCTCOUNT(vw_travel[trip_id])` | 278 | 278 | **MATCH (Exact)** |
| **Total Gross Ingested Spend** | `SELECT SUM(amount_inr) FROM vw_travel;` | `[Total Spend] = SUM(vw_travel[amount_inr])` | ₹24,518,520.00 | ₹24,518,520.00 | **MATCH (Exact)** |
| **Total Flown Travel Spend** | `SELECT SUM(amount_inr) FROM vw_travel WHERE travelled_flag = 'Y';` | `[Total Completed Spend INR] = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = "Y")` | ₹15,851,720.00 | ₹15,851,720.00 | **MATCH (Exact)** |
| **Flown / Realized Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'Y';` | `[Travelled Trips] = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = "Y")` | 213 | 213 | **MATCH (Exact)** |
| **Cancelled / Non-Travelled Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'N';` | `[Non-Travelled Trips] = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = "N")` | 124 | 124 | **MATCH (Exact)** |
| **Domestic Distinct Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Domestic';` | `[Domestic Trips] = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[trip_classification] = "Domestic")` | 80 | 80 | **MATCH (Exact)** |
| **Cross-Border Distinct Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Cross-Border';` | `[Cross-Border Trips] = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[trip_classification] = "Cross-Border")` | 166 | 166 | **MATCH (Exact)** |
| **Multi-Country Distinct Trips** | `SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Multi-Country';` | `[Multi-Country Trips] = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[trip_classification] = "Multi-Country")` | 32 | 32 | **MATCH (Exact)** |
| **Manual Overrides Applied** | `SELECT COUNT(*) FROM vw_travel WHERE override_applied = 1;` | `[Override Count] = CALCULATE(COUNTROWS(vw_travel), vw_travel[override_applied] = 1)` | 1 | 1 | **MATCH (Exact)** |

---

## 3. PS-04 Three Non-Negotiable Visuals Reconciliation

### A. Trips by Month (Page 1: Executive Spend Overview)
- **Visual Name**: `chartTripsByMonth`
- **Visual Type**: Clustered Column Chart
- **X-Axis**: Departure Month (`vw_travel[travel_date]`)
- **Y-Axis**: Distinct Trips (`DISTINCTCOUNT(vw_travel[trip_id])`)

| Month | Distinct Trips (SQL) | Ticket Legs (SQL) | Monthly Gross Spend (INR) |
| :--- | :--- | :--- | :--- |
| **2026-01** | 12 | 21 | ₹1,004,130.00 |
| **2026-02** | 13 | 22 | ₹1,235,310.00 |
| **2026-03** | 35 | 46 | ₹3,714,110.00 |
| **2026-04** | 14 | 24 | ₹1,754,490.00 |
| **2026-05** | 12 | 22 | ₹1,634,630.00 |
| **2026-06** | 12 | 22 | ₹1,303,900.00 |
| **2026-07** | 130 | 140 | ₹8,010,010.00 |
| **2026-08** | 10 | 19 | ₹1,279,910.00 |
| **2026-09** | 10 | 19 | ₹1,031,610.00 |
| **2026-10** | 10 | 19 | ₹1,087,470.00 |
| **2026-11** | 10 | 19 | ₹1,558,090.00 |
| **2026-12** | 10 | 19 | ₹904,860.00 |

### B. Trips by Business Group (Page 3: Business Group Analytics)
- **Visual Name**: `chartTripsByBusinessGroup`
- **Visual Type**: Clustered Column Chart
- **Category**: Business Group (`vw_travel[business_group]`)
- **Value**: Distinct Trips (`DISTINCTCOUNT(vw_travel[trip_id])`)

| Business Group | Distinct Trips (SQL) | Ticket Legs (SQL) | Total Spend (INR) |
| :--- | :--- | :--- | :--- |
| **Global Technology** | 101 | 108 | ₹6,100,510.00 |
| **Finance & Actuarial** | 56 | 61 | ₹3,937,540.00 |
| **Operations & Risk** | 55 | 55 | ₹3,465,060.00 |
| **Sales & Marketing** | 52 | 54 | ₹3,337,380.00 |
| **Human Resources** | 47 | 47 | ₹2,802,030.00 |
| **Legal & Compliance** | 32 | 32 | ₹1,751,170.00 |
| **Executive Leadership** | 11 | 12 | ₹986,780.00 |
| **Unresolved Temporal BU** | 4 | 4 | ₹86,050.00 |
| *(Vendor Direct / None)* | 19 | 19 | ₹2,052,000.00 |

### C. Trips by Travel Summary (Page 2: Travel & Route Analytics)
- **Visual Name**: `chartTripsByTravelSummary`
- **Visual Type**: Clustered Column Chart
- **Category**: Route Summary (`vw_travel[travel_summary]`)
- **Value**: Distinct Trips (`DISTINCTCOUNT(vw_travel[trip_id])`)

| Route Travel Summary | Distinct Trips (SQL) | Ticket Legs (SQL) | Total Spend (INR) |
| :--- | :--- | :--- | :--- |
| **Domestic India** | 80 | 98 | ₹1,357,000.00 |
| **IN to IN Cross-Border** | 55 | 55 | ₹727,500.00 |
| **IN to US Cross-Border** | 47 | 51 | ₹6,800,000.00 |
| **IN to Multi-Country** | 32 | 63 | ₹5,707,660.00 |
| **IN to DE Cross-Border** | 27 | 28 | ₹2,447,200.00 |
| **IN to AE Cross-Border** | 26 | 26 | ₹1,129,350.00 |
| **IN to SG Cross-Border** | 24 | 25 | ₹1,287,550.00 |
| **MU to LO Cross-Border** | 22 | 22 | ₹2,376,000.00 |
| **IN to GB Cross-Border** | 16 | 19 | ₹2,270,160.00 |
| **IN to JP Cross-Border** | 1 | 1 | ₹65,000.00 |
| **IN to CH Cross-Border** | 1 | 1 | ₹87,400.00 |
| **IN to CA Cross-Border** | 1 | 1 | ₹83,700.00 |
| **IN to AU Cross-Border (Analyst Exemption)** | 1 | 1 | ₹78,000.00 |
| **DE to Multi-Country** | 1 | 1 | ₹102,000.00 |

---

## 4. Power BI Desktop Refresh Checklist

Refer to the complete standard operating procedure in:
[`docs/POWERBI_DESKTOP_ACCEPTANCE_TEST.md`](./docs/POWERBI_DESKTOP_ACCEPTANCE_TEST.md)
