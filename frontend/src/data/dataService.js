import { getRiders, seedSampleRiders } from './mockStore';

const API_BASE = '/api';
const useBackend = true;

export const dataService = {
  // 1. Get Dashboard Stats
  async getDashboardStats() {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }

    // Fallback
    const riders = await getRiders();
    return {
      totalRiders: riders.length,
      activeRiders: riders.length,
      highRiskRiders: 0,
      avgFraudProb: '0%',
      premiumCollected: 0,
      riskTrend: []
    };
  },

  // 2. Get All Riders
  async getRiders() {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/riders`);
        const data = await res.json();
        return data.map(r => ({
          ...r,
          riderId: r.id, // Compatibility with existing logic
          restaurantCoords: r.restaurant_coords,
          deliveryCoords: r.delivery_coords
        }));
      } catch (err) {
        console.error('Error fetching riders:', err);
      }
    }

    return await seedSampleRiders();
  },

  // 3. Get Specific Rider
  async getRider(id) {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/riders/${id}`);
        return await res.json();
      } catch (err) {
        console.error('Error fetching rider:', err);
      }
    }

    const riders = await getRiders();
    return riders.find(r => r.id === id) || null;
  },

  // 4. Get Premium Logic
  async getPremium(id) {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/premium/${id}`);
        return await res.json();
      } catch (err) {
        console.error('Error fetching premium:', err);
      }
    }

    return { tier: 'Standard', weeklyPremium: 35 };
  },

  // 5. Run Full Simulation (Batch)
  async runSimulation(payload) {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/simulation/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return await res.json();
      } catch (err) {
        console.error('Error running simulation:', err);
        throw err;
      }
    }
    return null;
  },

  // 6. Check Trigger Only
  async checkTrigger(payload) {
    if (useBackend) {
      try {
        const res = await fetch(`${API_BASE}/trigger/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return await res.json();
      } catch (err) {
        console.error('Error checking trigger:', err);
      }
    }
    return null;
  },

  // 7. Get Payout Logs
  async getPayouts(riderId = null) {
    if (useBackend) {
      try {
        const url = riderId ? `${API_BASE}/payouts?riderId=${riderId}` : `${API_BASE}/payouts`;
        const res = await fetch(url);
        return await res.json();
      } catch (err) {
        console.error('Error fetching payouts:', err);
      }
    }
    return [];
  }
};
