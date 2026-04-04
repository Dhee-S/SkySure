import React, { useEffect, useState, useMemo } from 'react';
import { dataService } from '../data/dataService';
import {
  FileText, IndianRupee, ShieldCheck,
  ShieldAlert, Calendar, CloudRain,
  Search, Download, ChevronLeft, ChevronRight,
  Filter, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/dashboard.css';

export default function PayoutLogs() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await dataService.getPayouts();
        setPayouts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading payouts:", error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    return payouts.filter(log => {
      const matchesSearch = 
        log.riderName?.toLowerCase().includes(search.toLowerCase()) ||
        log.id?.toLowerCase().includes(search.toLowerCase()) ||
        log.reason?.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'Paid' && log.status === 'approved') ||
        (filter === 'Fraud' && log.status === 'blocked');
      
      return matchesSearch && matchesFilter;
    });
  }, [payouts, search, filter]);

  // Reset pagination when searching
  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      Syncing Audit Ledger...
    </div>
  );

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Audit Ledger</h1>
          <p className="dash-subtitle">Real-time immutable record of parametric triggers and security mitigations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="dash-btn dash-btn-outline">
            <Download size={14} /> Export Transaction PDF
          </button>
          <button className="dash-btn dash-btn-primary">
            Sync Ledger
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
                <motion.tr
                  key={log.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.8)' }}
                  transition={{ delay: (i % 10) * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="avatar" style={{ background: log.status === 'blocked' ? '#FEF2F2' : '#F3F4F6', color: log.status === 'blocked' ? '#DC2626' : '#1e3a8a' }}>
                      {log.riderName?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '2px' }}>{log.riderName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>TRX: {log.id?.slice(0, 12)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Calendar size={14} color="#64748b" />
                        <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '20px' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0f172a' }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span>{log.reason}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '22px' }}>
                      Context: {log.weather} | {log.location}
                    </div>
                  </td>
                  <td>
                    <span className={log.status === 'blocked' ? 'badge-danger' : 'badge-success'}>
                      {log.status === 'blocked' ? 'Mitigated' : 'Settled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800, color: log.status === 'blocked' ? '#94a3b8' : '#1e3a8a', textDecoration: log.status === 'blocked' ? 'line-through' : 'none' }}>
                        ₹{log.amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '8px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </motion.tr>
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