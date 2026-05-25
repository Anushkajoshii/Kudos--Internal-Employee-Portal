import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './styles.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">✦</div>
      <div className="splash-text">Kudos</div>
    </div>
  );

  if (!user) return <LoginPage />;

  const nav = { page, setPage };
  if (page === 'profile') return <ProfilePage nav={nav} />;
  if (page === 'admin' && user.role === 'admin') return <AdminPage nav={nav} />;
  return <Dashboard nav={nav} />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
