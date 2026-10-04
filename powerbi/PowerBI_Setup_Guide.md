# Power BI Setup & Connection Guide

This guide provides step-by-step instructions for connecting **Microsoft Power BI Desktop** to the Corporate Travel Analytics warehouse view `vw_travel`.

---

## Prerequisites
- **Microsoft Power BI Desktop** (Windows 64-bit, latest version recommended)
- **Database Engine**:
  - **Option A (Production / PostgreSQL)**: PostgreSQL 14+ running on `localhost:5433` (or production host) with credentials configured from `.env`.
  - **Option B (Development / Local SQLite)**: SQLite ODBC Driver (64-bit) installed, pointing to `backend/database/travel_analytics.db`.

---

## Option A: Connecting to PostgreSQL (Recommended for Production & DirectQuery)

### Step 1: Open Get Data
1. Launch Power BI Desktop.
2. In the **Home** ribbon, click **Get Data** > **PostgreSQL database**.

### Step 2: Enter Connection Parameters
1. **Server**: `localhost:5433` (or your PostgreSQL host and port).
2. **Database**: `travel_analytics`
3. **Data Connectivity mode**:
   - Select **DirectQuery** for real-time live queries against PostgreSQL without scheduled refreshes.
   - Select **Import** for in-memory VertiPaq caching, high speed, and DAX time intelligence.
4. Expand **Advanced options**:
   - SQL Statement (Optional — or select view from Navigator):
   ```sql
   SELECT * FROM vw_travel;
   ```
5. Click **OK**.

### Step 3: Database Authentication
1. Select the **Database** tab in the credential prompt.
2. **User name**: `postgres` (or your configured database user from `.env`).
3. **Password**: `<YOUR_POSTGRES_PASSWORD>` (from `.env` / `POSTGRES_PASSWORD`).
4. Click **Connect**. If an unencrypted connection warning appears, click **OK**.

### Step 4: Select the Governed View
1. In the Navigator window, expand the `public` schema.
2. Check the box for **`vw_travel`**.
3. Click **Transform Data** to open Power Query Editor, or **Load** to load data directly.

---

## Option B: Connecting to SQLite (Development & Local Evaluation Mode)

### Step 1: Install SQLite ODBC Driver
1. Download and install the official SQLite 64-bit ODBC Driver (`sqliteodbc_w64.exe`).

### Step 2: Open Get Data via ODBC
1. In Power BI Desktop, click **Get Data** > **More...** > **Other** > **ODBC** > **Connect**.
2. Select **None** for DSN.
3. In **Connection string**, enter:
   ```text
   driver={SQLite3 ODBC Driver};Database=C:\Users\Pranet\Downloads\Mass Mutual\backend\database\travel_analytics.db;
   ```
4. In **SQL statement (optional)**, enter:
   ```sql
   SELECT * FROM vw_travel;
   ```
5. Click **OK** and click **Connect** (Default/Anonymous credentials).

---

## Step 5: Parameterized Connection Configuration (Zero Visual/DAX Impact)

To ensure the database host and port are completely configurable without altering any DAX measures or report visual containers:

1. In Power BI Desktop, click **Home → Transform Data → Transform Data** to open Power Query Editor.
2. In the top ribbon, click **Manage Parameters → New Parameter**:
   - **Name**: `ServerHost` | **Type**: Text | **Current Value**: `localhost:5433`
   - **Name**: `DatabaseName` | **Type**: Text | **Current Value**: `travel_analytics`
3. Click the `Source` step of table `vw_travel` and update the M query:
   ```powerquery
   Source = PostgreSQL.Database(ServerHost, DatabaseName)
   ```
4. Click **Close & Apply**.
5. When presenting or moving environments, simply click **Transform Data → Edit Parameters** to point to a new database without modifying visuals or DAX measures.

---

## Step 6: Verified Data Types across all 37 Governed Attributes

In Power Query Editor, verify that the 37 attributes of `vw_travel` map to these types:

| Category | Columns | Data Type | Notes |
| :--- | :--- | :--- | :--- |
| **Identifiers** | `ticket_id`, `trip_id`, `batch_id`, `employee_id` | Text | Primary and dimension keys |
| **Employee Master** | `employee_name`, `business_group`, `business_unit`, `department` | Text | Point-in-time SCD2 dimensions |
| **Dates** | `travel_date`, `issue_date`, `return_date`, `fx_rate_date` | Date | ISO `YYYY-MM-DD` |
| **Geography** | `origin_city`, `origin_country`, `origin_iso`, `dest_city`, `dest_country`, `dest_iso` | Text | ISO-3166 Alpha-2 |
| **Financials** | `amount_original`, `fx_rate`, `amount_inr` | Decimal Number / Currency | Fixed decimal precision |
| **Classification** | `booking_channel`, `cabin_class`, `ticket_status`, `travelled_flag`, `trip_classification`, `travel_summary` | Text | Deterministic rules |
| **Governance** | `policy_compliance_status`, `policy_violation_reason`, `approval_status`, `rejection_reason`, `override_applied`, `record_hash`, `source_file`, `updated_at` | Text / Integer / DateTime | Audit and lineage |

---

## Step 7: DirectQuery vs. Import Mode Decision Matrix

| Dimension | DirectQuery Mode | Import Mode |
| :--- | :--- | :--- |
| **Data Freshness** | Immediate (Live query on each visual interaction) | Dependent on scheduled or manual refresh |
| **Dataset Size** | Unlimited (Processed by Postgres engine) | Up to 1 GB (Pro) / 100 GB (Premium) |
| **DAX Capabilities** | Restricted DAX subset | Full DAX & Time Intelligence support |
| **Performance** | Governed by DB indexing (`idx_vw_travel`) | In-memory VertiPaq engine (Ultra fast) |
| **Recommendation** | Use for real-time audit control room | Use for executive presentation dashboards |
