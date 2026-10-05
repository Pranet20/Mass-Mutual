-- ============================================================================
-- MassMutual PS-04: Governed Multi-Tier Warehouse DDL & Schema Initialization
-- Single Source of Analytical Truth: public.vw_travel (37 Governed Columns)
-- ============================================================================

-- 1. FX Rates
CREATE TABLE IF NOT EXISTS fx_rates (
    id SERIAL PRIMARY KEY,
    currency_code VARCHAR(10) NOT NULL,
    rate_to_inr NUMERIC(18, 4) NOT NULL,
    effective_date VARCHAR(30) NOT NULL DEFAULT '2026-01-01',
    source VARCHAR(100) DEFAULT 'Approved Corporate Finance FX Source',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_fx_rates_currency_code ON fx_rates(currency_code);

-- 2. Staging Tickets (Raw Ingestion Landing)
CREATE TABLE IF NOT EXISTS staging_tickets (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_id VARCHAR(50) NOT NULL,
    trip_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    issue_date VARCHAR(30),
    travel_date VARCHAR(30),
    return_date VARCHAR(30),
    origin_city VARCHAR(100),
    origin_country VARCHAR(100),
    dest_city VARCHAR(100),
    dest_country VARCHAR(100),
    ticket_status VARCHAR(50),
    amount NUMERIC(18, 2),
    currency VARCHAR(10),
    booking_channel VARCHAR(50),
    cabin_class VARCHAR(50),
    record_hash VARCHAR(64),
    source_file VARCHAR(150),
    source_file_hash VARCHAR(64),
    raw_payload TEXT
);
CREATE INDEX IF NOT EXISTS ix_staging_tickets_batch_id ON staging_tickets(batch_id);
CREATE INDEX IF NOT EXISTS ix_staging_tickets_ticket_id ON staging_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS ix_staging_tickets_employee_id ON staging_tickets(employee_id);

-- 3. Cleansed Tickets (Normalized & Deduplicated)
CREATE TABLE IF NOT EXISTS cleansed_tickets (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    cleansed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_id VARCHAR(50) NOT NULL,
    trip_id VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    issue_date VARCHAR(30),
    travel_date VARCHAR(30),
    return_date VARCHAR(30),
    origin_city VARCHAR(100),
    origin_country VARCHAR(100),
    dest_city VARCHAR(100),
    dest_country VARCHAR(100),
    ticket_status VARCHAR(50),
    amount_original NUMERIC(18, 2),
    currency VARCHAR(10),
    fx_rate NUMERIC(18, 4),
    amount_inr NUMERIC(18, 2),
    fx_rate_date VARCHAR(30),
    fx_source VARCHAR(100),
    original_amount NUMERIC(18, 2),
    original_currency VARCHAR(10),
    booking_channel VARCHAR(50),
    cabin_class VARCHAR(50),
    is_duplicate INTEGER DEFAULT 0,
    duplicate_reason VARCHAR(100),
    record_hash VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS ix_cleansed_tickets_ticket_id ON cleansed_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS ix_cleansed_tickets_batch_id ON cleansed_tickets(batch_id);

-- 4. Quarantined Records (Error Taxonomy & Dead-Letter Queue)
CREATE TABLE IF NOT EXISTS quarantined_records (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    raw_record TEXT,
    rejection_reason VARCHAR(200),
    error_field VARCHAR(50),
    error_type VARCHAR(50),
    quarantined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Employee Master (SCD Type-2 Temporal History)
CREATE TABLE IF NOT EXISTS employee_master (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    business_unit VARCHAR(100) NOT NULL,
    business_group VARCHAR(100),
    department VARCHAR(100),
    designation VARCHAR(100),
    location VARCHAR(100),
    manager_id VARCHAR(50),
    effective_start_date VARCHAR(30) NOT NULL,
    effective_end_date VARCHAR(30) NOT NULL,
    quarterly_allowance_inr NUMERIC(18, 2),
    is_current INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS ix_employee_master_employee_id ON employee_master(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_master_business_unit ON employee_master(business_unit);
CREATE INDEX IF NOT EXISTS ix_employee_master_business_group ON employee_master(business_group);
CREATE INDEX IF NOT EXISTS ix_employee_master_is_current ON employee_master(is_current);

-- Migration safety for existing employee_master
ALTER TABLE employee_master ADD COLUMN IF NOT EXISTS business_group VARCHAR(100);

-- 6. Country Reference
CREATE TABLE IF NOT EXISTS country_reference (
    country_code VARCHAR(10) PRIMARY KEY,
    country_name VARCHAR(100) UNIQUE NOT NULL,
    iso_alpha2 VARCHAR(5),
    iso_alpha3 VARCHAR(5),
    region VARCHAR(50),
    is_domestic_base INTEGER DEFAULT 0
);

-- 7. Manual Overrides
CREATE TABLE IF NOT EXISTS manual_overrides (
    ticket_id VARCHAR(50) PRIMARY KEY,
    override_travelled_flag VARCHAR(5),
    override_classification VARCHAR(50),
    override_summary VARCHAR(100),
    override_reason TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'APPROVED'
);
ALTER TABLE manual_overrides ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE manual_overrides ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE manual_overrides ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';

-- 8. Manual Override Audits
CREATE TABLE IF NOT EXISTS manual_override_audits (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL,
    field_changed VARCHAR(50) NOT NULL,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    override_reason TEXT,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_manual_override_audits_ticket_id ON manual_override_audits(ticket_id);

-- 9. Fact Travel Tickets (Warehouse Grain: Ticket Leg)
CREATE TABLE IF NOT EXISTS fact_travel_tickets (
    ticket_id VARCHAR(50) PRIMARY KEY,
    trip_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100),
    business_unit VARCHAR(100),
    business_group VARCHAR(100),
    department VARCHAR(100),
    issue_date VARCHAR(30),
    travel_date VARCHAR(30),
    return_date VARCHAR(30),
    origin_city VARCHAR(100),
    origin_country VARCHAR(100),
    dest_city VARCHAR(100),
    dest_country VARCHAR(100),
    origin_iso VARCHAR(10),
    dest_iso VARCHAR(10),
    ticket_status VARCHAR(50),
    amount_original NUMERIC(18, 2),
    currency VARCHAR(10),
    fx_rate NUMERIC(18, 4),
    amount_inr NUMERIC(18, 2),
    fx_rate_date VARCHAR(30),
    fx_source VARCHAR(100),
    booking_channel VARCHAR(50),
    cabin_class VARCHAR(50),
    travelled_flag VARCHAR(5),
    trip_classification VARCHAR(50),
    travel_summary VARCHAR(100),
    policy_compliance_status VARCHAR(50),
    policy_violation_reason VARCHAR(200),
    approval_status VARCHAR(50) DEFAULT 'APPROVED',
    rejection_reason VARCHAR(200) DEFAULT 'None',
    override_applied INTEGER DEFAULT 0,
    record_hash VARCHAR(64),
    source_file VARCHAR(150) DEFAULT 'travel_raw_tickets.csv',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_trip_id ON fact_travel_tickets(trip_id);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_batch_id ON fact_travel_tickets(batch_id);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_employee_id ON fact_travel_tickets(employee_id);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_travel_date ON fact_travel_tickets(travel_date);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_business_unit ON fact_travel_tickets(business_unit);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_business_group ON fact_travel_tickets(business_group);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_approval_status ON fact_travel_tickets(approval_status);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_travelled_flag ON fact_travel_tickets(travelled_flag);
CREATE INDEX IF NOT EXISTS ix_fact_travel_tickets_ticket_status ON fact_travel_tickets(ticket_status);

-- Migration safety for existing fact_travel_tickets
ALTER TABLE fact_travel_tickets ADD COLUMN IF NOT EXISTS business_group VARCHAR(100);

-- 10. Pipeline Batch Audit
CREATE TABLE IF NOT EXISTS pipeline_batch_audit (
    batch_id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'RUNNING',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    source_file VARCHAR(150) DEFAULT 'travel_raw_tickets.csv',
    source_file_hash VARCHAR(64),
    records_received INTEGER DEFAULT 0,
    records_cleaned INTEGER DEFAULT 0,
    records_rejected INTEGER DEFAULT 0,
    records_quarantined INTEGER DEFAULT 0,
    records_published INTEGER DEFAULT 0,
    error_message TEXT DEFAULT 'None'
);

-- 11. Application Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    employee_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_employee_id ON users(employee_id);

-- 12. Employee Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(200) NOT NULL,
    details TEXT NOT NULL,
    submitted_by VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Governed Analytical View: public.vw_travel (37 Distinct Columns)
DROP VIEW IF EXISTS vw_travel CASCADE;
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

-- 14. Alembic Version Tag
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('546a7b0e7c2e');
