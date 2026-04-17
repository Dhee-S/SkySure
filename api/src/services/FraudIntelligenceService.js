/**
 * FraudIntelligenceService.js
 * Post-ML Training Fraud Analysis Module
 * Implements XAI (Explainable AI) textual generation for anomaly scores.
 */

const { db } = require('../../firebase');

class FraudIntelligenceService {
    constructor() {
        this.MODEL_VERSION = 'GG-NEURAL-FRAUD-v1.4';
    }

    /**
     * Conduct deep analysis using derived Neural Weights.
     * @param {Object} rider Profile data
     * @param {Object} env Environmental telemetry
     * @param {Object} behavior Latency and behavioral data
     */
    async analyze(rider, env, behavior) {
        let modelConfig = { weights: {}, thresholds: {} };
        try {
            // Use static import for simplicity in this environment
            modelConfig = require('../models/fraud_model_config.json');
        } catch (e) {
            console.warn('[FRAUD_SERVICE] Model config not found, using safety defaults.');
            modelConfig = { 
                weights: { EfficiencyAnomaly: 0.5, DropRateLogic: 0.5, SessionPersistence: 5.0 },
                thresholds: { EfficiencyAnomaly: 0.9, DropRateLogic: 0.5, SessionPersistence: 12 }
            };
        }

        let anomalyScore = 10;
        const analysisDetails = [];
        const { weights, thresholds } = modelConfig;

        // 1. DYNAMIC KINEMATIC INFERENCE
        const effDelta = behavior.earning_efficiency - (env.isStressMode ? 0.4 : 0.8);
        if (behavior.earning_efficiency > (thresholds.EfficiencyAnomaly || 0.9) && (env.trafficLevel === 'High' || env.isStressMode)) {
            const scoreIncr = (effDelta * (weights.EfficiencyAnomaly || 0.2) * 100);
            anomalyScore += Math.max(0, scoreIncr);
            analysisDetails.push({
                feature: 'KinematicAnomaly',
                weight: weights.EfficiencyAnomaly,
                explanation: `High efficiency (${(behavior.earning_efficiency*100).toFixed(0)}%) maintained during ${env.trafficLevel} traffic/disruption. Weight: ${weights.EfficiencyAnomaly}`
            });
        }

        // 2. ADAPTIVE DROP RATE LOGIC
        const dropThreshold = env.isStressMode ? 0.9 : (thresholds.DropRateLogic || 0.5);
        if (behavior.order_drop > dropThreshold && !env.isStressMode) {
            anomalyScore += ( (weights.DropRateLogic || 0.4) * 100);
            analysisDetails.push({
                feature: 'DropSequence',
                weight: weights.DropRateLogic,
                explanation: `Parametric farming detected: High drop rate (${(behavior.order_drop*100).toFixed(0)}%) in mild weather. Weight: ${weights.DropRateLogic}`
            });
        }

        // 3. NEURAL SESSION PERSISTENCE
        if (behavior.session_time_hr > (thresholds.SessionPersistence || 12)) {
            anomalyScore += 35; // Significant jump for bot behaviors
            analysisDetails.push({
                feature: 'SessionExhaustion',
                weight: weights.SessionPersistence,
                explanation: `Unnatural session duration (${behavior.session_time_hr.toFixed(1)}h) exceeds node threshold. Weight: ${weights.SessionPersistence}`
            });
        }

        const finalScore = Math.min(anomalyScore, 100);
        const isBlocked = finalScore >= 60;

        return {
            anomalyScore: Math.round(finalScore),
            isBlocked,
            analysisDetails,
            modelVersion: modelConfig.modelVersion || this.MODEL_VERSION,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Persist fraud report to Firestore for audit.
     */
    async logReport(eventId, riderId, analysisResult) {
        if (!db) return;
        try {
            await db.collection('fraud_reports').doc(`RPT-${eventId}`).set({
                event_id: eventId,
                rider_id: riderId,
                ...analysisResult
            });
        } catch (e) {
            console.warn('[FRAUD_SERVICE] Logging failed:', e.message);
        }
    }
}

module.exports = new FraudIntelligenceService();
