import os
import sys
import datetime
from decimal import Decimal, ROUND_HALF_UP

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, StagingTicket, CleansedTicket, QuarantinedRecord, FXRate

# Approved Corporate FX Rates Baseline
APPROVED_FX_RATES = {
    "INR": 1.0,
    "USD": 85.0,
    "GBP": 108.0,
    "EUR": 92.0,
    "CHF": 95.0,
    "CAD": 62.0,
    "SGD": 63.0,
    "AED": 23.0,
    "JPY": 0.57,
    "AUD": 55.0
}

def get_applicable_fx_rate(currency: str, rate_date: str, session) -> tuple:
    """
    Looks up approved FX rate for given currency and date.
    Returns (rate_to_inr, fx_rate_date, fx_source).
    Raises ValueError if currency is unknown or rate is missing.
    """
    curr = (currency or "").upper().strip()
    if not curr:
        raise ValueError("MISSING_CURRENCY: Transaction currency is null or empty.")

    # 1. Check database FXRate table first
    db_rate = session.query(FXRate).filter(
        FXRate.currency_code == curr,
        FXRate.effective_date <= rate_date
    ).order_by(FXRate.effective_date.desc()).first()

    if db_rate:
        return float(db_rate.rate_to_inr), db_rate.effective_date, db_rate.source

    # 2. Check approved baseline
    if curr in APPROVED_FX_RATES:
        return APPROVED_FX_RATES[curr], "2026-01-01", "Approved Corporate Finance FX Baseline"

    # 3. Unknown currency: NEVER silently convert with 1.0
    raise ValueError(f"UNKNOWN_CURRENCY: Currency code '{curr}' has no approved FX rate.")

def convert_to_inr(amount: float, currency: str, rate_date: str = "2026-01-01") -> float:
    """Utility for testing FX conversion."""
    curr = (currency or "").upper().strip()
    if curr not in APPROVED_FX_RATES:
        raise ValueError(f"UNKNOWN_CURRENCY: Currency '{curr}' is not approved.")
    rate = APPROVED_FX_RATES[curr]
    d_amt = Decimal(str(amount))
    d_rate = Decimal(str(rate))
    res = (d_amt * d_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float(res)

def standardize_iso_date(date_str: str) -> str:
    """
    Standardizes dates into strict ISO YYYY-MM-DD.
    Returns standardized string or raises ValueError if invalid.
    """
    if not date_str or not date_str.strip():
        raise ValueError("Date is empty or null")
    
    date_str = date_str.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            dt = datetime.datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    raise ValueError(f"Unrecognized date format: '{date_str}'")

def cleanse_staging_tickets(batch_id: str = None) -> tuple:
    """
    Cleanses staging tickets, applies auditable FX conversion, validates date formats,
    and isolates duplicates vs revisions using SHA-256 canonical record hashes.
    Returns (cleansed_count, duplicate_count).
    """
    session = SessionLocal()
    query = session.query(StagingTicket)
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
        
    staging_records = query.all()
    seen_hashes = {}
    cleansed_count = 0
    duplicate_count = 0
    
    for r in staging_records:
        t_id = r.ticket_id.strip()
        r_hash = r.record_hash
        is_dup = 0
        dup_reason = "None"
        
        # Check duplicate within batch
        if t_id in seen_hashes:
            if seen_hashes[t_id] == r_hash:
                is_dup = 1
                duplicate_count += 1
                dup_reason = f"Exact duplicate ticket '{t_id}' with matching SHA-256 hash in batch '{r.batch_id}'"
            else:
                dup_reason = f"Ticket '{t_id}' revised within batch '{r.batch_id}'"
        else:
            seen_hashes[t_id] = r_hash

        # Standardize dates
        try:
            travel_date_iso = standardize_iso_date(r.travel_date)
            issue_date_iso = standardize_iso_date(r.issue_date) if r.issue_date else travel_date_iso
            return_date_iso = standardize_iso_date(r.return_date) if r.return_date else travel_date_iso
        except ValueError as e:
            q_rec = QuarantinedRecord(
                batch_id=r.batch_id,
                ticket_id=t_id,
                error_type="INVALID_DATE_FORMAT",
                error_message=str(e),
                raw_payload=r.raw_payload,
                source_file=r.source_file
            )
            session.add(q_rec)
            continue

        # Auditable FX Conversion
        orig_curr = (r.currency or "INR").upper().strip()
        try:
            fx_rate, fx_date, fx_source = get_applicable_fx_rate(orig_curr, travel_date_iso, session)
            d_amt = Decimal(str(r.amount))
            d_rate = Decimal(str(fx_rate))
            amount_inr = float((d_amt * d_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        except ValueError as e:
            # Unknown currency or missing FX rate -> Quarantine!
            q_rec = QuarantinedRecord(
                batch_id=r.batch_id,
                ticket_id=t_id,
                error_type="UNKNOWN_CURRENCY",
                error_message=str(e),
                raw_payload=r.raw_payload,
                source_file=r.source_file
            )
            session.add(q_rec)
            continue

        existing = session.query(CleansedTicket).filter_by(ticket_id=t_id).first()
        if existing:
            if existing.record_hash == r_hash:
                is_dup = 1
                duplicate_count += 1
                dup_reason = f"Exact duplicate ticket '{t_id}' previously processed"
            else:
                dup_reason = f"Ticket '{t_id}' updated from revision feed"
                
            existing.batch_id = r.batch_id
            existing.trip_id = r.trip_id.strip()
            existing.employee_id = r.employee_id.strip()
            existing.issue_date = issue_date_iso
            existing.travel_date = travel_date_iso
            existing.return_date = return_date_iso
            existing.origin_city = r.origin_city.strip().title() if r.origin_city else ""
            existing.origin_country = r.origin_country.strip().title() if r.origin_country else ""
            existing.dest_city = r.dest_city.strip().title() if r.dest_city else ""
            existing.dest_country = r.dest_country.strip().title() if r.dest_country else ""
            existing.ticket_status = r.ticket_status.strip().upper() if r.ticket_status else "ISSUED"
            existing.amount_original = r.amount
            existing.currency = orig_curr
            existing.fx_rate = fx_rate
            existing.amount_inr = amount_inr
            existing.fx_rate_date = fx_date
            existing.fx_source = fx_source
            existing.original_amount = r.amount
            existing.original_currency = orig_curr
            existing.booking_channel = r.booking_channel
            existing.cabin_class = r.cabin_class
            existing.is_duplicate = is_dup
            existing.record_hash = r_hash
            existing.source_file = r.source_file or "travel_raw_tickets.csv"
            existing.duplicate_reason = dup_reason
        else:
            cleansed_obj = CleansedTicket(
                batch_id=r.batch_id,
                ticket_id=t_id,
                trip_id=r.trip_id.strip(),
                employee_id=r.employee_id.strip(),
                issue_date=issue_date_iso,
                travel_date=travel_date_iso,
                return_date=return_date_iso,
                origin_city=r.origin_city.strip().title() if r.origin_city else "",
                origin_country=r.origin_country.strip().title() if r.origin_country else "",
                dest_city=r.dest_city.strip().title() if r.dest_city else "",
                dest_country=r.dest_country.strip().title() if r.dest_country else "",
                ticket_status=r.ticket_status.strip().upper() if r.ticket_status else "ISSUED",
                amount_original=r.amount,
                currency=orig_curr,
                fx_rate=fx_rate,
                amount_inr=amount_inr,
                fx_rate_date=fx_date,
                fx_source=fx_source,
                original_amount=r.amount,
                original_currency=orig_curr,
                booking_channel=r.booking_channel,
                cabin_class=r.cabin_class,
                is_duplicate=is_dup,
                record_hash=r_hash,
                source_file=r.source_file or "travel_raw_tickets.csv",
                duplicate_reason=dup_reason
            )
            session.add(cleansed_obj)
        cleansed_count += 1

    session.commit()
    session.close()
    return cleansed_count, duplicate_count

if __name__ == "__main__":
    c_cnt, d_cnt = cleanse_staging_tickets()
    print(f"Cleansed {c_cnt} tickets (Duplicates flagged: {d_cnt}).")
