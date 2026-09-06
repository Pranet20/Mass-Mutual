from typing import List, Dict, Any

def derive_business_rules(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Applies Business Rules:
    1. travelled_flag ('Y' / 'N')
    2. trip_classification ('Domestic', 'Cross-Border', 'Multi-Country')
    3. travel_summary (Label for BI reporting)
    4. policy_compliance_status ('COMPLIANT', 'NON_COMPLIANT_CABIN', 'NON_COMPLIANT_FARE')
    """

    trip_destinations = {}
    for r in records:
        tr_id = r["trip_id"]
        d_cntry = r["dest_country"]
        if tr_id not in trip_destinations:
            trip_destinations[tr_id] = set()
        if d_cntry:
            trip_destinations[tr_id].add(d_cntry)

    processed_records = []

    for r in records:
        rec = dict(r)
        status = rec.get("ticket_status", "ISSUED").upper()

        if status in ["ISSUED", "USED", "FLOWN", "COMPLETED"]:
            travelled_flag = "Y"
        elif status in ["CANCELLED", "REFUNDED", "EXCHANGED", "VOID"]:
            travelled_flag = "N"
        else:
            travelled_flag = "N"

        orig_cntry = rec.get("origin_country", "")
        dest_cntry = rec.get("dest_country", "")
        orig_iso = rec.get("origin_iso", "XX")
        dest_iso = rec.get("dest_iso", "XX")
        tr_id = rec.get("trip_id")
        cabin = rec.get("cabin_class", "Economy")
        amount_inr = rec.get("amount_inr", 0.0)

        distinct_dests = trip_destinations.get(tr_id, set())

        if len(distinct_dests) > 1 and "India" not in distinct_dests:
            classification = "Multi-Country"
            summary = f"{orig_iso} to GBS Multi-Country"
        elif orig_cntry.lower() == dest_cntry.lower() or (orig_iso == "IN" and dest_iso == "IN"):
            classification = "Domestic"
            summary = f"Domestic {orig_cntry if orig_cntry else 'India'}"
        else:
            classification = "Cross-Border"
            summary = f"{orig_iso} to {dest_iso} Cross-Border"

        # 4. Policy Compliance Derivation
        compliance_status = "COMPLIANT"
        violation_reason = "None"

        if classification == "Domestic" and cabin == "Business":
            compliance_status = "NON_COMPLIANT_CABIN"
            violation_reason = "Business class non-compliant on domestic route"
        elif classification == "Domestic" and amount_inr > 25000:
            compliance_status = "NON_COMPLIANT_FARE"
            violation_reason = "Domestic fare exceeds policy threshold (₹25,000 INR)"
        elif classification == "Cross-Border" and amount_inr > 150000 and cabin == "Economy":
            compliance_status = "NON_COMPLIANT_FARE"
            violation_reason = "Economy cross-border fare exceeds threshold (₹1,50,000 INR)"

        rec["travelled_flag"] = travelled_flag
        rec["trip_classification"] = classification
        rec["travel_summary"] = summary
        rec["policy_compliance_status"] = compliance_status
        rec["policy_violation_reason"] = violation_reason

        processed_records.append(rec)

    return processed_records

if __name__ == "__main__":
    test_recs = [
        {"ticket_id": "T1", "trip_id": "TRP1", "origin_country": "India", "dest_country": "India", "origin_iso": "IN", "dest_iso": "IN", "ticket_status": "ISSUED", "cabin_class": "Business", "amount_inr": 15000},
    ]
    res = derive_business_rules(test_recs)
    print(res)
