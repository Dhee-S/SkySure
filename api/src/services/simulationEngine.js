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

    evaluate: (telemetry, behavior, incidents = []) => {
            let severityScore = 0;
            const activePerils = [];
            let breachedCount = 0;
            const details = {};
            const proofOfCause = [];

            // Helper to build proof
            const addProof = (trigger, value, threshold, source) => {
                proofOfCause.push({
                    trigger,
                    observed: value,
                    threshold,
                    verification_source: source,
                    status: 'VERIFIED'
                });
            };

            // T1: Precipitation (Max 40)
            let rainPts = 0;
            const rainIncident = incidents.find(i => i.subtype === 'Precipitation');
            const rainThreshold = rainIncident?.severity_threshold || 10;
            
            if (telemetry.rainfall >= rainThreshold) { 
                rainPts = telemetry.rainfall >= 25 ? 40 : 15; 
                activePerils.push(telemetry.rainfall >= 25 ? 'Severe Rain' : 'Moderate Rain'); 
                breachedCount++;
                addProof('Precipitation', `${telemetry.rainfall}mm`, rainThreshold, rainIncident?.source || 'OpenMeteo-Node');
            }
            severityScore += rainPts;
            details.rain = { val: telemetry.rainfall, active: telemetry.rainfall >= rainThreshold, pts: rainPts, label: 'Precipitation' };

            // T2: Wind Hazard (Max 30)
            let windPts = 0;
            if (telemetry.windSpeed >= 35) { 
                windPts = telemetry.windSpeed >= 55 ? 30 : 15; 
                activePerils.push(telemetry.windSpeed >= 55 ? 'Gale Wind Hazard' : 'High Wind'); 
                breachedCount++;
                addProof('WindHazard', `${telemetry.windSpeed}km/h`, 35, 'WeatherAPI-V3');
            }
            severityScore += windPts;
            details.wind = { val: telemetry.windSpeed, active: telemetry.windSpeed >= 35, pts: windPts, label: 'Wind Hazard' };

            // T3: Earning Volatility Drop (Max 35)
            let velocityPts = 0;
            const drop = (behavior.order_drop || 0) * 100;
            if (drop > 50) { 
                velocityPts = drop > 75 ? 35 : 25; 
                activePerils.push(drop > 75 ? 'Critical Income Halt' : 'Velocity Drop'); 
                breachedCount++;
                addProof('OrderVelocity', `${drop}% Drop`, 50, 'Platform-Order-Store');
            }
            severityScore += velocityPts;
            details.velocity = { val: drop.toFixed(0) + '%', active: drop > 50, pts: velocityPts, label: 'Earning Velocity' };

            // T4: Rider Inactivity (Max 25)
            let inactivityPts = 0;
            if (behavior.session_time_hr < 4) {
                inactivityPts = behavior.session_time_hr < 2 ? 25 : 10;
                activePerils.push(behavior.session_time_hr < 2 ? 'Node Offline' : 'Latency Delay');
                breachedCount++;
                addProof('RiderInactivity', `${behavior.session_time_hr}h`, 4, 'Identity-Heartbeat');
            }
            severityScore += inactivityPts;
            details.inactivity = { val: behavior.session_time_hr + 'h', active: behavior.session_time_hr < 4, pts: inactivityPts, label: 'Rider Activity' };

            // T5: Network / Traffic Density (Max 25)
            let trafficPts = 0;
            const trafficIncident = incidents.find(i => i.type === 'TRAFFIC');
            if (telemetry.trafficLevel === 'High' || trafficIncident) { 
                trafficPts = 25; 
                activePerils.push('Severe Congestion'); 
                breachedCount++;
                addProof('TrafficDensity', telemetry.trafficLevel, 'High', trafficIncident?.source || 'Internal-Traffic-Node');
            }
            severityScore += trafficPts;
            details.traffic = { val: telemetry.trafficLevel, active: telemetry.trafficLevel === 'High', pts: trafficPts, label: 'Network Delay' };

            // T6: Zonal Social Curfew (Max 25)
            const socialIncident = incidents.find(i => i.type === 'SOCIAL');
            let socialPts = (socialIncident || (telemetry.isStressMode && Math.random() > 0.8)) ? 25 : 0;
            if (socialPts > 0) {
                activePerils.push('Zonal Social Curfew');
                breachedCount++;
                addProof('SocialCurfew', 'Active', 'Incident-Registry', socialIncident?.description || 'Stress Mode Induced');
            }
            severityScore += socialPts;
            details.social = { val: socialPts > 0 ? 'Active' : 'Nominal', active: socialPts > 0, pts: socialPts, label: 'Social Curfew' };

            // T7: Visibility Hazard (Max 20)
            let visPts = 0;
            const visibility = telemetry.rainfall > 15 ? 4.5 : 10;
            if (visibility < 8) {
                visPts = 20;
                activePerils.push('Low Visibility');
                breachedCount++;
                addProof('Visibility', `${visibility}km`, 8, 'Haze-Sensor-Proxy');
            }
            severityScore += visPts;
            details.visibility = { val: visibility + 'km', active: visibility < 8, pts: visPts, label: 'Visibility' };

            return {
                totalSeverity: Math.min(severityScore, 100),
                rawSeverity: severityScore,
                isTriggered: severityScore >= 43, // Slightly higher threshold for "Advanced" mode
                breachedCount,
                activePerils,
                details,
                proofOfCause
            };
        }
    }
};

/**
 * [LEGACY] Redundant but kept for backward compatibility. 
 * Use FraudIntelligenceService.analyze for new builds.
 */
const executeAdvancedFraudEngine = (rider, env, behavior) => {
    // 1. PERSONA CONTEXT
    const personaKey = rider.persona_type || 'Gig-Pro';
    const persona = ACTUARIAL_CONFIG.PERSONAS[personaKey] || ACTUARIAL_CONFIG.PERSONAS['Gig-Pro'];
    const trustScore = rider.trust_score || 85; 
    const isProbation = rider.probation_status === true;
    const efficiency = behavior.earning_efficiency || 1;
    const sessionHr = behavior.session_time_hr || 6;

    let baseRingScore = 5; 
    const reasons = [];

    // Simple logic for immediate simulation feedback
    if (env.trafficLevel === 'High' && efficiency > 0.90) {
        baseRingScore += 40;
        reasons.push("Kinematic mismatch in traffic");
    }
    
    if (behavior.earning_efficiency > 0.95 && behavior.session_time_hr < 2) {
        baseRingScore += 70; 
        reasons.push("Synthetic GPS heartbeat detected");
    }

    const rawScore = baseRingScore * (persona.trustModifier || 1.0) * (isProbation ? 1.6 : 1.0);
    const threatLevel = Math.min(Math.ceil(rawScore / 10), 10);

    return {
        threatLevel,
        score: Math.min(rawScore, 100),
        isBlocked: threatLevel >= 6,
        reasons,
        summary: reasons.length > 0 ? reasons[0] : "Biometric and telemetry signals verified."
    };
};

const calculateAdaptivePayout = (rider, severityData, fraudResult, env) => {
    // 1. Differentiated Persona Matrix for Caps
    const persona = ACTUARIAL_CONFIG.PERSONAS[rider.persona_type] || ACTUARIAL_CONFIG.PERSONAS['Gig-Pro'];
    const payoutCap = persona.maxPayoutCap || 500;
    
    // 2. CONTEXTUAL LABEL ENGINE (Based on env)
    let contextLabel = "Partly Cloudy";
    if (env.rainfall > 20) contextLabel = "Severe Storm / Flash Flood";
    else if (env.rainfall > 10) contextLabel = "Stormy / Heavy Rain";
    else if (env.rainfall > 5) contextLabel = "Rainy / Moderate Precipitation";
    else if (env.windSpeed > 40) contextLabel = "Gale Wind / High Hazard";
    else if (env.trafficLevel === 'High') contextLabel = "Heavy Congestion / Delay";
    else if (env.isStressMode) contextLabel = "Network Stress Event";

    if (fraudResult.isBlocked) {
        return { 
            amount: 0, 
            status: 'MITIGATED', 
            reason: 'FRAUD_BLOCK', 
            context: contextLabel,
            math: { baseline: 0, impact: 0, severity: 0, confidence: 0 } 
        };
    }

    if (!severityData.isTriggered) {
        return { 
            amount: 0, 
            status: 'NOMINAL', 
            reason: 'THRESHOLD_NOT_MET', 
            context: contextLabel,
            math: { baseline: 0, impact: 0, severity: 0, confidence: 0 } 
        };
    }

    // 3. INCOME PROTECTION (VELOCITY GAP) LOGIC
    // Get the Historical Daily Baseline (weekly / 7)
    const weeklyTotal = parseFloat(rider.past_week_earnings) || 4500;
    const dailyBaseline = weeklyTotal / 7;

    // App Downtime (T4 Offline) and Social Curfews (T6) are 'High Impact'
    let impactFactor = 0.55; 
    if (severityData.activePerils.includes('Node Offline')) impactFactor = 0.92;
    if (severityData.activePerils.includes('Zonal Social Curfew')) impactFactor = 0.85;
    if (severityData.totalSeverity > 75) impactFactor = 0.88;

    const lossEstimate = dailyBaseline * impactFactor;

    // 4. APPLY ACTUARIAL MULTIPLIERS
    const severityMultiplier = severityData.totalSeverity / 100;
    const confidenceMultiplier = (100 - (fraudResult.score || (fraudResult.threatLevel * 10) || 15)) / 100;

    const rawSettlement = lossEstimate * severityMultiplier * confidenceMultiplier;
    
    // Final Adaptive Cap (Ensuring the pool stays solvent)
    const finalAmount = Math.min(payoutCap * 1.5, Math.round(rawSettlement));

    return {
        status: 'APPROVED',
        amount: finalAmount,
        context: contextLabel,
        math: {
            baseline: Math.round(dailyBaseline),
            impact: impactFactor,
            severity: severityMultiplier,
            confidence: confidenceMultiplier,
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
