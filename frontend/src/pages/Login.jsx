import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Mail, Lock, 
  ArrowRight, User, Briefcase, 
  ShieldCheck, Globe, Zap,
  Eye, EyeOff, Info
} from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { dataService } from '../data/dataService';
import { useToast } from '../App';

export default function Login() {
  const [role, setRole] = useState('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const showToast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Dummy Credentials Check
    const dummyAdmin = { email: 'admin@skysure.com', password: 'admin123' };
    const dummyRider = { email: 'rider@skysure.com', password: 'rider123' };

    if ((email === dummyAdmin.email && password === dummyAdmin.password) || 
        (email === dummyRider.email && password === dummyRider.password)) {
      
      let mockUser = { email, uid: 'mock-' + role };
      
      if (role === 'rider') {
        try {
          const riders = await dataService.getRiders();
          if (riders && riders.length > 0) {
            const randomRider = riders[Math.floor(Math.random() * riders.length)];
            mockUser.uid = randomRider.id || randomRider.rider_id;
            mockUser.displayName = randomRider.name;
          }
        } catch (err) {
          console.error("Failed to fetch mock riders:", err);
        }
      }

      localStorage.setItem('skysure_mock_user', JSON.stringify(mockUser));
      
      showToast(`Welcome back, ${role === 'admin' ? 'Administrator' : 'Partner'}!`, 'success');
      
      // Force reload or trigger state update via internal navigation
      setTimeout(() => {
        window.location.href = role === 'admin' ? '/client/overview' : '/rider';
      }, 500);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast(`Welcome back, ${role === 'admin' ? 'Administrator' : 'Partner'}!`, 'success');
      
      if (role === 'admin') {
        navigate('/client/overview');
      } else {
        navigate('/rider');
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Invalid credentials. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      {/* Background Effects */}
      <div className="login-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="login-container"
      >
        {/* Left Panel - Branding */}
        <div className="login-branding">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="branding-header"
          >
            <span className="branding-title">SkySure</span>
          </motion.div>

          <div className="branding-content">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Parametric Resilience for the Gig Economy.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Secure your operational uptime with instant, weather-triggered disbursements and AI-driven fraud mitigation.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="branding-features"
            >
              <div className="feature-item">
                <ShieldCheck size={18} />
                <span>ISO 27001 Protocol Compliance</span>
              </div>
              <div className="feature-item">
                <Globe size={18} />
                <span>Global Environmental Telemetry</span>
              </div>
              <div className="feature-item">
                <Zap size={18} />
                <span>Instant Settlement Engine</span>
              </div>
            </motion.div>
          </div>

          <div className="branding-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Secure Access Layer v3.2</span>
            <button 
                type="button" 
                onClick={() => navigate('/')} 
                style={{ background: 'transparent', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, opacity: 0.8 }}
            >
                <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Landing
            </button>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-form-panel">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="form-content"
          >
            <header className="form-header">
              <h1>Rider Authentication</h1>
              <p>Authenticate your identity to access the SkySure hub.</p>
            </header>

            {/* Role Selector */}
            <div className="role-selector">
              <button 
                className={`role-btn ${role === 'rider' ? 'active' : ''}`}
                onClick={() => setRole('rider')}
              >
                <User size={16} />
                Partner
              </button>
              <button 
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                <Briefcase size={16} />
                Enterprise
              </button>
              <motion.div 
                className="role-indicator"
                animate={{ x: role === 'rider' ? 0 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label>Email Terminal</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    placeholder="name@provider.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Encryption Key</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <span>Initialize {role === 'admin' ? 'Enterprise Control' : 'Partner Sync'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Demo Credentials */}
            <div className="demo-section">
              <div className="demo-header">
                <Info size={14} />
                <span>Sandbox Diagnostics</span>
              </div>
              <div className="demo-credentials">
                <div className="cred-item">
                  <span className="cred-label">Enterprise:</span>
                  <span className="cred-value">admin@skysure.com / admin123</span>
                </div>
                <div className="cred-item">
                  <span className="cred-label">Partner:</span>
                  <span className="cred-value">rider@skysure.com / rider123</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
