"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkspaceStore } from "@/lib/store";
import { ShieldCheck, Building2, CheckCircle2, AlertCircle, Activity, Clock, Terminal } from "lucide-react";

export default function AdminPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);

  useEffect(() => {
    setStore(new WorkspaceStore());
  }, []);

  if (!store) return null;

  const currentRole = store.getCurrentRole();
  const state = store.getState();
  const allLogs = store.getAllAuditLogs();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar store={store} onStateChange={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Platform Admin Dashboard</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitoring lintas-organisasi (multi-tenant), status integrasi eksternal, dan audit log operasional.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
            Role: {currentRole.toUpperCase()}
          </span>
        </div>

        {/* Integration Health Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Meta Marketing API</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Operational (v21.0)</span>
            </div>
            <div className="text-[11px] text-slate-500">Latency: 142ms &bull; 0 Error 24h</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">AI Engine Provider</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active (Gemini / Synth)</span>
            </div>
            <div className="text-[11px] text-slate-500">Fallback Queue: Ready</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Supabase PostgreSQL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Healthy (RLS Active)</span>
            </div>
            <div className="text-[11px] text-slate-500">Pooler: Connected</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Stripe Billing Webhooks</span>
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            </div>
            <div className="text-sm font-bold text-purple-400 flex items-center space-x-1.5">
              <Activity className="w-4 h-4" />
              <span>Simulated / Test Mode</span>
            </div>
            <div className="text-[11px] text-slate-500">Signature Validator: OK</div>
          </div>
        </div>

        {/* Organizations & Subscriptions List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Daftar Organisasi Pelanggan (Tenants)</span>
            </h2>
            <span className="text-xs text-slate-500">{state.organizations.length} Workspaces Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Organisasi</th>
                  <th className="py-2.5 px-3">ID Tenant</th>
                  <th className="py-2.5 px-3">Paket Langganan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kreatif Aktif</th>
                  <th className="py-2.5 px-3">Dibuat Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.organizations.map((org) => {
                  const orgCreatives = state.creatives.filter((c) => c.organization_id === org.id);
                  return (
                    <tr key={org.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-white">{org.name}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{org.id}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase text-[10px] border border-purple-500/30">
                          {org.plan_id}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">{orgCreatives.length} Assets</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                        {org.created_at.split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Platform Audit Trail (Audit Logs)</span>
            </h2>
            <span className="text-xs text-slate-500">Immutable Security Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Entitas</th>
                  <th className="py-2.5 px-3">Detail Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {allLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 text-slate-400">{log.created_at.replace("T", " ").replace("Z", "")}</td>
                    <td className="py-2.5 px-3 text-purple-300 font-semibold">{log.actor_name || "System"}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.entity_type} ({log.entity_id || "-"})</td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
