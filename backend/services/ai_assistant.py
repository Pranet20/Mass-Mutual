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

OFFICIAL_EMAIL = "pparker062005@gmail.com"

# External Gemini API has been completely removed to prevent data leakage and guarantee 100% data consistency.
# All policy evaluation and spend analysis are executed 100% locally and deterministically against PostgreSQL.

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

        session.close()
        return {
            "query": user_query,
            "answer": f"Hello {emp_name}, you have used ₹{emp_spend:,.2f} INR of your ₹{emp_allowance:,.2f} INR quarterly travel allowance (Remaining: ₹{remaining:,.2f} INR across {len(emp_tickets)} total bookings). Domestic travel is restricted to Economy Class.",
            "data_summary": {
                "Quarterly Allowance": f"₹{emp_allowance:,.2f}",
                "Spent": f"₹{emp_spend:,.2f}",
                "Remaining": f"₹{remaining:,.2f}"
            },
            "complaint_info": {
                "official_email": OFFICIAL_EMAIL,
                "legacy_email": "complaints@travelintelligence.com"
            }
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

    # 100% In-House Deterministic Rule Engine (No third-party LLM, no data leakage)
    response = {
        "query": user_query,
        "answer": "",
        "data_summary": None,
        "complaint_info": {
            "official_email": OFFICIAL_EMAIL,
            "legacy_email": "complaints@travelintelligence.com"
        }
    }

    if query_lower in ["hi", "hello", "hey", "greetings"]:
        response["answer"] = f"Hello! I am your Corporate Travel Governance Desk connected to the live warehouse. We are currently tracking {total_tickets} tickets across {emp_count} active employees with ₹{total_spend:,.2f} INR in verified flown spend. How can I assist you with budgets, policies, spend optimizations, or approvals today?"
        response["data_summary"] = {"Total Records": total_tickets, "Total Spend": f"₹{total_spend:,.2f}", "Active Employees": emp_count}

    elif "service" in query_lower or "feature" in query_lower or "capabilities" in query_lower or "what do you do" in query_lower:
        response["answer"] = "The Corporate Travel Intelligence Platform provides 6 core enterprise services: 1. Executive Command Center with dynamic spend analytics, route filters, and BI visualizations. 2. Governed multi-tier ETL Ingestion Pipeline with quarantine isolation, FX normalization, and deduplication. 3. 100-Employee Corporate Directory with real-time quarterly allowance limit management. 4. Manager Approval Desk & Policy Exemption Overrides. 5. Predictive Time-Series Spend Forecasting with QoQ projections. 6. Power BI Analytics Canvas with 14 production-grade DAX measures."
        response["data_summary"] = {"Core Services": "Executive BI, Governed Pipeline, Employee Directory, Approvals, Forecasting, Power BI"}

    elif "optimize" in query_lower or "saving" in query_lower or "reduction" in query_lower:
        response["answer"] = "Corporate Spend Optimization Strategies: 1. Strict Enforcement of Economy Class for domestic flights under 6 hours saves up to 34% annually. 2. Implementing the Manager Approval Desk prevents unapproved bookings before tickets are issued. 3. Setting quarterly budget allowance caps (₹1,50,000 INR default) limits excessive divisional expenditures. 4. Capping hotel reimbursements at ₹8,500 INR domestic prevents accommodation cost overruns."
        response["data_summary"] = {"Flight Savings": "34%", "Default Allowance": "₹1,50,000 INR", "Domestic Hotel Cap": "₹8,500 INR"}

    elif "next" in query_lower or "what can i do" in query_lower or "options" in query_lower:
        response["answer"] = "Here are key actions you can take in the platform: 1. Review and approve pending travel claims in the Manager Approvals tab. 2. Inspect the 100 corporate employee directory and adjust quarterly allowances in the Employees tab. 3. Import new vendor booking CSV feeds in the Pipeline tab. 4. Download executive C-Suite briefing reports in the Reports tab. 5. Access the full Power BI analytics canvas for deep drilldowns."
        response["data_summary"] = {"Key Modules": "Approvals, Directory, ETL Pipeline, Reports, Power BI Desk"}

    elif "complain" in query_lower or "issue" in query_lower or "support" in query_lower or "file" in query_lower or "report" in query_lower:
        response["answer"] = f"Official support inquiries and complaints are dispatched directly to {OFFICIAL_EMAIL}. Employees can file official complaints via the Employee Portal Support Desk."
        response["data_summary"] = {"Support Email": OFFICIAL_EMAIL}

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

import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_smtp_email(to_email: str, subject: str, body: str, from_email: str = None) -> tuple:
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg['From'] = from_email or smtp_user
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=8)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()
            return True, "Email dispatched directly via SMTP"
        except Exception as e:
            return False, f"SMTP dispatch error: {str(e)}"
    return False, "SMTP server credentials not configured; generated Gmail web link."

def submit_complaint(subject: str, details: str, submitted_by: str, from_email: str = None) -> dict:
    session = SessionLocal()
    complaint_body = f"From: {from_email}\n\n{details}" if from_email else details
    complaint_obj = Complaint(
        subject=subject,
        details=complaint_body,
        submitted_by=submitted_by,
        status="OPEN"
    )
    session.add(complaint_obj)
    session.commit()
    comp_id = f"CMP-{complaint_obj.id + 100}"
    session.close()

    mail_subject = f"[Corporate Travel Query - {comp_id}] {subject}"
    mail_body = f"From: {from_email or submitted_by}\nEmployee: {submitted_by}\nTicket Reference: {comp_id}\n\nDetails:\n{details}"
    sent, smtp_msg = send_smtp_email(OFFICIAL_EMAIL, mail_subject, mail_body, from_email)

    gmail_url = f"https://mail.google.com/mail/?view=cm&fs=1&to={urllib.parse.quote(OFFICIAL_EMAIL)}&su={urllib.parse.quote(mail_subject)}&body={urllib.parse.quote(mail_body)}"
    
    return {
        "status": "SUCCESS",
        "message": f"Complaint registered under ticket ID {comp_id}. Official dispatch routed to {OFFICIAL_EMAIL}.",
        "complaint_id": comp_id,
        "official_email": OFFICIAL_EMAIL,
        "smtp_sent": sent,
        "smtp_message": smtp_msg,
        "gmail_compose_url": gmail_url
    }

