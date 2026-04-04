import pandas as pd
import numpy as np
import os
import random

# Professional Indian Names List
indian_names = [
    "Aarav Sharma", "Aditi Singh", "Akash Gupta", "Ananya Reddy", "Arjun Verma", 
    "Bhavya Jain", "Chaitanya Iyer", "Deepak Kumar", "Divya Nair", "Esha Malhotra", 
    "Gautam Das", "Ishani Mukherjee", "Karan Joshi", "Kavya Pillai", "Manish Rao", 
    "Meera Kulkarni", "Nikhil Saxena", "Pooja Hegde", "Rahul Bose", "Riya Sen", 
    "Sandeep Menon", "Sneha Kapoor", "Tarun Gill", "Vandana Rao", "Vikram Sethi",
    "Abhishek Bajaj", "Anjali Deshmukh", "Chirag Gandhi", "Deepika Padukone", "Harish Iyer",
    "Jyoti Sharma", "Kiran More", "Lokesh Rahul", "Minal Pathak", "Nitin Gadkari",
    "Priya Mani", "Rajesh Khanna", "Sanjay Dutt", "Trupti Desai", "Varun Dhawan",
    "Amitabh Bachchan", "Bhuvneshwar Kumar", "Chetan Bhagat", "Dinesh Karthik", "Esha Gupta"
]

INPUT_CSV = r"d:\Code\Guidwire\gigguard\data\GigGuard_Phase2_Final.csv"
OUTPUT_CSV = r"d:\Code\Guidwire\gigguard\data\GigGuard_Phase3_Final_Clean.csv"

def finalize_data():
    if not os.path.exists(INPUT_CSV):
        print(f"Error: {INPUT_CSV} not found!")
        return

    print("Loading primary enriched dataset...")
    df = pd.read_csv(INPUT_CSV)
    
    print("\n--- SCHEMA STANDARDIZATION ---")
    # 1. Standardize Identity Attributes
    # Mapping old names to new documented ones
    mapping = {
        'Delivery_person_ID': 'id',
        'Delivery_person_Name': 'name',
        'Delivery_person_Age': 'age',
        'Delivery_person_Ratings': 'customer_rating',
        'Type_of_vehicle': 'vehicleType',
        'Weather_conditions': 'current_weather',
        'Road_traffic_density': 'traffic_density',
        'weekly_premium': 'weekly_premium_inr',
        'estimated_earnings': 'past_week_earnings',
        'ring_score_cluster': 'ring_score_cluster_id',
        'payout_eligible': 'is_payout_eligible_sim'
    }
    
    # Check which columns exist before renaming
    to_rename = {k: v for k, v in mapping.items() if k in df.columns}
    df.rename(columns=to_rename, inplace=True)
    
    # Add alias columns for compatibility
    if 'id' in df.columns:
        df['partner_id'] = df['id']
        df['rider_id'] = df['id']
        
    # Ensure 'name' is populated
    print("Populating missing names...")
    if 'name' in df.columns:
        unique_ids = df['id'].unique()
        id_name_map = {}
        for i, pid in enumerate(unique_ids):
            if pd.isna(pid): continue
            id_name_map[pid] = indian_names[i % len(indian_names)]
            
        # Fill NaNs specifically
        df['name'] = df['id'].map(id_name_map).fillna(df['name'])
    else:
        # Create 'name' if missing
        unique_ids = df['id'].unique()
        id_name_map = {pid: indian_names[i % len(indian_names)] for i, pid in enumerate(unique_ids) if not pd.isna(pid)}
        df['name'] = df['id'].map(id_name_map)

    # 2. Add Tier and Coverage (Documented in agent.md / implementation.md)
    print("Adding Business Tiers (Pro/Standard/Basic)...")
    # Strategy: High-performance riders (high earnings) get 'Pro', low get 'Basic'
    avg_earnings = df['past_week_earnings'].mean()
    def assign_tier(row):
        if row['past_week_earnings'] > avg_earnings * 1.5: return 'Pro'
        if row['past_week_earnings'] > avg_earnings * 0.7: return 'Standard'
        return 'Basic'
    
    df['tier'] = df.apply(assign_tier, axis=1)
    
    # 3. Add Fixed Financial Constants
    df['coverage_amount_inr'] = df['tier'].map({'Pro': 25000, 'Standard': 15000, 'Basic': 5000})
    # Reset weekly_premium_inr based on tier to be consistent with frontend
    df['weekly_premium_inr'] = df['tier'].map({'Pro': 49, 'Standard': 35, 'Basic': 19})
    df['active_policy'] = True
    
    # 4. Fill common missing fields for frontend
    df['city'] = df['City'].fillna('Chennai')
    if 'session_time' in df.columns:
        df['engagement_type'] = np.where(df['session_time'] > 8, 'Full-time', 'Part-time')

    # 5. Add ring_score normalized (from cluster probability)
    if 'fraud_probability' in df.columns:
        df['ring_score'] = df['fraud_probability'] # For semantic clarity in UI
    else:
        df['ring_score'] = 0.1 # Default

    # Ensure no duplicates in (id, Order_Date) to avoid confusion? 
    # Actually, we keep all records but the UI will likely pick the latest or grouped.
    
    # Sort by date for better chronological feed
    if 'Order_Date' in df.columns:
        df['Order_Date'] = pd.to_datetime(df['Order_Date']).dt.date
        df.sort_values('Order_Date', ascending=False, inplace=True)

    print(f"Saving finalized dataset to {OUTPUT_CSV}...")
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Done! Processed {len(df)} records.")
    
if __name__ == "__main__":
    finalize_data()
