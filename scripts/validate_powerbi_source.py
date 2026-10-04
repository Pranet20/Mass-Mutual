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

        # 4. Travelled trips
        travelled_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'Y'")
        ).scalar() or 0
        travelled_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE travelled_flag = 'Y'")
        ).scalar() or 0.0

        # 5. Cancelled / Non-travelled trips
        non_travelled_trips = conn.execute(
            text("SELECT COUNT(DISTINCT trip_id) FROM vw_travel WHERE travelled_flag = 'N'")
        ).scalar() or 0
        non_travelled_spend = conn.execute(
            text("SELECT COALESCE(SUM(amount_inr), 0.0) FROM vw_travel WHERE travelled_flag = 'N'")
        ).scalar() or 0.0

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
        "total_trips": total_trips,
        "total_spend": round(float(total_spend), 2),
        "travelled_trips": travelled_trips,
        "travelled_spend": round(float(travelled_spend), 2),
        "non_travelled_trips": non_travelled_trips,
        "non_travelled_spend": round(float(non_travelled_spend), 2),
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
    print(f"Total Ingested Ticket Legs (Row Count) : {data['row_count']}")
    print(f"Total Distinct Trips (trip_id grain)   : {data['total_trips']}")
    print(f"Total Gross Booking Spend              : ₹{data['total_spend']:,.2f} INR")
    print(f"Travelled Trips (travelled_flag = 'Y') : {data['travelled_trips']} (Spend: ₹{data['travelled_spend']:,.2f})")
    print(f"Non-Travelled Trips ('N')              : {data['non_travelled_trips']} (Spend: ₹{data['non_travelled_spend']:,.2f})")
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
