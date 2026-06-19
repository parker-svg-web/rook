import React from 'react';
import type { DashboardData } from '../App';
import RookLogoText from '../components/RookLogoText';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

interface Props {
  data: DashboardData;
  onLogout: () => void;
}

export default function DashboardPage({ data, onLogout }: Props) {
  const { user, subscription, apis, recent_usage, alerts } = data;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#ffffff',
    },
    header: {
      background: '#1a1a1a',
      borderBottom: '1px solid #2a2a2a',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 20 },
    badge: {
      background: '#0a0a0a',
      border: '1px solid #2a2a2a',
      borderRadius: 20,
      padding: '5px 14px',
      fontSize: 13,
      color: '#a0a0a0',
      fontWeight: 500,
    },
    logoutBtn: {
      background: 'none',
      border: '1px solid #2a2a2a',
      borderRadius: 10,
      padding: '9px 18px',
      color: '#a0a0a0',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fontFamily: 'Inter, sans-serif',
    },
    main: { maxWidth: 1200, margin: '0 auto', padding: '28px 32px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 },
    card: {
      background: '#1a1a1a',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #2a2a2a',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease',
    },
    cardTitle: { fontSize: 12, fontWeight: 600, color: '#666666', margin: '0 0 10px 0', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
    statValue: { fontSize: 30, fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' },
    statSub: { fontSize: 13, color: '#a0a0a0', margin: '6px 0 0 0' },
    progressBar: {
      width: '100%',
      height: 8,
      background: '#0a0a0a',
      borderRadius: 4,
      marginTop: 14,
      overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
    th: { textAlign: 'left' as const, padding: '12px 12px', color: '#666666', fontWeight: 600, borderBottom: '1px solid #2a2a2a', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
    td: { padding: '14px 12px', borderBottom: '1px solid #2a2a2a', color: '#a0a0a0' },
    sectionTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', color: '#ffffff', letterSpacing: '-0.3px' },
  };

  const cardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.05)';
  };
  const cardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = '';
  };

  const alertBadgeStyle = (type: string) => ({
    display: 'inline-block' as const,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    background: '#0a0a0a',
    color: '#ffffff',
    letterSpacing: '0.03em' as const,
  });

  const progressFillStyle = (pct: number) => ({
    height: '100%' as const,
    borderRadius: 4,
    width: `${Math.min(pct, 100)}%`,
    background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
    transition: 'width 0.5s ease',
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <RookLogoText size={20} />
          <span style={styles.badge}>{subscription.plan_name} Plan</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ color: '#a0a0a0', fontSize: 13, fontWeight: 500 }}>{user.company_name}</span>
          <span style={{ color: '#666666', fontSize: 13 }}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={onLogout}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#ffffff'; (e.target as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2a2a2a'; (e.target as HTMLElement).style.color = '#a0a0a0'; }}
          >Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats Grid */}
        <div style={styles.grid}>
          <div style={styles.card} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <p style={styles.cardTitle}>Credit Pool</p>
            <p style={styles.statValue}>{formatNumber(subscription.credits_available)}</p>
            <p style={styles.statSub}>
              of {formatNumber(subscription.credits_pool_total)} available &middot; {subscription.utilization_pct}% used
            </p>
            <div style={styles.progressBar}>
              <div style={progressFillStyle(subscription.utilization_pct)} />
            </div>
          </div>

          <div style={styles.card} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <p style={styles.cardTitle}>Monthly Spend</p>
            <p style={styles.statValue}>${subscription.monthly_fee.toLocaleString()}</p>
            <p style={styles.statSub}>
              {subscription.auto_refill ? 'Auto-refill enabled' : 'Auto-refill disabled'}
              {subscription.auto_refill && ` at ${subscription.refill_threshold}% threshold`}
            </p>
          </div>

          <div style={styles.card} onMouseEnter={cardHover} onMouseLeave={cardLeave}>
            <p style={styles.cardTitle}>Billing Cycle</p>
            <p style={{ fontSize: 14, color: '#a0a0a0', margin: 0, lineHeight: 1.5 }}>
              {subscription.billing_cycle_start || 'N/A'} &ndash; {subscription.billing_cycle_end || 'N/A'}
            </p>
            <p style={styles.statSub}>
              Status: <span style={{ color: subscription.status === 'active' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {subscription.status}
              </span>
            </p>
          </div>
        </div>

        {/* Recent Usage */}
        <div style={{ ...styles.card, marginBottom: 28, padding: 28 }}>
          <h2 style={styles.sectionTitle}>Recent Usage (Last 30 Days)</h2>
          {recent_usage.length === 0 ? (
            <p style={{ color: '#a0a0a0', fontSize: 14 }}>No usage data yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Provider</th>
                  <th style={styles.th}>Credits Used</th>
                </tr>
              </thead>
              <tbody>
                {recent_usage.slice(0, 15).map((u, i) => (
                  <tr key={i} style={{ transition: 'background 0.2s ease' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#222222'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <td style={styles.td}>{u.date}</td>
                    <td style={styles.td}>{u.provider_name}</td>
                    <td style={styles.td}>{u.credits_used.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ ...styles.card, padding: 28 }}>
            <h2 style={styles.sectionTitle}>Active Alerts</h2>
            {alerts.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #2a2a2a', transition: 'background 0.2s ease' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#222222'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                <div>
                  <span style={alertBadgeStyle(a.type)}>{a.type.replace('_', ' ')}</span>
                  <span style={{ marginLeft: 10, color: '#a0a0a0', fontSize: 13 }}>{a.message || ''}</span>
                </div>
                <span style={{ fontSize: 12, color: '#666666' }}>{a.triggered_at || ''}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
