import ridersData from './ridersData.json';

import { auth } from '../firebase';

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
    const clusterRiders = ridersData.filter(r => r.city === location).slice(0, 15);
    const nodes = clusterRiders.map(r => {
      const isDisrupted = Math.random() > 0.4;
      const actuarial = calculateActuarialData(r);
      
      // Forced Anomalies in Mock (30% total risk rate)
      const dice = Math.random();
      const isGhostRider = dice > 0.85;
      const isClusterFraud = dice > 0.70 && dice <= 0.85;
      const isMitigated = isGhostRider || isClusterFraud || (parseFloat(actuarial.fraudProb) > 0.6 && isDisrupted);
      
      const reasonTags = isGhostRider ? ["Potential Ghost Riding Node"] : isClusterFraud ? ["Cluster Sync Anomaly"] : ["Clean Telemetry Signature"];

      return {
        id: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        persona: r.persona_type || 'Gig-Pro',
        trust_score: isMitigated ? Math.max(5, actuarial.trustScore - 30) : actuarial.trustScore,
        fraud_probability: isMitigated ? 0.75 : parseFloat(actuarial.fraudProb),
        isDisrupted,
        activeSignalCount: isDisrupted ? 3 : 0,
        severityScore: isDisrupted ? 1.85 : 0.45,
        fraud: {
           score: isMitigated ? 75 : 15,
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
        payout: {
          status: isMitigated ? 'MITIGATED' : (isDisrupted ? 'APPROVED' : 'NOMINAL'),
          amount: isDisrupted ? (isMitigated ? 0 : Math.round(Math.min(parseFloat(r.past_week_earnings) / 7, 1200) * 0.85 * 0.95 * (actuarial.trustScore / 100))) : 0,
          math: { 
            baseline: Math.round(parseFloat(r.past_week_earnings) / 7),
            impact: 0.85, 
            severity: isDisrupted ? 0.95 : 0, 
            confidence: actuarial.trustScore / 100 
          }
        }
      };
    });
    return { nodes };
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

    let pool = ridersData;
    if (riderId) pool = pool.filter(r => r.id === riderId || r.rider_id === riderId);
    return pool.slice(0, 10).map(r => ({
        id: `TXN-${(r.rider_id || r.id).toUpperCase().slice(-8)}`,
        riderId: r.rider_id || r.id,
        riderName: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        amount: (r.probation_status === 'True' || r.probation_status === true) ? 150 : Math.round(parseFloat(r.predicted_payout) || 450),
        status: Math.random() > 0.7 ? 'blocked' : 'settled',
        reason: 'Parametric Fallback Logic',
        location: r.city || 'Chennai',
        weather: 'Heavy Rain',
        timestamp: new Date().toISOString()
    }));
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
  }
};
