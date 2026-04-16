import pandas as pd
from supabase import create_client, Client
import uuid
import math

SUPABASE_URL = "https://rvroifyyqmdrrykyypsq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cm9pZnl5cW1kcnJ5a3l5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTMzODUsImV4cCI6MjA5MTgyOTM4NX0.yPLIWD-D9HKKq4h4RhIChUgyT18EztRfcsp6ISrfx20"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_val(val):
    if val is None: return None
    if isinstance(val, (float, int)):
        if math.isnan(val) or math.isinf(val):
            return 0
    return val

def debug_profiles():
    df = pd.read_csv("data/skysure_riders_v4.csv")
    row = df.iloc[0]
    
    # 1. Check if User exists
    u_id = str(uuid.uuid4())
    print(f"Creating User {u_id} for email {row['email']}")
    try:
        supabase.table("users").insert({"user_id": u_id, "email": f"debug_{u_id[:6]}@test.com"}).execute()
    except Exception as e:
        print("User fail:", e)
        return

    profile = {
        "rider_id": row["rider_id"],
        "user_id": u_id,
        "name": "Debug Rider",
        "persona_type": row["persona_type"],
        "vehicle_type": row["vehicle_type"],
        "partner_app": row["partner_app"],
        "app_id": row["app_id"],
        "zone": row["zone"],
        "city": row["city"],
        "coordinates": row["coordinates"],
        "kyc_status": row["kyc_status"],
        "bank_account_upi": row["upi_id"],
        "fraud_probability": clean_val(row["fraud_probability"]),
        "trust_score": clean_val(row["trust_score"]),
        "past_week_earnings": clean_val(row["past_week_earnings"])
    }
    
    print(f"Attempting Profile Insert for {row['rider_id']}")
    try:
        res = supabase.table("rider_profiles").insert(profile).execute()
        print("Profile Success!")
    except Exception as e:
        print("PROFILE ERROR FINAL:", e)

if __name__ == "__main__":
    debug_profiles()
