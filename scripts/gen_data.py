import csv
import json
import os

csv_file = r'd:\Code\Guidwire\gigguard\data\pre-final_dataset.csv'
json_file = r'd:\Code\Guidwire\gigguard\frontend\src\data\riders.json'

os.makedirs(os.path.dirname(json_file), exist_ok=True)

riders = []
limit = 200

try:
    with open(csv_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= limit:
                break
            
            # Basic Mapping
            rider = {
                "id": row["rider_id"],
                "name": row["name"],
                "persona": row["persona_type"],
                "tier": row["tier"],
                "city": row["City"],
                "stats": {
                    "sessionTime": row["session_time"],
                    "efficiency": float(row["earning_efficiency"]),
                    "orders": {
                        "delivered": float(row["delivered_orders"]),
                        "undelivered": float(row["undelivered_orders"])
                    },
                    "earnings": float(row["past_week_earnings"]),
                    "premium": float(row["weekly_premium"])
                },
                "environment": {
                    "weather": row["current_weather"],
                    "traffic": row["traffic_density"]
                },
                "location": {
                    "restaurant": [float(row["Restaurant_latitude"]), float(row["Restaurant_longitude"])],
                    "delivery": [float(row["Delivery_location_latitude"]), float(row["Delivery_location_longitude"])]
                },
                "risk": {
                    "isPayoutEligible": row["is_payout_eligible"] == '1',
                    "predictedPayout": float(row["predicted_payout"]),
                    "fraudProbability": float(row["fraud_probability"]),
                    "ringScore": float(row["ring_score"]),
                    "level": row["risk_level"],
                    "reason": row["risk_reason"]
                }
            }
            riders.append(rider)

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(riders, f, indent=2)

    print(f"Successfully converted {len(riders)} riders to JSON.")

except Exception as e:
    print(f"Error: {e}")
