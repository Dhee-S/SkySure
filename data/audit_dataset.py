import pandas as pd
import numpy as np

CSV_PATH = "d:/Code/Guidwire/gigguard/data/GigGuard_Phase2_Final.csv"

def audit_dataset():
    print(f"Auditing {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    print("\n--- Row Count ---")
    print(len(df))
    
    print("\n--- Persona Distribution ---")
    print(df['persona_type'].value_counts())
    
    print("\n--- Risk Level Distribution ---")
    print(df['risk_level'].value_counts())
    
    print("\n--- Fraud Probability Statistics ---")
    print(df['fraud_probability'].describe())
    
    print("\n--- Weekly Premium Statistics ---")
    print(df['weekly_premium'].describe())
    
    print("\n--- Payout Eligibility ---")
    print(df['payout_eligible'].value_counts())
    
    # Check for anomalies
    print("\n--- Anomalies ---")
    high_risk_low_fraud = df[(df['risk_level'] == 'High') & (df['fraud_probability'] < 0.5)]
    print(f"High risk but low fraud prob (parametric risk): {len(high_risk_low_fraud)}")
    
    # Sample reasons for high risk
    print("\n--- Sample Risk Reasons (High) ---")
    print(df[df['risk_level'] == 'High']['risk_reason'].head(10).tolist())

if __name__ == "__main__":
    audit_dataset()
