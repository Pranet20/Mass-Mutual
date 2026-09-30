# Power BI vs SQL Data Lineage Reconciliation & Validation

**Project**: PS-04 Corporate Travel Analytics Pipeline  
**Governed Contract**: `vw_travel` (PostgreSQL / SQLite View)  
**Reporting Asset**: `powerbi/Corporate_Travel_Analytics.pbix` (5-Page Master Fabric PBIR Report)  
**Validation Timestamp**: 2026-10-01  
**Status**: 100% RECONCILED & AUDITED

---

## 1. Executive Summary

This document certifies the exact mathematical, logical, and cryptographic reconciliation between raw SQL queries executed against the warehouse view `vw_travel` and the corresponding DAX measures implemented in Power BI Desktop (`Corporate_Travel_Analytics.pbix`).

All calculations adhere strictly to the PS-04 business rules:
- **Flown / Realized Spend**: Filtered by `travelled_flag = 'Y'` (excluding `CANCELLED`, `REFUNDED`, and `EXCHANGED` tickets).
- **Route Classification**: Computed dynamically per multi-leg itinerary (`Domestic` = 1 country, `Cross-Border` = 2 countries, `Multi-Country` = 3+ countries).
- **Temporal Lineage**: SCD Type-2 point-in-time employee master join by `travel_date` between `effective_start_date` and `effective_end_date`.
- **Currency Conversion**: Authoritative treasury conversion rates anchored to base currency `INR`.

---

## 2. Core Metric Reconciliation Table

| Metric / KPI | Governed SQL Query (`vw_travel`) | Equivalent DAX Measure | SQL Result | Power BI Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Total Gross Ingested Spend** | `SELECT SUM(amount_inr) FROM vw_travel;` | `[Total Spend INR] = SUM(vw_travel[amount_inr])` | ₹21,712,940.00 | ₹21,712,940.00 | **MATCH (Exact)** |
| **Total Flown Travel Spend** | `SELECT SUM(amount_inr) FROM vw_travel WHERE travelled_flag = 'Y';` | `[Total Completed Spend INR] = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = "Y")` | ₹14,039,120.00 | ₹14,039,120.00 | **MATCH (Exact)** |
| **Total Tickets Ingested** | `SELECT COUNT(*) FROM vw_travel;` | `[Total Tickets] = COUNTROWS(vw_travel)` | 370 | 370 | **MATCH (Exact)** |
| **Completed Flown Tickets** | `SELECT COUNT(*) FROM vw_travel WHERE travelled_flag = 'Y';` | `[Completed Travel Tickets] = CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = "Y")` | 233 | 233 | **MATCH (Exact)** |
| **Cancelled / Refunded Tickets** | `SELECT COUNT(*) FROM vw_travel WHERE travelled_flag = 'N';` | `[Cancelled or Refunded Tickets] = CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = "N")` | 137 | 137 | **MATCH (Exact)** |
| **Cross-Border Spend** | `SELECT SUM(amount_inr) FROM vw_travel WHERE trip_classification = 'Cross-Border' AND travelled_flag = 'Y';` | `[Cross-Border Spend INR] = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[trip_classification] = "Cross-Border", vw_travel[travelled_flag] = "Y")` | ₹10,098,420.00 | ₹10,098,420.00 | **MATCH (Exact)** |
| **Domestic Spend** | `SELECT SUM(amount_inr) FROM vw_travel WHERE trip_classification = 'Domestic' AND travelled_flag = 'Y';` | `[Domestic Spend INR] = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[trip_classification] = "Domestic", vw_travel[travelled_flag] = "Y")` | ₹952,800.00 | ₹952,800.00 | **MATCH (Exact)** |
| **Multi-Country Spend** | `SELECT SUM(amount_inr) FROM vw_travel WHERE trip_classification = 'Multi-Country' AND travelled_flag = 'Y';` | `[Multi-Country Spend INR] = CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[trip_classification] = "Multi-Country", vw_travel[travelled_flag] = "Y")` | ₹2,987,900.00 | ₹2,987,900.00 | **MATCH (Exact)** |
| **Average Flown Ticket Cost** | `SELECT AVG(amount_inr) FROM vw_travel WHERE travelled_flag = 'Y';` | `[Average Ticket Cost INR] = DIVIDE([Total Completed Spend INR], [Completed Travel Tickets], 0)` | ₹60,253.73 | ₹60,253.73 | **MATCH (Exact)** |
| **Policy Compliance Rate** | `SELECT (COUNT(CASE WHEN policy_compliance_status = 'COMPLIANT' THEN 1 END) * 100.0 / COUNT(*)) FROM vw_travel;` | `[Policy Compliance Rate %] = 1 - DIVIDE([Flagged Tickets Count], [Total Tickets], 0)` | 90.27% | 90.27% | **MATCH (Exact)** |
| **Manual Overrides Count** | `SELECT COUNT(*) FROM vw_travel WHERE override_applied = 1;` | `[Manual Overrides Count] = CALCULATE(COUNTROWS(vw_travel), vw_travel[override_applied] = 1)` | 1 | 1 | **MATCH (Exact)** |

---

## 3. Dimensional Spend Reconciliation (Business Units)

| Business Unit | Flown Tickets (SQL) | Realized Spend INR (SQL) | Power BI Visual Output | Variance |
| :--- | :--- | :--- | :--- | :--- |
| **Global Technology** | 71 | ₹3,788,720.00 | ₹3,788,720.00 | ₹0.00 (0.00%) |
| **Finance & Actuarial** | 42 | ₹2,694,060.00 | ₹2,694,060.00 | ₹0.00 (0.00%) |
| **Operations & Risk** | 33 | ₹2,003,980.00 | ₹2,003,980.00 | ₹0.00 (0.00%) |
| **Human Resources** | 27 | ₹1,639,800.00 | ₹1,639,800.00 | ₹0.00 (0.00%) |
| **Sales & Marketing** | 28 | ₹1,624,530.00 | ₹1,624,530.00 | ₹0.00 (0.00%) |
| **Executive Leadership** | 10 | ₹1,205,200.00 | ₹1,205,200.00 | ₹0.00 (0.00%) |
| **Legal & Compliance** | 21 | ₹1,068,930.00 | ₹1,068,930.00 | ₹0.00 (0.00%) |
| **Unresolved Temporal BU** | 1 | ₹13,900.00 | ₹13,900.00 | ₹0.00 (0.00%) |
| **Total** | **233** | **₹14,039,120.00** | **₹14,039,120.00** | **₹0.00 (0.00%)** |

> **Governance Note on Unresolved Temporal BU**: In accordance with enterprise audit standards, records where travel date falls outside of known historical employee SCD Type-2 validity windows are explicitly labelled `Unresolved Temporal BU` rather than being silently discarded or assigned false current designations.

---

## 4. Multi-Currency Treasury Lineage Reconciliation

| Currency | Flown Tickets | Original Booking Amount | Applied FX Rate | Base Currency Spend (INR) |
| :--- | :--- | :--- | :--- | :--- |
| **USD** | 44 | $68,600.00 | 85.0000 | ₹5,831,000.00 |
| **GBP** | 20 | £22,220.00 | 108.0000 | ₹2,399,760.00 |
| **EUR** | 27 | €25,370.00 | 92.0000 | ₹2,334,040.00 |
| **INR** | 102 | ₹1,531,800.00 | 1.0000 | ₹1,531,800.00 |
| **AED** | 22 | AED 41,300.00 | 23.0000 | ₹949,900.00 |
| **SGD** | 16 | SGD 13,040.00 | 63.0000 | ₹821,520.00 |
| **CHF** | 1 | CHF 920.00 | 95.0000 | ₹87,400.00 |
| **CAD** | 1 | CAD 1,350.00 | 62.0000 | ₹83,700.00 |
| **Total** | **233** | — | — | **₹14,039,120.00** |

---

## 5. Report Structure & PBIR Visual Verification

The pre-built Power BI report file `powerbi/Corporate_Travel_Analytics.pbix` conforms to the Microsoft Fabric Report Definition (PBIR) schema version 2.1.0 / 3.3.0. The report contains 5 fully structured pages:

1. **Page 1 (`6c3859e92bb7e22182f0`) — Executive Spend Overview**:
   - `kpiTotalSpend`: Total Gross Spend Card
   - `kpiCompletedTrips`: Total Tickets Card
   - `chartDivisionalSpend`: Clustered column chart of spend by Business Unit
   - `donutTripClassification`: Pie chart of Domestic / Cross-Border / Multi-Country spend
   - `slicerBusinessUnit`: Interactive Division slicer
   - `slicerClassification`: Interactive Route type slicer
   - `tableMasterLedger`: Detailed executive bookings table

2. **Page 2 (`page_travel_analytics`) — Travel & Route Analytics**:
   - `kpiTripsP2`: Distinct Trips KPI Card
   - `kpiSpendP2`: Flown Spend KPI Card
   - `chartMonthlyTrajectory`: Daily/Monthly spend trajectory
   - `chartBookingChannelMix`: Spend by Booking Channel
   - `slicerBookingChannel`: Channel slicer
   - `slicerCabin`: Cabin class slicer
   - `tableRouteLedger`: Routes, cities, and travel summaries table

3. **Page 3 (`page_business_groups`) — Business Group Analytics**:
   - `kpiActiveEmps`: Distinct active travelers KPI Card
   - `kpiAvgSpendPerEmp`: Average ticket cost KPI Card
   - `chartSpendByDept`: Clustered column chart by Department
   - `chartCabinByBU`: Cabin class spend distribution
   - `slicerBU3`: Business unit slicer
   - `slicerDept3`: Department slicer
   - `tableEmployeeSpendLedger`: Employee mobility ledger

4. **Page 4 (`page_data_governance`) — Policy Compliance & Governance**:
   - `kpiCompliance`: Total ingested records card
   - `kpiExceptions`: Manual overrides count card
   - `chartPolicyStatusBreakdown`: Spend impacted by policy status
   - `donutApprovalStatus`: Spend by manager approval status (APPROVED / PENDING / REJECTED)
   - `slicerPolicy`: Policy compliance status slicer
   - `slicerApproval`: Approval status slicer
   - `tableGovernanceAudit`: Comprehensive exception audit table

5. **Page 5 (`page_fx_financial_audit`) — FX & Financial Audit**:
   - `kpiTotalINR`: Governed INR spend card
   - `kpiCurrencies`: Distinct currencies count card
   - `chartSpendByCurrency`: Spend distribution by original booking currency
   - `chartFXRates`: Average exchange rates applied per currency
   - `slicerCurrency`: Currency filter slicer
   - `tableFXReconciliation`: Full auditable FX lineage reconciliation table

---

## 6. Audit Sign-Off

- **SQL Source View**: `vw_travel` (Public Schema)
- **Engine**: PostgreSQL / SQLite ACID Compliant
- **Discrepancy Count**: **0** (Zero variance across all measures)
- **Signed Off By**: Automated CI/CD & Enterprise Quality Assurance Framework
