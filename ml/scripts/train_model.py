import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
from imblearn.pipeline import Pipeline as ImbPipeline

def train_v5_project_model(data_path, model_path):
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Target and Features
    target = 'is_fraud'
    
    # EXCLUDE Geo and Weather categorical labels to avoid bias (as requested)
    # We keep 'weather_severity' and 'traffic_severity' as numerical proxies
    dropped_cols = [target, 'rider_id', 'city', 'weather']
    X = df.drop(columns=dropped_cols)
    y = df[target]
    
    print(f"Training on {len(X.columns)} features: {list(X.columns)}")
    
    # Identify categorical vs numerical for preprocessing
    # In v5, most are numerical. 'bank_linked', 'is_modified_app' are already binary ints.
    numerical_cols = X.columns.tolist()
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Pipeline: Scale -> SMOTE -> XGBoost
    pipeline = ImbPipeline(steps=[
        ('scaler', StandardScaler()),
        ('smote', SMOTE(random_state=42)),
        ('classifier', XGBClassifier(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        ))
    ])
    
    print("Fitting specialized fraud detection model...")
    pipeline.fit(X_train, y_train)
    
    print(f"Validating: Train Score: {pipeline.score(X_train, y_train):.4f}, Test Score: {pipeline.score(X_test, y_test):.4f}")
    
    # Save model
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    # Sync to backend
    backend_path = "api-python/src/models/fraud_model.joblib"
    joblib.dump(pipeline, backend_path)
    print(f"Model synced to {backend_path}")

if __name__ == "__main__":
    train_v5_project_model("ml/data/skysure_ml_training_project_final.csv", "ml/models/fraud_model_v4.joblib")
