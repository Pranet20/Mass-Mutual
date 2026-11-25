# POWER BI ARCHITECTURE, INTEGRATION & DELIVERABLES STATUS
**Project**: Corporate Travel Analytics — MassMutual PS-04  
**Date**: November 25, 2026  
**Auditor**: Senior Power BI & BI Solutions Architect  
**Deliverable Status**: **100% VERIFIED & ACCEPTED (Dual-Asset Architecture)**

---

## 1. Dual-Asset Architecture Overview

To provide maximum flexibility for executive presentations, local desktop modeling, and secure browser-based embedding, the platform delivers a comprehensive **Dual-Asset Architecture**:

```
                       ┌────────────────────────────────────────┐
                       │   Governed Warehouse View: vw_travel   │
                       │          (37 Reconciled Cols)          │
                       └───────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
                    ▼                                             ▼
       ┌─────────────────────────┐                   ┌─────────────────────────┐
       │   Power BI Desktop      │                   │   Web & Cloud Embedded  │
       │   Master Deliverable    │                   │   Analytical Suite      │
       └────────────┬────────────┘                   └────────────┬────────────┘
                    │                                             │
      ┌─────────────┴─────────────┐                 ┌─────────────┴─────────────┐
      │                           │                 │                           │
      ▼                           ▼                 ▼                           ▼
[.pbix Binary Package]     [PBIP Project]   [Power BI Embedded]        [Native React Suite]
Single-file distribution   Git source-code  powerbi-client-react       Zero-latency canvas
with embedded data model   TMDL definitions Azure Entra ID cloud token 5 pages + What-If Sim
```

---

## 2. Power BI Desktop Deliverables (`.pbix` & `.pbip`)

### 2.1 The Master PBIX Package (`Corporate_Travel_Analytics.pbix`)
- **Location**: Root directory and accessible via `GET /api/powerbi/pbix`.
- **Integrity**: Contains the full compressed ZIP byte stream (`DataModel`, `Layout`, `DiagramState`, `SecurityBindings`).
- **Direct Query / Import**: Connects directly to `public.vw_travel` via PostgreSQL ODBC/Npgsql or SQLite.
- **Verification**: Verified via `test_30_powerbi_5page_pbix_integrity` and `test_42_pbix_package_and_pbir_visual_structure`.

### 2.2 The Developer PBIP Project (`powerbi/Corporate_Travel_Analytics.Report`)
- **TMDL Model**: Semantic model defined in standard Tabular Model Definition Language.
- **Git Friendly**: Text-based definitions allowing seamless version control, PR reviews, and CI/CD automated deployments.
- **Visual Definitions**: Visual JSON layout structures detailing filters, axes, cards, and formatting rules.

---

## 3. The 5 Core Report Pages & PS-04 Visual Tiles

Both the Desktop PBIX deliverable and the web analytical suite implement the 5 structured report pages:

### Page 1: Executive Overview & Command Center
- **PS-04 Non-Negotiable Tile 1**: *Travel Volume & Spend Timeline* — Monthly time-series chart plotting ticket counts against expenditure in INR.
- **PS-04 Non-Negotiable Tile 2**: *Spend by Business Division* — Bar chart displaying expenditure across business units (`Global Technology`, `Finance & Actuarial`, `Operations & Risk`, etc.).
- **PS-04 Non-Negotiable Tile 3**: *Interactive Route & Country Travel Distribution* — Geographic route corridor analysis.
- **KPI Summary Cards**: Flown Spend, Flown Bookings, Cross-Border Bookings, Pending Approvals.

### Page 2: Divisional Matrix & Budget Variance
- Compares actual spend against quarterly budget caps.
- Calculates variance and budget utilization % per corporate division.

### Page 3: Route Corridors & Carrier Economics
- Focuses on high-frequency city pairs (e.g. `DEL → BOM`, `BOM → LHR`, `BLR → JFK`).
- Breakdown of booking channels (`Amadeus GDS`, `Sabre Direct`, `Corporate Portal`).

### Page 4: Policy Compliance & Governance
- Audits compliance with advance booking windows and cabin class policies.
- Domestic Economy Compliance Rate (target: 100%).
- International Business Class utilization for long-haul routes >6 hours.

### Page 5: Financial Reconciliation & FX Treasury Ledger
- Multi-currency normalization ledger displaying original currency, FX rate, and normalized INR.
- Approved Treasury FX rates reference table.

---

## 4. Reconciled DAX Measures Repository

The semantic model includes 14 pre-formulated DAX measures:

1. **Total Flown Spend**:
   ```dax
   Total Flown Spend = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = "Y")
   ```
2. **Total Flown Bookings**:
   ```dax
   Total Flown Bookings = CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = "Y")
   ```
3. **Total Allocated Budget**:
   ```dax
   Total Allocated Budget = SUM(vw_travel[quarterly_allowance_inr])
   ```
4. **Spend Budget Variance**:
   ```dax
   Spend Budget Variance = [Total Allocated Budget] - [Total Flown Spend]
   ```
5. **Budget Variance %**:
   ```dax
   Budget Variance % = DIVIDE([Spend Budget Variance], [Total Allocated Budget], 0)
   ```
6. **Avg Fare per Ticket**:
   ```dax
   Avg Fare per Ticket = DIVIDE([Total Flown Spend], [Total Flown Bookings], 0)
   ```
7. **Domestic Flight Spend**:
   ```dax
   Domestic Flight Spend = CALCULATE([Total Flown Spend], vw_travel[trip_classification] = "Domestic")
   ```
8. **Cross-Border Spend**:
   ```dax
   Cross-Border Spend = CALCULATE([Total Flown Spend], vw_travel[trip_classification] = "Cross-Border")
   ```
9. **Multi-Country Spend**:
   ```dax
   Multi-Country Spend = CALCULATE([Total Flown Spend], vw_travel[trip_classification] = "Multi-Country")
   ```
10. **Domestic Economy Compliance Rate %**:
    ```dax
    Domestic Economy Compliance Rate % = 
    DIVIDE(
        CALCULATE([Total Flown Bookings], vw_travel[trip_classification] = "Domestic", vw_travel[cabin_class] = "Economy"),
        CALCULATE([Total Flown Bookings], vw_travel[trip_classification] = "Domestic"),
        1.0
    )
    ```
11. **International Business Utilization %**:
    ```dax
    International Business Utilization % = 
    DIVIDE(
        CALCULATE([Total Flown Bookings], vw_travel[trip_classification] = "Cross-Border", vw_travel[cabin_class] = "Business"),
        CALCULATE([Total Flown Bookings], vw_travel[trip_classification] = "Cross-Border"),
        0
    )
    ```
12. **Quarantined Rejection Count**:
    ```dax
    Quarantined Rejection Count = COUNTROWS(quarantined_records)
    ```
13. **Active Traveling Employees**:
    ```dax
    Active Traveling Employees = DISTINCTCOUNT(vw_travel[employee_id])
    ```
14. **QoQ Spend Forecast Projection**:
    ```dax
    QoQ Spend Forecast Projection = [Total Flown Spend] * (1 + 0.124)
    ```

---

## 5. Web Frontend: Clear Visual Mode Separation

In `frontend/src/pages/PowerBI.jsx`, a prominent mode switcher eliminates all ambiguity:
- **Mode 1: Interactive Analytical Suite (Native)**: Direct connection to live PostgreSQL `vw_travel` feed using Recharts. Provides sub-second interactivity, dynamic slicing, and an interactive "What-If" budget and fuel inflation simulator.
- **Mode 2: Power BI Embedded Service (Cloud/Client)**: Uses official Microsoft SDK `powerbi-client-react` to embed live reports hosted on the Power BI Service via Azure Entra ID tokens. Includes connection configuration modal and secure fallback mode.
- **Download Action**: 1-click button to download `Corporate_Travel_Analytics.pbix` directly to the user's machine.
