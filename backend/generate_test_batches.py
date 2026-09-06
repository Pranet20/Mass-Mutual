import os
import csv
import random

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

headers = [
    "ticket_id", "trip_id", "employee_id", "issue_date", "travel_date", "return_date",
    "origin_city", "origin_country", "dest_city", "dest_country", "ticket_status",
    "amount", "currency", "booking_channel", "cabin_class"
]

destinations = [
    ("Mumbai", "India", 12500, "INR"),
    ("Delhi", "India", 15200, "INR"),
    ("Bengaluru", "India", 11800, "INR"),
    ("Hyderabad", "India", 13400, "INR"),
    ("Boston", "United States", 1450, "USD"),
    ("New York", "United States", 1600, "USD"),
    ("London", "United Kingdom", 1100, "GBP"),
    ("Singapore", "Singapore", 780, "SGD"),
    ("Frankfurt", "Germany", 920, "EUR"),
    ("Dubai", "United Arab Emirates", 1850, "AED")
]

channels = ["Amadeus GDS", "Sabre GDS", "Corporate Portal", "Uber for Business"]
cabins = ["Economy", "Business", "Premium Economy"]
statuses = ["ISSUED", "ISSUED", "ISSUED", "CANCELLED", "REFUNDED"]

# Batch A: Q3 2026 Ingestion Batch (35 Tickets)
batch_a_file = os.path.join(DATA_DIR, "sample_raw_tickets_batch_A.csv")
records_a = []
for seq in range(9001, 9036):
    tck_id = f"TCK-{seq}"
    trp_id = f"TRP-{seq - 8000}"
    emp_id = f"EMP-{(seq % 100) + 1001}"
    iss_date = f"2026-07-{(seq % 20) + 1:02d}"
    trv_date = f"2026-07-{(seq % 20) + 5:02d}"
    ret_date = f"2026-07-{(seq % 20) + 10:02d}"
    
    dest = random.choice(destinations)
    status = random.choice(statuses)
    channel = random.choice(channels)
    cabin = random.choice(cabins)
    orig_city = "Bengaluru" if (seq % 3 == 0) else ("Mumbai" if (seq % 3 == 1) else "Hyderabad")
    
    records_a.append([
        tck_id, trp_id, emp_id, iss_date, trv_date, ret_date,
        orig_city, "India", dest[0], dest[1], status,
        dest[2], dest[3], channel, cabin
    ])

with open(batch_a_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for r in records_a:
        writer.writerow(r)

# Batch B: Q4 2026 Ingestion Batch (35 Tickets)
batch_b_file = os.path.join(DATA_DIR, "sample_raw_tickets_batch_B.csv")
records_b = []
for seq in range(9501, 9536):
    tck_id = f"TCK-{seq}"
    trp_id = f"TRP-{seq - 8000}"
    emp_id = f"EMP-{(seq % 100) + 1001}"
    iss_date = f"2026-10-{(seq % 20) + 1:02d}"
    trv_date = f"2026-10-{(seq % 20) + 5:02d}"
    ret_date = f"2026-10-{(seq % 20) + 10:02d}"
    
    dest = random.choice(destinations)
    status = random.choice(statuses)
    channel = random.choice(channels)
    cabin = random.choice(cabins)
    orig_city = "Bengaluru" if (seq % 3 == 0) else ("Mumbai" if (seq % 3 == 1) else "Hyderabad")
    
    records_b.append([
        tck_id, trp_id, emp_id, iss_date, trv_date, ret_date,
        orig_city, "India", dest[0], dest[1], status,
        dest[2], dest[3], channel, cabin
    ])

with open(batch_b_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for r in records_b:
        writer.writerow(r)

print("Generated sample_raw_tickets_batch_A.csv and sample_raw_tickets_batch_B.csv")
