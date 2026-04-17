import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
   Zap, Activity, ShieldAlert, MapPin,
   Play, RotateCcw, ChevronDown, CheckCircle2,
   AlertTriangle, Cpu, CloudRain, Wind, ShieldCheck,
   Database, Fingerprint, Microscope, Info, Sun,
   Droplets, RefreshCw, Briefcase, UserCheck, Clock,
   X, TrendingDown, BarChart2, EyeOff, Boxes, Layers, Terminal
} from 'lucide-react';
import { dataService } from '../data/dataService';
import { safeFormatTime } from '../utils/formatters';
import { TriggerCard, CalculationStep, AuditWorkflowPanel } from '../components/RiskEngineComponents';
import '../styles/dashboard.css';
import '../styles/Simulation.css';

// TriggerCard and CalculationStep removed as they are now imported from shared components

const LoadingStage = ({ stage }) => {
   const stages = [
      "INGESTING WEATHER TELEMETRY...",
      "PROFILING GEOSPATIAL CLUSTERS...",
      "EXECUTING PARAMETRIC SETTLEMENT...",
      "FINALIZING DISTRIBUTED LEDGER..."
   ];
   return (
      <div className="loading-stage-container">
         <div className="viz-radar" style={{ width: '120px', height: '120px' }}>
            <div className="radar-sweep" />
            <div className="radar-pulse" />
            <motion.div
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
               <Cpu size={36} color="#3B82F6" />
            </motion.div>
         </div>
         <div className="stage-text-sequence" style={{ height: 'auto', marginTop: '20px' }}>
            <motion.div
               key={stage}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="stage-text"
               style={{ fontSize: '0.9rem' }}
            >
               <Activity size={16} className="animate-pulse" /> {stages[stage] || "Synthesizing Node Data..."}
            </motion.div>
         </div>
      </div>
   );
};

function WeatherMetricItem({ label, value, Icon, color }) {
   return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
         <div style={{ color, display: 'flex', alignItems: 'center' }}><Icon size={16} /></div>
         <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>{value}</span>
         </div>
      </div>
   );
}

// Using shared CalculationStep from RiskEngineComponents


export default function Simulation() {
   const navigate = useNavigate();
   
   // State Blocks
   const [location, setLocation] = useState('Chennai');
   const [isStressMode, setIsStressMode] = useState(true);
   const [isLiveMode, setIsLiveMode] = useState(false);
   const [autoMode, setAutoMode] = useState(false);
   
    const [simulating, setSimulating] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [results, setResults] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState('All');
    
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [cityWeather, setCityWeather] = useState(null);
    const [liveQueue, setLiveQueue] = useState([]); // Active Ingestion Pulse
    const [processedHistory, setProcessedHistory] = useState([]); // Validated Ledger
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [auditLog, setAuditLog] = useState([]); // Real-time model checking log


   const cities = ['Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Trichy'];

   // Weather Update Effect
   useEffect(() => {
      fetchCityWeather();
   }, [location]);

   // Auto-mode logic
   useEffect(() => {
      let interval;
      if (autoMode) {
         setCountdown(15);
         interval = setInterval(() => {
            setCountdown(prev => {
               if (prev <= 1) {
                  executeEngineRun();
                  return 15;
               }
               return prev - 1;
            });
         }, 1000);
      }
      return () => clearInterval(interval);
   }, [autoMode]);

   async function fetchCityWeather() {
      setWeatherLoading(true);
      try {
         const coordsMap = {
            'Chennai': { lat: 13.08, lon: 80.27 },
            'Coimbatore': { lat: 11.01, lon: 76.95 },
            'Salem': { lat: 11.66, lon: 78.14 },
            'Madurai': { lat: 9.92, lon: 78.11 },
            'Trichy': { lat: 10.79, lon: 78.70 }
         };
         const { lat, lon } = coordsMap[location];
         const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation`;
         const resp = await fetch(url).then(r => r.json());
         const currentHour = new Date().getHours();
         
         setCityWeather({
            temp: resp.current_weather.temperature,
            wind: resp.current_weather.windspeed,
            rain: resp.hourly.precipitation[currentHour] || 0,
         });
      } catch (e) {
         setCityWeather({ temp: 31.4, wind: 11, rain: 0 });
      } finally {
         setWeatherLoading(false);
      }
   }

    async function executeEngineRun() {
        setSimulating(true);
        setIsPaused(false);
        setLoadingStage(0);
        setResults(null);
        setLiveQueue([]);
        setProcessedHistory([]);
        setExpandedId(null);
        setAuditLog([]);

        // UI Sequential Loading
        for (let i = 0; i < 4; i++) {
            setLoadingStage(i);
            await new Promise(r => setTimeout(r, 600));
        }

        try {
            const data = await dataService.runSimulation({ 
                location, 
                mode: isStressMode ? 'STRESS' : 'NORMAL' 
            });

            if (data && data.nodes) {
                setResults(data);
                
                // PULSE INGESTION SEQUENCE (Controlled Slower Cadence)
                for (let i = 0; i < data.nodes.length; i++) {
                    const node = data.nodes[i];
                    
                    // Pause Lock
                    while (isPaused) {
                        await new Promise(r => setTimeout(r, 500));
                    }

                    setLiveQueue([node]); 
                    
                    // Simulate Model Heuristic Passes
                    const checks = node.heuristicChecks || [];
                    for (const check of checks) {
                        setAuditLog(prev => [...prev.slice(-4), { ...check, timestamp: new Date().toLocaleTimeString() }]);
                        await new Promise(r => setTimeout(r, 800)); // Show each check
                    }

                    await new Promise(r => setTimeout(r, 2000)); // Final look at node
                    setProcessedHistory(prev => [node, ...prev]); 
                }
                setLiveQueue([]);
            }
        } catch (err) {
            console.error("Simulation Fault:", err);
        } finally {
            setSimulating(false);
        }
    }


   const syncToLedger = async () => {
      setIsSyncing(true);
      await new Promise(r => setTimeout(r, 2000));
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
   };

   const filteredResults = processedHistory.filter(r => {
      if (filter === 'All') return true;
      if (filter === 'Approved') return r.payout?.status === 'APPROVED';
      if (filter === 'Mitigated') return r.payout?.status === 'MITIGATED';
      if (filter === 'Nominal') return r.payout?.status === 'NOMINAL';
      return true;
   });

   return (
      <div className="dash-container simulation-page">
         {/* LIVE FEED HUD */}
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="neural-hud-glance">
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '1.5rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                     Risk Lab / Resilience Monitor
                  </span>
                  <span className="city-title neural-trace-text" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '2px 0 8px 0' }}>
                     {location} Ingestion Pulse
                  </span>
                  <div className="location-pills" style={{ display: 'flex', gap: '8px' }}>
                     {cities.map(c => (
                        <button key={c} onClick={() => setLocation(c)} className={`pill-btn-mini ${location === c ? 'active' : ''}`}>{c}</button>
                     ))}
                  </div>
               </div>

               <div style={{ width: '1px', height: '40px', background: 'rgba(226, 232, 240, 0.5)' }} />

               <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <WeatherMetricItem label="Condition" value={cityWeather?.rain > 0 ? 'Stormy' : 'Nominal'} Icon={Droplets} color="#0EA5E9" />
               </div>

               <div style={{ width: '1px', height: '40px', background: 'rgba(226, 232, 240, 0.5)', marginLeft: '1rem' }} />

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '1rem' }}>
                    {simulating && (
                        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0 shadow-sm' }}>
                            <button 
                                onClick={() => setIsPaused(!isPaused)} 
                                className="pill-btn-mini" 
                                style={{ 
                                    background: isPaused ? '#10B981' : '#F59E0B', 
                                    color: 'white', 
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 14px'
                                }}
                            >
                                {isPaused ? <Play size={12} fill="currentColor" /> : <Activity size={12} />}
                                {isPaused ? 'RESUME FEED' : 'PAUSE FEED'}
                            </button>
                        </div>
                    )}
               </div>

               <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button onClick={() => navigate('/client/overview')} style={{ background: 'transparent', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '10px' }}>
                     <X size={16} />
                  </button>
               </div>
            </div>

         </motion.div>

         <AnimatePresence mode="wait">
            {!results && !simulating ? (
               <motion.div key="standby" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="standby-hero">
                  <div className="viz-radar">
                     <div className="radar-sweep" />
                     <div className="radar-pulse" />
                     <Activity size={48} color="#3B82F6" strokeWidth={1} style={{ position: 'absolute' }} />
                  </div>
                  <h2 className="standby-title">Live Resilience Feed</h2>
                  <p className="standby-subtitle">Initializing high-fidelity parametric audits for {location} regional clusters. Synchronized with the global operational ledger.</p>
                  <button onClick={executeEngineRun} className="trigger-btn-primary" style={{ padding: '1rem 3rem', borderRadius: '12px', fontSize: '1rem', background: '#1E293B' }}>
                     <Play size={18} fill="white" /> Launch Ingestion
                  </button>
               </motion.div>
            ) : simulating && liveQueue.length === 0 ? (
               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="standby-hero">
                  <LoadingStage stage={loadingStage} />
               </motion.div>
            ) : (
               <div className="results-view" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', alignItems: 'start' }}>
                  
                   {/* LEFT: FRAUD INTELLIGENCE CONSOLE */}
                   <div className="sidebar-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                               <Microscope size={18} color="#3B82F6" />
                               <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fraud Intel Console</span>
                            </div>
                            {isPaused && <div className="pulse-dot" style={{ background: '#F59E0B' }} />}
                         </div>
                         
                         <div className="audit-log-sequence" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <AnimatePresence mode="popLayout">
                               {auditLog.length > 0 ? (
                                  auditLog.map((log, i) => (
                                     <motion.div 
                                        key={`${log.label}-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`audit-log-item ${log.status}`}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'start', 
                                            gap: '12px', 
                                            padding: '12px', 
                                            borderRadius: '12px', 
                                            background: log.status === 'fail' ? '#FEF2F2' : (log.status === 'warn' ? '#FFFBEB' : '#F0FDF4'),
                                            border: `1px solid ${log.status === 'fail' ? '#FEE2E2' : (log.status === 'warn' ? '#FEF3C7' : '#DCFCE7')}`
                                        }}
                                     >
                                        <div style={{ color: log.status === 'fail' ? '#EF4444' : (log.status === 'warn' ? '#F59E0B' : '#22C55E'), marginTop: '2px' }}>
                                           {log.status === 'fail' ? <AlertTriangle size={14} /> : (log.status === 'warn' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                           <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E293B' }}>{log.label}</div>
                                           <div style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 600 }}>{log.detail}</div>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', opacity: 0.4, fontWeight: 700 }}>{log.timestamp}</span>
                                     </motion.div>
                                  ))
                               ) : (
                                  <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                                     <Activity size={24} color="#94A3B8" style={{ margin: '0 auto 12px' }} className="animate-pulse" />
                                     <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>AWAITING HEURISTIC PULSE...</span>
                                  </div>
                                )}
                            </AnimatePresence>
                         </div>
                      </div>

                      <div style={{ background: '#1E293B', borderRadius: '20px', padding: '24px', color: 'white' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                               <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Consolidated Risk</span>
                               <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '4px' }}>
                                  {processedHistory.length > 0 
                                     ? `${Math.round((processedHistory.filter(n => n.payout?.status === 'APPROVED').length / processedHistory.length) * 100)}%` 
                                     : '--'}
                               </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                               <Fingerprint size={24} />
                            </div>
                         </div>
                         <div style={{ marginTop: '20px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: processedHistory.length > 0 ? `${(processedHistory.length / 10) * 100}%` : 0 }}
                                style={{ height: '100%', background: '#3B82F6', borderRadius: '2px shadow-lg' }} 
                            />
                         </div>
                      </div>
                   </div>

                  {/* RIGHT: DETAILED VALIDATION LEDGER */}
                  <div className="validation-ledger" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <div className="dash-toolbar" style={{ marginBottom: 0, borderRadius: '20px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
                        <div className="filter-pills">
                           {['All', 'Approved', 'Mitigated', 'Nominal'].map(p => (
                              <button key={p} onClick={() => setFilter(p)} className={`pill-btn ${filter === p ? 'active' : ''}`}>{p}</button>
                           ))}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3B82F6', display: 'block' }}>LEDGER_SYNC: {lastSyncTime || 'LIVE'}</span>
                           <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>BATCH: {location.substring(0,3).toUpperCase()}-{processedHistory.length}</span>
                        </div>
                     </div>

                      <div className="table-container-executive" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #E2E8F0 shadow-sm', borderRadius: '16px' }}>
                         <table>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                               <tr>
                                  <th>Verified Identity</th>
                                  <th>Trigger Cause</th>
                                  <th>Audit Status</th>
                                  <th style={{ textAlign: 'right' }}>Disbursement</th>
                               </tr>
                            </thead>
                            <tbody>
                               {filteredResults.map((r, idx) => (
                                  <React.Fragment key={r.id}>
                                     <tr className={`exec-row ${expandedId === r.id ? 'expanded' : ''}`} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                                        <td>
                                           <div className="id-privacy-node" style={{ position: 'relative' }}>
                                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                 <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem', fontFamily: 'monospace' }}>{r.id}</span>
                                                 <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.1em' }}>{r.persona?.toUpperCase()}</span>
                                              </div>
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
                                                  transition: 'opacity 0.2s'
                                              }}>
                                                  Full Name: {r.rider_name || `Partner ${r.id.slice(-4)}`}
                                              </div>
                                           </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {r.payout?.status === 'APPROVED' ? <CloudRain size={14} color="#3B82F6" /> : <AlertTriangle size={14} color="#F59E0B" />}
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                                                    {r.payout?.status === 'APPROVED' ? 'Parametric Trigger' : (r.payout?.status === 'MITIGATED' ? 'Fraud Heuristic' : 'Nominal Baseline')}</span><br/><span style={{fontSize: '0.6rem', opacity: 0.6}}>Velocity: {r.velocity || '42km/h'}</span><span>
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.payout?.status === 'APPROVED' ? '#10B981' : r.payout?.status === 'MITIGATED' ? '#EF4444' : '#94A3B8' }} />
                                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B' }}>{r.payout?.status}</span>
                                           </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                              <span style={{ fontWeight: 900, color: '#1E293B' }}>₹{r.payout?.amount?.toLocaleString()}</span>
                                              <ChevronDown size={14} style={{ opacity: 0.3, transform: expandedId === r.id ? 'rotate(180deg)' : 'none' }} />
                                           </div>
                                        </td>
                                     </tr>

                                    <AnimatePresence>
                                       {expandedId === r.id && (
                                          <tr>
                                             <td colSpan="3" style={{ padding: 0 }}>
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="audit-workflow-panel" style={{ padding: '24px' }}>
                                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                                                      <TriggerCard label="Precip" value={r.signals?.heavyRain?.value} unit="mm" active={r.signals?.heavyRain?.active} threshold={r.signals?.heavyRain?.threshold} />
                                                      <TriggerCard label="Wind" value={r.signals?.highWind?.value} unit="km" active={r.signals?.highWind?.active} threshold={r.signals?.highWind?.threshold} />
                                                      <TriggerCard label="Traffic" value={r.signals?.orderDrop?.value} unit="%" active={r.signals?.orderDrop?.active} threshold={r.signals?.orderDrop?.threshold} />
                                                      <TriggerCard label="Trust" value={Number(r.trust_score)} unit="%" active={Number(r.trust_score) < 50} threshold={50} />
                                                   </div>
                                                   <div className="calc-flow-container" style={{ padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                                      <CalculationStep label="Daily Baseline" value={`₹${Math.round(r.payout?.math?.baseline || 0)}`} />
                                                      <div className="calc-operator">×</div>
                                                      <CalculationStep label="Impact" value={(r.payout?.math?.impact || 0).toFixed(2)} />
                                                      <div className="calc-operator">×</div>
                                                      <CalculationStep label="Severity" value={(r.payout?.math?.severity || 0).toFixed(2)} />
                                                      <CalculationStep label="Total" value={`₹${r.payout?.amount}`} isFinal />
                                                   </div>
                                                </motion.div>
                                             </td>
                                          </tr>
                                       )}
                                    </AnimatePresence>
                                 </React.Fragment>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}