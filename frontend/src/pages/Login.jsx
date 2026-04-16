import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Mail, Lock, 
  ArrowRight, User, Briefcase, 
  ShieldCheck, Globe, Zap,
  Eye, EyeOff, Info
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { dataService } from '../data/dataService';
import { useToast } from '../App';

export default function Login({ onLoginProp }) {
  const [role, setRole] = useState('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const showToast = useToast();

  const processRoleAuth = async (user, selectedRole) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role !== selectedRole) {
          showToast(`This account is registered as a ${userData.role.toUpperCase()}. Please use another Gmail to register as ${selectedRole.toUpperCase()}.`, "danger");
          await auth.signOut();
          setLoading(false);
          return false;
        }
      } else {
        // New User Registration

        // Auto-register Riders
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: 'rider',
          name: user.displayName || 'New Partner',
          created_at: serverTimestamp()
        });

        // Initialize a rider profile if needed
        // (In a real app, we'd redirect to a setup wizard)
        showToast("Welcome! Your Partner account has been initialized.", "success");
      }

      // Store in local storage for legacy component compatibility
      const finalUser = userSnap.exists() ? userSnap.data() : { uid: user.uid, email: user.email, role: 'rider', name: user.displayName };
      localStorage.setItem('skysure_mock_user', JSON.stringify(finalUser));
      
      if (onLoginProp) onLoginProp();
      
      setTimeout(() => {
        navigate(selectedRole === 'admin' ? '/client/overview' : '/rider');
      }, 500);
      return true;
    } catch (err) {
      console.error("Auth process error:", err);
      showToast("Security Handshake Failed. Please try again.", "danger");
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await processRoleAuth(userCredential.user, role);
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Invalid credentials. Access Denied.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await processRoleAuth(result.user, role);
    } catch (error) {
      console.error("Google Login error:", error);
      if (error.code === 'auth/configuration-not-found') {
        showToast("CRITICAL: Google Sign-In is not enabled in Firebase Console. Please enable 'Google' under Auth Settings.", "danger");
      } else {
        showToast(`Google Authentication Failed: ${error.message}`, "danger");
      }
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Synchronizing {role === 'admin' ? 'Terminal' : 'Partner Data'}...</span>
                  </div>
                ) : (
                  <>
                    <span>Initialize {role === 'admin' ? 'Enterprise Terminal' : 'Partner Sync'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              <span style={{ padding: '0 10px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            <motion.button 
              type="button" 
              className="submit-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '10px' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" style={{marginLeft: '-10px'}}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Sign In with Google
            </motion.button>

            {role === 'rider' && (
              <motion.div 
                style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span style={{ color: '#94a3b8' }}>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  Sign Up for Coverage
                </button>
              </motion.div>
            )}

            {/* Demo Notice */}
            <div className="demo-section">
              <div className="demo-header">
                <Info size={14} />
                <span>Security Notice</span>
              </div>
              <div className="demo-credentials">
                <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                  Enterprise accounts require manual provisioning. Partners can self-register via Google Auth.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
