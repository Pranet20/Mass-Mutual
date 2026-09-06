import csv
import random
import os

headers = [
    "ticket_id", "trip_id", "employee_id", "issue_date", "travel_date", "return_date",
    "origin_city", "origin_country", "dest_city", "dest_country", "ticket_status",
    "amount", "currency", "booking_channel", "cabin_class"
]

destinations = [
    ("Mumbai", "India", 14500, "INR"),
    ("Delhi", "India", 16200, "INR"),
    ("Bengaluru", "India", 12800, "INR"),
    ("Hyderabad", "India", 13900, "INR"),
    ("Boston", "United States", 1550, "USD"),
    ("New York", "United States", 1750, "USD"),
    ("London", "United Kingdom", 1150, "GBP"),
    ("Singapore", "Singapore", 850, "SGD"),
    ("Frankfurt", "Germany", 980, "EUR"),
    ("Dubai", "United Arab Emirates", 1950, "AED")
]

channels = ["Amadeus GDS", "Sabre GDS", "Corporate Portal", "Uber for Business"]
cabins = ["Economy", "Business", "Premium Economy"]
statuses = ["ISSUED", "ISSUED", "ISSUED", "CANCELLED", "REFUNDED"]

# 1. Dataset 1: Test_Dataset_Batch_1_Q3_2026.csv (120 Ticketing Records across 104 employees)
file_1 = "c:/Users/Pranet/Downloads/Mass Mutual/Test_Dataset_Batch_1_Q3_2026.csv"
records_1 = []
for seq in range(9101, 9221):
    tck_id = f"TCK-{seq}"
    trp_id = f"TRP-{seq - 8000}"
    emp_id = f"EMP-{(seq % 104) + 1001}"
    iss_date = f"2026-07-{(seq % 20) + 1:02d}"
    trv_date = f"2026-07-{(seq % 20) + 5:02d}"
    ret_date = f"2026-07-{(seq % 20) + 10:02d}"
    
    dest = random.choice(destinations)
    status = random.choice(statuses)
    channel = random.choice(channels)
    cabin = random.choice(cabins)
    orig_city = "Bengaluru" if (seq % 3 == 0) else ("Mumbai" if (seq % 3 == 1) else "Hyderabad")
    
    records_1.append([
        tck_id, trp_id, emp_id, iss_date, trv_date, ret_date,
        orig_city, "India", dest[0], dest[1], status,
        dest[2], dest[3], channel, cabin
    ])

with open(file_1, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for r in records_1:
        writer.writerow(r)

# 2. Dataset 2: Test_Dataset_Batch_2_Q4_2026.csv (120 Ticketing Records across 104 employees)
file_2 = "c:/Users/Pranet/Downloads/Mass Mutual/Test_Dataset_Batch_2_Q4_2026.csv"
records_2 = []
for seq in range(9301, 9421):
    tck_id = f"TCK-{seq}"
    trp_id = f"TRP-{seq - 8000}"
    emp_id = f"EMP-{(seq % 104) + 1001}"
    iss_date = f"2026-10-{(seq % 20) + 1:02d}"
    trv_date = f"2026-10-{(seq % 20) + 5:02d}"
    ret_date = f"2026-10-{(seq % 20) + 10:02d}"
    
    dest = random.choice(destinations)
    status = random.choice(statuses)
    channel = random.choice(channels)
    cabin = random.choice(cabins)
    orig_city = "Bengaluru" if (seq % 3 == 0) else ("Mumbai" if (seq % 3 == 1) else "Hyderabad")
    
    records_2.append([
        tck_id, trp_id, emp_id, iss_date, trv_date, ret_date,
        orig_city, "India", dest[0], dest[1], status,
        dest[2], dest[3], channel, cabin
    ])

with open(file_2, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    for r in records_2:
        writer.writerow(r)

print("Generated 120-record standalone CSV test datasets successfully.")
