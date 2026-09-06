def get_governed_data_dictionary() -> dict:
    """
    Returns the authoritative governed data dictionary and column definitions for the analytical view vw_travel
    and core dimensional / fact tables.
    """
    return {
        "view_name": "vw_travel",
        "description": "Enterprise governed analytical projection of the enriched fact table (FactTravelTicket).",
        "total_columns": 36,
        "primary_database_key": "ticket_id (VARCHAR(50), Primary Fact Key)",
        "trip_grouping_key": "trip_id (VARCHAR(50), Itinerary Cluster)",
        "hash_algorithm": "SHA-256 Cryptographic Hash",
        "columns": [
            {"column_name": "ticket_id", "data_type": "VARCHAR(50)", "description": "Unique vendor travel ticket number (Natural Fact Key)."},
            {"column_name": "trip_id", "data_type": "VARCHAR(50)", "description": "Itinerary grouping identifier linking multi-leg flight legs."},
            {"column_name": "batch_id", "data_type": "VARCHAR(50)", "description": "ETL Ingestion batch identifier."},
            {"column_name": "employee_id", "data_type": "VARCHAR(50)", "description": "Corporate employee identifier (Dimension Key)."},
            {"column_name": "employee_name", "data_type": "VARCHAR(100)", "description": "Enriched employee full name from EmployeeMaster."},
            {"column_name": "business_unit", "data_type": "VARCHAR(100)", "description": "SCD Type-2 historical business unit at time of travel."},
            {"column_name": "department", "data_type": "VARCHAR(100)", "description": "SCD Type-2 historical department at time of travel."},
            {"column_name": "issue_date", "data_type": "DATE (ISO YYYY-MM-DD)", "description": "Date ticket was booked/issued."},
            {"column_name": "travel_date", "data_type": "DATE (ISO YYYY-MM-DD)", "description": "Outbound departure date."},
            {"column_name": "return_date", "data_type": "DATE (ISO YYYY-MM-DD)", "description": "Return arrival date."},
            {"column_name": "origin_city", "data_type": "VARCHAR(100)", "description": "Departure origin city."},
            {"column_name": "origin_country", "data_type": "VARCHAR(100)", "description": "Departure origin country name."},
            {"column_name": "dest_city", "data_type": "VARCHAR(100)", "description": "Arrival destination city."},
            {"column_name": "dest_country", "data_type": "VARCHAR(100)", "description": "Arrival destination country name."},
            {"column_name": "origin_iso", "data_type": "VARCHAR(10)", "description": "ISO Alpha-2 origin country code from CountryReference."},
            {"column_name": "dest_iso", "data_type": "VARCHAR(10)", "description": "ISO Alpha-2 destination country code from CountryReference."},
            {"column_name": "ticket_status", "data_type": "VARCHAR(50)", "description": "Vendor booking lifecycle status (ISSUED, CANCELLED, REFUNDED, EXCHANGED)."},
            {"column_name": "amount_original", "data_type": "FLOAT", "description": "Raw transaction amount in booking currency."},
            {"column_name": "currency", "data_type": "VARCHAR(10)", "description": "Booking currency code (INR, USD, GBP, EUR, etc.)."},
            {"column_name": "fx_rate", "data_type": "FLOAT", "description": "Audited exchange rate applied to convert currency into INR."},
            {"column_name": "amount_inr", "data_type": "FLOAT", "description": "Total spend normalized into INR base currency."},
            {"column_name": "fx_rate_date", "data_type": "VARCHAR(30)", "description": "Effective date of the applied FX rate."},
            {"column_name": "fx_source", "data_type": "VARCHAR(100)", "description": "Authoritative lineage source of FX conversion."},
            {"column_name": "booking_channel", "data_type": "VARCHAR(50)", "description": "Booking channel (Amadeus GDS, Sabre GDS, Corporate Portal)."},
            {"column_name": "cabin_class", "data_type": "VARCHAR(50)", "description": "Cabin class tier (Economy, Premium Economy, Business)."},
            {"column_name": "travelled_flag", "data_type": "VARCHAR(5)", "description": "Calculated indicator 'Y' if travelled (ISSUED/FLOWN), 'N' if cancelled/refunded/exchanged."},
            {"column_name": "trip_classification", "data_type": "VARCHAR(50)", "description": "Derived classification: Domestic, Cross-Border, or Multi-Country."},
            {"column_name": "travel_summary", "data_type": "VARCHAR(100)", "description": "Standardized route summary label (e.g. IN to US Cross-Border)."},
            {"column_name": "policy_compliance_status", "data_type": "VARCHAR(50)", "description": "COMPLIANT or NON_COMPLIANT policy indicator."},
            {"column_name": "policy_violation_reason", "data_type": "VARCHAR(200)", "description": "Reason for policy violation flag if applicable."},
            {"column_name": "approval_status", "data_type": "VARCHAR(50)", "description": "Manager approval status (APPROVED, REJECTED, PENDING_APPROVAL)."},
            {"column_name": "rejection_reason", "data_type": "VARCHAR(200)", "description": "Reason for manager claim rejection if applicable."},
            {"column_name": "override_applied", "data_type": "INTEGER", "description": "1 if manual analyst override was applied, 0 otherwise."},
            {"column_name": "record_hash", "data_type": "VARCHAR(64)", "description": "Canonical SHA-256 record hash across business fields."},
            {"column_name": "source_file", "data_type": "VARCHAR(150)", "description": "Originating source extract filename."},
            {"column_name": "updated_at", "data_type": "DATETIME", "description": "Timestamp of last ETL fact table record update."}
        ]
    }
