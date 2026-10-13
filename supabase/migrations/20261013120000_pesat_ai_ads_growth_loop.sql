-- =====================================================================
-- Migration: Pesat AI Ads Growth Loop MVP (Tier 4 Multi-Tenant)
-- Created at: 2026-10-13
-- Scope: Multi-tenant schemas, RLS isolation, Roles & Audit Logging
-- =====================================================================

-- 1. Helper function for RLS: check tenant membership & role
CREATE OR REPLACE FUNCTION public.pesat_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- 2. Organizations
CREATE TABLE IF NOT EXISTS public.pesat_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active', -- active, trial, past_due, canceled
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Memberships (Roles: owner, marketer, creative, platform_admin)
CREATE TABLE IF NOT EXISTS public.pesat_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'marketer', 'creative', 'platform_admin')),
  status text NOT NULL DEFAULT 'active', -- active, invited, suspended
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- 4. Subscriptions (Stripe billing integration)
CREATE TABLE IF NOT EXISTS public.pesat_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'starter', -- free, starter, growth, enterprise
  status text NOT NULL DEFAULT 'active', -- trialing, active, past_due, canceled
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

-- 5. Brand Profiles (Reusable context for AI generation)
CREATE TABLE IF NOT EXISTS public.pesat_brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  offer text NOT NULL,
  audience text NOT NULL,
  value_prop text NOT NULL,
  tone text NOT NULL DEFAULT 'Professional yet friendly',
  cta text NOT NULL DEFAULT 'Mulai Sekarang',
  brand_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Ad Accounts (Meta Ads connection)
CREATE TABLE IF NOT EXISTS public.pesat_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'meta',
  external_account_id text NOT NULL,
  account_name text NOT NULL,
  status text NOT NULL DEFAULT 'connected', -- connected, disconnected, expired
  token_reference text,
  connected_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Campaigns
CREATE TABLE IF NOT EXISTS public.pesat_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  ad_account_id uuid REFERENCES public.pesat_ad_accounts(id) ON DELETE CASCADE,
  external_campaign_id text,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'OUTCOME_LEADS',
  status text NOT NULL DEFAULT 'PAUSED', -- ACTIVE, PAUSED, ARCHIVED
  budget numeric DEFAULT 0,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Creatives (Versioned Assets & Ad Variants)
CREATE TABLE IF NOT EXISTS public.pesat_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.pesat_campaigns(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('image', 'video', 'copy_only')),
  title text NOT NULL,
  hook text,
  angle text,
  copy text NOT NULL,
  asset_url text,
  generation_id uuid,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Generations (AI Generation Jobs & Status)
CREATE TABLE IF NOT EXISTS public.pesat_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  creative_id uuid REFERENCES public.pesat_creatives(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'openai', -- openai, gemini, demo
  model text NOT NULL DEFAULT 'gpt-4o',
  prompt text NOT NULL,
  type text NOT NULL DEFAULT 'copy', -- copy, image, video
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  provider_job_id text,
  result_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Performance Snapshots (Daily / Periodic Metrics)
CREATE TABLE IF NOT EXISTS public.pesat_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.pesat_campaigns(id) ON DELETE CASCADE,
  creative_id uuid REFERENCES public.pesat_creatives(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  cpc numeric NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  conversion_value numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, campaign_id, creative_id, date)
);

-- 11. Experiments (Hypothesis testing cycles)
CREATE TABLE IF NOT EXISTS public.pesat_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.pesat_campaigns(id) ON DELETE SET NULL,
  hypothesis text NOT NULL,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'concluded')),
  winner_creative_id uuid REFERENCES public.pesat_creatives(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Learnings (AI Diagnosis outputs)
CREATE TABLE IF NOT EXISTS public.pesat_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  experiment_id uuid REFERENCES public.pesat_experiments(id) ON DELETE CASCADE,
  summary text NOT NULL,
  winning_attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  losing_attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_hypothesis text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Recommendations / Actions
CREATE TABLE IF NOT EXISTS public.pesat_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  source_learning_id uuid REFERENCES public.pesat_learnings(id) ON DELETE SET NULL,
  type text NOT NULL, -- creative_regeneration, audience_shift, scale_winner
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS public.pesat_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.pesat_organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.pesat_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesat_audit_logs ENABLE ROW LEVEL SECURITY;

-- Security helper to test if current user has access to organization
CREATE OR REPLACE FUNCTION public.pesat_user_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pesat_memberships m
    WHERE m.organization_id = p_org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.pesat_organizations o
    WHERE o.id = p_org_id
      AND o.owner_user_id = auth.uid()
  );
$$;

-- RLS Policies
CREATE POLICY "Users can access their organizations" ON public.pesat_organizations
  FOR ALL USING (public.pesat_user_in_org(id) OR owner_user_id = auth.uid());

CREATE POLICY "Users can view memberships in their orgs" ON public.pesat_memberships
  FOR ALL USING (public.pesat_user_in_org(organization_id) OR user_id = auth.uid());

CREATE POLICY "Org members can view subscriptions" ON public.pesat_subscriptions
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can manage brand profiles" ON public.pesat_brand_profiles
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view and manage ad accounts" ON public.pesat_ad_accounts
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view and manage campaigns" ON public.pesat_campaigns
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view and manage creatives" ON public.pesat_creatives
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view and manage generations" ON public.pesat_generations
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view snapshots" ON public.pesat_performance_snapshots
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view experiments" ON public.pesat_experiments
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view learnings" ON public.pesat_learnings
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view recommendations" ON public.pesat_recommendations
  FOR ALL USING (public.pesat_user_in_org(organization_id));

CREATE POLICY "Org members can view audit logs" ON public.pesat_audit_logs
  FOR ALL USING (public.pesat_user_in_org(organization_id));
