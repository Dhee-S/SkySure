import pandas as pd
import json
import os

# Path Configuration
csv_path = r"d:\Code\Guidwire\gigguard\data\GigGuard_Phase3_Final_Clean.csv"
output_path = r"d:\Code\Guidwire\gigguard\frontend\src\data\riders_sample.json"

def extract_samples():
    print(f"Reading {csv_path}...")
    # Load first 1000 records
    df = pd.read_csv(csv_path, nrows=1000)
    
    # Map CSV columns to UI expected names
    # New CSV headers are mostly lowercase already
    df = df.rename(columns={
        'rider_id': 'id',
        'persona_type': 'type'
    })
    
    # Handle NaN values by replacing them with None/null.
    df = df.where(pd.notnull(df), None)
    
    # Fill some missing fields that UI likes
    df['phone'] = '+91 98765 ' + df.index.astype(str).str.zfill(5)
    df['status'] = 'active'
    df['enrolledAt'] = '2024-01-15T10:00:00Z'
    
    # Convert to list of dicts
    records = df.to_dict(orient='records')
    
    # Create directory if not exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Successfully saved {len(records)} records to {output_path}")

if __name__ == "__main__":
    extract_samples()
