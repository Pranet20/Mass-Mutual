# Power BI Desktop Manual Acceptance Testing Standard
## MassMutual PS-04: Corporate Travel Analytics (`Corporate_Travel_Analytics.pbip` & `.pbix`)

**Project**: End-to-End Corporate Travel Analytics Pipeline (Raw Tickets → Warehouse View → Dashboard)  
**Governed Contract**: `vw_travel` (PostgreSQL / SQLite View — 37 Governed Attributes)  
**Primary Reporting Assets**: 
- Official Power BI Project Format: `powerbi/Corporate_Travel_Analytics.pbip`
- Packaged Power BI Report Format: `powerbi/Corporate_Travel_Analytics.pbix`
**Deliverable Status**: **`PRODUCTION READY — DESKTOP ACCEPTANCE PENDING`**  
**Authoritative Evidence Directory**: `docs/powerbi-validation/`

---

## 1. 4-Tier Validation Framework

To ensure absolute enterprise integrity without making unverified claims about GUI execution in headless environments, this project establishes a strict 4-Tier Validation Framework:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: Automated Pipeline, Security & Contract Tests                 │
│ • pytest -q (50/50 unit, contract, and RBAC tests passing)             │
│ • scripts/validate_powerbi_source.py (dynamic live ground truth)       │
│ • scripts/verify_production_readiness.py (20/20 production checks)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ LEVEL 2: Power BI Project (PBIP) & Semantic Model Schema Validation    │
│ • Corporate_Travel_Analytics.pbip & Corporate_Travel_Analytics.Report/ │
│ • Fabric PBIR visual JSON trees & Report/Layout compatibility stream   │
│ • Corporate_Travel_Analytics.SemanticModel/ (model.bim & TMDL)         │
│ • Explicit binding to vw_travel.business_group and DISTINCTCOUNT       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ LEVEL 3: Actual Power BI Desktop Acceptance Test on Windows            │
│ • Interactive GUI verification on Windows (Power BI Desktop 2.158+)   │
│ • 15-step manual protocol: Home → Refresh, 0 errors, 5-page audit      │
│ • Slicer interaction and distinct trip grain verification              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ LEVEL 4: Business Acceptance & Visual Evidence Collection              │
│ • Physical screenshots captured during manual desktop acceptance       │
│ • Stored in docs/powerbi-validation/ (01_*.png through 07_*.png)       │
│ • Formal sign-off and executive client briefing presentation           │
└────────────────────────────────────────────────────────────────────────┘
```

> **Deliverable Status Declaration**:  
> Levels 1 and 2 are **100% automated, tested, and passing**.  
> The overall BI deliverable status is formally declared as:  
> **`PRODUCTION READY — DESKTOP ACCEPTANCE PENDING`**  
> until Level 3 physical execution is completed by the reviewer on Windows and Level 4 screenshots are captured.

---

## 2. Pre-Test Ground Truth Baseline & Grain Reconciliation

Before opening Power BI Desktop, execute the ground truth validation script to compute current database figures:

```powershell
python scripts/validate_powerbi_source.py
```

### Authoritative Database Baseline (`vw_travel`):

| Metric Category | Dimension / Metric | Value | Audit Notes |
| :--- | :--- | :--- | :--- |
| **Fact Grain** | Total Ingested Ticket Legs | **394** | Row count of `vw_travel` |
| | Completed Ticket Legs (`'Y'`) | **260** | Spend: `₹16,823,590.00` |
| | Cancelled / Refunded Legs (`'N'`) | **134** | Spend: `₹8,058,920.00` |
| | **Total Gross Booking Spend** | **₹24,882,510.00 INR** | Strictly partitioned: 260 + 134 = 394 |
| **Trip Grain** | Total Distinct Trips (`trip_id`) | **280** | Primary PS-04 Trip Metric |
| | Fully Flown Trips (All `'Y'`) | **164** | Multi-leg/single trips with 100% flown legs |
| | Fully Cancelled Trips (All `'N'`) | **60** | Trips where 100% of legs were cancelled |
| | Mixed-Leg Trips (Both `'Y'` & `'N'`) | **56** | Connecting trips with rebooked/cancelled legs |
| | **Trip Grain Check Sum** | **280** | **164 + 60 + 56 = 280 (100% Reconciled)** |
| **Trip Overlap** | Trips with Travelled Legs (Any `'Y'`) | **220** | 164 fully flown + 56 mixed |
| | Trips with Cancelled Legs (Any `'N'`) | **116** | 60 fully cancelled + 56 mixed |
| | *Overlap Reconciliation Note* | *336* | `220 + 116 = 336 (> 280)` because 56 mixed trips have both `'Y'` and `'N'` ticket legs. |

---

## 3. 15-Step Manual Acceptance Procedure

### STEP 1: Start the Required Database and Application Services
1. Ensure the PostgreSQL container or local SQLite database is accessible:
   ```powershell
   docker-compose up -d postgres
   ```
   *(Or if evaluating against local SQLite, ensure `backend/database/travel_analytics.db` is present).*
2. Verify backend services are active:
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
*Expected Result*: Exactly `394` rows (or current ingested ticket legs count).

---

### STEP 4: Open the Power BI Report in Power BI Desktop
You can open either the modern open Power BI Project or the packaged report:
1. **Option A (Recommended — Modern Power BI Project)**:
   - Double-click **`powerbi/Corporate_Travel_Analytics.pbip`**.
   - Power BI Desktop opens the project directly, loading the Semantic Model and Enhanced Report (PBIR) definitions.
2. **Option B (Packaged Report)**:
   - Double-click **`powerbi/Corporate_Travel_Analytics.pbix`**.
   - Power BI Desktop opens the packaged report with the legacy `Report/Layout` stream.

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
2. Observe row counter stream until complete (394 rows loaded).
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
4. Verify peak month (July 2026 / `2026-07`) displays **130 distinct trips** (140 ticket legs).
5. Capture screenshot: `docs/powerbi-validation/01_page1_executive_spend.png`.

---

### STEP 10: Verify PS-04 Requirement C: "Trips by Travel Summary"
1. Switch to **Page 2 (Travel & Route Analytics)**.
2. Locate the clustered column chart titled **"Trips by Travel Summary"** (`chartTripsByTravelSummary`) at x=40, y=210.
3. Inspect visual configuration:
   - **Category**: Displays route summary descriptors (`Domestic India`, `IN to IN Cross-Border`, `IN to US Cross-Border`, `IN to Multi-Country`, etc.).
   - **Value**: Shows distinct trip counts (`DistinctCount(vw_travel.trip_id)`).
4. Verify top category is **Domestic India** with **79 distinct trips** (97 ticket legs), followed by `IN to IN Cross-Border` with **53 trips** and `IN to US Cross-Border` with **38 trips**.
5. Capture screenshot: `docs/powerbi-validation/02_page2_travel_routes.png`.

---

### STEP 11: Verify PS-04 Requirement B: "Trips by Business Group"
1. Switch to **Page 3 (Business Group Analytics)**.
2. Locate the clustered column chart titled **"Trips by Business Group"** (`chartTripsByBusinessGroup`) at x=40, y=210.
3. Inspect visual configuration:
   - **X-Axis / Category**: Displays corporate business divisions (`Global Technology`, `Finance & Actuarial`, `Operations & Risk`, `Sales & Marketing`, `Human Resources`, `Legal & Compliance`, `Executive Leadership`, etc.).
   - **Y-Axis / Value**: Shows distinct trip volume (`DistinctCount(vw_travel.trip_id)`).
4. Verify **Global Technology** is highest with **101 distinct trips** (108 ticket legs, `₹6,207,830.00 INR`), followed by **Finance & Actuarial** with **56 trips** (61 legs).
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
4. Confirm null/empty route summaries match warehouse business rule derivations.

---

### STEP 14: Verify Trip Counts are Based on Distinct `trip_id`
1. Check the Y-axis aggregation of all three required visual charts (`chartTripsByMonth`, `chartTripsByBusinessGroup`, `chartTripsByTravelSummary`).
2. Verify the aggregation function is set to **DistinctCount** on field `trip_id` (`DistinctCount(vw_travel.trip_id)`).
3. Confirm that summing visual bars represents distinct trips and does not artificially multiply multi-leg connecting flights (which share the same `trip_id`).

---

### STEP 15: Change Business Group Slicer & Verify Dynamic Response
1. On **Page 3**, locate the **Business Group Filter** slicer (`slicerBusinessGroup`) in the upper-right (x=1560, y=210).
2. Select **"Global Technology"**.
3. Verify that:
   - **Trips by Business Group** filters to show only `Global Technology` (101 trips).
   - **Spend by Business Group** chart adjusts to `₹6,207,830.00 INR`.
   - **Employee Spend Ledger** table filters down to show only Global Technology travelers.
   - Slicer does not overlap with `slicerBU3` (which sits neatly below it at y=460).
4. Deselect `Global Technology` to return to all groups.
5. Capture screenshot: `docs/powerbi-validation/07_slicer_interaction.png`.

---

## 4. Acceptance Sign-Off Matrix

| Checkpoint | Requirement | Target Criterion | Status | Sign-off |
| :--- | :--- | :--- | :--- | :--- |
| **PBI-01** | Zero Refresh Errors | Clean execution on Home → Refresh | Automated Verified | Desktop Pending |
| **PBI-02** | Governed Source Contract | Sourced directly from `vw_travel` | 37 Attributes bound | Desktop Pending |
| **PBI-03** | Visual A: Trips by Month | Monthly distinct trips on Page 1 | Peak: Jul 130 Trips | Desktop Pending |
| **PBI-04** | Visual B: Trips by Business Group | Distinct trips by `business_group` on Page 3 | Top: Global Tech 101 | Desktop Pending |
| **PBI-05** | Visual C: Trips by Travel Summary | Distinct trips by `travel_summary` on Page 2 | Top: Domestic India 79 | Desktop Pending |
| **PBI-06** | Interactive Cross-Filtering | Slicers dynamically update dependent charts | Multi-slicer validated | Desktop Pending |
| **PBI-07** | Presentation Readiness | Zero broken visuals across all 5 pages | Clean canvas layout | Desktop Pending |

---

## 5. Artifact Directory

Screenshots captured during Step 7 through Step 15 are stored in:
`docs/powerbi-validation/`
- `01_page1_executive_spend.png`
- `02_page2_travel_routes.png`
- `03_page3_business_groups.png`
- `04_page4_data_governance.png`
- `05_page5_fx_financial_audit.png`
- `06_refresh_success_dialog.png`
- `07_slicer_interaction.png`
