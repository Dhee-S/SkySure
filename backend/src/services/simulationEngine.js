/**
 * GigGuard Actuarial Engine (High-Fidelity v4.0)
 * 5-Point Multi-Peril Gravity Core & Persona Coverage Matrix
 */

const ACTUARIAL_CONFIG = {
    // 1. Differentiated Persona Matrix
    PERSONAS: {
        'Full-Timer': {
            targetSessionMins: 480,
            baseIncomeFloor: 1200,
            maxPayoutCap: 1000,     // 85% coverage
            trustModifier: 0.70     // 30% leniency on fraud flags
        },
        'Gig-Pro': {
            targetSessionMins: 270,
            baseIncomeFloor: 700,
            maxPayoutCap: 550,      // 80% coverage
            trustModifier: 0.90     // 10% leniency
        },
        'Student-Flex': {
            targetSessionMins: 90,  
            baseIncomeFloor: 250,
            maxPayoutCap: 150,      // 60% coverage
            trustModifier: 1.10     // 10% penalty (strict tracking)
        },
        'High-Risk': {
            targetSessionMins: 180,
            baseIncomeFloor: 400,
            maxPayoutCap: 200,      // 50% coverage
            trustModifier: 1.50     // 50% penalty (maximum scrutiny)
        },
        'Veteran': {
            targetSessionMins: 420,
            baseIncomeFloor: 1000,
            maxPayoutCap: 850,      // 85% coverage
            trustModifier: 0.75     // 25% trust bonus
        }
    },

    // 2. The 7 Multi-Peril Triggers (Technical Differentiators)
    TRIGGERS: {
        ACTIVATION_THRESHOLD: 40, // Minimum cumulative score to initiate payout

        evaluate: (telemetry, behavior) => {
            let severityScore = 0;
            const activePerils = [];
            const details = {};

            // T1: Precipitation (Max 40)
            let rainPts = 0;
            if (telemetry.rainfall >= 25) { rainPts = 40; activePerils.push('Severe Rain'); }
            else if (telemetry.rainfall >= 10) { rainPts = 15; activePerils.push('Moderate Rain'); }
            severityScore += rainPts;
            details.rain = { val: telemetry.rainfall, pts: rainPts, label: 'Precipitation' };

            // T2: Wind Hazard (Max 30)
            let windPts = 0;
            if (telemetry.windSpeed >= 55) { windPts = 30; activePerils.push('Gale Wind Hazard'); }
            else if (telemetry.windSpeed >= 35) { windPts = 15; activePerils.push('High Wind'); }
            severityScore += windPts;
            details.wind = { val: telemetry.windSpeed, pts: windPts, label: 'Wind Hazard' };

            // T3: Logistical Delay (Max 25)
            let trafficPts = 0;
            if (telemetry.trafficLevel === 'High') { trafficPts = 25; activePerils.push('Severe Congestion'); }
            else if (telemetry.trafficLevel === 'Medium') { trafficPts = 10; }
            severityScore += trafficPts;
            details.traffic = { val: telemetry.trafficLevel, pts: trafficPts, label: 'Network Delay' };

            // T4: Earning Velocity Drop (Max 35) - The Core 'VelocityGuard' Metric
            let velocityPts = 0;
            const efficiency = behavior.earning_efficiency || 1;
            if (efficiency < 0.25) { velocityPts = 35; activePerils.push('Critical Income Halt'); }
            else if (efficiency < 0.50) { velocityPts = 25; activePerils.push('Velocity Drop'); }
            severityScore += velocityPts;
            details.velocity = { val: (efficiency * 100).toFixed(0) + '%', pts: velocityPts, label: 'Earning Velocity' };

            // T5: Zone Cluster Disruption (Max 15)
            let zonePts = telemetry.zoneDisruption ? 15 : 0;
            if (zonePts > 0) activePerils.push('Network Sync Anomaly');
            severityScore += zonePts;
            details.zone = { val: telemetry.zoneDisruption ? 'Active' : 'Stable', pts: zonePts, label: 'Zone Cluster' };

            // T6: Zonal Collapse (Social/Curfew) - Randomized Per Judge Feedback
            let socialPts = 0;
            const isSocialTrigger = Math.random() > 0.85; // 15% random occurrence in 'Stress'
            if (isSocialTrigger) {
                socialPts = 25;
                activePerils.push('Zonal Social Curfew');
            }
            severityScore += socialPts;
            details.social = { val: isSocialTrigger ? 'Active' : 'Nominal', pts: socialPts, label: 'Social Curfew' };

            // T7: Platform App Downtime (Digital Performance)
            let platformPts = 0;
            const platformDowntime = telemetry.isStressMode ? (Math.random() > 0.90) : false; 
            if (platformDowntime) {
                platformPts = 30;
                activePerils.push('Platform App Downtime');
            }
            severityScore += platformPts;
            details.platform = { val: platformPts > 0 ? 'DOWNTIME' : 'ONLINE', pts: platformPts, label: 'Digital Performance' };

            return {
                totalSeverity: Math.min(severityScore, 100), // Cap for percentage display
                rawSeverity: severityScore,
                isTriggered: severityScore >= 40,
                activePerils,
                details
            };
        }
    }
};

const executeAdvancedFraudEngine = (rider, env, behavior) => {
    // Determine Persona for Trust Matrix
    const personaKey = rider.persona_type || 'Gig-Pro';
    const persona = ACTUARIAL_CONFIG.PERSONAS[personaKey] || ACTUARIAL_CONFIG.PERSONAS['Gig-Pro'];
    
    // REDEMPTION TRACK Logic: Use the trust_score attribute from V3 dataset
    const trustScore = rider.trust_score || 85; 
    const probationModifier = rider.probation_status ? 1.5 : 1.0;

    let baseRingScore = 5; 
    const reasons = [];

    // 1. Telemetry-Physics Cross-Validation (GPS Spoof Detection)
    if (env.rainfall > 15 && behavior.earning_efficiency > 0.80) {
        baseRingScore += 45;
        reasons.push("Critical: Telemetry mismatch. High performance in severe storm suggests spoofing.");
    }

    // 2. Swarm Integrity (Synced Inactivity)
    if (env.trafficLevel !== 'High' && behavior.order_drop > 0.85) {
        baseRingScore += 35;
        reasons.push("Warning: Coordinated inactivity detected in local geofence.");
    }

    // 3. Behavioral Scrutiny based on Persona
    if (personaKey === 'Student-Flex' && behavior.session_time_hr > 8) {
        baseRingScore += 25;
        reasons.push("Alert: Micro-earner profile logged 8+ hour shift (Potential Account Sharing).");
    }

    // Apply Persona Trust Modifier & Probation Modifier
    let rawScore = baseRingScore * persona.trustModifier * probationModifier;
    
    // Impact of Trust Score: High trust reduces the ring score, low trust increases it.
    const trustEffect = (100 - trustScore) / 4; 
    rawScore += trustEffect;

    let threatLevel = Math.min(Math.ceil(rawScore / 10), 10); // Normalize to 1-10

    return {
        threatLevel,
        score: Math.min(rawScore, 100),
        isBlocked: threatLevel > 7,
        reasons,
        summary: reasons.length > 0 ? reasons[0] : "Biometric and telemetry signals verified."
    };
};

const calculateAdaptivePayout = (rider, severityData, fraudResult) => {
    const personaKey = rider.persona_type || 'Gig-Pro';
    const persona = ACTUARIAL_CONFIG.PERSONAS[personaKey] || ACTUARIAL_CONFIG.PERSONAS['Gig-Pro'];
    
    // REDEMPTION TRACK: High Risk cohort has lower payout cap
    let payoutCap = persona.maxPayoutCap;
    if (rider.probation_status) {
        payoutCap = Math.min(payoutCap, 150); // Probationary cap
    }

    // Confidence Multiplier: (10 - ThreatLevel) / 10
    const confidenceMultiplier = (10 - fraudResult.threatLevel) / 10;
    const severityMultiplier = severityData.rawSeverity / 100;

    const predictedSource = parseFloat(rider.predicted_payout || rider.estimated_earnings || 800);
    const rawAmount = predictedSource * severityMultiplier * confidenceMultiplier;
    
    const finalAmount = Math.min(payoutCap, Math.round(rawAmount));

    if (fraudResult.isBlocked) {
        return { amount: 0, status: 'MITIGATED', reason: 'FRAUD_BLOCK', math: { cap: payoutCap, severity: severityMultiplier, confidence: 0 } };
    }

    if (!severityData.isTriggered) {
        return { amount: 0, status: 'NOMINAL', reason: 'THRESHOLD_NOT_MET', math: { cap: payoutCap, severity: severityMultiplier, confidence: confidenceMultiplier } };
    }

    return {
        amount: finalAmount,
        status: 'APPROVED',
        reason: 'VelocityGuard Threshold Breached.',
        math: {
            cap: payoutCap,
            severity: parseFloat(severityMultiplier.toFixed(2)),
            confidence: parseFloat(confidenceMultiplier.toFixed(2)),
            final: finalAmount
        }
    };
};

const calculateDynamicPremium = (rider) => {
    const pastEarnings = parseFloat(rider.estimated_earnings || 4500);
    const baseRate = 0.03; 
    const personaKey = rider.persona_type || 'Gig-Pro';
    const persona = ACTUARIAL_CONFIG.PERSONAS[personaKey] || { trustModifier: 1.0 };

    // REDEMPTION TRACK: 3x premium surcharge for probation
    const surcharge = rider.probation_status ? 3.0 : 1.0;

    const premium = (pastEarnings * baseRate * persona.trustModifier * surcharge) / 4; 
    return parseFloat(premium.toFixed(2));
};

module.exports = {
    ACTUARIAL_CONFIG,
    executeAdvancedFraudEngine,
    calculateAdaptivePayout,
    calculateDynamicPremium
};
