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

// Synchronized with pre-final_dataset3.csv schema
const generateSyntheticRiders = (count, city) => {
    const names = [
        "Arjun Raghavan", "Sanjay Jayakumar", "Priya Krishnan", "Vijay Ramachandran", 
        "Anitha Selvam", "Rahul Mani", "Vikram Thiru", "Meera Lakshmi", 
        "Karthik Prabhu", "Divya Balaji", "Naveen Ganesan", "Sowmya Harish"
    ];
    const personas = ["Gig-Pro", "Full-Timer", "Student-Flex", "Veteran"];
    
    return Array.from({ length: count }, (_, i) => ({
        rider_id: `TN_RID_SYN_${1000 + i}`,
        city: city,
        persona_type: personas[Math.floor(Math.random() * personas.length)],
        session_time_hhmm: "06:30",
        earning_efficiency: 0.8 + (Math.random() * 0.15),
        weekly_premium: 1000 + (Math.floor(Math.random() * 5) * 100)
    }));
};

router.post('/batch', async (req, res) => {
    try {
        const { location, isLiveMode } = req.body;
        const targetCity = location || 'Chennai';
        const batchCount = 15; 
        
        let selectedRiders = [];
        try {
            // Updated query to use 'city' as per pre-final_dataset3.csv
            // Case-Insensitive City Matching for Perfect Alignment
            const snapshot = await db.collection('riders').where('city', 'in', [targetCity, targetCity.toLowerCase(), targetCity.toUpperCase()]).get();
            if (!snapshot.empty) {
                selectedRiders = snapshot.docs.map(d => ({ 
                    ...d.data(), 
                    id: d.id,
                    rider_id: d.data().rider_id || d.id
                }))
                .sort(() => 0.5 - Math.random())
                .slice(0, batchCount);
                console.log(`[SIM] Linked ${selectedRiders.length} records from ${targetCity} dataset.`);
            }
        } catch (e) { console.error("[SIM] DB Failed Fallback", e); }

        // Ensure we have enough riders
        if (selectedRiders.length < batchCount) {
            selectedRiders = [...selectedRiders, ...generateSyntheticRiders(batchCount - selectedRiders.length, targetCity)];
        }
        selectedRiders = selectedRiders.sort(() => 0.5 - Math.random()).slice(0, batchCount);

        let globalLiveEnv = null;
        if (isLiveMode) {
            const coords = CITY_COORDS[targetCity];
            if (coords) {
                globalLiveEnv = await getLiveWeather(coords.lat, coords.lon);
            }
        }

        const approvedTarget = 8 + Math.floor(Math.random() * 2);
        const mitigatedTarget = 2 + Math.floor(Math.random() * 2);
        
        const types = [];
        for(let i=0; i<approvedTarget; i++) types.push('APPROVED');
        for(let i=0; i<mitigatedTarget; i++) types.push('MITIGATED');
        while(types.length < batchCount) types.push('NOMINAL');
        
        const shuffledTypes = types.sort(() => 0.5 - Math.random());

        const nodes = selectedRiders.map((rider, index) => {
            const type = shuffledTypes[index];
            let env = {};
            let behavior = {};
            let isFraudCase = false;
            let isNominalCase = false;

            const baseEfficiency = parseFloat(rider.earning_efficiency) || 0.85;
            
            let baseSessionHours = 6;
            if (rider.session_time_hhmm && typeof rider.session_time_hhmm === 'string') {
                const parts = rider.session_time_hhmm.split(':');
                if (parts.length === 2) {
                    baseSessionHours = parseInt(parts[0]) + (parseInt(parts[1]) / 60);
                }
            } else if (typeof rider.session_time_hhmm === 'number') {
                baseSessionHours = rider.session_time_hhmm;
            }

            if (type === 'APPROVED') { 
                env = { 
                    rainfall: Math.round(18 + (Math.random() * 12)), 
                    windSpeed: Math.round(42 + (Math.random() * 15)), 
                    trafficLevel: 'High', 
                    zoneDisruption: Math.random() > 0.4,
                    isSocialTrigger: Math.random() > 0.85,
                    platformDowntime: Math.random() > 0.90,
                    isStressMode: true
                };
                behavior = { 
                    earning_efficiency: baseEfficiency * (0.3 + Math.random() * 0.2), 
                    session_time_hr: Math.min(baseSessionHours, 4 + Math.random() * 2), 
                    order_drop: Math.min(0.95, 0.05 + (0.6 + Math.random() * 0.2)) 
                };
            } else if (type === 'MITIGATED') {
                env = { 
                    rainfall: Math.round(32 + (Math.random() * 8)), 
                    windSpeed: Math.round(52 + (Math.random() * 18)), 
                    trafficLevel: 'High', 
                    zoneDisruption: true,
                    isSocialTrigger: Math.random() > 0.70,
                    platformDowntime: Math.random() > 0.80,
                    isStressMode: true
                };
                behavior = { 
                    earning_efficiency: 0.98 + (Math.random() * 0.02), 
                    session_time_hr: Math.min(baseSessionHours, 1.5 + Math.random() * 1), 
                    order_drop: 0.02 
                };
                isFraudCase = true;
            } else {
                env = { 
                    rainfall: Math.round(2 + (Math.random() * 5)), 
                    windSpeed: Math.round(8 + (Math.random() * 12)), 
                    trafficLevel: 'Medium',
                    zoneDisruption: false,
                    isSocialTrigger: false,
                    platformDowntime: false,
                    isStressMode: false
                };
                behavior = { 
                    earning_efficiency: baseEfficiency, 
                    session_time_hr: baseSessionHours, 
                    order_drop: 0.05 
                };
                isNominalCase = true;
            }

            const severityData = engine.ACTUARIAL_CONFIG.TRIGGERS.evaluate(env, behavior);
            const fraud = engine.executeAdvancedFraudEngine(rider, env, behavior);
            
            if (isFraudCase) {
                fraud.score = 75 + Math.floor(Math.random() * 20);
                fraud.status = "BLOCK";
                fraud.reasons = ['SPOOFING', 'COLLUSION', 'TIME_JUMP'];
                fraud.summary = "CRITICAL: Multiple telemetry anomalies suggest systematic policy violation.";
            } else if (isNominalCase) {
                fraud.score = 5 + Math.floor(Math.random() * 10);
                fraud.reasons = [];
                fraud.summary = "TRUSTED: Behavioral signature matches historical pattern.";
            } else {
                fraud.score = 15 + Math.floor(Math.random() * 15);
                fraud.reasons = [];
                fraud.summary = "VERIFIED: Environmental triggers match claim profile.";
            }

            const payout = engine.calculateAdaptivePayout(rider, severityData, fraud);
            const finalStatus = isFraudCase ? 'MITIGATED' : (severityData.isTriggered ? 'APPROVED' : 'NOMINAL');
            
            // Map structured signals for Simulation.jsx UI
            const signals = {
                heavyRain: { value: env.rainfall, active: env.rainfall >= 10, threshold: 10 },
                highWind: { value: env.windSpeed, active: env.windSpeed >= 35, threshold: 35 },
                orderDrop: { value: behavior.order_drop * 100, active: behavior.order_drop > 0.5, threshold: 50 },
                riderInactive: { value: behavior.session_time_hr < 2 ? 100 : 0, active: behavior.session_time_hr < 2, isStatus: true },
                lowOrderVolume: { active: env.trafficLevel === 'Low' },
                abnormalDeliveryTime: { value: (behavior.session_time_hr / baseSessionHours) * 60, active: behavior.session_time_hr < (baseSessionHours * 0.5) },
                lowVisibility: { value: env.rainfall > 20 ? 2 : 8, active: env.rainfall > 20 }
            };

            return {
                ...rider,
                id: rider.rider_id || rider.id || `NODE_${index}`,
                name: rider.rider_name || `Pilot ${rider.rider_id?.split('_').pop() || index}`,
                city: targetCity,
                persona: rider.persona_type || 'Gig-Pro',
                env,
                behavior,
                signals,
                activeSignalCount: Object.values(signals).filter(s => s.active).length,
                severityScore: severityData.totalSeverity / 100,
                isDisrupted: severityData.isTriggered,
                fraud,
                payout: {
                    ...payout,
                    status: finalStatus,
                    math: {
                        ...payout.math,
                        severity: severityData.rawSeverity / 100,
                        confidence: (100 - fraud.score) / 100
                    }
                }
            };
        });

        // PERSISTENCE LOOP: Batch Update Trust Scores
        // Using batch for performance as requested "end of the batch"
        const batch = db.batch();
        nodes.forEach(node => {
            const riderRef = db.collection('riders').doc(node.id);
            let change = 0.5; // Nominal
            if (node.payout.status === 'APPROVED') change = 2;
            else if (node.payout.status === 'MITIGATED') change = -5; // User: "5 becease all having same trust"

            const newTrust = Math.max(0, Math.min(100, (parseFloat(node.trust_score) || 85) + change));
            batch.update(riderRef, { trust_score: newTrust });
        });
        await batch.commit();
        console.log(`[SIM] Persistent Trust Loop committed for ${nodes.length} nodes.`);

        res.json({
            runId: `SIM_V6_${Date.now()}`,
            city: targetCity,
            nodes: nodes,
            summary: {
                total: nodes.length,
                approved: nodes.filter(n => n.payout.status === 'APPROVED').length,
                nominal: nodes.filter(n => n.payout.status === 'NOMINAL').length,
                mitigated: nodes.filter(n => n.payout.status === 'MITIGATED').length
            }
        });

    } catch (error) {
        console.error('[CRITICAL] Batch Processor Fault:', error);
        res.status(500).json({ error: 'Critical Simulation Failure' });
    }
});

module.exports = router;
