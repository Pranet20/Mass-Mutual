// =========================================================================
// Corporate Travel Analytics — Power Query (M) Script
// Governed Entity: vw_travel (Authoritative 37-Column Enterprise Schema)
// Client: MassMutual Financial Group (PS-04 Specification)
// =========================================================================

// OPTION 1: PostgreSQL DirectQuery / Import Connector
let
    // 1. Connect to PostgreSQL Instance
    Source = PostgreSQL.Database("localhost:5433", "travel_analytics"),
    
    // 2. Select Public Schema and vw_travel View
    public_Schema = Source{[Schema="public"]}[Data],
    vw_travel_View = public_Schema{[Name="vw_travel"]}[Data],
    
    // 3. Enforce Strict Data Typing across all 37 Governed Attributes
    #"Changed Types" = Table.TransformColumnTypes(vw_travel_View, {
        {"ticket_id", type text},
        {"trip_id", type text},
        {"batch_id", type text},
        {"employee_id", type text},
        {"employee_name", type text},
        {"business_unit", type text},
        {"business_group", type text},
        {"department", type text},
        {"issue_date", type date},
        {"travel_date", type date},
        {"return_date", type date},
        {"origin_city", type text},
        {"origin_country", type text},
        {"dest_city", type text},
        {"dest_country", type text},
        {"origin_iso", type text},
        {"dest_iso", type text},
        {"ticket_status", type text},
        {"amount_original", type number},
        {"currency", type text},
        {"fx_rate", type number},
        {"amount_inr", type number},
        {"fx_rate_date", type date},
        {"fx_source", type text},
        {"booking_channel", type text},
        {"cabin_class", type text},
        {"travelled_flag", type text},
        {"trip_classification", type text},
        {"travel_summary", type text},
        {"policy_compliance_status", type text},
        {"policy_violation_reason", type text},
        {"approval_status", type text},
        {"rejection_reason", type text},
        {"override_applied", Int64.Type},
        {"record_hash", type text},
        {"source_file", type text},
        {"updated_at", type datetime}
    })
in
    #"Changed Types"


// -------------------------------------------------------------------------
// OPTION 2: SQLite ODBC Connector (Development / Local Demonstration)
// -------------------------------------------------------------------------
/*
let
    Source = Odbc.Query("driver={SQLite3 ODBC Driver};Database=C:\Users\Pranet\Downloads\Mass Mutual\backend\database\travel_analytics.db;", "SELECT * FROM vw_travel"),
    #"Changed Types" = Table.TransformColumnTypes(Source, {
        {"ticket_id", type text},
        {"trip_id", type text},
        {"batch_id", type text},
        {"employee_id", type text},
        {"employee_name", type text},
        {"business_unit", type text},
        {"business_group", type text},
        {"department", type text},
        {"issue_date", type date},
        {"travel_date", type date},
        {"return_date", type date},
        {"origin_city", type text},
        {"origin_country", type text},
        {"dest_city", type text},
        {"dest_country", type text},
        {"origin_iso", type text},
        {"dest_iso", type text},
        {"ticket_status", type text},
        {"amount_original", type number},
        {"currency", type text},
        {"fx_rate", type number},
        {"amount_inr", type number},
        {"fx_rate_date", type date},
        {"fx_source", type text},
        {"booking_channel", type text},
        {"cabin_class", type text},
        {"travelled_flag", type text},
        {"trip_classification", type text},
        {"travel_summary", type text},
        {"policy_compliance_status", type text},
        {"policy_violation_reason", type text},
        {"approval_status", type text},
        {"rejection_reason", type text},
        {"override_applied", Int64.Type},
        {"record_hash", type text},
        {"source_file", type text},
        {"updated_at", type datetime}
    })
in
    #"Changed Types"
*/

// -------------------------------------------------------------------------
// OPTION 3: DimDate Dimension Generator (Power Query M)
// -------------------------------------------------------------------------
/*
let
    StartDate = #date(2026, 1, 1),
    EndDate = #date(2026, 12, 31),
    NumberOfDays = Duration.Days(EndDate - StartDate) + 1,
    DateList = List.Dates(StartDate, NumberOfDays, #duration(1, 0, 0, 0)),
    #"Date Table" = Table.FromList(DateList, Splitter.SplitByNothing(), {"Date"}, null, ExtraValues.Error),
    #"Typed Date" = Table.TransformColumnTypes(#"Date Table", {{"Date", type date}}),
    #"Added Year" = Table.AddColumn(#"Typed Date", "Year", each Date.Year([Date]), Int64.Type),
    #"Added Quarter" = Table.AddColumn(#"Added Year", "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    #"Added Month Number" = Table.AddColumn(#"Added Quarter", "Month Number", each Date.Month([Date]), Int64.Type),
    #"Added Month Name" = Table.AddColumn(#"Added Month Number", "Month Name", each Date.MonthName([Date]), type text),
    #"Added Year Month" = Table.AddColumn(#"Added Month Name", "Year Month", each Date.ToText([Date], "yyyy-MM"), type text),
    #"Added Month Start" = Table.AddColumn(#"Added Year Month", "Month Start", each Date.StartOfMonth([Date]), type date),
    #"Added Year Quarter" = Table.AddColumn(#"Added Month Start", "Year Quarter", each Text.From(Date.Year([Date])) & "-Q" & Text.From(Date.QuarterOfYear([Date])), type text)
in
    #"Added Year Quarter"
*/
