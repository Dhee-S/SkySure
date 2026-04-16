import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
if not service_account_path:
    # Fallback to absolute path from current view
    service_account_path = 'd:/Code/Guidwire/gigguard/data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json'

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

def export_riders():
    print("Fetching riders from Firestore...")
    riders_ref = db.collection('riders')
    docs = riders_ref.stream()
    
    riders_data = []
    for doc in docs:
        data = doc.to_dict()
        data['firestore_id'] = doc.id
        riders_data.append(data)
    
    df = pd.DataFrame(riders_data)
    output_path = 'd:/Code/Guidwire/gigguard/data/firestore_riders_backup.csv'
    df.to_csv(output_path, index=False)
    print(f"Exported {len(df)} riders to {output_path}")

if __name__ == "__main__":
    export_riders()
