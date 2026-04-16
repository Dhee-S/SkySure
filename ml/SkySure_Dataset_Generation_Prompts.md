# SkySure — Synthetic Dataset Generation Prompts
## Tool: ChatGPT o3 / Claude / Gemini Advanced + Python Code Interpreter
### All prompts are self-contained. Paste each one as a fresh conversation.

---

## WHERE TO GENERATE

Use **ChatGPT with code interpreter (o3 or GPT-4o)** — it can write and execute
Python inline and directly give you a downloadable CSV.

Alternatively paste into **Google Colab** or your own terminal if you have
pandas + faker + scikit-learn installed.

```bash
pip install pandas numpy faker scikit-learn imbalanced-learn
```

---

---

# PROMPT 1 OF 4
## Dataset: `skysure_riders_v4.csv`
### Purpose: Master rider dataset — 2,000 rows, 36 fields
### Use in: Backend API seed data, admin dashboard, rider portal

---

**PASTE THIS ENTIRE BLOCK AS YOUR PROMPT:**

```
You are a data engineer building a synthetic dataset for SkySure, an AI-powered
parametric insurance platform for gig economy delivery riders in Tamil Nadu, India.
Generate a CSV file called skysure_riders_v4.csv with exactly 2000 rows and 36 columns.

====================================================================
SECTION A — CORE REFERENCE (from existing dataset skysure_v3_final_cleaned.csv)
====================================================================

These are the EXACT statistics from the current 2000-row dataset.
Your new dataset must preserve all these distributions precisely.

--- RIDER IDs ---
Format: TN_RID_XXXX where XXXX starts at 3000 (so first row is TN_RID_3000)
All rider_ids must be unique.

--- PERSONA TYPE distribution (strict) ---
Full-Timer   : 782 rows (39.1%)
Gig-Pro      : 603 rows (30.2%)
Student-Flex : 421 rows (21.1%)
High-Risk    : 194 rows (  9.7%)

--- TIER assignment rules (IMPORTANT — break the old 1:1 lock) ---
Full-Timer  → Pro 55%, Standard 30%, Basic 15%
Gig-Pro     → Standard 50%, Pro 30%, Basic 20%
Student-Flex→ Basic 65%, Standard 25%, Pro 10%
High-Risk   → Basic 75%, Standard 20%, Pro 5% (never dominant Pro)
Overall tier split target: Pro ~40%, Standard ~32%, Basic ~28%

--- CITY distribution ---
Trichy     : 430 rows (21.5%)
Madurai    : 416 rows (20.8%)
Chennai    : 406 rows (20.3%)
Coimbatore : 381 rows (19.0%)
Salem      : 367 rows (18.4%)

--- COORDINATES (city-anchored bounding boxes — must be inside these) ---
Chennai    : lat 13.0427–13.1227, lon 80.2309–80.3105
Trichy     : lat 10.7506–10.8299, lon 78.6648–78.7443
Madurai    : lat  9.8855– 9.9650, lon 78.0800–78.1591
Coimbatore : lat 10.9769–11.0567, lon 76.9161–76.9956
Salem      : lat 11.6243–11.7043, lon 78.1063–78.1859
Format: "lat,lon" as string with 4 decimal places e.g. "13.0812,80.2699"
Each rider gets a unique coordinate within their city's bounding box.

--- ORDER DATE ---
Random dates between 2026-05-01 and 2026-05-31. Format: YYYY-MM-DD.

--- SESSION TIME by persona (HH:MM format, 24-hour) ---
Full-Timer   : mean 498 min, std 57 min, range 400–598 min
Gig-Pro      : mean 319 min, std 47 min, range 240–399 min
Student-Flex : mean  60 min, std 18 min, range  30– 90 min
High-Risk    : mean 300 min, std 107 min, range 120–495 min
Convert total minutes to HH:MM format. Examples: 497 min → "08:17", 62 min → "01:02"

--- EARNING EFFICIENCY ---
Overall: mean=0.7546, std=0.1764, min=0.11, max=1.00
By persona:
  Full-Timer  : 0.72–1.00, mean ~0.85
  Gig-Pro     : 0.63–1.00, mean ~0.75
  Student-Flex: 0.65–1.00, mean ~0.88 (part-time, focused)
  High-Risk   : 0.11–0.75, mean ~0.45 (low efficiency defines this group)
Use truncated normal distributions per persona. Round to 2 decimal places.

--- DELIVERED ORDERS by persona ---
Full-Timer  : mean 19.7, std 3.4, range 13–29
Gig-Pro     : mean 10.3, std 1.9, range 6–15
Student-Flex: mean  5.0, std 2.0, range 2–8
High-Risk   : mean 10.9, std 4.5, range 3–22
Round to integer.

--- PAST WEEK EARNINGS by persona (INR) ---
Full-Timer  : mean 5519, std 956,  range 3640–8120
Gig-Pro     : mean 2877, std 522,  range 1680–4200
Student-Flex: mean  928, std 352,  range  280–1960
High-Risk   : mean 3054, std 1262, range  840–6160
Round to nearest 40 (multiples of 40 only, like the existing data).

--- WEEKLY PREMIUM by tier+persona (INR) ---
Full-Timer+Pro     : mean 86.15, std 16.25, range 54.6–141.12
Gig-Pro+Standard   : mean 30.03, std  6.06, range 16.8–47.04
Student-Flex+Basic : mean  4.82, std  1.87, range 1.4–10.08
High-Risk+Basic    : mean 71.15, std 29.68, range 18.9–166.32
For mixed tiers (new in v4), compute: weekly_premium = past_week_earnings * premium_rate
  Pro rate: 1.5–1.8% of weekly earnings
  Standard rate: 1.0–1.2% of weekly earnings
  Basic rate: 0.5–2.7% of weekly earnings (wide due to High-Risk loading)
Round to 2 decimal places.

--- CURRENT WEATHER distribution ---
Sunny   : 50.7%
Cloudy  : 28.9%
Rainy   : 15.4%
Stormy  :  5.1%
Distribute per city (slight variation allowed ±3%).

--- TRAFFIC DENSITY distribution ---
Medium : 49.4%
Low    : 31.6%
High   : 19.0%
Traffic and weather are weakly correlated:
  Stormy/Rainy → more likely High traffic (30%) than Sunny (15%)

--- FRAUD PROBABILITY ---
For normal riders (95%): mean=0.2583, std=0.1708, min=0.05, max=0.40
  Use beta distribution skewed low. Most riders between 0.10–0.35.
For fraud riders (5% = 100 riders): mean=0.87, std=0.04, range=0.80–0.95
Round to 2 decimal places.

--- RING SCORE ---
Correlated with fraud_probability but not identical (correlation ~0.57).
For normal riders: mean=0.325, std=0.167, range=0.10–0.50
For fraud riders: mean=0.88, std=0.07, range=0.75–0.98
Add gaussian noise to make ring_score different from fraud_probability.
Round to 2 decimal places.

--- PREDICTED PAYOUT (INR) — FIXED FROM v3 ---
v3 had wrong values (mean ₹49). v4 must use this formula:
  daily_baseline = past_week_earnings / 7
  raw_payout = daily_baseline * 0.70
  tier_cap = {Pro: 2500, Standard: 1200, Basic: 800}
  predicted_payout = min(raw_payout, tier_cap[tier])

Payout is only > 0 when a disruption occurs. Apply this rule:
  If current_weather in [Stormy, Rainy] AND traffic_density = High: payout = predicted_payout
  If current_weather = Stormy AND traffic_density = Medium: payout = predicted_payout * 0.70
  If current_weather = Rainy AND traffic_density = Medium: payout = predicted_payout * 0.50
  Otherwise: payout = predicted_payout * 0.05 (small residual for near-miss events)
Round to 2 decimal places.

--- RISK REASON ---
95% → "Verified: Regular Environmental Disruption"
5%  → "Geospatial Clustering: Coordinated Inactivity Detected"
The 5% fraud cases must align with high fraud_probability (>0.80) rows.

--- ORDER VOLUME COLLAPSE ---
Boolean. True for 9.6% of riders (191 rows).
Correlated with Stormy (40% chance) and Rainy (20% chance) weather.
Not correlated with fraud status.

--- PLATFORM APP DOWNTIME ---
Boolean. True for 15.4% of riders (309 rows).
Independent of weather. Represents technical outages on Zomato/Swiggy platform.

--- PROBATIONARY TIER ---
Boolean. True for exactly all High-Risk persona riders (194 rows).
False for all other personas.

--- TRUST SCORE ---
Integer 1–10. Uniformly distributed (each value appears ~200 times ± 20).
Fraud riders: slightly skewed — mean ~4, more 1–6 values.
Normal riders: mean ~6, uniform.

--- DAILY BASELINE ---
Exactly equal to past_week_earnings / 7.
Round to 1 decimal place.

====================================================================
SECTION B — NEW FIELDS FOR v4 (Phase 3 additions)
====================================================================

--- VEHICLE TYPE ---
bike    : 45%
scooter : 30%
ev_bike : 15%
bicycle : 10%
Full-Timers prefer bike (55%). Student-Flex prefer bicycle (30%).

--- PARTNER APP ---
zomato : 45%
swiggy : 40%
dunzo  : 10%
zepto  : 5%
Distribute randomly, no strong city correlation.

--- APP ID ---
Format: {partner_app_first4}_{8_random_alphanumeric}
Examples: "zmto_9834jd92k", "swgy_k29dk39sl", "dunz_mn38dk29s", "zpto_98sk39dl2"
All app_ids must be unique.

--- ZONE ---
Each city has 4 zones. Assign randomly within city:
Chennai    : Chennai-North, Chennai-South, Chennai-Central, Chennai-West
Trichy     : Trichy-Central, Trichy-East, Trichy-West, Trichy-North
Madurai    : Madurai-East, Madurai-West, Madurai-North, Madurai-South
Coimbatore : Coimbatore-Central, Coimbatore-North, Coimbatore-East, Coimbatore-South
Salem      : Salem-Central, Salem-East, Salem-West, Salem-North

--- VEHICLE RISK FACTOR ---
Float derived from vehicle_type:
  bike    → 1.00
  scooter → 0.90
  ev_bike → 0.85
  bicycle → 0.70
Store as float (e.g. 1.00, 0.90).

--- DAYS SINCE REGISTRATION ---
Integer. Range 30–730 days.
Full-Timer: mean 280, std 150 (more established)
Gig-Pro: mean 180, std 120
Student-Flex: mean 90, std 60 (newer riders)
High-Risk: mean 200, std 130

--- CLAIM HISTORY COUNT ---
Integer. Number of past payouts received.
Normal riders: mean 2.1, range 0–12, right-skewed (most have 0–3)
Fraud riders: mean 7.4, range 4–15 (serial claimants)

--- IS FRAUD (binary ML label) ---
Derive directly:
  1 if risk_reason contains "Clustering" (the 100 fraud riders)
  0 otherwise
This is the TARGET LABEL for ML model training.

--- FRAUD CONFIRMED BY ADMIN ---
Boolean.
For is_fraud=1 rows: 85% True, 15% False (some fraud not yet confirmed)
For is_fraud=0 rows: always False

--- INCOME DROP PCT ---
Float 0.00–1.00. Represents how much below daily_baseline rider earned today.
Normal riders on Sunny/Cloudy: 0.00–0.10 (small variation)
Normal riders on Rainy: 0.10–0.40
Normal riders on Stormy: 0.30–0.70
Fraud riders: 0.50–0.90 (claiming massive drop to get payout)
Round to 2 decimal places.

--- SESSION DROP PCT ---
Float 0.00–1.00.
session_drop_pct = max(0, (persona_avg_session - session_mins) / persona_avg_session)
  Full-Timer persona avg: 498 min
  Gig-Pro persona avg: 319 min
  Student-Flex persona avg: 60 min
  High-Risk persona avg: 300 min
Normal riders: 0.00–0.25 (small session variation)
Fraud riders: 0.50–0.90 (claiming they worked much less than usual)
Round to 2 decimal places.

--- VELOCITY SCORE ---
Float 0.00–1.00. Measures suspicious order delivery speed.
velocity = delivered_orders / session_time_in_minutes
persona_baseline = {Full-Timer: 0.040, Gig-Pro: 0.044, Student-Flex: 0.083, High-Risk: 0.036}
velocity_score = min(1.0, max(0, (velocity - baseline) / baseline))
Normal riders: velocity_score 0.00–0.25
Fraud riders: velocity_score 0.60–1.00 (impossibly fast during claimed storm)
Round to 2 decimal places.

--- ZONE RISK INDEX ---
Float 0.00–1.00. Historical payout trigger rate for rider's zone.
Derive from city + zone:
  Chennai-North: 0.42, Chennai-South: 0.28, Chennai-Central: 0.35, Chennai-West: 0.21
  Trichy-Central: 0.38, Trichy-East: 0.25, Trichy-West: 0.18, Trichy-North: 0.31
  Madurai-East: 0.45, Madurai-West: 0.29, Madurai-North: 0.33, Madurai-South: 0.22
  Coimbatore-Central: 0.40, Coimbatore-North: 0.19, Coimbatore-East: 0.27, Coimbatore-South: 0.35
  Salem-Central: 0.30, Salem-East: 0.24, Salem-West: 0.17, Salem-North: 0.36
Add ±0.02 gaussian noise per rider. Round to 2 decimal places.

--- PREVIOUS PAYOUT COUNT (last 30 days) ---
Integer 0–5.
Normal riders: 80% have 0, 15% have 1, 5% have 2
Fraud riders: 20% have 0, 30% have 2, 30% have 3, 20% have 4–5

--- CONSECUTIVE CLAIM DAYS ---
Integer 0–7.
Normal riders: 90% have 0, 10% have 1–2
Fraud riders: 30% have 3–7

--- WEATHER SEVERITY SCORE ---
Float derived from current_weather:
  Stormy → 1.00
  Rainy  → 0.75
  Cloudy → 0.20
  Sunny  → 0.00

--- TRAFFIC SEVERITY SCORE ---
Float derived from traffic_density:
  High   → 0.70
  Medium → 0.30
  Low    → 0.00

--- PEER GROUP AVG EFFICIENCY ---
Float. Mean earning_efficiency of all riders with same persona_type + city.
Compute this last, after all rows are generated.
Round to 2 decimal places.

--- AVG DAILY SALARY SELF REPORTED ---
Float (INR). What rider entered on registration salary slider.
Correlated with past_week_earnings/7 but with ±15% noise (self-reporting bias).
Full-Timer: range 400–1200
Gig-Pro: range 200–700
Student-Flex: range 50–300
High-Risk: range 100–900 (wide variance)
Round to 0 decimal places.

====================================================================
SECTION C — COLUMN ORDER (exactly 36 columns)
====================================================================

Output columns in this exact order:
1.  rider_id
2.  persona_type
3.  tier
4.  city
5.  zone
6.  Order_Date
7.  session_time_hhmm
8.  earning_efficiency
9.  delivered_orders
10. past_week_earnings
11. daily_baseline
12. weekly_premium
13. current_weather
14. traffic_density
15. coordinates
16. vehicle_type
17. partner_app
18. app_id
19. fraud_probability
20. ring_score
21. predicted_payout
22. risk_reason
23. order_volume_collapse
24. platform_app_downtime
25. probationary_tier
26. trust_score
27. vehicle_risk_factor
28. days_since_registration
29. claim_history_count
30. is_fraud
31. fraud_confirmed_by_admin
32. income_drop_pct
33. session_drop_pct
34. velocity_score
35. zone_risk_index
36. previous_payout_count
37. consecutive_claim_days
38. weather_severity_score
39. traffic_severity_score
40. peer_group_avg_efficiency
41. avg_daily_salary_self_reported

(Yes, 41 columns total — I misstated 36 above. Use all 41.)

====================================================================
SECTION D — VALIDATION CHECKS (run before outputting)
====================================================================

After generating all rows, verify:
1. Total rows = exactly 2000
2. No null values in any column
3. All rider_ids unique (TN_RID_3000 to TN_RID_4999)
4. All coordinates within city bounding boxes
5. daily_baseline = past_week_earnings / 7 (within rounding)
6. is_fraud=1 count = exactly 100 rows
7. probationary_tier=True count = exactly 194 rows (all High-Risk riders)
8. fraud_confirmed_by_admin=True only where is_fraud=1
9. weather_severity_score correctly derived from current_weather
10. traffic_severity_score correctly derived from traffic_density

Output the CSV file directly. Do not truncate. All 2000 rows must be present.
```

---

---

# PROMPT 2 OF 4
## Dataset: `skysure_ml_training.csv`
### Purpose: Train the fraud detection ML model (Random Forest + XGBoost)
### Use in: Model training pipeline, feature importance analysis

---

**PASTE THIS ENTIRE BLOCK AS YOUR PROMPT:**

```
You are a machine learning data engineer. Generate a training dataset for a
fraud detection model for SkySure parametric insurance platform.
File name: skysure_ml_training.csv
Rows: 2000 (reuse the same rider base as skysure_riders_v4.csv but with ML focus)
Target variable: is_fraud (binary: 0 = legitimate, 1 = fraudulent)

This dataset trains a Random Forest + XGBoost ensemble to detect fraud
in real-time when new rider payout requests arrive.

====================================================================
CLASS DISTRIBUTION (critical for SMOTE training)
====================================================================
is_fraud = 0 (legitimate) : 1900 rows (95%)
is_fraud = 1 (fraud)      :  100 rows ( 5%)
The 5% fraud class is the minority — SMOTE will oversample it during training.

====================================================================
FEATURE COLUMNS (23 features + 1 target = 24 total columns)
====================================================================

Use rider_id TN_RID_3000 to TN_RID_4999 (same as v4 dataset).

--- NUMERICAL FEATURES (12) ---

1. earning_efficiency
   Legit riders: beta distribution, mean=0.78, range 0.45–1.00
   Fraud riders: bimodal — either very high (0.85–1.00, efficiency paradox)
                 or very low (0.11–0.30, covering tracks)
   Rule: 60% of fraud riders have efficiency > 0.85 (they are working fast
         while claiming disruption — this is the "efficiency paradox" signal)
   Round to 2 decimal places.

2. delivered_orders
   Legit: follows persona distribution (Full-Timer 13–29, Gig-Pro 6–15,
          Student-Flex 2–8, High-Risk 3–22)
   Fraud: either very high (claiming impossible orders during storm)
          or very low (claiming they couldn't work)
   Round to integer.

3. past_week_earnings (INR)
   Legit: persona-based ranges (Full-Timer 3640–8120, Gig-Pro 1680–4200,
          Student-Flex 280–1960, High-Risk 840–6160)
   Fraud: High-Risk persona dominates fraud class (60% of fraud rows)
          remaining 40% split across other personas
   Multiple of 40. Integer.

4. fraud_probability
   Legit: mean=0.21, std=0.12, range 0.05–0.45 (right-skewed, most below 0.30)
   Fraud: mean=0.87, std=0.04, range 0.80–0.95
   This is a PRE-COMPUTED signal from the rule-based system (input to ML, not the label).

5. ring_score
   Legit: mean=0.28, std=0.14, range 0.10–0.50
   Fraud: mean=0.88, std=0.06, range 0.76–0.98
   Correlated with fraud_probability (ρ ≈ 0.57) but independently generated.

6. trust_score (1–10 integer)
   Legit: uniform distribution, mean ~5.5
   Fraud: skewed low — 70% have trust_score 1–5, mean ~3.8

7. income_drop_pct (0.00–1.00)
   Legit on Sunny/Cloudy: 0.00–0.08 (normal variation)
   Legit on Rainy: 0.10–0.40
   Legit on Stormy: 0.30–0.70
   Fraud: 0.60–0.95 (claiming extreme income drop)
   Round to 2 decimal places.

8. session_drop_pct (0.00–1.00)
   Legit: 0.00–0.20 (normal variation from persona baseline)
   Fraud: 0.50–0.95 (claiming they barely worked)
   Persona baselines: Full-Timer=498min, Gig-Pro=319min, Student-Flex=60min, High-Risk=300min
   Round to 2 decimal places.

9. velocity_score (0.00–1.00)
   Legit: 0.00–0.20 (delivering at normal pace)
   Fraud: 0.60–1.00 (claiming storm but delivery speed is impossibly fast)
   This is the "efficiency paradox" in numeric form.
   Round to 2 decimal places.

10. days_since_registration (integer, 30–730)
    Legit: mean 220, std 160 (wide range)
    Fraud: mean 280, std 130 (slightly more established — built trust first)

11. claim_history_count (integer, 0–15)
    Legit: 85% have 0–3, mean 1.8, max 10
    Fraud: 60% have 5–12, mean 7.8, max 15

12. zone_risk_index (0.00–1.00)
    Same values as v4 dataset (zone-specific, lookup from zone column).
    Fraud riders slightly more likely in high-risk zones (zone_risk_index > 0.35).

--- CATEGORICAL FEATURES (6, will be one-hot encoded during training) ---

13. persona_type
    Legit: Full-Timer 41%, Gig-Pro 32%, Student-Flex 22%, High-Risk 5%
    Fraud: High-Risk 60%, Full-Timer 20%, Gig-Pro 15%, Student-Flex 5%
    (High-Risk persona dominates the fraud class)

14. tier
    Derived from persona (see v4 rules). For fraud: Basic 65%, Standard 25%, Pro 10%.

15. city
    Same 5-city distribution as v4 (no strong city-fraud correlation).

16. current_weather
    Legit: Sunny 51%, Cloudy 29%, Rainy 15%, Stormy 5%
    Fraud: Rainy 45%, Stormy 40%, Cloudy 10%, Sunny 5%
    (Fraud riders concentrate claims during bad weather — this is a key signal)

17. traffic_density
    Legit: Medium 49%, Low 32%, High 19%
    Fraud: High 55%, Medium 35%, Low 10%
    (Fraud riders claim during high traffic to justify income drop)

18. vehicle_type
    bike 45%, scooter 30%, ev_bike 15%, bicycle 10%. No fraud correlation.

--- BOOLEAN FEATURES (5, stored as 0/1 integers for ML) ---

19. order_volume_collapse (0/1)
    Legit: 8% True
    Fraud: 55% True (they claim order collapse to justify income drop)

20. platform_app_downtime (0/1)
    Legit: 15% True (tech issue, no fraud correlation)
    Fraud: 20% True (slightly higher — opportunistic timing)

21. probationary_tier (0/1)
    True for all High-Risk persona. Since High-Risk=60% of fraud, expect 60% True in fraud rows.

22. bank_account_linked (0/1)
    Legit: 88% True (most riders linked bank for payouts)
    Fraud: 70% True (some fraudsters use temporary accounts)

23. previous_claim_this_month (0/1 — derived from previous_payout_count > 0)
    Legit: 20% True
    Fraud: 80% True (repeat claimants)

--- TARGET ---

24. is_fraud (0 or 1)
    0: 1900 rows
    1: 100 rows

====================================================================
INTER-FEATURE CORRELATIONS TO ENFORCE
====================================================================

These correlations make the dataset realistic for ML:

Strong positive (fraud=1 cases):
  fraud_probability ↑ AND ring_score ↑ (ρ ≈ 0.57)
  income_drop_pct ↑ AND session_drop_pct ↑ (ρ ≈ 0.65, both claimed)
  claim_history_count ↑ AND previous_claim_this_month=1 (ρ ≈ 0.70)
  current_weather ∈ {Rainy,Stormy} AND income_drop_pct ↑ (for fraud rows)
  velocity_score ↑ AND income_drop_pct ↑ (efficiency paradox — ρ ≈ 0.58)

Strong negative (legitimate signal):
  earning_efficiency ↑ (0.85+) AND session_drop_pct ↑ (0.60+) → fraud signal
    (Paradox: claiming session drop but delivering efficiently)
  trust_score ↓ (1–3) AND claim_history_count ↑ (8+) → strong fraud signal

Legitimate rider signals:
  earning_efficiency 0.65–0.90 AND income_drop_pct 0.10–0.40 during Rainy → legit claim
  trust_score 7–10 AND claim_history_count 0–2 AND Stormy weather → legit claim

====================================================================
COLUMN ORDER (24 columns total)
====================================================================

1.  rider_id
2.  persona_type
3.  tier
4.  city
5.  current_weather
6.  traffic_density
7.  vehicle_type
8.  earning_efficiency
9.  delivered_orders
10. past_week_earnings
11. fraud_probability
12. ring_score
13. trust_score
14. income_drop_pct
15. session_drop_pct
16. velocity_score
17. days_since_registration
18. claim_history_count
19. zone_risk_index
20. order_volume_collapse
21. platform_app_downtime
22. probationary_tier
23. bank_account_linked
24. previous_claim_this_month
25. is_fraud

====================================================================
VALIDATION BEFORE OUTPUT
====================================================================

1. is_fraud=1 count must be exactly 100
2. No null values
3. fraud_probability > 0.70 for ALL is_fraud=1 rows
4. ring_score > 0.70 for at least 90% of is_fraud=1 rows
5. income_drop_pct > 0.50 for at least 80% of is_fraud=1 rows
6. current_weather ∈ {Rainy, Stormy} for at least 80% of is_fraud=1 rows
7. trust_score mean for is_fraud=1 rows must be < 5.0
8. claim_history_count mean for is_fraud=1 rows must be > 6.0

Print the validation results before outputting the CSV.
Then output all 2000 rows as a downloadable CSV file.
```

---

---

# PROMPT 3 OF 4
## Dataset: `skysure_live_feed_seed.csv`
### Purpose: Power the live feed panel (5–10 riders every 3–6 minutes)
### Use in: Admin dashboard live feed, WebSocket push, APScheduler job

---

**PASTE THIS ENTIRE BLOCK AS YOUR PROMPT:**

```
Generate a CSV file called skysure_live_feed_seed.csv with 500 rows.
This dataset simulates real-time rider activity checks that fire every
3–6 minutes on the SkySure admin dashboard. Each row = one live check event.

The live feed shows 5–10 riders being checked simultaneously.
Use batch_id to group them: batch_id 1–80 (80 batches × ~6 riders avg = 480 rows,
padded to 500 with extra batch entries).

====================================================================
COLUMN SPECIFICATIONS (14 columns)
====================================================================

1. event_id
   Format: EVT_LIVE_{4-digit-number} starting from EVT_LIVE_0001
   All unique.

2. batch_id
   Integer 1–80. Each batch_id groups 5–10 rows (variable).
   Batch sizes: randomly 5, 6, 7, 8, 9, or 10 riders per batch.

3. rider_id
   Reference TN_RID_3000 to TN_RID_4999 (from v4 dataset).
   Each rider can appear in multiple batches (real-time repeat checking).
   Draw randomly from the pool each batch.

4. feed_timestamp
   Datetime. Start: 2026-05-01 08:00:00. End: 2026-05-31 23:59:59.
   Batch intervals: 3–6 minutes apart (random per batch).
   All rows in same batch share the same timestamp.
   Format: YYYY-MM-DD HH:MM:SS

5. live_gps_lat / 6. live_gps_lon
   Rider's real-time GPS. Use their city's bounding box ± 0.005 degrees of noise.
   Same city bounding boxes as v4.

6. live_weather_api_result
   Fetched from Open-Meteo for rider's coordinates.
   Realistic Tamil Nadu May distribution: Sunny 40%, Cloudy 25%, Rainy 25%, Stormy 10%
   (May is pre-monsoon in TN — more rain than April)
   Note: This changes distribution from v4 because it's a different month.

7. live_traffic_api_result
   Values: Low, Medium, High
   Distribution: Low 25%, Medium 50%, High 25%
   Correlated: Rainy/Stormy → High 40% of the time

8. live_order_count
   Orders completed in the current session window (last 30 min).
   Varies 0–8. Mean 3.2.
   During Stormy weather: mean 1.1 (disruption signal)
   During Sunny: mean 4.5

9. live_session_active
   Boolean. True = rider is currently online.
   85% True during 8am–10pm. 30% True during 10pm–8am.

10. trigger_score_live
    Float 0.00–1.00. Computed from weather+traffic+order signals.
    weather_weight: Stormy=1.0, Rainy=0.75, Cloudy=0.20, Sunny=0.0
    traffic_weight: High=0.70, Medium=0.30, Low=0.00
    order_weight: (4 - live_order_count) / 4 clamped 0–1
    trigger_score_live = weather_weight*0.40 + traffic_weight*0.30 + order_weight*0.30
    Round to 2 decimal places.

11. trigger_result_live
    Derived from trigger_score_live:
      NONE      : score < 0.40
      PARTIAL_25: score 0.40–0.59
      PARTIAL_50: score 0.60–0.79
      FULL      : score >= 0.80
    Expected distribution: NONE 55%, PARTIAL_25 20%, PARTIAL_50 15%, FULL 10%

12. ml_fraud_flag
    Boolean. Whether the ML model flagged this event as suspicious.
    True for 5% of rows (25 rows) — align with fraud riders from v4 pool.
    ml_fraud_flag=True rows must have trigger_result_live ≠ NONE (fraud rides bad weather).

13. payout_auto_initiated
    Boolean. True when:
      trigger_result_live ∈ {PARTIAL_50, FULL} AND ml_fraud_flag=False
      AND live_session_active=True
    Expected True rate: ~15–20% of all events.

14. payout_amount_inr
    Float. Amount paid out if payout_auto_initiated=True, else 0.0.
    If FULL trigger: 70% of (past_week_earnings from v4 / 7), capped by tier
    If PARTIAL_50: above * 0.50
    If PARTIAL_25: above * 0.25
    For non-payout rows: 0.0
    Round to 2 decimal places.

====================================================================
VALIDATION
====================================================================

1. Rows = exactly 500
2. payout_auto_initiated=True only when trigger_result_live ≠ NONE AND ml_fraud_flag=False
3. payout_amount_inr > 0 only when payout_auto_initiated=True
4. ml_fraud_flag=True rows: trigger_result_live must not be NONE
5. All timestamps chronologically ordered within each batch_id
6. FULL trigger count: approximately 50 rows (10%)

Output as downloadable CSV. Include all 500 rows.
```

---

---

# PROMPT 4 OF 4
## Dataset: `skysure_payout_history.csv`
### Purpose: Rider dashboard payout history, admin payout ledger
### Use in: Rider portal "My Payouts" tab, admin payout tracking

---

**PASTE THIS ENTIRE BLOCK AS YOUR PROMPT:**

```
Generate a CSV file called skysure_payout_history.csv with 600 rows.
This is the historical payout ledger for SkySure insurance platform.
Each row = one payout event (approved, denied, or investigating).

====================================================================
COLUMN SPECIFICATIONS (16 columns)
====================================================================

1. payout_id
   Format: PAY-TN-2026-{6-digit-number} starting at PAY-TN-2026-000001
   All unique.

2. rider_id
   From pool TN_RID_3000 to TN_RID_4999. Each rider can have 0–5 payouts.
   Distribute so ~400 unique riders appear (some riders have multiple payouts).
   Full-Timers get proportionally more payouts (higher trigger exposure).

3. policy_id
   Format: POL-TN-2026-{rider_id_last4}
   Example: if rider is TN_RID_3142, policy_id = POL-TN-2026-3142

4. payout_timestamp
   Datetime range: 2026-01-01 to 2026-04-30 (historical before v4 data).
   Format: YYYY-MM-DD HH:MM:SS
   Random times between 08:00 and 22:00 (active hours only).

5. weather_at_trigger
   Values: Stormy, Rainy, Cloudy (no Sunny payouts — Sunny never triggers)
   Stormy: 35%, Rainy: 50%, Cloudy: 15% (some partial cloudy+high traffic triggers)

6. traffic_at_trigger
   Values: High, Medium, Low
   High: 45%, Medium: 40%, Low: 15%

7. trigger_score
   Float 0.40–1.00 (only triggered events are in this table — min 0.40)
   Mean: 0.68, std: 0.16
   Round to 2 decimal places.

8. fraud_score_at_event
   Float 0.05–0.95.
   Approved payouts: fraud_score < 0.40 (95%), rare 0.40–0.65 (5%)
   Denied/investigating: fraud_score 0.65–0.95
   Round to 2 decimal places.

9. ml_fraud_probability
   Float 0.00–1.00. ML model output at time of event.
   Correlated with fraud_score_at_event (ρ ≈ 0.75) but slightly different.
   Approved: mean 0.12, std 0.09, range 0.01–0.35
   Denied: mean 0.78, std 0.12, range 0.55–0.98
   Round to 2 decimal places.

10. payout_status
    APPROVED       : 72% (432 rows)
    DENIED_FRAUD   : 15% ( 90 rows)
    INVESTIGATING  : 8%  ( 48 rows)
    DENIED_NO_TRIG :  5% ( 30 rows)
    Alignment: fraud_score > 0.65 → DENIED_FRAUD or INVESTIGATING

11. payout_amount_inr
    Float. Actual amount paid.
    APPROVED:        full amount (tier-capped: Basic ≤800, Standard ≤1200, Pro ≤2500)
    INVESTIGATING:   50% of amount paid immediately (held pending review)
    DENIED_*:        0.0
    Range for approved: 85.0 – 2500.0
    Full-Timer Pro range: 400–2500. Gig-Pro Standard: 200–1200. Student-Flex Basic: 50–800.
    Round to 2 decimal places.

12. payout_txn_id
    Format: TXN_{10-character-alphanumeric} for APPROVED rows.
    NULL for DENIED rows, "HOLD_{8-char}" for INVESTIGATING.
    Examples: "TXN_Xb8c7d6e5f", "HOLD_mn29dk3s"

13. payment_channel
    Values: upi, bank_transfer, wallet
    upi          : 60%
    bank_transfer: 30%
    wallet       : 10%
    DENIED rows: NULL

14. processing_time_minutes
    Integer. Time from trigger to payout send.
    APPROVED + fraud_score < 0.20: 1–3 minutes (fast track)
    APPROVED + fraud_score 0.20–0.40: 5–15 minutes
    INVESTIGATING: 720–1440 minutes (12–24 hours)
    DENIED: 2–10 minutes (fast deny)

15. admin_reviewed
    Boolean.
    INVESTIGATING: always True (admin must review)
    DENIED_FRAUD: 40% True (some auto-denied, some reviewed)
    APPROVED: 8% True (spot checks)
    DENIED_NO_TRIG: 5% True

16. week_number
    Integer 1–17 (Jan–Apr 2026 = 17 weeks).
    Derive from payout_timestamp.
    Used for weekly aggregation in admin dashboard charts.

====================================================================
BUSINESS LOGIC CONSTRAINTS
====================================================================

1. A rider cannot have two APPROVED payouts in the same week.
2. INVESTIGATING rows must have admin_reviewed=True.
3. payout_amount_inr > 0 only for APPROVED and INVESTIGATING.
4. Fraud riders (from is_fraud=1 in ml training set) should appear
   in DENIED_FRAUD or INVESTIGATING rows — not APPROVED.
5. FULL trigger_score (≥ 0.80) → payout_amount_inr = full tier cap.
6. PARTIAL_50 (0.60–0.79) → payout_amount_inr = 50% of full amount.
7. PARTIAL_25 (0.40–0.59) → payout_amount_inr = 25% of full amount.

====================================================================
VALIDATION
====================================================================

1. Rows = exactly 600
2. APPROVED count ≈ 432 (±10)
3. payout_amount_inr = 0.0 for all DENIED_* rows
4. No null payout_txn_id for APPROVED rows
5. processing_time_minutes in range 1–1440
6. fraud_score_at_event > 0.65 for all DENIED_FRAUD rows
7. Print value_counts of payout_status before CSV output

Output as downloadable CSV with all 600 rows.
```

---

---

## NOTES ON TOOL USAGE

### ChatGPT (Recommended)
- Use GPT-4o or o3 with **Code Interpreter enabled**
- It will write + execute the Python in one shot and give a download link
- If it truncates at 50 rows, reply: *"Output all 2000 rows to the CSV file
  without truncation. Use df.to_csv() and provide the download link."*
- If it asks for clarification, reply: *"Follow the prompt exactly as written.
  Make no assumptions beyond what is specified."*

### Google Colab (Alternative)
- Open colab.research.google.com
- Paste the Python code ChatGPT generates into a cell
- Run and download the CSV directly

### Common issues and fixes
| Issue | Fix |
|---|---|
| Dataset truncated in output | Ask for `df.to_csv('filename.csv', index=False)` and file download |
| Correlations not enforced | Ask: "Re-run and verify the correlation matrix between fraud_probability and ring_score. Target ρ ≈ 0.57." |
| All fraud rows have same values | Ask: "Add ±10% gaussian noise to all fraud-class numerical features." |
| Distributions don't match | Ask: "Run df.describe() and df['column'].value_counts() and show me the output before saving." |
| Persona-tier still 1:1 locked | Ask: "Verify with pd.crosstab(df['persona_type'], df['tier']) — it must show cross-assignments." |

---

*Prompts generated from: skysure_v3_final_cleaned.csv analysis*
*Reference dataset: 2000 rows, 22 columns, Tamil Nadu, India*
*Target: Phase 3 complete product datasets*
