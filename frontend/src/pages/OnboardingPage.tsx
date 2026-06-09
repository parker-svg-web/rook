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
      setStep(2); // Go to plan selection
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
      setStep(3); // Go to provider selection
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
      // Link selected providers to the subscription
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
    border: '1px solid #334155', background: '#0f172a',
    color: '#f1f5f9', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', marginBottom: 16,
  };
  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: loading ? '#1d4ed8' : '#2563eb', color: 'white',
    cursor: loading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 16,
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui, sans-serif', color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 32px' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8' }}>Rook</span>
        <span style={{ marginLeft: 16, color: '#64748b', fontSize: 13 }}>Setup Wizard</span>
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= step ? '#2563eb' : '#1e293b',
                border: i <= step ? 'none' : '1px solid #334155',
                color: i <= step ? 'white' : '#64748b',
                fontSize: 13, fontWeight: 600,
              }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: i <= step ? '#e2e8f0' : '#475569', display: 'none' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        {error && <div style={{ background: '#7f1d1d', border: '1px solid #dc2626', borderRadius: 8, padding: 12, marginBottom: 16, color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        {/* Step 1: Register */}
        {step === 0 && (
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, border: '1px solid #334155' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Create Your Account</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Start your free trial — no credit card required.</p>
            <input style={inputStyle} type="email" placeholder="Work email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
            <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button style={btnStyle} onClick={handleRegister} disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
          </div>
        )}

        {/* Step 2: Pick a Plan */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Choose Your Plan</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Pick the tier that fits your team. You can upgrade anytime.</p>
            {plans.filter(p => p.slug !== 'enterprise').map(p => (
              <div key={p.slug} onClick={() => setSelectedPlan(p.slug)} style={{
                background: selectedPlan === p.slug ? '#1e3a5f' : '#1e293b',
                borderRadius: 12, padding: 24, marginBottom: 12, cursor: 'pointer',
                border: selectedPlan === p.slug ? '2px solid #2563eb' : '1px solid #334155',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{p.name}</h3>
                    <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
                      {(p.pool_credits / 1000).toLocaleString()}K credits &middot; Up to {p.max_apis} APIs
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>${p.monthly_fee.toLocaleString()}</span>
                    <span style={{ color: '#64748b', fontSize: 14 }}>/mo</span>
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
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Connect Your APIs</h2>
            <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>
              Select which API providers to link to your Rook subscription. You can add more later.
            </p>
            {providers.map(p => (
              <div key={p.slug} onClick={() => toggleProvider(p.slug)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: selectedProviders.includes(p.slug) ? '#1e3a5f' : '#1e293b',
                borderRadius: 12, padding: 20, marginBottom: 8, cursor: 'pointer',
                border: selectedProviders.includes(p.slug) ? '2px solid #2563eb' : '1px solid #334155',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ marginLeft: 8, color: '#64748b', fontSize: 13 }}>{p.slug}</span>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: selectedProviders.includes(p.slug) ? '#2563eb' : 'transparent',
                  border: selectedProviders.includes(p.slug) ? 'none' : '2px solid #475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, fontWeight: 700,
                }}>{selectedProviders.includes(p.slug) ? '✓' : ''}</div>
              </div>
            ))}
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={handleProvidersComplete} disabled={loading || selectedProviders.length === 0}>
              {loading ? 'Connecting...' : `Connect ${selectedProviders.length} Provider${selectedProviders.length !== 1 ? 's' : ''}`}
            </button>
            {selectedProviders.length === 0 && <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 }}>Select at least one provider to continue</p>}
          </div>
        )}
      </div>
    </div>
  );
}