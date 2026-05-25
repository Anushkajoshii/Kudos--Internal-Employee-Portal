import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import KudosForm from '../components/KudosForm';
import KudosFeed from '../components/KudosFeed';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ nav }) {
  const { authFetch } = useAuth();
  const [newKudos, setNewKudos] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    authFetch('/api/notifications').then(r => r.json()).then(d => setUnread(d.unread || 0));
  }, []);

  return (
    <div className="layout">
      <Sidebar nav={nav} unread={unread} />
      <main className="main">
        <div className="page-container">
          <div className="page-header">
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Celebrate your colleagues' contributions</div>
          </div>
          <KudosForm onSuccess={(k) => setNewKudos(k)} />
          <KudosFeed newKudos={newKudos} />
        </div>
      </main>
    </div>
  );
}
