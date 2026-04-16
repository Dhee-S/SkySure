import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import os

# Initialize Firestore
cred_path = r"d:\Code\Guidwire\gigguard\data\guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json"
if not os.path.exists(cred_path):
    print("Error: Credentials not found.")
    exit(1)

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

def export_collection_to_csv(collection_name, output_path):
    print(f"Exporting {collection_name}...")
    docs = db.collection(collection_name).stream()
    data = []
    for doc in docs:
        row = doc.to_dict()
        row['id'] = doc.id
        data.append(row)
    
    if data:
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        print(f"Successfully exported {len(data)} records to {output_path}")
    else:
        print(f"No data found in {collection_name}")

if __name__ == "__main__":
    DATA_DIR = r"d:\Code\Guidwire\gigguard\data"
    export_collection_to_csv("payout_events", os.path.join(DATA_DIR, "payout_events_audit.csv"))
    export_collection_to_csv("policies", os.path.join(DATA_DIR, "policies_master.csv"))
    export_collection_to_csv("users", os.path.join(DATA_DIR, "users_registry.csv"))
