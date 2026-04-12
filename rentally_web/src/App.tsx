import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { UserProfile } from './types';
import { api, AuthAPI } from './api/api';
import { useToast } from './hooks';

// Components
import { ToastContainer } from './components/Toast';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Listings } from './pages/Listings';
import { Profile } from './pages/Profile';

import './index.css';

// Placeholder pages (to be implemented)
function Bookings() {
  return (
    <div className="page-placeholder">
      <h1>Bookings</h1>
      <p>Booking management coming soon...</p>
    </div>
  );
}

function Messages() {
  return (
    <div className="page-placeholder">
      <h1>Messages</h1>
      <p>Message center coming soon...</p>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUser = async () => {
    try {
      const profile = await AuthAPI.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      api.setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route
                    path="/listings"
                    element={<Listings onSuccess={success} onError={error} />}
                  />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route
                    path="/profile"
                    element={<Profile onSuccess={success} onError={error} />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
