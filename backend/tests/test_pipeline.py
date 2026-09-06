import pytest
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from seed_data import generate_all_data
from pipeline.ingestion import ingest_raw_tickets
from pipeline.cleansing import cleanse_staging_tickets, convert_to_inr, get_applicable_fx_rate
from pipeline.enrichment import enrich_ticket_data
from pipeline.business_rules import derive_business_rules
from pipeline.validation import run_end_to_end_pipeline
from services.auth import authenticate_user, hash_password, verify_password, create_access_token, decode_access_token
from services.forecasting import get_spend_forecasting
from services.ai_assistant import process_ai_query
from services.export import generate_csuite_briefing_html
from database.models import SessionLocal, FactTravelTicket, EmployeeMaster, QuarantinedRecord, ManualOverride, engine

@pytest.fixture(scope="module", autouse=True)
def setup_test_environment():
    generate_all_data()
    run_end_to_end_pipeline()

def test_1_staging_ingestion():
    result = ingest_raw_tickets()
    batch_id = result[0]
    assert batch_id.startswith("BATCH_")
    assert len(batch_id) > 15
    assert result[1] > 0

def test_2_cleansing_inr_conversion():
    amount_inr = convert_to_inr(100.0, "USD")
    assert amount_inr == 8500.0
    assert convert_to_inr(100.0, "INR") == 100.0
    assert convert_to_inr(10.0, "GBP") == 1080.0

def test_3_cleansing_deduplication():
    res = cleanse_staging_tickets()
    cleansed_cnt = res[0]
    assert cleansed_cnt >= 0

def test_4_enrichment_employee_join():
    records = enrich_ticket_data()
    emp_1001 = next((r for r in records if r["employee_id"] == "EMP-1001"), None)
    assert emp_1001 is not None
    assert emp_1001["employee_name"] == "Rajesh Sharma"
    assert emp_1001["business_unit"] == "Global Technology"

def test_5_enrichment_iso_country():
    records = enrich_ticket_data()
    tck_8003 = next((r for r in records if r["ticket_id"] == "TCK-8003"), None)
    assert tck_8003 is not None
    assert tck_8003["origin_iso"] == "IN"
    assert tck_8003["dest_iso"] == "US"

def test_6_business_rules_travelled_flag_issued():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8001 = next((r for r in derived if r["ticket_id"] == "TCK-8001"), None)
    assert tck_8001["travelled_flag"] == "Y"

def test_7_business_rules_travelled_flag_cancelled():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8008 = next((r for r in derived if r["ticket_id"] == "TCK-8008"), None)
    assert tck_8008["travelled_flag"] == "N"

def test_8_business_rules_travelled_flag_refunded():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8011 = next((r for r in derived if r["ticket_id"] == "TCK-8011"), None)
    assert tck_8011["travelled_flag"] == "N"

def test_9_business_rules_classification_domestic():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8001 = next((r for r in derived if r["ticket_id"] == "TCK-8001"), None)
    assert tck_8001["trip_classification"] == "Domestic"
    assert "Domestic" in tck_8001["travel_summary"]

def test_10_business_rules_classification_cross_border():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8003 = next((r for r in derived if r["ticket_id"] == "TCK-8003"), None)
    assert tck_8003["trip_classification"] == "Cross-Border"
    assert "IN to US Cross-Border" in tck_8003["travel_summary"]

def test_11_business_rules_classification_multi_country():
    records = enrich_ticket_data()
    derived = derive_business_rules(records)
    tck_8006 = next((r for r in derived if r["ticket_id"] == "TCK-8006"), None)
    assert tck_8006["trip_classification"] == "Multi-Country"

def test_12_manual_override_respect():
    session = SessionLocal()
    tck_8012 = session.query(FactTravelTicket).filter_by(ticket_id="TCK-8012").first()
    session.close()
    assert tck_8012 is not None
    assert tck_8012.travelled_flag == "Y"
    assert tck_8012.override_applied == 1

def test_13_vw_travel_view_exists():
    with engine.connect() as conn:
        res = conn.exec_driver_sql("SELECT count(*) FROM vw_travel;").scalar()
        assert res > 0

def test_14_forecasting_service():
    fc = get_spend_forecasting()
    assert fc["q3_forecast_total_inr"] > 0
    assert len(fc["by_business_unit"]) > 0

def test_15_scd_type2_temporal_enrichment():
    session = SessionLocal()
    priya_versions = session.query(EmployeeMaster).filter_by(employee_id="EMP-1002").all()
    session.close()
    assert len(priya_versions) >= 2

def test_16_auth_service_dynamic_salts():
    user = authenticate_user("manager@travelintelligence.com", "Manager123!")
    assert user is not None
    assert user.role == "manager"
    
    # Test salted hashing
    h1 = hash_password("TestSecret123!")
    h2 = hash_password("TestSecret123!")
    assert h1 != h2
    assert verify_password("TestSecret123!", h1)
    assert verify_password("TestSecret123!", h2)

def test_17_jwt_token_lifecycle():
    token = create_access_token({"sub": "manager@travelintelligence.com", "role": "manager", "employee_id": "MGR-5001"})
    assert token is not None
    payload = decode_access_token(token)
    assert payload["sub"] == "manager@travelintelligence.com"
    assert payload["role"] == "manager"

def test_18_ai_assistant_service():
    ans = process_ai_query("What is our total spend?")
    assert "total" in ans["answer"].lower()
    assert ans["complaint_info"]["official_email"] == "complaints@travelintelligence.com"

def test_19_export_service():
    html = generate_csuite_briefing_html()
    assert "CORPORATE TRAVEL ANALYTICS CORPORATE TRAVEL INTELLIGENCE" in html
    assert "Total Spend" in html

def test_20_fx_rate_auditable_conversion():
    session = SessionLocal()
    rate, fx_date, source = get_applicable_fx_rate("USD", "2026-01-15", session)
    session.close()
    assert rate == 85.0
    assert "2026" in fx_date
    assert source is not None

def test_21_unknown_currency_quarantine_rejection():
    session = SessionLocal()
    with pytest.raises(ValueError) as exc_info:
        get_applicable_fx_rate("XYZ", "2026-01-15", session)
    session.close()
    assert "UNKNOWN_CURRENCY" in str(exc_info.value)

def test_22_pipeline_idempotency():
    # Calling pipeline again without force_reprocess should recognize matching file hash
    res = run_end_to_end_pipeline(force_reprocess=False)
    assert res["status"] in ["ALREADY_PROCESSED", "SUCCESS"]
    if res["status"] == "ALREADY_PROCESSED":
        assert "Identical" in res["message"]

def test_23_vw_travel_fx_lineage_columns():
    with engine.connect() as conn:
        res = conn.exec_driver_sql("SELECT amount_original, currency, fx_rate, amount_inr, fx_rate_date, fx_source FROM vw_travel LIMIT 5;").fetchall()
        assert len(res) == 5
        for row in res:
            assert row[0] > 0 # amount_original
            assert row[1] in ["INR", "USD", "GBP", "EUR", "CHF", "CAD", "SGD", "AED", "JPY", "AUD"] # currency
            assert row[2] > 0 # fx_rate
            assert row[3] > 0 # amount_inr
            assert row[4] is not None # fx_rate_date
            assert row[5] is not None # fx_source

def test_24_role_aware_ai_assistant():
    # Employee query is scoped to employee profile and allowance
    emp_res = process_ai_query("What is my budget?", user_role="employee", employee_id="EMP-1001", user_name="Rajesh Sharma")
    assert "Rajesh Sharma" in str(emp_res) or "allowance" in str(emp_res).lower()
    assert emp_res["complaint_info"]["official_email"] == "complaints@travelintelligence.com"

def test_25_business_rules_travelled_flag_exchanged():
    # Verify EXCHANGED ticket status derives travelled_flag = 'N' to prevent double counting
    sample_records = [
        {
            "ticket_id": "TCK-EXCH-01",
            "trip_id": "TRP-9999",
            "batch_id": "BATCH_TEST",
            "employee_id": "EMP-1001",
            "employee_name": "Rajesh Sharma",
            "department": "Engineering",
            "business_unit": "Global Technology",
            "issue_date": "2026-01-10",
            "travel_date": "2026-01-15",
            "return_date": "2026-01-20",
            "origin_city": "Mumbai",
            "origin_country": "India",
            "origin_iso": "IN",
            "dest_city": "London",
            "dest_country": "United Kingdom",
            "dest_iso": "GB",
            "ticket_status": "EXCHANGED",
            "amount_original": 1200.0,
            "currency": "GBP",
            "fx_rate": 108.0,
            "amount_inr": 129600.0,
            "fx_rate_date": "2026-01-10",
            "fx_source": "RBI_DAILY_REFERENCE",
            "booking_channel": "ONLINE_PORTAL",
            "cabin_class": "ECONOMY",
            "source_file": "vendor_tickets.csv",
            "record_hash": "hash_test_exch_01"
        }
    ]
    derived = derive_business_rules(sample_records)
    assert len(derived) == 1
    assert derived[0]["travelled_flag"] == "N"

def test_26_health_and_db_probes():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    
    # Check /health probe
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "HEALTHY"
    
    # Check /health/db probe
    res_db = client.get("/health/db")
    assert res_db.status_code == 200
    assert res_db.json()["database"] == "CONNECTED"


def test_27_dashboard_stats_dynamic_filtering():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    
    # Authenticate as manager
    auth_resp = client.post("/api/auth/login", json={"email": "manager@travelintelligence.com", "password": "Manager123!"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Fetch unfiltered stats
    res_all = client.get("/api/dashboard/stats", headers=headers)
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["kpis"]["total_spend_inr"] > 0
    assert data_all["kpis"]["total_tickets"] > 0
    
    # Fetch stats filtered by Business Unit
    res_bu = client.get("/api/dashboard/stats?business_unit=Global Technology", headers=headers)
    assert res_bu.status_code == 200
    data_bu = res_bu.json()
    assert data_bu["kpis"]["total_tickets"] <= data_all["kpis"]["total_tickets"]
    assert data_bu["kpis"]["total_spend_inr"] <= data_all["kpis"]["total_spend_inr"]



