import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
   Zap, Activity, ShieldAlert, MapPin,
   Play, RotateCcw, ChevronDown, CheckCircle2,
   AlertTriangle, Cpu, CloudRain, Wind, ShieldCheck,
   Database, Fingerprint, Microscope, Info, Sun,
   Droplets, RefreshCw, Briefcase, UserCheck, Clock,
   X, TrendingDown, BarChart2, EyeOff
} from 'lucide-react';
import { dataService } from '../data/dataService';
import FraudCluster from '../components/FraudCluster';
import '../styles/dashboard.css';
import '../styles/Simulation.css';

const TriggerCard = ({ label, name, value, unit, active, threshold, isStatus }) => {
   const isBreached = isStatus ? active : (value !== undefined && threshold !== undefined ? value >= threshold : false);
   const displayValue = value !== undefined
      ? (typeof value === 'number' ? (isStatus ? (value === 100 ? 'INACTIVE' : 'ACTIVE') : value.toFixed(1)) : value)
      : '-';

   return (
      <div style={{
         textAlign: 'center',
         padding: '12px 8px',
         background: active ? 'rgba(59, 130, 246, 0.1)' : 'rgba(241, 245, 249, 0.5)',
         borderRadius: '10px',
         border: `2px solid ${active ? '#BFDBFE' : '#E2E8F0'}`,
         transition: 'all 0.2s ease'
      }}>
         <div style={{ fontSize: '0.7rem', fontWeight: 800, color: active ? '#3B82F6' : '#94A3B8', marginBottom: '4px' }}>{label}</div>
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
            boxShadow: active ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none',
            transition: 'all 0.2s ease'
         }} />
      </div>
   );
};

const TelemetryBar = ({ label, value, threshold, max, unit }) => {
   const percentage = Math.min((value / max) * 100, 100);
   const thresholdPct = (threshold / max) * 100;
   const isBreached = value >= threshold;

   return (
      <div className="telemetry-gauge-container">
         <div className="gauge-header">
            <span className="gauge-label">{label}</span>
            <span className="gauge-value" style={{ color: isBreached ? '#EF4444' : '#1E293B' }}>
               {value}{unit}
            </span>
         </div>
         <div className="gauge-track">
            <div className="threshold-marker" style={{ left: `${thresholdPct}%` }} />
            <motion.div
               className={`gauge-fill ${isBreached ? 'breached' : 'normal'}`}
               initial={{ width: 0 }}
               animate={{ width: `${percentage}%` }}
               transition={{ duration: 1, ease: "easeOut" }}
            />
         </div>
      </div>
   );
};

const CalculationStep = ({ label, value, isFinal }) => (
   <div className={`calc-step ${isFinal ? 'calc-final' : ''}`}>
      <div className="calc-step-label">{label}</div>
      <div className="calc-step-value">{value}</div>
   </div>
);

const KPI = ({ icon: Icon, label, value, color }) => (
   <div className="kpi-card">
      <div className="kpi-icon-wrapper" style={{ background: `${color}15`, color }}>
         <Icon size={24} />
      </div>
      <div className="kpi-texts">
         <span className="kpi-val">{value}</span>
         <span className="kpi-label">{label}</span>
      </div>
   </div>
);

const LoadingStage = ({ stage }) => {
   const stages = [
      "Synchronizing Distributed Ledger...",
      "Profiling Geospatial Rider Risk...",
      "Executing Parametric Settlement Audit...",
      "Finalizing Resiliency Scorecard..."
   ];
   return (
      <div className="loading-stage-container">
         <div className="viz-radar">
            <div className="radar-sweep" />
            <div className="radar-pulse" />
            <motion.div
               animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
               <Fingerprint size={48} color="#3B82F6" />
            </motion.div>
         </div>
         <div className="stage-text-sequence">
            <motion.div
               key={stage}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="stage-text"
            >
               <Activity size={16} className="animate-pulse" /> {stages[stage] || "Processing..."}
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

function PersonaIcon({ persona }) {
   if (persona === 'Full-Timer' || persona === 'Full-timer') return <Briefcase size={14} color="#3B82F6" />;
   if (persona === 'Gig-Pro' || persona === 'Gig Pro' || persona === 'Gig-pro') return <UserCheck size={14} color="#10B981" />;
   if (persona === 'Student-Flex' || persona === 'Student-flex') return <Clock size={14} color="#8B5CF6" />;
   if (persona === 'Veteran') return <ShieldCheck size={14} color="#F43F5E" />;
   return <Zap size={14} color="#F59E0B" />;
}

export default function Simulation() {
   const navigate = useNavigate();
   const [location, setLocation] = useState('Chennai');
   const [isLiveMode, setIsLiveMode] = useState(false);
   const [isStressMode, setIsStressMode] = useState(true);
   const [results, setResults] = useState(null);
   const [simulating, setSimulating] = useState(false);
   const [loadingStage, setLoadingStage] = useState(0);
   const [expandedId, setExpandedId] = useState(null);
   const [filter, setFilter] = useState('All');
   const cities = ['Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Trichy'];
   const [cityWeather, setCityWeather] = useState(null);
   const [weatherLoading, setWeatherLoading] = useState(false);

   useEffect(() => {
      fetchCityWeather();
   }, [location]);

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
      setResults(null);
      setExpandedId(null);
      setLoadingStage(0);

      const timer = setInterval(() => {
         setLoadingStage(prev => (prev < 3 ? prev + 1 : prev));
      }, 700);

      try {
         const response = await dataService.runSimulation({
            location,
            isLiveMode: isLiveMode,
            isStressMode: isStressMode
         });

         await new Promise(r => setTimeout(r, 2200));

         if (response && response.nodes) {
            setResults(response.nodes);
         } else {
            setResults([]);
         }
      } catch (error) {
         setResults([]);
      } finally {
         clearInterval(timer);
         setSimulating(false);
      }
   }

   const filteredResults = Array.isArray(results) ? results.filter(r => {
      if (filter === 'All') return true;
      if (filter === 'Approved') return r.payout?.status === 'APPROVED';
      if (filter === 'Mitigated') return r.payout?.status === 'MITIGATED';
      if (filter === 'Nominal') return r.payout?.status === 'NOMINAL';
      return true;
   }) : [];

   return (
      <div className="dash-container simulation-page">
         {/* HORIZONTAL HUD */}
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="dash-toolbar" style={{ border: 'none', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '1.5rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                     Geospatial Sync
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.02em', margin: '2px 0 8px 0' }}>
                     {location} Cluster
                  </span>
                  <div className="location-pills" style={{ display: 'flex', gap: '8px' }}>
                     {cities.map(c => (
                        <button
                           key={c}
                           onClick={() => setLocation(c)}
                           className={`pill-btn-mini ${location === c ? 'active' : ''}`}
                        >
                           {c}
                        </button>
                     ))}
                  </div>
               </div>

               <div style={{ width: '1px', height: '48px', background: '#F1F5F9' }} />

               <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <WeatherMetricItem label="Temperature" value={`${cityWeather?.temp || '--'}°C`} Icon={Sun} color="#F59E0B" />
                  <WeatherMetricItem label="Wind Hazard" value={`${cityWeather?.wind || '--'}km/h`} Icon={Wind} color="#3B82F6" />
                  <WeatherMetricItem label="Precipitation" value={`${cityWeather?.rain || '0'}mm`} Icon={Droplets} color="#0EA5E9" />
               </div>

               <button onClick={fetchCityWeather} className={`${weatherLoading ? 'animate-spin' : ''}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#CBD5E1', marginLeft: 'auto' }}>
                  <RefreshCw size={16} />
               </button>

               <div style={{ width: '1px', height: '48px', background: '#F1F5F9' }} />

               <div className="segmented-control" style={{ display: 'flex', background: '#F8FAFC', padding: '5px', borderRadius: '12px', border: '1px solid #F1F5F9', flexShrink: 0 }}>
                  <button onClick={() => setIsStressMode(!isStressMode)} style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', background: isStressMode ? 'white' : 'transparent', color: isStressMode ? '#1E293B' : '#64748B', boxShadow: isStressMode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>Stress</button>
                  <button onClick={() => setIsLiveMode(!isLiveMode)} style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', background: isLiveMode ? 'white' : 'transparent', color: isLiveMode ? '#1E293B' : '#64748B', boxShadow: isLiveMode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>Live</button>
               </div>
               {(results || simulating) && (
                  <button
                     onClick={() => navigate('/client/simulation')}
                     style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1px solid #3B82F6',
                        background: '#3B82F6',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                     }}
                  >
                     <X size={14} /> Exit
                  </button>
               )}
            </div>
         </motion.div>

         <AnimatePresence mode="wait">
            {!results && !simulating ? (
               <motion.div key="standby" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="standby-hero">
                  <div className="viz-radar">
                     <div className="radar-sweep" />
                     <div className="radar-pulse" />
                     <Cpu style={{ position: 'absolute', color: '#3B82F6' }} size={64} />
                  </div>
                  <h2 className="standby-title">Risk Lab V6.2</h2>
                  <p className="standby-subtitle">Database-linked parametric audits against live {location} clusters. Synchronized with pre-final dataset ledger.</p>
                  <button onClick={executeEngineRun} className="trigger-btn-primary" style={{ padding: '1.25rem 3.5rem', borderRadius: '16px', fontSize: '1.1rem' }}>
                     <Play size={20} fill="white" /> Begin Audits
                  </button>
               </motion.div>
            ) : simulating ? (
               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="standby-hero">
                  <LoadingStage stage={loadingStage} />
                  <div style={{ marginTop: '2rem' }}>
                     <button
                        onClick={() => navigate('/client/overview')}
                        style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px',
                           padding: '10px 20px',
                           borderRadius: '12px',
                           border: '1px solid #3B82F6',
                           background: '#3B82F6',
                           color: 'white',
                           fontSize: '0.75rem',
                           fontWeight: 700,
                           cursor: 'pointer',
                           boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                     >
                        <X size={14} /> Exit to RiskLab
                     </button>
                  </div>
               </motion.div>
            ) : (
               <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="results-view">
                  <div className="results-kpi-grid">
                     <KPI icon={CheckCircle2} label="Approved" value={results.filter(n => n.payout?.status === 'APPROVED').length} color="#10B981" />
                     <KPI icon={ShieldAlert} label="Mitigated" value={results.filter(n => n.payout?.status === 'MITIGATED').length} color="#F59E0B" />
                     <KPI icon={Activity} label="Nominal" value={results.filter(n => n.payout?.status === 'NOMINAL').length} color="#64748B" />
                  </div>

                  <div className="dash-toolbar" style={{ marginBottom: '1rem', borderRadius: '16px' }}>
                     <div className="filter-pills">
                        {['All', 'Approved', 'Mitigated', 'Nominal'].map(p => (
                           <button key={p} onClick={() => setFilter(p)} className={`pill-btn ${filter === p ? 'active' : ''}`}>
                              {p}
                           </button>
                        ))}
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.1em' }}>
                           BATCH_SYNC: {new Date().toLocaleTimeString()}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.1em' }}>
                           ADAPTIVE_ID: GG-B{Math.floor(Math.random() * 90000) + 10000}
                        </span>
                     </div>
                  </div>

                  <div className="table-container-executive">
                     <table>
                        <thead>
                           <tr>
                              <th>Rider ID</th>
                              <th>Persona Profile</th>
                              <th>Risk Indicators</th>
                              <th>Audit Status</th>
                              <th style={{ textAlign: 'right' }}>Disbursement</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredResults.map((r, idx) => (
                              <React.Fragment key={r.id}>
                                 <tr
                                    className={`exec-row ${expandedId === r.id ? 'expanded' : ''} ${r.payout?.status === 'MITIGATED' ? 'mitigated-row' : ''}`}
                                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                 >
                                    <td>
                                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem' }}>{r.id}</span>
                                          <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Verified</span>
                                       </div>
                                    </td>
                                    <td>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <PersonaIcon persona={r.persona} />
                                          <span style={{ opacity: 0.8, fontSize: '0.85rem', fontWeight: 600 }}>{r.persona}</span>
                                       </div>
                                    </td>
                                    <td>
                                       <div className="status-pills-container" style={{ display: 'flex', gap: '6px' }}>
                                          {/* Render all 7 trigger icons with Blue highlight logic */}
                                          <CloudRain size={14} color={r.signals?.heavyRain?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <Wind size={14} color={r.signals?.highWind?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <TrendingDown size={14} color={r.signals?.orderDrop?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <Zap size={14} color={r.signals?.riderInactive?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <BarChart2 size={14} color={r.signals?.lowOrderVolume?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <Clock size={14} color={r.signals?.abnormalDeliveryTime?.active ? '#3B82F6' : '#E2E8F0'} />
                                          <EyeOff size={14} color={r.signals?.lowVisibility?.active ? '#3B82F6' : '#E2E8F0'} />
                                       </div>
                                    </td>
                                    <td>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span className="dot" style={{
                                             backgroundColor:
                                                r.payout?.status === 'APPROVED' ? '#10B981' :
                                                   r.payout?.status === 'MITIGATED' ? '#F59E0B' : '#94A3B8'
                                          }} />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>
                                             {r.payout?.status === 'APPROVED' ? 'APPROVED' :
                                                r.payout?.status === 'MITIGATED' ? 'MITIGATED' : 'NOMINAL'}
                                          </span>
                                       </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#1E293B' }}>
                                       ₹{(r.payout?.amount || 0).toLocaleString()}
                                       <ChevronDown size={14} style={{ marginLeft: '0.5rem', opacity: 0.3, transform: expandedId === r.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                    </td>
                                 </tr>
                                 <AnimatePresence>
                                    {expandedId === r.id && (
                                       <tr>
                                          <td colSpan="5" style={{ padding: 0 }}>
                                             <motion.div
                                                exit={{ height: 0, opacity: 0 }}
                                                className="audit-workflow-panel"
                                             >
                                                <div className="workflow-stepper" style={{ padding: '24px' }}>
                                                   {/* PHASE 1: DISRUPTION ANALYSIS */}
                                                   <div className="workflow-step">
                                                      <div className="step-indicator">
                                                         <div className={`step-circle ${r.isDisrupted ? 'step-warn' : 'step-ok'}`}>1</div>
                                                         <div className="step-line" />
                                                      </div>
                                                      <div className="step-content" style={{ paddingBottom: '32px' }}>
                                                         <div className="step-header" style={{ marginBottom: '20px' }}>
                                                            <span className="step-title">Phase 1: Multi-Peril Disruption Analysis</span>
                                                            <span className={`step-status-tag ${r.isDisrupted ? 'tag-warn' : 'tag-success'}`}>
                                                               {r.isDisrupted ? 'BREACHED' : 'NOMINAL_STATE'}
                                                            </span>
                                                         </div>

                                                         {/* MAIN TRIGGERS */}
                                                         <div style={{ marginBottom: '28px' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Primary Actuarial Triggers</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                                               <TriggerCard label="T1" name="Precipitation" value={r.signals?.heavyRain?.value} unit="mm/h" active={r.signals?.heavyRain?.active} threshold={r.signals?.heavyRain?.threshold} />
                                                               <TriggerCard label="T3" name="Traffic Density" value={r.signals?.orderDrop?.value} unit="%" active={r.signals?.orderDrop?.active} threshold={r.signals?.orderDrop?.threshold} />
                                                               <TriggerCard label="T4" name="Velocity Signal" value={r.signals?.riderInactive?.value} unit="" active={r.signals?.riderInactive?.active} isStatus />
                                                            </div>
                                                         </div>

                                                         {/* SECONDARY TRIGGERS */}
                                                         <div style={{ marginBottom: '28px' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '12px', textTransform: 'uppercase' }}>Ancillary Sensor Nodes</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                                               {[
                                                                  { key: 'highWind', label: 'T2', name: 'Wind Speed', unit: 'km/h', val: r.signals?.highWind?.value },
                                                                  { key: 'lowOrderVolume', label: 'T5', name: 'Order Vol', unit: '', val: r.signals?.lowOrderVolume?.active ? 'Low' : 'Norm' },
                                                                  { key: 'abnormalDeliveryTime', label: 'T6', name: 'Latency', unit: 'min', val: r.signals?.abnormalDeliveryTime?.value },
                                                                  { key: 'lowVisibility', label: 'T7', name: 'Visibility', unit: 'km', val: r.signals?.lowVisibility?.value }
                                                               ].map(t => (
                                                                  <div key={t.key} style={{ padding: '12px', background: r.signals?.[t.key]?.active ? 'rgba(59, 130, 246, 0.05)' : 'rgba(241, 245, 249, 0.3)', borderRadius: '10px', border: `1px solid ${r.signals?.[t.key]?.active ? '#BFDBFE' : '#F1F5F9'}` }}>
                                                                     <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>{t.label} {t.name}</div>
                                                                     <div style={{ fontSize: '0.85rem', fontWeight: 800, color: r.signals?.[t.key]?.active ? '#3B82F6' : '#475569' }}>
                                                                        {typeof t.val === 'number' ? t.val.toFixed(1) : t.val}{t.unit}
                                                                     </div>
                                                                  </div>
                                                               ))}
                                                            </div>
                                                         </div>

                                                         {/* SUMMARY BAR */}
                                                         <div style={{ padding: '16px 20px', background: 'rgba(248, 250, 252, 0.8)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F5F9' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                  <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 800 }}>ACTIVE SIGNALS</span>
                                                                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: r.activeSignalCount >= 2 ? '#3B82F6' : '#10B981' }}>{r.activeSignalCount || 0}/7</span>
                                                               </div>
                                                               <div style={{ width: '1px', height: '32px', background: '#E2E8F0' }} />
                                                               <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                  <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 800 }}>SEVERITY INDEX / 5.0</span>
                                                                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: (r.severityScore || 0) >= 1.5 ? '#3B82F6' : '#1E293B' }}>{(r.severityScore || 0).toFixed(2)}</span>
                                                               </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                               <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>AUDIT RESULT</span>
                                                               <span style={{ fontSize: '0.75rem', fontWeight: 900, padding: '5px 12px', borderRadius: '8px', background: r.trust_score < 40 ? '#FEF2F2' : '#DCFCE7', color: r.trust_score < 40 ? '#EF4444' : '#16A34A', border: `1px solid ${r.trust_score < 40 ? '#FECACA' : '#BBF7D0'}`, letterSpacing: '0.02em' }}>
                                                                  {r.trust_score < 40 ? 'PARAMETRIC_BREACH' : 'STABLE_NODE'}
                                                               </span>
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>

                                                   {/* PHASE 2: INTEGRITY & TRUST */}
                                                   <div className="workflow-step">
                                                      <div className="step-indicator">
                                                         <div className={`step-circle ${r.payout?.status === 'MITIGATED' ? 'step-fail' : 'step-ok'}`}>2</div>
                                                         <div className="step-line" />
                                                      </div>
                                                      <div className="step-content" style={{ paddingBottom: '32px' }}>
                                                         <div className="step-header" style={{ marginBottom: '20px' }}>
                                                            <span className="step-title">Phase 2: Integrity & Trust Verification</span>
                                                            <span className={`step-status-tag ${r.payout?.status === 'MITIGATED' ? 'tag-danger' : 'tag-success'}`}>
                                                               {r.payout?.status === 'MITIGATED' ? 'RISK_MITIGATED' : 'IDENTITY_SECURE'}
                                                            </span>
                                                         </div>
                                                         <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                                                            <div style={{ background: 'rgba(241, 245, 249, 0.4)', padding: '24px', borderRadius: '18px', border: '1px solid #F1F5F9' }}>
                                                               <div style={{ marginBottom: '20px' }}>
                                                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                     <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fraud Probability Index</span>
                                                                     <span style={{ fontSize: '1.1rem', fontWeight: 900, color: (Number(r.fraud?.score) || 0) >= 60 ? '#EF4444' : '#10B981' }}>{Math.round(Number(r.fraud?.score) || 0)}%</span>
                                                                  </div>
                                                                  <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                                                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, Number(r.fraud?.score) || 0))}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: (Number(r.fraud?.score) || 0) >= 60 ? '#EF4444' : '#10B981' }} />
                                                                  </div>
                                                               </div>
                                                               <div>
                                                                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: '10px', textTransform: 'uppercase' }}>Anomaly Detection Engine</div>
                                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                     {r.fraud?.reasons?.length > 0 ? r.fraud.reasons.map((res, i) => (
                                                                        <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '5px 12px', background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                                                                           {res}
                                                                        </span>
                                                                     )) : (
                                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '5px 12px', background: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                                           CLEAN_TELEMETRY_SIGNATURE
                                                                        </span>
                                                                     )}
                                                                  </div>
                                                               </div>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                               <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F1F5F9', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                                                                  <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 800, display: 'block', marginBottom: '6px' }}>MASTER TRUST SCORE</span>
                                                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: (r.payout?.status === 'MITIGATED') ? '#EF4444' : '#10B981' }}>
                                                                           Level {Math.max(1, Math.ceil((Number(r.trust_score) || 0) / 10))}/10
                                                                        </span>
                                                                        <div style={{ height: '6px', width: '80px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                                                           <div style={{ height: '100%', width: `${Math.max(5, Math.min(100, Number(r.trust_score) || 0))}%`, background: (r.payout?.status === 'MITIGATED') ? '#EF4444' : '#10B981' }} />
                                                                        </div>
                                                                     </div>
                                                                     <div style={{ fontSize: '1.4rem', fontWeight: 900, color: (r.payout?.status === 'MITIGATED') ? '#EF4444' : '#10B981' }}>
                                                                        {Math.round(r.trust_score || 0)}%
                                                                     </div>
                                                                  </div>
                                                               </div>
                                                               {r.probation_status && (
                                                                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)', borderRadius: '18px', border: '1px solid #FECACA' }}>
                                                                     <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626', marginBottom: '6px' }}>
                                                                        <ShieldAlert size={14} />
                                                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.05em' }}>PROBATIONARY OVERRIDE</span>
                                                                     </div>
                                                                     <p style={{ fontSize: '0.65rem', color: '#991B1B', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>Rider history indicates session instability. Mandatory 30% payout reduction applied.</p>
                                                                  </div>
                                                               )}
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>

                                                   {/* PHASE 3: ADAPTIVE SETTLEMENT */}
                                                   <div className="workflow-step">
                                                      <div className="step-indicator"><div className="step-circle step-ok">3</div></div>
                                                      <div className="step-content">
                                                         <div className="step-header" style={{ marginBottom: '20px' }}>
                                                            <span className="step-title">Phase 3: Adaptive Parametric Settlement</span>
                                                            <span className="step-status-tag tag-success">SETTLEMENT_CALCULATED</span>
                                                         </div>
                                                         <div className="calc-flow-container">
                                                            <CalculationStep label="Baseline Relief" value={`₹${Math.round(r.payout?.math?.base || 0)}`} />
                                                            <CalculationStep label="Policy Coverage" value={`x ${(r.payout?.math?.cap / r.payout?.math?.base || 1).toFixed(2)}`} />
                                                            <CalculationStep label="Severity Adjustment" value={`x ${(r.payout?.math?.severity || 0).toFixed(2)}`} />
                                                            <CalculationStep label="Trust Confidence" value={`x ${(r.payout?.math?.confidence || 0).toFixed(2)}`} />
                                                            <div className="calc-final">
                                                               <div className="calc-step-label">Final Disbursement</div>
                                                               <div className="calc-step-value">₹{r.payout?.amount || 0}</div>
                                                            </div>
                                                         </div>
                                                      </div>
                                                   </div>
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
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}