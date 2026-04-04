import ridersData from './riders_sample.json';

const STORAGE_KEY = 'skysure_data_v2';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randDelay = () => delay(200 + Math.random() * 400);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getDefaultData() {
  return {
    riders: [],
    payouts: [],
    simulations: [],
    historicalEvents: [],
    settings: {
      companyName: 'SkySure',
      autoSimulation: false,
    },
    initialized: false,
  };
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return { ...getDefaultData(), ...data };
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return getDefaultData();
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

const sampleRiders = ridersData;

const CITY_COORDS = {
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Coimbatore: { lat: 11.0168, lon: 76.9558 },
  Madurai: { lat: 9.9194, lon: 78.1193 },
  Tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
  Salem: { lat: 11.6643, lon: 78.1460 },
  Vellore: { lat: 12.9165, lon: 79.1325 },
  Tirunelveli: { lat: 8.7139, lon: 77.7566 },
  Erode: { lat: 11.3410, lon: 77.7172 },
  Dindigul: { lat: 10.3694, lon: 77.9776 },
  Thanjavur: { lat: 10.7872, lon: 79.1378 },
};

const payoutReasons = [
  'Heavy rain disruption + order drop',
  'Thunderstorm triggered multi-signal event',
  'Severe weather with low rider activity',
  'Critical weather severity detected',
  'High wind + visibility disruption',
];

const fraudReasons = [
  'Rain correlation detected - inactive only during rain',
  'Payout velocity spike suspicious',
  'Ghost rider - no movement detected',
  'Synced inactivity with other riders',
  'Behavioral anomaly detected',
  'Cluster anomaly - inactivity exceeds weather',
];

function generateRiderHistory() {
  const history = [];
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    history.push({
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      active: Math.random() > 0.3,
      rainfallMm: Math.random() * 22,
      payout: Math.random() > 0.6 ? [300, 500, 700, 1000][Math.floor(Math.random() * 4)] : 0,
      deliveryTime: 25 + Math.floor(Math.random() * 50),
    });
  }
  return history;
}

function generateSamplePayouts(riders) {
  const payouts = [];
  const now = Date.now();
  const weatherPool = [
    { weather: 'Light Drizzle', rainfallMm: 3 },
    { weather: 'Moderate Rain', rainfallMm: 8 },
    { weather: 'Heavy Rain', rainfallMm: 15 },
    { weather: 'Thunderstorm', rainfallMm: 22 },
    { weather: 'Clear Sky', rainfallMm: 0 },
  ];
  
  for (let i = 0; i < 25; i++) {
    const rider = riders[Math.floor(Math.random() * riders.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
    
    const isFraud = Math.random() < 0.2;
    const entry = weatherPool[Math.floor(Math.random() * weatherPool.length)];
    
    payouts.push({
      id: generateId(),
      riderId: rider.id,
      riderName: rider.name,
      amount: isFraud ? 0 : [300, 500, 700, 1000][Math.floor(Math.random() * 4)],
      reason: isFraud ? fraudReasons[Math.floor(Math.random() * fraudReasons.length)] : payoutReasons[Math.floor(Math.random() * payoutReasons.length)],
      weather: entry.weather,
      rainfallMm: entry.rainfallMm,
      severityScore: isFraud ? [1.5, 2.0, 2.5][Math.floor(Math.random() * 3)] : [1.5, 2.5, 3.5, 4.0, 5.0][Math.floor(Math.random() * 5)],
      timestamp: new Date(timestamp).toISOString(),
      status: isFraud ? 'blocked' : 'completed',
    });
  }
  
  return payouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function seedSampleRiders() {
  const data = loadData();
  
  if (data.riders.length === 0 && !data.initialized) {
    data.riders = sampleRiders.map(r => {
      const cityCoords = CITY_COORDS[r.city] || CITY_COORDS.Chennai;
      const jitter = () => (Math.random() - 0.5) * 0.05;
      return {
        ...r,
        id: r.rider_id || generateId(),
        enrolledAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),

        status: 'active',
        totalPayouts: 0,
        payoutCount: 0,
        consistencyRatio: 0.5 + Math.random() * 0.4,
        state: 'Tamil Nadu',
        location: { lat: cityCoords.lat + jitter(), lon: cityCoords.lon + jitter(), name: r.zone },
        avgLocation: { lat: cityCoords.lat + jitter(), lon: cityCoords.lon + jitter() },
        zones: Object.values(CITY_COORDS),
        history: generateRiderHistory(),
        // New attributes
        ring_score: 0.1 + Math.random() * 0.2,
        acceptance_rate: 0.8 + Math.random() * 0.2,
        customer_rating: 4.0 + Math.random() * 1.0,
        onboarding_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        past_week_earnings: r.past_week_earnings || (4000 + Math.random() * 4000),
        persona_type: r.persona_type || ['Full-Timer', 'Student-Flex', 'Weekend-Warrior'][Math.floor(Math.random() * 3)],
        active_policy: r.active_policy !== undefined ? r.active_policy : true,
        weekly_premium_inr: r.tier === 'Pro' ? 49 : r.tier === 'Standard' ? 35 : 19,
        coverage_amount_inr: r.tier === 'Pro' ? 25000 : r.tier === 'Standard' ? 15000 : 5000,
        base_pay_per_order_inr: 40,
      };
    });
    data.payouts = generateSamplePayouts(data.riders);
    
    data.riders.forEach(rider => {
      const riderPayouts = data.payouts.filter(p => p.riderId === rider.id);
      rider.totalPayouts = riderPayouts.reduce((sum, p) => sum + p.amount, 0);
      rider.payoutCount = riderPayouts.length;
    });
    
    data.initialized = true;
    saveData(data);
  }
  
  return data.riders;
}

export async function getRiders() {
  await randDelay();
  const data = loadData();
  return data.riders.length > 0 ? data.riders : seedSampleRiders();
}

export async function getRider(id) {
  await randDelay();
  const data = loadData();
  const rider = data.riders.find(r => r.id === id || r.rider_id === id);
  // Fallback map if needed 
  if(rider && !rider.location && rider.latitude) {
      rider.location = { lat: parseFloat(rider.latitude), lon: parseFloat(rider.longitude) };
  }
  return rider || null;
}

export async function enrollRider({ name, tier, phone, vehicleType, city, zone, location, avgLocation, zones }) {
  await randDelay();
  const data = loadData();
  
  const t = tier || 'Standard';
  const newRider = {
    id: generateId(),
    name,
    tier: t,
    phone: phone || '',
    vehicleType: vehicleType || 'Motorcycle',
    city: city || 'Chennai',
    zone: zone || 'Central',
    state: 'Tamil Nadu',
    enrolledAt: new Date().toISOString(),
    status: 'active',
    totalPayouts: 0,
    payoutCount: 0,
    consistencyRatio: 0.5,
    location: location || { lat: 13.0827, lon: 80.2707 },
    avgLocation: avgLocation || { lat: 13.0827, lon: 80.2707 },
    zones: zones || [],
    history: generateRiderHistory(),
    ring_score: 0.1 + Math.random() * 0.15,
    acceptance_rate: 0.85 + Math.random() * 0.15,
    customer_rating: 4.0 + Math.random() * 1.0,
    onboarding_date: new Date().toISOString(),
    past_week_earnings: 4000 + Math.random() * 4000,
    persona_type: 'Gig-Rider',
    active_policy: true,
    weekly_premium_inr: t === 'Pro' ? 49 : t === 'Standard' ? 35 : 19,
    coverage_amount_inr: t === 'Pro' ? 25000 : t === 'Standard' ? 15000 : 5000,
    base_pay_per_order_inr: 40,
    engagement_type: 'Full-time',
    age: 25,
    gender: 'M',
  };
  
  data.riders.push(newRider);
  saveData(data);
  
  return newRider;
}

export async function removeRider(id) {
  await randDelay();
  const data = loadData();
  data.riders = data.riders.filter(r => r.id !== id);
  saveData(data);
  return true;
}

export async function updateRiderPayouts(riderId, amount) {
  const data = loadData();
  const rider = data.riders.find(r => r.id === riderId);
  
  if (rider) {
    rider.totalPayouts = (rider.totalPayouts || 0) + amount;
    rider.payoutCount = (rider.payoutCount || 0) + 1;
    saveData(data);
  }
  
  return rider;
}

export async function getPayoutLogs() {
  await randDelay();
  const data = loadData();
  return data.payouts;
}

export async function getRiderPayouts(riderId) {
  await randDelay();
  const data = loadData();
  return data.payouts.filter(p => p.riderId === riderId);
}

export async function logPayout(data) {
  const store = loadData();
  
  const payout = {
    ...data,
    id: generateId(),
    timestamp: new Date().toISOString(),
    status: data.status || 'completed',
  };
  
  store.payouts.unshift(payout);
  
  if (store.payouts.length > 100) {
    store.payouts = store.payouts.slice(0, 100);
  }
  
  saveData(store);
  return payout;
}

export async function logSimulation(data) {
  const store = loadData();
  
  const simulation = {
    ...data,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  
  store.simulations.unshift(simulation);
  
  if (store.simulations.length > 50) {
    store.simulations = store.simulations.slice(0, 50);
  }
  
  data.results?.forEach(result => {
    store.historicalEvents.push({
      riderId: result.riderId,
      riderName: result.riderName,
      active: result.behavior?.riderActive,
      weather: result.weather,
      payout: result.payout?.payout,
      deliveryTime: result.behavior?.avgDeliveryTimeMin,
      timestamp: result.timestamp,
    });
  });
  
  saveData(store);
  return simulation;
}

export async function getHistoricalEvents(riderId) {
  const data = loadData();
  if (riderId) {
    return data.historicalEvents.filter(e => e.riderId === riderId);
  }
  return data.historicalEvents;
}

export async function getAnalytics() {
  const data = loadData();
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyPayouts = data.payouts.filter(p => new Date(p.timestamp) >= thisMonth);
  const totalPayouts = data.payouts.reduce((sum, p) => sum + p.amount, 0);
  const monthlyTotal = monthlyPayouts.reduce((sum, p) => sum + p.amount, 0);
  const fraudFlags = data.payouts.filter(p => p.status === 'blocked').length;
  
  return {
    totalRiders: data.riders.length,
    activeRiders: data.riders.filter(r => r.status === 'active').length,
    totalPayouts,
    monthlyPayouts: monthlyTotal,
    avgPayout: data.payouts.length > 0 ? Math.round(totalPayouts / data.payouts.length) : 0,
    totalEvents: data.payouts.length,
    monthlyEvents: monthlyPayouts.length,
    fraudFlags,
    totalPremiums: data.riders.length * 45 * 12, // Simulation: 12 weeks of premium
    recentActivity: data.simulations.slice(0, 5),
  };
}

export async function getSettings() {
  const data = loadData();
  return data.settings;
}

export async function updateSettings(settings) {
  const data = loadData();
  data.settings = { ...data.settings, ...settings };
  saveData(data);
  return data.settings;
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('skysure_weather_cache');
  return seedSampleRiders();
}
