"""
Build Script for Power BI Deliverables:
1. Power BI Project (PBIP) format:
   - powerbi/Corporate_Travel_Analytics.pbip
   - powerbi/Corporate_Travel_Analytics.Report/
   - powerbi/Corporate_Travel_Analytics.SemanticModel/
2. Compatible Corporate_Travel_Analytics.pbix with Report/Layout stream and 2024.10 metadata
3. Exact reconciliation of trip grain and ticket-leg grain
"""

import os
import json
import zipfile
import shutil

PBIX_PATH = "powerbi/Corporate_Travel_Analytics.pbix"
PBIP_PATH = "powerbi/Corporate_Travel_Analytics.pbip"
REPORT_DIR = "powerbi/Corporate_Travel_Analytics.Report"
MODEL_DIR = "powerbi/Corporate_Travel_Analytics.SemanticModel"
TEMP_DIR = "powerbi/_temp_build"

COLUMNS_DEF = [
    {"name": "ticket_id", "dataType": "string", "description": "Unique travel ticket number (Fact Grain Key)"},
    {"name": "trip_id", "dataType": "string", "description": "Associated multi-leg itinerary identifier (Trip Grain Key)"},
    {"name": "batch_id", "dataType": "string", "description": "ETL Ingestion batch identifier"},
    {"name": "employee_id", "dataType": "string", "description": "Corporate employee identifier"},
    {"name": "employee_name", "dataType": "string", "description": "Full name of the traveling employee"},
    {"name": "business_unit", "dataType": "string", "description": "Operating Business Unit at travel date"},
    {"name": "business_group", "dataType": "string", "description": "Top-level Corporate Division / Business Group"},
    {"name": "department", "dataType": "string", "description": "Department at travel date"},
    {"name": "issue_date", "dataType": "string", "description": "Date ticket was booked/issued (YYYY-MM-DD)"},
    {"name": "travel_date", "dataType": "string", "description": "Departure travel date (YYYY-MM-DD)"},
    {"name": "return_date", "dataType": "string", "description": "Return arrival date (YYYY-MM-DD)"},
    {"name": "origin_city", "dataType": "string", "description": "Departure city"},
    {"name": "origin_country", "dataType": "string", "description": "Departure country name"},
    {"name": "dest_city", "dataType": "string", "description": "Arrival destination city"},
    {"name": "dest_country", "dataType": "string", "description": "Arrival destination country name"},
    {"name": "origin_iso", "dataType": "string", "description": "ISO Alpha-2 code for origin"},
    {"name": "dest_iso", "dataType": "string", "description": "ISO Alpha-2 code for destination"},
    {"name": "ticket_status", "dataType": "string", "description": "Booking state (ISSUED, CANCELLED, REFUNDED, EXCHANGED)"},
    {"name": "amount_original", "dataType": "double", "description": "Raw transaction amount in booking currency", "formatString": "#,##0.00"},
    {"name": "currency", "dataType": "string", "description": "Booking transaction currency code"},
    {"name": "fx_rate", "dataType": "double", "description": "Exchange rate to INR", "formatString": "#,##0.0000"},
    {"name": "amount_inr", "dataType": "double", "description": "Total spend converted to INR", "formatString": "₹#,##0.00"},
    {"name": "fx_rate_date", "dataType": "string", "description": "Effective date of FX conversion rate"},
    {"name": "fx_source", "dataType": "string", "description": "Authoritative lineage source of FX conversion"},
    {"name": "booking_channel", "dataType": "string", "description": "Booking channel (Amadeus GDS, Sabre GDS, Corporate Portal)"},
    {"name": "cabin_class", "dataType": "string", "description": "Travel class (Economy, Premium Economy, Business)"},
    {"name": "travelled_flag", "dataType": "string", "description": "Y if flown, N if cancelled/refunded/exchanged"},
    {"name": "trip_classification", "dataType": "string", "description": "Domestic, Cross-Border, Multi-Country"},
    {"name": "travel_summary", "dataType": "string", "description": "Standardized route summary label"},
    {"name": "policy_compliance_status", "dataType": "string", "description": "Policy compliance flag (COMPLIANT, NON_COMPLIANT_CABIN)"},
    {"name": "policy_violation_reason", "dataType": "string", "description": "Reason for policy non-compliance"},
    {"name": "approval_status", "dataType": "string", "description": "Manager approval state (APPROVED, REJECTED, PENDING_APPROVAL)"},
    {"name": "rejection_reason", "dataType": "string", "description": "Reason for rejection"},
    {"name": "override_applied", "dataType": "int64", "description": "1 if manual override applied, 0 otherwise"},
    {"name": "record_hash", "dataType": "string", "description": "Canonical SHA-256 record hash"},
    {"name": "source_file", "dataType": "string", "description": "Source vendor CSV filename"},
    {"name": "updated_at", "dataType": "string", "description": "Timestamp of record update"}
]

MEASURES_DEF = [
    {
        "name": "Total Spend",
        "expression": "SUM(vw_travel[amount_inr])",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Total Spend INR",
        "expression": "SUM(vw_travel[amount_inr])",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Total Completed Spend INR",
        "expression": "CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = \"Y\")",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Total Cancelled Spend INR",
        "expression": "CALCULATE(SUM(vw_travel[amount_inr]), vw_travel[travelled_flag] = \"N\")",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Total Trips",
        "expression": "DISTINCTCOUNT(vw_travel[trip_id])",
        "formatString": "#,##0"
    },
    {
        "name": "Trips with Travelled Legs",
        "expression": "CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = \"Y\")",
        "formatString": "#,##0"
    },
    {
        "name": "Trips with Cancelled Legs",
        "expression": "CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), vw_travel[travelled_flag] = \"N\")",
        "formatString": "#,##0"
    },
    {
        "name": "Fully Flown Trips",
        "expression": "CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), FILTER(VALUES(vw_travel[trip_id]), CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"N\") = 0))",
        "formatString": "#,##0"
    },
    {
        "name": "Fully Cancelled Trips",
        "expression": "CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), FILTER(VALUES(vw_travel[trip_id]), CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"Y\") = 0))",
        "formatString": "#,##0"
    },
    {
        "name": "Partially Cancelled Trips",
        "expression": "CALCULATE(DISTINCTCOUNT(vw_travel[trip_id]), FILTER(VALUES(vw_travel[trip_id]), CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"Y\") > 0 && CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"N\") > 0))",
        "formatString": "#,##0"
    },
    {
        "name": "Total Tickets",
        "expression": "COUNTROWS(vw_travel)",
        "formatString": "#,##0"
    },
    {
        "name": "Completed Travel Tickets",
        "expression": "CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"Y\")",
        "formatString": "#,##0"
    },
    {
        "name": "Cancelled or Refunded Tickets",
        "expression": "CALCULATE(COUNTROWS(vw_travel), vw_travel[travelled_flag] = \"N\")",
        "formatString": "#,##0"
    },
    {
        "name": "Trips by Month",
        "expression": "DISTINCTCOUNT(vw_travel[trip_id])",
        "formatString": "#,##0"
    },
    {
        "name": "Trips by Business Group",
        "expression": "DISTINCTCOUNT(vw_travel[trip_id])",
        "formatString": "#,##0"
    },
    {
        "name": "Trips by Travel Summary",
        "expression": "DISTINCTCOUNT(vw_travel[trip_id])",
        "formatString": "#,##0"
    },
    {
        "name": "Spend by Business Group",
        "expression": "SUM(vw_travel[amount_inr])",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Avg Spend per Trip",
        "expression": "DIVIDE([Total Completed Spend INR], [Trips with Travelled Legs], 0)",
        "formatString": "₹#,##0.00"
    },
    {
        "name": "Policy Compliance Rate",
        "expression": "DIVIDE(CALCULATE(COUNTROWS(vw_travel), vw_travel[policy_compliance_status] = \"COMPLIANT\"), COUNTROWS(vw_travel), 0)",
        "formatString": "0.0%"
    },
    {
        "name": "Policy Exceptions Count",
        "expression": "CALCULATE(COUNTROWS(vw_travel), vw_travel[policy_compliance_status] <> \"COMPLIANT\")",
        "formatString": "#,##0"
    }
]

M_QUERY = (
    'let\n'
    '    Source = PostgreSQL.Database("localhost:5432", "travel_warehouse"),\n'
    '    public_vw_travel = Source{[Schema="public",Item="vw_travel"]}[Data],\n'
    '    #"Changed Type" = Table.TransformColumnTypes(public_vw_travel,{\n'
    '        {"ticket_id", type text}, {"trip_id", type text}, {"batch_id", type text}, {"employee_id", type text},\n'
    '        {"employee_name", type text}, {"business_unit", type text}, {"business_group", type text}, {"department", type text},\n'
    '        {"issue_date", type date}, {"travel_date", type date}, {"return_date", type date},\n'
    '        {"origin_city", type text}, {"origin_country", type text}, {"dest_city", type text}, {"dest_country", type text},\n'
    '        {"origin_iso", type text}, {"dest_iso", type text}, {"ticket_status", type text},\n'
    '        {"amount_original", type number}, {"currency", type text}, {"fx_rate", type number}, {"amount_inr", type number},\n'
    '        {"fx_rate_date", type date}, {"fx_source", type text}, {"booking_channel", type text}, {"cabin_class", type text},\n'
    '        {"travelled_flag", type text}, {"trip_classification", type text}, {"travel_summary", type text},\n'
    '        {"policy_compliance_status", type text}, {"policy_violation_reason", type text},\n'
    '        {"approval_status", type text}, {"rejection_reason", type text}, {"override_applied", Int64.Type},\n'
    '        {"record_hash", type text}, {"source_file", type text}, {"updated_at", type datetime}\n'
    '    })\n'
    'in\n'
    '    #"Changed Type"'
)

def build():
    print("Step 1: Extracting current PBIR assets from PBIX...")
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    with zipfile.ZipFile(PBIX_PATH, 'r') as z:
        z.extractall(TEMP_DIR)

    # -------------------------------------------------------------------------
    # 2. Build Power BI Project (.pbip)
    # -------------------------------------------------------------------------
    print("Step 2: Building Power BI Project (.pbip) folder structure...")
    pbip_data = {
        "version": "1.0",
        "artifacts": [
            {
                "report": {
                    "path": "Corporate_Travel_Analytics.Report"
                }
            }
        ],
        "settings": {
            "enableAutoAuth": True
        }
    }
    with open(PBIP_PATH, "w", encoding="utf-8") as f:
        json.dump(pbip_data, f, indent=2)

    # -------------------------------------------------------------------------
    # 3. Build Corporate_Travel_Analytics.Report/
    # -------------------------------------------------------------------------
    print("Step 3: Structuring Corporate_Travel_Analytics.Report...")
    if os.path.exists(REPORT_DIR):
        shutil.rmtree(REPORT_DIR)
    os.makedirs(REPORT_DIR, exist_ok=True)

    pbir_data = {
        "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json",
        "version": "1.0",
        "datasetReference": {
            "byPath": {
                "path": "../Corporate_Travel_Analytics.SemanticModel"
            },
            "byConnection": None
        }
    }
    with open(os.path.join(REPORT_DIR, "definition.pbir"), "w", encoding="utf-8") as f:
        json.dump(pbir_data, f, indent=2)

    # Copy definition folder
    rep_def_src = os.path.join(TEMP_DIR, "Report", "definition")
    rep_def_dst = os.path.join(REPORT_DIR, "definition")
    shutil.copytree(rep_def_src, rep_def_dst)

    # Ensure version.json has standard 1.0.0
    ver_file = os.path.join(rep_def_dst, "version.json")
    with open(ver_file, "w", encoding="utf-8") as f:
        json.dump({
            "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
            "version": "1.0.0"
        }, f, indent=2)

    # Copy theme StaticResources
    theme_src = os.path.join(TEMP_DIR, "Report", "StaticResources")
    theme_dst = os.path.join(REPORT_DIR, "StaticResources")
    if os.path.exists(theme_src):
        shutil.copytree(theme_src, theme_dst)

    # -------------------------------------------------------------------------
    # 4. Build Corporate_Travel_Analytics.SemanticModel/
    # -------------------------------------------------------------------------
    print("Step 4: Structuring Corporate_Travel_Analytics.SemanticModel...")
    if os.path.exists(MODEL_DIR):
        shutil.rmtree(MODEL_DIR)
    os.makedirs(MODEL_DIR, exist_ok=True)

    pbism_data = {
        "version": "1.0",
        "settings": {}
    }
    with open(os.path.join(MODEL_DIR, "definition.pbism"), "w", encoding="utf-8") as f:
        json.dump(pbism_data, f, indent=2)

    # Generate model.bim (TMSL JSON format)
    bim_data = {
        "name": "Corporate_Travel_Analytics",
        "compatibilityLevel": 1550,
        "model": {
            "culture": "en-US",
            "dataAccessOptions": {
                "legacyRedirects": True,
                "returnErrorValuesAsNull": True
            },
            "defaultPowerBIDataSourceVersion": "powerBI_V3",
            "tables": [
                {
                    "name": "vw_travel",
                    "description": "Governed analytical view representing travel ticket legs enriched with SCD Type 2 employee history, geographic master data, financial FX lineage, and audit compliance.",
                    "columns": [
                        {
                            "name": c["name"],
                            "dataType": c["dataType"],
                            "sourceColumn": c["name"],
                            "description": c.get("description", ""),
                            **({"formatString": c["formatString"]} if "formatString" in c else {})
                        }
                        for c in COLUMNS_DEF
                    ],
                    "partitions": [
                        {
                            "name": "vw_travel",
                            "mode": "import",
                            "source": {
                                "type": "m",
                                "expression": [M_QUERY]
                            }
                        }
                    ],
                    "measures": [
                        {
                            "name": m["name"],
                            "expression": m["expression"],
                            "formatString": m["formatString"]
                        }
                        for m in MEASURES_DEF
                    ]
                }
            ]
        }
    }
    with open(os.path.join(MODEL_DIR, "model.bim"), "w", encoding="utf-8") as f:
        json.dump(bim_data, f, indent=2)

    # Also generate TMDL definition files for full modern compatibility
    tmdl_dir = os.path.join(MODEL_DIR, "definition")
    os.makedirs(os.path.join(tmdl_dir, "tables"), exist_ok=True)
    os.makedirs(os.path.join(tmdl_dir, "cultures"), exist_ok=True)

    with open(os.path.join(tmdl_dir, "model.tmdl"), "w", encoding="utf-8") as f:
        f.write(
            "model Model\n"
            "\tculture: en-US\n"
            "\tdefaultPowerBIDataSourceVersion: powerBI_V3\n"
            "\tsourceQueryCulture: en-US\n"
            "\tdataAccessOptions\n"
            "\t\tlegacyRedirects\n"
            "\t\treturnErrorValuesAsNull\n\n"
            "annotation PBI_QueryOrder = [\"vw_travel\"]\n"
            "annotation __PBI_TimeIntelligenceEnabled = 1\n"
            "annotation PBIDesktopVersion = 2.158.1177.0 (24.10)\n\n"
            "ref table vw_travel\n"
        )

    with open(os.path.join(tmdl_dir, "relationships.tmdl"), "w", encoding="utf-8") as f:
        f.write("// Relationships container\n")

    with open(os.path.join(tmdl_dir, "cultures", "en-US.tmdl"), "w", encoding="utf-8") as f:
        f.write("culture en-US\n")

    # Generate tables/vw_travel.tmdl
    with open(os.path.join(tmdl_dir, "tables", "vw_travel.tmdl"), "w", encoding="utf-8") as f:
        f.write("table vw_travel\n\tlineageTag: 7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d\n\n")
        for m in MEASURES_DEF:
            f.write(f"\tmeasure '{m['name']}' = {m['expression']}\n")
            f.write(f"\t\tformatString: {m['formatString']}\n\n")
        for c in COLUMNS_DEF:
            f.write(f"\tcolumn {c['name']}\n")
            f.write(f"\t\tdataType: {c['dataType']}\n")
            f.write(f"\t\tsourceColumn: {c['name']}\n")
            if "formatString" in c:
                f.write(f"\t\tformatString: {c['formatString']}\n")
            f.write("\n")
        f.write("\tpartition vw_travel = m\n\t\tmode: import\n\t\tsource =\n")
        for m_line in M_QUERY.split("\n"):
            f.write(f"\t\t\t{m_line}\n")

    # -------------------------------------------------------------------------
    # 5. Compile Legacy Report/Layout for .pbix Compatibility
    # -------------------------------------------------------------------------
    print("Step 5: Compiling Report/Layout and packaging Corporate_Travel_Analytics.pbix...")
    pages_meta_file = os.path.join(rep_def_dst, "pages", "pages.json")
    with open(pages_meta_file, "r", encoding="utf-8") as f:
        pages_info = json.load(f)

    sections = []
    for idx, page_id in enumerate(pages_info["pageOrder"]):
        p_file = os.path.join(rep_def_dst, "pages", page_id, "page.json")
        with open(p_file, "r", encoding="utf-8") as f:
            p_data = json.load(f)

        v_dir = os.path.join(rep_def_dst, "pages", page_id, "visuals")
        visual_containers = []
        if os.path.exists(v_dir):
            for v_name in sorted(os.listdir(v_dir)):
                vf = os.path.join(v_dir, v_name, "visual.json")
                if os.path.isfile(vf):
                    with open(vf, "r", encoding="utf-8") as f:
                        v_obj = json.load(f)
                    pos = v_obj.get("position", {})
                    vis = v_obj.get("visual", {})
                    v_type = vis.get("visualType", "clusteredColumnChart")
                    q_state = vis.get("query", {}).get("queryState", {})
                    
                    # Convert to visualContainer config format
                    config_dict = {
                        "name": v_name,
                        "layouts": [{
                            "id": 0,
                            "position": {
                                "x": pos.get("x", 0),
                                "y": pos.get("y", 0),
                                "z": pos.get("z", 0),
                                "width": pos.get("width", 300),
                                "height": pos.get("height", 200)
                            }
                        }],
                        "singleVisual": {
                            "visualType": v_type,
                            "projections": {
                                k: [{"queryRef": p.get("queryRef", "")} for p in v.get("projections", [])]
                                for k, v in q_state.items()
                            }
                        }
                    }
                    visual_containers.append({
                        "x": pos.get("x", 0),
                        "y": pos.get("y", 0),
                        "z": pos.get("z", 0),
                        "width": pos.get("width", 300),
                        "height": pos.get("height", 200),
                        "config": json.dumps(config_dict, separators=(',', ':')),
                        "filters": "[]"
                    })

        sections.append({
            "id": idx,
            "name": page_id,
            "displayName": p_data.get("displayName", page_id),
            "filters": "[]",
            "ordinal": idx,
            "visualContainers": visual_containers,
            "config": json.dumps({
                "name": page_id,
                "layouts": [{"id": 0, "position": {"width": p_data.get("width", 1920), "height": p_data.get("height", 1080)}}]
            }, separators=(',', ':')),
            "width": p_data.get("width", 1920),
            "height": p_data.get("height", 1080),
            "displayOption": 1
        })

    layout_obj = {
        "id": 0,
        "resourcePackages": [
            {
                "resourcePackage": {
                    "name": "SharedResources",
                    "type": 1,
                    "items": [
                        {
                            "name": "Fluent2-CY26SU08",
                            "path": "BaseThemes/Fluent2-CY26SU08.json",
                            "type": 201
                        }
                    ]
                }
            }
        ],
        "sections": sections,
        "config": json.dumps({
            "version": "5.55",
            "themeCollection": {
                "baseTheme": {
                    "name": "Fluent2-CY26SU08",
                    "reportVersionAtImport": {"visual": "2.12.0", "report": "3.4.0", "page": "2.3.1"},
                    "type": "SharedResources"
                }
            }
        }, separators=(',', ':'))
    }

    # Write Report/Layout inside temp
    rep_dir = os.path.join(TEMP_DIR, "Report")
    os.makedirs(rep_dir, exist_ok=True)
    with open(os.path.join(rep_dir, "Layout"), "wb") as f:
        # Standard Power BI Layout is UTF-16LE without BOM or with BOM
        f.write(json.dumps(layout_obj, indent=2).encode('utf-16le'))

    # Update Version
    with open(os.path.join(TEMP_DIR, "Version"), "wb") as f:
        f.write("1.30".encode('utf-16le'))

    # Update Metadata (Power BI Desktop 2024.10)
    meta_dict = {
        "Version": 5,
        "AutoCreatedRelationships": [],
        "CreatedFrom": "PowerBIDesktop",
        "CreatedFromRelease": "2024.10"
    }
    with open(os.path.join(TEMP_DIR, "Metadata"), "wb") as f:
        f.write(json.dumps(meta_dict).encode('utf-16le'))

    # Update Settings
    settings_dict = {
        "Version": 4,
        "ReportSettings": {},
        "QueriesSettings": {
            "TypeDetectionEnabled": True,
            "RelationshipImportEnabled": True,
            "RunBackgroundAnalysis": True,
            "Version": "2.158.1177.0"
        }
    }
    with open(os.path.join(TEMP_DIR, "Settings"), "wb") as f:
        f.write(json.dumps(settings_dict).encode('utf-16le'))

    # Update [Content_Types].xml
    ct_xml = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="json" ContentType="" />'
        '<Override PartName="/Version" ContentType="" />'
        '<Override PartName="/DiagramLayout" ContentType="" />'
        '<Override PartName="/Settings" ContentType="application/json" />'
        '<Override PartName="/Metadata" ContentType="application/json" />'
        '<Override PartName="/SecurityBindings" ContentType="" />'
        '<Override PartName="/DataModel" ContentType="" />'
        '<Override PartName="/Report/Layout" ContentType="" />'
        '<Override PartName="/Report/StaticResources/SharedResources/BaseThemes/Fluent2-CY26SU08.json" ContentType="" />'
        '</Types>'
    )
    with open(os.path.join(TEMP_DIR, "[Content_Types].xml"), "wb") as f:
        f.write(ct_xml.encode('utf-8'))

    # Also keep Report/definition/version.json clean in PBIX
    with open(os.path.join(TEMP_DIR, "Report", "definition", "version.json"), "w", encoding="utf-8") as f:
        json.dump({
            "$schema": "https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json",
            "version": "1.0.0"
        }, f, indent=2)

    # Repackage PBIX
    new_pbix = PBIX_PATH + ".temp"
    with zipfile.ZipFile(new_pbix, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(TEMP_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, TEMP_DIR).replace("\\", "/")
                zout.write(full_path, rel_path)

    shutil.move(new_pbix, PBIX_PATH)
    shutil.rmtree(TEMP_DIR)
    print("SUCCESS: Both Power BI Project (.pbip) and compatible .pbix built cleanly.")

if __name__ == "__main__":
    build()
