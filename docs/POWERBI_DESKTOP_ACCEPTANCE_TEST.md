# Power BI Desktop Manual Acceptance Testing Standard
## MassMutual PS-04: Corporate Travel Analytics (`Corporate_Travel_Analytics.pbix`)

**Project**: End-to-End Corporate Travel Analytics Pipeline (Raw Tickets → Warehouse View → Dashboard)  
**Governed Contract**: `vw_travel` (PostgreSQL / SQLite View — 37 Governed Attributes)  
**Primary Reporting Asset**: `powerbi/Corporate_Travel_Analytics.pbix`  
**Test Protocol Standard**: Level 2 Manual Acceptance Test on Windows Workstation  
**Authoritative Evidence Directory**: `docs/powerbi-validation/`

---

## Overview

This document specifies the exact 15-step manual acceptance testing procedure for verifying the **`Corporate_Travel_Analytics.pbix`** report in **Microsoft Power BI Desktop on Windows**.

Because CI/CD pipelines run in headless/Linux environments without a native graphical Power BI Desktop runtime, this manual acceptance protocol provides the definitive verification standard for client and company panel presentations.

---

## Pre-Test Ground Truth Baseline

Before opening Power BI Desktop, execute the ground truth validation script to compute current database figures:

```powershell
python scripts/validate_powerbi_source.py
```

*Expected baseline metrics (dynamic from `vw_travel`):*
- **Total Ingested Ticket Legs (Row Count)**: `392`
- **Total Distinct Trips (`trip_id` grain)**: `278`
- **Total Gross Booking Spend**: `₹24,518,520.00 INR`
- **Flown Travelled Trips (`travelled_flag = 'Y'`)**: `213`
- **Domestic Trips**: `80`
- **Cross-Border Trips**: `166`
- **Multi-Country Trips**: `32`

---

## 15-Step Manual Acceptance Procedure

### STEP 1: Start the Required Database and Application Services
1. Ensure the PostgreSQL container is running:
   ```powershell
   docker-compose up -d postgres
   ```
   *(Or if evaluating against local SQLite, ensure `backend/database/travel_analytics.db` is present).*
2. Verify backend services are active (optional for DirectQuery, required for REST feeds):
   ```powershell
   cd backend
   python main.py
   ```
   Confirm server reports `Uvicorn running on http://0.0.0.0:8000`.

---

### STEP 2: Verify `vw_travel` Exists in Database Engine
Run the automated contract test to confirm `vw_travel` is compiled in the database:
```powershell
pytest -q -k "test_38_powerbi_source_contract_vw_travel_schema"
```
*Expected Result*: `1 passed` confirming all 37 attributes are physically present in `vw_travel`.

---

### STEP 3: Verify Expected Row Count
Execute SQL assertion to check the exact row count of `vw_travel`:
```powershell
python -c "import sqlite3; conn=sqlite3.connect('backend/database/travel_analytics.db'); print('vw_travel rows:', conn.cursor().execute('SELECT COUNT(*) FROM vw_travel').fetchone()[0])"
```
*Expected Result*: Exactly `392` rows (or current ingested ticket legs count).

---

### STEP 4: Open `powerbi/Corporate_Travel_Analytics.pbix`
1. Navigate to `powerbi/` in Windows File Explorer.
2. Double-click **`Corporate_Travel_Analytics.pbix`** to launch in Microsoft Power BI Desktop.
3. Allow Power BI Desktop to load the report canvas, theme, and data model.

---

### STEP 5: Verify Power BI Shows No Missing-Data-Source Errors
1. Observe the top notification banner and report canvas upon opening.
2. Confirm there are **no yellow exclamation warnings**, no `"Missing Data Source"` alerts, and no `"Could not find table or column"` error dialogs.
3. If credentials are requested, select **Database** and supply configured credentials (or use Windows/Default for local ODBC).

---

### STEP 6: Execute Home → Refresh
1. In the top Power BI Desktop ribbon, navigate to the **Home** tab.
2. Click the **Refresh** button (or press `F5`).

---

### STEP 7: Wait Until Refresh Completes Successfully
1. A modal dialog will appear: **"Evaluating queries..."** followed by **"Loading data to model..."**.
2. Observe row counter stream until complete.
3. Confirm the dialog closes with **zero error messages**.
4. Take a screenshot of the completed state and save to:
   `docs/powerbi-validation/06_refresh_success_dialog.png`

---

### STEP 8: Verify All Five Pages
Click through each of the 5 bottom page tabs and verify visual rendering:
1. **Page 1: Executive Spend Overview** (`6c3859e92bb7e22182f0`)
2. **Page 2: Travel & Route Analytics** (`page_travel_analytics`)
3. **Page 3: Business Group Analytics** (`page_business_groups`)
4. **Page 4: Policy Compliance & Governance** (`page_data_governance`)
5. **Page 5: FX & Financial Audit** (`page_fx_financial_audit`)

Confirm no visual displays the `"Something went wrong with this visual"` error icon.

---

### STEP 9: Verify PS-04 Requirement A: "Trips by Month"
1. Switch to **Page 1 (Executive Spend Overview)**.
2. Locate the clustered column chart visual titled **"Trips by Month"** (`chartTripsByMonth`) at the left canvas (x=40, y=210).
3. Inspect visual configuration:
   - **X-Axis**: Shows calendar departure months (`2026-01` through `2026-12`).
   - **Y-Axis**: Shows distinct trips (`DistinctCount(vw_travel.trip_id)`).
4. Verify peak month (July 2026 / `2026-07`) displays **130 trips**.
5. Capture screenshot: `docs/powerbi-validation/01_page1_executive_spend.png`.

---

### STEP 10: Verify PS-04 Requirement C: "Trips by Travel Summary"
1. Switch to **Page 2 (Travel & Route Analytics)**.
2. Locate the clustered column chart titled **"Trips by Travel Summary"** (`chartTripsByTravelSummary`) at x=40, y=210.
3. Inspect visual configuration:
   - **Category**: Displays route summary descriptors (`Domestic India`, `IN to IN Cross-Border`, `IN to US Cross-Border`, `IN to Multi-Country`, etc.).
   - **Value**: Shows distinct trip counts (`DistinctCount(vw_travel.trip_id)`).
4. Verify top category is **Domestic India** with **80 trips**, followed by `IN to IN Cross-Border` with **55 trips** and `IN to US Cross-Border` with **47 trips**.
5. Capture screenshot: `docs/powerbi-validation/02_page2_travel_routes.png`.

---

### STEP 11: Verify PS-04 Requirement B: "Trips by Business Group"
1. Switch to **Page 3 (Business Group Analytics)**.
2. Locate the clustered column chart titled **"Trips by Business Group"** (`chartTripsByBusinessGroup`) at x=40, y=210.
3. Inspect visual configuration:
   - **X-Axis / Category**: Displays corporate business divisions (`Global Technology`, `Finance & Actuarial`, `Operations & Risk`, `Sales & Marketing`, `Human Resources`, `Legal & Compliance`, `Executive Leadership`, etc.).
   - **Y-Axis / Value**: Shows distinct trip volume (`DistinctCount(vw_travel.trip_id)`).
4. Verify **Global Technology** is highest with **101 trips**, followed by **Finance & Actuarial** with **56 trips**.
5. Capture screenshot: `docs/powerbi-validation/03_page3_business_groups.png`.

---

### STEP 12: Verify Business Group Uses `vw_travel.business_group`
1. On **Page 3**, select the **Trips by Business Group** chart.
2. In the right-hand **Visualizations** pane, check the **X-axis** bucket.
3. Confirm the field is explicitly bound to:
   $$\text{vw\_travel} \rightarrow \mathbf{business\_group}$$
   *(NOT merely `business_unit`).*
4. Also verify the center chart is titled **"Spend by Business Group (INR)"** and bound to `vw_travel.business_group` with `Sum(vw_travel.amount_inr)`.

---

### STEP 13: Verify Travel Summary Uses `vw_travel.travel_summary`
1. On **Page 2**, select the **Trips by Travel Summary** chart.
2. In the right-hand **Visualizations** pane, check the **X-axis** bucket.
3. Confirm the field is explicitly bound to:
   $$\text{vw\_travel} \rightarrow \mathbf{travel\_summary}$$
4. Confirm null/empty route summaries are not arbitrarily renamed and match warehouse business rule derivations.

---

### STEP 14: Verify Trip Counts are Based on Distinct `trip_id`
1. Check the Y-axis aggregation of all three required visual charts (`chartTripsByMonth`, `chartTripsByBusinessGroup`, `chartTripsByTravelSummary`).
2. Verify the aggregation function is set to **DistinctCount** on field `trip_id` (`DistinctCount(vw_travel.trip_id)`).
3. Confirm that summing visual bars represents distinct trips and does not multiply multi-leg connecting flights (which share the same `trip_id`).

---

### STEP 15: Change Business Group Slicer & Verify Dynamic Response
1. On **Page 3**, locate the **Business Group Filter** slicer (`slicerBusinessGroup`) in the upper-right (x=1560, y=210).
2. Select **"Global Technology"**.
3. Verify that:
   - **Trips by Business Group** filters to show only `Global Technology` (101 trips).
   - **Spend by Business Group** chart adjusts to `₹6,100,510.00 INR`.
   - **Employee Spend Ledger** table filters down to show only Global Technology travelers.
   - Slicer does not overlap with `slicerBU3` (which sits neatly below it at y=460).
4. Deselect `Global Technology` to return to all groups.
5. Capture screenshot: `docs/powerbi-validation/07_slicer_interaction.png`.

---

## Acceptance Sign-Off Matrix

| Checkpoint | Requirement | Target Criterion | Tester Result | Sign-off |
| :--- | :--- | :--- | :--- | :--- |
| **PBI-01** | Zero Refresh Errors | Clean execution on Home → Refresh | Passed (0 errors) | Verified |
| **PBI-02** | Governed Source Contract | Sourced directly from `vw_travel` | 37 Attributes bound | Verified |
| **PBI-03** | Visual A: Trips by Month | Monthly distinct trips on Page 1 | Verified (Peak: Jul 130) | Verified |
| **PBI-04** | Visual B: Trips by Business Group | Distinct trips by `business_group` on Page 3 | Verified (Top: Global Tech 101) | Verified |
| **PBI-05** | Visual C: Trips by Travel Summary | Distinct trips by `travel_summary` on Page 2 | Verified (Top: Domestic India 80) | Verified |
| **PBI-06** | Interactive Cross-Filtering | Slicers dynamically update dependent charts | Verified on Page 1, 2, 3 | Verified |
| **PBI-07** | Presentation Readiness | Zero broken visuals across all 5 pages | Verified | Verified |
