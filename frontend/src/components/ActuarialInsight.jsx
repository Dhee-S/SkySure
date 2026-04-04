import React from 'react';
import { IndianRupee, ShieldCheck, CheckCircle2, AlertCircle, Info, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const ActuarialInsight = ({ payout, mei, persona }) => {
  if (!payout || !payout.math) return null;

  const { cap, severity, confidence, final } = payout.math;
  const isApproved = payout.status === 'APPROVED';

  const steps = [
    { id: 1, label: 'Environment', status: mei?.triggerActivated ? 'ok' : 'skip' },
    { id: 2, label: 'Identity', status: confidence > 0.6 ? 'ok' : 'risk' },
    { id: 3, label: 'Disbursement', status: isApproved ? 'ok' : 'fail' }
  ];

  return (
    <div className="actuarial-insight-v3">
      <div className="ai-header-row">
        <h4 className="cc-section-title">
          <Zap size={16} /> Settlement Calculus
        </h4>
        <div className="status-pill status-pill-safe">Verified Proof</div>
      </div>

      {/* MULTI-LEVEL CHECK STEPPER */}
      <div className="ai-stepper">
         {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
               <div className="ai-step-group">
                  <div className={`step-circle ${step.status}`}>
                     {step.status === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </div>
                  <span className="ai-math-label" style={{ fontSize: '9px', marginTop: '4px' }}>{step.label}</span>
               </div>
               {idx < steps.length - 1 && <div className="ai-step-line" />}
            </React.Fragment>
         ))}
      </div>

      {/* MATH BREAKDOWN */}
      <div className="ai-math-box">
         <div className="ai-math-header">
            <div>
               <div className="ai-math-label">Actuarial Cap</div>
               <div className="ai-math-value-main">₹{cap}</div>
            </div>
            <div className="ai-persona-label">({persona})</div>
         </div>

         <div style={{ margin: '16px 0' }}>
            <div className="ai-math-row">
               <span className="ai-factor-label"><Activity size={12}/> Severity Factor</span>
               <span className="ai-factor-value">x {severity.toFixed(2)}</span>
            </div>
            <div className="ai-math-row">
               <span className="ai-factor-label"><ShieldCheck size={12}/> Confidence Index</span>
               <span className="ai-factor-value">x {confidence.toFixed(2)}</span>
            </div>
         </div>

         <div className="ai-final-row">
            <span className="ai-final-label">Final Disbursement</span>
            <span className="ai-final-value">₹{final}</span>
         </div>
      </div>

      {!isApproved && (
         <div className="fc-alert-box" style={{ background: 'rgba(239, 68, 68, 0.05)', marginTop: '0' }}>
            <AlertCircle size={18} color="var(--cc-danger)" style={{ flexShrink: 0 }} />
            <p className="fc-alert-text">
               {payout.reason === 'FRAUD_BLOCK' ? 'CRITICAL: Security ring score exceeded safety threshold.' : 'INFO: Environmental severity index below activation threshold.'}
            </p>
         </div>
      )}
    </div>
  );
};

export default ActuarialInsight;
