def get_governed_data_dictionary() -> dict:
    """
    Returns complete enterprise data dictionary metadata for all database tables and views.
    """
    return {
        "title": "Corporate Travel Analytics - Governed Enterprise Data Dictionary",
        "version": "2.0.0",
        "description": "Comprehensive schema documentation for raw staging, cleansed, dim, fact, and analytical views in SQLite warehouse.",
        "tables": [
            {
                "table_name": "vw_travel",
                "object_type": "Governed SQL View",
                "description": "Primary analytical view feeding all executive dashboards, Power BI DirectQuery models, and C-Suite reports.",
                "columns": [
                    {"name": "ticket_id", "type": "VARCHAR(50)", "key": "PK", "description": "Unique travel ticket identifier"},
                    {"name": "trip_id", "type": "VARCHAR(50)", "key": "FK", "description": "Associated travel itinerary ID"},
                    {"name": "batch_id", "type": "VARCHAR(50)", "key": "", "description": "ETL microsecond batch lineage tag"},
                    {"name": "employee_id", "type": "VARCHAR(50)", "key": "FK", "description": "Employee ID linked via SCD Type-2 temporal join"},
                    {"name": "employee_name", "type": "VARCHAR(100)", "key": "", "description": "Employee full name"},
                    {"name": "business_unit", "type": "VARCHAR(100)", "key": "", "description": "Division name (Global Tech, Finance & Actuarial, etc.)"},
                    {"name": "department", "type": "VARCHAR(100)", "key": "", "description": "Specific functional department"},
                    {"name": "issue_date", "type": "DATE (YYYY-MM-DD)", "key": "", "description": "Ticket booking date"},
                    {"name": "travel_date", "type": "DATE (YYYY-MM-DD)", "key": "", "description": "Flight departure date"},
                    {"name": "return_date", "type": "DATE (YYYY-MM-DD)", "key": "", "description": "Flight return date"},
                    {"name": "origin_city", "type": "VARCHAR(100)", "key": "", "description": "Departure city name"},
                    {"name": "dest_city", "type": "VARCHAR(100)", "key": "", "description": "Destination city name"},
                    {"name": "amount_inr", "type": "FLOAT", "key": "", "description": "Normalized spend amount in INR"},
                    {"name": "travelled_flag", "type": "VARCHAR(5)", "key": "", "description": "Y = Completed Travel, N = Refunded/Cancelled"},
                    {"name": "trip_classification", "type": "VARCHAR(50)", "key": "", "description": "Domestic, Cross-Border, or Multi-Country"},
                    {"name": "policy_compliance_status", "type": "VARCHAR(50)", "key": "", "description": "COMPLIANT or VIOLATION"},
                    {"name": "record_hash", "type": "VARCHAR(64)", "key": "", "description": "MD5 hash of ticket attributes for duplicate lineage"}
                ]
            },
            {
                "table_name": "fact_travel_tickets",
                "object_type": "Fact Table",
                "description": "Core star-schema fact table containing verified and enriched corporate travel bookings.",
                "columns": [
                    {"name": "ticket_id", "type": "VARCHAR(50)", "key": "PK", "description": "Primary key"},
                    {"name": "employee_id", "type": "VARCHAR(50)", "key": "FK", "description": "Foreign key to employee_master"},
                    {"name": "amount_inr", "type": "FLOAT", "key": "", "description": "Normalized currency value in INR"},
                    {"name": "cabin_class", "type": "VARCHAR(50)", "key": "", "description": "Economy, Premium Economy, Business"},
                    {"name": "approval_status", "type": "VARCHAR(50)", "key": "", "description": "APPROVED, PENDING_APPROVAL, REJECTED"},
                    {"name": "override_applied", "type": "INTEGER", "key": "", "description": "1 if analyst override applied, 0 otherwise"}
                ]
            },
            {
                "table_name": "employee_master",
                "object_type": "Dimension Table (SCD Type-2)",
                "description": "Employee directory dimension table supporting historical effective start/end temporal boundaries.",
                "columns": [
                    {"name": "employee_id", "type": "VARCHAR(50)", "key": "PK", "description": "Employee ID"},
                    {"name": "employee_name", "type": "VARCHAR(100)", "key": "", "description": "Full name"},
                    {"name": "effective_start_date", "type": "DATE", "key": "", "description": "SCD Type-2 effective start date"},
                    {"name": "effective_end_date", "type": "DATE", "key": "", "description": "SCD Type-2 effective end date (9999-12-31 for current)"},
                    {"name": "is_current", "type": "INTEGER", "key": "", "description": "1 = Currently active record, 0 = Historical"}
                ]
            },
            {
                "table_name": "pipeline_batch_audit",
                "object_type": "Audit Table",
                "description": "ETL batch execution monitoring table tracking lineage and record counts.",
                "columns": [
                    {"name": "batch_id", "type": "VARCHAR(50)", "key": "PK", "description": "Microsecond batch ID"},
                    {"name": "status", "type": "VARCHAR(20)", "key": "", "description": "RUNNING, SUCCESS, FAILED"},
                    {"name": "records_received", "type": "INTEGER", "key": "", "description": "Total raw rows received"},
                    {"name": "records_cleaned", "type": "INTEGER", "key": "", "description": "Rows successfully cleansed"},
                    {"name": "records_rejected", "type": "INTEGER", "key": "", "description": "Duplicate rows flagged"}
                ]
            }
        ]
    }
