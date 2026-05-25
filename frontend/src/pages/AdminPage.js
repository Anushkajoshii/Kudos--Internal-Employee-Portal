import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

function timeAgo(d) {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AdminPage({ nav }) {
  const { authFetch } = useAuth();
  const [kudos, setKudos] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('kudos');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');

  const fetchKudos = async () => {
    setLoading(true);
    const res = await authFetch(`/api/moderation/queue?status=${filter}&limit=50`);
    const data = await res.json();
    setKudos(data.kudos || []);
    setLoading(false);
  };

  const fetchReports = async () => {
    const res = await authFetch('/api/reports');
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchKudos(); }, [filter]);
  useEffect(() => { if (tab === 'reports') fetchReports(); }, [tab]);

  const doAction = async (action, id) => {
    let res;
    if (action === 'hide') {
      res = await authFetch(`/api/moderation/${id}/hide`, { method: 'POST', body: JSON.stringify({ reason }) });
    } else if (action === 'restore') {
      res = await authFetch(`/api/moderation/${id}/restore`, { method: 'POST' });
    } else if (action === 'delete') {
      res = await authFetch(`/api/moderation/${id}`, { method: 'DELETE' });
    } else if (action === 'resolve') {
      res = await authFetch(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'resolved' }) });
    } else if (action === 'dismiss') {
      res = await authFetch(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'dismissed' }) });
    }
    const data = await res.json();
    if (res.ok) {
      setMsg('✓ ' + (data.message || 'Action completed'));
      setActionModal(null); setReason('');
      if (tab === 'kudos') fetchKudos(); else fetchReports();
    } else {
      setMsg('⚠ ' + data.error);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="layout">
      <Sidebar nav={nav} />
      <main className="main">
        <div className="page-container">
          <div className="page-header">
            <div className="page-title">Admin Panel</div>
            <div className="page-subtitle">Content moderation and reporting tools</div>
          </div>

          {msg && <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

          <div className="tabs">
            <button className={`tab-btn ${tab === 'kudos' ? 'active' : ''}`} onClick={() => setTab('kudos')}>All Kudos</button>
            <button className={`tab-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
              Reports {pendingReports > 0 && <span className="notif-badge">{pendingReports}</span>}
            </button>
          </div>

          {tab === 'kudos' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['all', 'visible', 'hidden'].map(f => (
                  <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {loading ? <div className="spinner" /> : kudos.length === 0 ? (
                <div className="empty-state"><div className="icon">✦</div><p>No kudos found.</p></div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>From → To</th>
                        <th>Message</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kudos.map(k => (
                        <tr key={k.id}>
                          <td style={{ whiteSpace: 'nowrap' }}><strong>{k.sender_name}</strong> → {k.recipient_name}</td>
                          <td><div className="table-message" title={k.message}>{k.message}</div></td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{timeAgo(k.created_at)}</td>
                          <td>
                            <span className={`status-badge ${k.is_visible ? 'badge-visible' : 'badge-hidden'}`}>
                              {k.is_visible ? '● Visible' : '○ Hidden'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {k.is_visible ? (
                                <button className="btn btn-sm btn-danger" onClick={() => setActionModal({ type: 'hide', id: k.id })}>Hide</button>
                              ) : (
                                <button className="btn btn-sm btn-success" onClick={() => doAction('restore', k.id)}>Restore</button>
                              )}
                              <button className="btn btn-sm btn-danger" onClick={() => setActionModal({ type: 'delete', id: k.id })}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'reports' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {reports.length === 0 ? (
                <div className="empty-state"><div className="icon">✦</div><p>No reports.</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Reporter</th><th>Reason</th><th>Kudos</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td>{r.reporter_name}</td>
                        <td><div className="table-message" title={r.reason}>{r.reason}</div></td>
                        <td><div className="table-message" title={r.kudos_message} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{r.kudos_message}"</div></td>
                        <td>
                          <span className={`status-badge ${r.status === 'pending' ? 'badge-pending' : r.status === 'resolved' ? 'badge-visible' : 'badge-hidden'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-sm btn-success" onClick={() => doAction('resolve', r.id)}>Resolve</button>
                              <button className="btn btn-sm btn-outline" onClick={() => doAction('dismiss', r.id)}>Dismiss</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {actionModal.type === 'delete' ? '⚠ Permanently Delete?' : 'Hide Kudos'}
            </div>
            {actionModal.type === 'delete' ? (
              <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>This action cannot be undone. The kudos and all associated reports will be permanently removed.</p>
            ) : (
              <div className="form-group">
                <label className="form-label">Reason (optional)</label>
                <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Inappropriate content…" />
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setActionModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => doAction(actionModal.type, actionModal.id)}>
                {actionModal.type === 'delete' ? 'Delete permanently' : 'Hide kudos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
