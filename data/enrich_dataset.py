import pandas as pd
import numpy as np
import os

# Paths
INPUT_PATH = r"d:\Code\Guidwire\gigguard\data\pre-final_dataset3.csv"
OUTPUT_PATH = r"d:\Code\Guidwire\gigguard\data\GigGuard_Phase3_Final_Clean.csv"

def run_enrichment():
    print("--- [1/5] LOADING PRE-FINAL DATASET ---")
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found.")
        return
        
    df = pd.read_csv(INPUT_PATH)
    print(f"Loaded {len(df)} rows from {os.path.basename(INPUT_PATH)}.")

    disruptive_conditions = ['Stormy', 'Fog', 'Sandstorms']
    weather_col = 'current_weather'
    traffic_col = 'traffic_density'
    session_col = 'session_time_hhmm'

    print("\n--- [2/5] PERSONA & DATA CORRECTION ---")
    # Cast session time to numeric
    df['session_time'] = pd.to_numeric(df[session_col], errors='coerce').fillna(0)
    
    def classify_persona(row):
        persona = str(row.get('persona_type', 'Standard'))
        if persona == "Student-Flex" or float(row.get('age', 30)) < 25:
             return "Student-Flex"
        if float(row.get('session_time', 0)) > 8:
            return "Full-Timer"
        return persona if persona != 'nan' else "Standard"

    df['persona_type'] = df.apply(classify_persona, axis=1)

    print("\n--- [3/5] ACTUARIAL WEEKLY PRICING ---")
    # P_trigger maps
    weather_p_map = {'Stormy': 0.50, 'Fog': 0.45, 'Sandstorms': 0.40, 'Windy': 0.15, 'Cloudy': 0.10, 'Sunny': 0.05}
    traffic_p_map = {'Jam': 0.33, 'High': 0.20, 'Medium': 0.10, 'Low': 0.05}
    
    df['p_weather'] = df[weather_col].map(weather_p_map).fillna(0.05)
    df['p_traffic'] = df[traffic_col].map(traffic_p_map).fillna(0.05)
    df['p_trigger'] = df['p_weather'] * df['p_traffic']
    
    # Average Payout estimation
    df['avg_payout'] = (df['past_week_earnings'].fillna(5000) / 7) * 0.70
    tier_caps = {"Full-Timer": 2500, "Gig-Pro": 1500, "Student-Flex": 800, "High-Risk-Behavior": 500}
    df['payout_cap'] = df['persona_type'].map(tier_caps).fillna(1000)
    df['avg_payout'] = np.minimum(df['avg_payout'], df['payout_cap'])
    
    city_loading = {'Metropolitian': 1.0, 'Urban': 0.85, 'Semi-Urban': 1.4}
    df['city_loading_factor'] = df['city'].map(city_loading).fillna(1.0)
    
    # Premium = (P_trigger * P_no_fraud * Avg_Payout) / Loss_Ratio
    df['weekly_premium'] = (df['p_trigger'] * 0.85 * df['avg_payout'] / 0.60) * df['city_loading_factor']
    df['weekly_premium'] = np.maximum(df['weekly_premium'], 49)

    print("\n--- [4/5] FRAUD MODEL REBUILD ---")
    df['f1_ring_score'] = np.random.choice([0.15, 0.88], size=len(df), p=[0.95, 0.05])
    df['f2_velocity_score'] = np.where(df['delivered_orders'].fillna(0) > 300, 0.9, 0.1)
    df['f3_efficiency_score'] = np.where((df[weather_col].isin(disruptive_conditions)) & (df['earning_efficiency'] > 0.98), 0.80, 0.1)
    df['f4_pattern_score'] = np.random.choice([0.1, 0.7], size=len(df), p=[0.9, 0.1])

    df['fraud_probability'] = (df['f1_ring_score']*0.35 + df['f2_velocity_score']*0.30 + df['f3_efficiency_score']*0.20 + df['f4_pattern_score']*0.15)
    df['ring_score'] = df['f1_ring_score']

    print("\n--- [5/5] MULTI-SIGNAL TRIGGER SYSTEM ---")
    df['t1_weather'] = df['p_weather'] / 0.50
    df['t2_income_drop'] = np.clip(np.random.normal(0.1, 0.1, size=len(df)), 0, 1)
    df['t3_traffic'] = df[traffic_col].map({'Jam': 1.0, 'High': 0.6, 'Medium': 0.2, 'Low': 0.0}).fillna(0)
    df['t4_session_anomaly'] = np.where(df['session_time'] < 30, 0.8, 0.1)
    df['t5_zone_cluster'] = np.where(df['ring_score'] > 0.5, 0.7, 0.1)

    df['trigger_score'] = (df['t1_weather']*0.35 + df['t2_income_drop']*0.25 + df['t3_traffic']*0.20 + df['t4_session_anomaly']*0.12 + df['t5_zone_cluster']*0.08)
    df['payout_eligible'] = np.where(df['trigger_score'] >= 0.4, 1, 0)
    
    def calc_payout(row):
        if row['trigger_score'] < 0.4: return 0
        m = 0.25 if row['trigger_score'] < 0.6 else (0.5 if row['trigger_score'] < 0.8 else 1.0)
        return row['avg_payout'] * m

    df['predicted_payout'] = df.apply(calc_payout, axis=1)

    print("\n--- [6/5] EXPLAINABILITY ---")
    def gen_reason(row):
        reasons = []
        if row['fraud_probability'] > 0.7: reasons.append("Geospatial Clustering (Fraud Ring)")
        if row['persona_type'] == "High-Risk-Behavior": reasons.append("High Cancellation Rate")
        if row[weather_col] in disruptive_conditions and row[traffic_col] == 'Jam': reasons.append("Systemic Parametric Risk")
        return " | ".join(reasons) if reasons else "Normal Operations"

    df['risk_reason'] = df.apply(gen_reason, axis=1)
    df['risk_level'] = np.where(df['fraud_probability'] > 0.7, 'High', np.where(df['payout_eligible'] == 1, 'Medium', 'Low'))

    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\n[SUCCESS] Final competition dataset saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    run_enrichment()
