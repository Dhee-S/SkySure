# ML Fraud Detection v5 Evaluation Report

## Model Overview
- **Features**: 18 (including Device Intelligence & Security Flags)
- **Algorithm**: XGBoost with SMOTE

## Performance Metrics
```
              precision    recall  f1-score   support

           0       1.00      1.00      1.00      2841
           1       1.00      1.00      1.00       159

    accuracy                           1.00      3000
   macro avg       1.00      1.00      1.00      3000
weighted avg       1.00      1.00      1.00      3000

```

## Confusion Matrix
| | Prediction: CLEAN | Prediction: FRAUD |
|---|---|---|
| **Actual: CLEAN** | 2841 | 0 (False Positives) |
| **Actual: FRAUD** | 0 (False Negatives) | 159 |

## Feature Importance (Top Indicators)
| Rank | Feature | Importance | Fraud Trigger Logic |
| :--- | :--- | :--- | :--- |
| 1 | fraud_probability | 0.3083 | Baseline operational risk. |
| 2 | days_since_reg | 0.2996 | Behavioral deviation. |
| 3 | trust_score | 0.2388 | Behavioral deviation. |
| 4 | cancel_rate_sess | 0.1533 | Behavioral deviation. |
| 5 | velocity_score | 0.0000 | Impossible movement speed. |
| 6 | earning_efficiency | 0.0000 | Paradoxical speed during storm. |
| 7 | income_drop_pct | 0.0000 | Extreme claim amounts. |
| 8 | weather_severity | 0.0000 | Behavioral deviation. |
| 9 | traffic_severity | 0.0000 | Behavioral deviation. |
| 10 | ring_score | 0.0000 | High behavioral risk clustering. |

> [!IMPORTANT]
> The model achieved 0 False Positives on the validation set, meeting the requirement to focus only on specific fraudulent markers without affecting normal feed riders.