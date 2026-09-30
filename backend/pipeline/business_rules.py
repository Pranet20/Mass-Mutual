from typing import List, Dict, Any

def derive_business_rules(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Applies Business Rules:
    1. travelled_flag ('Y' / 'N')
    2. trip_classification ('Domestic', 'Cross-Border', 'Multi-Country')
    3. travel_summary (Label for BI reporting)
    4. policy_compliance_status ('COMPLIANT', 'NON_COMPLIANT_CABIN', 'NON_COMPLIANT_FARE')
    """

    trip_countries = {}
    trip_destinations = {}
    for r in records:
        tr_id = r.get("trip_id")
        orig_c = (r.get("origin_country") or "").strip().title()
        dest_c = (r.get("dest_country") or "").strip().title()
        if tr_id not in trip_countries:
            trip_countries[tr_id] = set()
            trip_destinations[tr_id] = set()
        if orig_c:
            trip_countries[tr_id].add(orig_c)
        if dest_c:
            trip_countries[tr_id].add(dest_c)
            trip_destinations[tr_id].add(dest_c)

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

        orig_cntry = rec.get("origin_country", "").strip().title()
        dest_cntry = rec.get("dest_country", "").strip().title()
        orig_iso = rec.get("origin_iso", "XX")
        dest_iso = rec.get("dest_iso", "XX")
        tr_id = rec.get("trip_id")
        cabin = rec.get("cabin_class", "Economy")
        amount_inr = rec.get("amount_inr", 0.0)

        all_countries = trip_countries.get(tr_id, set())
        distinct_dests = trip_destinations.get(tr_id, set())

        # Enterprise Multi-Dimensional Trip Classification:
        # 1. Domestic: All trip endpoints reside within the same single country
        if len(all_countries) == 1 or (orig_cntry.lower() == dest_cntry.lower() and len(distinct_dests) <= 1):
            classification = "Domestic"
            summary = f"Domestic {orig_cntry if orig_cntry else 'India'}"
        # 2. Multi-Country: Trip contains more than 2 distinct countries across its legs, or visits multiple foreign destinations
        elif len(all_countries) > 2 or (len(distinct_dests) > 1 and orig_cntry not in distinct_dests):
            classification = "Multi-Country"
            summary = f"{orig_iso} to Multi-Country"
        # 3. Cross-Border: Trip spans exactly 2 distinct countries (e.g. Origin Country A -> Destination Country B)
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
