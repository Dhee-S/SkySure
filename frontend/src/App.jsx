import { Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ClientLayout from './pages/ClientLayout';
import Overview from './pages/Overview';
import Riders from './pages/Riders';
import Simulation from './pages/Simulation';
import PayoutLogs from './pages/PayoutLogs';
import { seedSampleRiders } from './data/mockStore';
import RiderLayout from './pages/RiderLayout';
import RiderPolicy from './pages/RiderPolicy';
import RiderPayouts from './pages/RiderPayouts';
import RiderStatus from './pages/RiderStatus';
import RiderDashboard from './pages/RiderDashboard';
import RiderProfile from './pages/RiderProfile';
import Exit from './pages/Exit';
import RiderRegistration from './components/RiderRegistration';
import RiderPayment from './pages/RiderPayment';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("UI Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Dashboard Offline</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>A telemetry node encountered a critical error. The system is attempting to recover.</p>
          <button onClick={() => window.location.href = '/login'} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Reconnect to Operations Hub
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleAuthUpdate = () => {
    try {
      const mockUser = localStorage.getItem('skysure_mock_user');
      if (mockUser) {
        const parsed = JSON.parse(mockUser);
        setUser(parsed);
        const role = parsed.role || (parsed.email?.toLowerCase().includes('admin') ? 'admin' : 'rider');
        setUserRole(role);
        setLoading(false);
        return true;
      }
    } catch (err) {
      console.error("Mock auth parsing failed:", err);
      localStorage.removeItem('skysure_mock_user');
    }
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        try {
          const { doc, getDoc, getFirestore } = await import('firebase/firestore');
          const { app } = await import('./firebase');
          const db = getFirestore(app);
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          
          let role = 'rider';
          let userData = { uid: currentUser.uid, email: currentUser.email };

          if (userSnap.exists()) {
            const data = userSnap.data();
            role = data.role || 'rider';
            userData = { ...userData, ...data };
          } else {
            role = currentUser.email?.toLowerCase().includes('admin') ? 'admin' : 'rider';
            userData.role = role;
          }

          setUserRole(role);
          localStorage.setItem('skysure_mock_user', JSON.stringify(userData));
        } catch (err) {
          console.error("Profile sync error:", err);
          setUserRole('rider');
        } finally {
          setLoading(false);
        }
      } else {
        setUserRole(null);
        localStorage.removeItem('skysure_mock_user');
        setLoading(false);
      }
    });

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: 20 }}></div>
          <p style={{ fontWeight: 700, letterSpacing: '0.1em' }}>INITIALIZING SKYSURE PROTOCOL...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={showToast}>
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to={userRole === 'admin' ? '/client/overview' : '/rider'} replace /> : <Login onLoginProp={handleAuthUpdate} />} />
        <Route path="/admin/login" element={<Navigate to="/client/overview" replace />} />
        <Route path="/register" element={<RiderRegistration />} />
        <Route path="/payment" element={<RiderPayment />} />

        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="/client/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="riders" element={<Riders />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="logs" element={<PayoutLogs />} />
        </Route>

        <Route path="/rider" element={user && userRole === 'rider' ? <RiderLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<RiderDashboard />} />
          <Route path="policy" element={<RiderPolicy />} />
          <Route path="payouts" element={<RiderPayouts />} />
          <Route path="status" element={<RiderStatus />} />
          <Route path="profile" element={<RiderProfile />} />
        </Route>

        <Route path="/exit" element={<Exit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastContext.Provider>
  );
}
