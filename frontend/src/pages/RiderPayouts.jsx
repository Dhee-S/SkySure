import { useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dataService } from '../data/dataService';
import { CreditCard, Zap, Calendar, CloudRain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/dashboard.css';

export default function RiderPayouts() {
   const { rider } = useOutletContext();
   const [payouts, setPayouts] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      async function load() {
         try {
            const data = await dataService.getPayouts(rider.id || rider.rider_id);
            setPayouts(Array.isArray(data) ? data : []);
         } catch (err) {
            console.error('Failed to load payouts:', err);
            setPayouts([]);
         } finally {
            setLoading(false);
         }
      }
      load();
   }, [rider.id, rider.rider_id]);

   const totalSettled = (payouts || []).reduce((sum, p) => {
      if (p.status === 'blocked') return sum;
      return sum + (Number(p.amount) || 0);
   }, 0);

   if (loading) return (
      <div style={{ display: 'flex', height: '50vh', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontWeight: 700 }}>
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', width: '30px', height: '30px', marginRight: '12px' }} />
         Decrypting Ledger...
      </div>
   );

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
                  <CreditCard size={12} /> Settlement Registry
               </div>
               <h1 className="dash-title">My Payouts</h1>
               <p className="dash-subtitle">Historical audit of all disbursements for <strong style={{ color: '#0f172a' }}>#{rider.id?.slice(0, 8) || 'RDR-99'}</strong></p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'white', border: '1px solid #e2e8f0', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Total Settled</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'baseline', gap: '4px', color: '#0f172a' }}>
                     <span style={{ fontSize: '1rem', opacity: 0.5 }}>₹</span>{totalSettled.toLocaleString()}
                  </div>
               </div>
               <div style={{ width: '1px', height: '40px', background: '#e2e8f0' }} />
               <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Policy Events</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{payouts.length}</div>
               </div>
            </div>
         </motion.header>

         {payouts.length === 0 ? (
            <motion.div variants={itemVariants} className="sim-launch-card">
               <div className="sim-launch-icon"><Zap size={32} /></div>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px' }}>No Events Detected</h3>
               <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your node is active. Payouts trigger automatically during qualifying events.</p>
            </motion.div>
         ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <AnimatePresence>
                  {payouts.map((p, i) => (
                     <motion.div 
                        key={p.id} 
                        variants={itemVariants}
                        whileHover={{ scale: 1.01, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                        style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                           <div style={{ padding: '16px', borderRadius: '16px', background: '#eff6ff', color: '#2563eb' }}>
                              <Zap size={24} />
                           </div>
                           <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                 <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{p.weather}</h3>
                                 <span className="badge-success">Settled</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(p.timestamp).toLocaleDateString()}</span>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CloudRain size={14} color="#2563eb" /> {p.rainfallMm}mm precip.</span>
                              </div>
                           </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Reference ID</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: '#94a3b8' }}>#{p.id}</div>
                           </div>
                           <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Disbursement</div>
                              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>₹{p.amount}</div>
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         )}
      </motion.div>
   );
}