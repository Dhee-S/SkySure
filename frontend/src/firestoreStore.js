import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

let app = null;
let db = null;
let isFirebaseInitialized = false;
let useFirestore = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  if (firebaseConfig.apiKey !== "demo-key") {
    isFirebaseInitialized = true;
    useFirestore = true;
  }
} catch (e) {
  console.log("Firebase not initialized - using localStorage");
}

const STORAGE_KEY = 'skysure_data_v2';

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadLocalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function getRiders() {
  if (useFirestore && isFirebaseInitialized) {
    const snapshot = await getDocs(collection(db, 'riders'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const data = loadLocalData();
  return data ? data.riders || [] : [];
}

export async function enrollRider({ name, tier, phone, vehicleType, location, primaryZone, city, state }) {
  const newRider = {
    id: generateId(),
    name, tier: tier || 'Standard', phone: phone || '',
    vehicleType: vehicleType || 'Bike', status: 'Active',
    totalPayouts: 0, enrolledAt: new Date().toISOString(),
    location, primaryZone: primaryZone || city || 'Unknown',
    city: city || 'Unknown', state: state || 'Tamil Nadu', zones: [], avgLocation: location
  };

  const data = loadLocalData() || { riders: [], payouts: [], simulations: [], settings: {} };
  data.riders.push(newRider);
  saveLocalData(data);
  return { id: newRider.id, message: `Rider ${name} enrolled` };
}

export async function removeRider(riderId) {
  const data = loadLocalData();
  data.riders = (data.riders || []).filter(r => r.id !== riderId);
  saveLocalData(data);
  return { message: 'Rider removed' };
}

export async function getPayoutLogs() {
  const data = loadLocalData();
  return data?.payouts || [];
}

export async function logPayout(payoutData) {
  const log = { id: generateId(), ...payoutData, timestamp: new Date().toISOString() };
  const data = loadLocalData() || { riders: [], payouts: [], simulations: [], settings: {} };
  data.payouts.unshift(log);
  if (data.payouts.length > 100) data.payouts = data.payouts.slice(0, 100);
  saveLocalData(data);
  return { id: log.id };
}

export async function getAnalytics() {
  const riders = await getRiders();
  const payouts = await getPayoutLogs();
  const totalPaid = payouts.filter(p => p.payout > 0).reduce((sum, p) => sum + p.payout, 0);
  return {
    totalRiders: riders.length,
    totalPayouts: totalPaid,
    totalPayoutEvents: payouts.filter(p => p.payout > 0).length,
    totalFraudFlags: payouts.filter(p => p.fraudFlag).length,
    avgPayout: payouts.filter(p => p.payout > 0).length ? Math.round(totalPaid / payouts.filter(p => p.payout > 0).length) : 0,
  };
}

export async function seedSampleRiders() {
  const existing = await getRiders();
  if (existing.length > 0) return;

  const sampleRiders = [
    { id: 'r1', name: 'Karthik Raja', tier: 'Pro', phone: '+91 98765 40001', vehicleType: 'Bike', status: 'Active', totalPayouts: 3200, city: 'Chennai', state: 'Tamil Nadu' },
    { id: 'r2', name: 'Divya Lakshmi', tier: 'Standard', phone: '+91 98765 40002', vehicleType: 'Scooter', status: 'Active', totalPayouts: 1800, city: 'Chennai', state: 'Tamil Nadu' },
    { id: 'r3', name: 'Vignesh Kumar', tier: 'Basic', phone: '+91 98765 40003', vehicleType: 'Bike', status: 'Active', totalPayouts: 750, city: 'Coimbatore', state: 'Tamil Nadu' },
    { id: 'r4', name: 'Sundari Muthu', tier: 'Standard', phone: '+91 98765 40004', vehicleType: 'Scooter', status: 'Active', totalPayouts: 1450, city: 'Madurai', state: 'Tamil Nadu' },
    { id: 'r5', name: 'Muthuraj Pandian', tier: 'Pro', phone: '+91 98765 40005', vehicleType: 'Bike', status: 'Active', totalPayouts: 2800, city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  ];

  for (const r of sampleRiders) {
    const data = loadLocalData() || { riders: [], payouts: [], simulations: [], settings: {} };
    data.riders.push({ ...r, enrolledAt: new Date().toISOString() });
    saveLocalData(data);
  }
  await seedSamplePayouts();
}

async function seedSamplePayouts() {
  const tiers = ['Pro', 'Standard', 'Basic', 'Standard', 'Pro'];
  const cities = ['Chennai', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'];
  const payouts = [3200, 1800, 750, 1450, 2800];

  for (let i = 0; i < 5; i++) {
    await logPayout({
      riderId: `r${i + 1}`, riderName: ['Karthik Raja', 'Divya Lakshmi', 'Vignesh Kumar', 'Sundari Muthu', 'Muthuraj Pandian'][i],
      riderTier: tiers[i], city: cities[i], payout: payouts[i], tier: 'HIGH', disruption: true, fraudFlag: false,
      signals: { heavyRain: true, riderInactive: true }, rainfallMm: 15
    });
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  return { message: 'Data reset' };
}