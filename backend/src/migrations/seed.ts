import { runMigrations } from './run';
import { initDb, getDb } from '../models/database';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

async function seed(): Promise<void> {
  await runMigrations();
  const db = getDb();

  console.log('[rook-db] Seeding data...');

  // Seed plans
  const plans = [
    {
      id: uuid(),
      name: 'Starter',
      slug: 'starter',
      description: 'Up to 5 APIs, 100K credits pool, best for small teams',
      monthly_fee: 500,
      max_apis: 5,
      pool_credits: 100_000,
      overage_rate: 0.025,
      markup_pct: 25.0,
    },
    {
      id: uuid(),
      name: 'Growth',
      slug: 'growth',
      description: 'Up to 15 APIs, 1M credits pool, for scaling teams',
      monthly_fee: 2000,
      max_apis: 15,
      pool_credits: 1_000_000,
      overage_rate: 0.02,
      markup_pct: 20.0,
    },
    {
      id: uuid(),
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited APIs, custom pool, dedicated support',
      monthly_fee: 0,
      max_apis: 999,
      pool_credits: 10_000_000,
      overage_rate: 0.015,
      markup_pct: 15.0,
    },
  ];

  for (const p of plans) {
    db.run(
      'INSERT OR IGNORE INTO plans (id, name, slug, description, monthly_fee, max_apis, pool_credits, overage_rate, markup_pct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      p.id, p.name, p.slug, p.description, p.monthly_fee, p.max_apis, p.pool_credits, p.overage_rate, p.markup_pct
    );
  }

  // Seed API providers
  const providers = [
    { name: 'OpenAI', slug: 'openai', description: 'GPT models, embeddings, DALL-E', base_url: 'https://api.openai.com/v1' },
    { name: 'Twilio', slug: 'twilio', description: 'SMS, voice, email APIs', base_url: 'https://api.twilio.com' },
    { name: 'Stripe', slug: 'stripe', description: 'Payment processing platform', base_url: 'https://api.stripe.com/v1' },
    { name: 'AWS', slug: 'aws', description: 'Amazon Web Services', base_url: null },
    { name: 'SendGrid', slug: 'sendgrid', description: 'Email delivery service', base_url: 'https://api.sendgrid.com/v3' },
    { name: 'Mapbox', slug: 'mapbox', description: 'Maps & location APIs', base_url: 'https://api.mapbox.com' },
    { name: 'Anthropic', slug: 'anthropic', description: 'Claude AI models', base_url: 'https://api.anthropic.com/v1' },
    { name: 'GitHub', slug: 'github', description: 'GitHub API', base_url: 'https://api.github.com' },
  ];

  for (const prov of providers) {
    db.run(
      'INSERT OR IGNORE INTO api_providers (id, name, slug, description, base_url) VALUES (?, ?, ?, ?, ?)',
      uuid(), prov.name, prov.slug, prov.description, prov.base_url
    );
  }

  // Seed demo admin user
  const adminPw = await bcrypt.hash('admin123', 10);
  db.run(
    'INSERT OR IGNORE INTO users (id, email, company_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    uuid(), 'admin@rook.dev', 'Rook Admin', adminPw, 'admin'
  );

  // Seed demo customer
  const customerPw = await bcrypt.hash('demo1234', 10);
  const customerId = uuid();
  db.run(
    'INSERT OR IGNORE INTO users (id, email, company_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    customerId, 'demo@acmecorp.com', 'Acme Corp', customerPw, 'customer'
  );

  // Get the Growth plan
  const growthPlan = db.prepare("SELECT id, pool_credits, monthly_fee FROM plans WHERE slug = 'growth'").get() as any;

  // Create a subscription for the customer
  if (growthPlan) {
    const subId = uuid();
    db.run(
      `INSERT OR IGNORE INTO subscriptions (id, user_id, plan_id, status, credits_pool_total, credits_pool_used, billing_cycle_start, billing_cycle_end, auto_refill, refill_threshold)
      VALUES (?, ?, ?, 'active', ?, 35000, datetime('now', 'start of month'), datetime('now', 'start of month', '+1 month', '-1 second'), 1, 20)`,
      subId, customerId, growthPlan.id, growthPlan.pool_credits
    );

    // Link some APIs to the subscription
    const openai = db.prepare("SELECT id FROM api_providers WHERE slug = 'openai'").get() as any;
    const twilio = db.prepare("SELECT id FROM api_providers WHERE slug = 'twilio'").get() as any;
    const stripe = db.prepare("SELECT id FROM api_providers WHERE slug = 'stripe'").get() as any;

    if (openai) {
      db.run('INSERT OR IGNORE INTO subscription_apis (id, subscription_id, provider_id, api_key_label, allocated_credits, credits_used) VALUES (?, ?, ?, ?, ?, ?)',
        uuid(), subId, openai.id, 'OpenAI Production', 400_000, 20000);
    }
    if (twilio) {
      db.run('INSERT OR IGNORE INTO subscription_apis (id, subscription_id, provider_id, api_key_label, allocated_credits, credits_used) VALUES (?, ?, ?, ?, ?, ?)',
        uuid(), subId, twilio.id, 'Twilio SMS', 300_000, 10000);
    }
    if (stripe) {
      db.run('INSERT OR IGNORE INTO subscription_apis (id, subscription_id, provider_id, api_key_label, allocated_credits, credits_used) VALUES (?, ?, ?, ?, ?, ?)',
        uuid(), subId, stripe.id, 'Stripe API', 300_000, 5000);
    }

    // Seed some usage logs for the current month
    const now = new Date();
    for (let day = 1; day <= now.getDate() && day <= 28; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const dateStr = date.toISOString().replace('T', ' ').split('.')[0];
      db.run('INSERT INTO usage_logs (id, subscription_id, provider_id, credits_used, request_count, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
        uuid(), subId, openai.id, Math.floor(Math.random() * 1000) + 200, Math.floor(Math.random() * 500) + 50, dateStr);
      if (day % 2 === 0) {
        db.run('INSERT INTO usage_logs (id, subscription_id, provider_id, credits_used, request_count, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
          uuid(), subId, twilio.id, Math.floor(Math.random() * 500) + 100, Math.floor(Math.random() * 200) + 20, dateStr);
      }
    }
  }

  db.save();

  console.log('[rook-db] Seed complete!');
  console.log('  Admin:  admin@rook.dev / admin123');
  console.log('  Demo:   demo@acmecorp.com / demo1234');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
}).then(() => process.exit(0));