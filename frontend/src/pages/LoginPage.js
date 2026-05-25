import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { email: 'alice@company.com', role: 'admin', name: 'Alice (Admin)' },
  { email: 'bob@company.com', role: 'user', name: 'Bob' },
  { email: 'carol@company.com', role: 'user', name: 'Carol' },
  { email: 'david@company.com', role: 'user', name: 'David' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>✦ Kudos</h1>
          <p>Celebrate the people who make work wonderful</p>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="login-divider">
          <hr /><span>Try a demo account</span><hr />
        </div>

        <div className="demo-accounts">
          <p>Click to fill credentials (password: password123)</p>
          {DEMO_ACCOUNTS.map(acc => (
            <div key={acc.email} className="demo-item" onClick={() => fillDemo(acc)}>
              <span className="demo-email">{acc.name}</span>
              <span className="demo-role">{acc.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
