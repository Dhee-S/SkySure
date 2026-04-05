import ridersData from './ridersData.json';

// Vercel / Local Toggle: In production, API calls use relative paths (rewrites)
const useBackend = true;
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

// Helper: Calculate Premium based on Actuarial Logic (Fallback for UI)
const calculateActuarialData = (rider) => {
  const efficiency = parseFloat(rider.earning_efficiency) || 0.8;
  const baseRate = rider.tier === 'Pro' ? 180 : (rider.tier === 'Standard' ? 120 : 80);
  
  // Premium increases as efficiency drops (Risk goes up)
  const riskAdjustment = 1 + (1 - efficiency);
  const weeklyPremium = Math.round(baseRate * riskAdjustment);
  
  return {
    weeklyPremium,
    trustScore: Math.round(parseFloat(rider.trust_score) || 75),
    fraudProb: (parseFloat(rider.fraud_probability) || 0).toFixed(2),
    isActive: rider.is_active === 'True' || rider.is_active === true
  };
};

export const dataService = {
  // 1. Get Dashboard Stats (Live API)
  async getDashboardStats() {
    if (useBackend) {
        try {
            const resp = await fetch(`${API_URL}/api/stats`);
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
            const resp = await fetch(`${API_URL}/api/riders`);
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
            const resp = await fetch(`${API_URL}/api/riders/${id}`);
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
      const isMitigated = parseFloat(actuarial.fraudProb) > 0.5 && isDisrupted;
      
      return {
        id: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        persona: r.persona_type || 'Gig-Pro',
        trust_score: actuarial.trustScore,
        fraud_probability: parseFloat(actuarial.fraudProb),
        isDisrupted,
        activeSignalCount: isDisrupted ? 3 : 0,
        severityScore: isDisrupted ? 1.85 : 0.45,
        signals: {
          heavyRain: { value: (Math.random() * 50).toFixed(1), active: isDisrupted },
          highWind: { value: (Math.random() * 60).toFixed(1), active: Math.random() > 0.7 },
          orderDrop: { value: (Math.random() * 100).toFixed(0), active: isDisrupted },
          riderInactive: { active: isDisrupted },
          lowVisibility: { value: (Math.random() * 5).toFixed(1), active: Math.random() > 0.8 },
          abnormalDeliveryTime: { value: (Math.random() * 45).toFixed(0), active: Math.random() > 0.7 }
        },
        payout: {
          status: isMitigated ? 'MITIGATED' : (isDisrupted ? 'APPROVED' : 'NOMINAL'),
          amount: isDisrupted ? (isMitigated ? 0 : Math.round(parseFloat(r.predicted_payout) || 450)) : 0,
          math: { cap: 1500, severity: isDisrupted ? 0.95 : 0, confidence: actuarial.trustScore / 100 }
        }
      };
    });
    return { nodes };
  },

  // 6. Get Payouts / Audit Ledger
  async getPayouts(riderId = null) {
    if (useBackend) {
        try {
            const url = riderId ? `${API_URL}/api/payouts?riderId=${riderId}` : `${API_URL}/api/payouts`;
            const resp = await fetch(url);
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
        amount: Math.round(parseFloat(r.predicted_payout) || 450),
        status: Math.random() > 0.7 ? 'blocked' : 'settled',
        reason: 'Parametric Fallback Logic',
        timestamp: new Date().toISOString()
    }));
  }
};
