import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import os
import math
from datetime import datetime

SERVICE_ACCOUNT_PATH = "d:/Code/Guidwire/gigguard/data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json"
v4_CSV_PATH = "d:/Code/Guidwire/gigguard/data/skysure_riders_v4.csv"
payouts_CSV_PATH = "d:/Code/Guidwire/gigguard/data/skysure_payout_history.csv"

def is_nan(val):
    if isinstance(val, float) and math.isnan(val):
        return True
    return False

def clean_dict(d):
    return {k: v for k, v in d.items() if not is_nan(v) and v is not None}

def seed_db():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Service account missing at {SERVICE_ACCOUNT_PATH}")
        return
        
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    print("Loading V4 dataset for seeding...")
    df = pd.read_csv(v4_CSV_PATH)
    
    # We'll seed 500 riders to stay within free-tier limits/performance
    seed_limit = 500
    df_subset = df.head(seed_limit)
    print(f"Propagating {len(df_subset)} riders into 5 core tables...")
    
    batch = db.batch()
    count = 0
    
    for _, row in df_subset.iterrows():
        user_id = str(row['user_id'])
        rider_id = str(row['rider_id'])
        policy_id = str(row['policy_id'])

        # 1. USERS Table
        user_data = {
            'user_id': user_id,
            'email': row.get('email', f"rider_{user_id}@skysure.ai"),
            'phone_number': row.get('phone_number'),
            'oauth_provider': row.get('oauth_provider', 'google'),
            'role': 'rider',
            'account_status': row.get('account_status', 'active'),
            'created_at': row.get('registration_date', datetime.now().isoformat()),
            'last_login': datetime.now().isoformat()
        }
        batch.set(db.collection('users').document(user_id), clean_dict(user_data))
        
        # 2. RIDER_PROFILES Table
        rider_data = {
            'rider_id': rider_id,
            'user_id': user_id,
            'persona_type': row['persona_type'],
            'vehicle_type': row.get('vehicle_type', 'bike'),
            'partner_app': row.get('partner_app', 'Zomato'),
            'app_id': row.get('app_id'),
            'zone': row.get('zone'),
            'city': row['city'],
            'coordinates': row['coordinates'],
            'kyc_status': row.get('kyc_status', 'verified'),
            'bank_account_upi': row.get('upi_id'),
            'fraud_probability': row.get('fraud_probability', 0.05),
            'trust_score': row.get('trust_score', 8),
            'past_week_earnings': row.get('past_week_earnings', 0),
            'earning_efficiency': row.get('earning_efficiency', 0.8),
            'velocity_score': row.get('velocity_score', 0.05),
            'income_drop_pct': row.get('income_drop_pct', 0),
            'is_fraud': int(row.get('is_fraud', 0))
        }
        batch.set(db.collection('rider_profiles').document(rider_id), clean_dict(rider_data))
        
        # 3. POLICIES Table
        policy_data = {
            'policy_id': policy_id,
            'rider_id': rider_id,
            'plan_selected': row.get('plan_selected', 'standard'),
            'tier': row.get('tier', 'Standard'),
            'weekly_premium': row.get('weekly_premium', 50.0),
            'policy_start_date': row.get('policy_start_date'),
            'policy_end_date': row.get('policy_end_date'),
            'payment_status': row.get('premium_payment_status', 'paid'),
            'consecutive_weeks': row.get('consecutive_active_weeks', 1),
            'total_paid': row.get('total_premiums_paid', 0),
            'total_received': row.get('total_payouts_received', 0)
        }
        batch.set(db.collection('policies').document(policy_id), clean_dict(policy_data))
        
        count += 3
        if count >= 450:
            batch.commit()
            batch = db.batch()
            count = 0
            print(f"Committed batch segment for uid: {user_id}", flush=True)
            
    if count > 0:
        batch.commit()
    
    print("Loading Payout History into table 4...")
    payouts_df = pd.read_csv(payouts_CSV_PATH)
    # Ensure we only seed payouts for the 500 riders we just created
    payouts_df = payouts_df[payouts_df['rider_id'].isin(df_subset['rider_id'])]
    
    batch = db.batch()
    count = 0
    for _, row in payouts_df.iterrows():
        event_id = str(row['event_id'])
        # 4. PAYOUT_EVENTS Table
        payout_data = {
            'event_id': event_id,
            'rider_id': row['rider_id'],
            'feed_timestamp': row['feed_timestamp'],
            'trigger_score': row['trigger_score'],
            'fraud_score': row['fraud_score'],
            'ml_fraud_prob': row['ml_fraud_prob'],
            'fraud_status': row['fraud_status'],
            'payout_amount': row['payout_amount'],
            'payout_status': row['payout_status'],
            'payout_txn_id': row.get('payout_txn_id'),
            'weather_at_trigger': row.get('weather_at_trigger'),
            'traffic_at_trigger': row.get('traffic_at_trigger'),
            'auto_initiated': bool(row.get('auto_initiated', True)),
            'admin_reviewed': bool(row.get('admin_reviewed', False))
        }
        batch.set(db.collection('payout_events').document(event_id), clean_dict(payout_data))
        
        # 5. ML_AUDIT_LOG Table (Only for blocked or high-prob events)
        if payout_data['fraud_status'] == 'BLOCK' or payout_data['ml_fraud_prob'] > 0.7:
            audit_id = f"aud_{event_id[:8]}"
            audit_data = {
                'audit_id': audit_id,
                'rider_id': row['rider_id'],
                'event_timestamp': row['feed_timestamp'],
                'feature_vector': {
                    'efficiency': row.get('earning_efficiency'),
                    'velocity': row.get('velocity_score'),
                    'trust': row.get('trust_score')
                },
                'fraud_prob_output': row['ml_fraud_prob'],
                'decision': 'BLOCK' if payout_data['fraud_status'] == 'BLOCK' else 'REVIEW',
                'admin_confirmed': False,
                'confirmed_fraud': False
            }
            batch.set(db.collection('ml_audit_log').document(audit_id), clean_dict(audit_data))
            count += 1

        count += 1
        if count >= 450:
            batch.commit()
            batch = db.batch()
            count = 0
            
    if count > 0:
        batch.commit()
        
    print("--------------------------------------------------")
    print("SUCCESS: 5 Master Tables Synchronized with Firestore.")
    print(f"Project: guide-wire-22263")
    print("--------------------------------------------------")

if __name__ == "__main__":
    seed_db()
