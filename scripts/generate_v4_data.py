import pandas as pd
import numpy as np
import uuid
import random
from datetime import datetime, timedelta

def load_data(filepath):
    print(f"Loading {filepath}...")
    return pd.read_csv(filepath)

def break_persona_lock(df):
    print("Breaking persona-tier 1:1 lock...")
    def get_tier(p):
        if p == 'Full-Timer':
            return np.random.choice(['Pro', 'Standard', 'Basic'], p=[0.5, 0.35, 0.15])
        elif p == 'Gig-Pro':
            return np.random.choice(['Standard', 'Pro', 'Basic'], p=[0.55, 0.25, 0.20])
        elif p == 'Student-Flex':
            return np.random.choice(['Basic', 'Standard', 'Pro'], p=[0.70, 0.25, 0.05])
        else: # including High-Risk
            return np.random.choice(['Basic', 'Probationary'], p=[0.8, 0.2])
    
    df['tier'] = df['persona_type'].apply(get_tier)
    df['plan_selected'] = df['tier'].str.lower()
    return df

def align_payouts(df):
    print("Aligning payouts to realistic INR values...")
    tier_cap = {'Basic': 800, 'Standard': 1200, 'Pro': 2500, 'Probationary': 500}
    df['predicted_payout'] = np.minimum(
        df['daily_baseline'] * 0.70, 
        df['tier'].map(tier_cap).fillna(1000)
    ).round(2)
    return df

def generate_rider_profile_fields(df):
    print("Generating Table 1: Rider Profile fields...")
    df['user_id'] = [f"usr_{uuid.uuid4().hex[:8]}" for _ in range(len(df))]
    df['email'] = [f"rider_{uid}@example.com" for uid in df['user_id']]
    df['phone_number'] = [f"+91-{np.random.randint(60000, 99999)}{np.random.randint(10000, 99999)}" for _ in range(len(df))]
    df['oauth_provider'] = np.random.choice(['google', 'email'], size=len(df), p=[0.8, 0.2])
    df['account_status'] = np.random.choice(['active', 'pending_kyc', 'suspended'], size=len(df), p=[0.85, 0.10, 0.05])
    
    base_date = datetime.strptime("2025-11-14", "%Y-%m-%d")
    df['registration_date'] = [ (base_date - timedelta(days=np.random.randint(0, 365))).strftime("%Y-%m-%d") for _ in range(len(df)) ]
    
    df['kyc_status'] = np.where(df['account_status'] == 'pending_kyc', 'pending', 
                                np.where(df['account_status'] == 'suspended', 'rejected', 'verified'))
                                
    df['vehicle_type'] = np.random.choice(['bike', 'scooter', 'ev_bike', 'bicycle'], size=len(df), p=[0.5, 0.3, 0.15, 0.05])
    df['partner_app'] = np.random.choice(['zomato', 'swiggy', 'dunzo', 'zepto'], size=len(df), p=[0.4, 0.4, 0.1, 0.1])
    df['app_id'] = [f"{app[:4]}_{uuid.uuid4().hex[:6]}" for app in df['partner_app']]
    df['zone'] = df['city'] + "-" + np.random.choice(['North', 'South', 'East', 'West', 'Central'], size=len(df))
    df['avg_daily_salary_self_reported'] = (df['daily_baseline'] * np.random.uniform(0.9, 1.2, size=len(df))).round(2)
    df['bank_account_linked'] = np.random.choice([True, False], size=len(df), p=[0.9, 0.1])
    df['upi_id'] = [ f"{uid}@ybl" if linked else "" for uid, linked in zip(df['user_id'], df['bank_account_linked']) ]
    return df

def generate_policy_fields(df):
    print("Generating Table 2: Policy & Payment fields...")
    df['policy_id'] = [f"POL-TN-2026-{str(i).zfill(6)}" for i in range(len(df))]
    df['policy_start_date'] = [ (datetime.strptime(rd, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d") for rd in df['registration_date'] ]
    df['policy_end_date'] = [ (datetime.strptime(sd, "%Y-%m-%d") + timedelta(days=90)).strftime("%Y-%m-%d") for sd in df['policy_start_date'] ]
    
    df['premium_payment_status'] = np.random.choice(['paid', 'pending', 'failed', 'waived'], size=len(df), p=[0.8, 0.1, 0.05, 0.05])
    df['payment_method'] = np.random.choice(['upi', 'netbanking', 'auto_deduct'], size=len(df), p=[0.6, 0.2, 0.2])
    df['payment_gateway_txn_id'] = [f"pay_{uuid.uuid4().hex[:12]}" if st == 'paid' else "" for st in df['premium_payment_status']]
    
    df['payout_wallet_balance'] = np.where(np.random.rand(len(df)) > 0.7, np.random.uniform(100, 1500, size=len(df)), 0).round(2)
    df['payout_status'] = np.random.choice(['approved', 'pending', 'denied', 'investigating'], size=len(df), p=[0.6, 0.2, 0.15, 0.05])
    df['payout_txn_id'] = [f"pyt_{uuid.uuid4().hex[:12]}" if st == 'approved' else "" for st in df['payout_status']]
    df['payout_timestamp'] = np.where(df['payout_status'] == 'approved', "2026-04-07 14:32:11", "")
    
    df['total_premiums_paid'] = (df['weekly_premium'] * np.random.randint(1, 24, size=len(df))).round(2)
    df['total_payouts_received'] = np.where(np.random.rand(len(df)) > 0.5, df['predicted_payout'] * np.random.randint(1, 5, size=len(df)), 0).round(2)
    df['consecutive_active_weeks'] = np.random.randint(0, 52, size=len(df))
    return df

def generate_ml_fields(df):
    print("Generating Table 3: ML Training fields...")
    df['is_fraud'] = ((df['fraud_probability'] > 0.7) | (df['ring_score'] > 0.7) | (df['risk_reason'].str.contains('Clustering', na=False))).astype(int)
    df['fraud_confirmed_by_admin'] = np.where(df['is_fraud'] == 1, np.random.choice([True, False], p=[0.9, 0.1]), False)
    
    df['claim_history_count'] = np.where(df['total_payouts_received'] > 0, np.random.randint(1, 10, size=len(df)), 0)
    
    today = datetime.strptime("2026-04-15", "%Y-%m-%d")
    df['days_since_registration'] = [ (today - datetime.strptime(d, "%Y-%m-%d")).days for d in df['registration_date'] ]
    
    # Mocking aggregated features
    df['zone_risk_index'] = np.random.uniform(0.05, 0.5, size=len(df)).round(2)
    df['peer_group_avg_efficiency'] = np.random.uniform(0.6, 0.85, size=len(df)).round(2)
    
    # Calculate velocity score from delivered orders and assumed session time in minutes
    session_minutes = df['session_time_hhmm'].apply(lambda x: int(str(x).split(':')[0])*60 + int(str(x).split(':')[1]) if ':' in str(x) else 360)
    session_minutes = session_minutes.replace(0, 360) # Avoid division by zero
    df['velocity_score'] = (df['delivered_orders'] / session_minutes).round(3)
    
    df['previous_payout_count'] = np.where(df['claim_history_count'] > 0, np.random.randint(0, 3, size=len(df)), 0)
    df['consecutive_claim_days'] = np.random.choice([0, 1, 2, 3], size=len(df), p=[0.8, 0.1, 0.05, 0.05])
    
    df['income_drop_pct'] = np.maximum(0, (df['daily_baseline'] - (df['past_week_earnings']/7)) / df['daily_baseline']).fillna(0).round(2)
    df['session_drop_pct'] = np.maximum(0, np.random.normal(0.1, 0.15, size=len(df))).round(2)
    
    vehicle_risk = {'bike': 1.0, 'scooter': 0.9, 'bicycle': 0.7, 'ev_bike': 0.85}
    df['vehicle_risk_factor'] = df['vehicle_type'].map(vehicle_risk)
    
    weather_severity = {'Sunny': 0.0, 'Cloudy': 0.2, 'Windy': 0.5, 'Rainy': 0.75, 'Fog': 0.8, 'Stormy': 1.0, 'Sandstorms': 0.9}
    df['weather_severity_score'] = df['current_weather'].map(weather_severity).fillna(0)
    
    traffic_severity = {'Low': 0.0, 'Medium': 0.3, 'High': 0.7, 'Jam': 1.0}
    df['traffic_severity_score'] = df['traffic_density'].map(traffic_severity).fillna(0)
    
    return df

def generate_live_feed(df):
    print("Generating Table 4: Live Feed Seed...")
    # Just grab 500 rows
    sample = df.sample(500).copy()
    sample['feed_timestamp'] = [(datetime.now() - timedelta(minutes=np.random.randint(0, 60))).strftime("%Y-%m-%d %H:%M:%S") for _ in range(500)]
    
    # coords are like "13.0827,80.2707"
    lat_lon = sample['coordinates'].str.split(',', expand=True)
    sample['live_gps_lat'] = pd.to_numeric(lat_lon[0], errors='coerce') + np.random.uniform(-0.01, 0.01, size=500)
    sample['live_gps_lon'] = pd.to_numeric(lat_lon[1], errors='coerce') + np.random.uniform(-0.01, 0.01, size=500)
    
    sample['live_order_count'] = sample['delivered_orders'] // 2
    sample['live_session_active'] = np.random.choice([True, False], size=500, p=[0.7, 0.3])
    sample['trigger_check_timestamp'] = [(datetime.strptime(t, "%Y-%m-%d %H:%M:%S") + timedelta(seconds=2)).strftime("%Y-%m-%d %H:%M:%S") for t in sample['feed_timestamp']]
    
    sample['trigger_score_live'] = np.random.uniform(0.1, 0.95, size=500).round(2)
    sample['trigger_result_live'] = np.where(sample['trigger_score_live'] > 0.75, "FULL", np.where(sample['trigger_score_live'] > 0.4, "PARTIAL_50", "NONE"))
    sample['payout_auto_initiated'] = (sample['trigger_result_live'] == "FULL")
    sample['live_weather_api_result'] = sample['current_weather']
    sample['live_traffic_api_result'] = sample['traffic_density']
    
    cols = ['rider_id', 'feed_timestamp', 'live_gps_lat', 'live_gps_lon', 'live_order_count', 'live_session_active', 
            'trigger_check_timestamp', 'trigger_score_live', 'trigger_result_live', 'payout_auto_initiated', 
            'live_weather_api_result', 'live_traffic_api_result']
    return sample[cols]

def generate_payout_history(df):
    print("Generating Payout History Seed...")
    sample = df[df['total_payouts_received'] > 0].sample(min(400, len(df[df['total_payouts_received'] > 0]))).copy()
    
    history_events = []
    for _, row in sample.iterrows():
        payouts_count = np.random.randint(1, 4)
        for i in range(payouts_count):
            history_events.append({
                'event_id': str(uuid.uuid4()),
                'rider_id': row['rider_id'],
                'feed_timestamp': (datetime.strptime(row['payout_timestamp'] or "2026-04-07 14:32:11", "%Y-%m-%d %H:%M:%S") - timedelta(days=i*10)).strftime("%Y-%m-%d %H:%M:%S"),
                'trigger_score': np.random.uniform(0.5, 0.95),
                'fraud_score': row['fraud_probability'],
                'ml_fraud_prob': np.random.uniform(0.01, 0.4),
                'fraud_status': 'CLEAN',
                'payout_amount': row['predicted_payout'],
                'payout_status': 'APPROVED',
                'payout_txn_id': f"pyt_{uuid.uuid4().hex[:12]}",
                'weather_at_trigger': row['current_weather'],
                'traffic_at_trigger': row['traffic_density'],
                'auto_initiated': True,
                'admin_reviewed': False
            })
            
    return pd.DataFrame(history_events)

def main():
    input_file = r"d:\Code\Guidwire\gigguard\data\skysure_v3_final_cleaned.csv"
    out_dir = r"d:\Code\Guidwire\gigguard\data"
    
    df = load_data(input_file)
    df = break_persona_lock(df)
    df = align_payouts(df)
    
    df = generate_rider_profile_fields(df)
    df = generate_policy_fields(df)
    df = generate_ml_fields(df)
    
    # Save the huge V4 dataset which has everything
    v4_path = f"{out_dir}/skysure_riders_v4.csv"
    df.to_csv(v4_path, index=False)
    print(f"Saved {v4_path}")
    
    # Save ML Training subset
    ml_cols = ['rider_id', 'is_fraud', 'earning_efficiency', 'delivered_orders', 'past_week_earnings', 
               'fraud_probability', 'ring_score', 'trust_score', 'daily_baseline', 'velocity_score', 
               'income_drop_pct', 'session_drop_pct', 'zone_risk_index', 'days_since_registration',
               'persona_type', 'tier', 'city', 'current_weather', 'traffic_density', 'vehicle_type',
               'order_volume_collapse', 'platform_app_downtime', 'probationary_tier', 'bank_account_linked',
               'consecutive_active_weeks', 'avg_daily_salary_self_reported', 'vehicle_risk_factor',
               'weather_severity_score', 'traffic_severity_score']
    ml_df = df[[c for c in ml_cols if c in df.columns]].copy()
    ml_path = f"{out_dir}/skysure_ml_training.csv"
    ml_df.to_csv(ml_path, index=False)
    print(f"Saved {ml_path}")
    
    # Live Feed Seed
    live_df = generate_live_feed(df)
    live_path = f"{out_dir}/skysure_live_feed_seed.csv"
    live_df.to_csv(live_path, index=False)
    print(f"Saved {live_path}")
    
    # Payout history Seed
    payout_df = generate_payout_history(df)
    payout_path = f"{out_dir}/skysure_payout_history.csv"
    payout_df.to_csv(payout_path, index=False)
    print(f"Saved {payout_path}")
    
if __name__ == '__main__':
    main()
