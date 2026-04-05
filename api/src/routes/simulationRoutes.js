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
        const isProbation = Math.random() > 0.85; // 15% probation rate
        const efficiency = 0.6 + (Math.random() * 0.35);
        
        // Match the 'Synthetic Actuarial Engine' logic from api/index.js
        const baseRisk = 0.05;
        const probationRisk = isProbation ? 0.65 : 0;
        const efficiencyRisk = (1.0 - efficiency) * 0.4;
        const derivedFraud = Math.min(0.98, Math.max(0.02, baseRisk + probationRisk + efficiencyRisk));

        return {
            rider_id: `TN_RID_SYN_${1000 + i}`,
            rider_name: names[i % names.length],
            city: city,
            persona_type: persona,
            persona: persona,
            session_time_hhmm: "06:30",
            earning_efficiency: efficiency,
            probation_status: isProbation,
            fraud_probability: derivedFraud,
            trust_score: Math.round((1 - derivedFraud) * 100),
            id: `syn_${1000 + i}`
        };
    });
};

router.post('/batch', async (req, res) => {
    try {
        const { location, isLiveMode } = req.body;
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
            // Force a 'Storm Scenario' for 60% of simulations for exciting audit data
            const isStorm = Math.random() > 0.4;
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
            // Behavioral Simulation: Some riders are 'Stable', some 'Risky'
            const isRiskyBehavior = Math.random() > 0.7; // 30% anomaly rate
            
            let behavior = {};
            const baseEfficiency = parseFloat(rider.earning_efficiency) || 0.85;
            
            if (isRiskyBehavior && batchEnv.isStressMode) {
                // Anomaly: High efficiency during a storm (Ghost Riding / Spoofing)
                behavior = { earning_efficiency: 0.98, session_time_hr: 1, order_drop: 0.05 };
            } else if (batchEnv.isStressMode) {
                // Normal reaction: Slow down during storm
                behavior = { earning_efficiency: baseEfficiency * 0.3, session_time_hr: 4, order_drop: 0.65 };
            } else {
                // Standard conditions
                behavior = { earning_efficiency: baseEfficiency, session_time_hr: 7, order_drop: 0.02 };
            }

            // ─── THE ACTUARIAL CORE (Truth Source) ───────────────────────────
            const severityData = engine.ACTUARIAL_CONFIG.TRIGGERS.evaluate(batchEnv, behavior);
            const fraud = engine.executeAdvancedFraudEngine(rider, batchEnv, behavior);
            const payout = engine.calculateAdaptivePayout(rider, severityData, fraud, batchEnv);
            
            // UI Signals mapping
            const signals = {
                heavyRain: { value: batchEnv.rainfall, active: batchEnv.rainfall >= 10, threshold: 10 },
                highWind: { value: batchEnv.windSpeed, active: batchEnv.windSpeed >= 35, threshold: 35 },
                orderDrop: { value: behavior.order_drop * 100, active: behavior.order_drop > 0.5, threshold: 50 },
                riderInactive: { value: behavior.session_time_hr < 2 ? 100 : 0, active: behavior.session_time_hr < 2, isStatus: true },
                lowOrderVolume: { active: batchEnv.trafficLevel === 'Low' },
                abnormalDeliveryTime: { value: (behavior.session_time_hr / 8) * 60, active: behavior.session_time_hr < 4 },
                lowVisibility: { value: batchEnv.rainfall > 20 ? 1 : 10, active: batchEnv.rainfall > 20 }
            };

            const activeSignalCount = Object.values(signals).filter(s => s.active).length;
            const currentTrustScore = Number(Math.round((1 - (fraud.score / 100)) * 100)) || 0;

            return {
                ...rider,
                name: rider.rider_name || rider.name || `Partner ${rider.rider_id?.split('_').pop()}`,
                persona: rider.persona_type || 'Gig-Pro',
                env: batchEnv,
                behavior,
                fraud,
                signals,
                activeSignalCount,
                severityScore: severityData.totalSeverity,
                isDisrupted: severityData.isTriggered,
                trust_score: currentTrustScore,
                payout: payout
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
                mitigated: nodes.filter(n => n.payout.status === 'MITIGATED').length
            }
        });

    } catch (error) {
        console.error('[SIM] Processor Error:', error);
        res.status(500).json({ error: 'Simulation engine error' });
    }
});

module.exports = router;
