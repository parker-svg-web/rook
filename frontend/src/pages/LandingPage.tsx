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
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.3); }
    50% { box-shadow: 0 0 40px rgba(37, 99, 235, 0.6); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  .hero-section { animation: fadeInUp 0.8s ease-out; }
  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); border-color: #475569 !important; }
  .cta-button { transition: all 0.3s ease; }
  .cta-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4); }
  .outline-button { transition: all 0.3s ease; }
  .outline-button:hover { border-color: #38bdf8 !important; color: #38bdf8 !important; }
  .animated-bg { background: linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #1a2332); background-size: 400% 400%; animation: gradientShift 15s ease infinite; }
  .provider-badge { transition: all 0.3s ease; animation: float 3s ease-in-out infinite; }
  .provider-badge:nth-child(2) { animation-delay: 0.5s; }
  .provider-badge:nth-child(3) { animation-delay: 1s; }
  .provider-badge:nth-child(4) { animation-delay: 1.5s; }
  .provider-badge:nth-child(5) { animation-delay: 2s; }
  .provider-badge:nth-child(6) { animation-delay: 2.5s; }
  .provider-badge:hover { transform: translateY(-4px) !important; border-color: #38bdf8 !important; color: #38bdf8 !important; }
  .pricing-card { transition: all 0.3s ease; }
  .pricing-card:hover { transform: translateY(-8px); box-shadow: 0 30px 60px rgba(0,0,0,0.4); }
  .popular-pricing-card { animation: pulseGlow 3s ease-in-out infinite; transition: all 0.3s ease; }
  .popular-pricing-card:hover { transform: translateY(-8px); }
  .gradient-text { background: linear-gradient(135deg, #38bdf8, #818cf8, #38bdf8); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradientShift 4s ease infinite; }
`;

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f1f5f9', minHeight: '100vh' }} className="animated-bg">
      <style>{styles}</style>

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.5px' }}>Rook</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => (e.target as HTMLElement).style.color = '#e2e8f0'} onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}>Features</a>
          <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => (e.target as HTMLElement).style.color = '#e2e8f0'} onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}>Pricing</a>
          <button onClick={onSignIn} style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 8, padding: '8px 20px', color: '#e2e8f0', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }} onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#38bdf8'; (e.target as HTMLElement).style.color = '#38bdf8'; }} onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#334155'; (e.target as HTMLElement).style.color = '#e2e8f0'; }}>Sign In</button>
          <button onClick={onGetStarted} className="cta-button" style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 20px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 48px 100px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: '0.5px' }}>
          ✦ Now in Beta
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px 0', letterSpacing: '-1.5px' }}>
          <span className="gradient-text">Telecom for&nbsp;API.</span><br />
          <span style={{ color: '#f1f5f9' }}>One Simple Plan.</span>
        </h1>
        <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 650, margin: '0 auto 40px', lineHeight: 1.7 }}>
          You don't manage separate data plans for each carrier — so why manage separate API accounts? 
          Rook bundles OpenAI, Twilio, Stripe, and more into one predictable monthly subscription. One provider, one bill, one place to manage it all.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button onClick={onGetStarted} className="cta-button" style={{ background: '#2563eb', border: 'none', borderRadius: 12, padding: '16px 40px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 18 }}>
            Start Free Trial
          </button>
          <a href="#pricing" className="outline-button" style={{ background: 'transparent', border: '1px solid #334155', borderRadius: 12, padding: '16px 40px', color: '#e2e8f0', cursor: 'pointer', fontWeight: 500, fontSize: 18, textDecoration: 'none', display: 'inline-block', transition: 'all 0.3s ease' }}>
            View Plans
          </a>
        </div>
        <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {['OpenAI', 'Twilio', 'SendGrid', 'Stripe', 'AWS', 'Anthropic'].map(provider => (
            <div key={provider} className="provider-badge" style={{ padding: '12px 24px', background: 'rgba(30,41,59,0.8)', borderRadius: 8, border: '1px solid #334155', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'default' }}>{provider}</div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 16, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Why Rook?</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 16, marginBottom: 60, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>Everything you need to manage your API stack — in one place.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { title: 'One Bill', desc: 'A single predictable monthly payment covers all your API services. Just like your mobile plan — but for your stack.', icon: '📄' },
            { title: 'Credit Pooling', desc: 'Share credits across all APIs like a shared data bucket. Unused OpenAI credits automatically available for Twilio SMS.', icon: '💧' },
            { title: 'Auto-Refill', desc: 'Never hit a wall mid-project. We auto-refill your credit pool when you\'re running low — no more surprise overage bills.', icon: '🔄' },
            { title: 'Usage Dashboard', desc: 'Real-time dashboard showing exactly which APIs are consuming your credits and how fast, just like checking your data usage.', icon: '📊' },
            { title: 'Volume Discounts', desc: 'We negotiate wholesale rates with providers so you get better per-unit pricing than going direct — savings built into every plan.', icon: '🤝' },
            { title: 'Team Controls', desc: 'Per-team-member API keys, usage limits, and cost allocation across departments. Full visibility into who uses what.', icon: '👥' },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 16, padding: 32, border: '1px solid #334155', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#f1f5f9' }}>{f.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, margin: 0, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Simple Pricing</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 48, fontSize: 16 }}>Start small, scale up. All plans include our core platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          {[
            { name: 'Starter', price: '$500', period: '/month', credits: '100K', apis: '5 APIs', desc: 'Perfect for small teams getting started with unified API billing.', features: ['100K shared credits/mo', 'Up to 5 API providers', 'Usage analytics dashboard', 'Email support', 'Auto-refill enabled'], cta: 'Start Free Trial', popular: false },
            { name: 'Growth', price: '$2,000', period: '/month', credits: '1M', apis: '15 APIs', desc: 'For scaling companies that need more providers and higher capacity.', features: ['1M shared credits/mo', 'Up to 15 API providers', 'Advanced analytics', 'Priority support', 'Annual 20% discount', 'Team member management'], cta: 'Start Free Trial', popular: true },
            { name: 'Enterprise', price: 'Custom', period: '', credits: 'Custom', apis: 'Unlimited', desc: 'For large organizations with custom provider requirements.', features: ['Custom credit pool', 'Unlimited API providers', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees', 'Volume discounts'], cta: 'Contact Sales', popular: false },
          ].map(tier => (
            <div key={tier.name} className={tier.popular ? 'popular-pricing-card' : 'pricing-card'} style={{
              background: tier.popular ? 'linear-gradient(135deg, rgba(30,58,95,0.9), rgba(30,41,59,0.9))' : 'rgba(30,41,59,0.6)',
              borderRadius: 16, padding: 40,
              border: tier.popular ? '2px solid #2563eb' : '1px solid #334155',
              position: 'relative',
              backdropFilter: 'blur(4px)',
            }}>
              {tier.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>Most Popular</div>}
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#f1f5f9' }}>{tier.name}</h3>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: '#f1f5f9' }}>{tier.price}</span>
                <span style={{ color: '#64748b', fontSize: 16 }}>{tier.period}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>{tier.desc}</p>
              <p style={{ color: '#38bdf8', fontSize: 13, marginBottom: 24 }}>{tier.credits} credits &middot; {tier.apis}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {tier.features.map(f => (<li key={f} style={{ padding: '8px 0', color: '#cbd5e1', fontSize: 14, borderBottom: '1px solid rgba(30,41,59,0.8)' }}>✓ {f}</li>))}
              </ul>
              <button onClick={onGetStarted} className="cta-button" style={{
                width: '100%', padding: '14px', borderRadius: 10,
                background: tier.popular ? '#2563eb' : 'transparent',
                border: tier.popular ? 'none' : '1px solid #334155',
                color: tier.popular ? 'white' : '#e2e8f0',
                cursor: 'pointer', fontWeight: 600, fontSize: 16
              }}>{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 16px', color: '#f1f5f9', letterSpacing: '-0.5px' }}>Ready to simplify your API billing?</h2>
        <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>Join companies that treat their API stack like a simple phone plan — one provider, one predictable bill.</p>
        <button onClick={onGetStarted} className="cta-button" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', borderRadius: 12, padding: '16px 48px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 18, boxShadow: '0 8px 25px rgba(37,99,235,0.3)' }}>
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        © 2025 Rook. All rights reserved.
      </footer>
    </div>
  );
}
