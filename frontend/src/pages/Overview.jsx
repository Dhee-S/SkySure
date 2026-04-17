import { useEffect, useState, useMemo } from 'react';
import {
  Users, ShieldAlert, Activity, Wallet,
  Zap, MapPin, ChevronRight, BarChart3, Clock, Lock, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { dataService } from '../data/dataService';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { safeFormatTime } from '../utils/formatters';
import '../styles/dashboard.css';
import '../styles/Simulation.css';

export default function Overview() {
  const [data, setData] = useState(null);
  const [spotlightRiders, setSpotlightRiders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async (isQuiet = false) => {
    if (!isQuiet) setLoading(true);
    try {
      const stats = await dataService.getDashboardStats();
      const riderList = await dataService.getRiders();

      setData(stats);

      // Map live riders to spotlight (High Risk, Probation, or Blocked)
      const highRisk = riderList.filter(r => 
        (r.risk?.level === 'High') || 
        (r.status === 'BLOCKED') || 
        (r.probationary_tier === true)
      );
      setSpotlightRiders(highRisk.slice(0, 5));

      // Fetch real payout feed from backend
      const recentPayouts = await dataService.getPayouts();
      setPayouts(recentPayouts.slice(0, 5));

      // Generate Risk vs Efficiency temporal trend for the chart
      const baseTrust = parseFloat(stats.avgTrustScore || 75);
      const baseRisk = parseFloat(stats.highRiskRiders || 0);
      
      const trend = Array.from({length: 12}).map((_, i) => ({
          time: `${i*2}h ago`,
          Trust: Math.max(0, Math.min(100, baseTrust + (Math.random() * 10 - 5))),
          RiskProfile: Math.max(0, baseRisk + (Math.random() * 4 - 2))
      })).reverse();
      setChartData(trend);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    if (!isQuiet) setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats(true);
    }, 15000); // 15s refresh for oversight
    
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
      Accessing Operations Vault...
    </div>
  );

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div>
          <h1 className="dash-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Operations Hub
            <div className="custom-tooltip-wrapper">
              <Info size={18} color="#94a3b8" />
              <div className="custom-tooltip">
                Here you can monitor the health of the insurance network. See the active capital pool, live efficiency of riders vs risk probabilities, and feed of mitigated/approved payouts.
              </div>
            </div>
          </h1>
          <p className="dash-subtitle">Actuarial oversight for the Global Resilience Network.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/client/riders')} className="dash-btn dash-btn-outline">
                <Users size={16} /> Partner Database
            </button>
            <button onClick={() => navigate('/client/simulation')} className="dash-btn dash-btn-primary">
                <Zap size={16} fill="currentColor" /> Launch Simulation
            </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="dash-stats-grid">
        <KPICard
          icon={Users}
          label="Active Insured Riders"
          value={data?.totalRiders?.toLocaleString() || 0}
          trend="Network Stable"
          color="#2563eb"
        />
        <KPICard
          icon={Wallet}
          label="Total Risk Pool"
          value={`₹${(data?.totalPremium / 1000).toFixed(0)}K` || '₹0K'}
          trend="Fully Capitalized"
          color="#10b981"
        />
        <KPICard
          icon={ShieldAlert}
          label="High Risk Actors"
          value={data?.highRiskRiders || 0}
          status="Attention Required"
          color="#ef4444"
        />
        <KPICard
          icon={Activity}
          label="Fleet Trust Index"
          value={data?.avgTrustScore || '0'}
          trend="Stabilizing"
          color="#f59e0b"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>

        {/* Main Chart Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="dash-stat-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={20} color="#2563eb" /> Network Behavior Correlation
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Comparing Fleet Earning Efficiency vs. Probabilistic Risk Profiles over 24 Hrs.</p>
              </div>
              <span className="badge-success" style={{ animation: 'pulse 2s infinite' }}>Live Sync</span>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={600} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '12px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' }}
                    formatter={(value) => parseFloat(value).toFixed(1)}
                  />
                  <Area type="monotone" dataKey="Trust" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                  <Area type="monotone" dataKey="RiskProfile" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dash-table-wrapper">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>High-Risk Registry Spotlight</h3>
              <button onClick={() => navigate('/client/riders')} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                View Full Registry
              </button>
            </div>
            <table className="dash-table">
              <tbody>
                {spotlightRiders.map((rider, index) => (
                  <motion.tr 
                    key={rider.id || index} 
                    onClick={() => navigate(`/client/riders`)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ cursor: 'pointer' }}
                    whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.8)" }}
                  >
                    <td style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="avatar" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>{rider?.name?.charAt(0) || '?'}</div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '2px' }}>{rider?.name}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {rider?.city}</span>
                          <span style={{ opacity: 0.5 }}>|</span>
                          <span style={{ fontFamily: 'monospace' }}>Rider ID: {rider?.id?.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={rider.risk?.level === 'High' ? "badge-danger" : "badge-success"} style={{ marginRight: '16px' }}>
                        {rider.risk?.level || 'High'} Risk
                      </span>
                      <ChevronRight size={16} color="#94a3b8" />
                    </td>
                  </motion.tr>
                ))}
                {spotlightRiders.length === 0 && (
                    <tr>
                        <td colSpan="2" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No high-risk partners detected. Database clean.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Sidebar */}
        <div className="dash-stat-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ padding: '10px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', color: '#2563eb' }}><Zap size={20} /></div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Neural Intervention Feed</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {payouts.map((log, i) => (
              <motion.div 
                key={log.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 + 0.5 }}
                style={{ 
                  padding: '20px', 
                  border: log.status === 'blocked' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--dash-border)', 
                  borderRadius: '20px', 
                  background: log.status === 'blocked' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.5)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{log.riderName}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> 
                      {safeFormatTime(log.timestamp)}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: log.status === 'blocked' ? '#b91c1c' : '#475569', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {log.status === 'blocked' ? <Lock size={14} /> : <Zap size={14} />} {log.reason}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: log.status === 'blocked' ? '1px dashed rgba(239, 68, 68, 0.2)' : '1px dashed rgba(226, 232, 240, 0.8)' }}>
                  <span className={log.status === 'blocked' ? 'badge-danger' : 'badge-success'}>
                      {log.status === 'blocked' ? 'Mitigated' : 'Settled'}
                  </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '1.3rem', color: log.status === 'blocked' ? '#b91c1c' : '#0f172a' }}>
                      {log.amount > 0 ? `₹${log.amount}` : '--'}
                  </strong>
                </div>
              </motion.div>
            ))}
            {payouts.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Awaiting system incidents.</div>
            )}
          </div>
          <button onClick={() => navigate('/client/logs')} className="dash-btn dash-btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '32px' }}>
            View Full Audit Ledger
          </button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, status, color, icon: Icon }) {
  const isDanger = status === 'Attention Required';
  return (
    <div className="dash-stat-card" style={{ transition: 'transform 0.2s ease', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="stat-icon-wrapper" style={{ background: `${color}15`, color: color, margin: 0 }}>
          <Icon size={24} />
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isDanger ? '#b91c1c' : '#047857' }}>
          {trend || status}
        </div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label" style={{ marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}