"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkspaceStore } from "@/lib/store";
import { BarChart3, TrendingUp, DollarSign, Target, MousePointer, Activity } from "lucide-react";

export default function AnalyticsPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);

  useEffect(() => {
    setStore(new WorkspaceStore());
  }, []);

  if (!store) return null;

  const snapshots = store.getSnapshots();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar store={store} onStateChange={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Performance Analytics & ROI Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis metrik konversi, efisiensi belanja iklan, dan perbandingan performa per sudut pandang (angle).
          </p>
        </div>

        {/* Aggregated KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Total Ad Spend</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">Rp 3.500.000</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode: 14 Hari Terakhir</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center space-x-1.5">
              <MousePointer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Total Clicks & CTR</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">2.916 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(2.85%)</span></div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">+110% di atas benchmark</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Verified Leads</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">146 Leads</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">CPA Rata-rata: Rp 23.972</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>ROAS Keseluruhan</span>
            </div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">3.65x</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Omset: Rp 12.775.000</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Breakdown Snapshot per Kreatif</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Meta Graph API v21.0 Connected</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Judul Kreatif</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Spend</th>
                  <th className="py-3 px-3">Impressions</th>
                  <th className="py-3 px-3">Clicks</th>
                  <th className="py-3 px-3">CTR</th>
                  <th className="py-3 px-3">CPC</th>
                  <th className="py-3 px-3">CPM</th>
                  <th className="py-3 px-3">Leads</th>
                  <th className="py-3 px-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{s.creative_title || "Creative"}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{s.date}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">Rp {s.spend.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{s.impressions.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{s.clicks.toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{s.ctr}%</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">Rp {s.cpc.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">Rp {s.cpm.toLocaleString()}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{s.conversions}</td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">{s.roas}x</td>
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
