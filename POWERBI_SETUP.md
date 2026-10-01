# MassMutual Corporate Travel Analytics — Power BI Desktop Setup & Specification (PS-04)

This guide provides instructions for connecting Power BI Desktop to the Corporate Travel Analytics warehouse and details the 5 pre-built reporting pages and 14 enterprise DAX measures.

---

## 1. Connecting Power BI Desktop

The report file is located at:
`powerbi/Corporate_Travel_Analytics.pbix`

It can also be downloaded directly from the web interface under the **Power BI Analytics** tab by clicking **"Download Power BI Report (.pbix)"**.

### Method A: DirectQuery / PostgreSQL Connection (Recommended for Enterprise)
1. Open Power BI Desktop.
2. Select **Get Data** -> **PostgreSQL database**.
3. Server: `localhost:5432` (or your PostgreSQL host).
4. Database: `travel_analytics`.
5. Data Connectivity mode: Select **DirectQuery** or **Import**.
6. In Navigator, select the governed analytical view: `vw_travel`.
7. Click **Load**.

### Method B: REST Web Connector (Using Governed Live Feed)
1. In Power BI Desktop, select **Get Data** -> **Web**.
2. URL: `http://localhost:8000/api/powerbi/feed?token=<YOUR_JWT_TOKEN>`.
3. In Power Query Editor, click **Into Table** -> **Close & Apply**.

---

## 2. 5-Page Analytical Report Architecture (PBIR)

The report adheres to the Microsoft Fabric Enhanced Report Format (PBIR) containing 5 specialized analytical pages:

| Page # | Page Name | Core Focus & Analytical Questions Answered | Visual Elements Included |
| :---: | :--- | :--- | :--- |
| **Page 1** | **Executive Spend Overview** | High-level executive KPIs, divisional spend distribution, realized vs cancelled spend. | 4 KPI Cards, BU Spend Bar Chart, Classification Donut, Interactive Slicers, Master Ledger Table. |
| **Page 2** | **Travel & Route Analytics** | Flight traffic patterns, top origin-destination pairs, seasonal travel volume. | Trips Card, Route Spend Card, Monthly Trajectory Line Chart, Booking Channel Mix Pie, Route Analysis Table. |
| **Page 3** | **Business Group Analytics** | Organizational spend performance, department cost drivers, employee travel frequency. | Active Employees Card, Avg Spend Card, Spend by Dept Column Chart, Cabin Mix by BU, Employee Spend Ledger. |
| **Page 4** | **Policy Compliance & Governance** | Audit oversight, policy exceptions, domestic cabin violations, approval status breakdown. | Compliance Rate Card, Exceptions Count Card, Policy Status Column Chart, Approval Status Donut, Audit Table. |
| **Page 5** | **FX & Financial Audit** | Multi-currency reconciliation, treasury exchange rate transparency, currency mix. | Total INR Card, Currencies Tracked Card, Currency Mix Pie, FX Rates Chart, Financial Reconciliation Ledger. |

---

## 3. Governed DAX Measures

The following 14 core measures are pre-configured against `vw_travel`:

1. **Total Spend (Gross)**:
   ```dax
   Total Spend Gross = SUM(vw_travel[amount_inr])
   ```
2. **Realized Spend (Flown)**:
   ```dax
   Total Spend Flown = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = "Y")
   ```
3. **Completed Trips**:
   ```dax
   Completed Trips = CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = "Y")
   ```
4. **Cancelled Trips Count**:
   ```dax
   Cancelled Trips = CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = "N")
   ```
5. **Average Ticket Cost**:
   ```dax
   Avg Fare = DIVIDE([Total Spend Flown], [Completed Trips], 0)
   ```
6. **Policy Compliance Rate**:
   ```dax
   Compliance Pct = DIVIDE(CALCULATE(COUNTROWS(vw_travel), vw_travel[policy_compliance_status] = "COMPLIANT"), COUNTROWS(vw_travel), 0) * 100
   ```
7. **Policy Exceptions Count**:
   ```dax
   Policy Exceptions = CALCULATE(COUNTROWS(vw_travel), vw_travel[policy_compliance_status] <> "COMPLIANT")
   ```
8. **Domestic Flight Count**:
   ```dax
   Domestic Trips = CALCULATE(COUNTROWS(vw_travel), vw_travel[trip_classification] = "Domestic")
   ```
9. **Cross-Border Flight Count**:
   ```dax
   Cross Border Trips = CALCULATE(COUNTROWS(vw_travel), vw_travel[trip_classification] = "Cross-Border")
   ```
10. **Active Corporate Travelers**:
    ```dax
    Active Travelers = DISTINCTCOUNT(vw_travel[employee_id])
    ```
11. **Average Spend Per Traveler**:
    ```dax
    Avg Spend Per Employee = DIVIDE([Total Spend Flown], [Active Travelers], 0)
    ```
12. **Foreign Currency Spend (Non-INR)**:
    ```dax
    Foreign Currency Spend = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[currency] <> "INR")
    ```
13. **Currency Count**:
    ```dax
    Currencies Tracked = DISTINCTCOUNT(vw_travel[currency])
    ```
14. **Manual Override Rate**:
    ```dax
    Override Rate = DIVIDE(CALCULATE(COUNTROWS(vw_travel), vw_travel[override_applied] = 1), COUNTROWS(vw_travel), 0) * 100
    ```
