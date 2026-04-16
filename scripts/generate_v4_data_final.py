import pandas as pd
import numpy as np
import uuid
import random
from datetime import datetime, timedelta
import os

# SETTINGS
INPUT_FILE = r"d:\Code\Guidwire\gigguard\data\skysure_v3_final_cleaned.csv"
OUT_DIR = r"d:\Code\Guidwire\gigguard\data"
TOTAL_ROWS = 2000
FRAUD_RATE = 0.05

def generate_v4_master():
    try:
        print("Starting Full Relational Master Data Generation...")
    except UnicodeEncodeError:
        pass
    
    # 1. LOAD BASE
    if os.path.exists(INPUT_FILE):
        df_v3 = pd.read_csv(INPUT_FILE)
        if len(df_v3) > TOTAL_ROWS:
            df = df_v3.sample(TOTAL_ROWS).reset_index(drop=True)
        elif len(df_v3) < TOTAL_ROWS:
            extra = df_v3.sample(TOTAL_ROWS - len(df_v3), replace=True)
            df = pd.concat([df_v3, extra]).reset_index(drop=True)
        else:
            df = df_v3.copy()
    else:
        df = pd.DataFrame({'rider_id': [f"TN_RID_{1000+i}" for i in range(TOTAL_ROWS)]})
        df['persona_type'] = np.random.choice(['Full-Timer', 'Gig-Pro', 'Student-Flex', 'High-Risk'], TOTAL_ROWS)
        df['city'] = np.random.choice(['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'], TOTAL_ROWS)

    # 2. FRAUD & FEATURES
    df['is_fraud'] = 0
    fraud_indices = np.random.choice(df.index, int(TOTAL_ROWS * FRAUD_RATE), replace=False)
    df.loc[fraud_indices, 'is_fraud'] = 1

    # Tier mapping
    def assign_tier(row):
        p = row['persona_type']
        if p == 'Full-Timer': return np.random.choice(['Pro', 'Standard', 'Basic'], p=[0.7, 0.2, 0.1])
        if p == 'Gig-Pro': return np.random.choice(['Standard', 'Pro', 'Basic'], p=[0.6, 0.2, 0.2])
        if p == 'Student-Flex': return np.random.choice(['Basic', 'Standard'], p=[0.8, 0.2])
        return 'Basic'
    
    df['tier'] = df.apply(assign_tier, axis=1)
    df['plan_selected'] = df['tier'].str.lower()
    df['user_id'] = [f"usr_{uuid.uuid4().hex[:8]}" for _ in range(TOTAL_ROWS)]
    
    # 3. ML REFINEMENT
    df['earning_efficiency'] = np.where(df['is_fraud'] == 1, np.random.uniform(0.95, 1.1), np.random.uniform(0.4, 0.8))
    df['income_drop_pct'] = np.where(df['is_fraud'] == 1, np.random.uniform(0.7, 0.95), np.random.uniform(0.01, 0.2))
    df['ring_score'] = np.where(df['is_fraud'] == 1, np.random.uniform(0.8, 0.99), np.random.uniform(0.1, 0.4))
    df['trust_score'] = np.where(df['is_fraud'] == 1, np.random.randint(1, 4), np.random.randint(7, 11))
    df['fraud_probability'] = np.where(df['is_fraud'] == 1, np.random.uniform(0.85, 1.0), np.random.uniform(0.01, 0.15))
    
    # Velocity derived from existing or random
    if 'delivered_orders' not in df.columns: df['delivered_orders'] = np.random.randint(5, 25, TOTAL_ROWS)
    df['velocity_score'] = (df['delivered_orders'] / 480).round(4) # Assume 8hr shift
    df.loc[df['is_fraud'] == 1, 'velocity_score'] *= 2.5

    # 4. SUPABASE SEEDING COLUMNS (The "Missing Links")
    df['email'] = [f"rider_{uid}@example.com" for uid in df['user_id']]
    df['oauth_provider'] = 'google'
    df['account_status'] = 'active'
    df['app_id'] = [f"APP_{random.randint(1000, 9999)}" for _ in range(TOTAL_ROWS)]
    df['zone'] = df['city'] + "-" + np.random.choice(['North', 'South', 'West'], TOTAL_ROWS)
    df['kyc_status'] = 'verified'
    df['upi_id'] = [f"{uid}@ybl" for uid in df['user_id']]
    df['policy_id'] = [f"POL-{uuid.uuid4().hex[:6]}" for _ in range(TOTAL_ROWS)]
    df['policy_start_date'] = datetime.now().strftime("%Y-%m-%d")
    df['policy_end_date'] = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
    df['premium_payment_status'] = 'paid'
    df['consecutive_active_weeks'] = np.random.randint(1, 10, TOTAL_ROWS)
    df['total_premiums_paid'] = (df['tier'].map({'Basic': 49, 'Standard': 99, 'Pro': 199}) * df['consecutive_active_weeks']).round(2)
    df['total_payouts_received'] = 0.0
    df['phone_number'] = [f"+91-{random.randint(7000000000, 9999999999)}" for _ in range(TOTAL_ROWS)]
    df['vehicle_type'] = np.random.choice(['bike', 'scooter'], TOTAL_ROWS)
    df['partner_app'] = np.random.choice(['Zomato', 'Swiggy'], TOTAL_ROWS)

    # Coordinates alignment (if missing)
    if 'coordinates' not in df.columns:
        df['coordinates'] = "13.0827,80.2707" # Chennai center

    # Static environment
    df['weather_severity_score'] = 0.1
    df['traffic_severity_score'] = 0.2
    df['days_since_reg'] = 30
    df['vehicle_risk_factor'] = 0.5
    df['bank_account_linked'] = 1

    # 5. EXPORT
    # Master V4
    v4_path = os.path.join(OUT_DIR, "skysure_riders_v4.csv")
    df.to_csv(v4_path, index=False)
    
    # ML Set
    ml_features = [
        'earning_efficiency', 'velocity_score', 'income_drop_pct', 'ring_score', 
        'trust_score', 'fraud_probability', 'weather_severity_score', 
        'traffic_severity_score', 'days_since_reg', 'vehicle_risk_factor', 
        'bank_account_linked', 'delivered_orders', 'is_fraud'
    ]
    df[ml_features].to_csv(os.path.join(OUT_DIR, "skysure_ml_training.csv"), index=False)

    # 6. PAYOUT HISTORY (Prompt 4 consistency)
    df_payout = df.sample(600).copy()
    df_payout['event_id'] = [str(uuid.uuid4()) for _ in range(600)]
    df_payout['feed_timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    df_payout['trigger_score'] = np.random.uniform(0.1, 0.9, 600)
    df_payout['fraud_score'] = df_payout['fraud_probability']
    df_payout['ml_fraud_prob'] = df_payout['fraud_probability']
    df_payout['fraud_status'] = np.where(df_payout['is_fraud'] == 1, 'FRAUD', 'CLEAN')
    df_payout['payout_amount'] = np.random.randint(500, 1500, 600)
    df_payout['payout_status'] = np.where(df_payout['is_fraud'] == 1, 'DENIED_FRAUD', 'APPROVED')
    df_payout['payout_txn_id'] = [f"txn_{uuid.uuid4().hex[:8]}" for _ in range(600)]
    df_payout['weather_at_trigger'] = 'Cloudy'
    df_payout['traffic_at_trigger'] = 'Medium'
    df_payout['auto_initiated'] = True
    df_payout['admin_reviewed'] = False
    payout_path = os.path.join(OUT_DIR, "skysure_payout_history.csv")
    df_payout.to_csv(payout_path, index=False)

    # 7. LIVE FEED SEED
    df_live = df.sample(500).copy()
    df_live['feed_timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    df_live['trigger_score_live'] = np.random.uniform(0.1, 0.9, 500)
    df_live['trigger_result_live'] = np.where(df_live['trigger_score_live'] > 0.8, "FULL", "NONE")
    df_live.to_csv(os.path.join(OUT_DIR, "skysure_live_feed_seed.csv"), index=False)

    print("Master Datasets (Master, ML, Payout, Live) Generated successfully.")

if __name__ == "__main__":
    generate_v4_master()
