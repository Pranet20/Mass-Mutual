import os
import sys
import psycopg2

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Default PostgreSQL connection settings from user's pgAdmin configuration
PG_HOST = os.environ.get("PG_HOST", "localhost")
PG_PORT = int(os.environ.get("PG_PORT", 5433))
PG_USER = os.environ.get("PG_USER", "postgres")
PG_PASSWORD = os.environ.get("PG_PASSWORD", "root")
PG_DB = os.environ.get("PG_DB", "travel_analytics")

def setup_postgres():
    print("\n" + "=" * 70)
    print(" [POSTGRESQL & PGADMIN AUTOMATED LOADER]")
    print("=" * 70)
    
    # 1. Connect to PostgreSQL server and create database if not exists
    print(f"Connecting to PostgreSQL on {PG_HOST}:{PG_PORT} as '{PG_USER}'...")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{PG_DB}';")
        exists = cur.fetchone()
        if not exists:
            print(f"Creating database '{PG_DB}' in PostgreSQL...")
            cur.execute(f"CREATE DATABASE {PG_DB};")
            print(f"Database '{PG_DB}' created successfully!")
        else:
            print(f"Database '{PG_DB}' already exists in PostgreSQL.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error connecting to PostgreSQL server: {e}")
        return

    # 2. Set DATABASE_URL environment variable for SQLAlchemy
    pg_url = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"
    os.environ["DATABASE_URL"] = pg_url
    print(f"Configured DATABASE_URL -> {pg_url}")

    # 3. Initialize Models, Seed Data, and Run Pipeline against PostgreSQL
    print("\nCreating tables & governed view 'vw_travel' in PostgreSQL...")
    sys.path.insert(0, os.path.dirname(__file__))
    
    # Import after setting DATABASE_URL so models pick up PostgreSQL engine
    import importlib
    import database.models
    importlib.reload(database.models)
    from database.models import init_db
    from seed_data import generate_all_data
    from pipeline.validation import run_end_to_end_pipeline

    init_db()
    print("Seeding 100 Corporate Employees and Reference Data...")
    generate_all_data()
    print("Executing Enterprise ETL Pipeline to populate Fact & Governed View...")
    result = run_end_to_end_pipeline()
    
    print("\n" + "=" * 70)
    print(" SUCCESS! PostgreSQL Database & pgAdmin are fully loaded.")
    print("=" * 70)
    print(f"* Database Name : {PG_DB}")
    print(f"* Published Fact: {result.get('fact_records_published', 250)} Tickets")
    print("* Governed View : vw_travel is LIVE in pgAdmin under Schemas -> public -> Views")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    setup_postgres()
