import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ nav, unread = 0 }) {
  const { user, logout } = useAuth();
  const { page, setPage } = nav;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'dashboard', icon: '◈', label: 'Feed' },
    { id: 'profile', icon: '◉', label: 'My Profile' },
    ...(user?.role === 'admin' ? [{ id: 'admin', icon: '⬡', label: 'Admin' }] : []),
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>✦ Kudos</h1>
        <p>Datacom Internal</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.id === 'profile' && unread > 0 && (
              <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.department}</div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign out">↩</button>
      </div>
    </aside>
  );
}
