import os
import sys
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, FactTravelTicket, PipelineBatchAudit
from pipeline.ingestion import ingest_raw_tickets, compute_file_hash
from pipeline.cleansing import cleanse_staging_tickets
from pipeline.enrichment import enrich_ticket_data
from pipeline.business_rules import derive_business_rules
from pipeline.overrides import get_manual_overrides_map

def run_end_to_end_pipeline(csv_path: str = None, force_reprocess: bool = False) -> dict:
    """
    Executes full ETL pipeline, logs execution to PipelineBatchAudit with SHA-256 idempotency,
    enforces SCD Type-2 temporal joins, auditable FX conversions,
    bad-record quarantine, and publishes to FactTravelTicket & vw_travel.
    """
    session = SessionLocal()
    start_time = datetime.datetime.now(datetime.timezone.utc)

    if not csv_path:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "travel_raw_tickets.csv")
    
    file_hash = compute_file_hash(csv_path) if os.path.exists(csv_path) else "MISSING"

    # Idempotency Check: Avoid duplicate batch executions if exact file was already processed successfully
    if not force_reprocess and file_hash != "MISSING":
        existing_successful_batch = session.query(PipelineBatchAudit).filter_by(
            source_file_hash=file_hash,
            status="SUCCESS"
        ).order_by(PipelineBatchAudit.completed_at.desc()).first()
        
        if existing_successful_batch:
            published_total = session.query(FactTravelTicket).count()
            session.close()
            return {
                "status": "SUCCESS",
                "batch_id": existing_successful_batch.batch_id,
                "source_file": existing_successful_batch.source_file,
                "source_file_hash": file_hash,
                "records_received": existing_successful_batch.records_received,
                "cleansed_count": existing_successful_batch.records_cleaned,
                "duplicates_flagged": existing_successful_batch.records_rejected,
                "records_quarantined": existing_successful_batch.records_quarantined,
                "fact_records_published": published_total,
                "idempotent_cached": True,
                "view_name": "vw_travel"
            }
    
    # 1. Ingestion & Bad-Record Quarantine
    batch_id, raw_count, source_file, file_hash, quarantined_count = ingest_raw_tickets(csv_path)
    
    audit = PipelineBatchAudit(
        batch_id=batch_id,
        status="RUNNING",
        started_at=start_time,
        source_file=source_file,
        source_file_hash=file_hash,
        records_received=raw_count + quarantined_count,
        records_quarantined=quarantined_count
    )
    session.add(audit)
    session.commit()
    
    try:
        # 2. Cleansing & Deduplication (with Auditable FX Conversion)
        cleansed_count, duplicate_count = cleanse_staging_tickets(batch_id)
        
        # 3. SCD Type-2 Temporal Enrichment
        enriched_records = enrich_ticket_data()
        
        # 4. Business Rules & Metric Derivations
        processed_records = derive_business_rules(enriched_records)
        
        # 5. Manual Overrides Mapping
        override_map = get_manual_overrides_map()
        
        fact_count = 0
        overrides_applied_count = 0
        
        for rec in processed_records:
            t_id = rec["ticket_id"]
            override_info = override_map.get(t_id)
            
            travelled_flag = rec["travelled_flag"]
            classification = rec["trip_classification"]
            summary = rec["travel_summary"]
            compliance_status = rec["policy_compliance_status"]
            violation_reason = rec["policy_violation_reason"]
            override_flag = 0
            
            if override_info:
                if override_info.get("override_travelled_flag"):
                    travelled_flag = override_info["override_travelled_flag"]
                if override_info.get("override_classification"):
                    classification = override_info["override_classification"]
                if override_info.get("override_summary"):
                    summary = override_info["override_summary"]
                override_flag = 1
                overrides_applied_count += 1
                
            existing = session.query(FactTravelTicket).filter_by(ticket_id=t_id).first()
            if existing:
                existing.batch_id = rec["batch_id"]
                existing.trip_id = rec["trip_id"]
                existing.employee_id = rec["employee_id"]
                existing.employee_name = rec["employee_name"]
                existing.business_unit = rec["business_unit"]
                existing.department = rec["department"]
                existing.issue_date = rec["issue_date"]
                existing.travel_date = rec["travel_date"]
                existing.return_date = rec["return_date"]
                existing.origin_city = rec["origin_city"]
                existing.origin_country = rec["origin_country"]
                existing.dest_city = rec["dest_city"]
                existing.dest_country = rec["dest_country"]
                existing.origin_iso = rec["origin_iso"]
                existing.dest_iso = rec["dest_iso"]
                existing.ticket_status = rec["ticket_status"]
                
                # FX Lineage
                existing.amount_original = rec.get("amount_original", rec["amount_inr"])
                existing.currency = rec.get("currency", "INR")
                existing.fx_rate = rec.get("fx_rate", 1.0)
                existing.amount_inr = rec["amount_inr"]
                existing.fx_rate_date = rec.get("fx_rate_date", "2026-01-01")
                existing.fx_source = rec.get("fx_source", "Approved Corporate Finance FX Source")

                existing.booking_channel = rec["booking_channel"]
                existing.cabin_class = rec["cabin_class"]
                existing.travelled_flag = travelled_flag
                existing.trip_classification = classification
                existing.travel_summary = summary
                existing.policy_compliance_status = compliance_status
                existing.policy_violation_reason = violation_reason
                existing.override_applied = override_flag
                existing.record_hash = rec.get("record_hash")
                existing.source_file = source_file
                existing.updated_at = datetime.datetime.now(datetime.timezone.utc)
            else:
                fact_obj = FactTravelTicket(
                    ticket_id=t_id,
                    trip_id=rec["trip_id"],
                    batch_id=rec["batch_id"],
                    employee_id=rec["employee_id"],
                    employee_name=rec["employee_name"],
                    business_unit=rec["business_unit"],
                    department=rec["department"],
                    issue_date=rec["issue_date"],
                    travel_date=rec["travel_date"],
                    return_date=rec["return_date"],
                    origin_city=rec["origin_city"],
                    origin_country=rec["origin_country"],
                    dest_city=rec["dest_city"],
                    dest_country=rec["dest_country"],
                    origin_iso=rec["origin_iso"],
                    dest_iso=rec["dest_iso"],
                    ticket_status=rec["ticket_status"],
                    amount_original=rec.get("amount_original", rec["amount_inr"]),
                    currency=rec.get("currency", "INR"),
                    fx_rate=rec.get("fx_rate", 1.0),
                    amount_inr=rec["amount_inr"],
                    fx_rate_date=rec.get("fx_rate_date", "2026-01-01"),
                    fx_source=rec.get("fx_source", "Approved Corporate Finance FX Source"),
                    booking_channel=rec["booking_channel"],
                    cabin_class=rec["cabin_class"],
                    travelled_flag=travelled_flag,
                    trip_classification=classification,
                    travel_summary=summary,
                    policy_compliance_status=compliance_status,
                    policy_violation_reason=violation_reason,
                    approval_status="APPROVED",
                    rejection_reason="None",
                    override_applied=override_flag,
                    record_hash=rec.get("record_hash"),
                    source_file=source_file
                )
                session.add(fact_obj)
            fact_count += 1
            
        # 6. Complete Batch Audit Record
        aud_rec = session.query(PipelineBatchAudit).filter_by(batch_id=batch_id).first()
        if aud_rec:
            aud_rec.status = "SUCCESS"
            aud_rec.completed_at = datetime.datetime.now(datetime.timezone.utc)
            aud_rec.records_cleaned = cleansed_count
            aud_rec.records_rejected = duplicate_count
            aud_rec.records_quarantined = quarantined_count
            aud_rec.records_published = fact_count
            aud_rec.error_message = "None"
            session.commit()
            
        session.commit()
        session.close()
        
        return {
            "status": "SUCCESS",
            "batch_id": batch_id,
            "source_file": source_file,
            "source_file_hash": file_hash,
            "records_received": raw_count + quarantined_count,
            "cleansed_count": cleansed_count,
            "duplicates_flagged": duplicate_count,
            "records_quarantined": quarantined_count,
            "fact_records_published": fact_count,
            "overrides_applied": overrides_applied_count,
            "view_name": "vw_travel"
        }
        
    except Exception as e:
        session.rollback()
        aud_rec = session.query(PipelineBatchAudit).filter_by(batch_id=batch_id).first()
        if aud_rec:
            aud_rec.status = "FAILED"
            aud_rec.completed_at = datetime.datetime.now(datetime.timezone.utc)
            aud_rec.error_message = str(e)
            session.commit()
        session.close()
        raise e

if __name__ == "__main__":
    res = run_end_to_end_pipeline(force_reprocess=True)
    print("Pipeline Execution Result:", res)
