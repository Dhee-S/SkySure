import ridersData from './ridersData.json';

const useBackend = false; // Forced false for Instant Showcase Mode

// Helper: Calculate Premium based on Actuarial Logic
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
  // 1. Get Dashboard Stats (Harmonized Keys)
  async getDashboardStats() {
    const riders = ridersData;
    const mapped = riders.map(r => calculateActuarialData(r));
    
    const highRisk = riders.filter(r => (parseFloat(r.fraud_probability) || 0) >= 0.5).length;
    const totalPremium = mapped.reduce((acc, r) => acc + r.weeklyPremium, 0);
    const avgTrust = mapped.reduce((acc, r) => acc + r.trustScore, 0) / riders.length;

    return {
      totalRiders: riders.length,
      highRiskRiders: highRisk,
      activeRiders: riders.filter(r => r.is_active === 'True').length,
      avgTrustScore: avgTrust.toFixed(1),
      totalPremium: totalPremium, // Send as Number to prevent NaN
      riskTrend: [4, 6, 8, 5, 9, 12, 10]
    };
  },

  // 2. Get All Riders (Mapped for UI Consistency)
  async getRiders() {
    return ridersData.map(r => {
      const actuarial = calculateActuarialData(r);
      return {
        ...r,
        id: r.rider_id || r.id,
        riderId: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.split('_').pop() || r.id?.slice(-4)}`,
        weeklyPremium: actuarial.weeklyPremium,
        trustScore: actuarial.trustScore,
        risk: {
          level: actuarial.fraudProb >= 0.5 ? 'High' : (actuarial.fraudProb >= 0.3 ? 'Medium' : 'Low'),
          score: actuarial.fraudProb
        }
      };
    });
  },

  // 3. Get Specific Rider
  async getRider(id) {
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

  // 4. Get Premium (Uses same engine)
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
    const { location } = payload;
    
    // Filter riders for the specific cluster
    const clusterRiders = ridersData.filter(r => r.city === location).slice(0, 15);
    
    const nodes = clusterRiders.map(r => {
      const actuarial = calculateActuarialData(r);
      const isDisrupted = Math.random() > 0.4; // Simulate parametric event
      
      // Generate High-Fidelity Signal Telemetry
      const signals = {
        heavyRain: { value: (Math.random() * 50).toFixed(1), threshold: 25, active: isDisrupted },
        highWind: { value: (Math.random() * 60).toFixed(1), threshold: 35, active: Math.random() > 0.7 },
        orderDrop: { value: (Math.random() * 100).toFixed(0), threshold: 40, active: isDisrupted },
        riderInactive: { active: isDisrupted },
        lowVisibility: { value: (Math.random() * 5).toFixed(1), active: Math.random() > 0.8 },
        abnormalDeliveryTime: { value: (Math.random() * 45).toFixed(0), active: Math.random() > 0.7 }
      };

      const fraudProb = parseFloat(actuarial.fraudProb);
      const isMitigated = fraudProb > 0.5 && isDisrupted;
      
      return {
        id: r.rider_id || r.id,
        name: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        persona: r.persona_type || 'Gig-Pro',
        trust_score: actuarial.trustScore,
        fraud_probability: fraudProb,
        isDisrupted,
        activeSignalCount: isDisrupted ? 3 : 0,
        severityScore: isDisrupted ? 1.85 : 0.45,
        payout: {
          status: isMitigated ? 'MITIGATED' : (isDisrupted ? 'APPROVED' : 'NOMINAL'),
          amount: isDisrupted ? (isMitigated ? 0 : Math.round(parseFloat(r.predicted_payout) || 450)) : 0,
          math: {
            cap: 1500,
            severity: isDisrupted ? 0.95 : 0,
            confidence: actuarial.trustScore / 100
          }
        },
        fraud: {
          reasons: isMitigated ? ['High Fraud History', 'Ring Score Threshold Breached'] : []
        }
      };
    });

    return { nodes };
  },

  async checkTrigger(payload) {
    const { weather, traffic, orderDrop } = payload;
    let signals = 0;
    if (weather === 'Stormy') signals += 1;
    if (traffic === 'High') signals += 1;
    if (parseFloat(orderDrop) > 0.4) signals += 1;
    return { trigger: signals >= 2, signals };
  },

  async getPayouts(riderId = null) {
    let pool = ridersData;
    if (riderId) pool = pool.filter(r => r.id === riderId || r.rider_id === riderId);
    
    return pool.slice(0, 10).map(r => ({
        id: `TXN-${(r.rider_id || r.id).toUpperCase().slice(-8)}`,
        riderId: r.rider_id || r.id,
        riderName: r.name || `Partner ${r.rider_id?.slice(-4)}`,
        amount: Math.round(parseFloat(r.predicted_payout) || 450),
        status: Math.random() > 0.7 ? 'blocked' : 'settled',
        reason: Math.random() > 0.5 ? 'Parametric Trigger: Precipitation' : 'Heuristic Anomaly: Segment Time',
        timestamp: new Date().toISOString()
    }));
  }
};
