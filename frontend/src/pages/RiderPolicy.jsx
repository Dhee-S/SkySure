import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Shield, Info, MapPin,
   Truck, Calendar,
   CloudRain, Thermometer, Wind,
   Droplets, Eye, Zap, CheckCircle2,
   ArrowRight, ShieldAlert
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../App';
import '../styles/dashboard.css';

const TIER_DATA = {
    BASIC: {
        label: 'Basic',
        desc: 'Student-Flex',
        premium_rate: 0.05,
        coverage_floor: 5000,
        multiplier: '0.7x',
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.1)',
        features: ['60% Income Floor', 'Weekly Payouts', 'Standard Support']
    },
    STANDARD: {
        label: 'Standard',
        desc: 'Gig-Pro',
        premium_rate: 0.10,
        coverage_floor: 15000,
        multiplier: '1.0x',
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.1)',
        features: ['80% Income Floor', 'Instant Payouts', 'Priority Support']
    },
    PRO: {
        label: 'Pro',
        desc: 'Full-Timer',
        premium_rate: 0.15,
        coverage_floor: 25000,
        multiplier: '1.3x',
        color: '#1e40af',
        bg: 'rgba(30, 64, 175, 0.1)',
        features: ['95% Income Floor', 'Instant Payouts', 'Dedicated Appraisal']
    }
};

export default function RiderPolicy() {
   const { rider, weather, isProtected } = useOutletContext();
   const [selectedTier, setSelectedTier] = useState(rider.tier?.toUpperCase() || 'STANDARD');
   const [isUpdating, setIsUpdating] = useState(false);
   const showToast = useToast();

   const currentConfig = TIER_DATA[selectedTier] || TIER_DATA.STANDARD;
   
   // Calculate premium based on mock earnings if not available
   const baseEarnings = 5000; 
   const premium = Math.round(baseEarnings * currentConfig.premium_rate);
   const coverage = currentConfig.coverage_floor;

   const handleUpdatePolicy = async () => {
       setIsUpdating(true);
       try {
           const userRef = doc(db, 'users', rider.uid);
           await updateDoc(userRef, {
               tier: currentConfig.label,
               updated_at: new Date()
           });
           showToast(`Policy upgraded to ${currentConfig.label} successfully!`, "success");
       } catch (error) {
           console.error("Policy Update Failed:", error);
           showToast("Failed to update policy handshake. Please try again.", "danger");
       } finally {
           setIsUpdating(false);
       }
   };

   return (
      <div className="dash-container" style={{ padding: 0 }}>
         <header className="dash-header">
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.1em' }}>
                  <Shield size={12} /> Adaptive Risk Management
               </div>
               <h1 className="dash-title">Policy Hub</h1>
               <p className="dash-subtitle">Configure your parametric coverage for Rider ID <strong style={{ color: '#0f172a' }}>{rider.rider_id || rider.id || 'RDR-99'}</strong></p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', border: `1px solid ${isProtected ? '#10b981' : '#e2e8f0'}`, background: isProtected ? '#d1fae5' : '#f8fafc' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isProtected ? '#10b981' : '#94a3b8' }} />
               <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isProtected ? '#065f46' : '#64748b' }}>{isProtected ? 'Active Ingest' : 'Standby'}</span>
            </div>
         </header>

         <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '32px' }}>
            
            {/* Main Selection Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Active Card Preview */}
                <motion.div 
                    layout
                    style={{ 
                        background: currentConfig.color, 
                        borderRadius: '32px', 
                        padding: '40px', 
                        color: 'white', 
                        position: 'relative', 
                        overflow: 'hidden',
                        boxShadow: `0 20px 40px -12px ${currentConfig.color}40`
                    }}
                >
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8, marginBottom: '8px' }}>Parametric Floor Coverage</h2>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 700, opacity: 0.6 }}>₹</span>
                                    <span style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1 }}>{coverage.toLocaleString()}</span>
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <ShieldCheck size={32} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '6px' }}>Estimated Weekly Premium</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{premium}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '6px' }}>Risk Sensitivity</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentConfig.multiplier}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Selection Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {Object.keys(TIER_DATA).map((tierKey) => {
                        const config = TIER_DATA[tierKey];
                        const isActive = selectedTier === tierKey;
                        const isCurrent = (rider.tier || 'Standard').toUpperCase() === tierKey;

                        return (
                            <motion.div 
                                key={tierKey}
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedTier(tierKey)}
                                style={{ 
                                    padding: '20px', 
                                    borderRadius: '24px', 
                                    border: `2px solid ${isActive ? config.color : '#e2e8f0'}`,
                                    background: isActive ? config.bg : 'white',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                            >
                                {isCurrent && (
                                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: config.color, color: 'white', fontSize: '0.5rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>CURRENT</span>
                                )}
                                <div style={{ color: config.color, marginBottom: '12px' }}><Zap size={20} fill={isActive ? config.color : 'none'} /></div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>{config.label}</h4>
                                <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, margin: 0 }}>{config.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feature List */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Tier Benefits: {currentConfig.label}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {currentConfig.features.map((feature, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                                <CheckCircle2 size={16} color="#10b981" />
                                {feature}
                            </div>
                        ))}
                    </div>
                    
                    {selectedTier !== (rider.tier || 'Standard').toUpperCase() && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleUpdatePolicy}
                            disabled={isUpdating}
                            className="dash-btn dash-btn-primary"
                            style={{ width: '100%', marginTop: '32px', justifyContent: 'center', padding: '16px', fontSize: '1rem' }}
                        >
                            {isUpdating ? 'Synchronizing Policy...' : `Switch to ${currentConfig.label} Plan`}
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Sidebar Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', color: '#64748b' }}>Environmental Matrix</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <WeatherStat icon={Thermometer} label="Ambient Temp" value={`${weather?.temperatureC ?? 28}°C`} />
                        <WeatherStat icon={CloudRain} label="Precipitation" value={`${weather?.rainfallMm ?? 0} mm/h`} />
                        <WeatherStat icon={Wind} label="Wind Velocity" value={`${weather?.windKph ?? 12} km/h`} />
                        <WeatherStat icon={Eye} label="Visibility" value={`${weather?.visibility ?? 10} km`} />
                    </div>
                </div>

                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '24px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#c2410c' }}>
                        <ShieldAlert size={20} />
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>Fraud Protection</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#9a3412', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                        Ring-score analysis active. Your current integrity factor is <strong>98.4%</strong>. Maintaining high integrity ensures instant payout clearance.
                    </p>
                </div>
                
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Linked Wallet</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{rider.upi || 'pending_activation@upi'}</div>
                    <button style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, marginTop: '8px', cursor: 'pointer' }}>Update Payout Method</button>
                </div>
            </div>
         </div>
      </div>
   );
}

function WeatherStat({ icon: Icon, label, value }) {
   return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #e2e8f0' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon size={16} color="#64748b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>{label}</span>
         </div>
         <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>{value}</span>
      </div>
   );
}

function ShieldCheck(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}