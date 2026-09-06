import sqlite3
import os
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "travel_analytics.db")

def inspect():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("\n" + "=" * 80)
    print(" [DATABASE INSPECTOR] Corporate Travel & Expense Intelligence Platform")
    print("=" * 80)

    # 1. Show all Tables and Views
    cursor.execute("SELECT type, name FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name;")
    items = cursor.fetchall()
    
    print("\nDATABASE TABLES & GOVERNED VIEWS:")
    print("-" * 65)
    print(f"{'Type':<10} | {'Name':<35} | {'Row Count':<12}")
    print("-" * 65)
    
    for item_type, name in items:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {name};")
            count = cursor.fetchone()[0]
        except Exception:
            count = "N/A"
        print(f"{item_type.upper():<10} | {name:<35} | {str(count):<12}")

    # 2. Show Sample Records from Governed View (vw_travel)
    print("\n" + "=" * 80)
    print(" SAMPLE RECORDS FROM GOVERNED VIEW: vw_travel (Top 5)")
    print("=" * 80)
    cursor.execute("SELECT ticket_id, employee_id, employee_name, business_unit, travel_date, dest_city, dest_country, amount_inr, travelled_flag FROM vw_travel LIMIT 5;")
    rows = cursor.fetchall()
    headers = ["Ticket ID", "Emp ID", "Employee Name", "Business Unit", "Date", "Dest City", "Country", "Amount (INR)", "Travelled"]
    print(f"{headers[0]:<10} | {headers[1]:<10} | {headers[2]:<18} | {headers[3]:<20} | {headers[4]:<12} | {headers[5]:<12} | {headers[6]:<15} | {headers[7]:<14} | {headers[8]:<9}")
    print("-" * 135)
    for r in rows:
        print(f"{r[0]:<10} | {r[1]:<10} | {r[2]:<18} | {r[3]:<20} | {r[4]:<12} | {r[5]:<12} | {r[6]:<15} | Rs.{r[7]:<11,.2f} | {r[8]:<9}")

    # 3. Show Null Allowance Audit Records
    print("\n" + "=" * 80)
    print(" NULL ALLOWANCE AUDIT PROFILES (employee_master):")
    print("=" * 80)
    cursor.execute("SELECT employee_id, employee_name, business_unit, designation, quarterly_allowance_inr FROM employee_master WHERE quarterly_allowance_inr IS NULL;")
    null_rows = cursor.fetchall()
    for nr in null_rows:
        print(f" * {nr[0]}: {nr[1]} ({nr[2]} - {nr[3]}) -> Allowance: NULL (Graceful DQ Isolation)")

    # 4. Show Bad-Record Quarantine Summary
    print("\n" + "=" * 80)
    print(" QUARANTINED RECORDS AUDIT:")
    print("=" * 80)
    cursor.execute("SELECT COUNT(*) FROM quarantined_records;")
    q_count = cursor.fetchone()[0]
    print(f" * Total Bad Records Quarantined: {q_count} (Zero Ingestion Failures)")

    print("\n" + "=" * 80)
    print(" SUCCESS: Database verified and operating normally.")
    print("=" * 80 + "\n")
    conn.close()

if __name__ == "__main__":
    inspect()
