import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  const initials = user
    ? (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="topbar flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="md:hidden p-1 text-muted cursor-pointer rounded hover:text-secondary">
          <Menu size={22} />
        </button>
        <span className="topbar-title">Futsal Analyst</span>
      </div>

      <div className="topbar-actions">
        <button className="topbar-bell flex items-center">
          <Bell size={18} />
          <span className="topbar-bell-dot" />
        </button>
        <button
          onClick={logout}
          title="Logout"
          className="p-1.5 rounded-lg text-muted cursor-pointer flex items-center hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
        </button>
        <div className="nav-user-avatar flex items-center justify-center">{initials}</div>
      </div>
    </header>
  );
}
