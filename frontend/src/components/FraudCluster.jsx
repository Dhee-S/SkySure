import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, MapPin, Share2 } from 'lucide-react';

const FraudCluster = ({ score = 0, anomalies = [] }) => {
   // Color logic based on Ring Score
   const getScoreColor = (s) => {
      if (s < 30) return '#10B981'; // Green
      if (s < 60) return '#F59E0B'; // Yellow
      return '#EF4444'; // Red
   };

   const color = getScoreColor(score);
   const radius = 60;
   const circumference = 2 * Math.PI * radius;
   const offset = circumference - (score / 100) * circumference;

   return (
      <div className="integrity-panel">
         <div className="ring-score-container">
            <svg width="140" height="140" className="ring-score-circle">
               <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="8"
               />
               <motion.circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
               />
            </svg>
            <div className="ring-score-text">
               <div className="ring-score-value">{score}%</div>
               <div className="ring-score-label">Ring Score</div>
            </div>
         </div>

         <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E293B', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <Fingerprint size={14} /> Anomaly Decomposition
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <AnomalyBar label="Geospatial Spoofing" value={anomalies.includes('SPOOFING') ? 85 : 12} />
               <AnomalyBar label="Identity Fragmentation" value={anomalies.includes('IDENTITY') ? 70 : 5} />
               <AnomalyBar label="Swarm Collusion" value={anomalies.includes('COLLUSION') ? 95 : 8} />
            </div>
         </div>

         <div className="insight-card-executive" style={{ marginTop: '1.5rem', width: '100%' }}>
            <div className="insight-header">
               <ShieldAlert size={16} /> 
               <span>Integrity Verdict</span>
            </div>
            <p className="insight-summary" style={{ fontSize: '0.75rem' }}>
               {score > 60 
                  ? "CRITICAL: Multiple telemetry anomalies suggest systematic policy violation. Payout blocked under Anti-Fraud Protocol 4.2."
                  : score > 30
                  ? "WARNING: Slight deviation in partner geospatial data. Manual review suggested for high-value disbursement."
                  : "TRUSTED: Behavioral signature matches historical pattern. Digital fingerprint verified."
               }
            </p>
         </div>
      </div>
   );
};

const AnomalyBar = ({ label, value }) => {
   const isHigh = value > 50;
   return (
      <div className="telemetry-gauge-container">
         <div className="gauge-header">
            <span className="gauge-label">{label}</span>
            <span className="gauge-value" style={{ color: isHigh ? '#EF4444' : '#64748B' }}>+{value}%</span>
         </div>
         <div className="gauge-track">
            <motion.div 
               className={`gauge-fill ${isHigh ? 'breached' : 'normal'}`}
               initial={{ width: 0 }}
               animate={{ width: `${value}%` }}
               transition={{ duration: 1, delay: 0.2 }}
            />
         </div>
      </div>
   );
};

export default FraudCluster;
