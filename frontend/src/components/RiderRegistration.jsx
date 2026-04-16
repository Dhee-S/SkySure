import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, MapPin, CreditCard, 
  CheckCircle, ArrowRight, ArrowLeft, 
  Zap, Mail, Phone, Map, Briefcase,
  Smartphone, Truck, Navigation, DollarSign, Bike, Fuel
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const steps = [
  { id: 1, title: 'Identity', icon: User },
  { id: 2, title: 'Vehicle', icon: Truck },
  { id: 3, title: 'Workforce', icon: Briefcase },
  { id: 4, title: 'Premium', icon: Shield },
  { id: 5, title: 'Secure', icon: Zap }
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
    zone: 'Adyar',
    persona: 'Gig-Pro',
    vehicle: 'bike',
    partnerApp: 'Zomato',
    appId: '',
    targetEarnings: 5000, // Weekly target
    upi: ''
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFormData(prev => ({
        ...prev,
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
      }));
      nextStep();
    } catch (error) {
      console.error("Google Login Failed:", error);
      let msg = `Login failed: ${error.message}`;
      if (error.code === 'auth/unauthorized-domain') {
        msg = "ERROR: Localhost is not whitelisted. Please ensure 'localhost' is added to Authorized Domains in Firebase Console.";
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = "ERROR: Google Sign-In is not enabled. I have attempted to enable it via setup—please refresh and try again.";
      } else if (error.code === 'auth/popup-blocked') {
        msg = "ERROR: Browser blocked the popup. Please enable popups for this site.";
      }
      alert(`${msg} (${error.code})\n\nCURRENT DOMAIN: ${window.location.hostname}\n(Please ensure this EXACT hostname is added to 'Authorized Domains' in Firebase console)`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rider/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Bypass payment and go straight to dashboard
        showToast("Registration Successful! Welcome to SkySure.", "success");
        navigate('/rider');
      } else {
        const err = await response.json();
        throw new Error(err.error || "Registration failed");
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePremium = () => {
    const baseRate = 0.03; 
    const personaModifiers = {
      'Full-Timer': 0.70,
      'Gig-Pro': 0.90,
      'Student-Flex': 1.10,
      'High-Risk': 1.50
    };
    const modifier = personaModifiers[formData.persona] || 1.0;
    const weeklyPremium = (formData.targetEarnings * baseRate * modifier);
    return Math.round(weeklyPremium);
  };

  return (
    <div className="registration-container" style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px',
      fontFamily: "'Inter', sans-serif",
      color: 'white'
    }}>
      {/* Background Glow */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: '400px', height: '400px', background: 'rgba(37, 99, 235, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '30%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0 }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          width: '100%', 
          maxWidth: '640px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '40px', 
          padding: '48px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '56px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '2px', background: 'rgba(255, 255, 255, 0.05)', zIndex: 0 }} />
          {steps.map(step => (
            <div key={step.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <motion.div 
                animate={{ 
                  scale: currentStep === step.id ? 1.2 : 1,
                  backgroundColor: currentStep >= step.id ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: currentStep >= step.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'
                }}
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '12px', 
                  border: '2px solid',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '12px', fontWeight: 900,
                  color: 'white'
                }}
              >
                {currentStep > step.id ? <CheckCircle size={16} /> : step.id}
              </motion.div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                color: currentStep >= step.id ? 'white' : 'rgba(255, 255, 255, 0.3)' 
              }}>{step.title}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.03em' }}>Welcome to SkySure</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500, lineHeight: 1.6 }}>Secure your digital rider identity with Google OAuth for instant parametric payouts.</p>
              </div>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: '18px', 
                  background: 'white', 
                  color: 'black', 
                  border: 'none', 
                  fontWeight: 800, 
                  fontSize: '16px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                {loading ? 'Authenticating...' : 'Continue with Google'}
              </button>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>We only sync your profile name and email.</p>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Asset & Tools</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px', fontWeight: 500 }}>Select your primary delivery machine.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <SelectCard active={formData.vehicle === 'bike'} onClick={() => setFormData({...formData, vehicle: 'bike'})} icon={Fuel} title="Petrol Bike" desc="Standard IC Engine" />
                <SelectCard active={formData.vehicle === 'scooter'} onClick={() => setFormData({...formData, vehicle: 'scooter'})} icon={Navigation} title="Scooter" desc="Light transit" />
                <SelectCard active={formData.vehicle === 'ev'} onClick={() => setFormData({...formData, vehicle: 'ev'})} icon={Zap} title="Electric" desc="Eco-efficient" />
                <SelectCard active={formData.vehicle === 'bicycle'} onClick={() => setFormData({...formData, vehicle: 'bicycle'})} icon={Bike} title="Bicycle" desc="Short range" />
              </div>

              <Input label="Mobile Number" icon={Phone} value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91 XXXXX XXXXX" />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Rider Persona</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px', fontWeight: 500 }}>Which profile matches your weekly hustle?</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <PersonaCard active={formData.persona === 'Full-Timer'} onClick={() => setFormData({...formData, persona: 'Full-Timer'})} title="Full-Timer" desc="10+ hrs/day" />
                <PersonaCard active={formData.persona === 'Gig-Pro'} onClick={() => setFormData({...formData, persona: 'Gig-Pro'})} title="Gig-Pro" desc="5-8 hrs/day" />
                <PersonaCard active={formData.persona === 'Student-Flex'} onClick={() => setFormData({...formData, persona: 'Student-Flex'})} title="Flex" desc="Weekend focus" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>City</label>
                  <select 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '14px', borderRadius: '14px', outline: 'none' }}
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Partner App</label>
                  <select 
                    value={formData.partnerApp} 
                    onChange={e => setFormData({...formData, partnerApp: e.target.value})}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '14px', borderRadius: '14px', outline: 'none' }}
                  >
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Uber Eats">Uber Eats</option>
                    <option value="Dunzo">Dunzo</option>
                    <option value="Zepto">Zepto</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>Dynamic Premium</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '40px', fontWeight: 500 }}>Adjust your weekly earnings goal to see your protection premium.</p>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '32px', borderRadius: '24px', marginBottom: '32px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', fontSize: '12px' }}>Weekly Earnings Goal</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#3b82f6' }}>₹{formData.targetEarnings}</span>
                </div>
                
                <input 
                  type="range" 
                  min="1000" 
                  max="10000" 
                  step="500" 
                  value={formData.targetEarnings} 
                  onChange={(e) => setFormData({...formData, targetEarnings: parseInt(e.target.value)})}
                  style={{ width: '100%', height: '6px', background: '#1e3a8a', borderRadius: '10px', appearance: 'none', cursor: 'pointer' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.3)' }}>
                  <span>₹1,000</span>
                  <span>₹10,000</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: '#2563eb', borderRadius: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase' }}>Adaptive Premium</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Parametric Protection</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900 }}>₹{calculatePremium()}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)' }}>PER WEEK</div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div key="step5" style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ width: '80px', height: '80px', background: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Shield size={40} />
              </motion.div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '12px' }}>Finalize Setup</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '32px', fontWeight: 500, lineHeight: 1.6 }}>One last step. Please provide your UPI ID for instant parametric payouts directly to your account.</p>
              
              <Input label="UPI ID / VPA" icon={CreditCard} value={formData.upi} onChange={v => setFormData({...formData, upi: v})} placeholder="name@upi" />
              
              <div style={{ margin: '24px 0', padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'left', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 800, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>Coverage summary</div>
                Parametric trigger activated at 10mm/h rainfall or 35km/h wind speed. 
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentStep > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px' }}>
            <button 
              onClick={prevStep} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button 
              onClick={currentStep === 5 ? handleRegister : nextStep}
              disabled={loading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '14px 36px', 
                borderRadius: '16px', 
                background: '#2563eb', 
                color: 'white', 
                fontWeight: 800, 
                cursor: 'pointer', 
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
              }}
            >
              {loading ? 'Securing...' : (currentStep === 5 ? 'Authorize & Pay' : 'Next Step')} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '20px' }}>
      <label style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.3)' }} />
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ 
            width: '100%', 
            padding: '16px 16px 16px 48px', 
            borderRadius: '16px', 
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            fontSize: '14px', 
            fontWeight: 700, 
            color: 'white',
            outline: 'none',
            boxSizing: 'border-box'
          }} 
        />
      </div>
    </div>
  );
}

function SelectCard({ active, onClick, icon: Icon, title, desc }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '20px', 
        borderRadius: '20px', 
        border: `2px solid ${active ? '#2563eb' : 'rgba(255, 255, 255, 0.05)'}`, 
        background: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
        cursor: 'pointer', 
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <Icon size={24} color={active ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'} />
      <h4 style={{ fontWeight: 800, fontSize: '14px', margin: 0 }}>{title}</h4>
      <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontWeight: 600 }}>{desc}</p>
    </div>
  );
}

function PersonaCard({ active, onClick, title, desc }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '24px', 
        borderRadius: '20px', 
        border: `2px solid ${active ? '#2563eb' : 'rgba(255, 255, 255, 0.05)'}`, 
        background: active ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'center'
      }}
    >
      <h4 style={{ fontWeight: 900, fontSize: '15px', marginBottom: '4px', letterSpacing: '-0.02em' }}>{title}</h4>
      <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{desc}</p>
    </div>
  );
}
