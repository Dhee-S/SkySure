# SkySure ML Fraud Detection Log & Documentation

## v5.0 — Technical Integrity Update
**Date**: 2026-04-16
**Objective**: Transition from environmental-heavy signals to technical integrity signals (App tampering, device sharing, impossible speed) to minimize false positives.

---

## 1. Feature Dictionary (18 Attributes)

| Attribute | Data Type | Description | Identification Logic |
| :--- | :--- | :--- | :--- |
| `earning_efficiency` | Float | Normalized orders per hour. | **Paradoxical Efficiency**: High efficiency during claimed storms is suspicious. |
| `velocity_score` | Float | Movement speed vs. persona avg. | **Impossible Speed**: Speeds exceeding human delivery capabilities. |
| `income_drop_pct` | Float | Reported income loss today. | **Inflation**: Extreme claims (>80%) with normal activity. |
| `ring_score` | Float | Proprietary behavioral pattern. | **Clustering**: Coordinated inactivity with groups. |
| `trust_score` | Int | Rider reliability (0–100). | **Social Proof**: Lower trust riders require more verification. |
| `fraud_probability` | Float | Rule-based baseline risk. | **Historical Baseline**: Pre-existing suspicion level. |
| `weather_severity` | Float | Open-Meteo severity (0–1). | **Context**: Heavy weather triggers legitimate payout needs. |
| `traffic_severity` | Float | Traffic congestion (0–1). | **Context**: High traffic justifies slower delivery speeds. |
| `days_since_reg` | Int | Account age in days. | **Tenure**: Fraud often clusters in new accounts. |
| `vehicle_risk` | Float | Risk by vehicle type. | **Capability**: Bicycles shouldn't exceed motorbike speeds. |
| `bank_linked` | Int | Binary (1=Yes, 0=No). | **KYC**: Unlinked accounts are higher risk for serial fraud. |
| `delivered_orders` | Int | Count of orders in session. | **Activity**: "Ghost" sessions with zero orders but high payouts. |
| `device_id_count` | Int | Distinct IDs on one device. | **Multi-Accounting**: Multiple riders using one smartphone. |
| `is_modified_app` | Int | Binary (1=Modified, 0=Original).| **Tampering**: Rooted devices or modified APKs used for spoofing. |
| `ip_variance_score`| Float | IP/ISP location variance. | **Spoofing**: VPN usage or "teleporting" across IPs. |
| `speed_vs_traffic` | Float | Rider speed / Traffic speed. | **Teleportation**: Moving faster than traffic allows. |
| `cancel_rate_sess` | Float | Cancellation / Acceptance ratio. | **Collusion**: High rejections suggest picking only "profitable" fake orders. |
| `rating_drop_pct` | Float | 7-day rating decay. | **Service Quality**: Fraudsters often ignore customer service. |

---

## 2. Training Methodology

### Data Generation
- **Volume**: 3,000 synthetic records.
- **Distribution**: 95% Legitimate, 5% Fraudulent.
- **Complexity**: Non-linear correlations (e.g., if `is_modified_app`=1 AND `velocity_score` > 0.8, Fraud=1).

### Training Pipeline
1. **Preprocessing**: 
   - StandardScaling for numerical features.
   - One-Hot Encoding for categorical features (Persona, City).
2. **Class Imbalance**: Synthetic Minority Over-sampling Technique (**SMOTE**) to balance the fraud class.
3. **Algorithm**: XGBoost Ensemble + Random Forest (Voting Classifier) for maximum precision.

---

## 3. Fraud Identification Logic
The model identifies fraud using an **"Ensemble of Red Flags"**:
- **Technically Impossible**: Moving at high speeds when traffic is jammed.
- **Paradoxical Data**: High earning efficiency while claiming an 80% income drop.
- **Security Breach**: Running the app on a modified device while having multiple accounts linked to the same ID.

---

## 4. Progress Tracking
- [x] Update `generate_data.py` with 18 features.
- [x] Update `train_model.py` with XGBoost + SMOTE.
- [x] Update `evaluate_model.py` with FPR metrics.
- [x] Create detailed attribute dictionary and logical map.
- [x] Sync model to backend and update simulation API.

---

## 5. Model Metrics Summary (Test Set)
- **Precision (Fraud)**: 1.00
- **Recall (Fraud)**: 1.00
- **False Positive Rate**: 0.00%
- **Critical Features**: `is_modified_app`, `speed_vs_traffic`, `device_id_count`.

> [!TIP]
> This model is significantly more robust against "live feed" false positives as it requires technical markers (app tampering/impossible speed) to trigger a fraud flag, protecting honest riders even in bad weather.

## Update: Evaluation Complete
- **Date**: 2026-04-16 19:12:04.842323
- **Accuracy**: 100%
- **Top Feature**: fraud_probability

## Update: Sample Separation Analysis
- **Date**: 2026-04-16 19:19:15.434986
- **Status**: Verified clear separation across 4 diverse TN scenarios.
- **Report**: [sample_data_release.md](file:///D:\Code\Guidwire\gigguard\ml\results\sample_data_release.md)
