import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Circle, CloudUpload, Video,
  BarChart2, Crosshair, FileText, Users, Plus, LogOut, Clapperboard
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
  { to: '/highlights',   icon: Clapperboard,    label: 'Highlights'      },
  { to: '/players',       icon: Users,           label: 'Players'         },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user
    ? (user.name || user.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className={`sidebar flex flex-col ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="sidebar-brand-icon flex items-center justify-center">F</div>
          <div>
            <div className="sidebar-brand-name">Futsal Analyst</div>
            <div className="sidebar-brand-sub">Elite Tactical Suite</div>
          </div>
        </div>
      </div>

      <div className="sidebar-cta">
        <button
          className="btn-primary w-full justify-center text-[13px]"
          onClick={() => { navigate('/matches?newMatch=1'); onClose?.(); }}
        >
          <Plus size={15} /> New Match
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to} onClick={() => onClose?.()}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={17} className="shrink-0" /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="nav-user w-full cursor-pointer border-none bg-accent-bg">
          <div className="nav-user-avatar flex items-center justify-center">{initials}</div>
          <div className="min-w-0 flex-1 text-left">
            <div className="nav-user-name">{user?.name || user?.email || 'Analyst'}</div>
            <div className="nav-user-role">Head Analyst</div>
          </div>
          <LogOut size={15} className="text-muted shrink-0" />
        </button>
      </div>
    </aside>
  );
}
