import re
import datetime
from typing import Dict, Any

def extract_ocr_receipt_data(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Simulates OCR document scanning and entity extraction for travel receipts,
    boarding passes, hotel invoices, and cab receipts.
    Extracts Vendor, Date, Currency, Tax, Total Amount INR, and Document Type.
    """
    text_content = ""
    try:
        text_content = file_bytes.decode('utf-8', errors='ignore')
    except Exception:
        text_content = ""

    filename_lower = filename.lower()
    
    # 1. Detect Document Type
    if "board" in filename_lower or "ticket" in filename_lower or "flight" in filename_lower or "air" in text_content.lower():
        doc_type = "Boarding Pass / Airline Ticket"
        vendors = ["Air India", "IndiGo Airlines", "Emirates", "British Airways", "Singapore Airlines"]
    elif "hotel" in filename_lower or "stay" in filename_lower or "taj" in text_content.lower() or "marriott" in text_content.lower():
        doc_type = "Hotel Accommodation Invoice"
        vendors = ["Taj Hotels & Resorts", "Marriott Executive Suites", "Oberoi Hotels", "Hyatt Regency"]
    else:
        doc_type = "Ground Transport Cab Receipt"
        vendors = ["Uber for Business", "Ola Corporate Cabs", "BluSmart EV Fleet"]

    # 2. Extract Vendor Name
    vendor = vendors[hash(filename) % len(vendors)]
    
    # 3. Extract Amount INR
    amount_match = re.search(r'(?:inr|rs|\$|€|£)?\s*([0-9,]+(?:\.[0-9]{2})?)', text_content, re.IGNORECASE)
    if amount_match:
        raw_amt = amount_match.group(1).replace(',', '')
        try:
            total_amt = float(raw_amt)
        except ValueError:
            total_amt = float((hash(filename) % 85000) + 1200)
    else:
        total_amt = float((hash(filename) % 85000) + 1200)

    tax_amt = round(total_amt * 0.18, 2)
    
    # 4. Extract Date
    date_match = re.search(r'(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})', text_content)
    if date_match:
        extracted_date = date_match.group(1)
    else:
        extracted_date = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")

    return {
        "status": "SUCCESS",
        "document_type": doc_type,
        "vendor_name": vendor,
        "receipt_date": extracted_date,
        "tax_amount_inr": tax_amt,
        "total_amount_inr": total_amt,
        "currency": "INR",
        "raw_extracted_text": f"Scanned {filename} successfully. Vendor: {vendor}, Date: {extracted_date}, Amount: ₹{total_amt:,.2f} INR."
    }
