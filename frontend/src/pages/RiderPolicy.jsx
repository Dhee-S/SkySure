import { useOutletContext } from 'react-router-dom';
import {
   Shield, Info, MapPin,
   Truck, Calendar,
   CloudRain, Thermometer, Wind,
   Droplets, Eye, Zap
} from 'lucide-react';
import '../styles/dashboard.css';

export default function RiderPolicy() {
   const { rider, weather, isProtected } = useOutletContext();

   const premium = rider.premium || rider.weekly_premium_inr || (rider.tier === 'Pro' ? 120 : rider.tier === 'Standard' ? 65 : 35);
   const coverage = rider.coverage_amount_inr || (rider.tier === 'Pro' ? 25000 : rider.tier === 'Standard' ? 15000 : 5000);
   const multiplierLabel = rider.tier === 'Pro' ? '1.3x' : rider.tier === 'Basic' ? '0.7x' : '1.0x';

   return (
      <div className="dash-container" style={{ padding: 0 }}>
         <header className="dash-header">
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.1em' }}>
                  <Shield size={12} /> Active Partner Protection
               </div>
               <h1 className="dash-title">Policy Parameters</h1>
               <p className="dash-subtitle">Coverage parameters for Rider ID <strong style={{ color: '#0f172a' }}>{rider.rider_id || rider.id || 'RDR-99'}</strong></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', border: `1px solid ${isProtected ? '#10b981' : '#e2e8f0'}`, background: isProtected ? '#d1fae5' : '#f8fafc' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isProtected ? '#10b981' : '#94a3b8' }} />
               <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isProtected ? '#065f46' : '#64748b' }}>{isProtected ? 'Protection Active' : 'Unprotected'}</span>
            </div>
         </header>

         <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

            {/* LEFT COLUMN: Main Policy Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

               <div style={{ background: '#1e40af', borderRadius: '24px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                        <div>
                           <h2 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: '8px' }}>Weekly Premium Subscription</h2>
                           <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '2rem', fontWeight: 700, opacity: 0.5 }}>₹</span>
                              <span style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1 }}>{Math.round(premium)}</span>
                              <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.7, marginLeft: '8px' }}>/ per week</span>
                           </div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
                           <Zap size={32} fill="white" />
                        </div>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                           <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '4px' }}>Max Coverage Floor</div>
                           <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{coverage.toLocaleString()}</div>
                        </div>
                        <div>
                           <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '4px' }}>Actuarial Multiplier</div>
                           <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{multiplierLabel}</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                     <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb' }}><Info size={20} /></div>
                     <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Policy Specifications</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                     <SpecItem icon={Zap} label="Coverage Tier" value={rider.tier || 'Standard'} />
                     <SpecItem icon={MapPin} label="Operating City" value={rider.city || 'Unassigned'} />
                     <SpecItem icon={Truck} label="Vehicle Type" value={rider.vehicleType || 'Motorcycle'} />
                     <SpecItem icon={Calendar} label="Commencement" value={new Date().toLocaleDateString()} />
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: Sidebar Weather */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Local Matrix</h3>
                     <span className="badge-success">SECURE</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     <WeatherStat icon={Thermometer} label="Temp" value={`${weather?.temperatureC ?? 28}°C`} />
                     <WeatherStat icon={CloudRain} label="Precip" value={`${weather?.rainfallMm ?? 0} mm`} />
                     <WeatherStat icon={Wind} label="Wind" value={`${weather?.windKph ?? 15} km/h`} />
                     <WeatherStat icon={Droplets} label="Humidity" value={`${weather?.humidity ?? 65}%`} />
                     <WeatherStat icon={Eye} label="Visibility" value={`${weather?.visibility ?? 10} km`} />
                  </div>
               </div>

               <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '24px', padding: '24px' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.1em', marginBottom: '12px', margin: 0 }}>Support Channel</h4>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>As a <strong>{rider.tier || 'Standard'}</strong> partner, you have priority support for parametric settlement disputes.</p>
                  <button className="dash-btn dash-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Request Appraisal</button>
               </div>
            </div>
         </div>
      </div>
   );
}

function SpecItem({ icon: Icon, label, value }) {
   return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            <Icon size={18} />
         </div>
         <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{value}</div>
         </div>
      </div>
   );
}

function WeatherStat({ icon: Icon, label, value }) {
   return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon size={16} color="#64748b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{label}</span>
         </div>
         <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>{value}</span>
      </div>
   );
}