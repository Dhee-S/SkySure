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
import '../styles/dashboard.css';
import '../styles/Simulation.css';

const TriggerCard = ({ label, name, value, unit, active, threshold, isStatus }) => {
   const displayValue = value !== undefined
      ? (typeof value === 'number' ? (isStatus ? (value === 100 ? 'INACTIVE' : 'ACTIVE') : value.toFixed(1)) : value)
      : '-';

   return (
      <div style={{
         textAlign: 'center',
         padding: '12px 8px',
         background: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(241, 245, 249, 0.5)',
         borderRadius: '10px',
         border: `2px solid ${active ? '#3b82f6' : 'rgba(226, 232, 240, 0.5)'}`,
         transition: 'all 0.2s ease',
         backdropFilter: 'blur(4px)'
      }}>
         <div style={{ fontSize: '0.65rem', fontWeight: 800, color: active ? '#3B82F6' : '#94A3B8', marginBottom: '4px' }}>{label}</div>
         <div style={{ fontSize: '0.6rem', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>{name}</div>
         <div style={{ fontSize: '0.9rem', fontWeight: 900, color: active ? '#3B82F6' : '#1E293B', marginBottom: '6px', fontFamily: 'monospace' }}>
            {displayValue}
            {unit && !isStatus && <span style={{ fontSize: '0.6rem', fontWeight: 600, marginLeft: '2px' }}>{unit}</span>}
         </div>
         <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            margin: '0 auto',
            background: active ? '#3B82F6' : '#CBD5E1',
            boxShadow: active ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none',
            animation: active ? 'pulse 2s infinite' : 'none'
         }} />
      </div>
   );
};

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

const CalculationStep = ({ label, value, isFinal }) => (
    <div className={`calc-step ${isFinal ? 'calc-final' : ''}`}>
       <div className="calc-step-label">{label}</div>
       <div className="calc-step-value">{value}</div>
    </div>
 );

export default function Simulation() {
   const navigate = useNavigate();
   
   // State Blocks
   const [location, setLocation] = useState('Chennai');
   const [isStressMode, setIsStressMode] = useState(true);
   const [isLiveMode, setIsLiveMode] = useState(false);
   const [autoMode, setAutoMode] = useState(false);
   
   const [simulating, setSimulating] = useState(false);
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
      setLoadingStage(0);
      setResults(null);
      setLiveQueue([]);
      setProcessedHistory([]);
      setExpandedId(null);

      // UI Sequential Loading
      for (let i = 0; i < 4; i++) {
         setLoadingStage(i);
         await new Promise(r => setTimeout(r, 800));
      }

      try {
         const data = await dataService.runSimulation({ 
            location, 
            mode: isStressMode ? 'STRESS' : 'NORMAL' 
         });

         if (data && data.nodes) {
            setResults(data);
            
            // PULSE INGESTION SEQUENCE
            for (let i = 0; i < data.nodes.length; i++) {
               const node = data.nodes[i];
               setLiveQueue([node]); // Flash in "Active Ingestion"
               await new Promise(r => setTimeout(r, 1500)); // Visible ingestion period
               setProcessedHistory(prev => [node, ...prev]); // Commit to historical ledger
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
                     Live Resilience Feed node
                  </span>
                  <span className="city-title neural-trace-text" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '2px 0 8px 0' }}>
                     {location} Regional Ingestion
                  </span>
                  <div className="location-pills" style={{ display: 'flex', gap: '8px' }}>
                     {cities.map(c => (
                        <button key={c} onClick={() => setLocation(c)} className={`pill-btn-mini ${location === c ? 'active' : ''}`}>{c}</button>
                     ))}
                  </div>
               </div>

               <div style={{ width: '1px', height: '48px', background: 'rgba(226, 232, 240, 0.5)' }} />

               <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <WeatherMetricItem label="Temp" value={`${cityWeather?.temp || '--'}°`} Icon={Sun} color="#F59E0B" />
                  <WeatherMetricItem label="Wind" value={`${cityWeather?.wind || '--'}km/h`} Icon={Wind} color="#3B82F6" />
                  <WeatherMetricItem label="Precip" value={`${cityWeather?.rain || '0'}mm`} Icon={Droplets} color="#0EA5E9" />
               </div>

               <button onClick={fetchCityWeather} className={`${weatherLoading ? 'animate-spin' : ''}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', marginLeft: '24px' }}>
                  <RefreshCw size={16} />
               </button>

               <div style={{ width: '1px', height: '48px', background: 'rgba(226, 232, 240, 0.5)', marginLeft: '1rem' }} />

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '1rem' }}>
                    <div className="switch-group" style={{ display: 'flex', background: 'rgba(241, 245, 249, 0.8)', padding: '4px', borderRadius: '10px' }}>
                        <button onClick={() => setIsStressMode(!isStressMode)} className={`pill-btn-mini ${isStressMode ? 'active' : ''}`} style={{ border: 'none' }}>Stress Mode</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: autoMode ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9', padding: '6px 12px', borderRadius: '10px', border: `1px solid ${autoMode ? '#10B981' : 'transparent'}` }}>
                        <Zap size={14} color={autoMode ? '#10B981' : '#64748B'} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: autoMode ? '#059669' : '#64748B' }}>{autoMode ? `AUTO: ${countdown}s` : 'MANUAL'}</span>
                        <button onClick={() => setAutoMode(!autoMode)} style={{ width: '28px', height: '14px', borderRadius: '10px', background: autoMode ? '#10B981' : '#CBD5E1', border: 'none', cursor: 'pointer', position: 'relative' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white', position: 'absolute', left: autoMode ? '16px' : '2px', top: '2px', transition: 'all 0.2s' }} />
                        </button>
                    </div>
               </div>

               <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button onClick={syncToLedger} disabled={isSyncing || processedHistory.length === 0} className="trigger-btn-primary" style={{ padding: '8px 20px', fontSize: '0.75rem', background: '#3B82F6', border: 'none', borderRadius: '10px', display: 'flex', gap: '8px', opacity: processedHistory.length === 0 ? 0.5 : 1 }}>
                     {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />} 
                     {isSyncing ? 'Syncing...' : 'Commit to Ledger'}
                  </button>
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
                  
                  {/* LEFT: ACTIVE INGESTION / STATS */}
                  <div className="sidebar-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     
                     <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                           <Terminal size={18} color="#3B82F6" />
                           <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signal Ingestion</span>
                        </div>
                        
                        <AnimatePresence mode="wait">
                           {liveQueue.length > 0 ? (
                              <motion.div 
                                 key={liveQueue[0].id}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 exit={{ opacity: 0, x: 20 }}
                                 className="ingestion-pulsing-card"
                                 style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #EFF6FF 0%, #D8E7FF 100%)', border: '1px solid #BFDBFE' }}
                              >
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       <Activity size={16} color="#3B82F6" className="animate-pulse" />
                                       <span style={{ fontWeight: 900, fontSize: '1rem' }}>{liveQueue[0].id}</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3B82F6', background: 'white', padding: '4px 8px', borderRadius: '6px' }}>AUDITING...</span>
                                 </div>
                                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    <TriggerCard label="Rain" value={liveQueue[0].signals?.heavyRain?.value} unit="mm" active={liveQueue[0].signals?.heavyRain?.active} threshold={liveQueue[0].signals?.heavyRain?.threshold} />
                                    <TriggerCard label="Wind" value={liveQueue[0].signals?.highWind?.value} unit="km" active={liveQueue[0].signals?.highWind?.active} threshold={liveQueue[0].signals?.highWind?.threshold} />
                                 </div>
                              </motion.div>
                           ) : (
                              <div style={{ padding: '32px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                                 <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700 }}>{simulating ? 'AWAITING NODE PULSE...' : 'INGESTION COMPLETE'}</span>
                              </div>
                           )}
                        </AnimatePresence>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div style={{ background: '#1E293B', borderRadius: '20px', padding: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                           <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}><Layers size={80} /></div>
                           <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Batch Resilience</span>
                           <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '4px' }}>
                              {processedHistory.length > 0 
                                 ? `${Math.round((processedHistory.filter(n => n.payout?.status === 'APPROVED').length / processedHistory.length) * 100)}%` 
                                 : '--'}
                           </div>
                           <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.6 }}>Operational Stability Index</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                           <div style={{ background: 'white', borderRadius: '15px', padding: '16px', border: '1px solid #E2E8F0' }}>
                              <span style={{ fontSize: '0.6rem', color: '#64748B', display: 'block' }}>AUDITED</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{processedHistory.length}</span>
                           </div>
                           <div style={{ background: 'white', borderRadius: '15px', padding: '16px', border: '1px solid #E2E8F0' }}>
                              <span style={{ fontSize: '0.6rem', color: '#64748B', display: 'block' }}>APPROVED</span>
                              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981' }}>{processedHistory.filter(n => n.payout?.status === 'APPROVED').length}</span>
                           </div>
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

                     <div className="table-container-executive" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #E2E8F0' }}>
                        <table>
                           <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                              <tr>
                                 <th>Verifed Identity</th>
                                 <th>Audit Status</th>
                                 <th style={{ textAlign: 'right' }}>Disbursement</th>
                              </tr>
                           </thead>
                           <tbody>
                              {filteredResults.map((r, idx) => (
                                 <React.Fragment key={r.id}>
                                    <tr className={`exec-row ${expandedId === r.id ? 'expanded' : ''}`} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                                       <td>
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                             <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.95rem' }}>{r.id}</span>
                                             <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94A3B8', letterSpacing: '0.1em' }}>{r.persona?.toUpperCase()}</span>
                                          </div>
                                       </td>
                                       <td>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.payout?.status === 'APPROVED' ? '#10B981' : r.payout?.status === 'MITIGATED' ? '#F59E0B' : '#94A3B8' }} />
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