import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Circle, CloudUpload, Video,
  BarChart2, Crosshair, FileText, Users, Plus, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/matches',       icon: Circle,          label: 'Matches'         },
  { to: '/video-upload',  icon: CloudUpload,     label: 'Video Upload'    },
  { to: '/live-tagging',  icon: Video,           label: 'Live Tagging'    },
  { to: '/statistics',    icon: BarChart2,       label: 'Statistics'      },
  { to: '/tactical-board',icon: Crosshair,       label: 'Tactical Board'  },
  { to: '/reports',       icon: FileText,        label: 'Reports'         },
  { to: '/players',       icon: Users,           label: 'Players'         },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user
    ? (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleNavClick = () => { onClose?.(); };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div className="sidebar-brand-icon">F</div>
          <div>
            <div className="sidebar-brand-name">Futsal Analyst</div>
            <div className="sidebar-brand-sub">Elite Tactical Suite</div>
          </div>
        </div>
      </div>

      <div className="sidebar-cta">
        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          onClick={() => navigate('/matches?newMatch=1')}
        >
          <Plus size={15} /> New Match
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to} onClick={handleNavClick}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} style={{ flexShrink: 0 }} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-user" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <div className="nav-user-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="nav-user-name">{user?.name || user?.email || 'Analyst'}</div>
            <div className="nav-user-role">Head Analyst</div>
          </div>
          <LogOut size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
