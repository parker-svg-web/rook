import React, { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  monthly_fee: number;
  max_apis: number;
  pool_credits: number;
}

interface OnboardingProps {
  plans: Plan[];
  providers: Array<{ slug: string; name: string }>;
  token: string;
  onComplete: () => void;
}

export default function OnboardingPage({ plans, providers, token, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>(plans[0]?.slug || 'starter');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, company_name: company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      localStorage.setItem('rook_token', data.token);
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handlePlanSelect() {
    setLoading(true);
    setError('');
    try {
      const t = localStorage.getItem('rook_token');
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ plan_slug: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function toggleProvider(slug: string) {
    setSelectedProviders(prev =>
      prev.includes(slug) ? prev.filter(p => p !== slug) : [...prev, slug]
    );
  }

  async function handleProvidersComplete() {
    setLoading(true);
    setError('');
    try {
      const t = localStorage.getItem('rook_token');
      for (const slug of selectedProviders) {
        await fetch(`/api/dashboard/link-provider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
          body: JSON.stringify({ provider_slug: slug }),
        });
      }
      onComplete();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const steps = ['Create Account', 'Pick a Plan', 'Connect APIs', 'Done'];
  const plan = plans.find(p => p.slug === selectedPlan);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: '1px solid #e5e7eb', background: '#ffffff',
    color: '#111827', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', marginBottom: 16,
  };
  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: loading ? '#1f2937' : '#000000', color: 'white',
    cursor: loading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 16,
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      {/* Header */}
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#000000' }}>Rook</span>
        <span style={{ marginLeft: 16, color: '#9ca3af', fontSize: 13 }}>Setup Wizard</span>
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= step ? '#000000' : '#f8f9fa',
                border: i <= step ? 'none' : '1px solid #e5e7eb',
                color: i <= step ? 'white' : '#9ca3af',
                fontSize: 13, fontWeight: 600,
              }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: i <= step ? '#1f2937' : '#d1d5db', display: 'none' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}

        {/* Step 1: Register */}
        {step === 0 && (
          <div style={{ background: '#f8f9fa', borderRadius: 16, padding: 40, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Create Your Account</h2>
            <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 14 }}>Start your free trial — no credit card required.</p>
            <input style={inputStyle} type="email" placeholder="Work email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
            <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button style={btnStyle} onClick={handleRegister} disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
          </div>
        )}

        {/* Step 2: Pick a Plan */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Choose Your Plan</h2>
            <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 14 }}>Pick the tier that fits your team. You can upgrade anytime.</p>
            {plans.filter(p => p.slug !== 'enterprise').map(p => (
              <div key={p.slug} onClick={() => setSelectedPlan(p.slug)} style={{
                background: selectedPlan === p.slug ? '#f3f4f6' : '#f8f9fa',
                borderRadius: 12, padding: 24, marginBottom: 12, cursor: 'pointer',
                border: selectedPlan === p.slug ? '2px solid #000000' : '1px solid #e5e7eb',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#111827' }}>{p.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
                      {(p.pool_credits / 1000).toLocaleString()}K credits &middot; Up to {p.max_apis} APIs
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>${p.monthly_fee.toLocaleString()}</span>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>/mo</span>
                  </div>
                </div>
              </div>
            ))}
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={handlePlanSelect} disabled={loading}>
              {loading ? 'Setting up...' : 'Continue with ' + (plan?.name || 'Selected')}
            </button>
          </div>
        )}

        {/* Step 3: Connect APIs */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#111827' }}>Connect Your APIs</h2>
            <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 14 }}>
              Select which API providers to link to your Rook subscription. You can add more later.
            </p>
            {providers.map(p => (
              <div key={p.slug} onClick={() => toggleProvider(p.slug)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: selectedProviders.includes(p.slug) ? '#f3f4f6' : '#f8f9fa',
                borderRadius: 12, padding: 20, marginBottom: 8, cursor: 'pointer',
                border: selectedProviders.includes(p.slug) ? '2px solid #000000' : '1px solid #e5e7eb',
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{p.name}</span>
                  <span style={{ marginLeft: 8, color: '#9ca3af', fontSize: 13 }}>{p.slug}</span>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: selectedProviders.includes(p.slug) ? '#000000' : 'transparent',
                  border: selectedProviders.includes(p.slug) ? 'none' : '2px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, fontWeight: 700,
                }}>{selectedProviders.includes(p.slug) ? '✓' : ''}</div>
              </div>
            ))}
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={handleProvidersComplete} disabled={loading || selectedProviders.length === 0}>
              {loading ? 'Connecting...' : `Connect ${selectedProviders.length} Provider${selectedProviders.length !== 1 ? 's' : ''}`}
            </button>
            {selectedProviders.length === 0 && <p style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 8 }}>Select at least one provider to continue</p>}
          </div>
        )}
      </div>
    </div>
  );
}
