import os
import zipfile
import json

def generate_pbit_template():
    """
    Generates a sample Power BI Template (.pbit) file structure for Corporate Travel Analytics Travel Analytics.
    """
    pbit_path = os.path.join(os.path.dirname(__file__), "Travel_Analytics_Dashboard.pbit")
    
    # Power BI schema metadata
    layout_json = {
        "name": "Corporate Travel Analytics Travel Analytics Dashboard",
        "version": "1.0",
        "description": "Governed Corporate Travel Analytics Template connected to SQLite / Postgres vw_travel SQL view.",
        "tables": [
            {
                "name": "vw_travel",
                "columns": [
                    "ticket_id", "trip_id", "batch_id", "employee_id", "employee_name",
                    "business_unit", "department", "issue_date", "travel_date", "return_date",
                    "origin_city", "origin_country", "dest_city", "dest_country", "origin_iso",
                    "dest_iso", "ticket_status", "amount_inr", "booking_channel", "cabin_class",
                    "travelled_flag", "trip_classification", "travel_summary", "override_applied"
                ]
            }
        ]
    }
    
    with zipfile.ZipFile(pbit_path, "w") as zf:
        zf.writestr("DataModelSchema", json.dumps(layout_json, indent=2))
        zf.writestr("Version", "1.13")
        zf.writestr("README.txt", "Corporate Travel Analytics Power BI Template File (.pbit)\nImport into Power BI Desktop and configure connection string to travel_analytics.db.")

    print(f"Generated Power BI Template at: {pbit_path}")
    return pbit_path

if __name__ == "__main__":
    generate_pbit_template()
