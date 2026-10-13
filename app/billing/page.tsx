"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkspaceStore } from "@/lib/store";
import { PLAN_CONFIGS, stripeAdapter } from "@/lib/adapters/stripeAdapter";
import { SubscriptionPlan } from "@/lib/types";
import { CreditCard, Check, ArrowRight } from "lucide-react";

export default function BillingPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setStore(new WorkspaceStore());
  }, []);

  if (!store) return null;

  const currentOrg = store.getCurrentOrg();
  const currentPlan = currentOrg.plan_id;
  const currentPlanMeta = PLAN_CONFIGS[currentPlan];

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan);

    await stripeAdapter.createCheckoutSession({
      organizationId: currentOrg.id,
      plan,
      successUrl: `${window.location.origin}/ads/billing?success=true`,
      cancelUrl: `${window.location.origin}/ads/billing`,
    });

    setTimeout(() => {
      store.updateSubscriptionPlan(currentOrg.id, plan);
      setLoadingPlan(null);
      setTick((t) => t + 1);
      alert(`Paket organisasi '${currentOrg.name}' berhasil diperbarui ke '${PLAN_CONFIGS[plan].name}'!`);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar store={store} onStateChange={() => setTick((t) => t + 1)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Workspace Subscription & Entitlements</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola paket langganan organisasi dan kuota volume generasi kreatif AI.
          </p>
        </div>

        {/* Current Subscription Status Banner */}
        <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
              PAKET AKTIF SAAT INI
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{currentPlanMeta.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                Active &bull; Renews Monthly
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Workspace: <strong className="text-slate-800 dark:text-slate-200">{currentOrg.name}</strong> &bull; Kuota:{" "}
              {currentPlanMeta.creativeLimit} AI Generations/bulan
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Biaya Langganan</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {currentPlanMeta.monthlyPrice > 0 ? (
                <>Rp {currentPlanMeta.monthlyPrice.toLocaleString()}<span className="text-xs text-slate-500 dark:text-slate-400 font-normal"> /bulan</span></>
              ) : (
                "Gratis"
              )}
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(["free", "starter", "growth", "enterprise"] as SubscriptionPlan[]).map((planKey) => {
            const plan = PLAN_CONFIGS[planKey];
            const isCurrent = currentPlan === planKey;

            return (
              <div
                key={planKey}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between space-y-6 relative transition shadow-sm ${
                  isCurrent
                    ? "border-purple-500 shadow-md shadow-purple-900/10 ring-1 ring-purple-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    Current Plan
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{plan.name}</h3>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                      {plan.monthlyPrice > 0 ? (
                        <>
                          Rp {plan.monthlyPrice.toLocaleString()}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal"> /bln</span>
                        </>
                      ) : (
                        "Gratis"
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(planKey)}
                  disabled={isCurrent || loadingPlan === planKey}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 ${
                    isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                  }`}
                >
                  <span>
                    {loadingPlan === planKey
                      ? "Memproses..."
                      : isCurrent
                      ? "Paket Aktif"
                      : "Pilih Paket Ini"}
                  </span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
