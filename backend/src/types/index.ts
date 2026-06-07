// ============================================================
// Rook Platform - Shared Types
// ============================================================

export interface User {
  id: string;
  email: string;
  company_name: string;
  password_hash: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_fee: number;
  max_apis: number;
  pool_credits: number;
  overage_rate: number;
  markup_pct: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'past_due';
  credits_pool_total: number;
  credits_pool_used: number;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
  auto_refill: number;
  refill_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ApiProvider {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_url: string | null;
  is_active: number;
  created_at: string;
}

export interface SubscriptionApi {
  id: string;
  subscription_id: string;
  provider_id: string;
  api_key_label: string | null;
  allocated_credits: number;
  credits_used: number;
  is_active: number;
  created_at: string;
}

export interface UsageLog {
  id: string;
  subscription_id: string;
  provider_id: string;
  credits_used: number;
  request_count: number;
  cost_usd: number | null;
  recorded_at: string;
}

export interface BillingRecord {
  id: string;
  subscription_id: string;
  user_id: string;
  amount: number;
  base_fee: number;
  overage_fee: number;
  credits_used: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  period_start: string;
  period_end: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  subscription_id: string;
  type: 'low_credits' | 'refill' | 'overage' | 'billing' | 'margin';
  threshold: number | null;
  message: string | null;
  is_triggered: number;
  triggered_at: string | null;
  acknowledged: number;
  created_at: string;
}

// Response types
export interface DashboardSummary {
  user: Pick<User, 'id' | 'email' | 'company_name'>;
  subscription: {
    id: string;
    status: string;
    plan_name: string;
    plan_slug: string;
    monthly_fee: number;
    max_apis: number;
    credits_pool_total: number;
    credits_pool_used: number;
    credits_available: number;
    utilization_pct: number;
    billing_cycle_start: string | null;
    billing_cycle_end: string | null;
    auto_refill: boolean;
    refill_threshold: number;
  };
  apis: Array<{
    provider_id: string;
    provider_name: string;
    provider_slug: string;
    api_key_label: string | null;
    allocated_credits: number;
    credits_used: number;
    utilization_pct: number;
  }>;
  recent_usage: Array<{
    date: string;
    provider_name: string;
    credits_used: number;
  }>;
  alerts: Alert[];
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}