import os
import sys
import json
import urllib.request
from database.models import SessionLocal, FactTravelTicket, EmployeeMaster, ManualOverride, Complaint
from sqlalchemy import func

# Automatically load .env file if present
env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

def get_gemini_api_key():
    return os.environ.get("GEMINI_API_KEY", "")

def call_gemini_api(prompt: str, context_str: str) -> str:
    api_key = get_gemini_api_key().strip()
    if not api_key:
        return None

    # Google Gemini 2.5 Flash Endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    system_instruction = (
        "You are the senior AI Travel & Expense Intelligence Assistant for the Corporate Travel Analytics Platform. "
        "You have full visibility into the live corporate travel warehouse database. "
        "Answer any user question comprehensively, accurately, professionally, concisely, and helpfully. "
        "You can answer questions about corporate travel spend, department budgets, flight bookings, policy compliance, "
        "approvals, employee allowances, or general queries about how the application works. "
        "STRICT FORMATTING RULE: Do NOT include any asterisk characters (*) anywhere in your text response. Avoid bolding or italicizing with asterisks. Write in clean, modern prose. "
        "SUPPORT RULE: For filing complaints or help desk requests, inform the user they can use the in-app support desk form or email complaints@travelintelligence.com. "
        f"\nLive Corporate Travel Warehouse Context:\n{context_str}"
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Question: {prompt}"}
                ]
            }
        ]
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if "candidates" in res_data and len(res_data["candidates"]) > 0:
                candidate = res_data["candidates"][0]
                content = candidate.get("content", {})
                parts = content.get("parts", [])
                if parts and "text" in parts[0]:
                    text = parts[0]["text"]
                    clean_text = text.replace('*', '').strip()
                    return clean_text
    except Exception as e:
        print(f"[Gemini API Notice] primary endpoint error: {e}")
        # Fallback to gemini-2.0-flash
        try:
            url_alt = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
            req_alt = urllib.request.Request(url_alt, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req_alt, timeout=12) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if "candidates" in res_data and len(res_data["candidates"]) > 0:
                    text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_text = text.replace('*', '').strip()
                    return clean_text
        except Exception as e2:
            print(f"[Gemini API Notice] fallback endpoint error: {e2}")
            return None

    return None

def process_ai_query(user_query: str, user_role: str = "manager", employee_id: str = None, user_name: str = None) -> dict:
    query_lower = user_query.lower().strip()
    session = SessionLocal()

    if user_role == "employee" and employee_id:
        emp = session.query(EmployeeMaster).filter_by(employee_id=employee_id).first()
        emp_name = emp.employee_name if emp else (user_name or "Employee")
        emp_bu = emp.business_unit if emp else "Global Technology"
        emp_dept = emp.department if emp else "Engineering"
        emp_allowance = emp.quarterly_allowance_inr if emp else 150000.0

        emp_tickets = session.query(FactTravelTicket).filter_by(employee_id=employee_id).all()
        flown_tickets = [t for t in emp_tickets if t.travelled_flag == 'Y']
        cancelled_tickets = [t for t in emp_tickets if t.travelled_flag == 'N']
        emp_spend = sum(t.amount_inr for t in flown_tickets)
        remaining = max(0.0, emp_allowance - emp_spend)

        ticket_routes = [f"{t.origin_city}->{t.dest_city} (₹{t.amount_inr:,.0f} INR, {t.ticket_status})" for t in emp_tickets[:5]]
        routes_str = ", ".join(ticket_routes) if ticket_routes else "No bookings recorded yet"

        db_context = (
            f"User Profile: {emp_name} ({employee_id}), Department: {emp_dept}, Division: {emp_bu}. "
            f"Quarterly Allowance: ₹{emp_allowance:,.2f} INR. Total Spend to Date: ₹{emp_spend:,.2f} INR. "
            f"Remaining Quarterly Budget: ₹{remaining:,.2f} INR. "
            f"Total Bookings: {len(emp_tickets)} ({len(flown_tickets)} flown, {len(cancelled_tickets)} cancelled/refunded). "
            f"Recent Bookings: {routes_str}. "
            f"Official Support Email: complaints@travelintelligence.com. "
            f"Policy Guidelines: Domestic travel Economy only. Cross-border international flights (>6 hrs) allow Business Class for Lead/Director/VP levels. "
            f"Hotel cap: ₹8,500 INR/night domestic, $250 USD international. Daily per diem: ₹1,800 INR/day domestic, $75 USD international."
        )

        gemini_response = call_gemini_api(user_query, db_context)
        if gemini_response:
            session.close()
            clean_resp = gemini_response.replace('*', '').strip()
            return {
                "query": user_query,
                "answer": clean_resp,
                "data_summary": {
                    "Employee": emp_name,
                    "Quarterly Allowance": f"₹{emp_allowance:,.2f}",
                    "Used Budget": f"₹{emp_spend:,.2f}",
                    "Remaining Budget": f"₹{remaining:,.2f}"
                },
                "complaint_info": {"official_email": "complaints@travelintelligence.com"}
            }

        # Offline fallback for employee
        session.close()
        return {
            "query": user_query,
            "answer": f"Hello {emp_name}, you have used ₹{emp_spend:,.2f} INR of your ₹{emp_allowance:,.2f} INR quarterly travel allowance (Remaining: ₹{remaining:,.2f} INR across {len(emp_tickets)} total bookings). Domestic travel is restricted to Economy Class.",
            "data_summary": {
                "Quarterly Allowance": f"₹{emp_allowance:,.2f}",
                "Spent": f"₹{emp_spend:,.2f}",
                "Remaining": f"₹{remaining:,.2f}"
            },
            "complaint_info": {"official_email": "complaints@travelintelligence.com"}
        }

    # Company-wide context for Managers and Admins
    total_tickets = session.query(func.count(FactTravelTicket.ticket_id)).scalar() or 0
    total_spend = session.query(func.sum(FactTravelTicket.amount_inr)).filter(FactTravelTicket.travelled_flag == 'Y').scalar() or 0.0
    emp_count = session.query(func.count(EmployeeMaster.employee_id)).filter(EmployeeMaster.is_current == 1).scalar() or 0
    cancelled_count = session.query(func.count(FactTravelTicket.ticket_id)).filter(FactTravelTicket.travelled_flag == 'N').scalar() or 0
    
    bu_data = session.query(
        FactTravelTicket.business_unit,
        func.sum(FactTravelTicket.amount_inr)
    ).filter(FactTravelTicket.travelled_flag == 'Y').group_by(FactTravelTicket.business_unit).order_by(func.sum(FactTravelTicket.amount_inr).desc()).all()
    
    top_bu = bu_data[0] if bu_data else ("Global Technology", 492850.0)
    bu_summary_str = ", ".join([f"{bu}: ₹{amt:,.0f} INR" for bu, amt in bu_data])

    top_emp_data = session.query(
        FactTravelTicket.employee_name,
        FactTravelTicket.business_unit,
        func.sum(FactTravelTicket.amount_inr)
    ).filter(FactTravelTicket.travelled_flag == 'Y').group_by(FactTravelTicket.employee_name, FactTravelTicket.business_unit).order_by(func.sum(FactTravelTicket.amount_inr).desc()).first()
    
    top_emp_str = f"{top_emp_data[0]} ({top_emp_data[1]}) with ₹{top_emp_data[2]:,.2f} INR" if top_emp_data else "Priya Nair (Global Tech)"

    db_context = (
        f"Total Active Employees: {emp_count}. Total Published Tickets: {total_tickets}. Total Flown Spend: ₹{total_spend:,.2f} INR. "
        f"Top Department by Spend: {top_bu[0]} (₹{top_bu[1]:,.2f} INR). Highest Individual Spender: {top_emp_str}. "
        f"Non-travelled/Cancelled/Refunded: {cancelled_count}. Business Unit Spend Breakdown: {bu_summary_str}. "
        f"Official Support Desk Email: complaints@travelintelligence.com. "
        f"Corporate Policy Guidelines: Default quarterly employee allowance is ₹1,50,000 INR per employee. "
        f"Domestic flights are restricted to Economy Class. Cross-border international flights (>6 hrs) allow Business Class for Lead/Director/VP levels. "
        f"Hotel caps: ₹8,500 INR/night domestic, $250 USD/night international. Daily per diem: ₹1,800 INR/day domestic, $75 USD/day international."
    )

    # 1. Attempt Live Gemini Generative API Call
    gemini_response = call_gemini_api(user_query, db_context)
    if gemini_response:
        session.close()
        clean_resp = gemini_response.replace('*', '').strip()
        return {
            "query": user_query,
            "answer": clean_resp,
            "data_summary": {
                "AI Engine": "Google Gemini 2.5 Flash Live API",
                "Total Warehouse Spend": f"₹{total_spend:,.2f}",
                "Active Employees": emp_count
            },
            "complaint_info": {"official_email": "complaints@travelintelligence.com"}
        }

    # 2. Intelligent Offline Fallback Engine
    response = {
        "query": user_query,
        "answer": "",
        "data_summary": None,
        "complaint_info": {
            "official_email": "complaints@travelintelligence.com"
        }
    }

    if query_lower in ["hi", "hello", "hey", "greetings"]:
        response["answer"] = f"Hello! I am your Corporate Travel AI Assistant connected to the live warehouse. We are currently tracking {total_tickets} tickets across {emp_count} active employees with ₹{total_spend:,.2f} INR in verified flown spend. How can I assist you with budgets, policies, spend optimizations, or approvals today?"
        response["data_summary"] = {"Total Records": total_tickets, "Total Spend": f"₹{total_spend:,.2f}", "Active Employees": emp_count}

    elif "optimize" in query_lower or "saving" in query_lower or "reduction" in query_lower:
        response["answer"] = "Corporate Spend Optimization Strategies: 1. Strict Enforcement of Economy Class for domestic flights under 6 hours saves up to 34% annually. 2. Implementing the Manager Approval Desk prevents unapproved bookings before tickets are issued. 3. Setting quarterly budget allowance caps (₹1,50,000 INR default) limits excessive divisional expenditures. 4. Capping hotel reimbursements at ₹8,500 INR domestic prevents accommodation cost overruns."
        response["data_summary"] = {"Flight Savings": "34%", "Default Allowance": "₹1,50,000 INR", "Domestic Hotel Cap": "₹8,500 INR"}

    elif "next" in query_lower or "what can i do" in query_lower or "options" in query_lower:
        response["answer"] = "Here are key actions you can take in the platform: 1. Review and approve pending travel claims in the Manager Approvals tab. 2. Inspect the 100 corporate employee directory and adjust quarterly allowances in the Employees tab. 3. Import new vendor booking CSV feeds in the Pipeline tab. 4. Download executive C-Suite briefing reports in the Reports tab. 5. Ask me detailed questions about any employee, route, or department spend."
        response["data_summary"] = {"Key Modules": "Approvals, Directory, ETL Pipeline, Reports, Support Desk"}

    elif "complain" in query_lower or "issue" in query_lower or "support" in query_lower or "file" in query_lower or "report" in query_lower:
        response["answer"] = "You can submit your complaint or support inquiry directly using the in-app support desk form at the top right of this page, or email complaints@travelintelligence.com directly."
        response["data_summary"] = {"Support Email": "complaints@travelintelligence.com"}

    elif "budget" in query_lower or "plan" in query_lower or "finance" in query_lower or "cost" in query_lower:
        response["answer"] = f"Corporate Travel Budget & Financial Strategy: 1. Default quarterly employee allowance is set to ₹1,50,000 INR per employee across all divisions. 2. Mandating Economy class for domestic flights under 6 hours saves 34% annually. 3. Capping hotel stays at ₹8,500 INR per night domestic and $250 USD international ensures spend compliance."
        response["data_summary"] = {"Quarterly Cap": "₹1,50,000 INR", "Flight Savings": "34%"}

    elif "top" in query_lower or "highest" in query_lower or "maximum" in query_lower or "most" in query_lower:
        response["answer"] = f"Top Spend Insights: Highest Spending Division: {top_bu[0]} with ₹{top_bu[1]:,.2f} INR total spend. Top Spender Employee: {top_emp_str}."
        response["data_summary"] = {"Top Division": top_bu[0], "Top Spender": top_emp_str}

    elif "total spend" in query_lower or "expense" in query_lower:
        response["answer"] = f"The total verified corporate travel expenditure is ₹{total_spend:,.2f} INR across all business divisions. Quarterly employee travel allowance cap defaults to ₹1,50,000 INR per employee."
        response["data_summary"] = {"Total Spend INR": f"₹{total_spend:,.2f}", "Default Quarterly Cap": "₹1,50,000 INR"}

    elif "employee" in query_lower or "people" in query_lower or "count" in query_lower or "staff" in query_lower:
        response["answer"] = f"There are currently {emp_count} active corporate employees registered across business divisions in Bengaluru, Mumbai, Hyderabad, Gurugram, Pune, Delhi, and Chennai."
        response["data_summary"] = {"Active Employees": emp_count, "Hub Locations": "7 Tech Cities"}

    elif "department" in query_lower or "business unit" in query_lower or "bu" in query_lower or "division" in query_lower:
        response["answer"] = f"Expenditure breakdown by Business Division: {bu_summary_str}."
        response["data_summary"] = {bu: f"₹{amt:,.2f}" for bu, amt in bu_data}

    elif "cross-border" in query_lower or "international" in query_lower or "flight" in query_lower or "route" in query_lower:
        cb_count = session.query(func.count(FactTravelTicket.ticket_id)).filter(FactTravelTicket.trip_classification == 'Cross-Border').scalar() or 0
        response["answer"] = f"A total of {cb_count} cross-border international trips were recorded connecting Indian tech hubs with Boston, New York, London, Singapore, Frankfurt, Dubai, Tokyo, and Zurich."
        response["data_summary"] = {"Cross-Border Trips": cb_count, "Destinations": "US, UK, SG, DE, UAE, JP, CH"}

    elif "policy" in query_lower or "cabin" in query_lower or "rules" in query_lower or "class" in query_lower:
        response["answer"] = "Corporate Travel Policy Rules: 1. All domestic travel must be booked in Economy Class. 2. Business Class is approved only for international cross-border flights exceeding 6 hours for Lead Engineers, Managers, Directors, and VPs. 3. Travel requests are routed to the Manager Approval Desk before ticket issuance."
        response["data_summary"] = {"Domestic Class": "Economy Only", "International Class": "Business (Lead+ / >6 hrs)", "Approval": "Manager Mandatory"}

    else:
        response["answer"] = f"I analyzed our corporate travel analytics warehouse: We track {total_tickets} travel tickets across {emp_count} active employees with a verified spend of ₹{total_spend:,.2f} INR. Top spending division: {top_bu[0]} (₹{top_bu[1]:,.2f} INR). Highest spender: {top_emp_str}. How can I assist you further?"
        response["data_summary"] = {"Total Records": total_tickets, "Total Spend": f"₹{total_spend:,.2f}", "Top Division": top_bu[0]}

    session.close()
    return response

def submit_complaint(subject: str, details: str, submitted_by: str) -> dict:
    session = SessionLocal()
    complaint_obj = Complaint(
        subject=subject,
        details=details,
        submitted_by=submitted_by,
        status="OPEN"
    )
    session.add(complaint_obj)
    session.commit()
    comp_id = f"CMP-{complaint_obj.id + 100}"
    session.close()
    
    return {
        "status": "SUCCESS",
        "message": f"Complaint registered under ticket ID {comp_id}. Official support is also available at complaints@travelintelligence.com.",
        "complaint_id": comp_id
    }
