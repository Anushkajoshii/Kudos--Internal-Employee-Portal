import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function KudosForm({ onSuccess }) {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  const charCount = message.length;
  const charClass = charCount > 480 ? 'error' : charCount > 400 ? 'warning' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientId || !message.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authFetch('/api/kudos', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: recipientId, message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Kudos sent to ${data.recipient_name}! 🎉`);
      setRecipientId(''); setMessage('');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kudos-form-card">
      <div className="kudos-form-title">✦ Send Kudos</div>
      {success && <div className="alert alert-success">✓ {success}</div>}
      {error && <div className="alert alert-error">⚠ {error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Recognise a colleague</label>
          <select className="form-select" value={recipientId} onChange={e => setRecipientId(e.target.value)} required>
            <option value="">Select a colleague…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.department}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Your message</label>
          <textarea
            className="form-textarea"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="What did they do that made a difference? Be specific — it means more."
            maxLength={500}
            required
          />
          <div className={`char-count ${charClass}`}>{charCount} / 500</div>
        </div>
        <button className="btn btn-primary btn-full" type="submit" disabled={loading || !recipientId || !message.trim()}>
          {loading ? 'Sending…' : 'Send Kudos →'}
        </button>
      </form>
    </div>
  );
}
