/**
 * train_fraud_model.js
 * Automated Weight Derivation for SkySure Neural Fraud Engine.
 */
const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'fraud_training_data.json');
const MODEL_OUT = path.join(__dirname, '..', 'src', 'models', 'fraud_model_config.json');

if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ Dataset not found. Run generate_training_data.js first.");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// 1. Group Data
const fraudCases = data.filter(d => d.is_fraud);
const legitCases = data.filter(d => !d.is_fraud);

function getMean(arr, keyPath) {
    const vals = arr.map(d => {
        const parts = keyPath.split('.');
        let val = d;
        parts.forEach(p => val = val[p]);
        return val;
    });
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

console.log("🛠  Training SkySure Neural Weights...");

// Feature Exploration
const features = [
    { name: 'EfficiencyAnomaly', path: 'behavior.efficiency' },
    { name: 'DropRateLogic', path: 'behavior.orderDrop' },
    { name: 'SessionPersistence', path: 'behavior.sessionTime' }
];

const weights = {};
const thresholds = {};

features.forEach(f => {
    const meanFraud = getMean(fraudCases, f.path);
    const meanLegit = getMean(legitCases, f.path);
    
    // Weight is the normalized delta between Fraud and Legit
    // Higher delta = Higher feature importance
    const delta = Math.abs(meanFraud - meanLegit);
    weights[f.name] = Number((delta * 2.5).toFixed(2));
    
    // Determine a dynamic threshold (mid-point + buffer)
    thresholds[f.name] = Number(((meanFraud + meanLegit) / 2).toFixed(2));
});

const modelConfig = {
    modelVersion: "GG-NEURAL-v2.0-STABLE",
    trainedAt: new Date().toISOString(),
    weights,
    thresholds,
    metadata: {
        trainingSetSize: data.length,
        fraudDensity: (fraudCases.length / data.length).toFixed(4),
        accuracyRef: 0.94 // Target synthetic accuracy
    }
};

fs.writeFileSync(MODEL_OUT, JSON.stringify(modelConfig, null, 4));
console.log(`✅ Model trained and saved to ${MODEL_OUT}`);
console.log("📊 Feature Importance Weights:", weights);
