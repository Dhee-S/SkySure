export function analyzeRider(rider, weather, allRidersActivity) {
  const behavior = simulateRiderBehavior(rider, weather);
  const signalResult = evaluateSignals(weather, behavior, rider.tier);
  const fraudResult = detectFraud(rider, weather, behavior, allRidersActivity);
  const payoutResult = assignPayout(signalResult.severityScore, fraudResult, signalResult.signals, rider.tier);

  const activeSignals = Object.entries(signalResult.signals)
    .filter(([_, s]) => s.active)
    .map(([key, s]) => {
      if (key === 'heavyRain') return `Rain ${s.value.toFixed(1)}mm`;
      if (key === 'orderDrop') return `Order Drop ${s.value.toFixed(0)}%`;
      if (key === 'riderInactive') return 'Inactive';
      if (key === 'abnormalDeliveryTime') return `Slow ${s.value}min`;
      if (key === 'lowOrderVolume') return `Low Volume ${s.value}`;
      if (key === 'highWind') return `Wind ${s.value.toFixed(0)}km/h`;
      if (key === 'lowVisibility') return `Visibility ${s.value}km`;
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
  };
}
