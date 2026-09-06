import os
import sys
import csv
import json
import hashlib
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, StagingTicket, QuarantinedRecord

def compute_file_hash(file_path: str) -> str:
    """Computes SHA-256 hash of file for idempotent batch management."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def is_valid_date_format(date_str: str) -> bool:
    if not date_str or not date_str.strip():
        return False
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d-%m-%Y"):
        try:
            datetime.strptime(date_str.strip(), fmt)
            return True
        except ValueError:
            pass
    return False

def ingest_raw_tickets(file_path: str = None) -> tuple:
    """
    Ingests raw ticketing CSV into StagingTicket table with Bad-Record Quarantine.
    Computes source_file_hash (SHA-256), canonical record_hash (SHA-256),
    validates date presence, currencies, and positive amounts.
    Returns (batch_id, valid_count, source_filename, source_file_hash, quarantined_count).
    """
    if not file_path:
        file_path = os.path.join(os.path.dirname(__file__), "..", "data", "travel_raw_tickets.csv")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Raw ticket file not found at: {file_path}")

    source_filename = os.path.basename(file_path)
    source_file_hash = compute_file_hash(file_path)
    batch_id = f"BATCH_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}"
    session = SessionLocal()

    valid_count = 0
    quarantined_count = 0

    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_id = (row.get("ticket_id") or "").strip()
            e_id = (row.get("employee_id") or "").strip()
            raw_amount = (row.get("amount") or "").strip()
            t_date = (row.get("travel_date") or "").strip()
            raw_curr = (row.get("currency") or "INR").strip().upper()

            # Quarantine Validation 1: Missing Mandatory IDs
            if not t_id:
                q_rec = QuarantinedRecord(
                    batch_id=batch_id,
                    ticket_id="MISSING",
                    error_type="NULL_TICKET_ID",
                    error_message="Record rejected: ticket_id cannot be null or empty",
                    raw_payload=json.dumps(row),
                    source_file=source_filename
                )
                session.add(q_rec)
                quarantined_count += 1
                continue

            if not e_id:
                q_rec = QuarantinedRecord(
                    batch_id=batch_id,
                    ticket_id=t_id,
                    error_type="NULL_EMPLOYEE_ID",
                    error_message="Record rejected: employee_id is required for travel lineage",
                    raw_payload=json.dumps(row),
                    source_file=source_filename
                )
                session.add(q_rec)
                quarantined_count += 1
                continue

            # Quarantine Validation 2: Missing or Invalid Travel Date
            if not t_date:
                q_rec = QuarantinedRecord(
                    batch_id=batch_id,
                    ticket_id=t_id,
                    error_type="MISSING_TRAVEL_DATE",
                    error_message="Record rejected: travel_date cannot be missing or null",
                    raw_payload=json.dumps(row),
                    source_file=source_filename
                )
                session.add(q_rec)
                quarantined_count += 1
                continue

            if not is_valid_date_format(t_date):
                q_rec = QuarantinedRecord(
                    batch_id=batch_id,
                    ticket_id=t_id,
                    error_type="INVALID_TRAVEL_DATE",
                    error_message=f"Record rejected: travel_date '{t_date}' has an unrecognized date format",
                    raw_payload=json.dumps(row),
                    source_file=source_filename
                )
                session.add(q_rec)
                quarantined_count += 1
                continue

            # Quarantine Validation 3: Invalid Non-Numeric or Negative Amount
            try:
                amt = float(raw_amount)
                if amt < 0:
                    raise ValueError("Negative amount")
            except (ValueError, TypeError):
                q_rec = QuarantinedRecord(
                    batch_id=batch_id,
                    ticket_id=t_id,
                    error_type="INVALID_AMOUNT",
                    error_message=f"Record rejected: amount '{raw_amount}' is not a valid non-negative number",
                    raw_payload=json.dumps(row),
                    source_file=source_filename
                )
                session.add(q_rec)
                quarantined_count += 1
                continue

            # Compute Canonical SHA-256 Record Hash across all business fields
            canonical_str = f"{t_id}|{e_id}|{row.get('trip_id','')}|{t_date}|{row.get('return_date','')}|{row.get('origin_city','')}|{row.get('dest_city','')}|{row.get('ticket_status','')}|{amt}|{raw_curr}|{row.get('booking_channel','')}|{row.get('cabin_class','')}"
            rec_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

            staging_obj = StagingTicket(
                batch_id=batch_id,
                ticket_id=t_id,
                trip_id=(row.get("trip_id") or "").strip(),
                employee_id=e_id,
                issue_date=(row.get("issue_date") or "").strip(),
                travel_date=t_date,
                return_date=(row.get("return_date") or "").strip(),
                origin_city=(row.get("origin_city") or "").strip(),
                origin_country=(row.get("origin_country") or "").strip(),
                dest_city=(row.get("dest_city") or "").strip(),
                dest_country=(row.get("dest_country") or "").strip(),
                ticket_status=(row.get("ticket_status") or "").strip(),
                amount=amt,
                currency=raw_curr,
                booking_channel=(row.get("booking_channel") or "").strip(),
                cabin_class=(row.get("cabin_class") or "").strip(),
                record_hash=rec_hash,
                source_file=source_filename,
                source_file_hash=source_file_hash,
                raw_payload=json.dumps(row)
            )
            session.add(staging_obj)
            valid_count += 1

    session.commit()
    session.close()

    return batch_id, valid_count, source_filename, source_file_hash, quarantined_count
