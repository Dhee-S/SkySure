import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { seedSampleRiders } from './mockStore';
import ClientLayout from './pages/ClientLayout';
import Overview from './pages/Overview';
import Riders from './pages/RidersManagement';
import Simulation from './pages/Simulation';
import PayoutLogs from './pages/PayoutLogs';

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <ToastIcon type={toast.type} />
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => dismissToast(toast.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }) {
  if (type === 'success') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
  );
  if (type === 'danger') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  );
  if (type === 'warning') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  );
}

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      <div className="landing-bg"></div>
      <div className="landing-content">
        <div className="landing-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Parametric Insurance Platform
        </div>
        <h1 className="landing-title">SkySure</h1>
        <p className="landing-tagline">Zero-touch parametric insurance for gig workers powered by AI-driven weather disruption detection.</p>

        <div className="landing-portals" style={{ justifyContent: 'center' }}>
          <a href="#" className="portal-card" onClick={(e) => { e.preventDefault(); navigate('/client/overview'); }}>
            <div className="portal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h3>Client Company</h3>
            <p>Manage riders, run AI simulations, and monitor payout events</p>
            <div className="portal-arrow">
              Open Dashboard
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          </a>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            Auto-payouts
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.94"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.94"/></svg>
            </div>
            AI Fraud Detection
          </div>
          <div className="landing-feature">
            <div className="landing-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            Predictive Analytics
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedSampleRiders().then(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-bg"></div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 12px' }}></div>
          Loading SkySure...
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Navigate to="overview" />} />
          <Route path="overview" element={<Overview />} />
          <Route path="riders" element={<Riders />} />
          <Route path="simulation" element={<Simulation />} />
          <Route path="logs" element={<PayoutLogs />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ToastProvider>
  );
}
