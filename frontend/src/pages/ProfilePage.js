import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

function timeAgo(d) {
  const diff = Date.now() - new Date(d);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ProfilePage({ nav }) {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState({ received: 0, sent: 0, thisMonth: 0 });
  const [kudos, setKudos] = useState([]);
  const [tab, setTab] = useState('received');
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [view, setView] = useState('kudos');

  useEffect(() => {
    authFetch(`/api/users/${user.id}/statistics`).then(r => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    authFetch(`/api/users/${user.id}/kudos?type=${tab}`).then(r => r.json()).then(setKudos);
  }, [tab]);

  useEffect(() => {
    authFetch('/api/notifications').then(r => r.json()).then(d => {
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
    });
  }, []);

  const markAllRead = async () => {
    await authFetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
    setUnread(0);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      <Sidebar nav={nav} unread={unread} />
      <main className="main">
        <div className="page-container">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--brown-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>{initials}</div>
              <div>
                <div className="page-title">{user?.name}</div>
                <div className="page-subtitle">{user?.department} · {user?.employee_id}</div>
              </div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{stats.received}</div>
              <div className="stat-label">Kudos Received</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.sent}</div>
              <div className="stat-label">Kudos Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.thisMonth}</div>
              <div className="stat-label">This Month</div>
            </div>
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('notifs')}>
              <div className="stat-number" style={{ color: unread > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{unread}</div>
              <div className="stat-label">Unread Notifs</div>
            </div>
          </div>

          <div className="tabs">
            <button className={`tab-btn ${view === 'kudos' ? 'active' : ''}`} onClick={() => setView('kudos')}>Kudos History</button>
            <button className={`tab-btn ${view === 'notifs' ? 'active' : ''}`} onClick={() => setView('notifs')}>
              Notifications {unread > 0 && <span className="notif-badge" style={{ marginLeft: 6 }}>{unread}</span>}
            </button>
          </div>

          {view === 'kudos' && (
            <>
              <div className="tabs">
                <button className={`tab-btn ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>Received ({stats.received})</button>
                <button className={`tab-btn ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>Sent ({stats.sent})</button>
              </div>
              {kudos.length === 0 ? (
                <div className="empty-state"><div className="icon">✦</div><p>No kudos {tab} yet.</p></div>
              ) : kudos.map(k => (
                <div key={k.id} className="kudos-card">
                  <div className="kudos-meta">
                    <span className="kudos-from" style={{ color: tab === 'sent' ? 'var(--accent)' : 'var(--brown)' }}>
                      {tab === 'received' ? `From ${k.sender_name}` : `To ${k.recipient_name}`}
                    </span>
                    {(k.sender_department || k.recipient_department) && (
                      <span className="kudos-dept">{k.sender_department || k.recipient_department}</span>
                    )}
                  </div>
                  <div className="kudos-message">"{k.message}"</div>
                  <div className="kudos-footer"><span className="kudos-time">{timeAgo(k.created_at)}</span></div>
                </div>
              ))}
            </>
          )}

          {view === 'notifs' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 0 }}>Notifications</div>
                {unread > 0 && <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>}
              </div>
              {notifs.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px' }}><p>No notifications yet.</p></div>
              ) : (
                <div className="notif-list">
                  {notifs.map(n => (
                    <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                      {!n.is_read && <div className="notif-dot" />}
                      <div className="notif-content">
                        <div className="notif-text"><strong>{n.sender_name}</strong> gave you kudos</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0', fontStyle: 'italic' }}>"{n.kudos_message?.slice(0, 80)}{n.kudos_message?.length > 80 ? '…' : ''}"</div>
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
