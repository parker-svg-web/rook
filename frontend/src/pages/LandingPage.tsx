import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-section { animation: fadeInUp 0.8s ease-out; }
  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); border-color: #111 !important; }
  .btn-primary { transition: all 0.2s ease; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  .btn-ghost { transition: all 0.2s ease; }
  .btn-ghost:hover { border-color: #111 !important; color: #111 !important; }
  .pricing-card { transition: all 0.3s ease; }
  .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
  .popular-card { transition: all 0.3s ease; box-shadow: 0 0 30px rgba(0,0,0,0.08); }
  .popular-card:hover { transform: translateY(-4px); box-shadow: 0 0 50px rgba(0,0,0,0.15); }
`;

function RookLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="3" width="16" height="3" rx="0.5" fill="#111" />
      <rect x="5" y="6" width="6" height="4" rx="1" fill="#111" />
      <rect x="13" y="6" width="6" height="4" rx="1" fill="#111" />
      <path d="M4 10h16v2H4z" fill="#111" />
      <path d="M3 12h18v1H3z" fill="#111" />
      <rect x="6" y="13" width="12" height="8" rx="1.5" fill="#111" />
      <rect x="9" y="15" width="6" height="3" rx="0.5" fill="white" />
    </svg>
  );
}

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', color: '#111', background: '#ffffff', minHeight: '100vh' }}>
      <style>{styles}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RookLogo size={28} />
          <span style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.5px' }}>Rook</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="#features" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease' }} onMouseEnter={e => (e.target as HTMLElement).style.color = '#111'} onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}>Features</a>
          <a href="#pricing" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s ease' }} onMouseEnter={e => (e.target as HTMLElement).style.color = '#111'} onMouseLeave={e => (e.target as HTMLElement).style.color = '#64748b'}>Pricing</a>
          <button onClick={onSignIn} className="btn-ghost" style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 20px', color: '#333', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Sign In</button>
          <button onClick={onGetStarted} className="btn-primary" style={{ background: '#111', border: 'none', borderRadius: 8, padding: '8px 20px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px 0', color: '#111', letterSpacing: '-1.5px' }}>
          Telecom for<br />Your APIs
        </h1>
        <p style={{ fontSize: 20, color: '#64748b', maxWidth: 650, margin: '0 auto 40px', lineHeight: 1.6 }}>
          You don't manage separate data plans for every carrier. Why manage separate API accounts? Rook bundles OpenAI, Twilio, Stripe, and more into one predictable monthly subscription.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={onGetStarted} className="btn-primary" style={{ background: '#111', border: 'none', borderRadius: 12, padding: '16px 40px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 18 }}>
            Start Free Trial
          </button>
          <a href="#pricing" className="btn-ghost" style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 12, padding: '16px 40px', color: '#333', cursor: 'pointer', fontWeight: 500, fontSize: 18, textDecoration: 'none', display: 'inline-block' }}>
            View Plans
          </a>
        </div>
        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {['OpenAI', 'Twilio', 'SendGrid', 'Stripe', 'AWS', 'Anthropic'].map(provider => (
            <div key={provider} style={{ padding: '12px 24px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>{provider}</div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 60, color: '#111', letterSpacing: '-0.5px' }}>Why Rook?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { title: 'Single Bill', desc: 'One monthly plan covers all your API services. Like your phone bill \u2014 simpler, predictable, no surprises.', icon: '📄' },
            { title: 'Shared Data Pool', desc: 'Credits are pooled across all your APIs like a family data plan. Unused OpenAI credits automatically available for Twilio SMS.', icon: '💧' },
            { title: 'Auto-Refill', desc: 'Never hit a wall mid-project. We auto-refill your pool when you\'re running low.', icon: '🔄' },
            { title: 'Usage Analytics', desc: 'Real-time dashboard showing exactly which APIs are consuming credits and how fast.', icon: '📊' },
            { title: 'Volume Discounts', desc: 'We negotiate volume rates so you get better per-unit pricing than going direct \u2014 like a business plan vs. individual lines.', icon: '🤝' },
            { title: 'Team Controls', desc: 'Per-team-member API keys, usage limits, and cost allocation across departments.', icon: '👥' },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ background: '#f8f9fa', borderRadius: 16, padding: 32, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#111' }}>{f.title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#111', letterSpacing: '-0.5px' }}>Simple Pricing</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 48, fontSize: 16 }}>Start small, scale up. All plans include our core platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          {[
            { name: 'Starter', price: '$500', period: '/month', credits: '100K', apis: '5 APIs', desc: 'Perfect for small teams getting started with unified API access.', features: ['100K shared credits/mo', 'Up to 5 API providers', 'Usage analytics dashboard', 'Email support', 'Auto-refill enabled'], cta: 'Start Free Trial', popular: false },
            { name: 'Growth', price: '$2,000', period: '/month', credits: '1M', apis: '15 APIs', desc: 'For scaling companies that need more providers and higher capacity.', features: ['1M shared credits/mo', 'Up to 15 API providers', 'Advanced analytics', 'Priority support', 'Annual 20% discount', 'Team member management'], cta: 'Start Free Trial', popular: true },
            { name: 'Enterprise', price: 'Custom', period: '', credits: 'Custom', apis: 'Unlimited', desc: 'For large organizations with custom provider requirements.', features: ['Custom credit pool', 'Unlimited API providers', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees', 'Volume discounts'], cta: 'Contact Sales', popular: false },
          ].map(tier => (
            <div key={tier.name} className={tier.popular ? 'popular-card' : 'pricing-card'} style={{
              background: tier.popular ? '#f8f9fa' : '#ffffff',
              borderRadius: 16, padding: 40,
              border: tier.popular ? '2px solid #111' : '1px solid #e2e8f0',
              position: 'relative',
            }}>
              {tier.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#111', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Most Popular</div>}
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#111' }}>{tier.name}</h3>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: '#111' }}>{tier.price}</span>
                <span style={{ color: '#64748b', fontSize: 16 }}>{tier.period}</span>
              </div>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>{tier.desc}</p>
              <p style={{ color: '#111', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>{tier.credits} credits &middot; {tier.apis}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {tier.features.map(f => (<li key={f} style={{ padding: '8px 0', color: '#333', fontSize: 14, borderBottom: '1px solid #e2e8f0' }}>✓ {f}</li>))}
              </ul>
              <button onClick={onGetStarted} className="btn-primary" style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: tier.popular ? '#111' : 'transparent',
                border: tier.popular ? 'none' : '1px solid #d1d5db',
                color: tier.popular ? 'white' : '#333',
                cursor: 'pointer', fontWeight: 600, fontSize: 16
              }}>{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 16px', color: '#111', letterSpacing: '-0.5px' }}>One plan. All your APIs.</h2>
        <p style={{ color: '#64748b', fontSize: 18, marginBottom: 32 }}>Join companies that cut their API vendor management overhead by 80%.</p>
        <button onClick={onGetStarted} className="btn-primary" style={{ background: '#111', border: 'none', borderRadius: 12, padding: '16px 48px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 18 }}>
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '32px 48px', textAlign: 'center', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <RookLogo size={16} />
        <span>© 2025 Rook. All rights reserved.</span>
      </footer>
    </div>
  );
}
