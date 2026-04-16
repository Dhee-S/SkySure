import pandas as pd
import numpy as np
import os
from supabase import create_client, Client
import uuid
import math

SUPABASE_URL = "https://rvroifyyqmdrrykyypsq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cm9pZnl5cW1kcnJ5a3l5cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTMzODUsImV4cCI6MjA5MTgyOTM4NX0.yPLIWD-D9HKKq4h4RhIChUgyT18EztRfcsp6ISrfx20"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_val(val, target_type=float):
    if val is None: return None
    # Handle numpy/pandas types
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return float(val)
    # Check for NaN generally
    try:
        if pd.isna(val): return None
    except: pass
    return val

def seed_riders():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "skysure_riders_v4.csv")
    df = pd.read_csv(data_path)
    
    batch_size = 50
    
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        
        users_batch = []
        profiles_batch = []
        policies_batch = []
        
        for _, row in batch.iterrows():
            u_id = str(uuid.uuid4())
            users_batch.append({
                "user_id": u_id,
                "email": str(row["email"]),
                "oauth_provider": str(row["oauth_provider"]),
                "role": "rider",
                "account_status": str(row["account_status"])
            })
            
            profiles_batch.append({
                "rider_id": str(row["rider_id"]),
                "user_id": u_id,
                "name": str(row["email"]).split('@')[0].replace('_', ' ').title(),
                "persona_type": str(row["persona_type"]),
                "vehicle_type": str(row["vehicle_type"]),
                "partner_app": str(row["partner_app"]),
                "app_id": str(row["app_id"]),
                "zone": str(row["zone"]),
                "city": str(row["city"]),
                "coordinates": str(row["coordinates"]),
                "kyc_status": str(row["kyc_status"]),
                "bank_account_upi": str(row["upi_id"]),
                "fraud_probability": clean_val(row["fraud_probability"]),
                "trust_score": clean_val(row["trust_score"]),
                "past_week_earnings": clean_val(row["past_week_earnings"])
            })
            
            policies_batch.append({
                "policy_id": str(row["policy_id"]),
                "rider_id": str(row["rider_id"]),
                "plan_selected": str(row["plan_selected"]),
                "tier": str(row["tier"]),
                "weekly_premium": clean_val(row["weekly_premium"]),
                "policy_start_date": str(row["policy_start_date"]),
                "policy_end_date": str(row["policy_end_date"]),
                "payment_status": str(row["premium_payment_status"]),
                "consecutive_weeks": int(row["consecutive_active_weeks"]) if not pd.isna(row["consecutive_active_weeks"]) else 0,
                "total_paid": clean_val(row["total_premiums_paid"]),
                "total_received": clean_val(row["total_payouts_received"])
            })
            
        print(f"Uploading batch {i//batch_size + 1}...")
        try:
            supabase.table("users").insert(users_batch).execute()
            supabase.table("rider_profiles").insert(profiles_batch).execute()
            supabase.table("policies").insert(policies_batch).execute()
        except Exception as e:
            print(f"FAILED batch starting {i}: {e}")
            # Fallback one-by-one
            for j in range(len(users_batch)):
                try:
                    supabase.table("users").insert(users_batch[j]).execute()
                    supabase.table("rider_profiles").insert(profiles_batch[j]).execute()
                    supabase.table("policies").insert(policies_batch[j]).execute()
                except Exception as ex:
                    if "duplicate" not in str(ex).lower():
                        print(f"Row {i+j} error: {ex}")

def seed_payout_history():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "skysure_payout_history.csv")
    if not os.path.exists(data_path):
        return
        
    df = pd.read_csv(data_path)
    batch_size = 50
    
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        events_batch = []
        
        for _, row in batch.iterrows():
            events_batch.append({
                "event_id": str(row["event_id"]),
                "rider_id": str(row["rider_id"]),
                "feed_timestamp": str(row["feed_timestamp"]),
                "trigger_score": clean_val(row["trigger_score"]),
                "fraud_score": clean_val(row["fraud_score"]),
                "ml_fraud_prob": clean_val(row["ml_fraud_prob"]),
                "fraud_status": str(row["fraud_status"]),
                "payout_amount": clean_val(row["payout_amount"]),
                "payout_status": str(row["payout_status"]),
                "payout_txn_id": str(row["payout_txn_id"]),
                "weather_at_trigger": str(row["weather_at_trigger"]),
                "traffic_at_trigger": str(row["traffic_at_trigger"]),
                "auto_initiated": bool(row["auto_initiated"]),
                "admin_reviewed": bool(row["admin_reviewed"])
            })
            
        try:
            supabase.table("payout_events").insert(events_batch).execute()
        except Exception as e:
            for event in events_batch:
                try:
                    supabase.table("payout_events").insert(event).execute()
                except:
                    pass

if __name__ == "__main__":
    seed_riders()
    seed_payout_history()
    print("Seeding complete!")
