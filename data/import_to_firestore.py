import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
from tqdm import tqdm

# Path to the enriched CSV
CSV_PATH = "d:/Code/Guidwire/gigguard/data/GigGuard_Phase2_Final.csv"
# Path to the service account
SERVICE_ACCOUNT_PATH = "d:/Code/Guidwire/gigguard/data/guide-wire-22263-firebase-adminsdk-fbsvc-f7755d736a.json"

def import_data():
    # 1. Initialize Firebase
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    # 2. Load the CSV
    print(f"Loading data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    # 3. Handle data types (Firestore doesn't handle NaN well, and we want clean JSON)
    df = df.where(pd.notnull(df), None)
    
    # We will upload a subset for the prototype to avoid hitting limits
    # Let's take the first 1000 records
    subset_df = df.head(1000)
    
    print(f"Importing {len(subset_df)} records to Firestore 'riders' collection...")
    
    batch_size = 500
    for i in range(0, len(subset_df), batch_size):
        batch = db.batch()
        current_chunk = subset_df.iloc[i : i + batch_size]
        
        for index, row in current_chunk.iterrows():
            # Use Delivery_person_ID as the document ID if available, or a unique ID
            doc_id = str(row['Delivery_person_ID']) if row['Delivery_person_ID'] else f"rider_{index}"
            doc_ref = db.collection('riders').document(doc_id)
            
            # Convert row to dict
            data = row.to_dict()
            
            # Ensure types are correct for Firestore (double vs int etc)
            # Remove keys with None values to keep it clean
            data = {k: v for k, v in data.items() if v is not None}
            
            batch.set(doc_ref, data)
            
        print(f"Committing batch {i // batch_size + 1}...")
        batch.commit()

    print("Import completed successfully!")

if __name__ == "__main__":
    if os.path.exists(CSV_PATH) and os.path.exists(SERVICE_ACCOUNT_PATH):
        import_data()
    else:
        print("Required files not found. Check paths.")
