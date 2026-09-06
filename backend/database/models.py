import datetime
import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.orm import declarative_base, sessionmaker

def get_utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

DB_PATH = os.path.join(os.path.dirname(__file__), "travel_analytics.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FXRate(Base):
    __tablename__ = "fx_rates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    currency_code = Column(String(10), nullable=False, index=True)
    rate_to_inr = Column(Float, nullable=False)
    effective_date = Column(String(30), nullable=False, default="2026-01-01")
    source = Column(String(100), default="Approved Corporate Finance FX Source")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now)

class StagingTicket(Base):
    __tablename__ = "staging_tickets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), nullable=False, index=True)
    ingested_at = Column(DateTime, default=get_utc_now)
    ticket_id = Column(String(50), nullable=False, index=True)
    trip_id = Column(String(50), nullable=False)
    employee_id = Column(String(50), nullable=False, index=True)
    issue_date = Column(String(30))
    travel_date = Column(String(30))
    return_date = Column(String(30))
    origin_city = Column(String(100))
    origin_country = Column(String(100))
    dest_city = Column(String(100))
    dest_country = Column(String(100))
    ticket_status = Column(String(50))
    amount = Column(Float)
    currency = Column(String(10))
    booking_channel = Column(String(50))
    cabin_class = Column(String(50))
    record_hash = Column(String(64), index=True)
    source_file = Column(String(150), default="travel_raw_tickets.csv")
    source_file_hash = Column(String(64))
    raw_payload = Column(Text)

class CleansedTicket(Base):
    __tablename__ = "cleansed_tickets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), nullable=False, index=True)
    cleansed_at = Column(DateTime, default=get_utc_now)
    ticket_id = Column(String(50), nullable=False, index=True)
    trip_id = Column(String(50), nullable=False)
    employee_id = Column(String(50), nullable=False, index=True)
    issue_date = Column(String(30))
    travel_date = Column(String(30))
    return_date = Column(String(30))
    origin_city = Column(String(100))
    origin_country = Column(String(100))
    dest_city = Column(String(100))
    dest_country = Column(String(100))
    ticket_status = Column(String(50))
    amount_original = Column(Float)
    currency = Column(String(10))
    fx_rate = Column(Float, default=1.0)
    amount_inr = Column(Float)
    fx_rate_date = Column(String(30), default="2026-01-01")
    fx_source = Column(String(100), default="Approved Corporate Finance FX Source")
    original_amount = Column(Float)
    original_currency = Column(String(10))
    booking_channel = Column(String(50))
    cabin_class = Column(String(50))
    is_duplicate = Column(Integer, default=0)
    record_hash = Column(String(64))
    source_file = Column(String(150), default="travel_raw_tickets.csv")
    duplicate_reason = Column(String(200), default="None")

class QuarantinedRecord(Base):
    __tablename__ = "quarantined_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(50), nullable=False, index=True)
    ticket_id = Column(String(50), nullable=True, index=True)
    error_type = Column(String(50), nullable=False)  # NULL_TICKET_ID, INVALID_AMOUNT, UNKNOWN_CURRENCY, INVALID_DATE, MISSING_TRAVEL_DATE
    error_message = Column(Text, nullable=False)
    raw_payload = Column(Text)
    source_file = Column(String(150), default="travel_raw_tickets.csv")
    quarantined_at = Column(DateTime, default=get_utc_now)
    is_resolved = Column(Integer, default=0)

class EmployeeMaster(Base):
    __tablename__ = "employee_master"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(String(50), nullable=False, index=True)
    employee_name = Column(String(100), nullable=False)
    email = Column(String(100))
    business_unit = Column(String(100), nullable=False, index=True)
    department = Column(String(100))
    designation = Column(String(100))
    location = Column(String(100))
    manager_id = Column(String(50))
    effective_start_date = Column(String(30), nullable=False)
    effective_end_date = Column(String(30), nullable=False)
    quarterly_allowance_inr = Column(Float, nullable=True)
    is_current = Column(Integer, default=1, index=True)

class CountryReference(Base):
    __tablename__ = "country_reference"
    
    country_code = Column(String(10), primary_key=True)
    country_name = Column(String(100), nullable=False, unique=True)
    iso_alpha2 = Column(String(5))
    iso_alpha3 = Column(String(5))
    region = Column(String(50))
    is_domestic_base = Column(Integer, default=0)

class ManualOverride(Base):
    __tablename__ = "manual_overrides"
    
    ticket_id = Column(String(50), primary_key=True)
    override_travelled_flag = Column(String(5))
    override_classification = Column(String(50))
    override_summary = Column(String(100))
    override_reason = Column(Text)
    created_by = Column(String(100))
    created_at = Column(DateTime, default=get_utc_now)

class ManualOverrideAudit(Base):
    __tablename__ = "manual_override_audits"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(String(50), nullable=False, index=True)
    field_changed = Column(String(50), nullable=False)
    old_value = Column(String(100))
    new_value = Column(String(100))
    override_reason = Column(Text)
    changed_by = Column(String(100), nullable=False)
    changed_at = Column(DateTime, default=get_utc_now)

class FactTravelTicket(Base):
    __tablename__ = "fact_travel_tickets"
    
    ticket_id = Column(String(50), primary_key=True)
    trip_id = Column(String(50), nullable=False, index=True)
    batch_id = Column(String(50), index=True)
    employee_id = Column(String(50), nullable=False, index=True)
    employee_name = Column(String(100))
    business_unit = Column(String(100), index=True)
    department = Column(String(100))
    issue_date = Column(String(30))
    travel_date = Column(String(30), index=True)
    return_date = Column(String(30))
    origin_city = Column(String(100))
    origin_country = Column(String(100))
    dest_city = Column(String(100))
    dest_country = Column(String(100))
    origin_iso = Column(String(10))
    dest_iso = Column(String(10))
    ticket_status = Column(String(50), index=True)
    
    # Financial & FX Lineage
    amount_original = Column(Float)
    currency = Column(String(10))
    fx_rate = Column(Float, default=1.0)
    amount_inr = Column(Float)
    fx_rate_date = Column(String(30), default="2026-01-01")
    fx_source = Column(String(100), default="Approved Corporate Finance FX Source")

    booking_channel = Column(String(50))
    cabin_class = Column(String(50))
    
    # Derived analytical columns
    travelled_flag = Column(String(5), index=True)
    trip_classification = Column(String(50))
    travel_summary = Column(String(100))
    policy_compliance_status = Column(String(50), default="COMPLIANT")
    policy_violation_reason = Column(String(200), default="None")
    approval_status = Column(String(50), default="APPROVED", index=True)
    rejection_reason = Column(String(200), default="None")
    override_applied = Column(Integer, default=0)
    record_hash = Column(String(64))
    source_file = Column(String(150), default="travel_raw_tickets.csv")
    updated_at = Column(DateTime, default=get_utc_now)

class PipelineBatchAudit(Base):
    __tablename__ = "pipeline_batch_audit"
    
    batch_id = Column(String(50), primary_key=True)
    status = Column(String(20), default="RUNNING") # NEW, RUNNING, SUCCESS, DUPLICATE, FAILED
    started_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, nullable=True)
    source_file = Column(String(150), default="travel_raw_tickets.csv")
    source_file_hash = Column(String(64))
    records_received = Column(Integer, default=0)
    records_cleaned = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    records_quarantined = Column(Integer, default=0)
    records_published = Column(Integer, default=0)
    error_message = Column(Text, default="None")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False) # manager, employee, admin
    employee_id = Column(String(50), index=True)
    created_at = Column(DateTime, default=get_utc_now)

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject = Column(String(200), nullable=False)
    details = Column(Text, nullable=False)
    submitted_by = Column(String(100), nullable=False)
    status = Column(String(50), default="OPEN")
    created_at = Column(DateTime, default=get_utc_now)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        conn.exec_driver_sql("DROP VIEW IF EXISTS vw_travel;")
        create_view_sql = """
        CREATE VIEW vw_travel AS
        SELECT 
            ticket_id,
            trip_id,
            batch_id,
            employee_id,
            employee_name,
            business_unit,
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
        """
        conn.exec_driver_sql(create_view_sql)
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database schema initialized with FXRate, QuarantinedRecords, ManualOverrideAudits, and Indexes.")
