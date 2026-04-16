import sys
import os

# Add api-python to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api-python'))

from src.firestore_client import db
import json

def extract_samples():
    data = {}
    
    # Riders
    riders = db.collection("rider_profiles").limit(3).stream()
    data["riders"] = [doc.to_dict() for doc in riders]
    
    # Events
    events = db.collection("payout_events").limit(3).stream()
    data["events"] = [doc.to_dict() for doc in events]
    
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    extract_samples()
