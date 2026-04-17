import React, { useEffect, useState, useMemo } from 'react';
import { dataService } from '../data/dataService';
import {
  FileText, IndianRupee, ShieldCheck,
  ShieldAlert, Calendar, CloudRain,
  Search, Download, ChevronLeft, ChevronRight,
  Filter, MoreVertical, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFormatDate, safeFormatTime } from '../utils/formatters';
import { AuditWorkflowPanel } from '../components/RiskEngineComponents';
import { ChevronDown } from 'lucide-react';
import '../styles/dashboard.css';

export default function PayoutLogs() {
  const [payouts, setPayouts] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [syncCount, setSyncCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const itemsPerPage = 8;

  const loadData = async (isQuiet = false) => {
    if (!isQuiet) setLoading(true);
    try {
      const data = await dataService.getPayouts();
      setPayouts(Array.isArray(data) ? data : []);
      setSyncCount(prev => prev + 1);
    } catch (error) {
      console.error("Error loading payouts:", error);
    }
    if (!isQuiet) setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        loadData(true);
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredLogs = useMemo(() => {
    return payouts.filter(log => {
      const riderName = log.riderName || '';
      const txId = log.id || '';
      const reason = log.reason || '';

      const matchesSearch = 
        riderName.toLowerCase().includes(search.toLowerCase()) ||
        txId.toLowerCase().includes(search.toLowerCase()) ||
        reason.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Paid' && log.status === 'approved') ||
        (filter === 'Fraud' && log.status === 'blocked');
      
      return matchesSearch && matchesFilter;
    });
  }, [payouts, search, filter]);

  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>
      Syncing Audit Ledger...
    </div>
  );

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               style={{ width: '8px', height: '8px', background: '#3B82F6', borderRadius: '50%', boxShadow: '0 0 10px #3B82F6' }}
            />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Neural Node Connected</span>
          </div>
          <h1 className="dash-title">Neural Feed Logger</h1>
          <p className="dash-subtitle">Synchronized autonomous telemetry and adaptive settlement ledger.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div 
             onClick={() => setIsLive(!isLive)}
             style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: isLive ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9', 
                padding: '8px 16px', 
                borderRadius: '12px', 
                border: `1px solid ${isLive ? '#10B981' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
             }}
          >
            <div style={{ position: 'relative' }}>
               <RefreshCw size={14} className={isLive ? 'animate-spin' : ''} color={isLive ? '#10B981' : '#64748B'} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isLive ? '#059669' : '#64748B' }}>
               {isLive ? 'LIVE FEED ACTIVE' : 'FEED PAUSED'}
            </span>
          </div>
          <button onClick={() => loadData()} className="dash-btn dash-btn-primary" style={{ position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'relative', zIndex: 1 }}>Force Update Ledger</span>
            <motion.div 
               animate={{ x: ['-100%', '200%'] }}
               transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
               style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
            />
          </button>
        </div>
      </header>

      <div className="dash-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--dash-border)', borderRadius: '16px', padding: '12px 20px', width: '400px' }}>
          <Search size={20} style={{ color: '#94a3b8', marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Search by rider name, TRX ID, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.95rem', fontWeight: 500 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '6px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
          {['All', 'Paid', 'Fraud'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
            >
              {f === 'Paid' ? 'Settled' : f === 'Fraud' ? 'Mitigated' : 'All Events'}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-table-wrapper">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Partner Name</th>
              <th>Temporal Signal</th>
              <th>Trigger Cause</th>
              <th>Security Outcome</th>
              <th>Settlement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedLogs.map((log, i) => (
                <React.Fragment key={log.id || i}>
                  <motion.tr
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.8)' }}
                    transition={{ delay: (i % 10) * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    style={{ cursor: 'pointer', borderLeft: expandedId === log.id ? '4px solid #3B82F6' : '4px solid transparent' }}
                  >
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="id-privacy-node" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                          {log.riderId || log.id?.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.1em' }}>PARTNER_NOD</span>
                        
                        <div className="reveal-on-hover" style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: '100%', 
                            background: '#1E293B', 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.65rem', 
                            zIndex: 20,
                            pointerEvents: 'none',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            Identity: {log.riderName || 'Anonymous Partner'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B' }}>
                          <Calendar size={14} color="#64748b" />
                          <span style={{ fontSize: '0.85rem' }}>{safeFormatDate(log.timestamp)}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                          {safeFormatTime(log.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 750, color: '#0f172a' }}>
                        <CloudRain size={16} color="#3B82F6" />
                        <span style={{ fontSize: '0.85rem' }}>{log.reason}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontWeight: 600 }}>
                        Sensors: {log.sensors}
                      </div>
                    </td>
                    <td>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <span 
                           className={`badge-${log.status === 'blocked' ? 'danger' : 'success'}`}
                           style={{ 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.08em',
                              fontSize: '0.6rem',
                              fontWeight: 900,
                              padding: '4px 10px',
                              borderRadius: '8px'
                           }}
                        >
                          {log.status === 'blocked' ? 'RISK_MITIGATED' : 'SETTLED_AUTO'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 900, color: log.status === 'blocked' ? '#94a3b8' : '#1e3a8a', textDecoration: log.status === 'blocked' ? 'line-through' : 'none' }}>
                          ₹{log.amount?.toLocaleString() || '0'}
                        </span>
                        <ChevronDown size={14} style={{ opacity: 0.3, transform: expandedId === log.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </td>
                    <td>
                      <button style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px' }}>
                        <FileText size={16} />
                      </button>
                    </td>
                  </motion.tr>

                  <AnimatePresence>
                    {expandedId === log.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan="6" style={{ padding: '24px', background: 'rgba(248, 250, 252, 0.5)', borderBottom: '1px solid var(--dash-border)' }}>
                          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <AuditWorkflowPanel node={log.nodeDetail || {}} />
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}

            </AnimatePresence>
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>No transactions found</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Try adjusting your search or filters.</p>
            <button onClick={() => { setSearch(''); setFilter('All'); }} className="dash-btn dash-btn-outline">
              Reset Audit Parameters
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderTop: '1px solid var(--dash-border)', background: 'rgba(255,255,255,0.5)' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
            Showing <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of <strong style={{ color: '#0f172a' }}>{filteredLogs.length}</strong> entries
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="dash-btn dash-btn-outline" style={{ padding: '8px 16px' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="dash-btn dash-btn-outline" style={{ padding: '8px 16px' }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}