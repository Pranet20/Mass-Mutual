import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, ManualOverride

def get_manual_overrides_map():
    session = SessionLocal()
    overrides = session.query(ManualOverride).all()
    override_map = {}
    for o in overrides:
        override_map[o.ticket_id] = {
            "override_travelled_flag": o.override_travelled_flag,
            "override_classification": o.override_classification,
            "override_summary": o.override_summary,
            "override_reason": o.override_reason
        }
    session.close()
    return override_map
