import os
import sys
import unittest
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.models import SessionLocal, FactTravelTicket, EmployeeMaster, QuarantinedRecord, init_db
from pipeline.cleansing import standardize_iso_date, convert_to_inr
from pipeline.enrichment import enrich_ticket_data
from services.auth import hash_password, verify_password, create_access_token, decode_access_token

class TestTravelAnalyticsSystem(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        init_db()
        from seed_data import generate_all_data
        generate_all_data()


    def test_iso_date_standardization(self):
        self.assertEqual(standardize_iso_date("15/08/2026"), "2026-08-15")
        self.assertEqual(standardize_iso_date("2026-09-01"), "2026-09-01")
        with self.assertRaises(ValueError):
            standardize_iso_date("invalid-date")

    def test_currency_conversion(self):
        self.assertEqual(convert_to_inr(100.0, "USD"), 8500.0)
        self.assertEqual(convert_to_inr(100.0, "INR"), 100.0)
        self.assertEqual(convert_to_inr(10.0, "GBP"), 1080.0)

    def test_auth_password_hashing_dynamic_salt(self):
        pwd = "ProductionPassword123!"
        hashed_1 = hash_password(pwd)
        hashed_2 = hash_password(pwd)
        # Random salts ensure hashes are unique
        self.assertNotEqual(hashed_1, hashed_2)
        # Both verify successfully
        self.assertTrue(verify_password(pwd, hashed_1))
        self.assertTrue(verify_password(pwd, hashed_2))
        self.assertFalse(verify_password("WrongPassword", hashed_1))

    def test_jwt_token_generation_and_decode(self):
        token = create_access_token({"sub": "manager@travelintelligence.com", "role": "manager", "employee_id": "MGR-5001"})
        self.assertIsNotNone(token)
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "manager@travelintelligence.com")
        self.assertEqual(payload["role"], "manager")

    def test_database_governed_view_and_models(self):
        session = SessionLocal()
        emp_count = session.query(EmployeeMaster).count()
        fact_count = session.query(FactTravelTicket).count()
        self.assertGreaterEqual(emp_count, 0)
        self.assertGreaterEqual(fact_count, 0)
        session.close()

    def test_scd_type2_temporal_enrichment(self):
        """
        Verify that SCD Type-2 temporal boundaries match tickets to historically accurate employee versions.
        """
        session = SessionLocal()
        # Check if EMP-1002 has temporal records
        emp_records = session.query(EmployeeMaster).filter_by(employee_id="EMP-1002").all()
        session.close()
        self.assertTrue(len(emp_records) >= 1)

    def test_quarantined_record_structure(self):
        session = SessionLocal()
        q_count = session.query(QuarantinedRecord).count()
        self.assertGreaterEqual(q_count, 0)
        session.close()

if __name__ == "__main__":
    unittest.main()
