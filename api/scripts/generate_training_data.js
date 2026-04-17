/**
 * generate_training_data.js
 * High-fidelity synthetic generator for SkySure Fraud ML.
 */
const fs = require('fs');
const path = require('path');

const DATA_SIZE = 5000;
const OUTPUT_FILE = path.join(__dirname, 'fraud_training_data.json');

const ZONES = {
    'Coastal': { cities: ['Chennai'], stormFreq: 0.18, rainMax: 45, windMax: 65 },
    'Inland': { cities: ['Madurai', 'Salem'], stormFreq: 0.08, rainMax: 15, windMax: 25 },
    'Plateau': { cities: ['Coimbatore', 'Trichy'], stormFreq: 0.12, rainMax: 25, windMax: 35 }
};

const PERSONAS = ['Gig-Pro', 'Full-Timer', 'Student-Flex', 'Veteran'];

function generateRecord(id) {
    // 1. Geography & Persona
    const zoneName = Object.keys(ZONES)[Math.floor(Math.random() * 3)];
    const zone = ZONES[zoneName];
    const city = zone.cities[Math.floor(Math.random() * zone.cities.length)];
    const persona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    // 2. Weather Generation (Zonal Aware)
    const isStorm = Math.random() < zone.stormFreq;
    const rainfall = isStorm ? 15 + (Math.random() * zone.rainMax) : (Math.random() * 8);
    const windSpeed = isStorm ? 30 + (Math.random() * zone.windMax) : (Math.random() * 15);
    const traffic = isStorm ? 'High' : (Math.random() > 0.7 ? 'Medium' : 'Low');

    // 3. Behavioral Features
    let efficiency = 0.8 + (Math.random() * 0.15); // Baseline
    let orderDrop = Math.random() * 0.1; // Baseline
    let sessionTime = 4 + (Math.random() * 6); // Baseline

    // 4. Labeling & Synthetic Corruptions (Fraud Injection)
    let is_fraud = false;
    const fraudType = Math.random();

    if (fraudType > 0.95) {
        // SCENARIO 1: Kinematic Inconsistency (GPS Spoof)
        is_fraud = true;
        efficiency = 0.98; // Too perfect
        if (traffic === 'High' || isStorm) {
            // Efficiency should drop in these conditions, but doesn't
        }
    } else if (fraudType > 0.90) {
        // SCENARIO 2: Parametric Farming
        is_fraud = true;
        orderDrop = 0.85; 
        if (!isStorm) {
            // Farming payouts when weather is actually okay
        }
    } else if (fraudType > 0.85) {
        // SCENARIO 3: Bot Exhaustion 
        is_fraud = true;
        sessionTime = 18 + (Math.random() * 6);
    } else {
        // LEGITIMATE BEHAVIOR: Adaptive Logic
        if (isStorm) {
            efficiency = 0.4 + (Math.random() * 0.2); // Efficiency drops in storms
            orderDrop = 0.5 + (Math.random() * 0.4); // More orders dropped in storms
        }
    }

    return {
        id: `TRN_${id}`,
        city,
        zone: zoneName,
        persona,
        weather: { rainfall, windSpeed, traffic, isStorm },
        behavior: { efficiency, orderDrop, sessionTime },
        is_fraud
    };
}

console.log(`🚀 Generating ${DATA_SIZE} records for Zonal-Aware ML Training...`);
const dataset = Array.from({ length: DATA_SIZE }, (_, i) => generateRecord(i));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));
console.log(`✅ Dataset persisted to ${OUTPUT_FILE}`);
console.log(`📊 Fraud Density: ${((dataset.filter(d => d.is_fraud).length / DATA_SIZE) * 100).toFixed(2)}%`);
