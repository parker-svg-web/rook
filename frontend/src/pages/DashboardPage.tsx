import React from 'react';
import type { DashboardData } from '../App';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function RookLogo({ size = 22 }: { size?: number }) {
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

interface Props {
  data: DashboardData;
  onLogout: () => void;
}

export default function DashboardPage({ data, onLogout }: Props) {
  const { user, subscription, apis, recent_usage, alerts } = data;

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#111',
    },
    header: {
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
    badge: {
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 13,
      color: '#64748b',
      fontWeight: 500,
    },
    logoutBtn: {
      background: 'none',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      padding: '8px 16px',
      color: '#64748b',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 500,
      transition: 'all 0.2s ease',
    },
    main: { maxWidth: 1200, margin: '0 auto', padding: '24px 32px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 },
    card: {
      background: '#ffffff',
      borderRadius: 12,
      padding: 24,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    cardTitle: { fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    statValue: { fontSize: 28, fontWeight: 700, color: '#111', margin: 0 },
    statSub: { fontSize: 13, color: '#64748b', margin: '4px 0 0 0' },
    progressBar: {
      width: '100%',
      height: 8,
      background: '#e2e8f0',
      borderRadius: 4,
      marginTop: 12,
      overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
    th: { textAlign: 'left' as const, padding: '10px 12px', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    td: { padding: '10px 12px', borderBottom: '1px solid #e2e8f0', color: '#333' },
  };

  const alertBadgeStyle = (type: string) => ({
    display: 'inline-block' as const,
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background: type === 'low_credits' ? '#f0f0f0' : type === 'refill' ? '#f0f0f0' : '#f0f0f0',
    color: '#111',
  });

  const progressFillStyle = (pct: number) => ({
    height: '100%' as const,
    borderRadius: 4,
    width: `${Math.min(pct, 100)}%`,
    background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
    transition: 'width 0.3s ease',
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RookLogo size={22} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>Rook</h1>
          <span style={styles.badge}>{subscription.plan_name} Plan</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ color: '#64748b', fontSize: 13 }}>{user.company_name}</span>
          <span style={{ color: '#94a3b8', fontSize: 13 }}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={onLogout}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#111'; (e.target as HTMLElement).style.color = '#111'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#d1d5db'; (e.target as HTMLElement).style.color = '#64748b'; }}
          >Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats Grid */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <p style={styles.cardTitle}>Credit Pool</p>
            <p style={styles.statValue}>{formatNumber(subscription.credits_available)}</p>
            <p style={styles.statSub}>
              of {formatNumber(subscription.credits_pool_total)} available &middot; {subscription.utilization_pct}% used
            </p>
            <div style={styles.progressBar}>
              <div style={progressFillStyle(subscription.utilization_pct)} />
            </div>
          </div>

          <div style={styles.card}>
            <p style={styles.cardTitle}>Monthly Spend</p>
            <p style={styles.statValue}>${subscription.monthly_fee.toLocaleString()}</p>
            <p style={styles.statSub}>
              {subscription.auto_refill ? 'Auto-refill enabled' : 'Auto-refill disabled'}
              {subscription.auto_refill && ` at ${subscription.refill_threshold}% threshold`}
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.cardTitle}>Billing Cycle</p>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              {subscription.billing_cycle_start || 'N/A'} &ndash; {subscription.billing_cycle_end || 'N/A'}
            </p>
            <p style={styles.statSub}>
              Status: <span style={{ color: subscription.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {subscription.status}
              </span>
            </p>
          </div>
        </div>

        {/* Linked APIs */}
        <div style={{ ...styles.card, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111' }}>
            Linked APIs ({apis.length}/{subscription.max_apis} max)
          </h2>
          {apis.length === 0 ? (
            <p style={{ color: '#64748b' }}>No APIs linked yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Provider</th>
                  <th style={styles.th}>Label</th>
                  <th style={styles.th}>Allocated</th>
                  <th style={styles.th}>Used</th>
                  <th style={styles.th}>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {apis.map((api, i) => (
                  <tr key={i}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600 }}>{api.provider_name}</span>
                    </td>
                    <td style={styles.td}>{api.api_key_label || '—'}</td>
                    <td style={styles.td}>{formatNumber(api.allocated_credits)}</td>
                    <td style={styles.td}>{formatNumber(api.credits_used)}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(api.utilization_pct, 100)}%`,
                            background: api.utilization_pct > 80 ? '#ef4444' : api.utilization_pct > 50 ? '#f59e0b' : '#22c55e',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{api.utilization_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Usage */}
        <div style={{ ...styles.card, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111' }}>
            Recent Usage (Last 30 Days)
          </h2>
          {recent_usage.length === 0 ? (
            <p style={{ color: '#64748b' }}>No usage data yet.</p>
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
                  <tr key={i}>
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
          <div style={styles.card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111' }}>
              Active Alerts
            </h2>
            {alerts.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <span style={alertBadgeStyle(a.type)}>{a.type.replace('_', ' ')}</span>
                  <span style={{ marginLeft: 8, color: '#64748b', fontSize: 13 }}>{a.message || ''}</span>
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{a.triggered_at || ''}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
