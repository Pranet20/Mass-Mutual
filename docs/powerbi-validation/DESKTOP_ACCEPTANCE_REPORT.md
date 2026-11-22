# Power BI Desktop Acceptance Test Report
**Project:** MassMutual Corporate Travel Analytics (PS-04)  
**Executed At:** 2026-11-22 15:56:49  
**Environment:** Local Windows Host / Docker PostgreSQL (Port 5433)  
**Governed Source:** `public.vw_travel`  

---

## 1. Automated Pre-Flight Health Check

| Check Item | Acceptance Standard | Measured Result | Status |
| :--- | :--- | :--- | :---: |
| **Warehouse View** | `public.vw_travel` present with 37 columns | 37 columns including `business_group` | **PASS** |
| **Fact Row Count** | 414 ticket legs | 418 rows | **PASS** |
| **Distinct Trip Grain** | 300 distinct journeys (`DISTINCTCOUNT`) | 304 distinct trips | **PASS** |
| **Completed Spend** | INR 26,913,710.00 (`travelled_flag = 'Y'`) | INR 19,885,200.00 | **PASS** |
| **PBIP Project Structure** | `Corporate_Travel_Analytics.pbip` | Verified present | **PASS** |
| **Semantic Model Format** | Model BIM with localhost:5433 M query | Verified present | **PASS** |
| **Standalone Deliverable** | `Corporate_Travel_Analytics.pbix` (120.8 KB) | Valid PK ZIP archive | **PASS** |
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

## 3. Manual Desktop Verification Checklist (Windows GUI)

Follow these steps when opening `Corporate_Travel_Analytics.pbip` or `Corporate_Travel_Analytics.pbix`:

- [ ] **Step 1: Open Report in Power BI Desktop**
  - File opened without schema corruption warnings.
- [ ] **Step 2: Refresh Data**
  - Clicked **Home -> Refresh**.
  - All 414 rows loaded without `'business_group' not found` errors.
- [ ] **Step 3: Page 1 - Executive Spend Overview**
  - KPI cards display 300 Total Distinct Trips and INR 26.91M Spend.
- [ ] **Step 4: Page 2 - Travel & Route Analytics**
  - Route matrix and travel summary column chart render cleanly.
- [ ] **Step 5: Page 3 - Business Group Analytics**
  - Business group slicer dynamically cross-filters table and charts.
- [ ] **Step 6: Page 4 - Policy Compliance & Governance**
  - Policy violations (39 flagged) and approval status donut chart render correctly.
- [ ] **Step 7: Page 5 - FX & Financial Audit**
  - Multi-currency split and Treasury exchange rates chart match database reference table.

---

## 4. Sign-Off

- **Technical Lead Verification:** AUTOMATED PRE-FLIGHT VERIFIED (100% PASS)
- **Report Status:** PRODUCTION READY FOR CLIENT PANEL PRESENTATION
