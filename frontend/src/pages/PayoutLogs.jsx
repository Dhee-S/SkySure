import { useEffect, useState } from 'react';
import { getPayoutLogs } from '../mockStore';

export default function PayoutLogs() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await getPayoutLogs();
    setPayouts(data);
    setLoading(false);
  }

  const filteredLogs = payouts.filter(log => {
    if (filter === 'All') return true;
    if (filter === 'Paid') return log.amount > 0;
    if (filter === 'Fraud') return log.status === 'blocked';
    if (filter === 'No Payout') return log.amount === 0 && log.status !== 'blocked';
    return true;
  });

  const totalDisbursed = payouts.reduce((s, p) => s + (p.amount || 0), 0);
  const paidCount = payouts.filter(p => p.amount > 0).length;
  const fraudCount = payouts.filter(p => p.status === 'blocked').length;

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner-lg"></div><p>Loading payout logs...</p></div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Payout Logs</h1>
            <p className="page-subtitle">Complete history of disbursements and fraud blocks</p>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{payouts.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">₹{totalDisbursed.toLocaleString()}</div>
            <div className="stat-label">Total Disbursed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{paidCount}</div>
            <div className="stat-label">Paid</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{fraudCount}</div>
            <div className="stat-label">Fraud Flags</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Payout History
          </h2>
          <div className="filter-tabs">
            {['All', 'Paid', 'Fraud', 'No Payout'].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          {filteredLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p>No payout records found</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Date</th>
                    <th>Weather</th>
                    <th>Signals</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{
                            background: log.status === 'blocked' ? 'var(--danger-bg)' : 'var(--success-bg)',
                            color: log.status === 'blocked' ? 'var(--danger)' : 'var(--success)',
                            fontSize: 12,
                          }}>
                            {log.riderName?.charAt(0)}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{log.riderName}</span>
                            <span className="user-meta">{log.tier || 'Standard'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                        <br />
                        <span style={{ fontSize: 11 }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{log.weather}</span>
                        {log.rainfallMm != null && log.rainfallMm > 0 && (
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                            {log.rainfallMm.toFixed(1)} mm
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {log.rainfallMm > 5 && (
                            <span className="pill pill-info" style={{ fontSize: 10 }}>Rain</span>
                          )}
                          {log.rainfallMm > 12 && (
                            <span className="pill pill-warning" style={{ fontSize: 10 }}>Storm</span>
                          )}
                          {log.severityScore >= 1.5 && (
                            <span className="pill pill-grey" style={{ fontSize: 10 }}>Inactive</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${
                          log.severityScore >= 5 ? 'pill-danger' :
                          log.severityScore >= 3.5 ? 'pill-warning' :
                          log.severityScore >= 1.5 ? 'pill-success' : 'pill-grey'
                        }`} style={{ fontSize: 11 }}>
                          {log.severityScore.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-indicator ${
                          log.status === 'blocked' ? 'blocked' :
                          log.severityScore >= 3.5 ? 'medium' :
                          log.severityScore >= 1.5 ? 'low' : 'none'
                        }`}>
                          {log.status === 'blocked' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          ) : log.severityScore >= 1.5 ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : null}
                          {log.status === 'blocked' ? 'BLOCKED' :
                            log.severityScore >= 3.5 ? 'HIGH' :
                            log.severityScore >= 1.5 ? 'LOW' : 'None'}
                        </span>
                      </td>
                      <td>
                        {log.amount > 0 ? (
                          <span className="amount success" style={{ fontSize: 14 }}>₹{log.amount}</span>
                        ) : (
                          <span className="amount muted" style={{ fontSize: 14 }}>---</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
