# MassMutual Corporate Travel Analytics — Business Rules Specification (PS-04)

This document formalizes all business rules, derivation algorithms, compliance thresholds, and financial logic implemented across the automated pipeline.

---

## 1. Travelled Flag Derivation (`travelled_flag`)

The `travelled_flag` governs whether a ticket represents completed, realized corporate spend or non-flown/reversed inventory.

| Raw `ticket_status` | Derived `travelled_flag` | Financial Treatment |
| :--- | :---: | :--- |
| `ISSUED` | `'Y'` | Included in completed travel spend metrics |
| `USED` | `'Y'` | Included in completed travel spend metrics |
| `FLOWN` | `'Y'` | Included in completed travel spend metrics |
| `COMPLETED` | `'Y'` | Included in completed travel spend metrics |
| `CANCELLED` | `'N'` | Excluded from realized spend (Audited as cancelled inventory) |
| `REFUNDED` | `'N'` | Excluded from realized spend (Refunded fare) |
| `EXCHANGED` | `'N'` | Excluded from realized spend (Superseded by replacement ticket) |
| `VOID` | `'N'` | Excluded from realized spend (Voided ticket) |
| Any other / Unknown | `'N'` | Excluded by default for conservative financial accounting |

---

## 2. Multi-Dimensional Trip Classification (`trip_classification`)

Trips (`trip_id`) frequently span multiple legs and ticket vouchers. Trip classification evaluates the full itinerary topology across all associated tickets in the trip:

1. **Domestic**:
   - Condition: All origin and destination endpoints across the journey reside within the same single country.
   - Example: Bengaluru (`India`) to Mumbai (`India`) -> `Domestic`.
   - Analytical Label: `Domestic <Country>` (e.g. `Domestic India`).

2. **Cross-Border**:
   - Condition: The journey connects exactly 2 distinct countries (Origin Country A -> Destination Country B).
   - Example: Hyderabad (`India`) to Boston (`United States`) -> `Cross-Border`.
   - Analytical Label: `<Origin_ISO> to <Dest_ISO> Cross-Border` (e.g. `IN to US Cross-Border`).

3. **Multi-Country**:
   - Condition: The trip itinerary visits more than 2 distinct countries, or visits multiple foreign destinations in a single itinerary.
   - Example: Bengaluru (`India`) -> Frankfurt (`Germany`) -> Boston (`United States`) -> `Multi-Country`.
   - Analytical Label: `<Origin_ISO> to Multi-Country` (e.g. `IN to Multi-Country`).

---

## 3. Corporate Policy Compliance Engine (`policy_compliance_status`)

Automated rule engine evaluating every ticket against corporate travel guidelines:

| Rule Code | Violation Condition | Resulting Status | Default Severity Reason |
| :--- | :--- | :--- | :--- |
| **CABIN-DOM-01** | `trip_classification == "Domestic"` AND `cabin_class == "Business"` | `NON_COMPLIANT_CABIN` | Business class non-compliant on domestic route |
| **FARE-DOM-01** | `trip_classification == "Domestic"` AND `amount_inr > 25,000.00` | `NON_COMPLIANT_FARE` | Domestic fare exceeds policy threshold (₹25,000 INR) |
| **FARE-XB-01** | `trip_classification == "Cross-Border"` AND `cabin_class == "Economy"` AND `amount_inr > 150,000.00` | `NON_COMPLIANT_FARE` | Economy cross-border fare exceeds threshold (₹1,50,000 INR) |
| **DEFAULT** | Does not violate any criteria above | `COMPLIANT` | None |

---

## 4. Multi-Currency FX Normalization & Treasury Conversion

All financial calculations and dashboard KPIs are standardized to Indian Rupees (INR) using governed exchange rates:

$$\text{amount\_inr} = \text{ROUND}(\text{amount\_original} \times \text{fx\_rate}, 2)$$

- **Fixed-Precision Storage**: All amounts stored in database as `Numeric(18, 2)`, rates as `Numeric(18, 4)`.
- **Treasury Source Rates (2026 Reference)**:
  - `INR`: $1.0000$
  - `USD`: $85.0000$
  - `GBP`: $108.0000$
  - `EUR`: $92.0000$
  - `CHF`: $95.0000$
  - `CAD`: $62.0000$
  - `SGD`: $63.0000$
  - `AED`: $23.0000$
  - `AUD`: $55.0000$
  - `JPY`: $0.5700$
- **Lineage Metadata**: Each ticket captures `amount_original`, `currency`, `fx_rate`, `fx_rate_date`, and `fx_source` directly into `fact_travel_tickets`.

---

## 5. Temporal SCD Type-2 Employee Master Enrichment

Employees change departments, business units, designations, and budgets over time. Historical tickets must never reflect future organizational changes:

1. **Temporal Matching Predicate**:
   $$\text{effective\_start\_date} \le \text{travel\_date} \le \text{effective\_end\_date}$$
2. **Audit Rule**: Never fall back silently to current employee attributes if travel date falls outside temporal bounds.
3. **Reference Case (`EMP-1002` Priya Nair)**:
   - Travel Date before `2026-01-01`: Enriched as `Operations & Risk` / `Internal Audit` (`is_current = 0`).
   - Travel Date on or after `2026-01-01`: Enriched as `Finance & Actuarial` / `Financial Planning` (`is_current = 1`).

---

## 6. Manual Override & Dual-Control Audit

When exceptional circumstances arise (e.g. employee booked on charter replacement flight despite ticket cancellation flag), authorized analysts and managers can apply an operational override:

- **Single Record of Truth**: Applied values (`override_travelled_flag`, `override_classification`, `override_summary`) replace derived values in `fact_travel_tickets` while setting `override_applied = 1`.
- **Strict Audit Trail**: Every modification writes a permanent record to `manual_override_audits` capturing `field_changed`, `old_value`, `new_value`, `override_reason`, and `changed_by` derived securely from the authenticated JWT token.
- **Approval Metadata**: Captures `status = 'APPROVED'`, `approved_by`, and `approved_at`.
