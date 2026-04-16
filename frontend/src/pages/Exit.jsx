import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import '../styles/landing.css';

export default function Exit() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('decom'); // decom, final

  useEffect(() => {
    // Force clear everything on exit
    const performExit = async () => {
      localStorage.removeItem('skysure_mock_user');
      localStorage.clear();
      sessionStorage.clear();
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Signout failed during exit", e);
      }
    };
    
    performExit();

    const timer = setTimeout(() => {
      setStage('final');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', overflow: 'hidden' }}>
      {/* Neural Mesh Background */}
      <div className="neural-mesh-bg">
        <div className="mesh-gradient-1" style={{ opacity: 0.3 }} />
        <div className="mesh-gradient-2" style={{ opacity: 0.2 }} />
        <div className="mesh-dots" style={{ opacity: 0.1 }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="exit-card"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '32px',
          padding: '60px',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ marginBottom: '40px', position: 'relative', display: 'inline-block' }}>
          <motion.div
            animate={stage === 'decom' ? { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '50%',
              background: stage === 'decom' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              filter: 'blur(20px)'
            }}
          />
          <div style={{
            width: '80px',
            height: '80px',
            background: stage === 'decom' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: stage === 'decom' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: stage === 'decom' ? '#3b82f6' : '#10b981',
            position: 'relative'
          }}>
            {stage === 'decom' ? <Lock size={32} /> : <ShieldCheck size={32} />}
          </div>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '16px', letterSpacing: '-0.02em' }}>
          {stage === 'decom' ? 'Decommissioning...' : 'Session Terminated'}
        </h2>
        
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '40px' }}>
          {stage === 'decom' 
            ? 'Synchronizing parametric triggers with the Resilience Ledger. Severing secure neural proxy...'
            : 'Your SkySure session has been securely closed. All local environment cache cleared and audit trails finalized.'
          }
        </p>

        {stage === 'decom' && (
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '40px' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              style={{ height: '100%', background: '#3b82f6' }}
            />
          </div>
        )}

        {stage === 'final' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 800 }}
            >
              Return to HQ <ArrowRight size={18} />
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              style={{ 
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                margin: '16px auto 0',
                gap: '6px'
              }}
              onMouseOver={e => e.currentTarget.style.color = 'white'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              Sign back in <Zap size={14} />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4" style={{ position: 'absolute', opacity: 0.1 }}>
        <Zap size={120} color="#3b82f6" />
      </div>
    </div>
  );
}
