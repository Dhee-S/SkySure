import pandas as pd
from supabase import create_client, Client
import uuid

SUPABASE_URL = "https://rvroifyyqmdrrykyypsq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cm9pZnl5cW1kcnJ5a3l5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTMzODUsImV4cCI6MjA5MTgyOTM4NX0.yPLIWD-D9HKKq4h4RhIChUgyT18EztRfcsp6ISrfx20"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_insert():
    df = pd.read_csv("data/skysure_riders_v4.csv").iloc[0:1]
    row = df.iloc[0]
    
    u_id = str(uuid.uuid4())
    print(f"Testing User {u_id}")
    res_u = supabase.table("users").insert({"user_id": u_id, "email": f"test_{u_id[:8]}@test.com"}).execute()
    print("User Insert Success")
    
    profile = {
        "rider_id": f"TEST_{uuid.uuid4().hex[:6]}",
        "user_id": u_id,
        "name": "Test User",
        "persona_type": row["persona_type"],
        "vehicle_type": row["vehicle_type"],
        "partner_app": row["partner_app"],
        "app_id": row["app_id"],
        "zone": row["zone"],
        "city": row["city"],
        "coordinates": row["coordinates"],
        "kyc_status": "verified",
        "bank_account_upi": row["upi_id"],
        "fraud_probability": float(row["fraud_probability"]),
        "trust_score": float(row["trust_score"]),
        "past_week_earnings": float(row["past_week_earnings"])
    }
    print("Testing Profile Insert")
    try:
        res_p = supabase.table("rider_profiles").insert(profile).execute()
        print("Profile Insert Success")
    except Exception as e:
        print("Profile Insert Failed:", e)

if __name__ == "__main__":
    test_insert()
