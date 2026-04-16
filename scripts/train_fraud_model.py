import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def train_model():
    print("Loading high-fidelity training data...")
    data_path = r"d:\Code\Guidwire\gigguard\data\skysure_ml_training.csv"
    if not os.path.exists(data_path):
        print(f"Error: Training data missing at {data_path}")
        return
        
    df = pd.read_csv(data_path)
    
    # Feature list matching the refactor
    features = [
        'earning_efficiency', 'velocity_score', 'income_drop_pct', 'ring_score', 
        'trust_score', 'fraud_probability', 'weather_severity_score', 
        'traffic_severity_score', 'days_since_reg', 'vehicle_risk_factor',
        'bank_account_linked', 'delivered_orders'
    ]
    target = 'is_fraud'
    
    X = df[features]
    y = df[target]
    
    # Handle missing values just in case
    X = X.fillna(X.mean())
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training Random Forest on {len(X_train)} samples with 12 features...")
    model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model accuracy: {score:.4f}")
    
    # Export model to api-python
    model_dir = r"d:\Code\Guidwire\gigguard\api-python\src\models"
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "fraud_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == "__main__":
    train_model()
