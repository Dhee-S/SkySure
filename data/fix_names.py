import pandas as pd
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

DATA_DIR = r"d:\Code\Guidwire\gigguard\data"

def add_names_to_csv(filepath):
    print(f"Checking {filepath}...")
    try:
        # Load a few rows to check columns
        df_check = pd.read_csv(filepath, nrows=5)
        
        has_name = any(col.lower() in ['name', 'delivery_person_name', 'rider_name'] for col in df_check.columns)
        has_id = any(col.lower() in ['delivery_person_id', 'id', 'rider_id', 'partner_id'] for col in df_check.columns)
        
        if not has_name and has_id:
            print(f"Adding names to {filepath}...")
            df = pd.read_csv(filepath)
            
            # Find the ID column
            id_col = next(col for col in df.columns if col.lower() in ['delivery_person_id', 'id', 'rider_id', 'partner_id'])
            
            unique_ids = df[id_col].unique()
            id_name_map = {}
            for i, pid in enumerate(unique_ids):
                if pd.isna(pid): continue
                id_name_map[pid] = indian_names[i % len(indian_names)]
            
            # Use 'Delivery_person_Name' if it's a Zomato-style ID, otherwise 'name'
            new_col_name = 'Delivery_person_Name' if 'Delivery_person_ID' in df.columns else 'name'
            df[new_col_name] = df[id_col].map(id_name_map)
            
            df.to_csv(filepath, index=False)
            print(f"Updated {filepath}")
        else:
            if has_name:
                print(f"Skipping {filepath} (Already has name column)")
            else:
                print(f"Skipping {filepath} (No ID column to map to)")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith('.csv'):
                add_names_to_csv(os.path.join(root, file))

if __name__ == "__main__":
    main()
