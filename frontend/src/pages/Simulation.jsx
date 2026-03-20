import { useEffect, useState, useRef } from 'react';
import { getRiders, logSimulation, logPayout, updateRiderPayouts } from '../mockStore';
import { runBatchAnalysis, simulateWeather } from '../engine';
import { fetchWeatherForCity } from '../weather';
import { useToast } from '../App';

const SIGNAL_KEYS = ['heavyRain', 'orderDrop', 'riderInactive', 'abnormalDeliveryTime', 'lowOrderVolume', 'highWind', 'lowVisibility'];
const SIGNAL_NAMES = {
  heavyRain: 'Heavy Rain',
  orderDrop: 'Order Drop',
  riderInactive: 'Inactive',
  abnormalDeliveryTime: 'Slow Delivery',
  lowOrderVolume: 'Low Volume',
  highWind: 'High Wind',
  lowVisibility: 'Low Visibility',
};

export default function Simulation() {
  const showToast = useToast();
  const [riders, setRiders] = useState([]);
  const [weatherByCity, setWeatherByCity] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showHelp, setShowHelp] = useState(false);
  const [summaryWeather, setSummaryWeather] = useState(null);
  const [useLiveWeather, setUseLiveWeather] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const runCounterRef = useRef(0);

  useEffect(() => { initData(); }, []);

  async function initData() {
    setLoading(true);
    const riderData = await getRiders();
    setRiders(riderData);
    setLoading(false);
  }

  async function runSimulation() {
    if (riders.length === 0) return;
    setSimulating(true);
    setResults(null);
    setExpandedId(null);
    setFilter('all');

    runCounterRef.current += 1;
    const runIdx = runCounterRef.current;

    const uniqueCities = [...new Set(riders.map(r => r.city || 'Chennai'))];

    let weatherMap = {};
    if (liveMode && useLiveWeather) {
      showToast('Fetching live weather data...', 'info');
      await new Promise(r => setTimeout(r, 1000));
      for (const city of uniqueCities) {
        try {
          weatherMap[city] = await fetchWeatherForCity(city);
        } catch {
          weatherMap[city] = simulateWeather({ variance: true });
        }
      }
    } else {
      showToast('Fetching real-time weather data...', 'info');
      await new Promise(r => setTimeout(r, 1500));
      for (const city of uniqueCities) {
        weatherMap[city] = simulateWeather({ variance: true });
      }
    }

    setWeatherByCity(weatherMap);
    setSummaryWeather(weatherMap[uniqueCities[0]] || null);

    showToast('Analyzing disruption signals...', 'info');
    await new Promise(r => setTimeout(r, 1000));

    showToast('Running fraud detection on all riders...', 'info');
    await new Promise(r => setTimeout(r, 1000));

    const analysisResults = runBatchAnalysis(riders, weatherMap, runIdx);

    const paidCount = analysisResults.filter(r => r.payout?.payout > 0 && !r.fraud?.fraudFlag).length;
    const totalPaid = analysisResults.reduce((s, r) => s + (r.payout?.payout > 0 && !r.fraud?.fraudFlag ? r.payout?.payout || 0 : 0), 0);
    const fraudCount = analysisResults.filter(r => r.fraud?.fraudFlag).length;
    const noEventCount = riders.length - paidCount - fraudCount;

    await logSimulation({
      results: analysisResults,
      totalRiders: riders.length,
      totalPayouts: totalPaid,
      fraudCount,
    });

    for (const result of analysisResults) {
      if (result.payout?.payout > 0 && !result.fraud?.fraudFlag) {
        await logPayout({
          riderId: result.riderId,
          riderName: result.riderName,
          amount: result.payout.payout,
          reason: result.payout.reason,
          weather: result.weather?.description,
          rainfallMm: result.weather?.rainfallMm,
          severityScore: result.severityScore,
          tier: result.tier,
          multiplier: result.tier === 'Pro' ? '1.3x' : result.tier === 'Basic' ? '0.7x' : '1.0x',
          status: 'completed',
        });
        await updateRiderPayouts(result.riderId, result.payout.payout);
      } else if (result.fraud?.fraudFlag) {
        await logPayout({
          riderId: result.riderId,
          riderName: result.riderName,
          amount: 0,
          reason: `FLAGGED: ${result.fraud.checks?.find(c => c.flagged)?.type || 'Fraud detected'}`,
          weather: result.weather?.description,
          rainfallMm: result.weather?.rainfallMm,
          severityScore: result.severityScore,
          tier: result.tier,
          multiplier: '',
          status: 'blocked',
        });
      }
    }

    setResults(analysisResults);
    setSimulating(false);

    const msg = fraudCount > 0
      ? `${paidCount} paid | ${fraudCount} flagged | ${noEventCount} no-event`
      : `${paidCount} payouts triggered - Rs.${totalPaid.toLocaleString()}`;
    showToast(msg, fraudCount > 0 ? 'warning' : 'success');
  }

  const filteredResults = results
    ? results.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'paid') return r.payout?.payout > 0 && !r.fraud?.fraudFlag;
        if (filter === 'fraud') return r.fraud?.fraudFlag;
        if (filter === 'disrupted') return r.isDisrupted;
        if (filter === 'noevent') return !r.fraud?.fraudFlag && r.payout?.payout === 0;
        return true;
      })
    : [];

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner-lg"></div><p>Loading simulation engine...</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">AI Simulation Engine</h1>
            <p className="page-subtitle">Analyze disruption triggers, fraud detection & payout eligibility</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setShowHelp(!showHelp)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              How It Works
            </button>
            <button
              className="btn btn-primary"
              onClick={runSimulation}
              disabled={simulating || riders.length === 0}
            >
              {simulating ? (
                <><div className="spinner spinner-white"></div> Analyzing...</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Run Simulation
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {showHelp && <HelpPanel />}

      <div className="demo-scenario-bar">
        <div className="demo-mode-toggle">
          <button
            className={`demo-toggle-btn ${!liveMode ? 'active' : ''}`}
            onClick={() => setLiveMode(false)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Demo Mode
          </button>
          <button
            className={`demo-toggle-btn ${liveMode ? 'active' : ''}`}
            onClick={() => setLiveMode(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Live Mode
          </button>
        </div>

        {liveMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {useLiveWeather ? 'Live weather data' : 'Simulated weather'}
            </span>
            <button
              className="toggle-switch"
              onClick={() => setUseLiveWeather(v => !v)}
              style={{ background: useLiveWeather ? 'var(--success)' : 'var(--surface-3)' }}
            >
              <div className="toggle-knob" style={{ transform: useLiveWeather ? 'translateX(16px)' : 'translateX(0)' }} />
            </button>
          </div>
        )}

        {!liveMode && (
          <span className="scenario-preview-text">
            Each run produces a different mix of paid, flagged, and no-event riders
          </span>
        )}
      </div>

      {!results && !simulating && (
        <div className="sim-idle">
          <div className="sim-idle-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.94"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.94"/>
            </svg>
          </div>
          <h3>AI Simulation Engine</h3>
          <p>Click "Run Simulation" to analyze all riders for weather disruption triggers and run fraud detection across 6 checks.</p>
          <button className="btn btn-primary" onClick={runSimulation} disabled={riders.length === 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Run Simulation
          </button>
        </div>
      )}

      {simulating && (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ marginBottom: 16 }}>
            <div className="spinner spinner-lg spinner-primary" style={{ margin: '0 auto' }}></div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>AI Engine Analyzing...</p>
        </div>
      )}

      {results && (
        <>
          <WeatherPanel weather={summaryWeather} liveMode={liveMode} />

          <PredictionsSection results={results} />

          <OutcomeSummary results={results} />

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                Rider Analysis
              </h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filteredResults.length} of {results.length}</span>
                <div className="filter-tabs">
                  {[
                    ['all', 'All'],
                    ['paid', 'Paid'],
                    ['fraud', 'Flagged'],
                    ['noevent', 'No Event'],
                    ['disrupted', 'Disrupted'],
                  ].map(([f, label]) => (
                    <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th>Rider</th>
                    <th>City</th>
                    <th>Active</th>
                    <th>Severity</th>
                    <th>Signals</th>
                    <th>Status</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map(result => (
                    <ResultRow
                      key={result.riderId}
                      result={result}
                      expanded={expandedId === result.riderId}
                      onToggle={() => setExpandedId(expandedId === result.riderId ? null : result.riderId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OutcomeSummary({ results }) {
  const paid = results.filter(r => r.payout?.payout > 0 && !r.fraud?.fraudFlag);
  const flagged = results.filter(r => r.fraud?.fraudFlag);
  const noEvent = results.filter(r => !r.fraud?.fraudFlag && r.payout?.payout === 0);
  const totalPaid = paid.reduce((s, r) => s + r.payout?.payout || 0, 0);

  return (
    <div className="outcome-summary-bar">
      <div className="outcome-chip cleared">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <strong>{paid.length}</strong> Paid
        <span className="outcome-amount">Rs.{totalPaid.toLocaleString()}</span>
      </div>
      <div className="outcome-chip flagged">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <strong>{flagged.length}</strong> Flagged
        <span className="outcome-amount">Fraud detected</span>
      </div>
      <div className="outcome-chip noevent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
          <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <strong>{noEvent.length}</strong> No Event
        <span className="outcome-amount">Below threshold</span>
      </div>
    </div>
  );
}

function ResultRow({ result, expanded, onToggle }) {
  const flaggedChecks = result.fraud?.checks?.filter(c => c.flagged) || [];

  return (
    <>
      <tr onClick={onToggle} style={{ cursor: 'pointer' }} className="analysis-row">
        <td style={{ padding: '12px 10px' }}>
          <button className={`expand-btn ${expanded ? 'open' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </td>
        <td>
          <div className="user-cell">
            <div className="user-avatar" style={{
              background: result.tier === 'Pro' ? 'var(--purple-light)' : result.tier === 'Basic' ? 'var(--surface-2)' : 'var(--info-light)',
              color: result.tier === 'Pro' ? 'var(--purple)' : result.tier === 'Basic' ? 'var(--text-muted)' : 'var(--info)',
              fontWeight: 700, fontSize: 12,
            }}>
              {result.riderName?.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{result.riderName}</span>
              <span className="user-meta">{result.tier} Tier</span>
            </div>
          </div>
        </td>
        <td>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{result.city}</span>
          <span className="user-meta" style={{ display: 'block' }}>{result.weather?.description}</span>
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className={`activity-dot ${result.behavior?.riderActive ? 'active' : 'none'}`}></div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {result.behavior?.riderActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </td>
        <td>
          <span className={`pill ${
            result.severityScore >= 5 ? 'pill-danger' :
            result.severityScore >= 3.5 ? 'pill-warning' :
            result.severityScore >= 1.5 ? 'pill-success' : 'pill-grey'
          }`} style={{ fontSize: 11 }}>
            {result.severityScore.toFixed(1)}
          </span>
        </td>
        <td>
          <div className="signal-count-badge">
            <span className="signal-count-num">{result.activeSignalCount}</span>
            <span className="signal-count-label">/ 7</span>
            {result.activeSignalCount >= 4 && (
              <span className="multi-badge">+20%</span>
            )}
          </div>
        </td>
        <td>
          <span className={`risk-indicator ${
            result.payoutStatus === 'FLAGGED' ? 'blocked' :
            result.payoutStatus === 'CLEARED' ? 'low' : 'none'
          }`}>
            {result.payoutStatus === 'FLAGGED' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ) : result.payoutStatus === 'CLEARED' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            )}
            {result.payoutStatus}
          </span>
        </td>
        <td>
          <span className={`amount ${
            result.payout?.payout > 0 && !result.fraud?.fraudFlag ? 'success' : 
            result.fraud?.fraudFlag ? 'danger' : 'muted'
          }`} style={{ fontSize: 14 }}>
            {result.payout?.payout > 0 && !result.fraud?.fraudFlag ? `Rs.${result.payout.payout}` : 'Rs.0'}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={8} className="accordion-detail">
            <div className="detail-grid">
              <div className="detail-section">
                <div className="detail-section-title">Weather Signals (7 checks)</div>
                <div className="signal-chips">
                  {SIGNAL_KEYS.map(key => {
                    const active = result.signals?.[key]?.active;
                    return (
                      <span key={key} className={`signal-chip ${active ? 'on' : 'off'}`}>
                        {active ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="9" height="9">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="9" height="9">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                        {SIGNAL_NAMES[key]}
                      </span>
                    );
                  })}
                </div>
                {result.activeSignalCount >= 4 && (
                  <div className="multi-signal-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Multi-Signal Bonus +20%
                  </div>
                )}
              </div>

              <div className="detail-section fraud-section">
                <div className="detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Fraud Detection (6 checks)
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`pill ${
                      flaggedChecks.length > 0 ? 'pill-danger' : 'pill-success'
                    }`} style={{ fontSize: 10 }}>
                      {flaggedChecks.length > 0 ? `${flaggedChecks.length} FLAGGED` : 'ALL PASS'}
                    </span>
                    <span className={`pill ${result.fraud?.riskLevel === 'HIGH' ? 'pill-danger' : result.fraud?.riskLevel === 'MEDIUM' ? 'pill-warning' : 'pill-success'}`} style={{ fontSize: 10 }}>
                      RISK: {result.fraud?.riskLevel}
                    </span>
                  </div>
                </div>
                <div className="fraud-card-grid">
                  {result.fraud?.checks?.map((check, i) => (
                    <div key={i} className={`fraud-card ${check.flagged ? 'flagged' : 'passed'}`}>
                      <div className="fraud-card-header">
                        <span className="fraud-card-name">{check.type}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className={`fraud-card-badge ${check.flagged ? 'fail' : 'pass'}`}>
                            {check.flagged ? 'FLAGGED' : 'PASS'}
                          </span>
                          {check.flagged && (
                            <span className="fraud-score-tag">+{check.score}</span>
                          )}
                        </div>
                      </div>
                      <div className="fraud-card-reason">{check.reason}</div>
                      <div className="fraud-card-detail">{check.details}</div>
                    </div>
                  ))}
                </div>
                <div className="fraud-summary">
                  <div className="fraud-score-row">
                    <span className="fraud-score-label">Fraud Score</span>
                    <div className="fraud-score-bar-wrap">
                      <div className="progress-bar fraud-bar">
                        <div
                          className={`progress-fill ${
                            result.fraud?.fraudScore > 70 ? 'danger' :
                            result.fraud?.fraudScore > 30 ? 'warning' : 'success'
                          }`}
                          style={{ width: `${result.fraud?.fraudScore}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`fraud-score-value ${result.fraud?.fraudFlag ? 'danger-val' : ''}`}>
                      {result.fraud?.fraudScore}%
                    </span>
                    {result.fraud?.fraudFlag && (
                      <span className="fraud-threshold-note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                        </svg>
                        {result.fraud?.fraudScore}% ≥ 30% threshold = BLOCKED
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-title">Payout Decision</div>
                <div className={`payout-box ${
                  result.payoutStatus === 'FLAGGED' ? 'blocked' :
                  result.payoutStatus === 'CLEARED' ? 'cleared' : 'none'
                }`}>
                  <div className="payout-tier" style={{
                    color: result.payoutStatus === 'FLAGGED' ? 'var(--danger)' :
                           result.payoutStatus === 'CLEARED' ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {result.payoutStatus === 'FLAGGED' ? 'FRAUD - BLOCKED' : result.payoutStatus === 'CLEARED' ? result.payout?.tier : 'NO EVENT'}
                  </div>
                  <div className="payout-amount" style={{
                    color: result.payoutStatus === 'FLAGGED' ? 'var(--danger)' :
                           result.payoutStatus === 'CLEARED' ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    Rs.{result.payout?.payout || 0}
                  </div>
                  <div className="payout-reason-text" style={result.payoutStatus === 'FLAGGED' ? { color: 'var(--danger)', fontWeight: 600 } : {}}>
                    {result.payoutStatus === 'FLAGGED'
                      ? `FLAGGED: ${result.fraud.checks?.find(c => c.flagged)?.type || 'Fraud'} check failed`
                      : result.payout?.reason || 'No qualifying disruption detected'}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function WeatherPanel({ weather, liveMode }) {
  return (
    <div className="weather-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          </svg>
          Current Conditions
          {!liveMode && <span className="demo-badge">DEMO</span>}
        </h2>
      </div>

      {weather ? (
        <div className="weather-row">
          <div className="weather-metrics">
            <div className="weather-metric">
              <span className="weather-metric-label">Rain</span>
              <span className="weather-metric-value">{weather.rainfallMm} mm</span>
            </div>
            <div className="weather-metric">
              <span className="weather-metric-label">Temp</span>
              <span className="weather-metric-value">{weather.temperatureC}°C</span>
            </div>
            <div className="weather-metric">
              <span className="weather-metric-label">Humidity</span>
              <span className="weather-metric-value">{weather.humidity}%</span>
            </div>
            <div className="weather-metric">
              <span className="weather-metric-label">Wind</span>
              <span className="weather-metric-value">{weather.windKph} km/h</span>
            </div>
            <div className="weather-metric">
              <span className="weather-metric-label">Visibility</span>
              <span className="weather-metric-value">{weather.visibility} km</span>
            </div>
          </div>
          <span className={`pill ${
            weather.severity === 'CRITICAL' ? 'pill-danger' :
            weather.severity === 'HIGH' ? 'pill-warning' :
            weather.severity === 'MEDIUM' ? 'pill-info' :
            weather.severity === 'LOW' ? 'pill-success' : 'pill-grey'
          }`} style={{ fontSize: 12, padding: '5px 12px' }}>
            {weather.severity || 'NONE'}
          </span>
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No weather data</div>
      )}
    </div>
  );
}

function PredictionsSection({ results }) {
  const avgSeverity = results.reduce((s, r) => s + r.severityScore, 0) / results.length;
  const maxSeverity = Math.max(...results.map(r => r.severityScore));
  const disruptedCount = results.filter(r => r.isDisrupted).length;
  const avgSeverity2 = avgSeverity.toFixed(1);
  const predictedRisk = disruptedCount >= results.length / 2 ? 'HIGH' : disruptedCount > 0 ? 'MEDIUM' : 'LOW';

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <h2 className="card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          AI Predictions
        </h2>
      </div>
      <div className="card-body">
        <div className="predictions-list">
          <div className="prediction-row">
            <span className="prediction-label">Predicted Risk</span>
            <span className={`prediction-value ${predictedRisk === 'HIGH' ? 'high' : predictedRisk === 'MEDIUM' ? 'medium' : 'low'}`}>
              {predictedRisk}
            </span>
          </div>
          <div className="prediction-row">
            <span className="prediction-label">Avg Severity</span>
            <span className={`prediction-value ${avgSeverity >= 5 ? 'high' : avgSeverity >= 3.5 ? 'medium' : 'low'}`}>
              {avgSeverity2} / 10.0
            </span>
          </div>
          <div className="prediction-row">
            <span className="prediction-label">Max Severity Expected</span>
            <span className={`prediction-value ${maxSeverity >= 5 ? 'high' : maxSeverity >= 3.5 ? 'medium' : 'low'}`}>
              {maxSeverity.toFixed(1)} / 10.0
            </span>
          </div>
          <div className="prediction-row">
            <span className="prediction-label">Riders Disrupted</span>
            <span className="prediction-value" style={{ color: 'var(--text)' }}>
              {disruptedCount} of {results.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="help-panel">
      <div className="help-section">
        <div className="help-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Disruption vs Payout
        </div>
        <div className="help-grid">
          <div className="help-card">
            <h4>DISRUPTION</h4>
            <p>Weather conditions affect rider performance</p>
            <ul>
              <li>Severity Score ≥ 1.5</li>
              <li>At least 2 of 7 signals active</li>
            </ul>
            <p className="help-note">May qualify, but could be blocked by fraud</p>
          </div>
          <div className="help-card payout">
            <h4>PAYOUT</h4>
            <p>Actual money disbursed to rider</p>
            <ul>
              <li>Must be DISRUPTED first</li>
              <li>Must PASS all fraud checks</li>
              <li>Severity ≥ 1.0 for any payout</li>
            </ul>
            <p className="help-note">Base amounts: Rs.300-1000 x tier multiplier</p>
          </div>
        </div>
      </div>

      <div className="help-section">
        <div className="help-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          The 7 Disruption Signals
        </div>
        <table className="help-table">
          <thead><tr><th>Signal</th><th>Condition</th><th>Weight</th></tr></thead>
          <tbody>
            {[
              ['Heavy Rain', 'Rainfall > 10mm/hr', '35%'],
              ['Order Drop', 'Orders dropped > 30%', '30%'],
              ['Inactive', 'Rider not active', '20%'],
              ['Slow Delivery', 'Delivery > 45 min', '10%'],
              ['Low Volume', 'Orders < 50% baseline', '5%'],
              ['High Wind', 'Wind > 40 km/h', '5%'],
              ['Low Visibility', 'Visibility < 5 km', '5%'],
            ].map(([name, cond, w]) => (
              <tr key={name}><td><strong>{name}</strong></td><td>{cond}</td><td>{w}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="help-formula">DISRUPTION = Severity ≥ 1.5 AND Signals ≥ 2</p>
      </div>

      <div className="help-section">
        <div className="help-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.94"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.94"/>
          </svg>
          Fraud Detection (6 Checks)
        </div>
        <table className="help-table">
          <thead><tr><th>Check</th><th>Weight</th><th>Condition</th></tr></thead>
          <tbody>
            {[
              ['Rain Correlation', '25%', '≥80% inactive during rain'],
              ['Velocity Spike', '20%', '>3x payout spike'],
              ['Ghost Rider', '20%', 'No weather + long absence'],
              ['Synced Inactivity', '15%', '≥75% inactive together'],
              ['Behavioral', '10%', '>2x delivery deviation'],
              ['Cluster', '10%', '>40% inactivity excess'],
            ].map(([name, w, t]) => (
              <tr key={name}><td><strong>{name}</strong></td><td>{w}</td><td style={{ fontSize: 10 }}>{t}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="help-formula">Fraud Score ≥ 30% AND 1+ checks flagged = FLAGGED (payout blocked)</p>
      </div>

      <div className="help-section">
        <div className="help-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
          Payout Tiers
        </div>
        <table className="help-table">
          <thead><tr><th>Tier</th><th>Severity</th><th>Base</th><th>Pro (1.3x)</th><th>Standard</th><th>Basic (0.7x)</th></tr></thead>
          <tbody>
            {[
              ['Critical', '≥ 5.0', 'Rs.1000', 'Rs.1300', 'Rs.1000', 'Rs.700'],
              ['High', '≥ 3.5', 'Rs.700', 'Rs.910', 'Rs.700', 'Rs.490'],
              ['Medium', '≥ 2.5', 'Rs.500', 'Rs.650', 'Rs.500', 'Rs.350'],
              ['Low', '≥ 1.0', 'Rs.300', 'Rs.390', 'Rs.300', 'Rs.210'],
            ].map(([tier, sev, base, pro, std, basic]) => (
              <tr key={tier}><td><strong>{tier}</strong></td><td>{sev}</td><td>{base}</td><td>{pro}</td><td>{std}</td><td>{basic}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="help-formula">Multi-Signal Bonus: +20% if 4+ signals active</p>
      </div>
    </div>
  );
}
