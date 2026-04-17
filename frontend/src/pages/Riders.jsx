import { useEffect, useState, useMemo } from 'react';
import {
  Users, Search, Filter, MoreVertical,
  MapPin, Shield, ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { dataService } from '../data/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/dashboard.css';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const load = async () => {
      const data = await dataService.getRiders();
      setRiders(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    load();
  }, []);

  const filteredRiders = useMemo(() => {
    return riders.filter(r => {
      const matchesSearch = 
        (r?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r?.city || '').toLowerCase().includes(search.toLowerCase()) ||
        (r?.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (r?.rider_id || '').toLowerCase().includes(search.toLowerCase());
      
      // Use derived fraud probability from backend or calc from trust score
      const fraudVal = r?.fraud_probability ?? (r?.trust_score !== undefined ? (1 - r.trust_score / 100) : 0);
      const riskLevel = fraudVal >= 0.7 ? 'High' : (fraudVal >= 0.4 ? 'Medium' : 'Low');
      const matchesFilter = filter === 'All' || riskLevel.toLowerCase() === filter.toLowerCase();
      
      return matchesSearch && matchesFilter;
    });
  }, [riders, search, filter]);

  // Reset pagination when searching
  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage) || 1;
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      Syncing Registry...
    </div>
  );

  return (
    <div className="dash-container">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Partner Registry</h1>
          <p className="dash-subtitle">Managing {filteredRiders.length} rider profiles across the resilience network.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="dash-btn dash-btn-outline">
            <Download size={14} /> Export Rider Data
          </button>
          <button className="dash-btn dash-btn-primary">
            Add New Rider
          </button>
        </div>
      </header>

      <div className="dash-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--dash-border)', borderRadius: '16px', padding: '12px 20px', width: '400px' }}>
          <Search size={20} style={{ color: '#94a3b8', marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Search by name, city, or Rider ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.95rem', fontWeight: 500 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '6px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
          {['All', 'Low', 'High'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
            >
              {f} Risk
            </button>
          ))}
        </div>
      </div>

      <div className="dash-table-wrapper">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Partner Identity</th>
              <th>Operating City</th>
              <th>Actuarial Level</th>
              <th>Trust Score</th>
              <th>Weekly Premium</th>
              <th>Active Tier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedRiders.map((rider, i) => {
                // 1. ADAPTIVE PREMIUM: Sync with Actuarial Engine
                const premium = rider?.weeklyPremium || 120;
                
                // 3. TRUST SCORE: Direct from harmonized dataset (DB source: trust_score)
                const trustScore = rider?.trust_score || rider?.trustScore || 0;
                
                // 4. CLEAN IDENTITY
                const displayName = (rider?.name || 'Active Partner');
                const tier = rider?.tier || 'Standard';

                return (
                  <motion.tr
                    key={rider.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.8)' }}
                    transition={{ delay: (i % 10) * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className={`avatar ${rider?.probation_status ? 'avatar-probation' : ''}`}>
                        {displayName.charAt(0)}
                      </div>
                      <div className="id-privacy-node">
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '0.05em' }}>PARTNER ID</span>
                          <span className="rider-id-primary">RID-{rider?.rider_id?.slice(-8).toUpperCase() || rider?.id?.slice(-8).toUpperCase() || 'RDR-99'}</span>
                        </div>
                        <div className="reveal-on-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#1e3a8a' }}>{displayName}</strong>
                          {rider?.probation_status && (
                            <span className="badge-probation" title="Redemption Track Active">
                              PROBATION
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <MapPin size={14} color="#64748b" />
                          <span>{rider?.city}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '20px', fontFamily: 'monospace' }}>
                          {rider.persona_type || 'Gig-Pro'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                        {(() => {
                          const fraud = rider?.fraud_probability ?? (rider?.trust_score !== undefined ? (1 - rider.trust_score / 100) : 0);
                          const isHigh = fraud >= 0.7;
                          const isMed = fraud >= 0.4 && fraud < 0.7;
                          return (
                            <>
                              <span className={isHigh ? 'badge-danger' : isMed ? 'badge-warning' : 'badge-success'} style={{ width: 'fit-content' }}>
                                {isHigh ? 'HIGH' : isMed ? 'MEDIUM' : 'LOW'}
                              </span>
                              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                                {isHigh ? 'CRITICAL RISK' : isMed ? 'ADAPTIVE NODE' : 'STABLE ASSET'}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ height: '6px', width: '80px', background: 'rgba(226, 232, 240, 0.8)', borderRadius: '100px', overflow: 'hidden' }}>
                             <div style={{ 
                               height: '100%', 
                               width: `${Math.round((1 - (rider?.fraud_probability ?? (rider?.trust_score !== undefined ? (1 - rider.trust_score / 100) : 0))) * 100)}%`, 
                               background: (1 - (rider?.fraud_probability ?? (rider?.trust_score !== undefined ? (1 - rider.trust_score / 100) : 0))) >= 0.7 ? '#10b981' : (1 - (rider?.fraud_probability ?? (rider?.trust_score !== undefined ? (1 - rider.trust_score / 100) : 0))) <= 0.4 ? '#ef4444' : '#f59e0b' 
                             }} />
                           </div>
                           <strong style={{ fontSize: '0.85rem' }}>{Math.round((1 - (rider?.fraud_probability ?? (rider?.trust_score !== undefined ? (1 - rider.trust_score / 100) : 0))) * 100)}</strong>
                         </div>
                         <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Velocity Trust</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 800 }}>₹{Math.round(premium)}</span>
                        {rider?.probation_status && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 800 }}>3X SURCHARGE</span>}
                      </div>
                    </td>
                    <td>
                      <div className={`badge-tier-${tier.toLowerCase()}`} style={{
                        background: tier === 'Premium' ? 'rgba(99, 102, 241, 0.1)' : tier === 'Standard' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        border: `1px solid ${tier === 'Premium' ? '#6366f1' : tier === 'Standard' ? '#10b981' : '#94a3b8'}`,
                        color: tier === 'Premium' ? '#6366f1' : tier === 'Standard' ? '#10b981' : '#64748b',
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        display: 'inline-block'
                      }}>
                        {tier.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '8px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredRiders.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Users size={32} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>No riders found</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Try adjusting your filters or search query.</p>
            <button onClick={() => { setSearch(''); setFilter('All'); }} className="dash-btn dash-btn-outline">
              Clear all parameters
            </button>
          </div>
        )}

        {/* Improved Pagination Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderTop: '1px solid var(--dash-border)', background: 'rgba(255,255,255,0.5)' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
            Showing <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * itemsPerPage, filteredRiders.length)}</strong> of <strong style={{ color: '#0f172a' }}>{filteredRiders.length}</strong> records
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
      </div>
      <style>{`
        .id-privacy-node {
          position: relative;
          cursor: help;
        }
        .id-privacy-node .reveal-on-hover {
          opacity: 0;
          height: 0;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        .id-privacy-node:hover .reveal-on-hover {
          opacity: 1;
          height: auto;
          margin-top: 6px;
        }
        .id-privacy-node:hover .rider-id-primary {
          color: #2563eb !important;
        }
      `}</style>
    </div>
  );
}