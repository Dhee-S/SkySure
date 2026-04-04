import React from 'react';
import { motion } from 'framer-motion';

const TelemetryGauge = ({ label, value, threshold, unit, status }) => {
  const isBreached = status === 'BREACHED';
  const percentage = Math.min((value / (threshold * 1.5)) * 100, 100);
  const thresholdPos = (threshold / (threshold * 1.5)) * 100;

  return (
    <div className="telemetry-gauge">
      <div className="gauge-header">
        <span className="gauge-label">{label}</span>
        <span className={`gauge-value ${isBreached ? 'text-danger' : 'text-primary'}`}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      
      <div className="gauge-track">
        <motion.div 
          className={`gauge-fill ${isBreached ? 'bg-danger' : 'bg-primary'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div 
          className="gauge-threshold-line" 
          style={{ left: `${thresholdPos}%` }}
          title={`Threshold: ${threshold}${unit}`}
        />
      </div>

      <div className="gauge-footer">
        <span className="text-[9px] uppercase font-bold opacity-50">Limit: {threshold}{unit}</span>
        {isBreached && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-black text-danger uppercase tracking-tighter"
          >
            Critical Breach
          </motion.span>
        )}
      </div>

    </div>
  );
};

export default TelemetryGauge;
