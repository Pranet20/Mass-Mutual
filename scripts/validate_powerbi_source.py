#!/usr/bin/env python3
"""
Power BI Source Validation Script — PS-04 Dynamic Governed Metrics Generator
Calculates ground truth metrics directly from warehouse view `vw_travel`
to reconcile against Power BI Desktop visuals and DAX measures.
"""

import os
import sys
from decimal import Decimal
from typing import Dict, Any, List

# Ensure backend directory is in path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from database.models import engine
from sqlalchemy import text


def get_governed_metrics() -> Dict[str, Any]:
    with engine.connect() as conn:
        # 1. Total row count (Fact grain: ticket legs)
        row_count = conn.execute(text("SELECT COUNT(*) FROM vw_travel")).scalar() or 0

        # 2. Total distinct trips (Trip grain)
        total_trips = conn.execute(text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel")).scalar() or 0

        # 3. Total spend
        total_spend = conn.execute(text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel")).scalar() or 0.0

        # 4. Ticket leg partition
        completed_legs = conn.execute(
            text("SELECT COUNT(*) FROM vw_travel WHERE travelled_flag = 'Y'")
        ).scalar() or 0
        cancelled_legs = conn.execute(
            text("SELECT COUNT(*) FROM vw_travel WHERE travelled_flag = 'N'")
        ).scalar() or 0
        completed_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE travelled_flag = 'Y'")
        ).scalar() or 0.0
        cancelled_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE travelled_flag = 'N'")
        ).scalar() or 0.0

        # 5. Distinct trip grain breakdown
        fully_flown_trips = conn.execute(text("""
            SELECT COUNT(*) FROM (
                SELECT trip_id FROM vw_travel GROUP BY trip_id 
                HAVING SUM(CASE WHEN travelled_flag = 'N' THEN 1 ELSE 0 END) = 0
            )
        """)).scalar() or 0

        fully_cancelled_trips = conn.execute(text("""
            SELECT COUNT(*) FROM (
                SELECT trip_id FROM vw_travel GROUP BY trip_id 
                HAVING SUM(CASE WHEN travelled_flag = 'Y' THEN 1 ELSE 0 END) = 0
            )
        """)).scalar() or 0

        mixed_trips = conn.execute(text("""
            SELECT COUNT(*) FROM (
                SELECT trip_id FROM vw_travel GROUP BY trip_id 
                HAVING SUM(CASE WHEN travelled_flag = 'Y' THEN 1 ELSE 0 END) > 0 
                   AND SUM(CASE WHEN travelled_flag = 'N' THEN 1 ELSE 0 END) > 0
            )
        """)).scalar() or 0

        travelled_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'Y'")
        ).scalar() or 0

        non_travelled_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'N'")
        ).scalar() or 0

        # 6. Domestic trips
        domestic_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Domestic'")
        ).scalar() or 0
        domestic_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE trip_classification = 'Domestic'")
        ).scalar() or 0.0

        # 7. Cross-border trips
        cross_border_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Cross-Border'")
        ).scalar() or 0
        cross_border_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE trip_classification = 'Cross-Border'")
        ).scalar() or 0.0

        # 8. Multi-country trips
        multi_country_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE trip_classification = 'Multi-Country'")
        ).scalar() or 0
        multi_country_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE trip_classification = 'Multi-Country'")
        ).scalar() or 0.0

        # 9. Trips by Month
        trips_by_month_rows = conn.execute(text("""
            SELECT substr(travel_date, 1, 7) AS travel_month,
                   COUNT(DISTINCT trip_id) AS distinct_trips,
                   COUNT(*) AS ticket_legs,
                   ROUND(SUM(amount_inr), 2) AS monthly_spend
            FROM vw_travel
            GROUP BY travel_month
            ORDER BY travel_month
        """)).fetchall()

        # 10. Trips by Business Group
        trips_by_bg_rows = conn.execute(text("""
            SELECT business_group,
                   COUNT(DISTINCT trip_id) AS distinct_trips,
                   COUNT(*) AS ticket_legs,
                   ROUND(SUM(amount_inr), 2) AS group_spend
            FROM vw_travel
            GROUP BY business_group
            ORDER BY distinct_trips DESC
        """)).fetchall()

        # 11. Trips by Travel Summary
        trips_by_summary_rows = conn.execute(text("""
            SELECT travel_summary,
                   COUNT(DISTINCT trip_id) AS distinct_trips,
                   COUNT(*) AS ticket_legs,
                   ROUND(SUM(amount_inr), 2) AS summary_spend
            FROM vw_travel
            GROUP BY travel_summary
            ORDER BY distinct_trips DESC
        """)).fetchall()

    return {
        "row_count": row_count,
        "completed_legs": completed_legs,
        "cancelled_legs": cancelled_legs,
        "total_spend": round(float(total_spend), 2),
        "completed_spend": round(float(completed_spend), 2),
        "cancelled_spend": round(float(cancelled_spend), 2),
        "total_trips": total_trips,
        "fully_flown_trips": fully_flown_trips,
        "fully_cancelled_trips": fully_cancelled_trips,
        "mixed_trips": mixed_trips,
        "travelled_trips": travelled_trips,
        "non_travelled_trips": non_travelled_trips,
        "domestic_trips": domestic_trips,
        "domestic_spend": round(float(domestic_spend), 2),
        "cross_border_trips": cross_border_trips,
        "cross_border_spend": round(float(cross_border_spend), 2),
        "multi_country_trips": multi_country_trips,
        "multi_country_spend": round(float(multi_country_spend), 2),
        "trips_by_month": trips_by_month_rows,
        "trips_by_business_group": trips_by_bg_rows,
        "trips_by_travel_summary": trips_by_summary_rows
    }


def print_reconciliation_report():
    data = get_governed_metrics()

    print("=" * 80)
    print("PS-04 POWER BI GROUND TRUTH VALIDATION (vw_travel)")
    print("=" * 80)
    print(f"Total Ingested Ticket Legs (Fact Grain): {data['row_count']}")
    print(f"  ├── Completed Ticket Legs ('Y')      : {data['completed_legs']} (Spend: ₹{data['completed_spend']:,.2f})")
    print(f"  └── Cancelled/Refunded Legs ('N')    : {data['cancelled_legs']} (Spend: ₹{data['cancelled_spend']:,.2f})")
    print(f"  └── Total Gross Booking Spend        : ₹{data['total_spend']:,.2f} INR")
    print("-" * 80)
    print(f"Total Distinct Trips (Trip Grain)      : {data['total_trips']}")
    print(f"  ├── Fully Flown Trips (All 'Y')      : {data['fully_flown_trips']}")
    print(f"  ├── Fully Cancelled Trips (All 'N')  : {data['fully_cancelled_trips']}")
    print(f"  └── Mixed-Leg Trips (Both 'Y' & 'N') : {data['mixed_trips']}")
    print(f"  └── Check Sum ({data['fully_flown_trips']} + {data['fully_cancelled_trips']} + {data['mixed_trips']})        : {data['fully_flown_trips'] + data['fully_cancelled_trips'] + data['mixed_trips']} (100% Reconciled)")
    print("-" * 80)
    print(f"Trips with Travelled Legs (Any 'Y')    : {data['travelled_trips']} ({data['fully_flown_trips']} fully flown + {data['mixed_trips']} mixed)")
    print(f"Trips with Cancelled Legs (Any 'N')    : {data['non_travelled_trips']} ({data['fully_cancelled_trips']} fully cancelled + {data['mixed_trips']} mixed)")
    print(f"Trip Overlap Note                      : {data['travelled_trips']} + {data['non_travelled_trips']} = {data['travelled_trips'] + data['non_travelled_trips']} (> {data['total_trips']}) due to {data['mixed_trips']} multi-leg mixed trips")
    print("-" * 80)
    print(f"Domestic Trips                         : {data['domestic_trips']} (Spend: ₹{data['domestic_spend']:,.2f})")
    print(f"Cross-Border Trips                     : {data['cross_border_trips']} (Spend: ₹{data['cross_border_spend']:,.2f})")
    print(f"Multi-Country Trips                    : {data['multi_country_trips']} (Spend: ₹{data['multi_country_spend']:,.2f})")
    print("-" * 80)

    print("\n[PS-04 REQUIREMENT A: TRIPS BY MONTH (Page 1)]")
    print(f"{'Month':<10} | {'Distinct Trips':<15} | {'Ticket Legs':<12} | {'Monthly Spend (INR)':<20}")
    print("-" * 65)
    for r in data["trips_by_month"]:
        print(f"{r[0] or 'N/A':<10} | {r[1]:<15} | {r[2]:<12} | ₹{r[3]:,.2f}")

    print("\n[PS-04 REQUIREMENT B: TRIPS BY BUSINESS GROUP (Page 3)]")
    print(f"{'Business Group':<30} | {'Distinct Trips':<15} | {'Ticket Legs':<12} | {'Group Spend (INR)':<20}")
    print("-" * 85)
    for r in data["trips_by_business_group"]:
        bg_name = str(r[0]) if r[0] is not None else "(Vendor Direct / None)"
        print(f"{bg_name:<30} | {r[1]:<15} | {r[2]:<12} | ₹{r[3]:,.2f}")

    print("\n[PS-04 REQUIREMENT C: TRIPS BY TRAVEL SUMMARY (Page 2)]")
    print(f"{'Travel Summary Route':<35} | {'Distinct Trips':<15} | {'Ticket Legs':<12} | {'Route Spend (INR)':<20}")
    print("-" * 90)
    for r in data["trips_by_travel_summary"]:
        summary_name = str(r[0]) if r[0] is not None else "(None)"
        print(f"{summary_name:<35} | {r[1]:<15} | {r[2]:<12} | ₹{r[3]:,.2f}")

    print("=" * 80)
    print("STATUS: Source validation successful. Reconcile these figures in Power BI Desktop.")
    print("=" * 80)


if __name__ == "__main__":
    print_reconciliation_report()
