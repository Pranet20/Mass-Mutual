# Power BI Desktop Refresh Validation Evidence Repository

This directory (`docs/powerbi-validation/`) stores visual verification artifacts and screen captures from the manual Power BI Desktop acceptance test on Windows.

---

## Required Visual Evidence Checklist

Upon opening `powerbi/Corporate_Travel_Analytics.pbix` in Microsoft Power BI Desktop on Windows and executing **Home → Refresh**, capture and store high-resolution PNG screenshots here:

| File Name | Description | Acceptance Criteria |
| :--- | :--- | :--- |
| `01_page1_executive_spend.png` | Page 1: Executive Spend Overview | Shows `chartTripsByMonth` column chart, Total Distinct Trips KPI card (`278`), Gross Spend, classification donut, and master ledger table. |
| `02_page2_travel_routes.png` | Page 2: Travel & Route Analytics | Shows `chartTripsByTravelSummary` column chart, channel spend mix pie chart, route summary slicer, and route ledger. |
| `03_page3_business_groups.png` | Page 3: Business Group Analytics | Shows `chartTripsByBusinessGroup` column chart, Spend by Business Group chart, `business_group` slicer, and employee ledger with `business_group` column. |
| `04_page4_policy_compliance.png` | Page 4: Policy Compliance & Governance | Shows compliance status breakdown, manager approval status donut, and override exception audit ledger. |
| `05_page5_fx_financial_audit.png`| Page 5: FX & Financial Audit | Shows spend by booking currency, Treasury reference FX rates bar chart, and multi-currency reconciliation ledger. |
| `06_refresh_success_dialog.png` | Refresh Completion Dialog | Screenshot showing the Power BI Desktop data refresh dialogue completing without connection errors. |
| `07_slicer_interaction.png` | Slicer Cross-Filtering Verification | Screenshot demonstrating dynamic visual re-filtering when toggling the `slicerBusinessGroup` control. |

---

## Acceptance Verification Protocol

1. Perform Level 1 automated validation:
   ```powershell
   python scripts/validate_powerbi_source.py
   pytest -q
   ```
2. Follow the 15-step manual testing procedure documented in:
   [`docs/POWERBI_DESKTOP_ACCEPTANCE_TEST.md`](../POWERBI_DESKTOP_ACCEPTANCE_TEST.md)
3. Save resulting evidence captures in this folder (`docs/powerbi-validation/`).
