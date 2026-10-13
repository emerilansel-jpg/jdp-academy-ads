import { SubscriptionPlan } from "@/lib/types";

export interface PlanFeature {
  name: string;
  monthlyPrice: number;
  currency: string;
  creativeLimit: number;
  metaAccountLimit: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanFeature> = {
  free: {
    name: "Free Trial",
    monthlyPrice: 0,
    currency: "IDR",
    creativeLimit: 5,
    metaAccountLimit: 1,
    features: [
      "1 Meta Ad Account Connection",
      "5 AI Creative Generations / mo",
      "Standard Copy & Visual Prompts",
      "Basic Analytics Overview",
    ],
  },
  starter: {
    name: "Starter Growth",
    monthlyPrice: 499000,
    currency: "IDR",
    creativeLimit: 30,
    metaAccountLimit: 2,
    features: [
      "Up to 2 Meta Ad Accounts",
      "30 AI Creative Generations / mo",
      "Short-Video 9:16 Scripts & Storyboards",
      "Automated AI Diagnosis & Winner Analysis",
      "Direct Meta 1-Click Publishing",
    ],
  },
  growth: {
    name: "Scale Pro",
    monthlyPrice: 1299000,
    currency: "IDR",
    creativeLimit: 150,
    metaAccountLimit: 5,
    features: [
      "Up to 5 Meta Ad Accounts",
      "150 AI Creative Generations / mo",
      "Unlimited Next-Cycle Regeneration Loops",
      "Continuous Metric Snapshot Sync",
      "Multi-Role Team Collaboration (Owner, Marketer, Creative)",
      "Priority AI Generation Queue",
    ],
  },
  enterprise: {
    name: "Enterprise",
    monthlyPrice: 3499000,
    currency: "IDR",
    creativeLimit: 1000,
    metaAccountLimit: 20,
    features: [
      "Unlimited Meta Ad Accounts",
      "Custom Generative Volume",
      "Dedicated Ad Strategy AI Fine-Tuning",
      "Cross-Tenant Admin API Access",
      "24/7 Dedicated Support",
    ],
  },
};

export class StripeAdapter {
  private secretKey: string;
  private isDemoMode: boolean;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY || "";
    this.isDemoMode = !this.secretKey;
  }

  isDemo(): boolean {
    return this.isDemoMode;
  }

  async createCheckoutSession(params: {
    organizationId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string; isDemo: boolean }> {
    if (this.isDemoMode) {
      // Return simulated checkout redirect
      return {
        url: `${params.successUrl}?session_id=demo_stripe_${Date.now()}&plan=${params.plan}`,
        sessionId: `demo_session_${Date.now()}`,
        isDemo: true,
      };
    }

    try {
      // In live mode with Stripe API
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payment_method_types: "card",
          mode: "subscription",
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          client_reference_id: params.organizationId,
        }),
      });
      const data = await res.json();
      return {
        url: data.url || params.successUrl,
        sessionId: data.id || `session_${Date.now()}`,
        isDemo: false,
      };
    } catch (e) {
      console.warn("Stripe live session error, falling back to simulated checkout:", e);
      return {
        url: `${params.successUrl}?session_id=fallback_${Date.now()}&plan=${params.plan}`,
        sessionId: `fallback_${Date.now()}`,
        isDemo: true,
      };
    }
  }

  canGenerate(currentCount: number, plan: SubscriptionPlan): boolean {
    const limit = PLAN_CONFIGS[plan]?.creativeLimit || 5;
    return currentCount < limit;
  }
}

export const stripeAdapter = new StripeAdapter();
