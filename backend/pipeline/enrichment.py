import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, CleansedTicket, EmployeeMaster, CountryReference

COUNTRY_ISO_MAP = {
    "India": "IN",
    "United States": "US",
    "United Kingdom": "GB",
    "Singapore": "SG",
    "Germany": "DE",
    "United Arab Emirates": "AE",
    "Japan": "JP",
    "Australia": "AU",
    "Canada": "CA",
    "Switzerland": "CH"
}

def enrich_ticket_data(batch_id: str = None) -> list:
    """
    SCD Type-2 Temporal Enrichment:
    Enriches travel tickets with EmployeeMaster attributes based on travel_date fitting
    within effective_start_date and effective_end_date boundaries.
    """
    session = SessionLocal()
    query = session.query(CleansedTicket)
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
        
    cleansed_tickets = query.all()
    all_employees = session.query(EmployeeMaster).all()
    country_db_map = {c.country_name.lower(): c.country_code for c in session.query(CountryReference).all()}
    
    enriched_records = []
    
    for t in cleansed_tickets:
        emp_id = t.employee_id
        t_date = t.travel_date or "2026-01-01"
        
        # SCD Type-2 Temporal Lookup: Find active employee version during travel date
        matching_emp = None
        for e in all_employees:
            if e.employee_id == emp_id:
                start_dt = e.effective_start_date or "1900-01-01"
                end_dt = e.effective_end_date or "9999-12-31"
                if start_dt <= t_date <= end_dt:
                    matching_emp = e
                    break
        
        # Fallback to current employee record if temporal lookup falls outside window
        if not matching_emp:
            for e in all_employees:
                if e.employee_id == emp_id and e.is_current == 1:
                    matching_emp = e
                    break

        emp_name = matching_emp.employee_name if matching_emp else "Unknown Employee"
        bu = matching_emp.business_unit if matching_emp else "Unassigned BU"
        dept = matching_emp.department if matching_emp else "Unassigned Dept"
        
        orig_country_clean = t.origin_country.lower().strip() if t.origin_country else ""
        dest_country_clean = t.dest_country.lower().strip() if t.dest_country else ""
        
        orig_iso = country_db_map.get(orig_country_clean, COUNTRY_ISO_MAP.get(t.origin_country, "XX"))
        dest_iso = country_db_map.get(dest_country_clean, COUNTRY_ISO_MAP.get(t.dest_country, "XX"))
        
        enriched_records.append({
            "ticket_id": t.ticket_id,
            "trip_id": t.trip_id,
            "batch_id": t.batch_id,
            "employee_id": t.employee_id,
            "employee_name": emp_name,
            "business_unit": bu,
            "department": dept,
            "issue_date": t.issue_date,
            "travel_date": t.travel_date,
            "return_date": t.return_date,
            "origin_city": t.origin_city,
            "origin_country": t.origin_country,
            "dest_city": t.dest_city,
            "dest_country": t.dest_country,
            "origin_iso": orig_iso,
            "dest_iso": dest_iso,
            "ticket_status": t.ticket_status,
            "amount_original": getattr(t, "amount_original", t.amount_inr),
            "currency": getattr(t, "currency", "INR"),
            "fx_rate": getattr(t, "fx_rate", 1.0),
            "amount_inr": t.amount_inr,
            "fx_rate_date": getattr(t, "fx_rate_date", "2026-01-01"),
            "fx_source": getattr(t, "fx_source", "Approved Corporate Finance FX Source"),
            "booking_channel": t.booking_channel,
            "cabin_class": t.cabin_class,
            "is_duplicate": t.is_duplicate,
            "record_hash": t.record_hash,
            "source_file": t.source_file
        })
        
    session.close()
    return enriched_records

if __name__ == "__main__":
    records = enrich_ticket_data()
    print(f"Enriched {len(records)} records using SCD Type-2 Temporal Matching.")
