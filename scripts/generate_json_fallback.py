import pandas as pd
import json
import os

CSV_PATH = r"d:\Code\Guidwire\gigguard\data\skysure_v4_1k.csv"
OUTPUT_PATH = r"d:\Code\Guidwire\gigguard\frontend\src\data\ridersData.json"

def generate_fallback():
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found.")
        return
    
    df = pd.read_csv(CSV_PATH)
    # Take first 50 as fallback
    df_sub = df.head(50)
    
    # Convert to list of dicts, handling NaNs
    data = df_sub.to_dict(orient='records')
    
    # Clean up NaNs for JSON
    clean_data = []
    for row in data:
        clean_row = {k: (None if pd.isna(v) else v) for k, v in row.items()}
        # Add id field for frontend compatibility
        clean_row['id'] = clean_row['rider_id']
        clean_data.append(clean_row)

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(clean_data, f, indent=2)
    
    print(f"Successfully updated {OUTPUT_PATH} with 50 rows from v4 dataset.")

if __name__ == "__main__":
    generate_fallback()
