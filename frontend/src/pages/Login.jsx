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
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  
  const navigate = useNavigate();
  const showToast = useToast();

  const processRoleAuth = async (user) => {
    try {
      const role = 'rider';
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let isNewUser = false;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role !== role) {
          showToast(`This account is registered as an ${userData.role.toUpperCase()}. Please use the Enterprise Portal.`, "danger");
          await auth.signOut();
          setLoading(false);
          setShowConfirm(false);
          return false;
        }
      } else {
        // New User Registration
        isNewUser = true;
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: role,
          name: user.displayName || 'New Partner',
          created_at: serverTimestamp(),
          tier: 'Basic',
          is_active: true
        });

        // Initialize production rider profile via Backend API
        try {
            await dataService.registerRider({
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'New Partner',
                phone: user.phoneNumber || ''
            });
        } catch (regErr) {
            console.error("Backend profile initialization failed:", regErr);
        }
        
        showToast("Welcome! Your Partner Hub has been initialized.", "success");
      }

      const finalUser = userSnap.exists() ? userSnap.data() : { uid: user.uid, email: user.email, role: role, name: user.displayName };
      localStorage.setItem('skysure_mock_user', JSON.stringify(finalUser));
      
      if (onLoginProp) onLoginProp();
      
      setTimeout(() => {
        if (isNewUser) {
           navigate('/rider/profile');
        } else {
           navigate('/rider');
        }
      }, 500);
      return true;
    } catch (err) {
      console.error("Auth process error:", err);
      showToast("Security Handshake Failed.", "danger");
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await processRoleAuth(userCredential.user);
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
      setPendingUser(result.user);
      setShowConfirm(true);
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

  const finalizeLogin = async () => {
    if (!pendingUser) return;
    setLoading(true);
    await processRoleAuth(pendingUser);
    setLoading(false);
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

      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4 }}
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
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white" fill="white" />
            </div>
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
                <Zap size={18} fill="currentColor" />
                <span>Instant Settlement Protocol</span>
              </div>
              <div className="feature-item">
                <Globe size={18} />
                <span>Global Risk Telemetry</span>
              </div>
              <div className="feature-item">
                <ShieldCheck size={18} />
                <span>Autonomous Fraud Mitigation</span>
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
              <h1>Partner Authentication</h1>
              <p>Sign in to sync your telemetry and view coverage.</p>
            </header>

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
        ) : (
          <motion.div 
            key="confirm-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="login-container confirmation-step"
            style={{ maxWidth: '450px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', textAlign: 'center' }}
          >
            <div className="branding-header" style={{ marginBottom: '32px' }}>
              <div style={{ padding: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                  <ShieldCheck size={28} color="white" />
              </div>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Confirm Identity</h2>
            <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '0.95rem' }}>Secure handshake established. Verify your uplink parameters.</p>

            <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', marginBottom: '40px', textAlign: 'left' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img 
                    src={pendingUser?.photoURL || 'https://via.placeholder.com/48'} 
                    alt="User" 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{pendingUser?.displayName}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{pendingUser?.email}</div>
                  </div>
               </div>
               <div style={{ marginTop: '20px', height: '1px', background: '#e2e8f0' }} />
               <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Access Level</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                    {pendingUser?.email?.includes('admin') ? 'ENTERPRISE ADMIN' : role.toUpperCase()}
                  </span>
               </div>
            </div>

            <button 
              className="submit-btn" 
              onClick={finalizeLogin}
              disabled={loading}
              style={{ width: '100%', padding: '18px' }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span>Configuring Node...</span>
                </div>
              ) : (
                <>Confirm & Enter Platform <ArrowRight size={18} /></>
              )}
            </button>

            <button 
              onClick={() => { setShowConfirm(false); setPendingUser(null); auth.signOut(); }}
              style={{ marginTop: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Use another account
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
