# Power BI Setup & Connection Guide

This guide provides step-by-step instructions for connecting **Power BI Desktop** to the Corporate Travel Analytics database view `vw_travel`.

---

## Prerequisites
- **Power BI Desktop** (Latest version recommended)
- **Database Access**:
  - **Option A (Production/PostgreSQL)**: PostgreSQL 14+ database running on `localhost:5433` (or production host) with credentials from `.env`.
  - **Option B (Development/SQLite)**: SQLite ODBC Driver (64-bit) installed, pointing to `travel_analytics.db`.

---

## Option A: Connecting to PostgreSQL (Recommended for Production)

### Step 1: Open Get Data
1. Launch Power BI Desktop.
2. In the **Home** ribbon, click **Get Data** > **PostgreSQL database**.

### Step 2: Enter Connection Parameters
1. **Server**: `localhost:5433` (or your PostgreSQL host and port).
2. **Database**: `travel_analytics`
3. **Data Connectivity mode**:
   - Select **Import** for offline cache, fast querying, and DAX time intelligence.
   - Select **DirectQuery** for real-time live reporting directly against the PostgreSQL engine without scheduled refreshes.
4. Expand **Advanced options**:
   - SQL Statement (Optional — or select view from Navigator):
   ```sql
   SELECT * FROM vw_travel;
   ```
5. Click **OK**.

### Step 3: Database Authentication
1. Select **Database** tab in the credential prompt.
2. **User name**: `postgres` (or your configured user).
3. **Password**: `root` (or your configured password).
4. Click **Connect**. If an unencrypted connection warning appears, click **OK**.

### Step 4: Select the Governed View
1. In the Navigator window, expand the `public` schema.
2. Check the box for **`vw_travel`**.
3. Click **Transform Data** to open Power Query Editor, or **Load** to load data directly.

---

## Option B: Connecting to SQLite (Development Mode)

### Step 1: Install SQLite ODBC Driver
1. Download and install the official SQLite 64-bit ODBC Driver (`sqliteodbc_w64.exe`).

### Step 2: Open Get Data via ODBC
1. In Power BI Desktop, click **Get Data** > **More...** > **Other** > **ODBC** > **Connect**.
2. Select **None** for DSN.
3. In **Connection string**, enter:
   ```
   driver={SQLite3 ODBC Driver};Database=C:\Users\Pranet\Downloads\Mass Mutual\backend\database\travel_analytics.db;
   ```
4. In **SQL statement (optional)**, enter:
   ```sql
   SELECT * FROM vw_travel;
   ```
5. Click **OK** and click **Connect** (Default/Anonymous credentials).

---

## Step 5: Verify Data Types & Schema in Power Query

Ensure the following data types are set in Power Query Editor:

| Column | Data Type | Notes |
| :--- | :--- | :--- |
| `ticket_id`, `trip_id`, `employee_id` | Text | Primary and dimension keys |
| `travel_date`, `issue_date`, `return_date` | Date | Required for time intelligence |
| `amount_original`, `fx_rate`, `amount_inr`, `quarterly_allowance_inr` | Decimal Number / Currency | Financial measures |
| `travelled_flag`, `is_cross_border`, `is_flagged`, `is_overridden` | Text (`Y`/`N`) or True/False | Compliance flags |
| `travel_year`, `travel_quarter`, `travel_month` | Whole Number | Calendar hierarchies |

---

## Step 6: DirectQuery vs. Import Mode Decision Matrix

| Dimension | DirectQuery Mode | Import Mode |
| :--- | :--- | :--- |
| **Data Freshness** | Immediate (Live query on each visual interaction) | Dependent on scheduled refresh (e.g., hourly/daily) |
| **Dataset Size** | Unlimited (Processed by Postgres engine) | Up to 1 GB (Pro) / 100 GB (Premium) |
| **DAX Capabilities** | Restricted DAX subset | Full DAX & Time Intelligence support |
| **Performance** | Governed by DB indexing (`idx_vw_travel`) | In-memory VertiPaq engine (Ultra fast) |
| **Recommendation** | Use for real-time audit control room | Use for executive presentation dashboards |
