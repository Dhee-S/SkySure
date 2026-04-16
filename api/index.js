/**
 * SkySure API — api/index.js
 *
 * Optimized for Vercel Serverless:
 *  - No module-level mutable state (riders[] is request-scoped via getriders())
 *  - No duplicate route for /api/simulation/batch (owned by simulationRoutes)
 *  - Firebase Admin initialised once via shared firebase.js module
 *  - All routes return consistent { data } | { error } shapes
 *  - OPTIONS pre-flight handled globally for Vercel CORS
 */

'use strict';

const express    = require('express');
const csv        = require('csv-parser');
const fs         = require('fs');
const cors       = require('cors');
const path       = require('path');
const { db }     = require('./firebase');

const app = express();

/* ─── CORS ──────────────────────────────────────────────────────────────── */
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

/* ─── DATA LAYER ─────────────────────────────────────────────────────────
   getriders() is called per-request so Vercel serverless instances never
   serve stale module-level state across cold/warm boundaries.
   Priority: Firestore → CSV fallback.
──────────────────────────────────────────────────────────────────────────── */
const CSV_PATH = path.resolve(__dirname, '..', 'data', 'skysure_v4_1k.csv');

function normaliseRider(raw, id) {
  const [lat, lng] = (raw.coordinates || '13.0827,80.2707')
    .split(',')
    .map(v => parseFloat(v.trim()));

  // 1. DATA PARSING
  const efficiency = parseFloat(raw.earning_efficiency) || 0.8;
  const isProbation = raw.probationary_tier === 'True' || raw.probationary_tier === true;
  
  // 2. ACTUARIAL / ML DATA
  const fraudProb = parseFloat(raw.fraud_probability) || 0.05;
  const isFraud = raw.is_fraud === 1 || raw.is_fraud === '1' || raw.is_fraud === true;

  return {
    ...raw,
    id:                raw.rider_id || id,
    rider_id:          raw.rider_id || id,
    name:              raw.name || `Partner ${id.slice(-4)}`,
    trust_score:       raw.trust_score || Math.round((1 - fraudProb) * 100),
    fraud_probability: fraudProb,
    is_fraud:          isFraud,
    weekly_premium:    parseFloat(raw.weekly_premium)    || 120,
    earning_efficiency:efficiency,
    ring_score:        parseFloat(raw.ring_score)        || 0,
    predicted_payout:  parseFloat(raw.predicted_payout)  || 450,
    probation_status:  isProbation,
    coordinates:       { lat, lng },
    session_time_hhmm: raw.session_time_hhmm || '06:30',
    payout_history:    raw.payout_history || []
  };
}

async function getFirestoreRiders() {
  if (!db) throw new Error('Firestore unavailable');

  const snapshot = await db.collection('rider_profiles').limit(1000).get();
  if (snapshot.empty) throw new Error('Firestore collection empty');

  return snapshot.docs.map(doc => normaliseRider({ ...doc.data() }, doc.id));
}

function getCsvRiders() {
  return new Promise((resolve) => {
    if (!fs.existsSync(CSV_PATH)) {
      console.error('[CSV] File not found:', CSV_PATH);
      return resolve([]);
    }

    const results = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => {
        const shuffled  = results.sort(() => 0.5 - Math.random());
        const selected  = shuffled.slice(0, 500).map(r => normaliseRider(r, r.rider_id));
        console.log(`[CSV] Loaded ${selected.length} riders`);
        resolve(selected);
      })
      .on('error', err => {
        console.error('[CSV] Parse error:', err);
        resolve([]);
      });
  });
}

/**
 * Primary data accessor — always fresh, never stale module state.
 * Exported so simulationRoutes can reuse the same source-of-truth.
 */
async function getriders() {
  try {
    const riders = await getFirestoreRiders();
    return { riders, source: 'firestore' };
  } catch (err) {
    const riders = await getCsvRiders();
    return { riders, source: 'csv' };
  }
}

/* ─── ROUTE: Mount simulation sub-router FIRST ───────────────────────────
   simulationRoutes owns everything under /api/simulation/*.
   index.js must NOT define any route under that prefix.
──────────────────────────────────────────────────────────────────────────── */
const simulationRoutes = require('./src/routes/simulationRoutes');
const riderRoutes = require('./src/routes/riderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

app.use('/api/simulation', simulationRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/payment', paymentRoutes);

/* ─── ROUTE: GET /api/health ─────────────────────────────────────────────
   Quick liveness probe for Vercel / uptime monitors.
──────────────────────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    firebase:  db ? 'connected' : 'csv-fallback',
  });
});

/* ─── ROUTE: GET /api/stats ──────────────────────────────────────────────
   Aggregate dashboard metrics.
──────────────────────────────────────────────────────────────────────────── */
app.get('/api/stats', async (req, res) => {
  try {
    const { riders, source } = await getriders();

    const totalRiders  = riders.length;
    const highRisk     = riders.filter(r => r.fraud_probability >= 0.5).length;
    const activeRiders = riders.filter(r =>
      r.is_active === 'True' || r.is_active === true
    ).length;

    const totalPremium = riders.reduce((acc, r) => {
      const val = parseFloat(r.weekly_premium) || 120;
      const surcharge = (r.probation_status === true) ? 3 : 1;
      return acc + (val * surcharge);
    }, 0);

    const avgTrust = totalRiders > 0
      ? (riders.reduce((acc, r) => acc + (parseFloat(r.trust_score) || 0), 0) / totalRiders).toFixed(1)
      : '0.0';

    res.json({
      totalRiders,
      highRiskRiders: highRisk,
      activeRiders,
      totalPremium:   Math.round(totalPremium),
      avgTrustScore:  avgTrust,
      source,          // lets frontend know if it's live or fallback
    });
  } catch (e) {
    console.error('[/api/stats]', e);
    res.status(500).json({ error: 'Stats aggregation failed' });
  }
});

/* ─── ROUTE: GET /api/riders ─────────────────────────────────────────────
   Full rider list mapped for the UI table.
──────────────────────────────────────────────────────────────────────────── */
app.get('/api/riders', async (req, res) => {
  try {
    const { riders, source } = await getriders();

    const mapped = riders.map(r => {
      const fraudVal   = r.fraud_probability;
      const basePremium = r.weekly_premium;
      const isProbation = r.probation_status;

      return {
        id:           r.rider_id,
        riderId:      r.rider_id,
        name:         r.name || r.rider_name || `Partner ${r.rider_id?.split('_').pop()}`,
        city:         r.city || 'Chennai',
        persona_type: r.persona_type || 'Gig-Pro',
        tier:         r.tier || 'Standard',
        // Adaptive Trust Score: (1 - fraud_probability) * 100
        trust_score:  Math.round((1 - fraudVal) * 100),
        trustScore:   Math.round((1 - fraudVal) * 100), 
        fraud_probability: fraudVal,
        probation_status: isProbation,
        isProbation:      isProbation, 
        weeklyPremium: Math.round(basePremium * (isProbation ? 3 : 1)),
        risk: {
          level: isProbation ? 'High' : fraudVal >= 0.4 ? 'Medium' : 'Low',
          score: parseFloat(fraudVal.toFixed(3)),
        },
        coordinates: r.coordinates,
      };
    });

    res.json(mapped); // Return as array for frontend compatibility
  } catch (e) {
    console.error('[/api/riders]', e);
    res.status(500).json({ error: 'Rider list fetch failed' });
  }
});

/* ─── ROUTE: GET /api/riders/:id ─────────────────────────────────────────
   Single rider detail — consistent field names for simulation engine.
──────────────────────────────────────────────────────────────────────────── */
app.get('/api/riders/:id', async (req, res) => {
  try {
    const { riders } = await getriders();
    const rider = riders.find(r => r.rider_id === req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    res.json({
      id:                 rider.rider_id,
      name:               rider.name || rider.rider_name || `Partner ${rider.rider_id?.split('_').pop()}`,
      city:               rider.city,
      persona_type:       rider.persona_type,
      coordinates:        rider.coordinates,
      session_time_hhmm:  rider.session_time_hhmm,  // canonical field name
      earning_efficiency: rider.earning_efficiency,
      trust_score:        rider.trust_score,
      fraud_probability:  rider.fraud_probability,
      weekly_premium:     rider.weekly_premium,
      tier:               rider.tier || 'Standard',
      probation_status:   rider.probation_status,
    });
  } catch (e) {
    console.error('[/api/riders/:id]', e);
    res.status(500).json({ error: 'Rider fetch failed' });
  }
});

/* ─── ROUTE: GET /api/payouts ──────────────────────────────────────────────
   Audit Ledger: pulls from the payout_events collection.
──────────────────────────────────────────────────────────────────────────── */
app.get('/api/payouts', async (req, res) => {
  try {
    const { riderId } = req.query;
    
    let query = db.collection('payout_events').orderBy('feed_timestamp', 'desc');
    if (riderId) {
      query = query.where('rider_id', '==', riderId);
    }
    
    const snapshot = await query.limit(100).get();
    const logs = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id:         d.payout_txn_id || doc.id,
        riderId:    d.rider_id,
        riderName:  d.rider_name || `Partner ${d.rider_id?.split('_').pop()}`,
        timestamp:  d.feed_timestamp,
        status:     d.payout_status?.toLowerCase(),
        amount:     d.payout_amount,
        reason:     d.environmental_trigger || d.reason || 'Parametric Trigger',
        weather:    d.weather_at_trigger || d.weather,
        location:   d.location || 'Chennai'
      };
    });

    res.json(logs);
  } catch (e) {
    console.error('[/api/payouts]', e);
    // Silent Fallback: if payout_events empty, return empty array instead of 500
    res.json([]);
  }
});

/* ─── STATIC FRONTEND ────────────────────────────────────────────────────
   Only active on Render / local dev — Vercel serves the frontend build
   via the rewrites config in vercel.json, not through Express.
──────────────────────────────────────────────────────────────────────────── */
if (process.env.RENDER || (process.env.NODE_ENV !== 'production' && !process.env.VERCEL)) {
  const FRONTEND_PATH = path.resolve(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(FRONTEND_PATH));
  app.get('*', (req, res) => {
    // Only handle non-API routes for static distribution
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
    
    const idx = path.join(FRONTEND_PATH, 'index.html');
    if (fs.existsSync(idx)) res.sendFile(idx);
    else res.status(404).send('Frontend build not found. Run: npm run build');
  });
}

/* ─── SERVER START ───────────────────────────────────────────────────────
   listen() only on non-Vercel runtimes.
──────────────────────────────────────────────────────────────────────────── */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SkySure API running on http://localhost:${PORT}`);
  });
}

module.exports = app;