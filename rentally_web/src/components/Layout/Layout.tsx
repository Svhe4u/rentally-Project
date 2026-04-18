import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../types';
import { api } from '../../api/api';
import './Layout.css';

interface LayoutProps {
  user: UserProfile | null;
  onLogout: () => void;
  children?: React.ReactNode;
}

export function Layout({ user, onLogout,children  }: LayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    api.setToken(null);
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Хянах самбар', icon: '📊' },
    { path: '/listings', label: 'Байрнууд', icon: '🏠' },
    { path: '/bookings', label: 'Захиалгууд', icon: '📅' },
    { path: '/messages', label: 'Мессеж', icon: '💬' },
    { path: '/profile', label: 'Профайл', icon: '👤' },
  ];

  const getInitials = () => {
    if (!user) return '?';
    return (user.first_name?.[0] || user.username[0])?.toUpperCase();
  };

  return (
    <div className="layout">
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-icon">🏠</span>
            <span className="brand-name">Rentally</span>
          </div>
          <span className="brand-tagline">Зуучлагчийн портал</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-info">
              <span className="user-name">{user?.first_name || user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Гарах
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}  {/* ← change this */}
      </main>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
