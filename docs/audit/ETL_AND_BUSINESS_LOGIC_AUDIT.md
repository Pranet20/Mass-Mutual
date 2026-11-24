# ETL, Data Governance and Business Logic Audit

## 1. Travel Analytics Calculation Rules

The business requirements from the PS-04 specification mandate precise handling of tickets, trips, statuses, and multi-currency conversions:

### 1.1 Ticket-Level vs Trip-Level Counting
- **Fact Grain**: One row in `fact_travel_tickets` represents exactly one flight leg / ticket coupon (`ticket_id`).
- **Trip Grain**: Multiple tickets sharing a common `trip_id` are grouped as a single corporate trip.
- **Verification**: 490 fact tickets map to 376 distinct trips.

### 1.2 Status Treatment & Travelled Spend
- **ISSUED**: Treated as flown (`travelled = 'Y'`). Included in actual flown spend calculations.
- **CANCELLED / REFUNDED / EXCHANGED**: Flagged as `travelled = 'N'`. Excluded from actual flown spend; preserved for gross booking analysis.

### 1.3 Domestic vs Cross-Border Classification
- If `origin_country == dest_country`: classified as `'Domestic'`.
- If `origin_country != dest_country`: classified as `'Cross-Border'`.
- Trips visiting multiple countries outside the origin country are labeled as `'Multi-Country'` (e.g., `"US to GBS Multi-Country"`).

### 1.4 Slowly Changing Dimension (SCD Type 2) Historical Attribution
When an employee changes department or business unit:
- The old record has `effective_end_date = <change_date>`.
- The new record has `effective_start_date = <change_date>`.
- Travel occurring prior to `<change_date>` is attributed to the prior department. Travel occurring after is attributed to the new department.
- **Test Case Verified**: Employee Priya Nair (`EMP-1002`) moved from Operations & Risk to Finance & Actuarial on 2026-06-01. Flights before June 1 attribute to Operations; flights after attribute to Finance.

---

## 2. Financial Reconciliation Ledger

| Metric | Source Calculation | Governed View (`vw_travel`) | Variance | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Total Ingested Tickets** | 490 (all batches) | 490 Fact Tickets | 0 | **RECONCILED** |
| **Distinct Trips** | 376 distinct `trip_id`s | 376 Trips | 0 | **RECONCILED** |
| **Flown Travelled Tickets** | 338 (`travelled = 'Y'`) | 338 Tickets | 0 | **RECONCILED** |
| **Non-Flown Tickets** | 152 (`CANCELLED / REFUNDED`) | 152 Tickets | 0 | **RECONCILED** |
| **Total Actual Flown Spend** | ₹30,344,520.00 | ₹30,344,520.00 | ₹0.00 | **100% EXACT** |
| **Auditable FX Conversions** | 100% of foreign currencies | 100% converted via `fx_rates` | ₹0.00 | **RECONCILED** |
