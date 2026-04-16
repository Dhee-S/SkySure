import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import time
import os

# Firebase Config
SERVICE_ACCOUNT_PATH = r"d:\Code\Guidwire\gigguard\data\guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json"
DATA_PATH = r"d:\Code\Guidwire\gigguard\data\skysure_v4_1k.csv"

import uuid

def seed_firestore():
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: Service account not found at {SERVICE_ACCOUNT_PATH}")
        return
    
    if not os.path.exists(DATA_PATH):
        print(f"Error: Data file not found at {DATA_PATH}")
        return

    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    df = pd.read_csv(DATA_PATH)
    total_rows = len(df)
    print(f"Starting seeding of {total_rows} rows into Cloud Firestore...")

    # Batch settings
    batch_size = 50
    current_batch = db.batch()
    count = 0

    for index, row in df.iterrows():
        try:
            rider_id = str(row['rider_id'])
            # Create a clean dict, skipping NaNs
            data = {k: v for k, v in row.to_dict().items() if pd.notnull(v)}
            
            # Add synthetic payout history (embedded)
            data['payout_history'] = [
                {
                    "event_id": f"EVT-{uuid.uuid4().hex[:6].upper()}",
                    "timestamp": "2026-03-28T14:22:11Z",
                    "amount": float(row['weekly_premium'] * 0.8),
                    "status": "approved",
                    "reason": "Parametric Trigger: Precipitation > 12mm"
                }
            ] if row['total_payouts_received'] > 0 else []

            # Set in rider_profiles collection
            rider_ref = db.collection('rider_profiles').document(rider_id)
            current_batch.set(rider_ref, data)
            
            # Also create a user mapping for Auth
            user_id = str(row['user_id'])
            user_ref = db.collection('users').document(user_id)
            user_data = {
                "uid": user_id,
                "email": row['email'],
                "role": "rider",
                "name": row['name'],
                "created_at": firestore.SERVER_TIMESTAMP
            }
            current_batch.set(user_ref, user_data)

            count += 1

            if count % batch_size == 0 or count == total_rows:
                current_batch.commit()
                print(f"Committed {count}/{total_rows} rows...")
                current_batch = db.batch()
                time.sleep(0.5)  # Throttle to avoid rate limits

        except Exception as e:
            print(f"Error at index {index}: {e}")
            # Reset batch if it fails
            current_batch = db.batch()
            continue

    # Add a demo Admin user explicitly
    admin_id = "admin_demo_001"
    admin_ref = db.collection('users').document(admin_id)
    admin_ref.set({
        "uid": admin_id,
        "email": "admin@skysure.com",
        "role": "admin",
        "name": "SkySure Admin",
        "created_at": firestore.SERVER_TIMESTAMP
    })

    print("Firestore Seeding Complete!")

if __name__ == "__main__":
    # Pre-import uuid for the embedded list
    import uuid
    uuid_hex = uuid.uuid4().hex
    seed_firestore()
