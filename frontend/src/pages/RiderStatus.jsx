import { useOutletContext } from 'react-router-dom';
import { Activity, Shield, MapPin, Zap, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/dashboard.css';

export default function RiderStatus() {
   const { rider, weather, isProtected } = useOutletContext();

   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
   };

   return (
      <motion.div 
         className="dash-container" 
         style={{ padding: 0 }}
         initial="hidden"
         animate="visible"
         variants={containerVariants}
      >
         <motion.header variants={itemVariants} className="dash-header">
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#2563eb', letterSpacing: '0.1em' }}>
                  <Activity size={12} /> Real-time Rider Status
               </div>
               <h1 className="dash-title">Status Dashboard</h1>
               <p className="dash-subtitle">Continuous actuarial verification of Rider ID <strong style={{ color: '#0f172a' }}>{rider.rider_id || rider.id || 'RDR-99'}</strong></p>
            </div>
         </motion.header>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>

            {/* LEFT COLUMN: System Integrity */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                     <motion.div 
                        animate={isProtected ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3 }}
                        style={{ padding: '20px', borderRadius: '24px', background: isProtected ? '#d1fae5' : '#f8fafc', color: isProtected ? '#10b981' : '#94a3b8' }}
                     >
                        <Shield size={40} />
                     </motion.div>
                     <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px 0', color: '#0f172a' }}>System Integrity</h3>
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#64748b' }}>
                           Rider Status: <span style={{ color: isProtected ? '#10b981' : '#ef4444' }}>{isProtected ? 'VALIDATED' : 'OFFLINE'}</span>
                        </p>
                     </div>
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.12em' }}>Environmental Risk Meter</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#10b981' }}>LOW RISK (SECURE)</span>
                     </div>
                     <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '100px', overflow: 'hidden' }}>
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: '15%' }}
                           transition={{ duration: 1, delay: 0.5 }}
                           style={{ height: '100%', background: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }} 
                        />
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                     <StatusCard label="Signal Strength" value="Optimal" detail="Latency: 42ms" icon={Zap} color="#3b82f6" />
                     <StatusCard label="Hub Coverage" value={rider.city || 'Chennai'} detail={`Zone: ${rider.zone || 'Central'}`} icon={MapPin} color="#ef4444" />
                  </div>
               </div>
            </motion.div>

            {/* RIGHT COLUMN: Rider Pulse */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <div style={{ background: '#0f172a', border: 'none', borderRadius: '24px', padding: '48px', textAlign: 'center', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Pulsing Background Rings */}
                  <motion.div 
                     animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                     style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '2px solid rgba(59, 130, 246, 0.5)' }}
                  />
                  <motion.div 
                     animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
                     style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                  />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: '#3b82f6', animation: 'spin 3s linear infinite', marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radio size={40} color="#3b82f6" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                     </div>
                     <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>Rider Connection Active</h3>
                     <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', maxWidth: '300px', lineHeight: 1.6 }}>
                        Receiving geo-temporal telemetry streams from centralized resilience hub.
                     </p>
                     
                     <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                        {[1, 2, 3].map(i => (
                           <motion.div 
                              key={i}
                              animate={{ opacity: [0.2, 1, 0.2] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                              style={{ width: '6px', height: '6px', background: '#3b82f6', borderRadius: '50%' }}
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>

         </div>
      </motion.div>
   );
}

function StatusCard({ label, value, detail, icon: Icon, color }) {
   return (
      <motion.div 
         whileHover={{ y: -5 }}
         style={{ padding: '24px', borderRadius: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}
      >
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', color: color || '#2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Icon size={18} /></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.1em' }}>{label}</span>
         </div>
         <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>{value}</div>
         <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{detail}</div>
      </motion.div>
   );
}