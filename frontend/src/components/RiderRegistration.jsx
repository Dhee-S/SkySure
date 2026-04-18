import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Zap, MapPin, CreditCard, 
  CheckCircle, ArrowRight, ArrowLeft, 
  Mail, Phone, Map, Briefcase,
  Smartphone, Truck, Navigation, DollarSign, Bike, Fuel,
  Globe, Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const steps = [
  { id: 1, title: 'Identity', desc: 'Secure OAuth Sync' },
  { id: 2, title: 'Verify', desc: 'Email Validation' },
  { id: 3, title: 'Profile', desc: 'Hustle Configuration' },
  { id: 4, title: 'Payouts', desc: 'Wallet Integration' }
];

export default function RiderRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    name: '',
    phone: '',
    city: 'Chennai',
    persona: 'Gig-Pro',
    vehicle: 'bike',
    partnerApp: 'Zomato',
    targetEarnings: 5000,
    upi: '',
    tier: 'Standard',
    password: ''
  });

  const [enrollmentMethod, setEnrollmentMethod] = useState(null); // 'google' | 'email'
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4)); // Increased to 4 steps
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleGoogleLogin = async () => {
    setLoading(true);
    setEnrollmentMethod('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFormData(prev => ({
        ...prev,
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
      }));
      setIsEmailVerified(true);
      setCurrentStep(2); // Skip Step 1 verification for Google
    } catch (error) {
      console.error("Login Error:", error);
      alert("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!formData.email || !formData.password) return alert("Email and Password required");
    setEnrollmentMethod('email');
    setLoading(true);
    try {
      // Simulate account creation & OTP dispatch
      await new Promise(r => setTimeout(r, 1500));
      nextStep();
    } catch (error) {
        alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (verificationCode.length < 4) return;
    setLoading(true);
    try {
      // Simulation: Accept any 4+ digit code
      await new Promise(r => setTimeout(r, 1000));
      setIsEmailVerified(true);
      nextStep();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
    setLoading(true);
    try {
      // In a real app we'd call createUserWithEmailAndPassword here if enrollmentMethod === 'email'
      // For showcase, we sync the provided profile to backend
      const response = await fetch(`${API_BASE}/api/riders/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        // Store for payment page and session
        localStorage.setItem('skysure_mock_user', JSON.stringify({
            uid: data.uid || formData.uid || `user_${Math.random().toString(36).slice(2, 9)}`,
            email: formData.email,
            name: formData.name,
            role: 'rider',
            city: formData.city,
            persona: formData.persona,
            vehicle: formData.vehicle
        }));
        
        // Push state to payment
        navigate('/payment', { state: { formData: { ...formData, uid: data.uid || formData.uid }, premium: calculatePremium() } });
      } else {
        const err = await response.json();
        throw new Error(err.error || "Registration synchronization failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePremium = () => {
    const baseRate = 0.03; 
    const personaModifiers = { 'Full-Timer': 0.70, 'Gig-Pro': 0.90, 'Student-Flex': 1.10 };
    return Math.round(formData.targetEarnings * baseRate * (personaModifiers[formData.persona] || 1.0));
  };

  return (
    <div className="registration-container" style={{ 
      minHeight: '100vh', 
      background: '#F8FAFC', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'rgba(59, 130, 246, 0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-5%', left: '-5%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.03)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 16px', borderRadius: '40px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <Zap size={18} color="#3B82F6" fill="#3B82F6" />
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1E293B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>SkySure Onboarding</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.04em', margin: 0 }}>Join the Resilience Network</h1>
      </motion.div>

      <motion.div 
        layout
        style={{ 
          width: '100%', 
          maxWidth: '800px', 
          background: 'white', 
          borderRadius: '32px', 
          padding: '40px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Step Stepper */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '48px', background: '#F1F5F9', padding: '6px', borderRadius: '16px' }}>
          {steps.map(step => (
            <div 
              key={step.id} 
              style={{ 
                flex: 1, 
                padding: '12px', 
                borderRadius: '12px', 
                background: currentStep === step.id ? 'white' : 'transparent',
                boxShadow: currentStep === step.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: currentStep === step.id ? '#3B82F6' : '#94A3B8', textTransform: 'uppercase' }}>Step 0{step.id}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: currentStep === step.id ? '#1E293B' : '#64748B' }}>{step.title}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
           {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginBottom: '16px' }}>Verify Identity</h2>
                    <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>Choose your preferred verification method to link your rider profile.</p>
                    
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      style={{ 
                        width: '100%', 
                        padding: '16px', 
                        borderRadius: '14px', 
                        background: 'white', 
                        color: '#1E293B', 
                        border: '2px solid #E2E8F0', 
                        fontWeight: 800, 
                        fontSize: '0.9rem',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '12px',
                        cursor: 'pointer',
                        marginBottom: '16px'
                      }}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
                      Google Integration
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', opacity: 0.5 }}>
                      <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>OR CLASSIC STYLE</span>
                      <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input 
                        type="email" placeholder="Email Address" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontWeight: 700 }} 
                      />
                      <input 
                        type="password" placeholder="Password" 
                        value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})}
                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontWeight: 700 }} 
                      />
                      <button 
                        onClick={handleEmailSignup}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#1E293B', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      >
                        {loading ? "Initializing..." : "Enroll with Email"}
                      </button>
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
                    <Fingerprint size={48} color="#3B82F6" style={{ marginBottom: '16px' }} />
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Security Layer</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E293B' }}>Parametric Verification Active</div>
                  </div>
               </div>
            </motion.div>
          )}

          {currentStep === 2 && !isEmailVerified && (
            <motion.div key="stepVerify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '64px', height: '64px', background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Mail size={32} color="#3B82F6" />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>One Last Step</h2>
                  <p style={{ color: '#64748B', marginBottom: '32px' }}>We've sent a 4-digit code to <strong>{formData.email}</strong></p>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
                     <input 
                        maxLength={4}
                        placeholder="0000"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        style={{ width: '120px', textAlign: 'center', fontSize: '2rem', letterSpacing: '8px', padding: '12px', borderRadius: '12px', border: '2px solid #3B82F6', fontWeight: 900, outline: 'none' }}
                     />
                  </div>

                  <button 
                    onClick={verifyEmailCode}
                    disabled={loading || verificationCode.length < 4}
                    style={{ width: '200px', padding: '16px', borderRadius: '12px', background: '#3B82F6', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', opacity: verificationCode.length < 4 ? 0.5 : 1 }}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
               </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Hustle Configuration</h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Configure your operational profile for accurate risk assessment.</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <PersonaCard active={formData.persona === 'Full-Timer'} onClick={() => setFormData({...formData, persona: 'Full-Timer'})} title="Full-Timer" desc="10+ hrs/day" />
                <PersonaCard active={formData.persona === 'Gig-Pro'} onClick={() => setFormData({...formData, persona: 'Gig-Pro'})} title="Gig-Pro" desc="5-8 hrs/day" />
                <PersonaCard active={formData.persona === 'Student-Flex'} onClick={() => setFormData({...formData, persona: 'Student-Flex'})} title="Student" desc="Flex Hours" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Operating City</label>
                  <select 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    style={{ 
                      padding: '14px 16px', borderRadius: '12px', background: '#F8FAFC', 
                      border: '1px solid #E2E8F0', outline: 'none', fontWeight: 700, color: '#1E293B' 
                    }}
                  >
                    {['Chennai', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input label="Partner Application" icon={Briefcase} value={formData.partnerApp} onChange={v => setFormData({...formData, partnerApp: v})} placeholder="e.g. Zomato" />
              </div>

              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>WEEKLY EARNINGS TARGET</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3B82F6' }}>₹{formData.targetEarnings.toLocaleString()}</span>
                 </div>
                 <input 
                  type="range" min="1000" max="15000" step="500" 
                  value={formData.targetEarnings} 
                  onChange={(e) => setFormData({...formData, targetEarnings: parseInt(e.target.value)})}
                  style={{ width: '100%', accentColor: '#3B82F6' }}
                />
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B', marginBottom: '24px' }}>Payout Settlement</h2>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Input label="UPI Address" icon={CreditCard} value={formData.upi} onChange={v => setFormData({...formData, upi: v})} placeholder="yourname@upi" />
                    <Input label="Verified Phone" icon={Smartphone} value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  
                  <div style={{ background: '#1E293B', padding: '32px', borderRadius: '24px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6, letterSpacing: '0.1em', marginBottom: '8px' }}>ESTIMATED PREMIUM</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '4px' }}>₹{calculatePremium()}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6 }}>Per Week (Parametric Protection)</div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={14} color="#10B981" />
                      <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Auto-Trigger Cap: 10mm Rain</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', alignItems: 'center' }}>
          {currentStep > 1 ? (
             <button onClick={prevStep} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748B', fontWeight: 800, cursor: 'pointer' }}>
               <ArrowLeft size={18} /> Back
             </button>
          ) : <div />}
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate('/rider')}
              style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Skip
            </button>
            {currentStep > 1 && (
              <button 
                onClick={currentStep === 4 ? handleRegister : nextStep}
                disabled={loading}
                style={{ 
                  padding: '12px 32px', 
                  borderRadius: '12px', 
                  background: '#1E293B', 
                  color: 'white', 
                  fontWeight: 800, 
                  fontSize: '0.9rem', 
                  cursor: 'pointer', 
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {currentStep === 4 ? 'Finalize Account' : 'Continue'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
          <Icon size={18} />
        </div>
        <input 
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ 
            width: '100%', 
            padding: '14px 16px 14px 44px', 
            borderRadius: '12px', 
            background: '#F8FAFC',
            border: '1px solid #E2E8F0', 
            fontSize: '0.9rem', 
            fontWeight: 700, 
            color: '#1E293B',
            outline: 'none'
          }} 
        />
      </div>
    </div>
  );
}

function PersonaCard({ active, onClick, title, desc }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '20px', 
        borderRadius: '16px', 
        border: `2px solid ${active ? '#3B82F6' : '#F1F5F9'}`, 
        background: active ? 'white' : '#F8FAFC', 
        cursor: 'pointer', 
        transition: 'all 0.2s ease',
        textAlign: 'center',
        boxShadow: active ? '0 10px 15px -3px rgba(59, 130, 246, 0.1)' : 'none'
      }}
    >
      <h4 style={{ fontWeight: 900, fontSize: '0.9rem', color: active ? '#3B82F6' : '#1E293B', margin: '0 0 4px 0' }}>{title}</h4>
      <p style={{ fontSize: '0.65rem', color: '#94A3B8', margin: 0, fontWeight: 700 }}>{desc}</p>
    </div>
  );
}
