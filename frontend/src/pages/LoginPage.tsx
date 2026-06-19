import React, { useState } from 'react';
import RookLogoText from '../components/RookLogoText';

interface Props {
  onLogin: (email: string, password: string) => Promise<string | null>;
  onRegister: (email: string, password: string, company: string) => Promise<string | null>;
  error: string;
}

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
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: 48,
        width: 400,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <RookLogoText size={28} />
          </div>
          <p style={{ color: '#9ca3af', marginTop: 8, fontSize: 14 }}>
            Telecom for your APIs
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#1f2937', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111827',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#000000'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
              placeholder="you@company.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#1f2937', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111827',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#000000'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#1f2937', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#111827',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => e.target.style.borderColor = '#000000'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                placeholder="Acme Corp"
              />
            </div>
          )}

          {displayError && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, marginTop: 0 }}>
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#1f2937' : '#000000',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => { setIsRegister(!isRegister); setLocalError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#000000',
              cursor: 'pointer',
              fontSize: 13,
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}
