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
      background: '#f8f9fa',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#111827',
    },
    header: {
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
    badge: {
      background: '#f8f9fa',
      border: '1px solid #e5e7eb',
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 13,
      color: '#6b7280',
      fontWeight: 500,
    },
    logoutBtn: {
      background: 'none',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      padding: '8px 16px',
      color: '#6b7280',
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
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    cardTitle: { fontSize: 13, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    statValue: { fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 },
    statSub: { fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' },
    progressBar: {
      width: '100%',
      height: 8,
      background: '#e5e7eb',
      borderRadius: 4,
      marginTop: 12,
      overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
    th: { textAlign: 'left' as const, padding: '10px 12px', color: '#9ca3af', fontWeight: 600, borderBottom: '1px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    td: { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', color: '#1f2937' },
  };

  const alertBadgeStyle = (type: string) => ({
    display: 'inline-block' as const,
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    background: '#f8f9fa',
    color: '#111827',
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
          <RookLogoText size={20} />
          <span style={styles.badge}>{subscription.plan_name} Plan</span>
        </div>
        <div style={styles.headerRight}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>{user.company_name}</span>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={onLogout}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#000000'; (e.target as HTMLElement).style.color = '#000000'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#d1d5db'; (e.target as HTMLElement).style.color = '#6b7280'; }}
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
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
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
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
            Linked APIs ({apis.length}/{subscription.max_apis} max)
          </h2>
          {apis.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No APIs linked yet.</p>
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
                        <div style={{ width: 80, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(api.utilization_pct, 100)}%`,
                            background: api.utilization_pct > 80 ? '#ef4444' : api.utilization_pct > 50 ? '#f59e0b' : '#22c55e',
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{api.utilization_pct}%</span>
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
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
            Recent Usage (Last 30 Days)
          </h2>
          {recent_usage.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No usage data yet.</p>
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
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
              Active Alerts
            </h2>
            {alerts.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <span style={alertBadgeStyle(a.type)}>{a.type.replace('_', ' ')}</span>
                  <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 13 }}>{a.message || ''}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{a.triggered_at || ''}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
