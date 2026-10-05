#!/usr/bin/env python3
"""
PostgreSQL Bootstrap & Synchronizer for MassMutual PS-04 Travel Analytics
Applies DDL updates, ensures all 37 columns exist in vw_travel (including business_group),
and synchronizes governed data from SQLite or seeds the database.
"""

import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import execute_batch

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PG_HOST = os.environ.get("POSTGRES_HOST", "127.0.0.1")
PG_PORT = int(os.environ.get("POSTGRES_PORT", "5433"))
PG_USER = os.environ.get("POSTGRES_USER", "postgres")
PG_DB = os.environ.get("POSTGRES_DB", "travel_analytics")
SQLITE_PATH = os.path.join(BACKEND_DIR, "database", "travel_analytics.db")

PG_PASSWORDS = [
    os.environ.get("POSTGRES_PASSWORD"),
    "root",
    "travel_prod_secure_pass",
    "postgres"
]
PG_PASSWORDS = [p for p in PG_PASSWORDS if p]


def get_pg_connection():
    last_err = None
    for pwd in PG_PASSWORDS:
        try:
            conn = psycopg2.connect(
                host=PG_HOST,
                port=PG_PORT,
                user=PG_USER,
                password=pwd,
                dbname=PG_DB
            )
            print(f"      Connected to PostgreSQL at {PG_HOST}:{PG_PORT}/{PG_DB} successfully.")
            return conn
        except psycopg2.OperationalError as e:
            last_err = e
            continue
    raise last_err


def apply_schema_migrations(pg_conn):
    with pg_conn.cursor() as cur:
        print("[1/5] Applying DDL migrations to PostgreSQL...")
        
        # 1. Add business_group to employee_master if missing
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'employee_master' AND column_name = 'business_group'
                ) THEN
                    ALTER TABLE employee_master ADD COLUMN business_group VARCHAR(100);
                END IF;
            END $$;
        """)

        # 2. Add business_group to fact_travel_tickets if missing
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fact_travel_tickets' AND column_name = 'business_group'
                ) THEN
                    ALTER TABLE fact_travel_tickets ADD COLUMN business_group VARCHAR(100);
                END IF;
            END $$;
        """)

        # 3. Add manual_overrides columns if missing
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'manual_overrides' AND column_name = 'approved_by'
                ) THEN
                    ALTER TABLE manual_overrides ADD COLUMN approved_by VARCHAR(100);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'manual_overrides' AND column_name = 'approved_at'
                ) THEN
                    ALTER TABLE manual_overrides ADD COLUMN approved_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'manual_overrides' AND column_name = 'status'
                ) THEN
                    ALTER TABLE manual_overrides ADD COLUMN status VARCHAR(50) DEFAULT 'APPROVED';
                END IF;
            END $$;
        """)

        # 4. Create indexes if not exists
        cur.execute("CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_business_group ON fact_travel_tickets(business_group);")
        cur.execute("CREATE INDEX IF NOT EXISTS ix_employee_master_business_group ON employee_master(business_group);")

        # 5. Recreate vw_travel with exactly 37 columns
        print("[2/5] Creating governed view vw_travel (37 columns)...")
        cur.execute("DROP VIEW IF EXISTS vw_travel CASCADE;")
        cur.execute("""
            CREATE VIEW vw_travel AS
            SELECT 
                ticket_id,
                trip_id,
                batch_id,
                employee_id,
                employee_name,
                business_unit,
                business_group,
                department,
                issue_date,
                travel_date,
                return_date,
                origin_city,
                origin_country,
                dest_city,
                dest_country,
                origin_iso,
                dest_iso,
                ticket_status,
                amount_original,
                currency,
                fx_rate,
                amount_inr,
                fx_rate_date,
                fx_source,
                booking_channel,
                cabin_class,
                travelled_flag,
                trip_classification,
                travel_summary,
                policy_compliance_status,
                policy_violation_reason,
                approval_status,
                rejection_reason,
                override_applied,
                record_hash,
                source_file,
                updated_at
            FROM fact_travel_tickets;
        """)

        # 6. Record alembic version if table exists or create it
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL PRIMARY KEY
            );
        """)
        cur.execute("DELETE FROM alembic_version;")
        cur.execute("INSERT INTO alembic_version (version_num) VALUES ('546a7b0e7c2e');")

        pg_conn.commit()
        print("      Schema and vw_travel view created successfully.")


def sync_from_sqlite(pg_conn):
    if not os.path.exists(SQLITE_PATH):
        print(f"      SQLite database not found at {SQLITE_PATH}. Skipping sync.")
        return

    print("[3/5] Synchronizing records from SQLite to PostgreSQL...")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    tables = [
        "country_reference",
        "fx_rates",
        "employee_master",
        "staging_tickets",
        "cleansed_tickets",
        "quarantined_records",
        "fact_travel_tickets",
        "manual_overrides",
        "manual_override_audits",
        "pipeline_batch_audit",
        "users",
        "complaints"
    ]

    with pg_conn.cursor() as cur:
        for table in tables:
            # Check if sqlite table exists
            sqlite_cur.execute(f"SELECT count(*) FROM sqlite_master WHERE type='table' AND name='{table}'")
            if sqlite_cur.fetchone()[0] == 0:
                continue

            # Read all rows from sqlite
            sqlite_cur.execute(f"SELECT * FROM {table}")
            rows = sqlite_cur.fetchall()
            if not rows:
                continue

            col_names = [d[0] for d in sqlite_cur.description]
            
            # Truncate PG table
            cur.execute(f"TRUNCATE TABLE {table} CASCADE;")

            cols_str = ", ".join(f'"{c}"' for c in col_names)
            placeholders = ", ".join(["%s"] * len(col_names))
            insert_sql = f'INSERT INTO {table} ({cols_str}) VALUES ({placeholders})'

            data = [[r[c] for c in col_names] for r in rows]
            execute_batch(cur, insert_sql, data, page_size=500)
            print(f"      Synchronized {len(rows)} records into {table}")

            # Reset auto-increment sequence if id exists
            if "id" in col_names:
                try:
                    cur.execute(f"SELECT setval('{table}_id_seq', COALESCE((SELECT MAX(id) FROM {table}), 1), true);")
                except Exception:
                    pass

        # Backfill any missing business_group values in fact_travel_tickets
        cur.execute("""
            UPDATE fact_travel_tickets f
            SET business_group = COALESCE(e.business_group, e.business_unit, f.business_unit)
            FROM employee_master e
            WHERE f.employee_id = e.employee_id
              AND (f.business_group IS NULL OR f.business_group = '');
        """)
        
        # If any remain NULL (vendor direct / no matching employee), set to business_unit or '(Vendor Direct / None)'
        cur.execute("""
            UPDATE fact_travel_tickets
            SET business_group = COALESCE(business_unit, '(Vendor Direct / None)')
            WHERE business_group IS NULL OR business_group = '';
        """)

        pg_conn.commit()
    sqlite_conn.close()


def verify_postgresql(pg_conn):
    print("[4/5] Verifying PostgreSQL vw_travel schema and metrics...")
    with pg_conn.cursor() as cur:
        # Check columns
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vw_travel'
            ORDER BY ordinal_position;
        """)
        cols = cur.fetchall()
        print(f"      vw_travel total columns: {len(cols)}")
        col_names = [c[0] for c in cols]
        assert "business_group" in col_names, "CRITICAL: business_group missing from vw_travel!"
        assert "business_unit" in col_names, "CRITICAL: business_unit missing from vw_travel!"
        assert "trip_id" in col_names, "CRITICAL: trip_id missing from vw_travel!"
        assert "travel_date" in col_names, "CRITICAL: travel_date missing from vw_travel!"
        assert "travel_summary" in col_names, "CRITICAL: travel_summary missing from vw_travel!"
        assert len(cols) == 37, f"CRITICAL: Expected 37 columns, found {len(cols)}: {col_names}"
        print("      vw_travel has all 37 required columns including business_group.")

        # Check metrics
        cur.execute("""
            SELECT 
                COUNT(*) AS total_rows,
                COUNT(business_unit) AS business_unit_filled,
                COUNT(business_group) AS business_group_filled,
                COUNT(*) FILTER (WHERE business_group IS NOT NULL AND business_group != '') AS bg_non_null,
                COUNT(DISTINCT trip_id) AS distinct_trips,
                ROUND(SUM(amount_inr)::numeric, 2) AS total_spend
            FROM public.vw_travel;
        """)
        res = cur.fetchone()
        print(f"      Total rows: {res[0]}")
        print(f"      business_unit filled: {res[1]}")
        print(f"      business_group filled: {res[2]}")
        print(f"      business_group non-null: {res[3]}")
        print(f"      Distinct trips: {res[4]}")
        print(f"      Total spend: INR {res[5]:,}")

        assert res[0] == res[2], f"CRITICAL: Row count {res[0]} != business_group filled {res[2]}"
        assert res[3] == res[0], f"CRITICAL: business_group has NULL values: {res[0] - res[3]}"

        # Check Business Group Breakdown
        cur.execute("""
            SELECT business_group, COUNT(DISTINCT trip_id) AS distinct_trips, COUNT(*) AS ticket_legs, ROUND(SUM(amount_inr)::numeric, 2) AS group_spend
            FROM vw_travel
            GROUP BY business_group
            ORDER BY distinct_trips DESC;
        """)
        bg_rows = cur.fetchall()
        print("\n      [Trips by Business Group in PostgreSQL]")
        for r in bg_rows:
            print(f"        {r[0]:<30} | {r[1]:<5} trips | {r[2]:<5} legs | INR {r[3]:,}")

    print("\n[5/5] PostgreSQL validation passed with ZERO ERRORS.")


if __name__ == "__main__":
    print("=" * 70)
    print("PostgreSQL Bootstrap & Synchronizer")
    print(f"Target: postgresql://{PG_USER}:***@{PG_HOST}:{PG_PORT}/{PG_DB}")
    print("=" * 70)
    conn = get_pg_connection()
    try:
        apply_schema_migrations(conn)
        sync_from_sqlite(conn)
        verify_postgresql(conn)
    finally:
        conn.close()
