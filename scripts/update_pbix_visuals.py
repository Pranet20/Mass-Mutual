"""
Script to rebuild and update powerbi/Corporate_Travel_Analytics.pbix
Injects the three non-negotiable PS-04 visuals and updates layouts:
1. Page 1: chartTripsByMonth (Trips by Month) + slicerBusinessGroup
2. Page 2: chartTripsByTravelSummary (Trips by Travel Summary) + slicerTravelSummary
3. Page 3: chartTripsByBusinessGroup (Trips by Business Group) + chartSpendByBusinessGroup + slicerBusinessGroup
"""

import zipfile
import json
import os
import shutil

PBIX_PATH = "powerbi/Corporate_Travel_Analytics.pbix"
TEMP_DIR = "powerbi/_pbix_extracted"

def build_visual_container(name, x, y, width, height, z, visual_type, query_state):
    return {
        "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.0.0/schema.json",
        "name": name,
        "position": {
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "z": z
        },
        "visual": {
            "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualConfiguration/2.0.0/schema.json",
            "visualType": visual_type,
            "query": {
                "queryState": query_state
            }
        }
    }

def main():
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # 1. Extract all existing files
    with zipfile.ZipFile(PBIX_PATH, 'r') as z:
        z.extractall(TEMP_DIR)

    # -------------------------------------------------------------------------
    # PAGE 1: 6c3859e92bb7e22182f0 (Executive Spend Overview)
    # -------------------------------------------------------------------------
    p1_dir = os.path.join(TEMP_DIR, "Report", "definition", "pages", "6c3859e92bb7e22182f0", "visuals")
    
    # 1.A Trips by Month (Clustered Column Chart) - Core PS-04 Visual
    v_trips_month = build_visual_container(
        name="chartTripsByMonth",
        x=40, y=210, width=740, height=470, z=102,
        visual_type="clusteredColumnChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "travel_date"
                            }
                        },
                        "queryRef": "vw_travel.travel_date",
                        "displayName": "Departure Month"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_id"
                            }
                        },
                        "queryRef": "DistinctCount(vw_travel.trip_id)",
                        "displayName": "Trips by Month"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "chartTripsByMonth"), exist_ok=True)
    with open(os.path.join(p1_dir, "chartTripsByMonth", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_trips_month, f, indent=2)

    # 1.B Trip Classification Pie / Spend Trajectory (Center visual)
    v_class_pie = build_visual_container(
        name="donutTripClassification",
        x=800, y=210, width=740, height=470, z=103,
        visual_type="pieChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_classification"
                            }
                        },
                        "queryRef": "vw_travel.trip_classification",
                        "displayName": "Classification"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "amount_inr"
                            }
                        },
                        "queryRef": "Sum(vw_travel.amount_inr)",
                        "displayName": "Spend (INR)"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "donutTripClassification"), exist_ok=True)
    with open(os.path.join(p1_dir, "donutTripClassification", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_class_pie, f, indent=2)

    # 1.C Slicers: Business Group, Business Unit, Classification
    v_slicer_bg = build_visual_container(
        name="slicerBusinessGroup",
        x=1560, y=210, width=320, height=145, z=104,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_group"
                            }
                        },
                        "queryRef": "vw_travel.business_group",
                        "displayName": "Business Group Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "slicerBusinessGroup"), exist_ok=True)
    with open(os.path.join(p1_dir, "slicerBusinessGroup", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_bg, f, indent=2)

    v_slicer_bu = build_visual_container(
        name="slicerBusinessUnit",
        x=1560, y=365, width=320, height=145, z=105,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_unit"
                            }
                        },
                        "queryRef": "vw_travel.business_unit",
                        "displayName": "Business Unit Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "slicerBusinessUnit"), exist_ok=True)
    with open(os.path.join(p1_dir, "slicerBusinessUnit", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_bu, f, indent=2)

    v_slicer_class = build_visual_container(
        name="slicerClassification",
        x=1560, y=520, width=320, height=160, z=106,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_classification"
                            }
                        },
                        "queryRef": "vw_travel.trip_classification",
                        "displayName": "Trip Type Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "slicerClassification"), exist_ok=True)
    with open(os.path.join(p1_dir, "slicerClassification", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_class, f, indent=2)

    # 1.D KPIs: Total Trips (DistinctCount), Total Spend, Total Tickets, Avg Cost
    v_kpi_trips = build_visual_container(
        name="kpiTotalTrips",
        x=40, y=40, width=440, height=140, z=100,
        visual_type="card",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_id"
                            }
                        },
                        "queryRef": "DistinctCount(vw_travel.trip_id)",
                        "displayName": "Total Distinct Trips"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "kpiTotalTrips"), exist_ok=True)
    with open(os.path.join(p1_dir, "kpiTotalTrips", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_kpi_trips, f, indent=2)

    v_kpi_spend = build_visual_container(
        name="kpiTotalSpend",
        x=500, y=40, width=440, height=140, z=101,
        visual_type="card",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "amount_inr"
                            }
                        },
                        "queryRef": "Sum(vw_travel.amount_inr)",
                        "displayName": "Total Spend (INR)"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "kpiTotalSpend"), exist_ok=True)
    with open(os.path.join(p1_dir, "kpiTotalSpend", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_kpi_spend, f, indent=2)

    v_kpi_tickets = build_visual_container(
        name="kpiCompletedTrips",
        x=960, y=40, width=440, height=140, z=107,
        visual_type="card",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "ticket_id"
                            }
                        },
                        "queryRef": "Count(vw_travel.ticket_id)",
                        "displayName": "Total Ingested Tickets"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "kpiCompletedTrips"), exist_ok=True)
    with open(os.path.join(p1_dir, "kpiCompletedTrips", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_kpi_tickets, f, indent=2)

    v_kpi_avg = build_visual_container(
        name="kpiAvgSpend",
        x=1420, y=40, width=460, height=140, z=108,
        visual_type="card",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "amount_inr"
                            }
                        },
                        "queryRef": "Average(vw_travel.amount_inr)",
                        "displayName": "Average Ticket Cost (INR)"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "kpiAvgSpend"), exist_ok=True)
    with open(os.path.join(p1_dir, "kpiAvgSpend", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_kpi_avg, f, indent=2)

    # 1.E Table Master Ledger (with business_group and trip_id)
    v_master_ledger = build_visual_container(
        name="tableMasterLedger",
        x=40, y=700, width=1840, height=340, z=109,
        visual_type="tableEx",
        query_state={
            "Values": {
                "projections": [
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "ticket_id"}}, "queryRef": "vw_travel.ticket_id", "displayName": "Ticket ID"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "trip_id"}}, "queryRef": "vw_travel.trip_id", "displayName": "Trip ID"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "employee_name"}}, "queryRef": "vw_travel.employee_name", "displayName": "Employee"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "business_group"}}, "queryRef": "vw_travel.business_group", "displayName": "Business Group"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "business_unit"}}, "queryRef": "vw_travel.business_unit", "displayName": "Business Unit"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "origin_city"}}, "queryRef": "vw_travel.origin_city", "displayName": "Origin"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "dest_city"}}, "queryRef": "vw_travel.dest_city", "displayName": "Destination"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "trip_classification"}}, "queryRef": "vw_travel.trip_classification", "displayName": "Classification"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "amount_inr"}}, "queryRef": "vw_travel.amount_inr", "displayName": "Amount (INR)"}
                ]
            }
        }
    )
    os.makedirs(os.path.join(p1_dir, "tableMasterLedger"), exist_ok=True)
    with open(os.path.join(p1_dir, "tableMasterLedger", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_master_ledger, f, indent=2)

    # Remove old chartDivisionalSpend if present in p1
    old_div_spend = os.path.join(p1_dir, "chartDivisionalSpend")
    if os.path.exists(old_div_spend):
        shutil.rmtree(old_div_spend)

    # -------------------------------------------------------------------------
    # PAGE 2: page_travel_analytics (Travel & Route Analytics)
    # -------------------------------------------------------------------------
    p2_dir = os.path.join(TEMP_DIR, "Report", "definition", "pages", "page_travel_analytics", "visuals")

    # 2.A Trips by Travel Summary (Clustered Column Chart) - Core PS-04 Visual
    v_trips_summary = build_visual_container(
        name="chartTripsByTravelSummary",
        x=40, y=210, width=740, height=470, z=202,
        visual_type="clusteredColumnChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "travel_summary"
                            }
                        },
                        "queryRef": "vw_travel.travel_summary",
                        "displayName": "Travel Summary"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_id"
                            }
                        },
                        "queryRef": "DistinctCount(vw_travel.trip_id)",
                        "displayName": "Trips by Travel Summary"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p2_dir, "chartTripsByTravelSummary"), exist_ok=True)
    with open(os.path.join(p2_dir, "chartTripsByTravelSummary", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_trips_summary, f, indent=2)

    # 2.B Booking Channel Mix (Center)
    v_channel_mix = build_visual_container(
        name="chartBookingChannelMix",
        x=800, y=210, width=740, height=470, z=203,
        visual_type="pieChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "booking_channel"
                            }
                        },
                        "queryRef": "vw_travel.booking_channel",
                        "displayName": "Booking Channel"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "amount_inr"
                            }
                        },
                        "queryRef": "Sum(vw_travel.amount_inr)",
                        "displayName": "Channel Spend (INR)"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p2_dir, "chartBookingChannelMix"), exist_ok=True)
    with open(os.path.join(p2_dir, "chartBookingChannelMix", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_channel_mix, f, indent=2)

    # 2.C Slicer: Travel Summary
    v_slicer_summary = build_visual_container(
        name="slicerTravelSummary",
        x=1560, y=210, width=320, height=230, z=204,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "travel_summary"
                            }
                        },
                        "queryRef": "vw_travel.travel_summary",
                        "displayName": "Route Summary Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p2_dir, "slicerTravelSummary"), exist_ok=True)
    with open(os.path.join(p2_dir, "slicerTravelSummary", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_summary, f, indent=2)

    # Remove old chartMonthlyTrajectory if replaced
    old_traj = os.path.join(p2_dir, "chartMonthlyTrajectory")
    if os.path.exists(old_traj):
        shutil.rmtree(old_traj)

    # Remove old slicerBookingChannel if replaced
    old_slicer_bc = os.path.join(p2_dir, "slicerBookingChannel")
    if os.path.exists(old_slicer_bc):
        shutil.rmtree(old_slicer_bc)

    # -------------------------------------------------------------------------
    # PAGE 3: page_business_groups (Business Group Analytics)
    # -------------------------------------------------------------------------
    p3_dir = os.path.join(TEMP_DIR, "Report", "definition", "pages", "page_business_groups", "visuals")

    # 3.A Trips by Business Group (Clustered Column Chart) - Core PS-04 Visual
    v_trips_bg = build_visual_container(
        name="chartTripsByBusinessGroup",
        x=40, y=210, width=740, height=470, z=302,
        visual_type="clusteredColumnChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_group"
                            }
                        },
                        "queryRef": "vw_travel.business_group",
                        "displayName": "Business Group"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "trip_id"
                            }
                        },
                        "queryRef": "DistinctCount(vw_travel.trip_id)",
                        "displayName": "Trips by Business Group"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p3_dir, "chartTripsByBusinessGroup"), exist_ok=True)
    with open(os.path.join(p3_dir, "chartTripsByBusinessGroup", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_trips_bg, f, indent=2)

    # 3.B Spend by Business Group (Center)
    v_spend_bg = build_visual_container(
        name="chartSpendByBusinessGroup",
        x=800, y=210, width=740, height=470, z=303,
        visual_type="clusteredColumnChart",
        query_state={
            "Category": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_group"
                            }
                        },
                        "queryRef": "vw_travel.business_group",
                        "displayName": "Business Group"
                    }
                ]
            },
            "Y": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "amount_inr"
                            }
                        },
                        "queryRef": "Sum(vw_travel.amount_inr)",
                        "displayName": "Spend by Business Group (INR)"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p3_dir, "chartSpendByBusinessGroup"), exist_ok=True)
    with open(os.path.join(p3_dir, "chartSpendByBusinessGroup", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_spend_bg, f, indent=2)

    # 3.C Slicer: Business Group
    v_slicer_bg3 = build_visual_container(
        name="slicerBusinessGroup",
        x=1560, y=210, width=320, height=230, z=304,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_group"
                            }
                        },
                        "queryRef": "vw_travel.business_group",
                        "displayName": "Business Group Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p3_dir, "slicerBusinessGroup"), exist_ok=True)
    with open(os.path.join(p3_dir, "slicerBusinessGroup", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_bg3, f, indent=2)

    v_slicer_bu3 = build_visual_container(
        name="slicerBU3",
        x=1560, y=460, width=320, height=220, z=305,
        visual_type="slicer",
        query_state={
            "Values": {
                "projections": [
                    {
                        "field": {
                            "Column": {
                                "Expression": {
                                    "SourceRef": {
                                        "Entity": "vw_travel"
                                    }
                                },
                                "Property": "business_unit"
                            }
                        },
                        "queryRef": "vw_travel.business_unit",
                        "displayName": "Business Unit Filter"
                    }
                ]
            }
        }
    )
    os.makedirs(os.path.join(p3_dir, "slicerBU3"), exist_ok=True)
    with open(os.path.join(p3_dir, "slicerBU3", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_slicer_bu3, f, indent=2)

    # 3.D Table with business_group included
    v_emp_ledger = build_visual_container(
        name="tableEmployeeSpendLedger",
        x=40, y=700, width=1840, height=340, z=306,
        visual_type="tableEx",
        query_state={
            "Values": {
                "projections": [
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "employee_id"}}, "queryRef": "vw_travel.employee_id", "displayName": "Employee ID"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "employee_name"}}, "queryRef": "vw_travel.employee_name", "displayName": "Full Name"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "business_group"}}, "queryRef": "vw_travel.business_group", "displayName": "Business Group"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "business_unit"}}, "queryRef": "vw_travel.business_unit", "displayName": "Business Unit"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "department"}}, "queryRef": "vw_travel.department", "displayName": "Department"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "dest_city"}}, "queryRef": "vw_travel.dest_city", "displayName": "Destination"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "trip_classification"}}, "queryRef": "vw_travel.trip_classification", "displayName": "Type"},
                    {"field": {"Column": {"Expression": {"SourceRef": {"Entity": "vw_travel"}}, "Property": "amount_inr"}}, "queryRef": "vw_travel.amount_inr", "displayName": "Total Spend (INR)"}
                ]
            }
        }
    )
    os.makedirs(os.path.join(p3_dir, "tableEmployeeSpendLedger"), exist_ok=True)
    with open(os.path.join(p3_dir, "tableEmployeeSpendLedger", "visual.json"), "w", encoding="utf-8") as f:
        json.dump(v_emp_ledger, f, indent=2)

    # Clean up old dept/cabin charts on page 3
    for old_v in ["chartSpendByDept", "chartCabinByBU", "slicerDept3"]:
        old_p = os.path.join(p3_dir, old_v)
        if os.path.exists(old_p):
            shutil.rmtree(old_p)

    # -------------------------------------------------------------------------
    # Re-package into Corporate_Travel_Analytics.pbix
    # -------------------------------------------------------------------------
    NEW_PBIX = PBIX_PATH + ".new"
    with zipfile.ZipFile(NEW_PBIX, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(TEMP_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TEMP_DIR).replace("\\", "/")
                zout.write(full_path, rel_path)

    shutil.move(NEW_PBIX, PBIX_PATH)
    shutil.rmtree(TEMP_DIR)
    print("SUCCESS: powerbi/Corporate_Travel_Analytics.pbix repackaged with all required PS-04 visual containers.")

if __name__ == "__main__":
    main()
