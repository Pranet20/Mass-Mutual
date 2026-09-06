# Power BI Report Design & Visual Layout Specifications

This document outlines the visual layout, filtering architecture, KPI cards, and chart specifications for the 5-page enterprise dashboard suite built on `vw_travel`.

---

## Global Slicers & Filter Pane (Available on all pages)
- **Date Range Slicer**: `vw_travel[travel_date]` (Between slider)
- **Business Unit Slicer**: `vw_travel[business_unit]` (Dropdown with search)
- **Department Slicer**: `vw_travel[department]` (Multi-select dropdown)
- **Route Classification Slicer**: `vw_travel[classification]` (`Domestic` / `Cross-Border`)
- **Booking Channel Slicer**: `vw_travel[booking_channel]` (`Amadeus GDS`, `Sabre GDS`, `Corporate Portal`, `Uber for Business`)

---

## Page 1: Executive Spend & Flight Analytics Overview

### Layout Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│ [KPI 1: Total Spend] [KPI 2: Completed] [KPI 3: Cross-Border %] [KPI 4: Avg Cost]│
├───────────────────────────────────┬────────────────────────────────────┤
│ Visual 1: Monthly Spend Trend     │ Visual 2: Spend by Business Unit   │
│ (Line & Clustered Column Chart)   │ (Donut Chart)                      │
├───────────────────────────────────┼────────────────────────────────────┤
│ Visual 3: Top 10 Flight Corridors │ Visual 4: Booking Channel Split    │
│ (Bar Chart: Origin -> Dest)       │ (Treemap)                          │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Visual Specifications
1. **KPI Cards (Top Banner)**:
   - Card 1: `[Total Spend INR]` (Formatted as Currency `₹#,##0`)
   - Card 2: `[Completed Travel Tickets]`
   - Card 3: `[Cross-Border Spend %]` (Formatted as Percentage `0.0%`)
   - Card 4: `[Average Ticket Cost INR]` (Formatted as Currency `₹#,##0`)
2. **Visual 1 (Monthly Spend Trend)**:
   - **Type**: Area Chart / Clustered Column
   - **X-Axis**: `vw_travel[travel_date]` (Hierarchical: Year / Month)
   - **Y-Axis**: `[Total Completed Spend INR]`
   - **Legend**: `vw_travel[classification]`
3. **Visual 2 (Spend by Business Unit)**:
   - **Type**: Donut Chart
   - **Legend**: `vw_travel[business_unit]`
   - **Values**: `[Total Spend INR]`
4. **Visual 3 (Top 10 Travel Corridors)**:
   - **Type**: Horizontal Clustered Bar Chart
   - **Y-Axis**: Calculated column `Origin to Destination` (`[origin_city] & " -> " & [dest_city]`)
   - **X-Axis**: `[Total Spend INR]`
   - **Tooltips**: `[Total Tickets]`, `[Cross-Border Spend INR]`
5. **Visual 4 (Booking Channel Mix)**:
   - **Type**: Treemap
   - **Category**: `vw_travel[booking_channel]`
   - **Values**: `[Total Spend INR]`

---

## Page 2: Employee Hub & Allowance Utilization

### Layout Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│ [KPI 1: Active Travelers] [KPI 2: Budget Allocated] [KPI 3: Budget Utilized %] │
├────────────────────────────────────────────────────────────────────────┤
│ Visual 1: Employee Spend vs Quarterly Allowance (Scatter / Column)    │
├────────────────────────────────────────────────────────────────────────┤
│ Visual 2: Detailed Employee Travel Ledger (Table / Matrix with drill)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
1. **KPI Cards**:
   - `[Total Quarterly Allowance INR]`
   - `[Total Completed Spend INR]`
   - `[Budget Utilization %]` (Conditional formatting: Green <80%, Amber 80-100%, Red >100%)
2. **Visual 1 (Employee Allowance vs Spend)**:
   - **Type**: Clustered Bar Chart
   - **Y-Axis**: `vw_travel[employee_name]` (Top 15 by Spend)
   - **X-Axis Values**: `[Total Completed Spend INR]`, `[Total Quarterly Allowance INR]`
3. **Visual 2 (Employee Ledger Grid)**:
   - **Type**: Table
   - **Columns**: `employee_id`, `employee_name`, `business_unit`, `designation`, `location`, `quarterly_allowance_inr`, `[Total Completed Spend INR]`, `[Budget Utilization %]`

---

## Page 3: Policy Compliance & Risk Monitor

### Layout Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│ [KPI 1: Violation Rate %] [KPI 2: Flagged Tickets] [KPI 3: Overrides]  │
├───────────────────────────────────┬────────────────────────────────────┤
│ Visual 1: Policy Exceptions by BU │ Visual 2: Violation Reason Pareto  │
│ (Bar Chart)                       │ (Funnel / Bar)                     │
├───────────────────────────────────┴────────────────────────────────────┤
│ Visual 3: Compliance Exception Audit Table                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
1. **KPI Cards**:
   - `[Policy Violation Rate %]`
   - `[Flagged Tickets Count]`
   - `[Manual Overrides Count]`
2. **Visual 1 (Exceptions by Business Unit)**:
   - **Type**: Stacked Bar Chart
   - **Y-Axis**: `vw_travel[business_unit]`
   - **X-Axis**: `[Flagged Tickets Count]`
   - **Legend**: `vw_travel[flag_reason]`
3. **Visual 3 (Audit Table)**:
   - **Columns**: `ticket_id`, `travel_date`, `employee_name`, `business_unit`, `origin_city`, `dest_city`, `cabin_class`, `ticket_status`, `is_flagged`, `flag_reason`, `is_overridden`, `override_reason`

---

## Page 4: Multi-Currency & Auditable FX Control

### Layout Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│ [KPI 1: Foreign Currency Spend] [KPI 2: Currency Count] [KPI 3: FX Audit]│
├───────────────────────────────────┬────────────────────────────────────┤
│ Visual 1: Spend by Booking Curr   │ Visual 2: Applied FX Rate Table    │
│ (Pie Chart / Treemap)             │ (Reference Grid)                   │
├───────────────────────────────────┴────────────────────────────────────┤
│ Visual 3: Currency Lineage Reconciliation Table                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
1. **KPI Cards**:
   - `[Cross-Border Spend INR]`
   - Distinct Count of `vw_travel[currency]`
   - Max `vw_travel[fx_rate_date]`
2. **Visual 1 (Currency Mix)**:
   - **Type**: Donut Chart
   - **Legend**: `vw_travel[currency]`
   - **Values**: `[Total Spend INR]`
3. **Visual 3 (FX Reconciliation Table)**:
   - **Columns**: `ticket_id`, `employee_name`, `travel_date`, `amount_original`, `currency`, `fx_rate`, `amount_inr`, `fx_rate_date`, `fx_source`

---

## Page 5: Operational Data Lineage & Override Control Room

### Layout Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│ [KPI 1: Ingestion Batch ID] [KPI 2: Total Records] [KPI 3: Cleansed At]│
├────────────────────────────────────────────────────────────────────────┤
│ Visual 1: Batch Processing Summary                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Visual 2: Analyst Manual Overrides Governance Log                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications
1. **Visual 2 (Overrides Governance Log)**:
   - **Filter**: `vw_travel[is_overridden] = "Y"`
   - **Columns**: `ticket_id`, `employee_name`, `travel_date`, `classification`, `summary`, `override_reason`, `batch_id`, `cleansed_at`
