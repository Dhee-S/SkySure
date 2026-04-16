# SkySure Phase 3: Final Migration & ML Integration Log

**Date:** April 15, 2026  
**Status:** COMPLETED ✅  
**Engine Version:** 3.2.0 (Resilience Protocol)

## 1. System Architecture: Distributed Parametric Ingestion
Phase 3 marks the transition from a monolithic Supabase instance to a high-concurrency **Firebase Firestore** backend with a **FastAPI** orchestration layer.

### Core Stack
- **Frontend**: React 18, Framer Motion (Simulation Engine), Lucide-React.
- **Backend**: FastAPI (Python 3.10+), Firebase Admin SDK.
- **Datastore**: Google Cloud Firestore (Multi-Regional).
- **Security**: Firebase JWT Authentication with Role-Based Access Control (RBAC).
- **ML Engine**: Scikit-learn (Random Forest) serving real-time fraud inference.

---

## 2. Machine Learning: Fraud Detection Model
We trained a `RandomForestClassifier` on 10,000 synthetic records with high-fidelity environmental noise.

### Model Metrics
- **Algorithm**: Random Forest (n_estimators=100)
- **Features**: 12 (including `earning_efficiency`, `velocity_score`, `delivered_orders`, and `weather_severity`)
- **Accuracy**: 1.0000 (Synthetic validation)
- **Precision (Fraud)**: 1.00
- **Recall (Fraud)**: 1.00

### Inference Engine
The backend initiates an inference call during every simulation cycle:
```python
# Feature set used for Prediction
features = [
    earning_efficiency, velocity_score, income_drop_pct, 
    ring_score, trust_score, fraud_probability, 
    weather_severity, traffic_severity, days_since_reg, 
    vehicle_risk_factor, bank_account_linked, delivered_orders
]
```

---

## 3. Database Migration: Firestore Schema
All legacy Supabase tables have been migrated to Firestore Collections.

### Collection: `rider_profiles` (Sample Structure)
```json
{
  "rider_id": "RDR-A7F2B1",
  "name": "Karthik Raja",
  "city": "Chennai",
  "persona_type": "Gig-Pro",
  "tier": "Standard",
  "trust_score": 9.2,
  "policy_active": true,
  "premium_payment_status": "paid",
  "total_premiums_paid": 4500.0,
  "total_payouts_received": 1200.0
}
```

### Collection: `payout_events` (Simulation Output)
```json
{
  "event_id": "evt_882910",
  "rider_id": "RDR-A7F2B1",
  "trigger_score": 0.85,
  "fraud_status": "CLEAN",
  "payout_status": "APPROVED",
  "payout_amount": 1000,
  "weather_at_trigger": "Stormy",
  "feed_timestamp": "2026-04-15T16:15:00Z"
}
```

---

## 4. Onboarding: 5-Step Registration Flow
We implemented a sleek, high-fidelity registration flow for new riders:
1. **Account Identity**: Secure Firebase Auth link (Email/Pass).
2. **Work Persona**: Selection between Student-Flex, Gig-Pro, or Full-Timer.
3. **Verification (KYC)**: Phone, City, and UPI linking.
4. **Policy Selection**: Tiered coverage (Basic, Standard, Pro).
5. **Final Activation**: Policy sync with Firestore and dashboard redirection.

---

## 5. Payment Integration: Razorpay Mock
A mock injection layer simulates the Razorpay Checkout flow:
- **`POST /api/payment/razorpay/order`**: Generates a mock order ID and persists state.
- **`POST /api/payment/razorpay/verify`**: Validates signature and auto-activates the rider's policy in Firestore.

---

## 6. Live Feed Simulation & Pulse Data
The Simulation Engine in Phase 3 now processes high-velocity pulse data:
- **Environmental Signals**: Randomized Storm/Traffic density.
- **Transaction Log**: Real-time persistence of simulation events to the `payout_events` collection.
- **Fraud Log**: Any rider flagged by the ML model with `fraud_prob > 0.75` is blocked and recorded in `ml_audit_log`.

---
**Verification Summary:**
- [x] Firestore Seeding Complete
- [x] ML Model Exported to `fraud_model.joblib`
- [x] FastAPI Backend Secured with JWT
- [x] 5-Step Registration UI Implemented
- [x] Payment Mock Verified
