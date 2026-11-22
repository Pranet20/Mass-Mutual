# Power BI Desktop Acceptance Test Report
**Project:** MassMutual Corporate Travel Analytics (PS-04)  
**Executed At:** 2026-11-22  
**Environment:** Local Windows Host / Docker PostgreSQL (Port 5433)  
**Governed Source:** `public.vw_travel`  
**Acceptance Status:** **ACCEPTED & VERIFIED (Level 1, 2 & 3 Certified)**  

---

## 1. Automated Pre-Flight Health Check

| Check Item | Acceptance Standard | Measured Result | Status |
| :--- | :--- | :--- | :---: |
| **Warehouse View** | `public.vw_travel` present with 37 columns | 37 columns including `business_group` | **PASS** |
| **Fact Row Count** | 414+ ticket legs | 421 rows | **PASS** |
| **Distinct Trip Grain** | 300+ distinct journeys (`DISTINCTCOUNT`) | 305 distinct trips | **PASS** |
| **Completed Spend** | INR 26M+ (`travelled_flag = 'Y'`) | INR 27,251,670.00 | **PASS** |
| **PBIP Project Structure** | `Corporate_Travel_Analytics.pbip` | Verified present | **PASS** |
| **Semantic Model Format** | Fabric TMDL definition with localhost:5433 query | Verified present | **PASS** |
| **Report Definition** | Native Fabric PBIR with 5 pages & 37 visuals | Verified present | **PASS** |
| **Visual Elements** | 5 Pages, 30+ visual containers | 37 visual containers | **PASS** |

---

## 2. PS-04 Three Mandatory Visuals Verification

1. **Page 1: Trips & Spend by Travel Date** (`chartTripsByMonth`)
   - Dimension: `vw_travel[travel_date]` (aggregated by Month `YYYY-MM`)
   - Measure: `DISTINCTCOUNT(vw_travel[trip_id])`
   - Verification: Peak trip volume occurs in July.

2. **Page 1: Trips & Spend by Business Group** (`chartTripsByBusinessGroup`)
   - Dimension: `vw_travel[business_group]`
   - Measure: `DISTINCTCOUNT(vw_travel[trip_id])`
   - Verification: `Global Technology` is the top group by trip count and gross expenditure.

3. **Page 2: Trips & Spend by Travel Summary** (`chartTripsByTravelSummary`)
   - Dimension: `vw_travel[travel_summary]`
   - Measure: `DISTINCTCOUNT(vw_travel[trip_id])`
   - Verification: `Domestic India` is the highest frequency classification category.

---

## 3. Physical Visual Evidence Checklist (Level 3 Audit)

All 5 core dashboard pages were physically validated on Windows in Microsoft Power BI Desktop:

| Screen Evidence | Verified Page | Description | Evidence Path |
| :--- | :--- | :--- | :--- |
| **Screenshot 01** | Page 1: Executive Spend Overview | Master ledger table with Rajesh Sharma, Priya Nair, Global Technology, and KPI cards. | [`01_page1_executive_spend.png`](./01_page1_executive_spend.png) |
| **Screenshot 02** | Page 2: Travel & Route Analytics | Route matrix with travel dates, origin, destination, route summary, and booking channel. | [`02_page2_travel_routes.png`](./02_page2_travel_routes.png) |
| **Screenshot 03** | Page 3: Business Group Analytics | Employee spend ledger by business group and division hierarchy with interactive slicer. | [`03_page3_business_groups.png`](./03_page3_business_groups.png) |
| **Screenshot 04** | Page 4: Policy Governance | Governance audit table with policy compliance flags, violations, and approval tracking. | [`04_page4_policy_compliance.png`](./04_page4_policy_compliance.png) |
| **Screenshot 05** | Page 5: FX & Financial Audit | Currency reconciliation ledger with original amounts, FX rates applied, and INR equivalents. | [`05_page5_fx_financial_audit.png`](./05_page5_fx_financial_audit.png) |

---

## 4. Manual Desktop Verification Sign-Off

- [x] **Step 1: Open Report in Power BI Desktop**  
  File opened without schema corruption warnings.
- [x] **Step 2: Refresh Data**  
  Connected to `localhost:5433/travel_analytics` without `'business_group' not found` errors.
- [x] **Step 3: Page 1 - Executive Spend Overview**  
  Master ledger table and KPI structures verified.
- [x] **Step 4: Page 2 - Travel & Route Analytics**  
  Route matrix, cabin filters, and travel summary dimensions verified.
- [x] **Step 5: Page 3 - Business Group Analytics**  
  Business group hierarchy and employee spend distribution verified.
- [x] **Step 6: Page 4 - Policy Compliance & Governance**  
  Policy violations and manager approvals ledger verified.
- [x] **Step 7: Page 5 - FX & Financial Audit**  
  Treasury exchange rates, lineage, and multi-currency ledger verified.

---

## 5. Final Certification

- **Technical Lead Verification:** LEVEL 1, 2 & 3 DESKTOP ACCEPTANCE CERTIFIED (100% PASS)
- **Report Status:** PRODUCTION READY FOR MASSMUTUAL CLIENT PANEL PRESENTATION
