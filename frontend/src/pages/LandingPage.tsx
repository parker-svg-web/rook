import React from 'react';
import RookLogoText from '../components/RookLogoText';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  html { scroll-behavior: smooth; }
  .hero-section { animation: fadeInUp 0.8s ease-out; }
  .slide-in { animation: slideIn 0.6s ease-out; }
  .feature-card { transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .feature-card:hover { transform: translateY(-4px); box-shadow: 0 0 30px rgba(255,255,255,0.05); border-color: #ffffff !important; }
  .btn-primary { transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); cursor: pointer; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(255,255,255,0.08); background: #e0e0e0 !important; }
  .btn-primary:active { transform: translateY(0); }
  .btn-ghost { transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); cursor: pointer; }
  .btn-ghost:hover { border-color: #ffffff !important; color: #ffffff !important; background: rgba(255,255,255,0.05) !important; }
  .pricing-card { transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .pricing-card:hover { transform: translateY(-6px); box-shadow: 0 0 40px rgba(255,255,255,0.06); border-color: #ffffff !important; }
  .popular-card { transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .popular-card:hover { transform: translateY(-6px); box-shadow: 0 0 50px rgba(255,255,255,0.1); }
  .nav-link { position: relative; transition: color 0.3s ease; }
  .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: #ffffff; transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
  .nav-link:hover::after { width: 100%; }
  .provider-badge { transition: all 0.3s ease; }
  .provider-badge:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,255,255,0.05); border-color: #ffffff !important; color: #ffffff !important; }
`;

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', color: '#ffffff', background: '#0a0a0a', minHeight: '100vh' }}>
      <style>{styles}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid #2a2a2a', background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <RookLogoText size={24} />
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#features" className="nav-link" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
          <a href="#pricing" className="nav-link" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
          <button onClick={onSignIn} className="btn-ghost" style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10, padding: '9px 22px', color: '#a0a0a0', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Sign In</button>
          <button onClick={onGetStarted} className="btn-primary" style={{ background: '#ffffff', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#0a0a0a', fontWeight: 600, fontSize: 14 }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{ maxWidth: 1000, margin: '0 auto', padding: '120px 48px 100px', textAlign: 'center', background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)' }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#a0a0a0', fontSize: 13, fontWeight: 500, marginBottom: 24, letterSpacing: '0.3px' }}>
          ✦ Now in Beta
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, margin: '0 0 20px 0', color: '#ffffff', letterSpacing: '-2px' }}>
          Telecom for<br />Your APIs
        </h1>
        <p style={{ fontSize: 20, color: '#a0a0a0', maxWidth: 600, margin: '0 auto 44px', lineHeight: 1.7, fontWeight: 400 }}>
          You don't manage separate data plans for every carrier. Why manage separate API accounts? Rook bundles OpenAI, Twilio, Stripe, and more into one predictable monthly subscription.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={onGetStarted} className="btn-primary" style={{ background: '#ffffff', border: 'none', borderRadius: 12, padding: '18px 44px', color: '#0a0a0a', fontWeight: 600, fontSize: 17 }}>
            Get Started
          </button>
          <a href="#pricing" className="btn-ghost" style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 12, padding: '17px 44px', color: '#a0a0a0', fontWeight: 500, fontSize: 17, textDecoration: 'none', display: 'inline-block' }}>
            View Plans
          </a>
        </div>
        <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {['OpenAI', 'Twilio', 'SendGrid', 'Stripe', 'AWS', 'Anthropic'].map(provider => (
            <div key={provider} className="provider-badge" style={{ padding: '12px 28px', background: '#1a1a1a', borderRadius: 10, border: '1px solid #2a2a2a', color: '#666666', fontSize: 14, fontWeight: 500, cursor: 'default' }}>{provider}</div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 16, color: '#ffffff', letterSpacing: '-1px' }}>Why Rook?</h2>
        <p style={{ textAlign: 'center', color: '#a0a0a0', fontSize: 16, marginBottom: 64, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>Everything you need to manage your API stack — in one place.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {[
            { title: 'Single Bill', desc: 'One monthly plan covers all your API services. Like your phone bill \u2014 simpler, predictable, no surprises.', icon: '📄' },
            { title: 'Shared Data Pool', desc: 'Credits are pooled across all your APIs like a family data plan. Unused OpenAI credits automatically available for Twilio SMS.', icon: '💧' },
            { title: 'Auto-Refill', desc: 'Never hit a wall mid-project. We auto-refill your pool when you\'re running low.', icon: '🔄' },
            { title: 'Usage Analytics', desc: 'Real-time dashboard showing exactly which APIs are consuming credits and how fast.', icon: '📊' },
            { title: 'Volume Discounts', desc: 'We negotiate volume rates so you get better per-unit pricing than going direct \u2014 like a business plan vs. individual lines.', icon: '🤝' },
            { title: 'Team Controls', desc: 'Per-team-member API keys, usage limits, and cost allocation across departments.', icon: '👥' },
          ].map((f, i) => (
            <div key={f.title} className="feature-card slide-in" style={{ animationDelay: `${i * 0.1}s`, background: '#1a1a1a', borderRadius: 16, padding: 36, border: '1px solid #2a2a2a' }}>
              <div style={{ fontSize: 40, marginBottom: 20, lineHeight: 1 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#ffffff', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ color: '#a0a0a0', lineHeight: 1.7, margin: 0, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#ffffff', letterSpacing: '-1px' }}>Simple Pricing</h2>
        <p style={{ textAlign: 'center', color: '#666666', marginBottom: 56, fontSize: 16 }}>Start small, scale up. All plans include our core platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
          {[
            { name: 'Starter', price: '$500', period: '/month', credits: '100K', apis: '5 APIs', desc: 'Perfect for small teams getting started with unified API access.', features: ['100K shared credits/mo', 'Up to 5 API providers', 'Usage analytics dashboard', 'Email support', 'Auto-refill enabled'], cta: 'Get Started', popular: false },
            { name: 'Growth', price: '$2,000', period: '/month', credits: '1M', apis: '15 APIs', desc: 'For scaling companies that need more providers and higher capacity.', features: ['1M shared credits/mo', 'Up to 15 API providers', 'Advanced analytics', 'Priority support', 'Annual 20% discount', 'Team member management'], cta: 'Get Started', popular: true },
            { name: 'Enterprise', price: 'Custom', period: '', credits: 'Custom', apis: 'Unlimited', desc: 'For large organizations with custom provider requirements.', features: ['Custom credit pool', 'Unlimited API providers', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees', 'Volume discounts'], cta: 'Contact Sales', popular: false },
          ].map((tier, i) => (
            <div key={tier.name} className={tier.popular ? 'popular-card' : 'pricing-card slide-in'} style={{
              background: tier.popular ? '#222222' : '#1a1a1a',
              borderRadius: 16, padding: 40,
              border: tier.popular ? '2px solid #ffffff' : '1px solid #2a2a2a',
              position: 'relative', animationDelay: `${i * 0.15}s`,
            }}>
              {tier.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ffffff', color: '#0a0a0a', padding: '5px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: '0.3px' }}>Most Popular</div>}
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: '#ffffff', letterSpacing: '-0.3px' }}>{tier.name}</h3>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: '#ffffff', letterSpacing: '-1.5px' }}>{tier.price}</span>
                <span style={{ color: '#666666', fontSize: 16, fontWeight: 500 }}>{tier.period}</span>
              </div>
              <p style={{ color: '#a0a0a0', fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>{tier.desc}</p>
              <p style={{ color: '#ffffff', fontSize: 13, marginBottom: 24, fontWeight: 600 }}>{tier.credits} credits &middot; {tier.apis}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {tier.features.map(f => (<li key={f} style={{ padding: '10px 0', color: '#a0a0a0', fontSize: 14, borderBottom: '1px solid #2a2a2a', lineHeight: 1.5 }}>✓ {f}</li>))}
              </ul>
              <button onClick={onGetStarted} className="btn-primary" style={{
                width: '100%', padding: '15px', borderRadius: 10,
                background: tier.popular ? '#ffffff' : 'transparent',
                border: tier.popular ? 'none' : '1px solid #2a2a2a',
                color: tier.popular ? '#0a0a0a' : '#a0a0a0',
                fontWeight: 600, fontSize: 16
              }}>{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '100px 48px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 16px', color: '#ffffff', letterSpacing: '-1px' }}>One plan. All your APIs.</h2>
        <p style={{ color: '#a0a0a0', fontSize: 18, marginBottom: 36, lineHeight: 1.6 }}>Join companies that cut their API vendor management overhead by 80%.</p>
        <button onClick={onGetStarted} className="btn-primary" style={{ background: '#ffffff', border: 'none', borderRadius: 12, padding: '18px 52px', color: '#0a0a0a', fontWeight: 600, fontSize: 17 }}>
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #2a2a2a', padding: '40px 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RookLogoText size={16} />
          <span style={{ color: '#666666', fontSize: 13 }}>© 2025 Rook. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
