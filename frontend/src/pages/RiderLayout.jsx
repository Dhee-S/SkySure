import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dataService } from '../data/dataService';
import {
  Shield, CreditCard, Activity,
  LogOut, ChevronDown, Zap
} from 'lucide-react';

export default function RiderLayout() {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedTier, setSelectedTier] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('skysure_mock_user');
    navigate('/exit');
  };

  useEffect(() => {
    async function load() {
      const data = await dataService.getRiders();
      const ridersList = Array.isArray(data) ? data : [];
      setRiders(ridersList);

      if (ridersList.length > 0) {
        const mockUserStr = localStorage.getItem('skysure_mock_user');
        let initialRider = ridersList[0];

        if (mockUserStr) {
          try {
            const mockUser = JSON.parse(mockUserStr);
            const savedRider = ridersList.find(r => r.id === mockUser.uid || r.rider_id === mockUser.uid);
            if (savedRider) initialRider = savedRider;
          } catch (e) {
            console.error('Failed to parse mock user:', e);
          }
        }

        setSelectedRider(initialRider);
        setSelectedTier('All');
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredRiders = selectedTier === 'All' 
    ? riders 
    : riders.filter(r => (r.tier || '').toLowerCase() === selectedTier.toLowerCase());

  async function handleRiderChange(e) {
    const riderId = e.target.value;
    const rider = riders.find(r => r.id === riderId || r.rider_id === riderId);
    if (rider) {
      setSelectedRider(rider);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
        <div className="sim-launch-icon" style={{ animation: 'spin 1.5s linear infinite', margin: 0, width: '50px', height: '50px' }}><Zap size={24} /></div>
        <span style={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem' }}>Syncing Portal...</span>
      </div>
    );
  }

  if (!selectedRider) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <Shield size={48} color="#94a3b8" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>No Active Enrollment</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '32px' }}>Your account hasn't been provisioned as a partner node yet.</p>
          <button onClick={handleLogout} className="dash-btn dash-btn-primary">Return to Security Login</button>
        </div>
      </div>
    );
  }

  const isProtected = selectedRider.active_policy !== false;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#1e3a8a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, color: 'white', zIndex: 20 }}>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} color="#1e3a8a" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>SkySure</h1>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.5, letterSpacing: '0.1em', margin: '4px 0 0' }}>Partner Portal</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4, letterSpacing: '0.15em', marginBottom: '8px', marginLeft: '4px' }}>My Dashboard</div>
            <RiderNavLink to="/rider" end icon={Shield} label="Policy Control" />
            <RiderNavLink to="/rider/payouts" icon={CreditCard} label="Settlement Audit" />
            <RiderNavLink to="/rider/status" icon={Activity} label="Live Monitoring" />
          </div>

          <div style={{ marginTop: '40px' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.4, letterSpacing: '0.15em', marginBottom: '12px', marginLeft: '4px' }}>Active Rider Identity</div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>RID-{selectedRider.id?.slice(-8).toUpperCase() || 'RDR-99'}</div>
              <div style={{ fontSize: '0.55rem', color: isProtected ? '#10b981' : '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isProtected ? '#10b981' : '#94a3b8' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{isProtected ? 'Rider Protected' : 'Telemetry Syncing'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '24px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '8px', background: '#3b82f6', borderRadius: '8px' }}><Zap size={14} color="white" /></div>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Actuarial Tier</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.01em' }}>{selectedRider.tier || 'Standard'} Plan</div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '12px', 
              color: 'rgba(255,255,255,0.6)', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: '0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, marginLeft: '280px', padding: '40px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet context={{ rider: selectedRider, weather: { severity: 'SECURE', temperatureC: 28, rainfallMm: 0, windKph: 12, humidity: 65, visibility: 10, description: 'Clear Skies' }, isProtected }} />
        </div>
      </main>
    </div>
  );
}

function RiderNavLink({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        textDecoration: 'none',
        transition: '0.2s',
        fontWeight: 700,
        fontSize: '0.85rem',
        background: isActive ? 'white' : 'transparent',
        color: isActive ? '#1e3a8a' : 'rgba(255,255,255,0.6)'
      })}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}