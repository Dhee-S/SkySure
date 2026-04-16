import os
import random
import joblib
import numpy as np
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from src.firestore_client import db, firestore
from src.middleware.auth import verify_token

router = APIRouter()

# Load ML Model with Fallback
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "fraud_model.joblib")
model = None

def predict_fraud_heuristic(features):
    """Fallback logic if ML model is unavailable"""
    # Feature map based on standard indices:
    # 0: efficiency, 1: velocity, 2: drop, 3: ring, 4: trust, 5: fraud_prob,
    # 6: weather, 7: traffic, 8: days, 9: risk, 10: bank, 11: orders
    ring_score = features[0][3]
    trust_score = features[0][4]
    weather_sev = features[0][6]
    traffic_sev = features[0][7]
    delivered_orders = features[0][11]

    # Heuristic: High weather/traffic + low trust/orders/ring score
    risk = 0.0
    if ring_score > 0.6: risk += 0.4
    if trust_score < 40: risk += 0.3
    if weather_sev > 0.6 and traffic_sev > 0.6: risk += 0.2
    if delivered_orders < 5: risk += 0.2
    
    return 1 if risk > 0.7 else 0, min(1.0, risk)

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print(f"ML Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading ML model: {e}. Using heuristic fallback.")
else:
    print("ML Model file not found. Using heuristic fallback.")

@router.post("/simulation/batch")
async def run_simulation_batch(count: int = 5, user = Depends(verify_token)):
    """Runs a live simulation batch: updates random riders with new weather/traffic signals and ML fraud checks"""
    try:
        # 1. Fetch random riders from Firestore
        riders_ref = db.collection("rider_profiles").limit(count)
        docs = riders_ref.stream()
        riders = [doc.to_dict() for doc in docs]
        
        if not riders:
            return {"status": "success", "processed": 0, "message": "No riders found"}
            
        results = []
        for rider in riders:
            # 2. Real-time Signals
            weather = random.choice(["Sunny", "Cloudy", "Rainy", "Stormy"])
            traffic = random.choice(["Low", "Medium", "High", "Jam"])
            
            # 3. Trigger Score (Rule-based for payout initiation)
            trigger_score = 0.0
            if weather in ["Rainy", "Stormy"]: trigger_score += 0.45
            if traffic in ["High", "Jam"]: trigger_score += 0.35
            trigger_score += random.uniform(0, 0.2)
            
            outcome = "NONE"
            if trigger_score > 0.8: outcome = "FULL"
            elif trigger_score > 0.45: outcome = "PARTIAL_50"
            
            # 4. ML Fraud Classification (12 Features)
            fraud_status = "CLEAN"
            fraud_prob = 0.0
            
            weather_map = {"Sunny": 0.0, "Cloudy": 0.1, "Rainy": 0.7, "Stormy": 1.0}
            traffic_map = {"Low": 0.0, "Medium": 0.3, "High": 0.7, "Jam": 1.0}
            
            # Features must match the trained model's 18 features (v5):
            features = np.array([[
                float(rider.get("earning_efficiency", 0.85)), # 0
                float(rider.get("velocity_score", 0.03)),     # 1
                float(rider.get("income_drop_pct", 0.05)),    # 2
                float(rider.get("ring_score", 0.2)),          # 3
                float(rider.get("trust_score", 95.0)),        # 4
                float(rider.get("fraud_probability", 0.1)),   # 5
                weather_map.get(weather, 0.0),               # 6
                traffic_map.get(traffic, 0.0),               # 7
                float(rider.get("days_since_reg", 180)),     # 8
                float(rider.get("vehicle_risk_factor", 0.2)),# 9
                int(rider.get("bank_account_linked", 1)),    # 10
                int(rider.get("delivered_orders", 15)),       # 11
                int(rider.get("device_id_count", 1)),        # 12
                int(rider.get("is_modified_app", 0)),        # 13
                float(rider.get("ip_variance_score", 0.05)),  # 14
                float(rider.get("speed_vs_traffic", 1.0)),    # 15
                float(rider.get("cancel_rate_sess", 0.05)),   # 16
                float(rider.get("rating_drop_pct", 0.01))     # 17
            ]])

            if model:
                try:
                    prediction = model.predict(features)[0]
                    fraud_prob = model.predict_proba(features)[0][1]
                    if prediction == 1 or fraud_prob > 0.75:
                        fraud_status = "BLOCK"
                except Exception as e:
                    print(f"Prediction error: {e}. Falling back to heuristic.")
                    prediction, fraud_prob = predict_fraud_heuristic(features)
                    if prediction == 1: fraud_status = "BLOCK"
            else:
                prediction, fraud_prob = predict_fraud_heuristic(features)
                if prediction == 1: fraud_status = "BLOCK"
            
            # 5. Record Event
            event_id = f"evt_{random.randint(100000, 999999)}"
            event = {
                "event_id": event_id,
                "rider_id": rider.get("rider_id", "Unknown"),
                "feed_timestamp": datetime.now().isoformat(),
                "trigger_score": round(trigger_score, 2),
                "fraud_score": round(float(fraud_prob), 2),
                "ml_fraud_prob": round(float(fraud_prob), 2),
                "fraud_status": fraud_status,
                "payout_status": "PENDING" if outcome != "NONE" else "NA",
                "weather_at_trigger": weather,
                "traffic_at_trigger": traffic,
                "payout_amount": 1000 if outcome == "FULL" else (500 if outcome == "PARTIAL_50" else 0),
                "auto_initiated": True,
                "admin_reviewed": False
            }
            
            # 6. Auto-approval logic
            if outcome != "NONE" and fraud_status == "CLEAN":
                event["payout_status"] = "APPROVED"
                event["payout_txn_id"] = f"pyt_sim_{uuid4().hex[:8]}"

            # 7. Persist to Firestore (Multi-Table Sync)
            batch = db.batch()
            event_ref = db.collection("payout_events").document(event_id)
            rider_ref = db.collection("rider_profiles").document(rider.get("id"))
            
            # 7.1. Event Audit
            batch.set(event_ref, event)
            
            # 7.2. Rider Sync (Increment payout_history)
            payout_entry = {
                "amount": event["payout_amount"],
                "status": event["payout_status"].lower(),
                "timestamp": event["feed_timestamp"],
                "id": event_id
            }
            
            # Update trust score based on behavior (Adaptive logic)
            delta = -10 if event["payout_status"] == "APPROVED" else 5
            new_trust = max(0, min(100, float(rider.get("trust_score", 75)) + delta))
            
            batch.update(rider_ref, {
                "payout_history": firestore.ArrayUnion([payout_entry]),
                "trust_score": new_trust
            })
            
            # 7.3. Policy Sync
            if event["payout_status"] == "APPROVED":
                policy_id = f"POL-{event['location'][:2].upper()}-2026-{rider.get('id', 'XXX')[-4:]}"
                policy_ref = db.collection("policies").document(policy_id)
                batch.update(policy_ref, {
                    "total_received": firestore.Increment(event["payout_amount"]),
                    "last_payout": event["feed_timestamp"]
                })

            batch.commit()
            
            # Optional: Log to ML audit log if fraud is detected
            if fraud_status == "BLOCK":
                db.collection("ml_audit_log").add({
                    "event_id": event_id,
                    "rider_id": rider.get("rider_id"),
                    "fraud_prob": fraud_prob,
                    "features": features.tolist(),
                    "timestamp": datetime.now().isoformat()
                })
                
            results.append(event)
            
        return {"status": "success", "processed": len(results), "events": results}
        
    except Exception as e:
        print(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
