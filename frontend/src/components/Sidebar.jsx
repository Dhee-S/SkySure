import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, ScrollText, LogOut, Activity, Globe, Gauge, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const navItems = [
  { path: '/client/overview', label: 'Operations Hub', icon: LayoutDashboard },
  { path: '/client/riders', label: 'Partner Registry', icon: Users },
  { path: '/client/simulation', label: 'Risk Lab', icon: Zap },
  { path: '/client/logs', label: 'Payout Feed', icon: ScrollText },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('skysure_mock_user');
    await signOut(auth);
    navigate('/exit');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <h1>SkySure</h1>
          <span>Enterprise</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-label">Core Console</div>
        <nav className="nav-list">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/client/overview' && location.pathname === '/client');
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <motion.div
                  className="nav-item-content"
                  whileHover={{ x: 4 }}
                >
                  <div className={`nav-icon ${isActive ? 'active' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <span>{item.label}</span>
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="active-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="nav-section">
          <div className="nav-label">System Status</div>
          <div className="status-items">
            <div className="status-item">
              <div className="status-header">
                <span>Global Latency</span>
                <span className="status-badge success">STABLE</span>
              </div>
              <div className="status-bar">
                <div className="status-fill" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="status-item">
              <div className="status-header">
                <span>Actuarial Sync</span>
                <span className="status-badge primary">SYNCED</span>
              </div>
              <div className="status-bar">
                <div className="status-fill primary" style={{ width: '98%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button 
          onClick={() => navigate('/')}
          className="home-btn"
        >
          <div className="home-icon">
            <Home size={18} />
          </div>
          <span>Back to Landing</span>
        </button>
        <button 
          onClick={handleLogout}
          className="logout-btn"
        >
          <div className="user-avatar">
            <span>GC</span>
          </div>
          <div className="user-info">
            <div className="user-name">Admin Console</div>
            <div className="user-role">Parametric Lead</div>
          </div>
          <LogOut size={16} className="logout-icon" />
        </button>
      </div>
    </aside>
  );
}
