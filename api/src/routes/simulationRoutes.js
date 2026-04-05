const express = require('express');
const router = express.Router();
const axios = require('axios');
const engine = require('../services/simulationEngine');
const { db } = require('../../firebase');

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
                const snapshot = await db.collection('riders').limit(batchCount).get();
                if (!snapshot.empty) {
                    selectedRiders = snapshot.docs.map(d => ({ 
                        ...d.data(), 
                        id: d.id,
                        rider_id: d.data().rider_id || d.id
                    }));
                }
            }
        } catch (e) { console.warn("[SIM] Firestore ingest bypassed."); }

        // Fill with high-fidelity synthetics if needed
        if (selectedRiders.length < batchCount) {
            selectedRiders = [...selectedRiders, ...generateSyntheticRiders(batchCount - selectedRiders.length, targetCity)];
        }
        selectedRiders = selectedRiders.sort(() => 0.5 - Math.random()).slice(0, batchCount);

        // ─── BATCH WEATHER SCENARIO (Consistency) ────────────────────────────
        let batchEnv = { rainfall: 0, windSpeed: 10, trafficLevel: 'Medium', isStressMode: false };
        
        if (isLiveMode) {
            const coords = CITY_COORDS[targetCity];
            if (coords) batchEnv = await getLiveWeather(coords.lat, coords.lon);
        } else {
            // Force a 'Storm Scenario' if Stress Mode is ON or 60% probability
            const isStorm = isStressMode || Math.random() > 0.4;
            if (isStorm) {
                batchEnv = { 
                    rainfall: 15 + (Math.random() * 20), 
                    windSpeed: 35 + (Math.random() * 25), 
                    trafficLevel: 'High', 
                    isStressMode: true 
                };
            }
        }

        const nodes = selectedRiders.map((rider, index) => {
            // Behavioral Profile Selection
            const dice = Math.random();
            let behavior = { earning_efficiency: 0.85, session_time_hr: 7, order_drop: 0.05 };

            if (dice > 0.90) {
                // Ghost Rider Profile: High efficiency, very low time
                behavior = { earning_efficiency: 0.99, session_time_hr: 0.5, order_drop: 0.02 };
            } else if (dice > 0.80) {
                // Cluster Fraud Profile: High order drop
                behavior = { earning_efficiency: 0.70, session_time_hr: 4, order_drop: 0.85 };
            } else if (batchEnv.isStressMode) {
                // Storm Condition behavior
                behavior = { earning_efficiency: 0.4, session_time_hr: 3, order_drop: 0.60 };
            }

            // ─── THE ACTUARIAL CORE (Truth Source) ───────────────────────────
            const severityData = engine.ACTUARIAL_CONFIG.TRIGGERS.evaluate(batchEnv, behavior);
            const fraud = engine.executeAdvancedFraudEngine(rider, batchEnv, behavior);
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
                    math: payout.math
                }
            };
        });

        // Batch Update Trust Scores in Firestore
        if (db) {
            try {
                const batch = db.batch();
                nodes.forEach(r => {
                    if (r.id && !r.id.startsWith('TN_RID_SYN_')) {
                        const ref = db.collection('riders').doc(r.id);
                        // Delta: +10 for good behavior, -10 for a risk event (APPROVED payout)
                        const delta = r.payout.status === 'APPROVED' ? -10 : 10;
                        const initialScore = parseFloat(r.trust_score) || 75;
                        const newScore = Math.max(0, Math.min(100, initialScore + delta));
                        
                        batch.set(ref, { 
                            trust_score: newScore,
                            trustScore:  newScore
                        }, { merge: true });
                    }
                });
                await batch.commit();
                console.log(`[SIM] Persistent Trust Scores (Delta: +/-10) committed for ${nodes.length} nodes.`);
            } catch (err) {
                console.warn("[SIM] Trust score batch update failed:", err.message);
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
