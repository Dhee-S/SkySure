import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Landing from './pages/Landing';
import Login from './pages/Login';
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
import Exit from './pages/Exit';
import RiderRegistration from './components/RiderRegistration';
import RiderPayment from './pages/RiderPayment';
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
    const mockUser = localStorage.getItem('skysure_mock_user');
    if (mockUser) {
      const parsed = JSON.parse(mockUser);
      setUser(parsed);
      setUserRole(parsed.email.includes('admin') ? 'admin' : 'rider');
      setLoading(false);
      return true;
    }
    return false;
  };

  useEffect(() => {
    // 1. Check for mock session
    const hasMock = handleAuthUpdate();

    // 2. Listen for Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Only use Firebase if no Mock user is active
      if (!localStorage.getItem('skysure_mock_user')) {
        setUser(currentUser);
        if (currentUser) {
          const email = currentUser.email?.toLowerCase() || '';
          setUserRole(email.includes('admin') ? 'admin' : 'rider');
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    });

    // 3. Fallback to end loading if nothing found
    if (!hasMock && !auth.currentUser) {
       // Give Firebase a small window to initialize
       setTimeout(() => setLoading(false), 1000);
    }

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen" style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: 20 }}></div>
          <p>Initializing SkySure Engine...</p>
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
        <Route path="/register" element={<RiderRegistration />} />
        <Route path="/payment" element={<RiderPayment />} />

        <Route path="/client" element={user && userRole === 'admin' ? <ClientLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/client/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="riders" element={<Riders />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="logs" element={<PayoutLogs />} />
        </Route>

        <Route path="/rider" element={user && userRole === 'rider' ? <RiderLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<RiderDashboard />} />
          <Route path="payouts" element={<RiderPayouts />} />
          <Route path="status" element={<RiderStatus />} />
        </Route>

        <Route path="/exit" element={<Exit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastContext.Provider>
  );
}
