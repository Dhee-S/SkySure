# SkySure

### Zero-Touch Parametric Insurance for Gig Workers

> *Insurance that pays before you ask.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Overview

SkySure is an **AI-powered parametric insurance platform** that automatically triggers weather-based payouts for gig economy workers—no claims, no paperwork, no waiting.

Built with adversarial defense at its core, SkySure protects against coordinated fraud rings through multi-signal behavioral analysis.

| Feature | Description |
|---------|-------------|
| ⚡ **Instant Payouts** | Sub-second claim processing via 47 behavioral signals |
| 🛡️ **Anti-Fraud AI** | Ring detection, GPS spoofing defense, behavioral fingerprinting |
| 🌦️ **Weather-Linked** | Open-Meteo API integration for real-time weather data |
| 📱 **Zero-Touch** | Automatic enrollment, verification, and disbursement |

---

## 🎯 The Problem

```
Traditional Insurance          SkySure
─────────────────────         ───────
Claims required         →     No claims
Days to process         →     < 2 seconds
Manual verification      →     AI-powered
Vulnerable to spoofing   →     Multi-signal defense
```

A recent incident proved **GPS-only verification is obsolete**. A syndicate of 500 workers used Telegram + GPS spoofing apps to drain a beta platform's liquidity pool.

SkySure was built to defend against this.

---

## 🛡️ Adversarial Defense Architecture

### Multi-Signal Behavioral Fingerprinting

We never trust a single signal. Every payout decision validates through **7 behavioral layers**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYOUT DECISION ENGINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📍 Device      │  📱 App      │  🌐 Network   │  👥 Social   │
│   Intelligence   │  Behavior    │  Patterns     │  Graph       │
│                                                                  │
│   • GPS + Altitude    • Session logs    • IP Velocity     • Ring │
│   • Satellite #      • Order rate     • VPN/Proxy       Detection│
│   • Signal strength  • Engagement      • ASN patterns    • Shared│
│   • Trajectory       • App crashes     • Geolocation     Devices │
│                                    mismatch                         │
└─────────────────────────────────────────────────────────────────┘
```

### Ring Detection Algorithm

For coordinated attacks, we calculate a **Ring Score**:

```python
Ring_Score = (
    Spatial_Clustering  × 0.30 +    # Geographic concentration
    Temporal_Burst      × 0.25 +    # Synchronized claims
    Shared_Devices       × 0.20 +    # Same phone = fraud
    Payment_Concentration× 0.15 +    # Common UPI IDs
    Network_Similarity  × 0.10      # Same VPN/WiFi
)

if Ring_Score > 0.7:
    → Freeze cluster → Human investigation → KYC escalation
```

### Tiered Risk Processing

| Risk Level | Signals | Processing | Action |
|------------|---------|------------|--------|
| 🟢 **Green** | 0-2 | Auto-approve < 2s | Payout released |
| 🟡 **Yellow** | 3-4 | Expedited < 30s | Optional review |
| 🟠 **Orange** | 5-6 | Review < 10min | Human required |
| 🔴 **Red** | 7+ | Block + Investigate | Manual + escalation |

### Honest Worker Protections

- ✅ Network drop grace period (30 min during storms = expected)
- ✅ Appeal process within 72 hours
- ✅ Trust score for 90-day compliant riders
- ✅ "Working from home" not penalized
- ✅ Benefit of doubt for connectivity issues

---

## 📊 How It Works

```
 Weather API          AI Engine           Fraud Check          Auto-Pay
(Open-Meteo)     →   (7 Signals)    →   (6 Checks)      →   (UPI/PhonePay)
```

### 1. Weather Monitoring
Real-time weather data fetched for each rider's GPS location via Open-Meteo API.

### 2. Signal Evaluation
Seven disruption signals analyzed per rider:
- Heavy Rain (>10mm/hr)
- Order Drop (>30%)
- Rider Inactivity
- Abnormal Delivery Time
- Low Order Volume
- High Wind (>40km/h)
- Low Visibility (<5km)

### 3. Severity Scoring
| Score | Tier | Base Payout |
|-------|------|-------------|
| 5.0+ | 🔴 Critical | ₹1,000 |
| 3.5+ | 🟠 High | ₹700 |
| 2.5+ | 🟡 Medium | ₹500 |
| 1.0+ | 🟢 Low | ₹300 |

*Rider multipliers: Pro (1.3×) | Standard (1.0×) | Basic (0.7×)*

### 4. Fraud Detection
Six weighted checks before payout:
- Rain Correlation (25%) — Inactive only during rain?
- Payout Velocity (20%) — Sudden claim spike?
- Ghost Rider (20%) — No movement despite "trapped" claim?
- Synced Inactivity (15%) — All riders inactive simultaneously?
- Behavioral Anomaly (10%) — Delivery patterns deviate?
- Cluster Anomaly (10%) — Geographic claim clustering?

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/nakshatra016/SkySure.git
cd SkySure

# Install dependencies
cd frontend && npm install

# Start development server
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** → Click **"AI Simulation"**

---

## 📁 Project Structure

```
SkySure/
├── frontend/
│   ├── src/
│   │   ├── engine.js              # AI simulation & fraud detection
│   │   ├── weather.js             # Open-Meteo API integration
│   │   ├── firestoreStore.js      # Firebase + localStorage persistence
│   │   └── pages/
│   │       ├── Simulation.jsx     # AI simulation demo
│   │       ├── Overview.jsx       # Dashboard with KPIs
│   │       ├── RidersManagement.jsx
│   │       ├── PayoutLogs.jsx
│   │       └── RiderPortal.jsx    # Rider self-service
│   └── vite.config.js
├── backend/
│   └── server.js                  # Firebase Admin SDK
├── README.md                      # This file
└── logics.md                      # Complete business rules
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + React Router v7 |
| Animation | Framer Motion |
| Database | Firebase Firestore + localStorage fallback |
| Weather | Open-Meteo API (free, no rate limits) |
| Icons | Lucide React |

---

## 📈 Demo Outcomes

The simulation produces varied outcomes across 5 sample riders:

| Rider | Weather | Activity | Outcome |
|-------|---------|----------|---------|
| Karthik | ☀️ Clear | Active | No payout |
| Divya | 🌧️ Heavy rain | Active | ₹910 (High tier) |
| Vignesh | ☀️ Clear | Inactive | ⚠️ **FRAUD DETECTED** |
| Sundari | ⛈️ Storm | Active | ₹1,300 (Critical tier) |
| Muthuraj | 🌦️ Moderate | Active | ₹650 (Medium tier) |

---

## 🔐 Security Features

- 🔒 Firebase Authentication for admin access
- 🔒 Firestore Security Rules
- 🚦 Rate limiting on API endpoints
- 📋 Complete audit logging for compliance
- 🛡️ 47 behavioral data points per decision

---

## ⚙️ Configuration

All thresholds are tunable in `engine.js`:

```javascript
CONFIG = {
  RAINFALL_THRESHOLD_MM: 10,      // Signal trigger
  ORDER_DROP_THRESHOLD: 30,       // % drop to trigger
  FRAUD_SCORE_THRESHOLD: 30,      // Block if ≥ 30%
  RING_SCORE_THRESHOLD: 0.7,      // Cluster freeze if ≥ 0.7
  
  PAYOUT_TIERS: [
    { name: 'Critical', minSeverity: 5.0, basePayout: 1000 },
    { name: 'High', minSeverity: 3.5, basePayout: 700 },
    { name: 'Medium', minSeverity: 2.5, basePayout: 500 },
    { name: 'Low', minSeverity: 1.0, basePayout: 300 },
  ]
}
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [logics.md](logics.md) | Complete business rules & thresholds |
| [log.md](log.md) | Prototype walkthrough & features |

---

## ⚠️ Disclaimer

This is a **prototype/demo**. For production deployment:
- Conduct security audits & red team exercises
- Implement IRDAI compliance (India)
- Integrate UPI/PhonePe/Paytm payment gateways
- Add production monitoring & alerting

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

<div align="center">

**[nakshatra016/SkySure](https://github.com/nakshatra016/SkySure)** · Built for gig workers who deserve better protection.

</div>
