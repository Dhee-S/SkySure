const express = require('express');
const router = express.Router();
const axios = require('axios');
const engine = require('../services/simulationEngine');
const TriggerRegistry = require('../services/TriggerRegistry');
const FraudIntelligenceService = require('../services/FraudIntelligenceService');
const { admin, db } = require('../../firebase');

const CITY_COORDS = {
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Coimbatore': { lat: 11.0168, lon: 76.9558 },
    'Salem': { lat: 11.6643, lon: 78.1460 },
    'Madurai': { lat: 9.9252, lon: 78.1198 },
    'Trichy': { lat: 10.7905, lon: 78.7047 }
};

const getLiveWeather = async (lat, lon) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation`;
        const resp = await axios.get(url);
        const currentHour = new Date().getHours();
        return {
            rainfall: resp.data.hourly?.precipitation?.[currentHour] || 0,
            windSpeed: resp.data.current_weather?.windspeed || 0,
            trafficLevel: 'Medium',
            zoneDisruption: Math.random() > 0.8
        };
    } catch (e) {
        return { rainfall: 5, windSpeed: 10, trafficLevel: 'Low', zoneDisruption: false };
    }
};

// ─── LIVE WEATHER EXPOSURE ────────────────────────────────────────────────────
router.get('/weather/live', async (req, res) => {
    try {
        const { location } = req.query;
        const coords = CITY_COORDS[location] || CITY_COORDS['Chennai'];
        const weather = await getLiveWeather(coords.lat, coords.lon);
        res.json({
            city: location || 'Chennai',
            ...weather,
            temperature: Math.round(28 + (Math.random() * 5)), // Mock temp for demo
            description: weather.rainfall > 10 ? 'Heavy Rain' : (weather.rainfall > 2 ? 'Moderate Rain' : 'Partly Cloudy')
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

// ─── IMPROVED SYNTHETIC GENERATOR ────────────────────────────────────────────
const generateSyntheticRiders = (count, city) => {
    const names = [
        "Arjun Raghavan", "Sanjay Jayakumar", "Priya Krishnan", "Vijay Ramachandran", 
        "Anitha Selvam", "Rahul Mani", "Vikram Thiru", "Meera Lakshmi", 
        "Karthik Prabhu", "Divya Balaji", "Naveen Ganesan", "Sowmya Harish"
    ];
    const personas = ["Gig-Pro", "Full-Timer", "Student-Flex", "Veteran"];
    
    return Array.from({ length: count }, (_, i) => {
        const persona = personas[Math.floor(Math.random() * personas.length)];
        const isProbation = Math.random() > 0.85; 
        const efficiency = 0.6 + (Math.random() * 0.35);
        
        // Randomize Finance for Variety
        const incomes = [3200, 4500, 5800, 7200, 8500];
        const premiums = [35, 65, 85, 120];
        const income = incomes[Math.floor(Math.random() * incomes.length)];
        const premium = premiums[Math.floor(Math.random() * premiums.length)];
        const tier = premium > 100 ? 'Pro' : premium > 50 ? 'Standard' : 'Basic';

        return {
            rider_id: `TN_RID_SYN_${1000 + i}`,
            rider_name: names[i % names.length],
            city: city,
            persona_type: persona,
            persona: persona,
            weekly_income: income,
            weekly_premium_inr: premium,
            coverage_amount_inr: Math.round(income * 0.25),
            tier: tier,
            session_time_hhmm: "06:30",
            earning_efficiency: efficiency,
            probation_status: isProbation,
            fraud_probability: 0.1,
            trust_score: 85,
            id: `syn_${1000 + i}`
        };
    });
};

router.post('/batch', async (req, res) => {
    try {
        const { location, isLiveMode, isStressMode } = req.body;
        const targetCity = location || 'Chennai';
        const batchCount = 15; 
        
        let selectedRiders = [];
        // [LOGIC] Pull from Firestore first for "Real" flavor
        try {
            if (db) {
                const snapshot = await db.collection('rider_profiles').limit(batchCount).get();
                if (!snapshot.empty) {
                    selectedRiders = snapshot.docs.map(d => {
                        const data = d.data();
                        return { 
                            ...data, 
                            id: d.id,
                            rider_id: data.rider_id || d.id,
                            // Normalize for engine
                            weekly_income: parseFloat(data.past_week_earnings || 5000),
                            weekly_premium_inr: parseFloat(data.weekly_premium || 120),
                            probation_status: data.probation_status === true || data.probationary_tier === true,
                            coverage_amount_inr: parseFloat(data.predicted_payout || 1200)
                        };
                    });
                }
            }
        } catch (e) { 
            console.warn("[SIM] Firestore ingest bypassed.", e.message); 
        }

        // Fill with high-fidelity synthetics if needed
        if (selectedRiders.length < batchCount) {
            selectedRiders = [...selectedRiders, ...generateSyntheticRiders(batchCount - selectedRiders.length, targetCity)];
        }
        selectedRiders = selectedRiders.sort(() => 0.5 - Math.random()).slice(0, batchCount);

        // ─── BATCH WEATHER SCENARIO (Zonal Intelligence) ────────────────────
        let batchEnv = { rainfall: 0, windSpeed: 10, trafficLevel: 'Medium', isStressMode: false };
        
        const ZONAL_FREQS = {
            'Chennai': { freq: 0.18, rMax: 45, wMax: 45 },
            'Madurai': { freq: 0.08, rMax: 15, wMax: 20 },
            'Salem': { freq: 0.08, rMax: 15, wMax: 20 },
            'Coimbatore': { freq: 0.12, rMax: 25, wMax: 25 },
            'Trichy': { freq: 0.12, rMax: 25, wMax: 25 }
        };

        if (isLiveMode) {
            const coords = CITY_COORDS[targetCity];
            if (coords) batchEnv = await getLiveWeather(coords.lat, coords.lon);
        } else {
            // Realistic Zonal Probability (Avg ~12% global storm freq)
            const zoneConfig = ZONAL_FREQS[targetCity] || { freq: 0.10, rMax: 20, wMax: 20 };
            const isStorm = isStressMode || Math.random() < zoneConfig.freq;

            if (isStorm) {
                batchEnv = { 
                    rainfall: 15 + (Math.random() * zoneConfig.rMax), 
                    windSpeed: 30 + (Math.random() * zoneConfig.wMax), 
                    trafficLevel: 'High', 
                    isStressMode: true 
                };
            } else {
                // Nominal weather for the zone
                batchEnv = {
                    rainfall: Math.random() * 5,
                    windSpeed: 5 + (Math.random() * 10),
                    trafficLevel: Math.random() > 0.7 ? 'Medium' : 'Low',
                    isStressMode: false
                };
            }
        }

        const nodes = await Promise.all(selectedRiders.map(async (rider, index) => {
            // Behavioral Profile Selection
            const dice = Math.random();
            let behavior = { earning_efficiency: 0.85, session_time_hr: 7, order_drop: 0.05 };

            if (dice > 0.96) {
                // Ghost Rider Profile (4% freq): High efficiency, very low time
                behavior = { earning_efficiency: 0.99, session_time_hr: 0.5, order_drop: 0.02 };
            } else if (dice > 0.92) {
                // Cluster Fraud Profile (4% freq): High order drop
                behavior = { earning_efficiency: 0.70, session_time_hr: 4, order_drop: 0.85 };
            } else if (batchEnv.isStressMode) {
                // Storm Condition behavior
                behavior = { earning_efficiency: 0.4, session_time_hr: 3, order_drop: 0.60 };
            }

            // ─── THE ACTUARIAL CORE (Truth Source) ───────────────────────────
            const incidents = await TriggerRegistry.getActiveIncidents(targetCity);
            const severityData = engine.ACTUARIAL_CONFIG.TRIGGERS.evaluate(batchEnv, behavior, incidents);
            
            // Advanced Fraud Analysis (XAI Driven)
            const fraudAnalysis = await FraudIntelligenceService.analyze(rider, batchEnv, behavior);
            const fraud = {
                score: fraudAnalysis.anomalyScore,
                isBlocked: fraudAnalysis.isBlocked,
                reasons: fraudAnalysis.analysisDetails.map(d => d.explanation),
                xai_report: fraudAnalysis.analysisDetails,
                model_version: fraudAnalysis.modelVersion
            };

            const payout = engine.calculateAdaptivePayout(rider, severityData, fraud, batchEnv);
            
            // Multi-Peril Signal Set (Phase 1) - Mapped to match the 7 engine triggers
            const signals = {
                heavyRain: { value: Number(batchEnv.rainfall.toFixed(1)), active: severityData.details.rain.active, threshold: 10 },
                highWind: { value: Number(batchEnv.windSpeed.toFixed(1)), active: severityData.details.wind.active, threshold: 35 },
                orderDrop: { value: Number((behavior.order_drop * 100).toFixed(0)), active: severityData.details.velocity.active, threshold: 50 },
                riderInactive: { value: behavior.session_time_hr, active: severityData.details.inactivity.active, threshold: 4 },
                lowOrderVolume: { active: severityData.details.traffic.active, label: 'Traffic' },
                abnormalDeliveryTime: { val: severityData.details.social.val, active: severityData.details.social.active, label: 'Curfew' },
                lowVisibility: { value: severityData.details.visibility.val, active: severityData.details.visibility.active, label: 'Vis' }
            };

            const activeSignalCount = severityData.breachedCount;
            const currentTrustScore = Number(rider.trust_score || 85); 

            return {
                ...rider,
                name: rider.rider_name || rider.name || `Partner ${rider.rider_id?.split('_').pop()}`,
                persona: rider.persona_type || 'Gig-Pro',
                env: batchEnv,
                signals,
                activeSignalCount,
                severityScore: Number((activeSignalCount * 0.45).toFixed(2)), // Max severity logic
                fraud: {
                    score: Math.round(fraud.score),
                    isBlocked: fraud.isBlocked,
                    reasons: fraud.reasons
                },
                trust_score: fraud.isBlocked ? Math.max(5, currentTrustScore - 40) : Math.min(98, currentTrustScore + 10),
                payout: {
                    status: fraud.isBlocked ? 'MITIGATED' : (activeSignalCount > 0 ? 'APPROVED' : 'NOMINAL'),
                    amount: payout.amount,
                    math: payout.math,
                    proof_of_cause: severityData.proofOfCause
                }
            };
        }));

        // ─── MULTI-TABLE SYNCHRONIZATION ──────────────────────────────────────
        if (db) {
            try {
                const batch = db.batch();
                const now = new Date().toISOString();

                for (const r of nodes) {
                    // Skip synthetics for DB persistence
                    if (r.id && r.id.startsWith('TN_RID_SYN_')) continue;

                    const riderRef = db.collection('rider_profiles').doc(r.id);
                    const policyId = r.policy_id || `POL-${r.city.substring(0,2).toUpperCase()}-2026-${r.id.slice(-4)}`;
                    const policyRef = db.collection('policies').doc(policyId);
                    
                    const eventId = `EVT-${Date.now()}-${r.id.slice(-4)}`;
                    const eventRef = db.collection('payout_events').doc(eventId);

                    // Logic for Adaptive Trust and Intensity Tiers
                    const fraudScore = r.fraud.score;
                    let intensityStatus = 'CLEAN';
                    let trustDelta = 0;

                    if (r.payout.status === 'APPROVED' && fraudScore < 40) {
                        trustDelta = 5;
                        intensityStatus = 'CLEAN';
                    } else if (fraudScore >= 40 && fraudScore < 60) {
                        intensityStatus = 'ALERT';
                        trustDelta = -10;
                    } else if (fraudScore >= 60 && fraudScore < 80) {
                        intensityStatus = 'PROBATION';
                        trustDelta = -25;
                    } else if (fraudScore >= 80) {
                        intensityStatus = 'BLOCKED';
                        trustDelta = -50;
                    }

                    const finalTrustScore = Math.max(0, Math.min(100, (rider.trust_score || 85) + trustDelta));

                    // 1. Audit Log Persistence
                    batch.set(eventRef, {
                        event_id: eventId,
                        rider_id: r.rider_id,
                        rider_name: r.name,
                        payout_amount: r.payout.amount,
                        payout_status: intensityStatus === 'CLEAN' ? r.payout.status : 'MITIGATED',
                        payout_txn_id: `TXN-${eventId.split('-').pop()}`,
                        feed_timestamp: now,
                        weather_at_trigger: r.env.rainfall > 0 ? `${r.env.rainfall.toFixed(1)}mm Rain` : 'Nominal',
                        environmental_trigger: r.payout.amount > 0 ? 'Parametric Trigger' : 'Below Threshold',
                        fraud_status: intensityStatus,
                        fraud_score: fraudScore,
                        location: r.city,
                        intensity_level: intensityStatus,
                        proof_of_cause: r.payout.proof_of_cause || []
                    });

                    // [AUDIT] Persist specific Fraud Intelligence Report
                    if (intensityStatus !== 'CLEAN') {
                        const fraudReportRef = db.collection('fraud_analysis_reports').doc(`XAI-${eventId}`);
                        batch.set(fraudReportRef, {
                            event_id: eventId,
                            rider_id: r.rider_id,
                            anomaly_score: fraudScore,
                            analysis_details: r.fraud.xai_report || [],
                            model_version: r.fraud.model_version,
                            timestamp: now
                        });
                    }

                    // 2. Rider Profile Sync (Trust Score + History + Status)
                    const payoutEntry = {
                        amount: r.payout.amount,
                        status: intensityStatus === 'CLEAN' ? r.payout.status.toLowerCase() : 'mitigated',
                        timestamp: now,
                        id: eventId,
                        intensity: intensityStatus
                    };

                    batch.set(riderRef, {
                        trust_score: finalTrustScore,
                        status: intensityStatus === 'BLOCKED' ? 'BLOCKED' : (rider.status || 'ACTIVE'),
                        probationary_tier: intensityStatus === 'PROBATION' || rider.probationary_tier === true,
                        fraud_alert: intensityStatus === 'ALERT' || rider.fraud_alert === true,
                        payout_history: admin.firestore.FieldValue.arrayUnion(payoutEntry),
                        last_sync: now
                    }, { merge: true });

                    // 3. Policy Tracking
                    if (r.payout.amount > 0 && intensityStatus === 'CLEAN') {
                        batch.set(policyRef, {
                            total_received: admin.firestore.FieldValue.increment(r.payout.amount),
                            last_payout: now
                        }, { merge: true });
                    }
                }
                
                await batch.commit();
                console.log(`[SIM] Multi-Table Sync complete for ${nodes.length} nodes.`);
            } catch (err) {
                console.warn("[SIM] Multi-Table Synchronization failed:", err.message);
            }
        }

        res.json({
            city: targetCity,
            nodes: nodes,
            summary: {
                total: nodes.length,
                approved: nodes.filter(n => n.payout.status === 'APPROVED').length,
                mitigated: nodes.filter(n => n.payout.status === 'MITIGATED').length,
                nominal: nodes.filter(n => n.payout.status === 'NOMINAL').length
            }
        });

    } catch (error) {
        console.error('[SIM] Processor Error:', error);
        res.status(500).json({ error: 'Simulation engine error' });
    }
});

module.exports = router;
