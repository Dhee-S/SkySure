import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Mail, Lock, 
  ArrowRight, Briefcase, 
  ShieldCheck, Zap,
  Eye, EyeOff, Info
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { useToast } from '../App';

export default function AdminLogin({ onLoginProp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  
  const navigate = useNavigate();
  const showToast = useToast();

  const processAdminAuth = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let isNewUser = false;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role !== 'admin') {
          showToast("Access Denied. This account is registered as a Partner/Rider. Please use an Enterprise account.", "danger");
          await auth.signOut();
          setLoading(false);
          setShowConfirm(false);
          return false;
        }
      } else {
        // New Admin Registration (Self-provisioning as requested)
        isNewUser = true;
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          name: user.displayName || 'Enterprise Admin',
          created_at: serverTimestamp(),
          is_active: true
        });
        
        showToast("Enterprise Terminal Initialized. Welcome, Admin.", "success");
      }

      const finalUser = userSnap.exists() ? userSnap.data() : { uid: user.uid, email: user.email, role: 'admin', name: user.displayName };
      localStorage.setItem('skysure_mock_user', JSON.stringify(finalUser));
      
      if (onLoginProp) onLoginProp();
      
      setTimeout(() => {
        navigate('/client/overview');
      }, 500);
      return true;
    } catch (err) {
      console.error("Admin Auth error:", err);
      showToast("Security Handshake Failed.", "danger");
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await processAdminAuth(userCredential.user);
    } catch (error) {
      showToast("Invalid credentials. Enterprise Access Denied.", "danger");
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
      showToast(`Google Auth Failed: ${error.message}`, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-gradient-1" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 40%)' }} />
        <div className="bg-gradient-2" style={{ background: 'radial-gradient(circle at 90% 80%, rgba(30, 58, 138, 0.2) 0%, transparent 40%)' }} />
        <div className="bg-grid" />
      </div>

      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.div 
            key="admin-login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="login-container"
            style={{ maxWidth: '900px', gridTemplateColumns: '400px 1fr' }}
          >
            {/* Branding Panel */}
            <div className="login-branding" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="branding-header">
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    <Shield size={20} color="#3b82f6" fill="#3b82f6" />
                </div>
                <span className="branding-title">Admin Hub</span>
              </div>

              <div className="branding-content">
                <h2>Enterprise Command Center.</h2>
                <p>Manage fleet telemetry, risk parameters, and autonomous settlement protocols from one secure terminal.</p>
                
                <div className="branding-features">
                  <div className="feature-item"><Zap size={16} fill="#3b82f6" color="#3b82f6" /> <span>Real-time Risk Ingestion</span></div>
                  <div className="feature-item"><Briefcase size={16} /> <span>Portfolio Resilience MGMT</span></div>
                  <div className="feature-item"><ShieldCheck size={16} /> <span>Algorithmic Fraud Mitigation</span></div>
                </div>
              </div>

              <div className="branding-footer">
                <span>Protocol v3.2 / Secured</span>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.6, fontSize: '11px', cursor: 'pointer' }}>Back to Landing</button>
              </div>
            </div>

            {/* Form Panel */}
            <div className="login-form-panel">
              <div className="form-content">
                <header className="form-header">
                  <h1 style={{ color: '#0f172a' }}>Enterprise Sign In</h1>
                  <p>Authenticate with your administrative credentials.</p>
                </header>

                <form onSubmit={handleLogin} className="login-form">
                  <div className="input-group">
                    <label>Terminal Email</label>
                    <div className="input-wrapper">
                      <Mail size={18} className="input-icon" />
                      <input type="email" placeholder="admin@skysure.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Encryption Key</label>
                    <div className="input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <motion.button type="submit" className="submit-btn" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    {loading ? "Decrypting..." : "Access Command Center"}
                  </motion.button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ padding: '0 10px', fontSize: '12px', color: '#94a3b8' }}>SECURE GATEWAY</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <motion.button 
                  type="button" 
                  className="submit-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '10px' }}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                  Sign in with Enterprise Google
                </motion.button>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                  Need to register as a Partner? <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 800, cursor: 'pointer' }}>Partner Login</button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="admin-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="login-container confirmation-step"
            style={{ maxWidth: '450px', padding: '40px', textAlign: 'center' }}
          >
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '15px', background: '#3b82f6', borderRadius: '50%' }}>
                <ShieldCheck size={32} color="white" />
              </div>
            </div>
            <h2>Verify Admin Identity</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Secure link established. Confirm to enter the Enterprise Portal.</p>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '30px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{pendingUser?.displayName}</div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>{pendingUser?.email}</div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase' }}>Scope: Enterprise Admin</div>
            </div>

            <button className="submit-btn" onClick={() => processAdminAuth(pendingUser)} disabled={loading}>
              {loading ? "Provisioning..." : "Confirm & Enter"}
            </button>
            <button onClick={() => { setShowConfirm(false); setPendingUser(null); }} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
