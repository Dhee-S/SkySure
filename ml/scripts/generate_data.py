import pandas as pd
import numpy as np
from faker import Faker
import os

fake = Faker()
np.random.seed(42)

def generate_rider_data(num_rows=3000):
    # Tamil Nadu Regions
    cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem']
    
    # Realistic TN Weather Patterns
    tn_weather = {
        'Sunny': 0.40,      # Standard tropical sun
        'Heatwave': 0.15,   # High temperatures in Apr-June
        'Moderate Rain': 0.20,
        'Heavy Rain': 0.15, # Monsoon peaks
        'Cyclone': 0.05,    # Coastal impacts
        'Monsoon Gloom': 0.05
    }
    weather_types = list(tn_weather.keys())
    weather_probs = list(tn_weather.values())
    
    personas = ['Full-Timer', 'Gig-Pro', 'Student-Flex', 'High-Risk']
    vehicle_types = ['bike', 'scooter', 'ev_bike', 'bicycle']
    
    # Target Class distribution
    is_fraud_probs = [0.95, 0.05] # 5% fraud
    
    data = []
    
    for i in range(num_rows):
        rider_id = f"TN_RID_{3000 + i}"
        is_fraud = np.random.choice([0, 1], p=is_fraud_probs)
        
        # Decide persona
        if is_fraud:
            persona = np.random.choice(personas, p=[0.10, 0.10, 0.10, 0.70])
        else:
            persona = np.random.choice(personas, p=[0.40, 0.35, 0.20, 0.05])
            
        city = np.random.choice(cities)
        weather = np.random.choice(weather_types, p=weather_probs)
        
        # STRICT SEPARATION LOGIC
        if is_fraud:
            # Fraudulent markers are heavily exaggerated for clear identification
            is_modified_app = 1 if np.random.random() < 0.85 else 0
            device_id_count = np.random.randint(2, 6) if np.random.random() < 0.75 else 1
            ip_variance_score = np.random.uniform(0.75, 1.0)
            
            # Paradox Efficiency during Heavy Rain/Cyclone
            if weather in ['Heavy Rain', 'Cyclone', 'Heatwave']:
                speed_vs_traffic = np.random.uniform(1.8, 3.5) # Impossible speeds
                earning_efficiency = np.random.uniform(0.9, 1.0)
            else:
                speed_vs_traffic = np.random.uniform(1.2, 2.0)
                earning_efficiency = np.random.uniform(0.7, 0.9)
                
            trust_score = np.random.randint(1, 35)
            velocity_score = np.random.uniform(0.70, 1.0)
            income_drop_pct = np.random.uniform(0.80, 0.98) # High claims
        else:
            # NON-FRAUD LOGIC: NEVER triggers hard technical markers
            is_modified_app = 0
            device_id_count = 1
            ip_variance_score = np.random.uniform(0.0, 0.15)
            
            # Realistic speed in TN traffic
            speed_vs_traffic = np.random.uniform(0.7, 1.05) 
            
            # Efficiency drops during heavy weather for honest riders
            if weather in ['Heavy Rain', 'Cyclone']:
                earning_efficiency = np.random.uniform(0.1, 0.4)
                income_drop_pct = np.random.uniform(0.4, 0.7)
            elif weather == 'Heatwave':
                earning_efficiency = np.random.uniform(0.3, 0.6)
                income_drop_pct = np.random.uniform(0.2, 0.4)
            else:
                earning_efficiency = np.random.uniform(0.6, 0.85)
                income_drop_pct = np.random.uniform(0.0, 0.2)
                
            trust_score = np.random.randint(65, 100)
            velocity_score = np.random.uniform(0.0, 0.35)

        # Common features
        weather_sev_map = {'Sunny': 0.0, 'Heatwave': 0.6, 'Moderate Rain': 0.4, 'Heavy Rain': 0.8, 'Cyclone': 1.0, 'Monsoon Gloom': 0.3}
        weather_severity = weather_sev_map[weather]
        
        traffic_sev = np.random.choice([0.1, 0.4, 0.8, 1.0], p=[0.2, 0.4, 0.3, 0.1]) # Map to Low, Med, High, Jam
        days_since_reg = np.random.randint(5, 100) if is_fraud else np.random.randint(100, 1500)
        delivered_orders = np.random.randint(0, 10) if (is_fraud and weather_severity > 0.5) else np.random.randint(15, 35)
        bank_linked = 1 if not is_fraud else np.random.choice([0, 1], p=[0.8, 0.2])
        
        row = {
            'rider_id': rider_id,
            'is_fraud': is_fraud,
            'city': city,
            'weather': weather,
            'earning_efficiency': round(earning_efficiency, 2),
            'velocity_score': round(velocity_score, 2),
            'income_drop_pct': round(income_drop_pct, 2),
            'ring_score': round(np.random.uniform(0.7, 1.0) if is_fraud else np.random.uniform(0.0, 0.4), 2),
            'trust_score': trust_score,
            'fraud_probability': round(np.random.uniform(0.8, 1.0) if is_fraud else np.random.uniform(0.0, 0.3), 2),
            'weather_severity': weather_severity,
            'traffic_severity': traffic_sev,
            'days_since_reg': days_since_reg,
            'vehicle_risk': round(np.random.uniform(0.5, 0.9) if is_fraud else np.random.uniform(0.0, 0.3), 2),
            'bank_linked': bank_linked,
            'delivered_orders': delivered_orders,
            'device_id_count': device_id_count,
            'is_modified_app': is_modified_app,
            'ip_variance_score': round(ip_variance_score, 2),
            'speed_vs_traffic': round(speed_vs_traffic, 2),
            'cancel_rate_sess': round(np.random.uniform(0.5, 0.9) if is_fraud else np.random.uniform(0.0, 0.2), 2),
            'rating_drop_pct': round(np.random.uniform(0.5, 0.8) if is_fraud else np.random.uniform(0.0, 0.1), 2)
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    # Shuffle for training
    df = df.sample(frac=1).reset_index(drop=True)
    return df

if __name__ == "__main__":
    output_path = "ml/data/skysure_ml_training_project_final.csv"
    print(f"Generating 3000 rows of TN-Region Realism Data...")
    df = generate_rider_data(3000)
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to {output_path}")
    print(f"City distribution:\n{df['city'].value_counts()}")
    print(f"Weather distribution:\n{df['weather'].value_counts()}")
