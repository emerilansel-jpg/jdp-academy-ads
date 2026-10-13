export type AppRole = 'owner' | 'marketer' | 'creative' | 'platform_admin';
export type CreativeStatus = 'draft' | 'approved' | 'published' | 'archived';
export type CreativeType = 'image' | 'video' | 'copy_only';
export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type SubscriptionPlan = 'free' | 'starter' | 'growth' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  owner_user_id: string;
  plan_id: SubscriptionPlan;
  status: 'active' | 'trial' | 'past_due' | 'canceled';
  created_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: AppRole;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: SubscriptionPlan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  current_period_end?: string;
}

export interface BrandProfile {
  id: string;
  organization_id: string;
  product_name: string;
  offer: string;
  audience: string;
  value_prop: string;
  tone: string;
  cta: string;
  brand_notes?: string;
  created_at?: string;
}

export interface AdAccount {
  id: string;
  organization_id: string;
  platform: 'meta';
  external_account_id: string;
  account_name: string;
  status: 'connected' | 'disconnected' | 'expired';
  token_reference?: string;
  connected_at: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  ad_account_id: string;
  external_campaign_id?: string;
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  budget: number;
  synced_at?: string;
  created_at?: string;
}

export interface Creative {
  id: string;
  organization_id: string;
  campaign_id?: string;
  type: CreativeType;
  title: string;
  hook?: string;
  angle?: string;
  copy: string;
  asset_url?: string;
  generation_id?: string;
  version: number;
  status: CreativeStatus;
  created_at: string;
  // Performance attribution
  ctr?: number;
  cpc?: number;
  roas?: number;
  conversions?: number;
  spend?: number;
}

export interface Generation {
  id: string;
  organization_id: string;
  creative_id?: string;
  provider: 'openai' | 'gemini' | 'demo';
  model: string;
  prompt: string;
  type: 'copy' | 'image' | 'video';
  status: GenerationStatus;
  provider_job_id?: string;
  result_payload?: any;
  created_at: string;
}

export interface PerformanceSnapshot {
  id: string;
  organization_id: string;
  campaign_id: string;
  creative_id?: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversion_value: number;
  roas: number;
  creative_title?: string;
}

export interface Experiment {
  id: string;
  organization_id: string;
  campaign_id?: string;
  hypothesis: string;
  variants: string[]; // creative_ids
  start_at: string;
  end_at?: string;
  status: 'running' | 'completed' | 'concluded';
  winner_creative_id?: string;
  created_at?: string;
}

export interface Learning {
  id: string;
  organization_id: string;
  experiment_id: string;
  summary: string;
  winning_attributes: {
    attribute: string;
    impact: string;
    correlation: string;
  }[];
  losing_attributes: {
    attribute: string;
    reason: string;
  }[];
  next_hypothesis: string;
  created_at: string;
}

export interface Recommendation {
  id: string;
  organization_id: string;
  source_learning_id?: string;
  type: 'creative_regeneration' | 'audience_shift' | 'budget_reallocation';
  payload: any;
  approval_status: 'pending' | 'approved' | 'rejected';
  executed_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_user_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: any;
  created_at: string;
}
