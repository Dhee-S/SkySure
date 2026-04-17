import React from 'react';
import { motion } from 'framer-motion';

export const TriggerCard = ({ label, name, value, unit, active, threshold, isStatus }) => {
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
         backdropFilter: 'blur(4px)',
         minWidth: '70px'
      }}>
         <div style={{ fontSize: '0.65rem', fontWeight: 800, color: active ? '#3B82F6' : '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
         {name && <div style={{ fontSize: '0.6rem', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>{name}</div>}
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
            boxShadow: active ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none'
         }} />
      </div>
   );
};

export const CalculationStep = ({ label, value, isFinal }) => (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '10px 16px',
        background: isFinal ? '#1E293B' : 'white',
        color: isFinal ? 'white' : '#1E293B',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        minWidth: '100px'
    }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'monospace' }}>{value}</div>
    </div>
);

export const AuditWorkflowPanel = ({ node }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
                <TriggerCard label="Precip" value={node.signals?.heavyRain?.value || (Math.random()*15)} unit="mm" active={node.signals?.heavyRain?.active || (Math.random()>0.5)} />
                <TriggerCard label="Wind" value={node.signals?.highWind?.value || (Math.random()*40)} unit="km" active={node.signals?.highWind?.active || (Math.random()>0.7)} />
                <TriggerCard label="Velocity" value={parseFloat(node.velocity) || 42} unit="km" active={parseFloat(node.velocity) > 50} />
                <TriggerCard label="Trust" value={Number(node.trust_score)} unit="%" active={Number(node.trust_score) < 50} threshold={50} />
            </div>
            
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px',
                padding: '1.5rem', 
                background: 'rgba(248, 250, 252, 0.8)', 
                borderRadius: '16px',
                border: '1px dashed #CBD5E1' 
            }}>
                <CalculationStep label="Daily Baseline" value={`₹${Math.round(node.payout?.math?.baseline || 850)}`} />
                <div style={{ fontWeight: 900, opacity: 0.3, fontSize: '1.2rem' }}>×</div>
                <CalculationStep label="Impact" value={(node.payout?.math?.impact || 0.85).toFixed(2)} />
                <div style={{ fontWeight: 900, opacity: 0.3, fontSize: '1.2rem' }}>×</div>
                <CalculationStep label="Outcome" value={`₹${node.payout?.amount?.toLocaleString() || '0'}`} isFinal />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Heuristic Signature audit</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(node.heuristicChecks || []).map((check, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '10px', 
                            borderRadius: '10px', 
                            background: check.status === 'pass' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                            border: `1px solid ${check.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: check.status === 'pass' ? '#10B981' : '#EF4444' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1E293B' }}>{check.label}</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748B', fontWeight: 600 }}>{check.detail}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
