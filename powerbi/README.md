# Corporate Travel Analytics — Power BI Enterprise Integration

## Executive Overview
This directory contains the production-ready Power BI integration assets for the **Corporate Travel Intelligence & Governance Platform**. The architecture adheres to enterprise data governance principles where the business intelligence layer connects exclusively to the governed SQL analytical view: **`vw_travel`**.

```
[Raw Vendor CSV] 
       │
       ▼ (SHA-256 Ingestion & Idempotency)
[staging_tickets]
       │
       ▼ (Auditable FX Lookup & Quarantine)
[cleansed_tickets]  +  [quarantined_records]
       │
       ▼ (SCD Type 2 Temporal Join)
[Employee / Country Enrichment]
       │
       ▼ (Business Rules & Rule Engine)
[Enriched Staging]
       │
       ▼ (Audited Analyst Overrides)
[fact_travel_tickets]
       │
       ▼ (Single Source of Truth Analytical View)
[vw_travel (36 Governed Attributes)]
       │
       ▼
[Power BI Executive & Operational Dashboards]
```

---

## Directory Contents

| File | Purpose |
| :--- | :--- |
| [`PowerBI_Setup_Guide.md`](./PowerBI_Setup_Guide.md) | Step-by-step instructions for connecting Power BI Desktop to PostgreSQL and SQLite databases via Import or DirectQuery mode. |
| [`DataModel.md`](./DataModel.md) | Comprehensive Star Schema data dictionary for all 36 columns in `vw_travel`, dimension hierarchies, and relationship definitions. |
| [`Measures.dax`](./Measures.dax) | 14 production-grade DAX measures with exact formulas for total spend, travel compliance, cross-border ratios, quarter-over-quarter growth, and audit counts. |

| [`PowerQuery.m`](./PowerQuery.m) | Ready-to-paste Power Query M code for both PostgreSQL DirectQuery/Import and SQLite ODBC data connectors. |
| [`Report_Design.md`](./Report_Design.md) | Blueprint and visual layout specification for all 5 enterprise dashboard pages (Executive Summary, Employee Hub, Risk & Compliance, FX Audit, Operational Lineage). |

---

## Governed Data Source Specification

- **Governed Database View**: `vw_travel`
- **Primary Fact Granularity**: 1 row per Travel Ticket
- **Base Currency**: Indian Rupee (`INR`)
- **Temporal Handling**: SCD Type 2 employee history resolved at ticket `travel_date`
- **Manual Overrides**: Pre-applied in ETL layer with `is_overridden = 'Y'` and full audit lineage
- **Unknown Currencies / Malformed Dates**: Quarantined prior to fact population (100% clean BI data)

---

## Quick Start
1. Open **Power BI Desktop**.
2. Follow the connection instructions in [`PowerBI_Setup_Guide.md`](./PowerBI_Setup_Guide.md).
3. Copy the M script from [`PowerQuery.m`](./PowerQuery.m) into Advanced Editor.
4. Add the calculated measures from [`Measures.dax`](./Measures.dax).
5. Build the report pages using the layout in [`Report_Design.md`](./Report_Design.md).
