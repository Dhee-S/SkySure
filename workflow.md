# SkySure: Parametric Insurance for the Gig Economy

Welcome to the SkySure repository. This project is a next-generation insurance solution designed to protect gig workers from climate-driven earnings volatility through real-time telemetry and parametric triggers.

## 🚀 Navigation Guide

### 1. The Risk Lab (Simulation Environment)
The heart of SkySure is the **Risk Lab**, where we ingest climate pulses and verify insurance payouts.
- **UI & Interaction**: [Simulation.jsx](file:///d:/Code/Guidwire/gigguard/frontend/src/pages/Simulation.jsx)
- **Pulse & Metric Logic**: [dataService.js](file:///d:/Code/Guidwire/gigguard/frontend/src/data/dataService.js)

### 2. The Forensic Audit Console
Every fraud event is backed by telemetry evidence.
- **Forensic UI**: Contextual logs in the `Simulation` left sidebar.
- **Heuristic Triggers**: Defined in `dataService.js` under `heuristicChecks`.

### 3. The Audit Ledger (Payout Settlements)
Real-time tracking of all parametric disbursements.
- **Ledger UI**: [PayoutLogs.jsx](file:///d:/Code/Guidwire/gigguard/frontend/src/pages/PayoutLogs.jsx)
- **Settlement Components**: [RiskEngineComponents.jsx](file:///d:/Code/Guidwire/gigguard/frontend/src/components/RiskEngineComponents.jsx)

## 🛠️ System Architecture

SkySure uses a unified **Serverless Stack** deployed on Vercel:
- **Frontend**: React (Vite) with Vanilla CSS and Framer Motion for high-fidelity animations.
- **Backend API**: Node.js (Express) serverless endpoints in the `api/` directory.
- **Persistence**: Firebase Firestore and Auth for transaction logs and user management.

## 🏃 Local Execution

To run the application locally:

1. **Frontend Development**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend API**:
   The API is designed for Vercel deployment. For local development, ensure your environment variables match the expected Firebase config.

## 🧠 Key Logic Files

- [dataService.js](file:///d:/Code/Guidwire/gigguard/frontend/src/data/dataService.js): The source of truth for all simulation data, payout formulas, and fraud heuristics.
- [Simulation.jsx](file:///d:/Code/Guidwire/gigguard/frontend/src/pages/Simulation.jsx): The primary orchestration component for the Risk Lab interface.
- [api/index.js](file:///d:/Code/Guidwire/gigguard/api/index.js): The main serverless entry point for backend operations.

---

*This repository has been sanitized for the Judge Review process. All sensitive test data and development logs have been excluded while keeping the core investigative logic accessible.*
