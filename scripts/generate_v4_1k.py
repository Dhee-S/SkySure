import pandas as pd
import numpy as np
import uuid
import random
from datetime import datetime, timedelta
import os

def generate_1000_rows():
    input_file = r"d:\Code\Guidwire\gigguard\data\skysure_v3_final_cleaned.csv"
    output_file = r"d:\Code\Guidwire\gigguard\data\skysure_v4_1k.csv"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    # Load and slice to 1000 rows
    df_base = pd.read_csv(input_file).head(1000)
    print(f"Loaded {len(df_base)} rows from v3 base.")

    # 1. Profile Data Enrichment
    df_base['user_id'] = [f"usr_{uuid.uuid4().hex[:8]}" for _ in range(len(df_base))]
    # Name mapping
    if 'rider_name' in df_base.columns:
        df_base['name'] = df_base['rider_name']
    else:
        first_names = ["Arjun", "Deepak", "Sanjay", "Priya", "Rahul", "Anita", "Vikram", "Neha", "Rohan", "Sonal"]
        last_names = ["Kumar", "Sharma", "Singh", "Patel", "Verma", "Gupta", "Reddy", "Nair", "Joshi", "Iyer"]
        df_base['name'] = [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(len(df_base))]
    
    df_base['email'] = [f"rider_{uid}@example.com" for uid in df_base['user_id']]
    df_base['phone_number'] = [f"+91-{random.randint(60000, 99999)}{random.randint(10000, 99999)}" for _ in range(len(df_base))]
    
    base_date = datetime.strptime("2025-11-14", "%Y-%m-%d")
    df_base['registration_date'] = [ (base_date - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d") for _ in range(len(df_base)) ]
    
    df_base['kyc_status'] = np.random.choice(['verified', 'pending', 'rejected'], size=len(df_base), p=[0.85, 0.10, 0.05])
    
    if 'vehicle_type' not in df_base.columns:
        df_base['vehicle_type'] = np.random.choice(['bike', 'scooter', 'ev_bike', 'bicycle'], size=len(df_base), p=[0.5, 0.3, 0.15, 0.05])
    
    df_base['partner_app'] = np.random.choice(['zomato', 'swiggy', 'dunzo', 'zepto'], size=len(df_base), p=[0.4, 0.4, 0.1, 0.1])
    df_base['app_id'] = [f"{app[:4]}_{uuid.uuid4().hex[:6]}" for app in df_base['partner_app']]
    df_base['zone'] = df_base['city'] + "-" + np.random.choice(['North', 'South', 'East', 'West', 'Central'], size=len(df_base))
    
    # Coordinates handling (already in v3 usually)
    if 'coordinates' not in df_base.columns:
        df_base['coordinates'] = "13.0827,80.2707"
        
    df_base['bank_account_linked'] = np.random.choice([True, False], size=len(df_base), p=[0.9, 0.1])
    df_base['upi_id'] = [ f"{uid}@ybl" if linked else "" for uid, linked in zip(df_base['user_id'], df_base['bank_account_linked']) ]
    
    # 2. Policy & Acturial
    df_base['policy_id'] = [f"POL-TN-2026-{str(i).zfill(6)}" for i in range(len(df_base))]
    df_base['policy_start_date'] = [ (datetime.strptime(rd, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d") for rd in df_base['registration_date'] ]
    df_base['policy_end_date'] = [ (datetime.strptime(sd, "%Y-%m-%d") + timedelta(days=90)).strftime("%Y-%m-%d") for sd in df_base['policy_start_date'] ]
    
    # Tier logic
    def get_tier(p):
        if p == 'Full-Timer': return 'Pro'
        if p == 'Gig-Pro': return 'Standard'
        return 'Basic'
    
    if 'persona_type' in df_base.columns:
        df_base['tier'] = df_base['persona_type'].apply(get_tier)
    else:
        df_base['tier'] = 'Standard'
        
    df_base['plan_selected'] = df_base['tier'].str.lower()
    
    df_base['premium_payment_status'] = np.random.choice(['paid', 'pending', 'failed'], size=len(df_base), p=[0.8, 0.1, 0.1])
    df_base['payment_method'] = 'upi'
    df_base['payment_gateway_txn_id'] = [f"pay_{uuid.uuid4().hex[:12]}" if st == 'paid' else "" for st in df_base['premium_payment_status']]
    
    df_base['payout_wallet_balance'] = 0.0
    df_base['payout_status'] = 'approved'
    df_base['payout_txn_id'] = ""
    df_base['payout_timestamp'] = ""
    
    df_base['total_premiums_paid'] = (df_base['weekly_premium'] * np.random.randint(1, 24, size=len(df_base))).round(2)
    # Ensure realistic payouts
    df_base['total_payouts_received'] = np.where(np.random.rand(len(df_base)) > 0.6, (df_base['weekly_premium'] * 5).round(2), 0)
    df_base['consecutive_active_weeks'] = np.random.randint(0, 52, size=len(df_base))

    # 3. ML Risk Training fields
    # Derive is_fraud from v3 fields or random seed
    if 'fraud_probability' in df_base.columns:
        df_base['is_fraud'] = (df_base['fraud_probability'] > 0.7).astype(int)
    else:
        df_base['is_fraud'] = np.random.choice([0, 1], size=len(df_base), p=[0.92, 0.08])
        
    df_base['fraud_confirmed_by_admin'] = False
    df_base['claim_history_count'] = np.where(df_base['total_payouts_received'] > 0, np.random.randint(1, 5, size=len(df_base)), 0)
    
    today = datetime.strptime("2026-04-15", "%Y-%m-%d")
    df_base['days_since_registration'] = [ (today - datetime.strptime(d, "%Y-%m-%d")).days for d in df_base['registration_date'] ]
    
    df_base['zone_risk_index'] = np.random.uniform(0.1, 0.4, size=len(df_base)).round(2)
    df_base['peer_group_avg_efficiency'] = np.random.uniform(0.7, 0.9, size=len(df_base)).round(2)
    
    df_base['velocity_score'] = np.random.uniform(0.01, 1.0, size=len(df_base)).round(3)
    df_base['previous_payout_count'] = df_base['claim_history_count']
    df_base['consecutive_claim_days'] = 0
    df_base['income_drop_pct'] = np.random.uniform(0, 0.3, size=len(df_base)).round(2)
    df_base['session_drop_pct'] = np.random.uniform(0, 0.2, size=len(df_base)).round(2)
    
    df_base['vehicle_risk_factor'] = 0.8
    df_base['weather_severity_score'] = 0.5
    df_base['traffic_severity_score'] = 0.5

    # Final export
    df_base.to_csv(output_file, index=False)
    print(f"Successfully generated {output_file} with {len(df_base)} rows.")

if __name__ == "__main__":
    generate_1000_rows()
