"""Initial production schema with fixed-precision financial types, constraints, and audit tables

Revision ID: 546a7b0e7c2e
Revises: 
Create Date: 2026-10-01 00:27:21.616985

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = '546a7b0e7c2e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    # 1. fx_rates
    if 'fx_rates' not in existing_tables:
        op.create_table(
            'fx_rates',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('currency_code', sa.String(length=10), nullable=False),
            sa.Column('rate_to_inr', sa.Numeric(precision=18, scale=4), nullable=False),
            sa.Column('effective_date', sa.String(length=30), nullable=False),
            sa.Column('source', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_fx_rates_currency_code', 'fx_rates', ['currency_code'])

    # 2. staging_tickets
    if 'staging_tickets' not in existing_tables:
        op.create_table(
            'staging_tickets',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('batch_id', sa.String(length=50), nullable=False),
            sa.Column('ingested_at', sa.DateTime(), nullable=True),
            sa.Column('ticket_id', sa.String(length=50), nullable=False),
            sa.Column('trip_id', sa.String(length=50), nullable=False),
            sa.Column('employee_id', sa.String(length=50), nullable=False),
            sa.Column('issue_date', sa.String(length=30), nullable=True),
            sa.Column('travel_date', sa.String(length=30), nullable=True),
            sa.Column('return_date', sa.String(length=30), nullable=True),
            sa.Column('origin_city', sa.String(length=100), nullable=True),
            sa.Column('origin_country', sa.String(length=100), nullable=True),
            sa.Column('dest_city', sa.String(length=100), nullable=True),
            sa.Column('dest_country', sa.String(length=100), nullable=True),
            sa.Column('ticket_status', sa.String(length=50), nullable=True),
            sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('currency', sa.String(length=10), nullable=True),
            sa.Column('booking_channel', sa.String(length=50), nullable=True),
            sa.Column('cabin_class', sa.String(length=50), nullable=True),
            sa.Column('record_hash', sa.String(length=64), nullable=True),
            sa.Column('source_file', sa.String(length=150), nullable=True),
            sa.Column('source_file_hash', sa.String(length=64), nullable=True),
            sa.Column('raw_payload', sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_staging_tickets_batch_id', 'staging_tickets', ['batch_id'])
        op.create_index('ix_staging_tickets_ticket_id', 'staging_tickets', ['ticket_id'])
        op.create_index('ix_staging_tickets_employee_id', 'staging_tickets', ['employee_id'])
        op.create_index('ix_staging_tickets_record_hash', 'staging_tickets', ['record_hash'])

    # 3. cleansed_tickets
    if 'cleansed_tickets' not in existing_tables:
        op.create_table(
            'cleansed_tickets',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('batch_id', sa.String(length=50), nullable=False),
            sa.Column('cleansed_at', sa.DateTime(), nullable=True),
            sa.Column('ticket_id', sa.String(length=50), nullable=False),
            sa.Column('trip_id', sa.String(length=50), nullable=False),
            sa.Column('employee_id', sa.String(length=50), nullable=False),
            sa.Column('issue_date', sa.String(length=30), nullable=True),
            sa.Column('travel_date', sa.String(length=30), nullable=True),
            sa.Column('return_date', sa.String(length=30), nullable=True),
            sa.Column('origin_city', sa.String(length=100), nullable=True),
            sa.Column('origin_country', sa.String(length=100), nullable=True),
            sa.Column('dest_city', sa.String(length=100), nullable=True),
            sa.Column('dest_country', sa.String(length=100), nullable=True),
            sa.Column('ticket_status', sa.String(length=50), nullable=True),
            sa.Column('amount_original', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('currency', sa.String(length=10), nullable=True),
            sa.Column('fx_rate', sa.Numeric(precision=18, scale=4), nullable=True),
            sa.Column('amount_inr', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('fx_rate_date', sa.String(length=30), nullable=True),
            sa.Column('fx_source', sa.String(length=100), nullable=True),
            sa.Column('original_amount', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('original_currency', sa.String(length=10), nullable=True),
            sa.Column('booking_channel', sa.String(length=50), nullable=True),
            sa.Column('cabin_class', sa.String(length=50), nullable=True),
            sa.Column('is_duplicate', sa.Integer(), nullable=True),
            sa.Column('record_hash', sa.String(length=64), nullable=True),
            sa.Column('source_file', sa.String(length=150), nullable=True),
            sa.Column('duplicate_reason', sa.String(length=200), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_cleansed_tickets_batch_id', 'cleansed_tickets', ['batch_id'])
        op.create_index('ix_cleansed_tickets_ticket_id', 'cleansed_tickets', ['ticket_id'])
        op.create_index('ix_cleansed_tickets_employee_id', 'cleansed_tickets', ['employee_id'])

    # 4. quarantined_records
    if 'quarantined_records' not in existing_tables:
        op.create_table(
            'quarantined_records',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('batch_id', sa.String(length=50), nullable=False),
            sa.Column('ticket_id', sa.String(length=50), nullable=True),
            sa.Column('error_type', sa.String(length=50), nullable=False),
            sa.Column('error_message', sa.Text(), nullable=False),
            sa.Column('raw_payload', sa.Text(), nullable=True),
            sa.Column('source_file', sa.String(length=150), nullable=True),
            sa.Column('quarantined_at', sa.DateTime(), nullable=True),
            sa.Column('is_resolved', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_quarantined_records_batch_id', 'quarantined_records', ['batch_id'])
        op.create_index('ix_quarantined_records_ticket_id', 'quarantined_records', ['ticket_id'])

    # 5. employee_master
    if 'employee_master' not in existing_tables:
        op.create_table(
            'employee_master',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('employee_id', sa.String(length=50), nullable=False),
            sa.Column('employee_name', sa.String(length=100), nullable=False),
            sa.Column('email', sa.String(length=100), nullable=True),
            sa.Column('business_unit', sa.String(length=100), nullable=False),
            sa.Column('business_group', sa.String(length=100), nullable=True),
            sa.Column('department', sa.String(length=100), nullable=True),
            sa.Column('designation', sa.String(length=100), nullable=True),
            sa.Column('location', sa.String(length=100), nullable=True),
            sa.Column('manager_id', sa.String(length=50), nullable=True),
            sa.Column('effective_start_date', sa.String(length=30), nullable=False),
            sa.Column('effective_end_date', sa.String(length=30), nullable=False),
            sa.Column('quarterly_allowance_inr', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('is_current', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_employee_master_employee_id', 'employee_master', ['employee_id'])
        op.create_index('ix_employee_master_business_unit', 'employee_master', ['business_unit'])
        op.create_index('ix_employee_master_business_group', 'employee_master', ['business_group'])
        op.create_index('ix_employee_master_is_current', 'employee_master', ['is_current'])
    else:
        emp_cols = [c['name'] for c in inspector.get_columns('employee_master')]
        if 'business_group' not in emp_cols:
            op.add_column('employee_master', sa.Column('business_group', sa.String(length=100), nullable=True))

    # 6. country_reference
    if 'country_reference' not in existing_tables:
        op.create_table(
            'country_reference',
            sa.Column('country_code', sa.String(length=10), nullable=False),
            sa.Column('country_name', sa.String(length=100), nullable=False),
            sa.Column('iso_alpha2', sa.String(length=5), nullable=True),
            sa.Column('iso_alpha3', sa.String(length=5), nullable=True),
            sa.Column('region', sa.String(length=50), nullable=True),
            sa.Column('is_domestic_base', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('country_code'),
            sa.UniqueConstraint('country_name')
        )

    # 7. manual_overrides
    if 'manual_overrides' not in existing_tables:
        op.create_table(
            'manual_overrides',
            sa.Column('ticket_id', sa.String(length=50), nullable=False),
            sa.Column('override_travelled_flag', sa.String(length=5), nullable=True),
            sa.Column('override_classification', sa.String(length=50), nullable=True),
            sa.Column('override_summary', sa.String(length=100), nullable=True),
            sa.Column('override_reason', sa.Text(), nullable=True),
            sa.Column('created_by', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('approved_by', sa.String(length=100), nullable=True),
            sa.Column('approved_at', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=True),
            sa.PrimaryKeyConstraint('ticket_id')
        )
    else:
        mo_cols = [c['name'] for c in inspector.get_columns('manual_overrides')]
        if 'approved_by' not in mo_cols:
            op.add_column('manual_overrides', sa.Column('approved_by', sa.String(length=100), nullable=True))
        if 'approved_at' not in mo_cols:
            op.add_column('manual_overrides', sa.Column('approved_at', sa.DateTime(), nullable=True))
        if 'status' not in mo_cols:
            op.add_column('manual_overrides', sa.Column('status', sa.String(length=50), nullable=True, server_default='APPROVED'))

    # 8. manual_override_audits
    if 'manual_override_audits' not in existing_tables:
        op.create_table(
            'manual_override_audits',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('ticket_id', sa.String(length=50), nullable=False),
            sa.Column('field_changed', sa.String(length=50), nullable=False),
            sa.Column('old_value', sa.String(length=100), nullable=True),
            sa.Column('new_value', sa.String(length=100), nullable=True),
            sa.Column('override_reason', sa.Text(), nullable=True),
            sa.Column('changed_by', sa.String(length=100), nullable=False),
            sa.Column('changed_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_manual_override_audits_ticket_id', 'manual_override_audits', ['ticket_id'])

    # 9. fact_travel_tickets
    if 'fact_travel_tickets' not in existing_tables:
        op.create_table(
            'fact_travel_tickets',
            sa.Column('ticket_id', sa.String(length=50), nullable=False),
            sa.Column('trip_id', sa.String(length=50), nullable=False),
            sa.Column('batch_id', sa.String(length=50), nullable=True),
            sa.Column('employee_id', sa.String(length=50), nullable=False),
            sa.Column('employee_name', sa.String(length=100), nullable=True),
            sa.Column('business_unit', sa.String(length=100), nullable=True),
            sa.Column('business_group', sa.String(length=100), nullable=True),
            sa.Column('department', sa.String(length=100), nullable=True),
            sa.Column('issue_date', sa.String(length=30), nullable=True),
            sa.Column('travel_date', sa.String(length=30), nullable=True),
            sa.Column('return_date', sa.String(length=30), nullable=True),
            sa.Column('origin_city', sa.String(length=100), nullable=True),
            sa.Column('origin_country', sa.String(length=100), nullable=True),
            sa.Column('dest_city', sa.String(length=100), nullable=True),
            sa.Column('dest_country', sa.String(length=100), nullable=True),
            sa.Column('origin_iso', sa.String(length=10), nullable=True),
            sa.Column('dest_iso', sa.String(length=10), nullable=True),
            sa.Column('ticket_status', sa.String(length=50), nullable=True),
            sa.Column('amount_original', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('currency', sa.String(length=10), nullable=True),
            sa.Column('fx_rate', sa.Numeric(precision=18, scale=4), nullable=True),
            sa.Column('amount_inr', sa.Numeric(precision=18, scale=2), nullable=True),
            sa.Column('fx_rate_date', sa.String(length=30), nullable=True),
            sa.Column('fx_source', sa.String(length=100), nullable=True),
            sa.Column('booking_channel', sa.String(length=50), nullable=True),
            sa.Column('cabin_class', sa.String(length=50), nullable=True),
            sa.Column('travelled_flag', sa.String(length=5), nullable=True),
            sa.Column('trip_classification', sa.String(length=50), nullable=True),
            sa.Column('travel_summary', sa.String(length=100), nullable=True),
            sa.Column('policy_compliance_status', sa.String(length=50), nullable=True),
            sa.Column('policy_violation_reason', sa.String(length=200), nullable=True),
            sa.Column('approval_status', sa.String(length=50), nullable=True),
            sa.Column('rejection_reason', sa.String(length=200), nullable=True),
            sa.Column('override_applied', sa.Integer(), nullable=True),
            sa.Column('record_hash', sa.String(length=64), nullable=True),
            sa.Column('source_file', sa.String(length=150), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('ticket_id')
        )
        op.create_index('ix_fact_travel_tickets_trip_id', 'fact_travel_tickets', ['trip_id'])
        op.create_index('ix_fact_travel_tickets_batch_id', 'fact_travel_tickets', ['batch_id'])
        op.create_index('ix_fact_travel_tickets_employee_id', 'fact_travel_tickets', ['employee_id'])
        op.create_index('ix_fact_travel_tickets_travel_date', 'fact_travel_tickets', ['travel_date'])
        op.create_index('ix_fact_travel_tickets_business_unit', 'fact_travel_tickets', ['business_unit'])
        op.create_index('ix_fact_travel_tickets_business_group', 'fact_travel_tickets', ['business_group'])
    else:
        fact_cols = [c['name'] for c in inspector.get_columns('fact_travel_tickets')]
        if 'business_group' not in fact_cols:
            op.add_column('fact_travel_tickets', sa.Column('business_group', sa.String(length=100), nullable=True))

    # 10. pipeline_batch_audit
    if 'pipeline_batch_audit' not in existing_tables:
        op.create_table(
            'pipeline_batch_audit',
            sa.Column('batch_id', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('started_at', sa.DateTime(), nullable=True),
            sa.Column('completed_at', sa.DateTime(), nullable=True),
            sa.Column('source_file', sa.String(length=150), nullable=True),
            sa.Column('source_file_hash', sa.String(length=64), nullable=True),
            sa.Column('records_received', sa.Integer(), nullable=True),
            sa.Column('records_cleaned', sa.Integer(), nullable=True),
            sa.Column('records_rejected', sa.Integer(), nullable=True),
            sa.Column('records_quarantined', sa.Integer(), nullable=True),
            sa.Column('records_published', sa.Integer(), nullable=True),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint('batch_id')
        )

    # 11. users
    if 'users' not in existing_tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('email', sa.String(length=100), nullable=False),
            sa.Column('password_hash', sa.String(length=200), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('employee_id', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('email')
        )

    # 12. complaints
    if 'complaints' not in existing_tables:
        op.create_table(
            'complaints',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('subject', sa.String(length=200), nullable=False),
            sa.Column('details', sa.Text(), nullable=False),
            sa.Column('submitted_by', sa.String(length=100), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

    # 13. Create Governed Analytical View: vw_travel
    try:
        conn.execute(sa.text("DROP VIEW IF EXISTS vw_travel;"))
        conn.execute(sa.text("""
        CREATE VIEW vw_travel AS
        SELECT 
            ticket_id, trip_id, batch_id, employee_id, employee_name,
            business_unit, business_group, department, issue_date, travel_date, return_date,
            origin_city, origin_country, dest_city, dest_country, origin_iso,
            dest_iso, ticket_status, amount_original, currency, fx_rate,
            amount_inr, fx_rate_date, fx_source, booking_channel, cabin_class,
            travelled_flag, trip_classification, travel_summary,
            policy_compliance_status, policy_violation_reason, approval_status,
            rejection_reason, override_applied, record_hash, source_file, updated_at
        FROM fact_travel_tickets;
        """))
    except Exception as e:
        print(f"[ALEMBIC VIEW NOTICE] {e}")


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DROP VIEW IF EXISTS vw_travel;"))
    op.drop_table('complaints')
    op.drop_table('users')
    op.drop_table('pipeline_batch_audit')
    op.drop_table('fact_travel_tickets')
    op.drop_table('manual_override_audits')
    op.drop_table('manual_overrides')
    op.drop_table('country_reference')
    op.drop_table('employee_master')
    op.drop_table('quarantined_records')
    op.drop_table('cleansed_tickets')
    op.drop_table('staging_tickets')
    op.drop_table('fx_rates')
