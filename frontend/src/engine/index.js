const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const rand = () => Math.random();
const rnd = (v, d = 0) => {
  if (d === 0) return Math.round(v);
  return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
};

export const CONFIG = {
  RAINFALL_THRESHOLD_MM: 10,
  ORDER_DROP_THRESHOLD: 30,
  DELIVERY_TIME_ANOMALY_MIN: 45,
  WIND_THRESHOLD_KPH: 40,
  VISIBILITY_THRESHOLD_KM: 5,
  LOW_VOLUME_RATIO: 0.5,
  
  FRAUD_WEIGHTS: {
    RAIN_CORRELATION: 0.25,
    VELOCITY_SPIKE: 0.20,
    GHOST_RIDER: 0.20,
    SYNCED_INACTIVITY: 0.15,
    BEHAVIORAL_ANOMALY: 0.10,
    CLUSTER_ANOMALY: 0.10,
  },
  
  PAYOUT_TIERS: [
    { name: 'Critical', minSeverity: 5.0, basePayout: 1000 },
    { name: 'High', minSeverity: 3.5, basePayout: 700 },
    { name: 'Medium', minSeverity: 2.5, basePayout: 500 },
    { name: 'Low', minSeverity: 1.0, basePayout: 300 },
  ],
  
  RIDER_MULTIPLIERS: { Pro: 1.3, Standard: 1.0, Basic: 0.7 },
  BASELINE_ORDERS: { Pro: 120, Standard: 80, Basic: 50 },
  BASE_ACTIVITY_RATES: { Pro: 0.80, Standard: 0.68, Basic: 0.56 },
  
  STABILITY_BONUS: { ENROLLED_DAYS: 90, MIN_PAYOUTS: 3, CONSISTENCY: 0.6 },
  FRAUD_SCORE_THRESHOLD: 30,
  MIN_SIGNALS_FOR_DISRUPTION: 2,
  MIN_SEVERITY_FOR_DISRUPTION: 1.5,
};

export const getWeatherRiskMultiplier = (severity = 'NONE') => {
  const multipliers = {
    'CRITICAL': 1.5,
    'HIGH': 1.3,
    'MEDIUM': 1.1,
    'LOW': 1.05,
    'NONE': 1.0
  };
  return multipliers[severity] || 1.0;
};

export const calculateWeeklyPremium = (rider, currentSeverity = 'NONE') => {
  const baseRate = 0.005; // 0.5% of earnings
  const weatherMultiplier = getWeatherRiskMultiplier(currentSeverity);
  const earnings = rider.past_week_earnings || 5000;
  const premium = (earnings * baseRate) * weatherMultiplier;
  
  return Math.round(premium * 100) / 100; // Returns e.g., 34.50
};

export function simulateWeather(options = {}) {
  const scenarios = [
    { rainfallMm: 0, temperatureC: 32, humidity: 50, windKph: 12, description: 'Clear Sky', severity: 'NONE', visibility: 10 },
    { rainfallMm: 3, temperatureC: 30, humidity: 60, windKph: 15, description: 'Light Drizzle', severity: 'LOW', visibility: 8 },
    { rainfallMm: 8, temperatureC: 27, humidity: 75, windKph: 20, description: 'Moderate Rain', severity: 'MEDIUM', visibility: 6 },
    { rainfallMm: 13, temperatureC: 25, humidity: 85, windKph: 28, description: 'Heavy Rain', severity: 'HIGH', visibility: 4 },
    { rainfallMm: 18, temperatureC: 23, humidity: 92, windKph: 38, description: 'Heavy Rain', severity: 'HIGH', visibility: 3 },
    { rainfallMm: 24, temperatureC: 21, humidity: 96, windKph: 48, description: 'Thunderstorm', severity: 'CRITICAL', visibility: 2 },
  ];

  if (options.forceScenario !== undefined) {
    const idx = Math.min(Math.max(0, options.forceScenario), scenarios.length - 1);
    const base = scenarios[idx];
    const result = { ...base };
    if (options.variance !== false) {
      result.rainfallMm = rnd(Math.max(0, base.rainfallMm + (rand() - 0.5) * 3));
      result.temperatureC = rnd(base.temperatureC + (rand() - 0.5) * 2, 1);
      result.humidity = rnd(Math.min(100, base.humidity + (rand() - 0.5) * 5));
      result.windKph = rnd(Math.max(0, base.windKph + (rand() - 0.5) * 6));
      result.visibility = rnd(Math.max(1, base.visibility + (rand() - 0.5)));
    }
    return { ...result, source: 'simulated', timestamp: new Date().toISOString() };
  }

  const weights = [0.1, 0.15, 0.25, 0.25, 0.15, 0.1];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < scenarios.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      const base = scenarios[i];
      const result = { ...base };
      if (options.variance !== false) {
        result.rainfallMm = rnd(Math.max(0, base.rainfallMm + (rand() - 0.5) * 3));
        result.temperatureC = rnd(base.temperatureC + (rand() - 0.5) * 2, 1);
        result.humidity = rnd(Math.min(100, base.humidity + (rand() - 0.5) * 5));
        result.windKph = rnd(Math.max(0, base.windKph + (rand() - 0.5) * 6));
        result.visibility = rnd(Math.max(1, base.visibility + (rand() - 0.5)));
      }
      return { ...result, source: 'simulated', timestamp: new Date().toISOString() };
    }
  }
  return { ...scenarios[2], source: 'simulated', timestamp: new Date().toISOString() };
}

export function getWeatherForecast(city, hours = 6) {
  const forecasts = [];
  let weather = simulateWeather({ forceScenario: 0, variance: true });
  for (let i = 0; i < hours; i++) {
    const trend = rand() > 0.5 ? 1 : -1;
    const change = rand() * 3;
    weather = {
      rainfallMm: rnd(Math.max(0, weather.rainfallMm + trend * change)),
      temperatureC: rnd(weather.temperatureC - 0.5, 1),
      humidity: rnd(Math.min(100, weather.humidity + trend * 2)),
      windKph: rnd(Math.max(0, weather.windKph + trend * 2)),
      visibility: rnd(Math.max(1, weather.visibility - trend * 0.3)),
    };
    if (weather.rainfallMm > 20) weather.description = 'Thunderstorm';
    else if (weather.rainfallMm > 12) weather.description = 'Heavy Rain';
    else if (weather.rainfallMm > 5) weather.description = 'Moderate Rain';
    else if (weather.rainfallMm > 0) weather.description = 'Light Rain';
    else weather.description = 'Clear Sky';
    forecasts.push({
      hour: (new Date().getHours() + i + 1) % 24,
      ...weather,
      severity: weather.rainfallMm > 20 ? 'CRITICAL' : weather.rainfallMm > 12 ? 'HIGH' : weather.rainfallMm > 5 ? 'MEDIUM' : weather.rainfallMm > 0 ? 'LOW' : 'NONE',
    });
  }
  return forecasts;
}

function simulateRiderBehavior(rider, weather, runSeed = 0) {
  const baseRate = CONFIG.BASE_ACTIVITY_RATES[rider.tier] || 0.68;
  const baselineOrders = CONFIG.BASELINE_ORDERS[rider.tier] || 80;
  
  let modifier = 1.0;
  if (weather.rainfallMm > 20) modifier = 0.35;
  else if (weather.rainfallMm > 15) modifier = 0.50;
  else if (weather.rainfallMm > 10) modifier = 0.65;
  else if (weather.rainfallMm > 5) modifier = 0.80;

  // Persona based behavior
  if (rider.persona_type === 'Risk Averse') {
    modifier *= 0.8; // More likely to stop working
  } else if (rider.persona_type === 'Hustler') {
    modifier *= 1.1; // More likely to stay active
  } else if (rider.persona_type === 'Part-Timer') {
    modifier *= 0.9;
  }

  const riderHash = rider.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const prng = (offset) => {
    const x = Math.sin(riderHash * 13 + runSeed * 7 + offset * 3 + performance.now() * 0.0001);
    return x - Math.floor(x);
  };
  
  const dropProb = 0.25 + modifier * 0.5;
  let orderDrop;
  if (prng(1) < dropProb) {
    orderDrop = prng(2) * 0.55 + 0.20;
  } else {
    orderDrop = prng(3) * 0.12;
  }

  const activityProb = baseRate * modifier;
  const riderActive = prng(4) < activityProb;
  const currentOrders = Math.floor(baselineOrders * (1 - orderDrop));
  const avgDeliveryTimeMin = riderActive ? 25 + prng(5) * 15 : 55 + prng(6) * 40;

  return {
    riderActive,
    currentOrders,
    baselineOrders,
    orderDrop: rnd(orderDrop * 100),
    avgDeliveryTimeMin: Math.round(avgDeliveryTimeMin),
    lastSeenMinAgo: riderActive ? 1 + Math.floor(prng(7) * 20) : 5 + Math.floor(prng(8) * 300),
    gpsAccuracy: 10 + prng(9) * 70,
  };
}

function evaluateSignals(weather, behavior, rider) {
  const signals = {
    heavyRain: { active: weather.rainfallMm > CONFIG.RAINFALL_THRESHOLD_MM, value: weather.rainfallMm, threshold: CONFIG.RAINFALL_THRESHOLD_MM, name: 'Heavy Rain' },
    orderDrop: { active: behavior.orderDrop > CONFIG.ORDER_DROP_THRESHOLD, value: behavior.orderDrop, threshold: CONFIG.ORDER_DROP_THRESHOLD, name: 'Order Drop' },
    riderInactive: { active: !behavior.riderActive, value: behavior.riderActive ? 'Active' : 'Inactive', name: 'Inactive' },
    abnormalDeliveryTime: { active: behavior.avgDeliveryTimeMin > CONFIG.DELIVERY_TIME_ANOMALY_MIN, value: behavior.avgDeliveryTimeMin, threshold: CONFIG.DELIVERY_TIME_ANOMALY_MIN, name: 'Slow Delivery' },
    lowOrderVolume: { active: behavior.currentOrders < CONFIG.BASELINE_ORDERS[rider.tier] * CONFIG.LOW_VOLUME_RATIO, value: behavior.currentOrders, threshold: CONFIG.BASELINE_ORDERS[rider.tier] * CONFIG.LOW_VOLUME_RATIO, name: 'Low Volume' },
    highWind: { active: weather.windKph > CONFIG.WIND_THRESHOLD_KPH, value: weather.windKph, threshold: CONFIG.WIND_THRESHOLD_KPH, name: 'High Wind' },
    lowVisibility: { active: weather.visibility < CONFIG.VISIBILITY_THRESHOLD_KM, value: weather.visibility || 10, threshold: CONFIG.VISIBILITY_THRESHOLD_KM, name: 'Low Visibility' },
  };

  const weights = { heavyRain: 0.35, orderDrop: 0.30, riderInactive: 0.20, abnormalDeliveryTime: 0.10, lowOrderVolume: 0.05, highWind: 0.05, lowVisibility: 0.05 };
  
  // Specific trigger boost if rider requested it
  if (rider.payout_trigger === 'Rainfall') weights.heavyRain += 0.15;
  if (rider.payout_trigger === 'Order Drop') weights.orderDrop += 0.15;
  if (rider.payout_trigger === 'Wind Speed') weights.highWind += 0.15;

  let baseScore = 0;
  const activeSignals = [];

  Object.entries(signals).forEach(([key, signal]) => {
    if (signal.active) {
      activeSignals.push(key);
      if (key === 'heavyRain') baseScore += weights[key] * Math.min(signal.value / signal.threshold, 3);
      else if (key === 'orderDrop') baseScore += weights[key] * Math.min(signal.value / signal.threshold, 3.3);
      else baseScore += weights[key];
    }
  });

  if (weather.rainfallMm > 20) baseScore *= 1.35;
  else if (weather.rainfallMm > 15) baseScore *= 1.20;
  else if (weather.rainfallMm > 10) baseScore *= 1.10;

  const severityScore = clamp(baseScore, 0, 10);
  const isDisrupted = severityScore >= CONFIG.MIN_SEVERITY_FOR_DISRUPTION && activeSignals.length >= CONFIG.MIN_SIGNALS_FOR_DISRUPTION;

  return { signals, activeSignalCount: activeSignals.length, severityScore: rnd(severityScore, 2), isDisrupted };
}

function makeFraudChecks(rider, weather, behavior, allRidersActivity, runSeed) {
  const riderHash = rider.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const h = (offset) => {
    const x = Math.sin(riderHash * 17 + runSeed * 11 + offset * 7);
    return x - Math.floor(x);
  };

  const rc = h(1);
  const vs = h(2);
  const gr = h(3);
  const si = h(4);
  const ba = h(5);
  const ca = h(6);

  let rainCorrFlag, rainCorrScore = 0, rainCorrReason;
  if (rc > 0.85) {
    rainCorrFlag = true; rainCorrScore = 25; rainCorrReason = `${rnd(rc * 20 + 80)}% inactive during rain`;
  } else {
    rainCorrFlag = false; rainCorrReason = `Correlation: ${rnd(rc * 55 + 10)}%`;
  }

  let velSpikeFlag, velSpikeScore = 0, velSpikeReason;
  if (vs > 0.88) {
    velSpikeFlag = true; velSpikeScore = 20; velSpikeReason = `${rnd(vs * 2 + 3, 1)}x velocity spike`;
  } else {
    velSpikeFlag = false; velSpikeReason = `Ratio: ${rnd(vs * 1.8 + 0.5, 1)}x`;
  }

  let ghostFlag, ghostScore = 0, ghostReason;
  if (gr > 0.92) {
    ghostFlag = true; ghostScore = 20;
    ghostReason = behavior.lastSeenMinAgo > 180 ? 'No weather + 5hr absence' : `Absence: ${behavior.lastSeenMinAgo}min`;
  } else {
    ghostFlag = false; ghostReason = behavior.lastSeenMinAgo < 60 ? 'Recently active' : `Absence: ${behavior.lastSeenMinAgo}min verified`;
  }

  let syncFlag, syncScore = 0, syncReason;
  const inactiveRatio = allRidersActivity ? allRidersActivity.filter(a => !a.riderActive).length / Math.max(1, allRidersActivity.length) : 0;
  if (si > 0.85 && inactiveRatio > 0.6) {
    syncFlag = true; syncScore = 15; syncReason = `${rnd(inactiveRatio * 100)}% synced inactivity`;
  } else {
    syncFlag = false; syncReason = `Inactive: ${rnd(inactiveRatio * 100)}% - normal pattern`;
  }

  let behFlag, behScore = 0, behReason;
  if (ba > 0.90) {
    behFlag = true; behScore = 10; behReason = `${rnd(ba * 1.2 + 2.0, 1)}x delivery deviation`;
  } else {
    behFlag = false; behReason = 'Normal delivery patterns';
  }

  let clustFlag, clustScore = 0, clustReason;
  const expectedRatio = weather.rainfallMm / 40;
  const anomalyScore = inactiveRatio - expectedRatio;
  if (ca > 0.88 && anomalyScore > 0.30) {
    clustFlag = true; clustScore = 10; clustReason = `${rnd(anomalyScore * 100)}% inactivity excess`;
  } else {
    clustFlag = false; clustReason = `Excess: ${rnd(anomalyScore * 100)}% - within normal`;
  }

  const checks = [
    { type: 'Rain Correlation', weight: CONFIG.FRAUD_WEIGHTS.RAIN_CORRELATION, flagged: rainCorrFlag, score: rainCorrScore, reason: rainCorrReason, details: `Correlation: ${rainCorrReason}, Threshold: 80%, Events: ${rnd(rc * 12 + 5)}/5+ needed` },
    { type: 'Velocity Spike', weight: CONFIG.FRAUD_WEIGHTS.VELOCITY_SPIKE, flagged: velSpikeFlag, score: velSpikeScore, reason: velSpikeReason, details: `Ratio: ${velSpikeReason}, Latest vs Avg, Threshold: 3x` },
    { type: 'Ghost Rider', weight: CONFIG.FRAUD_WEIGHTS.GHOST_RIDER, flagged: ghostFlag, score: ghostScore, reason: ghostReason, details: `${ghostReason}, GPS: ${behavior.gpsAccuracy.toFixed(0)}%, Rain: ${weather.rainfallMm}mm` },
    { type: 'Synced Inactivity', weight: CONFIG.FRAUD_WEIGHTS.SYNCED_INACTIVITY, flagged: syncFlag, score: syncScore, reason: syncReason, details: `${syncReason}, Rain: ${weather.rainfallMm}mm, Threshold: 75%` },
    { type: 'Behavioral', weight: CONFIG.FRAUD_WEIGHTS.BEHAVIORAL_ANOMALY, flagged: behFlag, score: behScore, reason: behReason, details: `${behReason}, Delivery time vs baseline, Threshold: 2x` },
    { type: 'Cluster', weight: CONFIG.FRAUD_WEIGHTS.CLUSTER_ANOMALY, flagged: clustFlag, score: clustScore, reason: clustReason, details: `${clustReason}, Expected vs Actual inactivity` },
  ];

  const flaggedChecks = checks.filter(c => c.flagged);
  let rawScore = 0;
  if (flaggedChecks.length > 0) {
    const weightedSum = flaggedChecks.reduce((sum, c) => sum + c.score * c.weight, 0);
    const totalWeight = flaggedChecks.reduce((sum, c) => sum + c.weight, 0);
    rawScore = (weightedSum / totalWeight) * 100;
  }

  const enrolledDays = Math.floor((Date.now() - new Date(rider.enrolledAt).getTime()) / (1000 * 60 * 60 * 24));
  if (enrolledDays >= CONFIG.STABILITY_BONUS.ENROLLED_DAYS) rawScore *= 0.80;
  if ((rider.payoutCount || 0) >= CONFIG.STABILITY_BONUS.MIN_PAYOUTS) rawScore *= 0.85;
  if ((rider.consistencyRatio || 0) > CONFIG.STABILITY_BONUS.CONSISTENCY) rawScore *= 0.92;

  const fraudScore = clamp(rawScore, 0, 100);
  const fraudFlag = fraudScore >= CONFIG.FRAUD_SCORE_THRESHOLD && flaggedChecks.length > 0;

  let riskLevel = 'LOW';
  if (fraudScore > 70) riskLevel = 'HIGH';
  else if (fraudScore > 40) riskLevel = 'MEDIUM';

  return {
    fraudScore: rnd(fraudScore, 1),
    fraudFlag,
    riskLevel,
    checks: checks.map(c => ({
      type: c.type,
      flagged: c.flagged,
      score: c.score,
      weight: rnd(c.weight * 100),
      reason: c.reason,
      details: c.details,
    })),
  };
}

function assignPayout(severityScore, fraudResult, signals, rider) {
  if (fraudResult.fraudFlag) {
    return { payout: 0, tier: 'BLOCKED', reason: `Fraud detected (${fraudResult.riskLevel}) - payout blocked`, riskLevel: fraudResult.riskLevel };
  }

  const activeSignalCount = Object.values(signals).filter(s => s.active).length;
  let tier = null, basePayout = 0;

  for (const t of CONFIG.PAYOUT_TIERS) {
    if (severityScore >= t.minSeverity) { tier = t.name; basePayout = t.basePayout; break; }
  }

  if (!tier) {
    if (severityScore >= 0.5) {
      return { payout: 100, tier: 'Minimal', reason: 'Minor disruption (below tier)', riskLevel: 'LOW' };
    }
    return { payout: 0, tier: 'None', reason: 'No qualifying disruption', riskLevel: 'LOW' };
  }

  const multiplier = CONFIG.RIDER_MULTIPLIERS[rider.tier] || 1.0;
  let payout = Math.round(basePayout * multiplier);
  
  // Real Identity Enhancement: apply ring_score stability multiplier
  if (rider.ring_score > 0) {
    const ringBonus = 1.0 + (rider.ring_score * 0.2); // Up to 20% bonus for high stability
    payout = Math.round(payout * ringBonus);
  }

  // Enforce coverage limits
  const coverageCap = rider.coverage_amount_inr ? rider.coverage_amount_inr * 0.1 : 5000;
  if (payout > coverageCap) {
    payout = coverageCap;
  }

  if (activeSignalCount >= 4) {
    payout = Math.round(payout * 1.20);
    return { payout, tier, reason: `${tier} severity + Multi-signal bonus (+20%)`, riskLevel: fraudResult.riskLevel };
  }

  return { payout, tier, reason: `${tier} severity triggered`, riskLevel: fraudResult.riskLevel };
}

export function analyzeRider(rider, weather, allRidersActivity, runSeed = 0) {
  const behavior = simulateRiderBehavior(rider, weather, runSeed);
  const signalResult = evaluateSignals(weather, behavior, rider);
  const fraudResult = makeFraudChecks(rider, weather, behavior, allRidersActivity, runSeed);
  const payoutResult = assignPayout(signalResult.severityScore, fraudResult, signalResult.signals, rider);

  const activeSignals = Object.entries(signalResult.signals)
    .filter(([, s]) => s.active)
    .map(([key, s]) => {
      if (key === 'heavyRain') return `Rain ${s.value}mm`;
      if (key === 'orderDrop') return `Order Drop ${s.value}%`;
      if (key === 'riderInactive') return 'Inactive';
      if (key === 'abnormalDeliveryTime') return `Slow ${s.value}min`;
      if (key === 'lowOrderVolume') return `Low Vol ${s.value}`;
      if (key === 'highWind') return `Wind ${s.value}km/h`;
      if (key === 'lowVisibility') return `Vis ${s.value}km`;
      return key;
    });

  let payoutStatus = 'NO_EVENT';
  if (fraudResult.fraudFlag) payoutStatus = 'FLAGGED';
  else if (payoutResult.payout > 0) payoutStatus = 'CLEARED';

  return {
    riderId: rider.id,
    riderName: rider.name,
    tier: rider.tier,
    city: rider.city,
    location: rider.location?.name || rider.zone || rider.city,
    weather: { ...weather },
    behavior,
    signals: signalResult.signals,
    activeSignals,
    activeSignalCount: signalResult.activeSignalCount,
    severityScore: signalResult.severityScore,
    isDisrupted: signalResult.isDisrupted,
    fraud: fraudResult,
    payout: payoutResult,
    payoutStatus,
    payoutDecision: {
      status: payoutStatus,
      amount: payoutResult.payout,
      reason: payoutResult.reason,
    },
    persona_type: rider.persona_type,
    payout_trigger: rider.payout_trigger,
    latitude: rider.latitude,
    longitude: rider.longitude,
  };
}

export function runBatchAnalysis(riders, weatherByCity, runSeed = 0) {
  const behaviors = riders.map(r => {
    const w = weatherByCity[r.city] || weatherByCity[Object.keys(weatherByCity)[0]];
    return { riderId: r.id, ...simulateRiderBehavior(r, w, runSeed) };
  });

  return riders.map((rider, i) => {
    const weather = weatherByCity[rider.city] || weatherByCity[Object.keys(weatherByCity)[0]];
    return analyzeRider(rider, weather, behaviors, runSeed + i * 3);
  });
}

export function shuffleArray(arr, seed = 0) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(seed * (i + 1) * 13)) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
