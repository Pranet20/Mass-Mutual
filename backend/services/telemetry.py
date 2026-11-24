"""
Enterprise Telemetry, Application Performance Monitoring (APM),
Crash Diagnostics, and Privacy Compliance Service.
"""

import os
import json
import time
import uuid
import datetime
import logging
from typing import Dict, Any, List, Optional
from database.models import SessionLocal, UserAnalyticsEvent, AppCrashLog, FactTravelTicket, User, EmployeeMaster

logger = logging.getLogger("telemetry_service")
logger.setLevel(logging.INFO)

# In-memory APM request latency ring buffer for real-time monitoring
REQUEST_METRICS = {
    "total_requests": 0,
    "status_2xx": 0,
    "status_4xx": 0,
    "status_5xx": 0,
    "latencies_ms": [],
    "start_time": time.time()
}

MAX_LATENCY_SAMPLES = 500

def record_http_request_metric(status_code: int, duration_ms: float):
    REQUEST_METRICS["total_requests"] += 1
    if 200 <= status_code < 300:
        REQUEST_METRICS["status_2xx"] += 1
    elif 400 <= status_code < 500:
        REQUEST_METRICS["status_4xx"] += 1
    elif status_code >= 500:
        REQUEST_METRICS["status_5xx"] += 1
        
    l_list = REQUEST_METRICS["latencies_ms"]
    l_list.append(duration_ms)
    if len(l_list) > MAX_LATENCY_SAMPLES:
        REQUEST_METRICS["latencies_ms"] = l_list[-MAX_LATENCY_SAMPLES:]

def record_user_event(
    event_type: str,
    event_name: str,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    page_url: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    duration_ms: Optional[float] = None,
    session_id: Optional[str] = None,
    user_agent: Optional[str] = None
) -> int:
    """
    Persists user behavior, navigation, and client-side performance marks.
    """
    session = SessionLocal()
    try:
        event = UserAnalyticsEvent(
            user_id=user_id,
            user_role=user_role,
            event_type=event_type,
            event_name=event_name,
            page_url=page_url[:250] if page_url else None,
            metadata_json=json.dumps(metadata) if metadata else None,
            duration_ms=duration_ms,
            session_id=session_id,
            user_agent=user_agent[:250] if user_agent else None
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        return event.id
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to record analytics event: {e}")
        return 0
    finally:
        session.close()

def record_events_batch(events_list: List[Dict[str, Any]], user_id: Optional[str] = None, user_role: Optional[str] = None) -> int:
    """
    Ingests batched client-side telemetry events in a single transaction.
    """
    session = SessionLocal()
    count = 0
    try:
        for ev in events_list:
            event = UserAnalyticsEvent(
                user_id=user_id or ev.get("user_id"),
                user_role=user_role or ev.get("user_role"),
                event_type=ev.get("event_type", "action"),
                event_name=ev.get("event_name", "unknown"),
                page_url=ev.get("page_url", "")[:250] if ev.get("page_url") else None,
                metadata_json=json.dumps(ev.get("metadata")) if ev.get("metadata") else None,
                duration_ms=ev.get("duration_ms"),
                session_id=ev.get("session_id"),
                user_agent=ev.get("user_agent", "")[:250] if ev.get("user_agent") else None
            )
            session.add(event)
            count += 1
        session.commit()
        return count
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to record batch analytics: {e}")
        return 0
    finally:
        session.close()

def log_client_crash(
    error_name: str,
    error_message: str,
    stack_trace: Optional[str] = None,
    component_stack: Optional[str] = None,
    page_url: Optional[str] = None,
    user_id: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    Captures unhandled frontend crashes with stack trace and generates a unique reference ID.
    """
    crash_id = f"CRASH-{uuid.uuid4().hex[:8].upper()}"
    session = SessionLocal()
    try:
        crash_log = AppCrashLog(
            crash_id=crash_id,
            user_id=user_id,
            error_name=error_name[:200],
            error_message=error_message,
            stack_trace=stack_trace,
            component_stack=component_stack,
            page_url=page_url[:250] if page_url else None,
            user_agent=user_agent[:250] if user_agent else None,
            status="UNRESOLVED"
        )
        session.add(crash_log)
        session.commit()
        logger.critical(f"Client-side UI Crash Logged: {crash_id} | {error_name}: {error_message}")
        return crash_id
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to persist crash log: {e}")
        return crash_id
    finally:
        session.close()

def get_analytics_summary() -> Dict[str, Any]:
    """
    Aggregates analytics metrics across user interactions, performance, and route popularity.
    """
    session = SessionLocal()
    try:
        from sqlalchemy import func
        total_events = session.query(func.count(UserAnalyticsEvent.id)).scalar() or 0
        total_crashes = session.query(func.count(AppCrashLog.id)).scalar() or 0
        
        # Events breakdown by type
        types_breakdown = dict(
            session.query(UserAnalyticsEvent.event_type, func.count(UserAnalyticsEvent.id))
            .group_by(UserAnalyticsEvent.event_type)
            .all()
        )
        
        # Top 5 most active features / actions
        top_actions = [
            {"action": name, "count": cnt}
            for name, cnt in session.query(UserAnalyticsEvent.event_name, func.count(UserAnalyticsEvent.id))
            .filter(UserAnalyticsEvent.event_type == "action")
            .group_by(UserAnalyticsEvent.event_name)
            .order_by(func.count(UserAnalyticsEvent.id).desc())
            .limit(5)
            .all()
        ]
        
        # Average recorded client latency (ms)
        avg_client_latency = session.query(func.avg(UserAnalyticsEvent.duration_ms))\
            .filter(UserAnalyticsEvent.duration_ms.isnot(None))\
            .scalar() or 0.0
            
        return {
            "total_events": total_events,
            "total_crashes": total_crashes,
            "events_by_type": types_breakdown,
            "top_actions": top_actions,
            "average_client_latency_ms": round(float(avg_client_latency), 2),
            "telemetry_active": True
        }
    finally:
        session.close()

def get_system_health_metrics() -> Dict[str, Any]:
    """
    Calculates live APM metrics: uptime, request throughput, error rate, p95 latency.
    """
    uptime_sec = round(time.time() - REQUEST_METRICS["start_time"], 1)
    tot = REQUEST_METRICS["total_requests"]
    err_5xx = REQUEST_METRICS["status_5xx"]
    err_rate = round((err_5xx / tot * 100), 2) if tot > 0 else 0.0
    
    lats = sorted(REQUEST_METRICS["latencies_ms"])
    avg_lat = round(sum(lats) / len(lats), 2) if lats else 0.0
    p95_lat = round(lats[int(len(lats) * 0.95)], 2) if lats else 0.0
    
    session = SessionLocal()
    db_status = "HEALTHY"
    try:
        from sqlalchemy import text
        session.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(f"DB health ping failed: {e}")
        db_status = "DEGRADED"
    finally:
        session.close()
        
    return {
        "status": "HEALTHY" if err_rate < 5.0 and db_status == "HEALTHY" else "WARNING",
        "uptime_seconds": uptime_sec,
        "database_connectivity": db_status,
        "http_requests": {
            "total": tot,
            "status_2xx": REQUEST_METRICS["status_2xx"],
            "status_4xx": REQUEST_METRICS["status_4xx"],
            "status_5xx": err_5xx,
            "error_rate_pct": err_rate
        },
        "latency_ms": {
            "average": avg_lat,
            "p95": p95_lat
        },
        "memory_monitoring": {
            "environment": os.environ.get("ENV", "development"),
            "pid": os.getpid()
        }
    }

def get_privacy_policy_contract() -> Dict[str, Any]:
    """
    Returns legal & corporate travel privacy policy contract.
    """
    return {
        "title": "Corporate Travel Analytics - Enterprise Privacy & Data Governance Policy",
        "last_updated": "2026-11-24",
        "compliance_standards": ["GDPR (EU 2016/679)", "ISO/IEC 27001", "Corporate Financial Audit Standards"],
        "data_collected": [
            {
                "category": "Travel Booking Lineage",
                "fields": ["Ticket ID", "Trip ID", "Origin & Destination Airport", "Travel Dates", "Fare & Currency"],
                "purpose": "Corporate T&E budget reconciliation, duty of care tracking, and tax/treasury compliance."
            },
            {
                "category": "Employee Demographics (SCD Type 2)",
                "fields": ["Employee ID", "Business Unit", "Department", "Designation", "Corporate Email"],
                "purpose": "Departmental spend attribution joined point-in-time at travel date."
            },
            {
                "category": "Performance & Error Telemetry",
                "fields": ["Page URL", "Action Type", "Browser User Agent", "Response Latency", "Crash Call Stack"],
                "purpose": "Application reliability, crash diagnosis, and unauthorized access mitigation."
            }
        ],
        "data_retention": {
            "travel_financial_facts": "7 years mandatory retention pursuant to financial statutory audit compliance.",
            "telemetry_and_crash_logs": "90 days rolling retention before automated purging.",
            "user_credentials": "Erased immediately upon authenticated self-service account deletion."
        },
        "user_rights": [
            "Right of Access: View all personal travel claims and budget allocations in the Employee Portal.",
            "Right to Rectification: Submit analytical manual overrides with authenticated business justification.",
            "Right to Erasure (Account Deletion): Self-service account deletion anonymizes employee PII while upholding financial records."
        ],
        "contact_officer": {
            "title": "Corporate Data Protection & Governance Officer",
            "email": "privacy@travelintelligence.local",
            "jurisdiction": "Enterprise Corporate Headquarters"
        }
    }
