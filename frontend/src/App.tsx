import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';

const API_BASE = '/api';

export interface DashboardData {
  user: { id: string; email: string; company_name: string };
  subscription: {
    id: string; status: string; plan_name: string; plan_slug: string;
    monthly_fee: number; max_apis: number;
    credits_pool_total: number; credits_pool_used: number;
    credits_available: number; utilization_pct: number;
    billing_cycle_start: string | null; billing_cycle_end: string | null;
    auto_refill: boolean; refill_threshold: number;
  };
  apis: Array<{
    provider_id: string; provider_name: string; provider_slug: string;
    api_key_label: string | null; allocated_credits: number;
    credits_used: number; utilization_pct: number;
  }>;
  recent_usage: Array<{ date: string; provider_name: string; credits_used: number }>;
  alerts: Array<any>;
}

type Page = 'landing' | 'login' | 'register' | 'onboarding' | 'dashboard';

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [token, setToken] = useState<string | null>(localStorage.getItem('rook_token'));
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('rook_token', token);
      fetchData(token);
    } else {
      localStorage.removeItem('rook_token');
      setDashboard(null);
    }
  }, [token]);

  async function fetchData(t: string) {
    try {
      const [dashRes, plansRes, provRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_BASE}/admin/plans`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_BASE}/providers`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);
      if (!dashRes.ok) throw new Error('Session expired');
      setDashboard(await dashRes.json());
      try { setPlans((await plansRes.json()).plans || []); } catch {}
      try { setProviders((await provRes.json()).providers || []); } catch {}
      setPage('dashboard');
      setError('');
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setToken(null);
    }
  }

  async function handleLogin(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      return null;
    } catch (e: any) { return e.message; }
  }

  async function handleRegister(email: string, password: string, company: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, company_name: company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setToken(data.token);
      // Fetch plans/providers for onboarding
      const [p, pr] = await Promise.all([
        fetch(`${API_BASE}/admin/plans`, { headers: { Authorization: `Bearer ${data.token}` } }).then(r => r.json()),
        fetch(`${API_BASE}/providers`, { headers: { Authorization: `Bearer ${data.token}` } }).then(r => r.json()),
      ]);
      setPlans(p.plans || []);
      setProviders(pr.providers || []);
      setPage('onboarding');
      return null;
    } catch (e: any) { return e.message; }
  }

  function handleLogout() {
    setToken(null);
    setDashboard(null);
    setPage('landing');
  }

  function goToLogin() { setPage('login'); }
  function goToRegister() {
    setPage('register');
  }
  function goToOnboarding() {
    setPage('register');
  }

  if (page === 'landing' && !token) {
    return <LandingPage onGetStarted={goToOnboarding} onSignIn={goToLogin} />;
  }

  if ((page === 'login' || page === 'register') && !token) {
    return <LoginPage
      onLogin={handleLogin}
      onRegister={page === 'register' ? handleRegister : async () => null}
      error={error}
    />;
  }

  if (page === 'onboarding' && token && dashboard === null) {
    return <OnboardingPage
      plans={plans}
      providers={providers}
      token={token}
      onComplete={() => {
        if (token) fetchData(token);
      }}
    />;
  }

  if (!token) {
    return <LandingPage onGetStarted={goToRegister} onSignIn={goToLogin} />;
  }

  if (!dashboard) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#94a3b8' }}>
        <div>
          <h2 style={{ color: '#38bdf8' }}>Loading Rook...</h2>
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return <DashboardPage data={dashboard} onLogout={handleLogout} />;
}