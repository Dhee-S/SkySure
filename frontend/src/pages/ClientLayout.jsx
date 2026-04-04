import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, Command, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useToast } from '../App';

export default function ClientLayout() {
  const navigate = useNavigate();
  const showToast = useToast();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('skysure_mock_user');
      await signOut(auth);
      navigate('/');
    } catch (error) {
      showToast('Error logging out', 'error');
    }
  };

  return (
    <div className="client-layout">
      <Sidebar />
      <main className="client-main">
        {/* Global Utility Bar */}
        <div className="client-toolbar">
          <div className="toolbar-left">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dash-muted)' }}>Risk Lab / Resilience Monitor</h2>
          </div>
          
          <div className="toolbar-actions">
            {/* Icons removed as per user request */}
          </div>
        </div>

        <div className="client-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
