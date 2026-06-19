import React, { useState } from 'react';
import RookLogoText from '../components/RookLogoText';

interface Props {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string, company: string) => Promise<string | null>;
  error: string;
}

const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .auth-card { animation: fadeInUp 0.5s ease-out; }
  .auth-input { transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .auth-input:focus { border-color: #ffffff !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.08) !important; outline: none !important; }
  .auth-btn { transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); cursor: pointer; }
  .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(255,255,255,0.08); background: #e0e0e0 !important; }
  .auth-btn:active { transform: translateY(0); }
`;

export default function LoginPage({ onLogin, onRegister, error }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || error;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    const err = isRegister
      ? await onRegister(email, password, company)
      : await onLogin(email, password);
    if (err) setLocalError(err);
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <style>{styles}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div className="auth-card" style={{
        background: '#1a1a1a',
        borderRadius: 20,
        padding: 48,
        width: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        border: '1px solid #2a2a2a',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <RookLogoText size={32} />
          </div>
          <p style={{ color: '#666666', marginTop: 0, fontSize: 14, fontWeight: 400 }}>
            Telecom for your APIs
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="auth-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #2a2a2a',
                background: '#0a0a0a',
                color: '#ffffff',
                fontSize: 14,
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
              placeholder="you@company.com"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="auth-input"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #2a2a2a',
                background: '#0a0a0a',
                color: '#ffffff',
                fontSize: 14,
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#a0a0a0', marginBottom: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                required
                className="auth-input"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid #2a2a2a',
                  background: '#0a0a0a',
                  color: '#ffffff',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="Acme Corp"
              />
            </div>
          )}

          {displayError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>{displayError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#ffffff',
              color: '#0a0a0a',
              fontSize: 15,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
              letterSpacing: '0.01em',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setLocalError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#666666',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#ffffff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#666666'}
          >
            {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}
