import { initDb, getDb, DB_PATH } from '../models/database';

const SCHEMA = `
-- ============================================================
-- Rook Platform Database Schema
-- API Credit Bundling Service
-- ============================================================

-- Users (customers)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  company_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Subscription plans (tiers)
CREATE TABLE IF NOT EXISTS plans (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  monthly_fee   REAL NOT NULL,
  max_apis      INTEGER NOT NULL,
  pool_credits  INTEGER NOT NULL,
  overage_rate  REAL NOT NULL DEFAULT 0.02,
  markup_pct    REAL NOT NULL DEFAULT 20.0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Customer subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id           TEXT NOT NULL REFERENCES plans(id),
  status            TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'cancelled', 'past_due')),
  credits_pool_total INTEGER NOT NULL DEFAULT 0,
  credits_pool_used  INTEGER NOT NULL DEFAULT 0,
  billing_cycle_start TEXT,
  billing_cycle_end   TEXT,
  auto_refill       INTEGER NOT NULL DEFAULT 1,
  refill_threshold  INTEGER NOT NULL DEFAULT 20,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- API providers (e.g., OpenAI, Twilio, Stripe)
CREATE TABLE IF NOT EXISTS api_providers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  base_url      TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- APIs linked to a subscription (which providers, with allocated credits)
CREATE TABLE IF NOT EXISTS subscription_apis (
  id                TEXT PRIMARY KEY,
  subscription_id   TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  provider_id       TEXT NOT NULL REFERENCES api_providers(id),
  api_key_label     TEXT,
  allocated_credits INTEGER NOT NULL DEFAULT 0,
  credits_used      INTEGER NOT NULL DEFAULT 0,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(subscription_id, provider_id)
);

-- Usage logs (per-API credit consumption)
CREATE TABLE IF NOT EXISTS usage_logs (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  provider_id     TEXT NOT NULL REFERENCES api_providers(id),
  credits_used    INTEGER NOT NULL,
  request_count   INTEGER NOT NULL DEFAULT 1,
  cost_usd        REAL,
  recorded_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Billing records
CREATE TABLE IF NOT EXISTS billing_records (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id),
  amount          REAL NOT NULL,
  base_fee        REAL NOT NULL,
  overage_fee     REAL NOT NULL DEFAULT 0.0,
  credits_used    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
  period_start    TEXT NOT NULL,
  period_end      TEXT NOT NULL,
  due_date        TEXT NOT NULL,
  paid_at         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Alerts & notifications
CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK(type IN ('low_credits', 'refill', 'overage', 'billing', 'margin')),
  threshold       REAL,
  message         TEXT,
  is_triggered    INTEGER NOT NULL DEFAULT 0,
  triggered_at    TEXT,
  acknowledged    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_subscription ON usage_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_recorded ON usage_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_billing_records_subscription ON billing_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_alerts_subscription ON alerts(subscription_id);
`;

export async function runMigrations(): Promise<void> {
  await initDb();
  const db = getDb();
  console.log('[rook-db] Running migrations...');
  db.exec(SCHEMA);
  db.save();
  console.log('[rook-db] Migrations complete.');
}

// Run directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}