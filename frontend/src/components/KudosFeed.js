import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function KudosFeed({ newKudos }) {
  const { authFetch, user } = useAuth();
  const [kudos, setKudos] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  const fetchKudos = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    const params = new URLSearchParams({ page: p, limit: 20, ...(q && { search: q }) });
    const res = await authFetch(`/api/kudos?${params}`);
    const data = await res.json();
    setKudos(data.kudos || []);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [authFetch]);

  useEffect(() => { fetchKudos(1, search); setPage(1); }, [search]);
  useEffect(() => { fetchKudos(page, search); }, [page]);
  useEffect(() => { if (newKudos) fetchKudos(1, search); }, [newKudos]);

  const handleSearch = (e) => setSearch(e.target.value);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    const res = await authFetch(`/api/reports/${reportModal}/report`, {
      method: 'POST', body: JSON.stringify({ reason: reportReason }),
    });
    const data = await res.json();
    setReportMsg(res.ok ? '✓ Report submitted' : data.error);
    if (res.ok) { setTimeout(() => { setReportModal(null); setReportReason(''); setReportMsg(''); }, 1500); }
  };

  return (
    <div>
      <div className="feed-header">
        <div>
          <div className="feed-title">Recent Kudos</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} total</div>
        </div>
        <div className="search-bar">
          <input className="search-input" placeholder="Search by name…" value={search} onChange={handleSearch} />
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : kudos.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✦</div>
          <p>{search ? 'No kudos match your search.' : 'No kudos yet — be the first!'}</p>
        </div>
      ) : (
        <>
          {kudos.map(k => (
            <div key={k.id} className="kudos-card">
              <div className="kudos-meta">
                <span className="kudos-from">{k.sender_name}</span>
                <span className="kudos-arrow">→</span>
                <span className="kudos-to">{k.recipient_name}</span>
                {k.recipient_department && <span className="kudos-dept">{k.recipient_department}</span>}
              </div>
              <div className="kudos-message">"{k.message}"</div>
              <div className="kudos-footer">
                <span className="kudos-time">{timeAgo(k.created_at)}</span>
                <div className="kudos-actions">
                  {k.sender_id !== user.id && k.recipient_id !== user.id && (
                    <button className="report-btn" onClick={() => setReportModal(k.id)}>⚑ Report</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {pages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > pages) return null;
                return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pages}>›</button>
            </div>
          )}
        </>
      )}

      {reportModal && (
        <div className="modal-overlay" onClick={() => setReportModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Report this kudos</div>
            {reportMsg ? (
              <div className={`alert ${reportMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{reportMsg}</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="form-textarea" value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Describe why this is inappropriate…" rows={3} />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={() => setReportModal(null)}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleReport} disabled={!reportReason.trim()}>Submit Report</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
