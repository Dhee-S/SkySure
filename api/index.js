const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { admin, db } = require('./firebase');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_PATH = path.join(__dirname, '..', 'data', 'pre-final_dataset3.csv');

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const simulationRoutes = require('./src/routes/simulationRoutes');

// Global storage for Cache (Optional, but Firestore is live)
let riders = [];

// Replaced CSV load with Firestore Fetch
async function loadData() {
    try {
        const snapshot = await db.collection('riders').limit(1000).get();
        riders = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            rider_id: doc.data().rider_id || doc.id
        }));
        console.log(`✅ Loaded ${riders.length} riders from Firestore`);
        return riders;
    } catch (err) {
        console.error('Firestore Load Error:', err);
        throw err;
    }
}

// Routes
app.use('/api/simulation', simulationRoutes);

// 1. GET /api/riders/:id
app.get('/api/riders/:id', (req, res) => {
    const rider = riders.find(r => r.rider_id === req.params.id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    res.json({
        id: rider.rider_id,
        persona_type: rider.persona_type,
        city: rider.city,
        coordinates: rider.coordinates,
        session_time: parseFloat(rider.session_time)
    });
});

// 2. GET /api/premium/:rider_id
app.get('/api/premium/:rider_id', (req, res) => {
    const rider = riders.find(r => r.rider_id === req.params.rider_id);
    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    const earningEfficiency = parseFloat(rider.earning_efficiency);
    const baseWeeklyPremium = parseFloat(rider.weekly_premium) || 150;

    // Formula: riskMultiplier = 1 + (1 - earning_efficiency)
    const riskMultiplier = 1 + (1 - earningEfficiency);
    // Formula: premium = baseWeeklyPremium * riskMultiplier (already weekly)
    const premium = baseWeeklyPremium * riskMultiplier;

    res.json({
        premium: parseFloat(premium.toFixed(2)),
        riskScore: parseFloat(riskMultiplier.toFixed(2))
    });
});

// 3. POST /api/trigger/check
app.post('/api/trigger/check', (req, res) => {
    const { weather, traffic, orderDrop } = req.body;
    let signals = 0;

    if (weather === 'Stormy') signals += 1;
    if (traffic === 'High') signals += 1;
    if (parseFloat(orderDrop) > 0.4) signals += 1;

    const trigger = signals >= 2;
    res.json({
        trigger,
        confidence: trigger ? 0.94 : 0.12,
        signals
    });
});

// 4. POST /api/fraud/check
app.post('/api/fraud/check', (req, res) => {
    const { fraud_probability, ring_score, earning_efficiency } = req.body;

    // Formula: fraudScore = (0.5 * fraud_probability) + (0.3 * ring_score) + (0.2 * (1 - earning_efficiency))
    const fraudScore = (0.5 * parseFloat(fraud_probability)) +
        (0.3 * parseFloat(ring_score)) +
        (0.2 * (1 - parseFloat(earning_efficiency)));

    const status = fraudScore > 0.7 ? "BLOCK" : "ALLOW";

    res.json({
        fraudScore: parseFloat(fraudScore.toFixed(3)),
        status,
        reason: status === "BLOCK" ? "Anomaly detected in delivery density and behavioral nodes" : "Verified human operator signs clear"
    });
});

// 5. POST /api/payout/calculate
app.post('/api/payout/calculate', (req, res) => {
    const { predicted_payout, trigger, fraudStatus } = req.body;

    let payout = 0;
    if (trigger === true && fraudStatus !== "BLOCK") {
        // Formula: payout = Math.min(predicted_payout, 1500)
        payout = Math.min(parseFloat(predicted_payout), 1500);
    }

    res.json({
        payout,
        status: (trigger && fraudStatus !== "BLOCK") ? "APPROVED" : "DENIED"
    });
});

// 6. MASTER API /api/run-simulation
app.post('/api/run-simulation', async (req, res) => {
    const { rider_id, weather, traffic, orderDrop } = req.body;
    const rider = riders.find(r => r.rider_id === rider_id);

    if (!rider) return res.status(404).json({ error: 'Rider not found' });

    // Internal Orchestration
    const premiumData = {
        earningEfficiency: parseFloat(rider.earning_efficiency),
        baseWeeklyPremium: parseFloat(rider.weekly_premium)
    };

    // 1. Premium Check
    const riskMultiplier = 1 + (1 - premiumData.earningEfficiency);
    const premium = parseFloat(rider.weekly_premium) * riskMultiplier;

    // 2. Trigger Check
    let signals = 0;
    if (weather === 'Stormy') signals += 1;
    if (traffic === 'High') signals += 1;
    if (parseFloat(orderDrop) > 0.4) signals += 1;
    const trigger = signals >= 2;

    // 3. Fraud Check
    const fraudScore = (0.5 * parseFloat(rider.fraud_probability)) +
        (0.3 * parseFloat(rider.ring_score)) +
        (0.2 * (1 - parseFloat(rider.earning_efficiency)));
    const fraudStatus = fraudScore > 0.7 ? "BLOCK" : "ALLOW";

    // 4. Final Payout
    let payout = 0;
    if (trigger && fraudStatus === "ALLOW") {
        payout = Math.min(parseFloat(rider.predicted_payout), 1500);
    }

    res.json({
        riderName: `Rider ${rider_id.split('_').pop()}`,
        input: { weather, traffic, orderDrop },
        premium: parseFloat(premium.toFixed(2)),
        riskScore: parseFloat(riskMultiplier.toFixed(2)),
        trigger: { status: trigger, signals },
        fraud: { score: parseFloat(fraudScore.toFixed(3)), status: fraudStatus },
        payout: { amount: parseFloat(payout.toFixed(2)), status: payout > 0 ? "APPROVED" : "DENIED" }
    });
});

// Stats API for Dashboard - Aggregated from Live Firestore
app.get('/api/stats', async (req, res) => {
    try {
        if (riders.length === 0) await loadData();

        const totalRiders = riders.length;
        const highRisk = riders.filter(r => (parseFloat(r.fraud_probability) || 0) >= 0.5).length;

        // Calculate total premium collection from actual weekly_premium data
        const totalPremium = riders.reduce((acc, r) => {
            const val = parseFloat(r.weekly_premium) || 120;
            const surcharge = (r.probation_status === true || r.probation_status === 'true') ? 3 : 1;
            return acc + (val * surcharge);
        }, 0);

        const avgTrust = (riders.reduce((acc, r) => acc + (parseFloat(r.trust_score) || 0), 0) / totalRiders).toFixed(1);

        res.json({
            totalRiders,
            highRiskRiders: highRisk,
            totalPremium: Math.round(totalPremium),
            avgTrustScore: avgTrust
        });
    } catch (e) {
        console.error('Stats error:', e);
        res.status(500).json({ error: 'Stats aggregation failed' });
    }
});

// List API - Powered by Live Firestore
app.get('/api/riders', async (req, res) => {
    try {
        if (riders.length === 0) await loadData();

        const mapped = riders.map(r => {
            const fraudVal = parseFloat(r.fraud_probability) || 0;
            const isProbation = r.probation_status === true || r.probation_status === 'true';
            const basePremium = parseFloat(r.weekly_premium) || 120;

            return {
                id: r.rider_id || r.id,
                name: r.name || `Partner ${r.rider_id?.split('_').pop() || r.id?.slice(-4)}`,
                city: r.city || 'Chennai',
                persona_type: r.persona_type || 'Gig-Pro',
                risk: {
                    level: r.risk_level || (fraudVal >= 0.65 ? 'High' : fraudVal >= 0.35 ? 'Medium' : 'Low'),
                    score: fraudVal
                },
                stats: {
                    premium: Math.round(basePremium * (isProbation ? 3 : 1)),
                    experience: r.session_time || 0
                },
                tier: r.tier || 'Standard',
                trust_score: parseFloat(r.trust_score) || 0,
                probation_status: isProbation,
                coordinates: r.coordinates
            };
        });

        res.json(mapped);
    } catch (e) {
        console.error('Rider list error:', e);
        res.status(500).json({ error: 'Firestore fetch failed' });
    }
});

// Payouts API - Audit Ledger Feed
app.get('/api/payouts', (req, res) => {
    try {
        const { riderId } = req.query;
        let pool = riders || [];

        if (riderId) {
            pool = pool.filter(r => r.rider_id === riderId || r.id === riderId);
        }

        const logs = [];
        pool.forEach(r => {
            const fraudVal = parseFloat(r.fraud_probability) || 0;
            const isProbation = r.probation_status === true || r.probation_status === 'true';

            // Generate incidents for high-risk, probation, or random 10% of fleet
            if (fraudVal >= 0.5 || isProbation || Math.random() > 0.90) {
                const isBlocked = fraudVal >= 0.8 || isProbation;
                const baseAmount = r.tier === 'Premium' ? 1200 : 800;

                logs.push({
                    id: `TRX-SKYSURE-${(r.rider_id || r.id).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
                    riderId: r.rider_id || r.id,
                    riderName: r.name || `Node ${r.rider_id?.split('_').pop() || r.id?.slice(-4)}`,
                    amount: isBlocked ? 0 : baseAmount,
                    status: isBlocked ? 'blocked' : 'approved',
                    reason: isBlocked ? 'Security Mitigation: Behavioral Anomaly' : 'Parametric Threshold: Weather Event',
                    weather: isBlocked ? 'Clear' : 'Stormy / Heavy Rain',
                    timestamp: Date.now() - (Math.random() * 86400000 * 7), // Past 7 days
                    location: r.city
                });
            }
        });

        logs.sort((a, b) => b.timestamp - a.timestamp);
        res.json(riderId ? logs : logs.slice(0, 100));
    } catch (e) {
        console.error('Payouts error:', e);
        res.status(500).json({ error: 'Audit ledger fetch failed' });
    }
});

// Batch Simulation API - Parametric Trigger Logic
app.post('/api/simulation/batch', async (req, res) => {
    try {
        const { location, isLiveMode } = req.body;
        if (riders.length === 0) await loadData();

        const cluster = riders
            .filter(r => r.city === location)
            .slice(0, 50);

        const rainfall = Math.random() * 25;
        const windSpeed = Math.random() * 55;
        const isSocialTrigger = Math.random() > 0.85;

        const results = cluster.map(r => {
            const trust = parseFloat(r.trust_score) || 75;
            const fraudProb = parseFloat(r.fraud_probability) || 0.1;
            const tier = r.tier || 'Standard';
            const isProbation = r.probation_status === true || r.probation_status === 'true';

            // 1. Parametric Triggers (Logical Chain)
            const rainfall = Math.random() * 30; // 0-30 mm/h
            const windSpeed = Math.random() * 60; // 0-60 km/h

            // Traffic Logic (derived from 'coordinates' as noise/variation)
            const latFloat = parseFloat(r.coordinates?.lat || 13.0);
            const trafficBase = 15 + (Math.random() * 25);
            const traffic = latFloat > 13.05 ? trafficBase + 15 : trafficBase;

            // Velocity Logic (linked to Rain intensity)
            let inactivityChance = 0.05;
            if (rainfall > 20) inactivityChance = 0.60;
            else if (rainfall > 10) inactivityChance = 0.25;
            const isInactive = Math.random() < inactivityChance;

            const rainThreshold = 15;
            const windThreshold = 40;
            const trafficThreshold = 30;

            const triggerBreached = rainfall > rainThreshold || windSpeed > windThreshold || traffic > trafficThreshold || isInactive;

            // 2. Fraud Audit (Actual Firestore Info)
            const fraudScore = (fraudProb * 100) + (Math.random() * 10 - 5);
            const status = fraudScore > 65 ? 'MITIGATED' : triggerBreached ? 'APPROVED' : 'NOMINAL';

            let simulatedTrust = trust;
            if (status === 'MITIGATED') {
                simulatedTrust = Math.max(10, trust - 15); // Velocity Trust Drop
            }

            let basePay = 0;
            if (tier === 'Premium') basePay = 950;
            else if (tier === 'Standard') basePay = 650;
            else basePay = 400;

            const finalAmount = status === 'APPROVED' ? basePay * (isProbation ? 0.7 : 1) : 0;

            const signals = {
                heavyRain: { value: rainfall, active: rainfall > rainThreshold, threshold: rainThreshold },
                highWind: { value: windSpeed, active: windSpeed > windThreshold, threshold: windThreshold },
                orderDrop: { value: traffic, active: traffic > trafficThreshold, threshold: trafficThreshold },
                riderInactive: { value: isInactive ? 'Inactive' : 'Active', active: isInactive, threshold: 50 },
                lowOrderVolume: { active: Math.random() > 0.8 },
                abnormalDeliveryTime: { value: Math.random() * 20 + 15, active: Math.random() > 0.8, threshold: 25 },
                lowVisibility: { value: Math.random() * 5 + 2, active: Math.random() > 0.9, threshold: 4 }
            };

            const activeSignalCount = Object.values(signals).filter(s => s.active).length;
            const severityScore = (activeSignalCount * 0.4) + (rainfall / 20) + (traffic / 100);

            return {
                id: r.rider_id || r.id,
                persona: r.persona_type || 'Gig-Pro',
                trust_score: Math.round(simulatedTrust),
                fraud_probability: fraudProb,
                probation_status: isProbation,
                city: r.city,
                signals,
                activeSignalCount,
                severityScore,
                isDisrupted: triggerBreached,
                fraud: {
                    score: Math.min(100, Math.max(0, fraudScore)),
                    reasons: fraudScore > 65 ? ['Geolocation Inconsistency', 'Sensor Discrepancy'] : []
                },
                payout: {
                    status,
                    amount: Math.round(finalAmount),
                    math: {
                        cap: basePay,
                        severity: triggerBreached ? 1.0 : 0,
                        confidence: trust / 100
                    }
                }
            };
        });

        res.json({ nodes: results });
    } catch (e) {
        console.error('Simulation error:', e);
        res.status(500).json({ error: 'Batch simulation failed' });
    }
});

// Catch-all route to serve the React index.html (SPA mode)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Initialization: Load data from Firestore then start server
const startServer = async () => {
    try {
        await loadData();
        // Always listen on Render or Local, but allow Vercel to handle its own functions
        if (process.env.RENDER || (process.env.NODE_ENV !== 'production' && !process.env.VERCEL)) {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`\n🚀 SkySure Unified Server running on Port ${PORT}`);
                console.log(`✅ System Status: ALL_SYSTEMS_OPERATIONAL`);
            });
        }
    } catch (err) {
        console.error('CRITICAL ERROR: Failed to load riders from Firestore', err);
        // In local dev, we might exit, but in Vercel we let the request fail
        if (process.env.NODE_ENV !== 'production') process.exit(1);
    }
};

startServer();

module.exports = app;