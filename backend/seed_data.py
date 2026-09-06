import os
import csv
import random
from datetime import datetime, timedelta
from database.models import init_db, SessionLocal, User, EmployeeMaster, CountryReference, ManualOverride, FXRate
from services.auth import hash_password

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

COUNTRIES = [
    ("IN", "India", "IN", "IND", "APAC", 1),
    ("US", "United States", "US", "USA", "AMER", 0),
    ("GB", "United Kingdom", "GB", "GBR", "EMEA", 0),
    ("SG", "Singapore", "SG", "SGP", "APAC", 0),
    ("DE", "Germany", "DE", "DEU", "EMEA", 0),
    ("AE", "United Arab Emirates", "AE", "ARE", "EMEA", 0),
    ("JP", "Japan", "JP", "JPN", "APAC", 0),
    ("AU", "Australia", "AU", "AUS", "APAC", 0),
    ("CA", "Canada", "CA", "CAN", "AMER", 0),
    ("CH", "Switzerland", "CH", "CHE", "EMEA", 0)
]

# 100 Authentic Corporate Employees (Celebrities/Actors removed, Priya Nair preserved, 5 Null Allowance Records for DQ Demonstration)
EMPLOYEE_NAMES = [
    ("Rajesh Sharma", "Global Technology", "Software Engineering", "Senior Principal Engineer", "Bengaluru", 250000.0),
    ("Priya Nair", "Finance & Actuarial", "Financial Planning", "Lead Financial Analyst", "Mumbai", 180000.0),
    ("Ananya Verma", "Global Technology", "Data & AI", "Lead Data Engineer", "Hyderabad", 200000.0),
    ("Vikram Malhotra", "Operations & Risk", "Risk Management", "Director of Operations", "Gurugram", 220000.0),
    ("Siddharth Rao", "Global Technology", "Cloud Architecture", "Staff Cloud Architect", "Bengaluru", 240000.0),
    ("Kavita Deshmukh", "Human Resources", "Talent Acquisition", "Global HR Business Partner", "Pune", 140000.0),
    ("Rohan Mehta", "Finance & Actuarial", "Corporate Treasury", "VP Treasury", "Mumbai", 260000.0),
    ("Neha Gupta", "Global Technology", "Cybersecurity", "Lead Security Engineer", "Hyderabad", 210000.0),
    ("Arjun Kapoor", "Operations & Risk", "Compliance", "Compliance Manager", "Chennai", 160000.0),
    ("Deepa Joshi", "Executive Leadership", "Strategy", "VP Corporate Strategy", "Bengaluru", 300000.0),
    ("Amitabh Sen", "Sales & Marketing", "Enterprise Sales", "Regional Sales Director", "Delhi", 220000.0),
    ("Sunita Reddy", "Finance & Actuarial", "Actuarial Science", "Senior Actuary", "Mumbai", 190000.0),
    ("Manish Pandey", "Global Technology", "DevOps & SRE", "Principal SRE Engineer", "Bengaluru", 230000.0),
    ("Tarun Saxena", "Legal & Compliance", "Corporate Law", "Senior Counsel", "Gurugram", 200000.0),
    ("Pooja Bhatia", "Human Resources", "People Ops", "HR Operations Lead", "Pune", 130000.0),
    ("Gaurav Iyer", "Sales & Marketing", "Field Marketing", "Marketing Director", "Bengaluru", 210000.0),
    ("Divya Pillai", "Global Technology", "Product Management", "Lead Product Manager", "Hyderabad", 220000.0),
    ("Karan Chaudhury", "Operations & Risk", "Internal Audit", "Audit Manager", "Mumbai", 170000.0),
    ("Shruti Aggarwal", "Finance & Actuarial", "Tax & Audit", "Tax Manager", "Delhi", 180000.0),
    ("Nitin Kulkarni", "Global Technology", "QA Automation", "Test Automation Manager", "Pune", 160000.0),
    ("Swati Chawla", "Sales & Marketing", "Customer Success", "Head of CS", "Bengaluru", 190000.0),
    ("Abhishek Banerjee", "Global Technology", "Mobile Engineering", "Staff Android Engineer", "Hyderabad", 190000.0),
    ("Meera Nambiar", "Human Resources", "Learning & Dev", "L&D Manager", "Chennai", 140000.0),
    ("Varun Dhawan", "Sales & Marketing", "Business Dev", "BD Director", "Mumbai", 210000.0),
    ("Ishita Roy", "Legal & Compliance", "IP & Patents", "Legal Specialist", "Gurugram", 150000.0),
    ("Alok Nath", "Operations & Risk", "Facilities", "Facilities Director", "Bengaluru", 160000.0),
    ("Ritu Sharma", "Global Technology", "UI/UX Design", "Lead UX Designer", "Pune", 170000.0),
    ("Sameer Joshi", "Finance & Actuarial", "Accounting", "Senior Accountant", "Mumbai", 150000.0),
    ("Nisha Agarwal", "Global Technology", "Database Ops", "Lead DBA", "Hyderabad", 180000.0),
    ("Vikramaditya Bose", "Global Technology", "Platform Engineering", "VP Global Platforms", "Bengaluru", 280000.0),
    ("Sneha Kulkarni", "Sales & Marketing", "Digital Growth", "Growth Marketing Lead", "Delhi", 160000.0),
    ("Aditya Singhania", "Finance & Actuarial", "Risk Modeling", "Lead Quantitative Modeler", "Mumbai", 210000.0),
    ("Harish Chandra", "Global Technology", "Platform Ops", "Infrastructure Lead", "Bengaluru", 190000.0),
    ("Bhavna Shah", "Finance & Actuarial", "Budgeting", "Financial Controller", "Gurugram", 220000.0),
    ("Shalini Roy", "Sales & Marketing", "Communications", "PR & Brand Director", "Mumbai", 200000.0),
    ("Dinesh Varma", "Operations & Risk", "Vendor Mgmt", "Procurement Lead", "Chennai", 160000.0),
    ("Smriti Madhavan", "Human Resources", "Culture & DEI", "DEI Programs Director", "Bengaluru", 150000.0),
    ("Gautam Singhal", "Global Technology", "AI Research", "Principal Research Scientist", "Hyderabad", 270000.0),
    ("Prashant Hegde", "Operations & Risk", "Security", "Information Security Officer", "Pune", 190000.0),
    ("Nikhil Chandrasekhar", "Sales & Marketing", "Brand Strategy", "Creative Director", "Mumbai", 200000.0),
    ("Indira Krishnan", "Legal & Compliance", "Ethics", "Chief Ethics Officer", "Delhi", 230000.0),
    ("Kartik Sundaram", "Sales & Marketing", "Product Marketing", "Product Marketing Lead", "Bengaluru", 170000.0),
    ("Tanvi Mukherjee", "Human Resources", "Talent Sourcing", "Lead Technical Recruiter", "Hyderabad", 130000.0),
    ("Suresh Narayanan", "Finance & Actuarial", "Payroll", "Global Payroll Manager", "Mumbai", 160000.0),
    ("Karan Singla", "Executive Leadership", "Board", "Chief Operating Officer", "Mumbai", 320000.0),
    ("Meenakshi Natarajan", "Global Technology", "Transformation", "Chief Technology Officer", "Bengaluru", 350000.0),
    ("Ganesh Venkatraman", "Operations & Risk", "Logistics", "Supply Chain Director", "Chennai", 200000.0),
    ("Rameshwar Prasad", "Legal & Compliance", "Regulatory", "Regulatory Affairs Lead", "Gurugram", 180000.0),
    ("Anuradha Sen", "Global Technology", "Systems Architecture", "Principal Systems Architect", "Bengaluru", 240000.0),
    ("Bhaskar Nambiar", "Finance & Actuarial", "Investment Strategy", "Portfolio Manager", "Mumbai", 250000.0),
    ("Chitra Raghavan", "Human Resources", "Employee Relations", "Senior HRBP", "Chennai", 145000.0),
    ("Debashis Ghosh", "Global Technology", "Data Engineering", "Senior Data Engineer", "Hyderabad", 195000.0),
    ("Esha Deol", "Sales & Marketing", "Client Engagement", "Account Director", "Delhi", 185000.0),
    ("Feroz Khan", "Operations & Risk", "Operational Risk", "Risk Lead", "Mumbai", 175000.0),
    ("Gitanjali Soni", "Legal & Compliance", "Commercial Contracts", "Senior Legal Specialist", "Gurugram", 190000.0),
    ("Hemant Khandelwal", "Global Technology", "Site Reliability", "Senior SRE Lead", "Bengaluru", 215000.0),
    ("Ila Arun", "Human Resources", "Total Rewards", "Compensation Analyst", "Pune", 135000.0),
    ("Jayant Gokhale", "Finance & Actuarial", "Financial Reporting", "Senior Finance Manager", "Mumbai", 205000.0),
    ("Kalyani Nair", "Global Technology", "Frontend Systems", "Staff UI Engineer", "Hyderabad", 185000.0),
    ("Lalit Mohan", "Operations & Risk", "Business Continuity", "BCP Program Manager", "Bengaluru", 165000.0),
    ("Madhuri Dixit", "Sales & Marketing", "Demand Generation", "Marketing Operations Lead", "Delhi", 175000.0),
    ("Naveen Patnaik", "Legal & Compliance", "Corporate Governance", "Governance Counsel", "Gurugram", 210000.0),
    ("Pallavi Shinde", "Global Technology", "Cloud Infrastructure", "Cloud Platform Engineer", "Pune", 190000.0),
    ("Raghavendra Rao", "Finance & Actuarial", "Actuarial Valuation", "Senior Actuarial Associate", "Mumbai", 180000.0),
    ("Sandhya Menon", "Human Resources", "Organizational Dev", "OD Lead Consultant", "Bengaluru", 155000.0),
    ("Tushar Deshpande", "Global Technology", "API Platform", "Senior Backend Architect", "Hyderabad", 225000.0),
    ("Urvashi Raut", "Sales & Marketing", "Strategic Partnerships", "Partnerships Manager", "Mumbai", 170000.0),
    ("Vijayendra Kulkarni", "Operations & Risk", "Fraud Prevention", "Senior Fraud Analyst", "Chennai", 160000.0),
    ("Yamini Reddy", "Global Technology", "Information Security", "SecOps Manager", "Bengaluru", 235000.0),
    ("Zakir Hussain", "Finance & Actuarial", "Capital Planning", "Capital Analyst", "Mumbai", 195000.0),
    ("Aparna Sen", "Human Resources", "Talent Management", "Head of Talent Development", "Delhi", 190000.0),
    ("Brijesh Tiwari", "Global Technology", "Enterprise Solutions", "Solutions Architect", "Hyderabad", 220000.0),
    ("Chandana Roy", "Operations & Risk", "Vendor Assessment", "Procurement Specialist", "Pune", 145000.0),
    ("Dipankar Bhattacharya", "Legal & Compliance", "Litigation", "Litigation Specialist", "Gurugram", 180000.0),
    ("Farida Jalal", "Sales & Marketing", "Channel Sales", "Channel Director", "Bengaluru", 205000.0),
    ("Govind Padmasoorya", "Global Technology", "MLOps", "Senior Machine Learning Engineer", "Bengaluru", 240000.0),
    ("Harini Sundar", "Finance & Actuarial", "Risk Analytics", "Senior Risk Quant", "Mumbai", 210000.0),
    ("Inderpreet Singh", "Human Resources", "HR Operations", "HR Shared Services Lead", "Delhi", 150000.0),
    ("Jayashree Thota", "Global Technology", "Data Governance", "Lead Data Governance Officer", "Hyderabad", 200000.0),
    ("Kishore Kumar", "Operations & Risk", "Workplace Safety", "EHS Lead", "Chennai", 140000.0),
    ("Leela Samson", "Legal & Compliance", "Data Privacy", "Privacy Officer", "Gurugram", 215000.0),
    ("Manmohan Waris", "Finance & Actuarial", "Financial Systems", "FinTech Systems Lead", "Mumbai", 220000.0),
    ("Nandita Das", "Human Resources", "Leadership Development", "Executive Coach Lead", "Bengaluru", 175000.0),
    ("Omkar Pradhan", "Global Technology", "Core Banking", "Principal Core Engineer", "Pune", 230000.0),
    ("Parvati Patil", "Sales & Marketing", "Key Accounts", "Strategic Account Director", "Delhi", 210000.0),
    ("Qasim Ali", "Operations & Risk", "Disaster Recovery", "DR Lead", "Hyderabad", 165000.0),
    ("Radhamani Pillai", "Finance & Actuarial", "Corporate Audit", "Lead Internal Auditor", "Mumbai", 185000.0),
    ("Satish Kaushik", "Global Technology", "Distributed Systems", "Principal Systems Engineer", "Bengaluru", 255000.0),
    ("Tejaswini Pandit", "Sales & Marketing", "Regional Growth", "Growth Manager (West)", "Mumbai", 165000.0),
    ("Udayan Mukherjee", "Finance & Actuarial", "Global Actuarial", "Chief Actuary", "Mumbai", 340000.0),
    ("Vandana Shiva", "Executive Leadership", "Sustainability", "Chief Sustainability Officer", "Delhi", 310000.0),
    ("Wahida Rehman", "Human Resources", "Employee Experience", "EX Program Director", "Bengaluru", 180000.0),
    ("Xavier Dsouza", "Global Technology", "Network Infrastructure", "Principal Network Architect", "Pune", 225000.0),
    ("Yogeshwar Dutt", "Operations & Risk", "Physical Security", "Security Operations Manager", "Gurugram", 155000.0),
    ("Zoya Akhtar", "Sales & Marketing", "Brand Creative", "Creative Strategy Lead", "Mumbai", 195000.0),
    # 5 Explicit NULL Allowance Records for Data Quality / Unallocated Allowance Audit Demonstration
    ("Ritika Varma", "Global Technology", "Software Consulting", "Consulting Intern (Unallocated)", "Pune", None),
    ("Aarav Namboodiri", "Operations & Risk", "Logistics Support", "Contractor Specialist (Unallocated)", "Bengaluru", None),
    ("Devika Menon", "Finance & Actuarial", "Quantitative Research", "Research Intern (Unallocated)", "Mumbai", None),
    ("Kunal Sengupta", "Sales & Marketing", "Market Research", "External Strategy Contractor (Unallocated)", "Delhi", None),
    ("Pooja Krishnamurthy", "Human Resources", "Talent Sourcing", "Campus Ambassador (Unallocated)", "Hyderabad", None)
]

# Named Employee Login Seeds
NAMED_EMPLOYEE_LOGINS = [
    ("Rajesh Sharma", "rajesh.sharma@travelintelligence.com", "Rajesh#2026!", "EMP-1001"),
    ("Priya Nair", "priya.nair@travelintelligence.com", "Priya@2026!", "EMP-1002"),
    ("Ananya Verma", "ananya.verma@travelintelligence.com", "Ananya$2026!", "EMP-1003"),
    ("Vikram Malhotra", "vikram.malhotra@travelintelligence.com", "Vikram%2026!", "EMP-1004"),
    ("Siddharth Rao", "siddharth.rao@travelintelligence.com", "Siddharth*2026!", "EMP-1005"),
    ("Kavita Deshmukh", "kavita.deshmukh@travelintelligence.com", "Kavita#2026!", "EMP-1006"),
    ("Rohan Mehta", "rohan.mehta@travelintelligence.com", "Rohan@2026!", "EMP-1007"),
    ("Neha Gupta", "neha.gupta@travelintelligence.com", "Neha$2026!", "EMP-1008"),
    ("Arjun Kapoor", "arjun.kapoor@travelintelligence.com", "Arjun%2026!", "EMP-1009"),
    ("Deepa Joshi", "deepa.joshi@travelintelligence.com", "Deepa*2026!", "EMP-1010")
]

def generate_all_data():
    init_db()
    session = SessionLocal()

    # 1. Populate Country Reference
    country_csv_path = os.path.join(DATA_DIR, "country_reference.csv")
    with open(country_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["country_code", "country_name", "iso_alpha2", "iso_alpha3", "region", "is_domestic_base"])
        for c in COUNTRIES:
            writer.writerow(c)
            existing_c = session.query(CountryReference).filter_by(country_code=c[0]).first()
            if not existing_c:
                session.add(CountryReference(
                    country_code=c[0],
                    country_name=c[1],
                    iso_alpha2=c[2],
                    iso_alpha3=c[3],
                    region=c[4],
                    is_domestic_base=c[5]
                ))

    # 1b. Populate FX Rates Reference Table
    fx_rates_data = [
        ("INR", 1.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("USD", 85.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("GBP", 108.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("EUR", 92.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("CHF", 95.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("CAD", 62.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("SGD", 63.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("AED", 23.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("JPY", 0.57, "2026-01-01", "Corporate Treasury Fixed 2026"),
        ("AUD", 55.0, "2026-01-01", "Corporate Treasury Fixed 2026"),
    ]
    for curr, rate, eff_date, src in fx_rates_data:
        existing_fx = session.query(FXRate).filter_by(currency_code=curr, effective_date=eff_date).first()
        if not existing_fx:
            session.add(FXRate(
                currency_code=curr,
                rate_to_inr=rate,
                effective_date=eff_date,
                source=src
            ))
    session.commit()

    # 2. Populate Employee Master with True SCD Type 2 Temporal Records
    session.query(EmployeeMaster).delete()
    session.commit()

    employee_csv_path = os.path.join(DATA_DIR, "employee_master.csv")
    with open(employee_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["employee_id", "employee_name", "email", "business_unit", "department", "designation", "location", "manager_id", "effective_start_date", "effective_end_date", "quarterly_allowance_inr", "is_current"])
        
        for idx, item in enumerate(EMPLOYEE_NAMES, 1001):
            emp_id = f"EMP-{idx}"
            email_prefix = item[0].lower().replace(" ", ".")
            email = f"{email_prefix}@travelintelligence.com"
            mgr_id = f"MGR-{(idx % 5) + 5001}"
            allowance = item[5]
            
            # SCD2 Temporal Seed: EMP-1002 (Priya Nair) had prior role in Operations before 2026
            if emp_id == "EMP-1002":
                # Historical version (2024-2025)
                h_row = [emp_id, item[0], email, "Operations & Risk", "Internal Audit", "Risk Analyst", item[4], mgr_id, "2024-01-01", "2025-12-31", 120000.0, 0]
                writer.writerow(h_row)
                session.add(EmployeeMaster(
                    employee_id=emp_id,
                    employee_name=item[0],
                    email=email,
                    business_unit="Operations & Risk",
                    department="Internal Audit",
                    designation="Risk Analyst",
                    location=item[4],
                    manager_id=mgr_id,
                    effective_start_date="2024-01-01",
                    effective_end_date="2025-12-31",
                    quarterly_allowance_inr=120000.0,
                    is_current=0
                ))
                # Current version (2026+)
                c_row = [emp_id, item[0], email, item[1], item[2], item[3], item[4], mgr_id, "2026-01-01", "9999-12-31", allowance, 1]
                writer.writerow(c_row)
                session.add(EmployeeMaster(
                    employee_id=emp_id,
                    employee_name=item[0],
                    email=email,
                    business_unit=item[1],
                    department=item[2],
                    designation=item[3],
                    location=item[4],
                    manager_id=mgr_id,
                    effective_start_date="2026-01-01",
                    effective_end_date="9999-12-31",
                    quarterly_allowance_inr=allowance,
                    is_current=1
                ))
            else:
                row = [emp_id, item[0], email, item[1], item[2], item[3], item[4], mgr_id, "2024-01-01", "9999-12-31", allowance if allowance is not None else "", 1]
                writer.writerow(row)
                session.add(EmployeeMaster(
                    employee_id=emp_id,
                    employee_name=item[0],
                    email=email,
                    business_unit=item[1],
                    department=item[2],
                    designation=item[3],
                    location=item[4],
                    manager_id=mgr_id,
                    effective_start_date="2024-01-01",
                    effective_end_date="9999-12-31",
                    quarterly_allowance_inr=allowance,
                    is_current=1
                ))

    # 3. Seed Fixed Manager User
    mgr_user = session.query(User).filter_by(email="manager@travelintelligence.com").first()
    if not mgr_user:
        session.add(User(
            email="manager@travelintelligence.com",
            password_hash=hash_password("Manager123!"),
            name="Manager",
            role="manager",
            employee_id="MGR-5001"
        ))
    else:
        mgr_user.password_hash = hash_password("Manager123!")
        mgr_user.name = "Manager"
        mgr_user.role = "manager"

    # 4. Seed Employee User Logins
    for emp_tuple in NAMED_EMPLOYEE_LOGINS:
        name, email, pwd, emp_id = emp_tuple
        user_rec = session.query(User).filter_by(email=email).first()
        if not user_rec:
            session.add(User(
                email=email,
                password_hash=hash_password(pwd),
                name=name,
                role="employee",
                employee_id=emp_id
            ))
        else:
            user_rec.password_hash = hash_password(pwd)
            user_rec.name = name
            user_rec.employee_id = emp_id

    # 5. Generate Raw Travel Tickets Dataset (250 Records)
    raw_tickets_csv = os.path.join(DATA_DIR, "travel_raw_tickets.csv")
    headers = [
        "ticket_id", "trip_id", "employee_id", "issue_date", "travel_date", "return_date",
        "origin_city", "origin_country", "dest_city", "dest_country", "ticket_status",
        "amount", "currency", "booking_channel", "cabin_class"
    ]

    records = [
        # TCK-8001 to TCK-8018 (Fixed Test Scenarios)
        ["TCK-8001", "TRP-101", "EMP-1001", "2026-01-05", "2026-01-12", "2026-01-15", "Bengaluru", "India", "Mumbai", "India", "ISSUED", 14500.0, "INR", "Amadeus GDS", "Economy"],
        ["TCK-8002", "TRP-102", "EMP-1002", "2026-01-08", "2026-01-20", "2026-01-25", "Mumbai", "India", "Delhi", "India", "ISSUED", 18200.0, "INR", "Corporate Portal", "Economy"],
        ["TCK-8003", "TRP-103", "EMP-1003", "2026-01-10", "2026-02-01", "2026-02-14", "Hyderabad", "India", "Boston", "United States", "ISSUED", 1450.0, "USD", "Sabre GDS", "Business"],
        ["TCK-8004", "TRP-104", "EMP-1004", "2026-01-15", "2026-02-05", "2026-02-10", "Delhi", "India", "London", "United Kingdom", "ISSUED", 1100.0, "GBP", "Amadeus GDS", "Business"],
        ["TCK-8005", "TRP-105", "EMP-1005", "2026-02-01", "2026-02-18", "2026-02-22", "Bengaluru", "India", "Singapore", "Singapore", "ISSUED", 48000.0, "INR", "Corporate Portal", "Economy"],
        ["TCK-8006", "TRP-106", "EMP-1010", "2026-02-05", "2026-03-01", "2026-03-05", "Bengaluru", "India", "Frankfurt", "Germany", "ISSUED", 850.0, "EUR", "Sabre GDS", "Business"],
        ["TCK-8007", "TRP-106", "EMP-1010", "2026-02-05", "2026-03-05", "2026-03-12", "Frankfurt", "Germany", "Boston", "United States", "ISSUED", 1200.0, "USD", "Sabre GDS", "Business"],
        ["TCK-8008", "TRP-107", "EMP-1006", "2026-02-10", "2026-03-10", "2026-03-15", "Pune", "India", "Dubai", "United Arab Emirates", "CANCELLED", 38000.0, "INR", "Corporate Portal", "Economy"],
        ["TCK-8009", "TRP-108", "EMP-1007", "2026-02-12", "2026-03-18", "2026-03-22", "Mumbai", "India", "London", "United Kingdom", "EXCHANGED", 950.0, "GBP", "Amadeus GDS", "Economy"],
        ["TCK-8010", "TRP-108", "EMP-1007", "2026-02-14", "2026-03-19", "2026-03-23", "Mumbai", "India", "London", "United Kingdom", "ISSUED", 1020.0, "GBP", "Amadeus GDS", "Economy"],
        ["TCK-8011", "TRP-109", "EMP-1008", "2026-02-20", "2026-04-01", "2026-04-05", "Hyderabad", "India", "Tokyo", "Japan", "REFUNDED", 65000.0, "INR", "Corporate Portal", "Economy"],
        ["TCK-8012", "TRP-110", "EMP-1009", "2026-03-01", "2026-04-10", "2026-04-15", "Chennai", "India", "Sydney", "Australia", "CANCELLED", 78000.0, "INR", "Amadeus GDS", "Economy"],
        ["TCK-8013", "TRP-111", "EMP-1001", "2026-04-05", "2026-04-12", "2026-04-18", "Bengaluru", "India", "Boston", "United States", "ISSUED", 1600.0, "USD", "Sabre GDS", "Business"],
        ["TCK-8014", "TRP-112", "EMP-1003", "2026-04-10", "2026-04-20", "2026-04-25", "Hyderabad", "India", "Zurich", "Switzerland", "ISSUED", 920.0, "CHF", "Amadeus GDS", "Business"],
        ["TCK-8015", "TRP-113", "EMP-1005", "2026-05-01", "2026-05-10", "2026-05-15", "Bengaluru", "India", "Toronto", "Canada", "ISSUED", 1350.0, "CAD", "Corporate Portal", "Economy"],
        ["TCK-8016", "TRP-114", "EMP-1002", "2026-05-15", "2026-05-22", "2026-05-25", "Mumbai", "India", "Bengaluru", "India", "ISSUED", 12500.0, "INR", "Corporate Portal", "Economy"],
        ["TCK-8017", "TRP-115", "EMP-1004", "2026-06-01", "2026-06-10", "2026-06-15", "Delhi", "India", "Singapore", "Singapore", "ISSUED", 52000.0, "INR", "Sabre GDS", "Business"],
        ["TCK-8018", "TRP-116", "EMP-1006", "2026-06-12", "2026-06-20", "2026-06-24", "Pune", "India", "Mumbai", "India", "ISSUED", 8900.0, "INR", "Corporate Portal", "Economy"],
    ]

    destinations = [
        ("Mumbai", "India", "Domestic", 12500, "INR"),
        ("Delhi", "India", "Domestic", 15200, "INR"),
        ("Bengaluru", "India", "Domestic", 11800, "INR"),
        ("Hyderabad", "India", "Domestic", 13400, "INR"),
        ("Boston", "United States", "Cross-Border", 1450, "USD"),
        ("New York", "United States", "Cross-Border", 1600, "USD"),
        ("London", "United Kingdom", "Cross-Border", 1100, "GBP"),
        ("Singapore", "Singapore", "Cross-Border", 780, "SGD"),
        ("Frankfurt", "Germany", "Cross-Border", 920, "EUR"),
        ("Dubai", "United Arab Emirates", "Cross-Border", 1850, "AED")
    ]

    channels = ["Amadeus GDS", "Sabre GDS", "Corporate Portal", "Uber for Business"]
    cabins = ["Economy", "Business", "Premium Economy"]
    statuses = ["ISSUED", "ISSUED", "ISSUED", "CANCELLED", "REFUNDED"]

    # Generate additional tickets from TCK-8019 to TCK-8250 (Total 250 Tickets across 100 Employees)
    for seq in range(8019, 8251):
        tck_id = f"TCK-{seq}"
        trp_id = f"TRP-{(seq % 120) + 120}"
        emp_id = f"EMP-{(seq % 95) + 1001}" # assign to active employees 1-95 (unallocated 96-100 kept for claims/null audit)
        
        month = (seq % 12) + 1
        day = (seq % 20) + 1
        iss_date = f"2026-{month:02d}-{day:02d}"
        trv_date = f"2026-{month:02d}-{day+3:02d}"
        ret_date = f"2026-{month:02d}-{day+8:02d}"
        
        dest = random.choice(destinations)
        status = random.choice(statuses)
        channel = random.choice(channels)
        cabin = random.choice(cabins)
        orig_city = "Bengaluru" if (seq % 3 == 0) else ("Mumbai" if (seq % 3 == 1) else "Hyderabad")
        
        records.append([
            tck_id, trp_id, emp_id, iss_date, trv_date, ret_date,
            orig_city, "India", dest[0], dest[1], status,
            dest[3], dest[4], channel, cabin
        ])

    with open(raw_tickets_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for r in records:
            writer.writerow(r)

    # 6. Seed Manual Overrides
    if not session.query(ManualOverride).filter_by(ticket_id="TCK-8012").first():
        session.add(ManualOverride(
            ticket_id="TCK-8012",
            override_travelled_flag="Y",
            override_classification="Cross-Border",
            override_summary="IN to AU Cross-Border (Analyst Exemption)",
            override_reason="Analyst verified employee boarded replacement charter flight despite status flag",
            created_by="analyst@travelintelligence.com"
        ))
        session.commit()

    session.commit()
    session.close()
    print(f"Generated 100 Corporate Employees ({len(EMPLOYEE_NAMES)}) with 5 Null Allowance audit records and {len(records)} Raw Tickets.")

if __name__ == "__main__":
    generate_all_data()
