# SkySure — Phase 3 Master Planner
## Complete Product Blueprint: From Prototype → Judges-Ready Full Product

---

## PART 0: WHERE WE STAND — HONEST ASSESSMENT

### What Phase 2 Delivered (confirmed by judge review)
| Area | Status | Judge Verdict |
|---|---|---|
| Full-stack application | ✅ Working | "Working full-stack application" |
| External API integrations | ✅ Real | "Real external API integrations" |
| Fraud detection (multi-signal) | ✅ Strong | "Strong fraud detection" |
| Insurance domain logic | ✅ Excellent | "Excellent insurance domain implementation" |
| AI / ML | ⚠️ Rule-based | "'AI/ML' is primarily rule-based" |
| Automated monitoring | ❌ Missing | "Lacks automated monitoring" |
| Registration flows | ❌ Missing | "Missing registration flows" |
| Payment integration | ❌ Missing | "Missing payment integration" |
| Complete platform | ❌ Prototype | "Needs completion of core platform features" |

### Dataset v3 Current State (skysure_v3_final_cleaned.csv)
```
Rows    : 2,000 riders
Columns : 22 fields
Strengths:
  + Coordinates now city-anchored (Chennai 13.04–13.12°N, Coimbatore 10.98–11.06°N, etc.)
  + trust_score (1–10) — uniformly distributed ✅
  + order_volume_collapse, platform_app_downtime (boolean triggers) ✅
  + probationary_tier (High-Risk identification) ✅
  + daily_baseline = past_week_earnings / 7 exactly ✅
  + Fraud BLOCK rate: 4.4% (88/2000) — realistic ✅
  + City-realistic coordinates — DBSCAN will work correctly ✅

Critical Issues Remaining:
  ! Persona-Tier is 1:1 locked (Full-Timer=Pro ONLY, Gig-Pro=Standard ONLY)
    → Judges will see this as hardcoded, not dynamic
  ! predicted_payout mean ₹49 (weekly_premium mean ₹50) — loss ratio 97%
    → Payouts are unrealistically low relative to INR insurance context
  ! No is_fraud binary label → Cannot train ML model without it
  ! 16 fields missing for Phase 3 complete product (auth, payment, live feed, ML)
```

---

## PART 1: DATASET UPGRADE PLAN

### 1A. Fields to ADD to existing dataset (Phase 3 core dataset)

#### Table 1: Rider Auth & Profile Fields
| Field | Type | Purpose | Sample Values |
|---|---|---|---|
| `user_id` | UUID string | Primary auth key | "usr_a1b2c3d4", "usr_e5f6g7h8" |
| `email` | string | Gmail OAuth login | "rider1@gmail.com" |
| `phone_number` | string | OTP fallback | "+91-98765-43210" |
| `oauth_provider` | enum | Auth method | "google", "email" |
| `account_status` | enum | Lifecycle state | "active", "pending_kyc", "suspended" |
| `registration_date` | date | Days-since calc for ML | "2025-11-14" |
| `kyc_status` | enum | Compliance | "verified", "pending", "rejected" |
| `vehicle_type` | enum | Risk factor + ML feature | "bike", "bicycle", "scooter", "ev_bike" |
| `partner_app` | enum | Data source tag | "zomato", "swiggy", "dunzo", "zepto" |
| `app_id` | string | OAuth connection ID | "zmto_9834jd92k", "swgy_k29dk39sl" |
| `zone` | string | Hyperlocal area | "Chennai-North", "Trichy-Central" |
| `avg_daily_salary_self_reported` | float | Cross-validation for ML | 650.0, 420.0, 890.0 |
| `bank_account_linked` | bool | Payment readiness | True, False |
| `upi_id` | string | Payout channel | "rider1@ybl", "rider2@paytm" |

**Head 5 values — Rider Profile extension:**
```
user_id          | email                  | phone_number    | oauth_provider | account_status | kyc_status | vehicle_type | partner_app | zone
usr_a1b2c3d4     | arjun.kumar@gmail.com  | +91-9876543210  | google         | active         | verified   | bike         | zomato      | Trichy-Central
usr_b2c3d4e5     | priya.selvi@gmail.com  | +91-8765432109  | google         | active         | verified   | scooter      | swiggy      | Chennai-North
usr_c3d4e5f6     | ravi.muthu@gmail.com   | +91-7654321098  | email          | pending_kyc    | pending    | bike         | zomato      | Madurai-West
usr_d4e5f6g7     | meena.devi@gmail.com   | +91-6543210987  | google         | active         | verified   | ev_bike      | dunzo       | Coimbatore-South
usr_e5f6g7h8     | kumar.raj@gmail.com    | +91-5432109876  | google         | suspended      | verified   | bicycle      | swiggy      | Salem-East
```

---

#### Table 2: Policy & Payment Fields
| Field | Type | Purpose | Sample Values |
|---|---|---|---|
| `policy_id` | string | Unique policy reference | "POL-TN-2026-001842" |
| `plan_selected` | enum | Coverage level chosen | "basic", "standard", "pro" |
| `policy_start_date` | date | Coverage begin | "2026-01-06" |
| `policy_end_date` | date | Renewal date | "2026-04-06" |
| `premium_payment_status` | enum | Weekly payment state | "paid", "pending", "failed", "waived" |
| `payment_method` | enum | How premium was paid | "upi", "netbanking", "wallet", "auto_deduct" |
| `payment_gateway_txn_id` | string | Razorpay/Stripe ref | "pay_Oa9s8d7f6g5h4" |
| `payout_wallet_balance` | float | Running payout credit | 0.0, 427.42, 1200.00 |
| `payout_status` | enum | Latest payout state | "approved", "pending", "denied", "investigating" |
| `payout_txn_id` | string | Payout reference | "pyt_Xb8c7d6e5f4g3" |
| `payout_timestamp` | datetime | When payout was sent | "2026-04-07 14:32:11" |
| `total_premiums_paid` | float | Lifetime total | 1243.80, 560.00 |
| `total_payouts_received` | float | Lifetime total | 854.84, 0.0 |
| `consecutive_active_weeks` | int | Loyalty / churn signal | 12, 4, 28 |

**Head 5 values — Policy & Payment:**
```
policy_id           | plan_selected | policy_start_date | premium_payment_status | payment_method | payout_wallet_balance | payout_status | total_premiums_paid | total_payouts_received
POL-TN-2026-001000  | pro           | 2026-01-06        | paid                   | upi            | 427.42                | approved      | 1147.20             | 854.84
POL-TN-2026-001001  | standard      | 2026-02-10        | paid                   | auto_deduct    | 0.00                  | denied        | 336.00              | 0.00
POL-TN-2026-001002  | pro           | 2026-01-13        | paid                   | upi            | 174.00                | approved      | 1209.60             | 348.00
POL-TN-2026-001003  | basic         | 2026-03-01        | pending                | netbanking     | 0.00                  | pending       | 67.20               | 0.00
POL-TN-2026-001004  | standard      | 2026-02-17        | paid                   | upi            | 0.00                  | denied        | 420.00              | 0.00
```

---

#### Table 3: ML Training Fields (most critical for Phase 3)
| Field | Type | ML Role | Derivation | Sample Values |
|---|---|---|---|---|
| `is_fraud` | int (0/1) | **Target label** | fraudScore > 0.7 OR risk_reason contains "Clustering" | 0, 0, 1, 0, 0 |
| `fraud_confirmed_by_admin` | bool | Label refinement | Admin manually marks after review | False, False, True, False |
| `claim_history_count` | int | Pattern feature | COUNT of past payouts received | 0, 3, 8, 1, 0 |
| `days_since_registration` | int | Tenure feature | today - registration_date | 112, 68, 247, 31, 189 |
| `zone_risk_index` | float | Spatial feature | Historical trigger rate in rider's zone | 0.32, 0.18, 0.45, 0.27, 0.11 |
| `peer_group_avg_efficiency` | float | Relative feature | Mean efficiency of same persona+city | 0.74, 0.63, 0.71, 0.66, 0.80 |
| `velocity_score` | float | Anomaly feature | delivered_orders / session_minutes vs baseline | 0.12, 0.08, 0.87, 0.23, 0.05 |
| `previous_payout_count` | int | Pattern feature | Payouts received in last 30 days | 0, 1, 4, 0, 2 |
| `consecutive_claim_days` | int | Pattern feature | Days with active payout claim | 0, 0, 3, 1, 0 |
| `income_drop_pct` | float | Trigger feature | (daily_baseline - actual_daily) / daily_baseline | 0.0, 0.28, 0.61, 0.0, 0.15 |
| `session_drop_pct` | float | Trigger feature | Drop vs persona avg session | 0.0, 0.12, 0.45, 0.32, 0.0 |
| `vehicle_risk_factor` | float | Premium feature | bike=1.0, scooter=0.9, bicycle=0.7, ev=0.85 | 1.0, 0.9, 1.0, 0.85, 0.7 |
| `weather_severity_score` | float | Trigger feature | Sunny=0, Cloudy=0.2, Rainy=0.75, Stormy=1.0 | 1.0, 0.0, 0.75, 0.2, 0.0 |
| `traffic_severity_score` | float | Trigger feature | Low=0, Medium=0.3, High=0.7, Jam=1.0 | 0.3, 0.0, 0.7, 0.3, 1.0 |

**Head 5 values — ML Training additions:**
```
is_fraud | fraud_confirmed_by_admin | claim_history_count | days_since_registration | zone_risk_index | velocity_score | income_drop_pct | weather_severity_score | traffic_severity_score
0        | False                    | 0                   | 112                     | 0.32            | 0.12           | 0.28            | 1.00                   | 0.30
0        | False                    | 3                   | 68                      | 0.18            | 0.08           | 0.00            | 0.00                   | 0.00
1        | True                     | 8                   | 247                     | 0.45            | 0.87           | 0.61            | 0.75                   | 0.70
0        | False                    | 1                   | 31                      | 0.27            | 0.23           | 0.00            | 0.20                   | 0.30
0        | False                    | 0                   | 189                     | 0.11            | 0.05           | 0.15            | 0.00                   | 1.00
```

---

#### Table 4: Live Feed / Real-Time Fields (for the live simulation panel)
| Field | Type | Purpose | Sample Values |
|---|---|---|---|
| `feed_timestamp` | datetime | When data was ingested | "2026-05-01 14:33:07" |
| `live_gps_lat` | float | Current location | 13.0812, 10.7891 |
| `live_gps_lon` | float | Current location | 80.2699, 78.7063 |
| `live_order_count` | int | Orders in current session | 4, 12, 0 |
| `live_session_active` | bool | Is rider online now | True, False |
| `trigger_check_timestamp` | datetime | When system evaluated | "2026-05-01 14:33:09" |
| `trigger_score_live` | float | Real-time trigger score | 0.82, 0.21, 0.65 |
| `trigger_result_live` | enum | Outcome | "FULL", "PARTIAL_50", "NONE" |
| `payout_auto_initiated` | bool | Did system auto-pay | True, False |
| `live_weather_api_result` | string | Open-Meteo response | "Stormy", "Sunny" |
| `live_traffic_api_result` | string | Traffic API response | "High", "Low" |

---

#### Table 5: Admin Analytics Aggregates (computed, not stored per rider)
These are **computed at query time**, not stored in the rider CSV. They power the admin dashboard.

| Metric | Formula | Display |
|---|---|---|
| `portfolio_loss_ratio` | SUM(payouts) / SUM(premiums) | 97.4% (fix needed) |
| `fraud_savings_week` | SUM(blocked_payouts WHERE fraudStatus=BLOCK) | ₹ value |
| `reinsurance_headroom` | (total_premium × 0.30) - total_payouts | ₹ value |
| `churn_risk_count` | COUNT(premium_pct_earnings > 5% AND payouts_received = 0) | count |
| `active_trigger_zones` | COUNT(DISTINCT zone WHERE trigger_score > 0.60) | count |
| `new_registrations_today` | COUNT(registration_date = today) | count |
| `pending_payouts_value` | SUM(predicted_payout WHERE payout_status = pending) | ₹ value |

---

### 1B. Fixes Required in Existing v3 Data

#### Fix 1: Break the 1:1 Persona-Tier Lock
**Current**: Full-Timer=Pro always, Gig-Pro=Standard always, Student-Flex=Basic always
**Fix**: Allow cross-assignment. A Full-Timer can be Basic or Standard. A Gig-Pro can be Pro.
```
Suggested distribution:
  Full-Timer  → Pro(50%), Standard(35%), Basic(15%)
  Gig-Pro     → Standard(55%), Pro(25%), Basic(20%)
  Student-Flex→ Basic(70%), Standard(25%), Pro(5%)
  High-Risk   → Basic(80%), Probationary(20%) — cannot be Pro
```

#### Fix 2: Payout Scale (currently ₹49 avg — should be ₹400–₹1,500)
**Current**: predicted_payout mean = ₹49.33 (too low — matches nothing in INR insurance)
**Fix**: predicted_payout = min(daily_baseline × 0.70, tier_cap)
```
tier_cap = { Basic: 800, Standard: 1200, Pro: 2500 }
For Full-Timer: daily_baseline avg ₹788 → payout = ₹552 (correct)
For Gig-Pro: daily_baseline avg ₹411 → payout = ₹288 (correct)
```

#### Fix 3: Add is_fraud label (needed immediately for ML)
```python
df['is_fraud'] = (
    (df['fraud_probability'] > 0.7) |
    (df['ring_score'] > 0.7) |
    (df['risk_reason'].str.contains('Clustering'))
).astype(int)
# Expected: ~100–120 fraud cases (5–6%) — realistic
```

---

## PART 2: ML MODEL SPECIFICATION

### 2.1 Model: Fraud Detection Classifier

**Algorithm**: Random Forest Classifier (primary) + XGBoost (ensemble)
**Why not deep learning**: 2,000 rows is too small for neural nets. RF + XGBoost with SMOTE handles class imbalance (95:5) perfectly.

**Feature Set (all from existing + new ML fields)**:
```
Numerical features (12):
  earning_efficiency, delivered_orders, past_week_earnings,
  fraud_probability, ring_score, trust_score, daily_baseline,
  velocity_score, income_drop_pct, session_drop_pct,
  zone_risk_index, days_since_registration

Categorical features (6, one-hot encoded):
  persona_type, tier, city, current_weather, traffic_density, vehicle_type

Boolean features (5, as 0/1):
  order_volume_collapse, platform_app_downtime, probationary_tier,
  bank_account_linked, previous_claim_this_month

Target:
  is_fraud (binary: 0 = clean, 1 = fraudulent)
```

**Training Strategy**:
```
Train/Test split: 80/20 (stratified on is_fraud)
Class imbalance fix: SMOTE oversampling on minority (fraud) class
Cross-validation: 5-fold stratified
Hyperparameter tuning: GridSearchCV on max_depth, n_estimators, min_samples_leaf

Evaluation metrics:
  Primary: F1-score (fraud class) — target > 0.80
  Secondary: Precision > 0.85 (avoid false positives that block legit riders)
  Tertiary: Recall > 0.75 (catch most actual fraud)
  NOT accuracy — misleading at 95:5 ratio
```

**Model Pipeline (scikit-learn)**:
```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), numerical_features),
    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
    ('bool', 'passthrough', boolean_features)
])

pipeline = ImbPipeline([
    ('preprocessor', preprocessor),
    ('smote', SMOTE(random_state=42, sampling_strategy=0.3)),
    ('classifier', RandomForestClassifier(n_estimators=200, random_state=42))
])
```

**New Entry Detection (real-time)**:
```
When live feed sends a new rider event every 3–6 minutes:
  1. Construct feature vector from live fields
  2. Run pipeline.predict_proba(X_new)
  3. fraud_prob = output[1]  (probability of class=1)
  4. If fraud_prob > 0.65 → flag for review
  5. If fraud_prob > 0.80 → auto-block payout
  6. Log prediction with timestamp + feature values to audit table
  7. Admin can confirm/deny → feeds back into retraining dataset
```

**Model Persistence**:
```python
import joblib
joblib.dump(pipeline, 'models/fraud_detector_v1.pkl')
# Load in FastAPI startup:
model = joblib.load('models/fraud_detector_v1.pkl')
```

### 2.2 Model: Dynamic Premium Calculator

**Algorithm**: Gradient Boosted Regression (XGBoost Regressor)
**Target**: actuarial_premium (computed from trigger probability × expected payout / loss ratio)

```
actuarial_premium = (P_trigger × 0.85 × tier_payout_cap) / 0.60 × city_factor × vehicle_factor

Features same as fraud model minus is_fraud, plus:
  consecutive_active_weeks, avg_daily_salary_self_reported, zone_risk_index
```

**Output**: Premium recommendation displayed to rider during plan selection, adjusting in real-time as they change their zone, vehicle type, and salary bar.

---

## PART 3: SYSTEM ARCHITECTURE — PHASE 3 COMPLETE PRODUCT

### 3.1 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend API | FastAPI (Python) | Async, ML-native, auto Swagger docs |
| ML Models | scikit-learn + XGBoost + joblib | Lightweight, serialisable, proven |
| Database | PostgreSQL | Relational: users, policies, payments, audit |
| CSV / Seed data | pandas on startup | Loads v3 CSV, enriches, seeds DB |
| Auth | Firebase Auth + Google OAuth 2.0 | Free tier, Gmail sign-in, JWT tokens |
| Payment | Razorpay (India, free sandbox) | UPI, netbanking, recurring premium |
| Real-time | FastAPI BackgroundTasks + APScheduler | Live feed every 3–6 min |
| Frontend | React + Tailwind CSS | Component-based, responsive |
| Maps | Leaflet.js + OpenStreetMap | Free, no API key, choropleth support |
| Weather API | Open-Meteo (free, no key) | Real-time + 7-day forecast |
| Hosting (demo) | Railway / Render (free tier) | One-click deploy for judges |

### 3.2 Database Schema (5 core tables)

#### Table: users
```sql
user_id          UUID PRIMARY KEY
email            TEXT UNIQUE NOT NULL
phone_number     TEXT
oauth_provider   TEXT  -- 'google' | 'email'
role             TEXT  -- 'admin' | 'rider'
account_status   TEXT  -- 'active' | 'pending_kyc' | 'suspended'
created_at       TIMESTAMP
last_login       TIMESTAMP
```

#### Table: rider_profiles (extends users)
```sql
rider_id         TEXT UNIQUE  -- links to CSV rider_id (TN_RID_XXXX)
user_id          UUID REFERENCES users(user_id)
persona_type     TEXT
vehicle_type     TEXT
partner_app      TEXT
app_id           TEXT
zone             TEXT
city             TEXT
coordinates      TEXT
kyc_status       TEXT
bank_account_upi TEXT
profile_photo_url TEXT
```

#### Table: policies
```sql
policy_id           TEXT PRIMARY KEY
rider_id            TEXT REFERENCES rider_profiles(rider_id)
plan_selected       TEXT  -- 'basic' | 'standard' | 'pro'
tier                TEXT
weekly_premium      NUMERIC
policy_start_date   DATE
policy_end_date     DATE
payment_status      TEXT
consecutive_weeks   INT
total_paid          NUMERIC
total_received      NUMERIC
```

#### Table: payout_events
```sql
event_id            UUID PRIMARY KEY
rider_id            TEXT REFERENCES rider_profiles(rider_id)
feed_timestamp      TIMESTAMP
trigger_score       NUMERIC
fraud_score         NUMERIC
ml_fraud_prob       NUMERIC      -- from ML model
fraud_status        TEXT
payout_amount       NUMERIC
payout_status       TEXT
payout_txn_id       TEXT
weather_at_trigger  TEXT
traffic_at_trigger  TEXT
auto_initiated      BOOLEAN
admin_reviewed      BOOLEAN
```

#### Table: ml_audit_log
```sql
audit_id            UUID PRIMARY KEY
rider_id            TEXT
event_timestamp     TIMESTAMP
feature_vector      JSONB        -- full input to model
fraud_prob_output   NUMERIC      -- model output
decision            TEXT         -- ALLOW | REVIEW | BLOCK
admin_confirmed     BOOLEAN      -- feedback loop label
confirmed_fraud     BOOLEAN      -- ground truth for retraining
```

---

## PART 4: COMPLETE USER FLOW DESIGN

### 4.1 Admin Flow (Company — Zomato/Swiggy)

```
Landing Page → "Admin Login"
    ↓
Google OAuth → Firebase Auth → JWT issued
    ↓
Admin Dashboard (main view):
  ┌─────────────────────────────────────────────┐
  │ Portfolio Health  │ Live Feed Panel           │
  │ - Loss ratio      │ - 5-10 riders/3-6 min    │
  │ - Premium total   │ - Trigger scores live     │
  │ - Payout total    │ - ML fraud flags          │
  │ - Fraud savings   │ - Auto-payout log         │
  ├───────────────────┼──────────────────────────┤
  │ Zone Heatmap      │ Fraud Cluster Map         │
  │ (Leaflet + OSM)   │ (DBSCAN rings overlay)   │
  ├───────────────────┼──────────────────────────┤
  │ Rider Analytics   │ Pending Reviews Queue     │
  │ - Cohort tables   │ - HOLD status payouts     │
  │ - Churn risk list │ - Admin approve/deny      │
  │ - Persona filters │ - Confirms ML label       │
  └─────────────────────────────────────────────┘
```

**Live Feed Panel Logic** (replaces simulation):
```
APScheduler job runs every 3–6 minutes (random interval):
  1. SELECT 5–10 random riders from DB (weighted: storm-zone riders 3× more likely)
  2. Fetch real weather for their coordinates → Open-Meteo API
  3. Fetch simulated traffic (or Ola Maps if available)
  4. Compute trigger_score (weighted formula, Section 4.3 of gaps doc)
  5. Run ML fraud model → fraud_probability
  6. Compute payout decision
  7. If APPROVED → create payout_event record, mark payout_auto_initiated=True
  8. Push update to frontend via WebSocket (FastAPI + websockets)
  9. Frontend animates new row appearing in Live Feed table
  10. Admin can click any row → see full breakdown
```

**Admin Filters (advanced)**:
```
Filter by: city | persona_type | tier | risk_level | date_range |
           payout_status | fraud_status | weather_event |
           partner_app | zone | trust_score_range
Export: CSV download of filtered view
```

### 4.2 Rider Flow (Gig Worker)

```
Landing Page → "Rider Sign Up / Login"
    ↓
Google OAuth or Email OTP → Firebase Auth
    ↓
Step 1: Profile Setup
  - Name (from Google profile)
  - Phone number (OTP verify)
  - Vehicle type selection (bike / scooter / ev_bike / bicycle)
  - City + Zone selection (map picker — Leaflet)
  - Partner app selection (Zomato / Swiggy / Dunzo / Zepto)
  - App ID entry (mock OAuth connect to partner)
    ↓
Step 2: Plan Selection
  - System calculates recommended plan based on:
    avg_daily_salary_self_reported (salary bar slider — rider sets this)
    vehicle_type, zone_risk_index, city
  - Show 3 plan cards: Basic / Standard / Pro
    Each card shows: weekly premium | payout cap | trigger threshold | coverage days
  - ML premium model runs → shows dynamic premium adjustment as they slide salary bar
    ↓
Step 3: Payment (Razorpay)
  - Weekly premium displayed (computed dynamically)
  - UPI / NetBanking / Card options
  - Razorpay checkout (sandbox for demo, live for production)
  - On success: policy_id generated, coverage active
    ↓
Step 4: Rider Dashboard
  ┌──────────────────────────────────────────────┐
  │ My Coverage Card                              │
  │ - Plan: Pro | Premium: ₹95.76/week           │
  │ - Safety Score: 82/100 (ring gauge)          │
  │ - Coverage status: ACTIVE (green)            │
  ├──────────────────────────────────────────────┤
  │ Live Trigger Monitor                         │
  │ - Current weather in my zone: Rainy          │
  │ - Trigger score: 0.72 (PARTIAL_50)           │
  │ - "Your coverage is monitoring..."           │
  ├──────────────────────────────────────────────┤
  │ Payout History                               │
  │ - Total paid: ₹1,147   Received: ₹854       │
  │ - Last payout: ₹427 on Apr 7 (APPROVED)     │
  ├──────────────────────────────────────────────┤
  │ Premium Breakdown (this week)                │
  │ - Base: ₹86 | Zone: +₹8 | Clean: -₹6       │
  │ - Final: ₹88                                │
  └──────────────────────────────────────────────┘
```

### 4.3 Payment Integration (Razorpay)

```javascript
// Razorpay Checkout (frontend)
const options = {
  key: process.env.RAZORPAY_KEY_ID,   // test key for demo
  amount: weeklyPremium * 100,         // in paise
  currency: "INR",
  name: "SkySure Insurance",
  description: `${planSelected} Plan — Weekly Premium`,
  prefill: { email: riderEmail, contact: riderPhone },
  theme: { color: "#1a56db" },
  handler: function(response) {
    // On success: POST /api/payment/confirm with txn_id
    // Backend creates policy record, activates coverage
  }
};

// Backend: /api/payment/confirm
// 1. Verify payment with Razorpay API
// 2. Create policy in DB
// 3. Activate coverage for rider
// 4. Send confirmation email (Firebase or Resend)
// 5. Return policy_id + coverage_start_date
```

---

## PART 5: SPRINT-LEVEL BUILD PLANNER

### Sprint 1 — Foundation (Days 1–3)
**Goal**: Database + Auth working end-to-end

| Task | Owner | Complexity |
|---|---|---|
| Set up PostgreSQL + schema (5 tables) | Backend | Medium |
| Firebase Auth setup + Google OAuth | Full-stack | Low |
| Admin login page (React) | Frontend | Low |
| Rider register/login page (React) | Frontend | Low |
| JWT middleware for all API routes | Backend | Medium |
| Load v3 CSV → seed DB on startup | Backend | Low |
| Generate is_fraud label + ML fields in CSV | Data | Low |
| Fix payout scale (₹49 → ₹400–₹1,500) | Data | Low |
| Break persona-tier 1:1 lock | Data | Low |

**Deliverable**: Both login flows work, DB has seed data

---

### Sprint 2 — Rider Onboarding + Payment (Days 4–6)
**Goal**: Complete rider registration + policy payment

| Task | Owner | Complexity |
|---|---|---|
| Profile setup multi-step form (React) | Frontend | Medium |
| Salary bar slider with live premium calc | Frontend | Low |
| Plan selection cards with comparison | Frontend | Medium |
| Premium API endpoint (dynamic formula) | Backend | Medium |
| Razorpay sandbox integration | Full-stack | Medium |
| Policy creation on payment success | Backend | Low |
| Rider dashboard shell + coverage card | Frontend | Medium |
| Safety Score ring gauge component | Frontend | Low |

**Deliverable**: Rider can register, select plan, pay premium, see dashboard

---

### Sprint 3 — ML Model Training (Days 7–9)
**Goal**: Trained ML fraud model deployed as API

| Task | Owner | Complexity |
|---|---|---|
| Generate ML training dataset (2000 rows + new fields) | Data | Medium |
| EDA + feature importance analysis | Data/ML | Medium |
| Train RF Classifier + XGBoost ensemble | ML | Medium |
| SMOTE for class imbalance | ML | Low |
| Cross-validation + F1 score evaluation | ML | Low |
| Save model as .pkl with joblib | ML | Low |
| Load model in FastAPI + POST /api/ml/fraud-predict | Backend | Low |
| Connect ML output to payout pipeline | Backend | Medium |
| Admin ML audit log display | Frontend | Low |

**Deliverable**: ML model predicts fraud on new entries, audit log visible to admin

---

### Sprint 4 — Live Feed + Admin Dashboard (Days 10–13)
**Goal**: Live simulation panel + complete admin analytics

| Task | Owner | Complexity |
|---|---|---|
| APScheduler job (3–6 min interval, 5–10 riders) | Backend | Medium |
| WebSocket endpoint for live push | Backend | Medium |
| Live Feed table component (React) | Frontend | Medium |
| Real Open-Meteo API call per rider zone | Backend | Low |
| Auto-payout initiation in live feed | Backend | Low |
| Portfolio health metric cards | Frontend | Low |
| Zone heatmap (Leaflet choropleth) | Frontend | High |
| Fraud cluster map (DBSCAN + Leaflet markers) | Frontend | High |
| Pending review queue + approve/deny | Full-stack | Medium |
| Advanced filter panel (all filter dimensions) | Frontend | Medium |
| CSV export of filtered data | Backend | Low |
| Rider payout history + trigger monitor | Frontend | Low |

**Deliverable**: Live feed running, admin sees real-time data, payouts auto-triggered

---

### Sprint 5 — Polish + Demo Prep (Days 14–15)
**Goal**: Judge-ready complete product

| Task | Owner | Complexity |
|---|---|---|
| Predictive pre-activation (Open-Meteo 7-day) | Backend | Medium |
| Push notification (Firebase Cloud Messaging) | Full-stack | Medium |
| Premium breakdown receipt (rider dashboard) | Frontend | Low |
| Responsive mobile layout (rider side) | Frontend | Medium |
| Error states + loading skeletons everywhere | Frontend | Low |
| Rate limiting + basic API security | Backend | Low |
| Demo data seeding script (clean state) | Backend | Low |
| 2-minute demo video script + recording | All | - |
| README with setup instructions | All | Low |
| Deploy to Railway/Render (free tier) | DevOps | Low |

**Deliverable**: Live deployed URL judges can test

---

## PART 6: WHAT ADDRESSES EACH JUDGE CONCERN

| Judge Concern | Phase 3 Solution | Evidence |
|---|---|---|
| "Lacks automated monitoring" | APScheduler live feed every 3–6 min | Runs without any user click |
| "Missing registration flows" | Full rider onboarding (5 steps) + admin Google login | Gmail OAuth + profile form + plan selection |
| "Missing payment integration" | Razorpay sandbox for weekly premium | Live payment UI, txn_id stored in DB |
| "'AI/ML' is rule-based" | Trained RF + XGBoost on 2,000 rows with 23 features | Model file, F1 score shown in admin |
| "Needs completion of core platform" | Auth + Policy + Payment + Live Feed + Dashboards | Complete user journeys for both roles |

---

## PART 7: DATASET FINAL STATE — WHAT TO REGENERATE

### Final CSV files needed for Phase 3

**File 1: `skysure_riders_v4.csv`** — 2,000 rows, 36 fields
(All v3 fields + Table 1 rider profile + Table 2 policy + Table 3 ML fields)

**File 2: `skysure_ml_training.csv`** — 2,000 rows, 24 fields
(Core v3 fields + all ML Table 3 fields + is_fraud label)
This is the ONLY file the ML model trains on.
It reuses all existing v3 attributes to maintain consistency.

**File 3: `skysure_live_feed_seed.csv`** — 500 rows, 11 fields
(Live feed simulation data: timestamps, live GPS, trigger results)
Used to seed the live feed for demo when real 3–6 min intervals are slow.

**File 4: `skysure_payout_history.csv`** — 400 rows, 10 fields
(Historical payout events for rider dashboard history display)

---

## PART 8: ONE-PAGE SUMMARY FOR THE JUDGES

```
SkySure Phase 3 — Complete Parametric Insurance Platform

Auth Layer    : Google OAuth for admin + rider | JWT secured | Firebase
Rider Journey : Register → Profile → Plan Select → Pay → Live Dashboard
Admin Journey : Login → Live Feed → Analytics → Fraud Review → Approve/Deny
ML Model      : RandomForest + XGBoost, trained on 2,000 riders, 23 features
                F1-score target: >0.80 | Evaluated with SMOTE for 95:5 imbalance
Live Feed     : 5–10 riders auto-checked every 3–6 min | WebSocket push to UI
Triggers      : Weighted 5-signal system (weather 35%, traffic 25%, income 25%, session 15%)
Fraud Gate    : ML probability + rule ensemble → ALLOW/REVIEW/HOLD/BLOCK
Payment       : Razorpay (UPI/NetBanking) | Weekly auto-deduct | Payout to UPI
APIs Used     : Open-Meteo (weather + forecast) | Razorpay | Firebase | OpenStreetMap
Data          : 36-field rider dataset | 4 CSV files | PostgreSQL in production
Deployment    : FastAPI backend + React frontend | Railway/Render free tier
```

---

*SkySure Phase 3 Master Planner | Generated from v3 dataset analysis*
*Dataset: skysure_v3_final_cleaned.csv | 2,000 riders | 22 current fields | 14 new fields needed*
