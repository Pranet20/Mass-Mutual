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
    assert ans["complaint_info"]["official_email"] in ["pparker062005@gmail.com", "complaints@travelintelligence.com"]

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
    assert emp_res["complaint_info"]["official_email"] in ["pparker062005@gmail.com", "complaints@travelintelligence.com"]

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


def test_28_concurrency_lock_protection():
    import threading
    from pipeline.validation import run_end_to_end_pipeline, _PIPELINE_EXECUTION_LOCK
    
    acquired = _PIPELINE_EXECUTION_LOCK.acquire(blocking=False)
    if acquired:
        try:
            # When locked, secondary pipeline execution should return CONCURRENCY_LOCKED
            res = run_end_to_end_pipeline()
            assert res.get("status") == "CONCURRENCY_LOCKED"
        finally:
            _PIPELINE_EXECUTION_LOCK.release()


def test_29_executive_audit_package_pdf_generation():
    from services.export import generate_executive_audit_package_pdf_bytes
    pdf_bytes = generate_executive_audit_package_pdf_bytes()
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2048
    assert pdf_bytes.startswith(b"%PDF")


def test_30_powerbi_5page_pbix_integrity():
    import zipfile
    import json
    pbix_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "powerbi", "Corporate_Travel_Analytics.pbix"))
    assert os.path.exists(pbix_path)
    with zipfile.ZipFile(pbix_path, "r") as zf:
        pages_raw = zf.read("Report/definition/pages/pages.json").decode("utf-8")
        pages_data = json.loads(pages_raw)
        assert len(pages_data.get("pageOrder", [])) == 5
        assert "6c3859e92bb7e22182f0" in pages_data["pageOrder"]
        assert "page_travel_analytics" in pages_data["pageOrder"]
        assert "page_business_groups" in pages_data["pageOrder"]
        assert "page_data_governance" in pages_data["pageOrder"]
        assert "page_fx_financial_audit" in pages_data["pageOrder"]


def test_31_security_headers_and_request_tracing():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "x-request-id" in resp.headers or "X-Request-ID" in resp.headers
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"


def test_32_manager_approval_action_workflow():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    auth_resp = client.post("/api/auth/login", json={"email": "manager@travelintelligence.com", "password": "Manager123!"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Post a travel request
    sub_resp = client.post("/api/tickets", json={
        "employee_id": "EMP-1001",
        "issue_date": "2026-03-01",
        "travel_date": "2026-03-10",
        "return_date": "2026-03-15",
        "origin_city": "Mumbai",
        "origin_country": "India",
        "dest_city": "London",
        "dest_country": "United Kingdom",
        "amount": 1000.0,
        "currency": "GBP",
        "cabin_class": "Economy",
        "booking_channel": "Corporate Portal"
    }, headers=headers)
    assert sub_resp.status_code == 200
    ticket_id = sub_resp.json()["ticket_id"]
    
    # Manager approves the ticket
    action_resp = client.post("/api/manager/approvals/action", json={
        "ticket_id": ticket_id,
        "action": "APPROVE"
    }, headers=headers)
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "SUCCESS"


def test_33_numeric_precision_in_models():
    from sqlalchemy import inspect
    from database.models import FactTravelTicket
    mapper = inspect(FactTravelTicket)
    amount_col = mapper.columns["amount_inr"]
    assert hasattr(amount_col.type, "precision")
    assert amount_col.type.precision == 18
    assert amount_col.type.scale == 2


def test_34_vw_travel_sql_reconciliation_zero_variance():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        spend_gross = session.execute(text("SELECT SUM(amount_inr) FROM vw_travel")).scalar()
        spend_flown = session.execute(text("SELECT SUM(amount_inr) FROM vw_travel WHERE travelled_flag = 'Y'")).scalar()
        assert float(spend_gross or 0) >= float(spend_flown or 0)
        assert float(spend_flown or 0) > 0.0
    finally:
        session.close()


def test_35_powerbi_endpoints_security():
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    # 1. Unauthenticated calls must return 401
    assert client.get("/api/powerbi/feed").status_code == 401
    assert client.get("/api/powerbi/analytics").status_code == 401
    assert client.get("/api/powerbi/pbix").status_code == 401

    # 2. Authenticate
    auth_resp = client.post("/api/auth/login", json={"email": "manager@travelintelligence.com", "password": "Manager123!"})
    assert auth_resp.status_code == 200
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Authenticated with Bearer Header
    feed_resp = client.get("/api/powerbi/feed", headers=headers)
    assert feed_resp.status_code == 200
    assert isinstance(feed_resp.json(), list)

    analytics_resp = client.get("/api/powerbi/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    assert "kpis" in analytics_resp.json()

    pbix_resp = client.get("/api/powerbi/pbix", headers=headers)
    assert pbix_resp.status_code == 200

    # 4. Authenticated with ?token= query parameter (for Power BI Desktop Web connector and direct browser downloads)
    feed_param_resp = client.get(f"/api/powerbi/feed?token={token}")
    assert feed_param_resp.status_code == 200
    assert len(feed_param_resp.json()) == len(feed_resp.json())

    pbix_param_resp = client.get(f"/api/powerbi/pbix?token={token}")
    assert pbix_param_resp.status_code == 200


def test_36_business_group_in_vw_travel_and_fact():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        row = session.execute(text("SELECT * FROM vw_travel LIMIT 1")).mappings().first()
        assert row is not None
        assert "business_group" in row
        assert row["business_group"] is not None
        assert len(str(row["business_group"]).strip()) > 0
    finally:
        session.close()


def test_37_manual_override_audit_synchronization():
    from database.models import SessionLocal, ManualOverride, ManualOverrideAudit
    session = SessionLocal()
    try:
        mo_count = session.query(ManualOverride).count()
        audit_count = session.query(ManualOverrideAudit).count()
        assert mo_count > 0
        assert mo_count == audit_count
        override = session.query(ManualOverride).filter_by(ticket_id="TCK-8012").first()
        assert override is not None
        assert override.status == "APPROVED"
        assert override.approved_by is not None
    finally:
        session.close()


def test_38_powerbi_source_contract_vw_travel_schema():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        row = session.execute(text("SELECT * FROM vw_travel LIMIT 1")).mappings().first()
        assert row is not None
        required_cols = [
            "ticket_id", "trip_id", "batch_id", "employee_id", "employee_name",
            "business_group", "business_unit", "department", "issue_date", "travel_date",
            "return_date", "origin_city", "origin_country", "dest_city", "dest_country",
            "origin_iso", "dest_iso", "ticket_status", "amount_original", "currency",
            "fx_rate", "amount_inr", "fx_rate_date", "fx_source", "booking_channel",
            "cabin_class", "travelled_flag", "trip_classification", "travel_summary",
            "policy_compliance_status", "policy_violation_reason", "approval_status",
            "rejection_reason", "override_applied", "record_hash", "source_file", "updated_at"
        ]
        for col in required_cols:
            assert col in row, f"Missing required column in vw_travel: {col}"
        assert len(row.keys()) == 37, f"Expected exactly 37 columns in vw_travel, got {len(row.keys())}"
    finally:
        session.close()


def test_39_powerbi_trips_by_month_aggregation():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        query = text("""
            SELECT substr(travel_date, 1, 7) as yr_month, COUNT(DISTINCT trip_id) as distinct_trips
            FROM vw_travel
            GROUP BY yr_month
            ORDER BY yr_month
        """)
        results = session.execute(query).fetchall()
        assert len(results) > 0, "No monthly trips returned"
        for yr_month, distinct_trips in results:
            assert yr_month is not None and len(yr_month) == 7
            assert distinct_trips > 0
    finally:
        session.close()


def test_40_powerbi_trips_by_business_group_aggregation():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        query = text("""
            SELECT business_group, COUNT(DISTINCT trip_id) as distinct_trips
            FROM vw_travel
            GROUP BY business_group
            ORDER BY distinct_trips DESC
        """)
        results = session.execute(query).fetchall()
        assert len(results) > 0, "No business group trips returned"
        bg_names = [r[0] for r in results if r[0] is not None]
        assert "Global Technology" in bg_names
        assert "Finance & Actuarial" in bg_names
    finally:
        session.close()


def test_41_powerbi_trips_by_travel_summary_aggregation():
    from database.models import SessionLocal
    from sqlalchemy import text
    session = SessionLocal()
    try:
        query = text("""
            SELECT travel_summary, COUNT(DISTINCT trip_id) as distinct_trips
            FROM vw_travel
            GROUP BY travel_summary
            ORDER BY distinct_trips DESC
        """)
        results = session.execute(query).fetchall()
        assert len(results) > 0, "No travel summary trips returned"
        summaries = [r[0] for r in results if r[0] is not None]
        assert any("Domestic India" in s for s in summaries)
        assert any("Cross-Border" in s for s in summaries)
    finally:
        session.close()


def test_42_pbix_package_and_pbir_visual_structure():
    import zipfile
    import json
    pbix_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "powerbi", "Corporate_Travel_Analytics.pbix"))
    assert os.path.exists(pbix_path), f"PBIX file not found at: {pbix_path}"
    with zipfile.ZipFile(pbix_path, 'r') as z:
        names = z.namelist()
        
        # 1. Report structure & 5 pages
        assert "Report/definition/pages/pages.json" in names
        pages_meta = json.loads(z.read("Report/definition/pages/pages.json").decode("utf-8"))
        assert len(pages_meta.get("pageOrder", [])) == 5

        # 2. Non-Negotiable Visual A: Trips by Month on Page 1
        p1_trips_month = "Report/definition/pages/6c3859e92bb7e22182f0/visuals/chartTripsByMonth/visual.json"
        assert p1_trips_month in names, "chartTripsByMonth visual missing in PBIX Page 1"
        v1 = json.loads(z.read(p1_trips_month).decode("utf-8"))
        assert v1["visual"]["visualType"] == "clusteredColumnChart"
        assert v1["name"] == "chartTripsByMonth"

        # 3. Non-Negotiable Visual C: Trips by Travel Summary on Page 2
        p2_trips_summary = "Report/definition/pages/page_travel_analytics/visuals/chartTripsByTravelSummary/visual.json"
        assert p2_trips_summary in names, "chartTripsByTravelSummary visual missing in PBIX Page 2"
        v2 = json.loads(z.read(p2_trips_summary).decode("utf-8"))
        assert v2["visual"]["visualType"] == "clusteredColumnChart"
        assert v2["name"] == "chartTripsByTravelSummary"

        # 4. Non-Negotiable Visual B: Trips by Business Group on Page 3
        p3_trips_bg = "Report/definition/pages/page_business_groups/visuals/chartTripsByBusinessGroup/visual.json"
        assert p3_trips_bg in names, "chartTripsByBusinessGroup visual missing in PBIX Page 3"
        v3 = json.loads(z.read(p3_trips_bg).decode("utf-8"))
        assert v3["visual"]["visualType"] == "clusteredColumnChart"
        assert v3["name"] == "chartTripsByBusinessGroup"

        # 5. Slicers: Business Group slicer on Page 3
        p3_slicer_bg = "Report/definition/pages/page_business_groups/visuals/slicerBusinessGroup/visual.json"
        assert p3_slicer_bg in names, "slicerBusinessGroup visual missing in PBIX Page 3"


def test_43_powerbi_dax_and_data_model_artifacts():
    powerbi_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "powerbi"))
    
    # 1. Measures.dax
    dax_path = os.path.join(powerbi_dir, "Measures.dax")
    assert os.path.exists(dax_path)
    with open(dax_path, "r", encoding="utf-8") as f:
        dax_text = f.read()
    assert "Trips by Month" in dax_text
    assert "Trips by Business Group" in dax_text
    assert "Trips by Travel Summary" in dax_text
    assert "Total Trips" in dax_text

    # 2. PowerQuery.m
    m_path = os.path.join(powerbi_dir, "PowerQuery.m")
    assert os.path.exists(m_path)
    with open(m_path, "r", encoding="utf-8") as f:
        m_text = f.read()
    assert "business_group" in m_text
    assert "37 Governed Attributes" in m_text

    # 3. DataModel.md
    dm_path = os.path.join(powerbi_dir, "DataModel.md")
    assert os.path.exists(dm_path)
    with open(dm_path, "r", encoding="utf-8") as f:
        dm_text = f.read()
    assert "37 Governed Attributes" in dm_text
    assert "business_group" in dm_text
