import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  const initials = user
    ? (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onMenuToggle} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <Menu size={22} />
        </button>
        <span className="topbar-title">Futsal Analyst</span>
      </div>

      <div className="topbar-actions">
        <button className="topbar-bell">
          <Bell size={18} />
          <span className="topbar-bell-dot" />
        </button>
        <button
          onClick={logout}
          title="Logout"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 8, display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={18} />
        </button>
        <div className="nav-user-avatar">{initials}</div>
      </div>
    </header>
  );
}
