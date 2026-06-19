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
      setStep(1);
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
      onComplete();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const steps = ['Create Account', 'Pick a Plan', 'Done'];
  const plan = plans.find(p => p.slug === selectedPlan);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 10,
    border: '1px solid #2a2a2a', background: '#0a0a0a',
    color: '#ffffff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', marginBottom: 16,
    transition: 'border-color 0.3s ease',
  };
  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: '#ffffff', color: '#0a0a0a',
    cursor: 'pointer', fontWeight: 600, fontSize: 16,
    opacity: 1, transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Inter, system-ui, sans-serif', color: '#ffffff' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      {/* Header */}
      <div style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#ffffff' }}>Rook</span>
        <span style={{ color: '#666666', fontSize: 13 }}>Setup</span>
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= step ? '#ffffff' : '#1a1a1a',
                border: i <= step ? 'none' : '1px solid #2a2a2a',
                color: i <= step ? '#0a0a0a' : '#666666',
                fontSize: 13, fontWeight: 600,
              }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: i <= step ? '#ffffff' : '#2a2a2a', display: 'none' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16, color: '#ef4444', fontSize: 13 }}>{error}</div>}

        {/* Step 0: Register */}
        {step === 0 && (
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 40, border: '1px solid #2a2a2a' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Create Your Account</h2>
            <p style={{ color: '#a0a0a0', marginBottom: 32, fontSize: 14 }}>One API key for all your providers. One predictable bill.</p>
            <input style={inputStyle} type="email" placeholder="Work email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inputStyle} type="text" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
            <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button style={btnStyle} onClick={handleRegister} disabled={loading}
              onMouseEnter={e => { if (!loading) { (e.target as HTMLElement).style.background = '#e0e0e0'; (e.target as HTMLElement).style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#ffffff'; (e.target as HTMLElement).style.transform = ''; }}
            >{loading ? 'Creating account...' : 'Create Account'}</button>
          </div>
        )}

        {/* Step 1: Pick a Plan */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Choose Your Plan</h2>
            <p style={{ color: '#a0a0a0', marginBottom: 32, fontSize: 14 }}>Pick the tier that fits your team. All plans include access to OpenAI, Twilio, SendGrid, and more.</p>
            {plans.filter(p => p.slug !== 'enterprise').map(p => (
              <div key={p.slug} onClick={() => setSelectedPlan(p.slug)} style={{
                background: selectedPlan === p.slug ? '#222222' : '#1a1a1a',
                borderRadius: 12, padding: 24, marginBottom: 12, cursor: 'pointer',
                border: selectedPlan === p.slug ? '2px solid #ffffff' : '1px solid #2a2a2a',
                transition: 'all 0.3s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#ffffff' }}>{p.name}</h3>
                    <p style={{ color: '#a0a0a0', fontSize: 13, margin: '4px 0 0' }}>
                      {(p.pool_credits / 1000).toLocaleString()}K shared credits &middot; Up to {p.max_apis} providers
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#ffffff' }}>${p.monthly_fee.toLocaleString()}</span>
                    <span style={{ color: '#666666', fontSize: 14 }}>/mo</span>
                  </div>
                </div>
              </div>
            ))}
            <button style={{ ...btnStyle, marginTop: 16 }} onClick={handlePlanSelect} disabled={loading}>{loading ? 'Setting up...' : 'Continue with ' + (plan?.name || 'Selected')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
