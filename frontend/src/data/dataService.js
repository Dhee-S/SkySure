import ridersData from './ridersData.json';

// Global singleton to persist simulation results across the session
let simulationPool = [];

import { auth, db } from '../firebase';
import { 
    collection, query, orderBy, limit, onSnapshot, getDocs
} from 'firebase/firestore';

// Vercel / Local Toggle: In production, API calls use relative paths (rewrites)
const useBackend = true;
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

// Helper: Get Firebase JWT Token
const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) return { 'Content-Type': 'application/json' };
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Helper: Calculate Premium based on Actuarial Logic (Fallback for UI)
const calculateActuarialData = (rider) => {
  const efficiency = parseFloat(rider.earning_efficiency) || 0.8;
  const baseRate = rider.tier === 'Pro' ? 180 : (rider.tier === 'Standard' ? 120 : 80);
  
  // Premium increases as efficiency drops (Risk goes up)
  const riskAdjustment = 1 + (1 - efficiency);
  const weeklyPremium = Math.round(baseRate * riskAdjustment);
  
  // Balanced Trust Score Generator: Strong tendency for 75-98 range for most riders
  const baseTrust = (parseFloat(rider.trust_score) || 82);
  const variance = (Math.random() * 20) - 5; // Random variance -5 to +15
  const trustScore = Math.min(100, Math.max(10, baseTrust + (efficiency * 10) + variance));

  return {
    weeklyPremium,
    trustScore: Math.round(trustScore),
    fraudProb: (parseFloat(rider.fraud_probability) || 0).toFixed(2),
    isActive: rider.is_active === 'True' || rider.is_active === true
  };
};

export const dataService = {
  // 1. Get Dashboard Stats (Live API)
  async getDashboardStats() {
    if (useBackend) {
        try {
            const headers = await getAuthHeaders();
            const resp = await fetch(`${API_URL}/api/stats`, { headers });
            if (resp.ok) return await resp.json();
        } catch (e) {
            console.error("[DS] Backend Stats failed, falling back", e);
        }
    }

    const riders = ridersData;
    const mapped = riders.map(r => calculateActuarialData(r));
    return {
      totalRiders: riders.length,
      highRiskRiders: riders.filter(r => (parseFloat(r.fraud_probability) || 0) >= 0.5).length,
      activeRiders: riders.filter(r => r.is_active === 'True').length,
      avgTrustScore: (mapped.reduce((acc, r) => acc + r.trustScore, 0) / riders.length).toFixed(1),
      totalPremium: mapped.reduce((acc, r) => acc + r.weeklyPremium, 0),
      riskTrend: [4, 6, 8, 5, 9, 12, 10]
    };
  },

  // 2. Get All Riders (Live API)
  async getRiders() {
    if (useBackend) {
        try {
            const headers = await getAuthHeaders();
            const resp = await fetch(`${API_URL}/api/riders`, { headers });
            if (resp.ok) return await resp.json();
        } catch (e) {
            console.error("[DS] Backend Riders failed, falling back", e);
        }
    }

    return ridersData.map(r => {
      const actuarial = calculateActuarialData(r);
      const fraudVal = parseFloat(actuarial.fraudProb);
      return {
        ...r,
        id: r.rider_id || r.id,
        riderId: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.split('_').pop() || r.id?.slice(-4)}`,
        weeklyPremium: actuarial.weeklyPremium,
        trustScore: actuarial.trustScore,
        risk: {
          level: fraudVal >= 0.5 ? 'High' : (fraudVal >= 0.3 ? 'Medium' : 'Low'),
          score: fraudVal
        }
      };
    });
  },

  // 3. Get Specific Rider
  async getRider(id) {
    if (useBackend) {
        try {
            const headers = await getAuthHeaders();
            const resp = await fetch(`${API_URL}/api/riders/${id}`, { headers });
            if (resp.ok) return await resp.json();
        } catch (e) {
            console.error("[DS] Backend Rider detail failed, falling back", e);
        }
    }

    const rider = ridersData.find(r => r.id === id || r.rider_id === id);
    if (!rider) return null;
    const actuarial = calculateActuarialData(rider);
    return {
        ...rider,
        id: rider.rider_id || rider.id,
        name: rider.name || `Partner ${rider.rider_id?.split('_').pop() || rider.id?.slice(-4)}`,
        weeklyPremium: actuarial.weeklyPremium,
        trustScore: actuarial.trustScore
    };
  },

  // 4. Get Premium
  async getPremium(id) {
    const rider = await this.getRider(id);
    if (!rider) return { premium: 120, riskScore: 1.0 };
    return {
      premium: rider.weeklyPremium,
      riskScore: (1 + (1 - (parseFloat(rider.earning_efficiency) || 0.8))).toFixed(2)
    };
  },

  // 5. Run Full Simulation (Cluster-based Engine)
  async runSimulation(payload) {
    if (useBackend) {
        try {
            const resp = await fetch(`${API_URL}/api/simulation/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (resp.ok) return await resp.json();
        } catch (e) {
            console.error("[DS] Backend Simulation failed, falling back", e);
        }
    }

    const { location } = payload;
    const batchSize = Math.floor(Math.random() * 4) + 5; // 5 to 8 riders
    const clusterRiders = ridersData.filter(r => r.city === location).slice(0, batchSize);
    
    const nodes = clusterRiders.map(r => {
      const isDisrupted = Math.random() > 0.4;
      const actuarial = calculateActuarialData(r);
      
      // Forced Anomalies in Mock (30% total risk rate)
      const dice = Math.random();
      const isGhostRider = dice > 0.85;
      const isClusterFraud = dice > 0.70 && dice <= 0.85;
      const isMitigated = isGhostRider || isClusterFraud || (parseFloat(actuarial.fraudProb) > 0.6 && isDisrupted);
      
      const reasonTags = isGhostRider 
        ? ["Geospatial Ghosting: Persistent signal drift from verified route nodes"] 
        : isClusterFraud 
          ? ["Cluster Sync Anomaly: Packet collision detected in regional telemetry node"] 
          : ["Nominal Signature: Telemetry aligns with environmental baseline"];

      // Adjusted payout for realism (₹400 - ₹2,800 range)
      const baseEarningsPerDay = parseFloat(r.past_week_earnings) / 7;
      const normalizedAmount = isDisrupted 
        ? (isMitigated ? 0 : Math.round(Math.max(450, Math.min(baseEarningsPerDay * 1.2, 2800)) * (Math.random() * 0.3 + 0.85)))
        : 0;

      return {
        id: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        persona: r.persona_type || 'Gig-Pro',
        trust_score: isMitigated ? Math.max(5, actuarial.trustScore - 45) : actuarial.trustScore,
        fraud_probability: isMitigated ? 0.82 : parseFloat(actuarial.fraudProb),
        isDisrupted,
        activeSignalCount: isDisrupted ? 3 : 0,
        severityScore: isDisrupted ? 1.85 : 0.45,
        fraud: {
           score: isMitigated ? 85 : 12,
           reasons: reasonTags
        },
        signals: {
          heavyRain: { value: (Math.random() * 50).toFixed(1), active: isDisrupted },
          highWind: { value: (Math.random() * 60).toFixed(1), active: Math.random() > 0.7 },
          orderDrop: { value: (Math.random() * 100).toFixed(0), active: isDisrupted || isClusterFraud },
          riderInactive: { active: isDisrupted },
          lowVisibility: { value: (Math.random() * 5).toFixed(1), active: Math.random() > 0.8 },
          abnormalDeliveryTime: { value: (Math.random() * 45).toFixed(0), active: isGhostRider }
        },
        velocity: `${Math.floor(Math.random() * 25) + 32}km/h`,
        payout: {
          status: isMitigated ? 'MITIGATED' : (isDisrupted ? 'APPROVED' : 'NOMINAL'),
          amount: normalizedAmount,
          math: { 
            baseline: Math.round(baseEarningsPerDay),
            impact: 1.15, 
            severity: isDisrupted ? 1.25 : 0, 
            confidence: actuarial.trustScore / 100 
          }
        },
        heuristicChecks: [
            { 
                label: 'Geospatial Integrity', 
                status: isGhostRider ? 'fail' : 'pass', 
                detail: isGhostRider ? 'CRITICAL: Persistent GPS drift (>500m) from assigned route' : 'CONFIRMED: Real-time telemetry locked to verified nodes',
                icon: 'MapPin'
            },
            { 
                label: 'Temporal Velocity', 
                status: (isDisrupted && Math.random() > 0.6) ? 'warn' : 'pass', 
                detail: isDisrupted ? 'WARNING: Speed discrepancy vs environmental wind resistance' : 'NOMINAL: Instantaneous velocity aligns with weather pulse',
                icon: 'Zap'
            },
            { 
                label: 'Cluster Synchronization', 
                status: isClusterFraud ? 'fail' : 'pass', 
                detail: isClusterFraud ? 'ANOMALY: Packet collision/Spoofed node ID detected in local cluster' : 'SECURE: Encrypted telemetry heartbeat synchronized with region',
                icon: 'Activity'
            },
            { 
                label: 'Actuarial Trust Propensity', 
                status: actuarial.trustScore < 40 ? 'fail' : (actuarial.trustScore < 70 ? 'warn' : 'pass'), 
                detail: `Historical trust profile: ${actuarial.trustScore}% valid transactions`,
                icon: 'ShieldCheck'
            }
        ]
      };
    });


    // AUTO-LOGGING: Push these nodes into our session history for the Audit Ledger
    const loggedNodes = nodes.map(n => ({
        id: `TXN-SIM-${n.id.toUpperCase().slice(-6)}`,
        riderId: n.id,
        riderName: n.name,
        amount: n.payout.amount,
        status: n.payout.status === 'APPROVED' ? 'settled' : 'blocked',
        reason: n.payout.status === 'MITIGATED' ? n.fraud.reasons[0] : 'Parametric Trigger',
        location: location,
        weather: 'Heavy Rain',
        velocity: n.velocity,
        sensors: `Rainfall: ${n.signals.heavyRain.value}mm | Velocity: ${n.velocity}`,
        timestamp: new Date().toISOString(),
        isSimulation: true,
        nodeDetail: n // Store the full node for the expanded view in PayoutLogs
    }));
    
    simulationPool = [...loggedNodes, ...simulationPool].slice(0, 50); // Keep last 50

    return { location, timestamp: new Date().toISOString(), nodes };

  },

  // 6. Get Payouts / Audit Ledger
  async getPayouts(riderId = null) {
    if (useBackend) {
        try {
            const headers = await getAuthHeaders();
            const url = riderId ? `${API_URL}/api/payouts?riderId=${riderId}` : `${API_URL}/api/payouts`;
            const resp = await fetch(url, { headers });
            if (resp.ok) return await resp.json();
        } catch (e) {
            console.error("[DS] Backend Payouts failed, falling back", e);
        }
    }

    // MOCK LOGIC: If riderId is provided, ONLY return for that rider.
    // If rider is new (not in ridersData), return empty array.
    let pool = [];
    if (riderId) {
        pool = ridersData.filter(r => r.id === riderId || r.rider_id === riderId);
    } else {
        // Admin view or global audit
        pool = ridersData.slice(0, 10);
    }

    const mockLogs = pool.map(r => {
        const velocityBase = Math.floor(Math.random() * 25) + 32;
        const rainfall = (Math.random() * 60 + 20).toFixed(1);
        const status = Math.random() > 0.8 ? 'blocked' : 'settled';
        const trustVal = Math.floor(Math.random()*40 + 55);
        const baseEarningsPerDay = (parseFloat(r.past_week_earnings) || 5000) / 7;
        const amount = status === 'blocked' ? 0 : Math.round(Math.max(450, Math.min(baseEarningsPerDay * 1.15, 2800)) * (Math.random() * 0.2 + 0.9));
        
        return {
            id: `TXN-${(r.rider_id || r.id).toUpperCase().slice(-8)}`,
            riderId: r.rider_id || r.id,
            riderName: r.name || `Partner ${r.rider_id?.slice(-4)}`,
            amount: amount,
            status: status,
            reason: status === 'blocked' ? 'Clustered Heuristic Anomaly' : 'Parametric Environmental Trigger',
            location: r.city || 'Chennai',
            weather: 'Heavy Rain',
            velocity: `${velocityBase}km/h`,
            sensors: `Rainfall: ${rainfall}mm | Velocity: ${velocityBase}km/h`,
            timestamp: new Date(Date.now() - Math.random() * 10000000).toISOString(),
            nodeDetail: {
                id: r.rider_id || r.id,
                name: r.name || `Partner ${r.rider_id?.slice(-4)}`,
                trust_score: trustVal,
                velocity: `${velocityBase}km/h`,
                signals: { 
                    heavyRain: { value: rainfall, active: true, threshold: 25 },
                    highWind: { value: (Math.random() * 40 + 10).toFixed(1), active: false, threshold: 35 },
                    orderDrop: { value: (Math.random() * 30 + 50).toFixed(0), active: true, threshold: 45 }
                },
                heuristicChecks: [
                    { 
                        label: 'Geospatial Integrity', 
                        status: 'pass', 
                        detail: 'CONFIRMED: Real-time telemetry locked to verified nodes',
                        icon: 'MapPin'
                    },
                    { 
                        label: 'Temporal Velocity', 
                        status: 'pass', 
                        detail: 'NOMINAL: Instantaneous velocity aligns with weather pulse',
                        icon: 'Zap'
                    },
                    { 
                        label: 'Cluster Synchronization', 
                        status: status === 'blocked' ? 'fail' : 'pass', 
                        detail: status === 'blocked' ? 'ANOMALY: Packet collision detected in local cluster' : 'SECURE: Encrypted telemetry heartbeat synchronized',
                        icon: 'Activity'
                    }
                ],
                payout: { 
                    status: status === 'blocked' ? 'MITIGATED' : 'APPROVED',
                    math: { baseline: Math.round(baseEarningsPerDay), impact: 1.10, severity: 1.05 }, 
                    amount: amount
                }
            }
        };
    });

    return [...simulationPool, ...mockLogs];

  },

  // 7. Advanced Rider Management
  async registerRider(riderData) {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${API_URL}/api/rider/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(riderData)
    });
    return await resp.json();
  },

  async updateRiderProfile(id, updates) {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${API_URL}/api/rider/profile/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
    });
    return await resp.json();
  },

  // 8. Fraud Intelligence
  async getFraudAnalysis(eventId) {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${API_URL}/api/simulation/fraud/${eventId}`, { headers });
    if (resp.ok) return await resp.json();
    return null;
  },

  // 9. Payment Integration
  async createPaymentOrder(amount, riderId) {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount, riderId })
    });
    return await resp.json();
  },

  async verifyPayment(paymentDetails) {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${API_URL}/api/payment/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentDetails)
    });
    return await resp.json();
  },

  // 10. Weather Exposure
  async getLiveWeather(location) {
    try {
        const resp = await fetch(`${API_URL}/api/simulation/weather/live?location=${location}`);
        if (resp.ok) return await resp.json();
    } catch (e) {
        console.error("Weather fetch failed", e);
    }
    return { rainfall: 0, windSpeed: 10, temperature: 28, description: 'Clear' };
  },

  // 11. Profile Status
  async getRiderByUid(uid) {
    if (!uid) return null;
    try {
        const riders = await this.getRiders();
        return riders.find(r => r.id === uid || r.rider_id === uid);
    } catch (e) {
        return null;
    }
  },

  // 12. Real-time Subscriptions (NEW)
  subscribeToStats(callback) {
    // Listen to rider_profiles for global stats
    const q = query(collection(db, 'rider_profiles'));
    return onSnapshot(q, (snapshot) => {
        const riders = snapshot.docs.map(doc => doc.data());
        const totalRiders = riders.length;
        const activeRiders = riders.filter(r => r.is_active).length;
        const highRiskRiders = riders.filter(r => (parseFloat(r.fraud_probability) || 0) >= 0.5).length;
        
        // Calculate dynamic avg trust score
        const avgTrust = totalRiders > 0 
            ? (riders.reduce((acc, r) => acc + (parseFloat(r.trust_score) || 0), 0) / totalRiders).toFixed(1)
            : 0;

        callback({
            totalRiders,
            activeRiders,
            highRiskRiders,
            avgTrustScore: avgTrust,
            totalPremium: riders.reduce((acc, r) => acc + (parseFloat(r.weekly_premium) || 0), 0),
            riskTrend: [4, 6, 8, 5, 9, 12, 10] // Sample trend
        });
    });
  },

  subscribeToPayouts(callback, limitCount = 50) {
    const q = query(
        collection(db, 'payout_events'), 
        orderBy('feed_timestamp', 'desc'),
        limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Map forensic names to UI names if needed
            riderId: doc.data().rider_id,
            amount: doc.data().payout_amount,
            status: doc.data().payout_status?.toLowerCase(),
            timestamp: doc.data().feed_timestamp,
            reason: doc.data().payout_status === 'MITIGATED' ? 'Clustered Heuristic Anomaly' : 'Parametric Trigger'
        }));
        callback(logs);
    });
  }
};
