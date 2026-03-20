import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics, getPayoutLogs, getRiders, getHistoricalEvents } from '../mockStore';

export default function Overview() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [stats, payouts, ridersData] = await Promise.all([
      getAnalytics(),
      getPayoutLogs(),
      getRiders(),
    ]);
    setAnalytics(stats);
    setRecentLogs(payouts.slice(0, 8));
    setRiders(ridersData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          <div className="spinner-lg"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Enrolled Riders',
      value: analytics?.totalRiders || 0,
      detail: `${analytics?.activeRiders || 0} active`,
      icon: <RidersIcon />,
      color: 'primary',
    },
    {
      label: 'Total Disbursed',
      value: `₹${(analytics?.totalPayouts || 0).toLocaleString()}`,
      detail: 'all time',
      icon: <WalletIcon />,
      color: 'success',
    },
    {
      label: 'Payout Events',
      value: analytics?.totalEvents || 0,
      detail: `${analytics?.monthlyEvents || 0} this month`,
      icon: <EventsIcon />,
      color: 'info',
    },
    {
      label: 'Fraud Flags',
      value: analytics?.fraudFlags || 0,
      detail: 'detected',
      icon: <AlertIcon />,
      color: 'danger',
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">Portfolio performance and recent activity</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/client/simulation')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Run Simulation
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className={`kpi-icon kpi-icon--${kpi.color}`}>{kpi.icon}</div>
            <div className="kpi-body">
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-detail">{kpi.detail}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Recent Activity
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/logs')}>View all</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p>No activity yet. Run a simulation.</p>
              </div>
            ) : (
              <div>
                {recentLogs.map((log, idx) => (
                  <div key={log.id} className="recent-row" style={{ borderBottom: idx < recentLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="recent-left">
                      <div className={`status-dot ${
                        log.status === 'blocked' ? 'blocked' :
                        log.severityScore >= 3.5 ? 'high' :
                        log.severityScore >= 1.5 ? 'low' : 'none'
                      }`}></div>
                      <div className="recent-info">
                        <span className="recent-name">{log.riderName}</span>
                        <span className="recent-meta">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}
                          {log.weather}
                          {log.rainfallMm != null && log.rainfallMm > 0 && ` · ${log.rainfallMm.toFixed(1)} mm`}
                        </span>
                      </div>
                    </div>
                    <div className="recent-right">
                      <span className={`status-pill ${
                        log.status === 'blocked' ? 'status-pill--danger' :
                        log.severityScore >= 3.5 ? 'status-pill--warning' :
                        log.severityScore >= 1.5 ? 'status-pill--success' : 'status-pill--muted'
                      }`}>
                        {log.status === 'blocked' ? 'BLOCKED' :
                          log.severityScore >= 3.5 ? 'High' :
                          log.severityScore >= 1.5 ? 'Low' : 'None'}
                      </span>
                      <span className={`recent-amount ${log.amount > 0 ? 'success' : 'muted'}`}>
                        {log.amount > 0 ? `₹${log.amount}` : '---'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              Rider Breakdown
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/riders')}>Manage</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {riders.length === 0 ? (
              <div className="empty-state">
                <p>No riders enrolled</p>
              </div>
            ) : (
              <div>
                {riders.map((rider, idx) => (
                  <div key={rider.id} className="rider-row" style={{ borderBottom: idx < riders.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="rider-left">
                      <div className="rider-avatar" style={{
                        background: rider.tier === 'Pro' ? 'var(--purple-light)' : rider.tier === 'Basic' ? 'var(--surface-2)' : 'var(--info-light)',
                        color: rider.tier === 'Pro' ? 'var(--purple)' : rider.tier === 'Basic' ? 'var(--text-muted)' : 'var(--info)',
                      }}>
                        {rider.name.charAt(0)}
                      </div>
                      <div className="rider-info">
                        <span className="rider-name">{rider.name}</span>
                        <span className="rider-meta">{rider.city}</span>
                      </div>
                    </div>
                    <div className="rider-right">
                      <span className={`tier-pill tier-pill--${rider.tier?.toLowerCase()}`}>{rider.tier}</span>
                      <span className="rider-earned">₹{rider.totalPayouts?.toLocaleString() || 0}</span>
                      <div className="rider-status">
                        <div className={`status-dot ${rider.status === 'active' ? 'low' : 'none'}`}></div>
                        <span className="rider-status-text">{rider.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cta-banner">
        <div className="cta-banner__left">
          <div className="cta-banner__title">Ready to analyze?</div>
          <div className="cta-banner__sub">Run AI simulation to detect disruptions and fraud</div>
        </div>
        <button className="btn btn-white" onClick={() => navigate('/client/simulation')}>
          Start Analysis
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function RidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
