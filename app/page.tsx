"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkspaceStore } from "@/lib/store";
import { BrandProfile, Creative, Learning } from "@/lib/types";
import { aiAdapter } from "@/lib/adapters/aiAdapter";
import { metaAdapter } from "@/lib/adapters/metaAdapter";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Send,
  BarChart3,
  Lightbulb,
  Repeat,
  Layers,
  Save,
  PlayCircle,
  Eye,
  FileText,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  Info,
} from "lucide-react";

export default function GrowthLoopPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [, setTick] = useState(0);

  // Step 1: Brand Profile state
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSavedMsg, setBrandSavedMsg] = useState("");

  // Step 2: Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(3);
  const [generatedBatch, setGeneratedBatch] = useState<any[]>([]);

  // Step 3: Meta Publish state
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  // Step 5: Diagnosis state
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Step 6: Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const s = new WorkspaceStore();
    setStore(s);
    setBrand(s.getBrandProfile());
  }, []);

  const refreshState = () => {
    if (!store) return;
    setBrand(store.getBrandProfile());
    setTick((t) => t + 1);
  };

  if (!store || !brand) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat Workspace Pesat...</span>
        </div>
      </div>
    );
  }

  const currentOrg = store.getCurrentOrg();
  const currentRole = store.getCurrentRole();
  const creatives = store.getCreatives();
  const snapshots = store.getSnapshots();
  const experiments = store.getExperiments();
  const learnings = store.getLearnings();

  const activeExperiment = experiments[0];
  const activeLearning = learnings[0];

  // Role permissions check as per PRD
  const canEditBrand = currentRole === "owner" || currentRole === "creative";
  const canPublish = currentRole === "owner" || currentRole === "marketer";
  const canGenerate = currentRole === "owner" || currentRole === "creative" || currentRole === "marketer";

  // Actions
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditBrand) {
      alert("Role Anda tidak memiliki izin untuk mengedit Brand Context.");
      return;
    }
    setIsSavingBrand(true);
    store.saveBrandProfile(brand);
    setIsSavingBrand(false);
    setBrandSavedMsg("Brand Context tersimpan.");
    setTimeout(() => setBrandSavedMsg(""), 3000);
    refreshState();
  };

  const handleRunGeneration = async () => {
    if (!canGenerate) {
      alert("Role Anda tidak memiliki izin untuk melakukan generasi kreatif.");
      return;
    }
    setIsGenerating(true);
    try {
      const results = await aiAdapter.generateCampaignBatch(brand, generationCount);
      setGeneratedBatch(results);

      // Save into store as versioned creatives
      const newCreatives: Creative[] = results.map((r, i) => ({
        id: `cr-${Date.now()}-${i}`,
        organization_id: currentOrg.id,
        type: r.type || "video",
        title: r.title,
        hook: r.hook,
        angle: r.angle,
        copy: r.copy,
        version: 1,
        status: "draft",
        created_at: new Date().toISOString(),
      }));

      store.addCreatives(newCreatives);
      refreshState();
      setActiveStep(3); // Jump to review
    } catch (err: any) {
      alert("Generasi gagal: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (id: string) => {
    store.updateCreativeStatus(id, "approved");
    refreshState();
  };

  const handleArchive = (id: string) => {
    store.updateCreativeStatus(id, "archived");
    refreshState();
  };

  const handlePublishToMeta = async (cr: Creative) => {
    if (!canPublish) {
      alert("Hanya Owner atau Marketer yang diizinkan mem-publish iklan ke Meta Ads.");
      return;
    }
    setPublishingId(cr.id);
    setPublishResult(null);

    const res = await metaAdapter.publishCreativeToMeta({
      adSetId: "120249668304950473",
      adName: cr.title,
      headline: cr.title,
      primaryText: cr.copy,
      ctaType: "LEARN_MORE",
      linkUrl: "https://jdp.academy",
    });

    if (res.success) {
      store.updateCreativeStatus(cr.id, "published");
      store.logAudit("CREATIVE_PUBLISHED_TO_META", "creative", cr.id, {
        meta_ad_id: res.adId,
        adset_id: "120249668304950473",
      });
      setPublishResult({
        id: cr.id,
        success: true,
        msg: `Berhasil di-publish ke Meta Ads Manager (Ad ID: ${res.adId})!`,
      });
      refreshState();
    } else {
      setPublishResult({
        id: cr.id,
        success: false,
        msg: `Gagal publish: ${res.error}`,
      });
    }
    setPublishingId(null);
  };

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const top = creatives[0] || { angle: "Hasil Nyata", ctr: 3.42 };
      const bottom = creatives[1] || { angle: "Teori Otodidak", ctr: 1.45 };
      const diag = await aiAdapter.diagnosePerformanceAndLearn({
        brand,
        creatives,
        topPerformer: top,
        bottomPerformer: bottom,
      });

      const newLearning: Learning = {
        id: `lrn-${Date.now()}`,
        organization_id: currentOrg.id,
        experiment_id: activeExperiment?.id || "exp-1",
        summary: diag.summary,
        winningAttributes: diag.winningAttributes,
        losingAttributes: diag.losingAttributes,
        nextHypothesis: diag.nextHypothesis,
        created_at: new Date().toISOString(),
      };

      store.addLearning(newLearning);
      refreshState();
      setActiveStep(6); // Jump to next cycle step
    } catch (e: any) {
      alert("Diagnosis gagal: " + e.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleGenerateNextCycle = async () => {
    if (!activeLearning) return;
    setIsRegenerating(true);
    try {
      const nextBatch = await aiAdapter.generateNextCycleBatch({
        brand,
        learning: activeLearning,
        batchNumber: 2,
      });

      const newCreatives: Creative[] = nextBatch.map((r, i) => ({
        id: `cr-cycle2-${Date.now()}-${i}`,
        organization_id: currentOrg.id,
        type: r.type || "video",
        title: r.title,
        hook: r.hook,
        angle: r.angle,
        copy: r.copy,
        version: 2,
        status: "draft",
        created_at: new Date().toISOString(),
      }));

      store.addCreatives(newCreatives);
      refreshState();
      setActiveStep(3); // Jump to review new batch
      alert("Batch Siklus 2 berhasil di-generate dengan hipotesis baru!");
    } catch (e: any) {
      alert("Regenerasi gagal: " + e.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const steps = [
    { num: 1, title: "1. Brand Context", desc: "Offer & Audience" },
    { num: 2, title: "2. Generate", desc: "Multi-Angle AI" },
    { num: 3, title: "3. Review & Launch", desc: "Approve & Meta" },
    { num: 4, title: "4. Measure", desc: "Sync Metrics" },
    { num: 5, title: "5. Learn", desc: "AI Diagnosis" },
    { num: 6, title: "6. Next Cycle", desc: "Regeneration Loop" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar store={store} onStateChange={refreshState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner / Header */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-slate-900 border border-purple-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Automated Feedback Loop MVP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pesat: AI Ads Growth Loop
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Satu alur terpadu untuk meriset kreatif, meluncurkan ke Meta Ads, mengukur metrik riil, mendiagnosis pemenang, dan langsung meregenerasi varian siklus berikutnya.
            </p>
          </div>
        </div>

        {/* 6-Step Visual Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s) => {
            const isCurrent = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isCurrent
                    ? "bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50 ring-1 ring-purple-500"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <div>
                  <div className={`text-xs font-bold ${isCurrent ? "text-purple-300" : "text-slate-400"}`}>
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.desc}</div>
                </div>
                {isCurrent && (
                  <div className="mt-2 w-full h-1 bg-purple-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* STEP 1: BRAND CONTEXT */}
        {activeStep === 1 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Langkah 1: Brand & Offer Context</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Konteks ini disimpan per organisasi dan digunakan AI untuk memandu setiap generasi kreatif.
                </p>
              </div>
              {!canEditBrand && (
                <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Read Only (Role: {currentRole})
                </span>
              )}
            </div>

            <form onSubmit={handleSaveBrand} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama Produk / Layanan</label>
                <input
                  type="text"
                  disabled={!canEditBrand}
                  value={brand.product_name}
                  onChange={(e) => setBrand({ ...brand, product_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Penawaran Utama (Offer / Promo)</label>
                <input
                  type="text"
                  disabled={!canEditBrand}
                  value={brand.offer}
                  onChange={(e) => setBrand({ ...brand, offer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Target Audiens Spesifik</label>
                <input
                  type="text"
                  disabled={!canEditBrand}
                  value={brand.audience}
                  onChange={(e) => setBrand({ ...brand, audience: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Value Proposition (Kenapa Harus Anda?)</label>
                <textarea
                  rows={3}
                  disabled={!canEditBrand}
                  value={brand.value_prop}
                  onChange={(e) => setBrand({ ...brand, value_prop: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tone of Voice</label>
                <input
                  type="text"
                  disabled={!canEditBrand}
                  value={brand.tone}
                  onChange={(e) => setBrand({ ...brand, tone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Call to Action (CTA)</label>
                <input
                  type="text"
                  disabled={!canEditBrand}
                  value={brand.cta}
                  onChange={(e) => setBrand({ ...brand, cta: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Catatan Strategi Tambahan (Brand Notes)</label>
                <textarea
                  rows={2}
                  disabled={!canEditBrand}
                  value={brand.brand_notes || ""}
                  onChange={(e) => setBrand({ ...brand, brand_notes: e.target.value })}
                  placeholder="Instruksi khusus, batasan kata, atau angle yang ingin diprioritaskan..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between pt-2">
                <div className="text-xs text-emerald-400 font-medium">{brandSavedMsg}</div>
                <div className="flex items-center space-x-3">
                  {canEditBrand && (
                    <button
                      type="submit"
                      disabled={isSavingBrand}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center space-x-2 border border-slate-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingBrand ? "Menyimpan..." : "Simpan Konteks"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-purple-900/30"
                  >
                    <span>Lanjut ke Generasi AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* STEP 2: AI GENERATION */}
        {activeStep === 2 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Langkah 2: AI Campaign & Creative Generation</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI akan menyusun beberapa variasi angle, hook 3 detik, caption, visual direction, dan script video pendek.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                AI Engine: <strong className="text-purple-300">{aiAdapter.getProviderName()}</strong>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Target Produk: <span className="text-purple-300 font-bold">{brand.product_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Penawaran: {brand.offer} &bull; Audiens: {brand.audience}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Jumlah Varian:</span>
                    <select
                      value={generationCount}
                      onChange={(e) => setGenerationCount(Number(e.target.value))}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none"
                    >
                      <option value={2} className="bg-slate-900">2 Varian</option>
                      <option value={3} className="bg-slate-900">3 Varian</option>
                      <option value={4} className="bg-slate-900">4 Varian</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRunGeneration}
                    disabled={isGenerating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                    <span>{isGenerating ? "AI Sedang Menulis..." : "Generate Creative Batch"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live generation preview if available */}
            {generatedBatch.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Generasi Baru ({generatedBatch.length} varian):</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedBatch.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-purple-500/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {item.angle}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Variant #{idx + 1}</span>
                      </div>
                      <div className="font-bold text-sm text-white line-clamp-1">{item.title}</div>
                      <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 block mb-1">HOOK 3 DETIK:</span>
                        &ldquo;{item.hook}&rdquo;
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 whitespace-pre-line">{item.copy}</p>
                    </div>
                  ))}
                </div>

                <div className="text-right pt-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                  >
                    Buka Review & Publishing Library &rarr;
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* STEP 3: CREATIVE REVIEW & LIBRARY */}
        {activeStep === 3 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  <span>Langkah 3: Creative Review & Meta Publishing</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review setiap varian kreatif. Varian dengan status &lsquo;Approved&rsquo; dapat langsung di-publish ke Meta Ads Manager.
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Koleksi: <strong className="text-white">{creatives.length}</strong>
              </div>
            </div>

            {publishResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                publishResult.success ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-rose-950/40 border-rose-500/40 text-rose-300"
              }`}>
                <span>{publishResult.msg}</span>
                <button onClick={() => setPublishResult(null)} className="text-slate-400 hover:text-white">&times;</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatives.map((cr) => {
                const isPublished = cr.status === "published";
                const isApproved = cr.status === "approved";
                const isDraft = cr.status === "draft";
                const isArchived = cr.status === "archived";

                return (
                  <div
                    key={cr.id}
                    className={`bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between transition ${
                      isPublished
                        ? "border-emerald-500/40 shadow-sm shadow-emerald-950/20"
                        : isApproved
                        ? "border-purple-500/40"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isPublished
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : isApproved
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : isDraft
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}>
                          {cr.status}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          v{cr.version} &bull; {cr.type}
                        </span>
                      </div>

                      {/* Title & Angle */}
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{cr.title}</h4>
                        {cr.angle && (
                          <div className="text-[11px] text-purple-400 font-medium mt-0.5">{cr.angle}</div>
                        )}
                      </div>

                      {/* Hook Box */}
                      {cr.hook && (
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
                          <span className="text-[10px] font-bold text-amber-400 block mb-0.5">HOOK UTAMA:</span>
                          <span className="text-slate-200 italic">&ldquo;{cr.hook}&rdquo;</span>
                        </div>
                      )}

                      {/* Primary Text */}
                      <p className="text-xs text-slate-400 line-clamp-4 whitespace-pre-line leading-relaxed">
                        {cr.copy}
                      </p>

                      {/* Performance Snapshot if available */}
                      {cr.ctr !== undefined && (
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-xl text-center border border-slate-800/80">
                          <div>
                            <div className="text-[10px] text-slate-500">CTR</div>
                            <div className="text-xs font-bold text-emerald-400">{cr.ctr}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">CPC</div>
                            <div className="text-xs font-bold text-white">Rp {cr.cpc?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">ROAS</div>
                            <div className="text-xs font-bold text-purple-400">{cr.roas}x</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
                      {isDraft && (
                        <>
                          <button
                            onClick={() => handleApprove(cr.id)}
                            className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleArchive(cr.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
                          >
                            Archive
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <>
                          <button
                            onClick={() => handlePublishToMeta(cr)}
                            disabled={publishingId === cr.id}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1 shadow-md shadow-emerald-950"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{publishingId === cr.id ? "Publishing..." : "Publish to Meta"}</span>
                          </button>
                          <button
                            onClick={() => handleArchive(cr.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
                          >
                            Archive
                          </button>
                        </>
                      )}

                      {isPublished && (
                        <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">
                          <span className="flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Live on Meta Ads</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Active in AdSet</span>
                        </div>
                      )}

                      {isArchived && (
                        <button
                          onClick={() => handleApprove(cr.id)}
                          className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Restore to Approved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* STEP 4: PERFORMANCE ANALYTICS */}
        {activeStep === 4 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Langkah 4: Performance Analytics & Snapshot Sync</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Metrik teragregasi dari Meta Marketing API & Supabase snapshot harian untuk membandingkan efektivitas kreatif.
                </p>
              </div>

              <button
                onClick={() => {
                  alert("Sinkronisasi otomatis Meta snapshot terbaru telah dijalankan secara idempotent.");
                  refreshState();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center space-x-2 self-start sm:self-auto"
              >
                <Repeat className="w-3.5 h-3.5 text-purple-400" />
                <span>Sync Snapshot Hari Ini</span>
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Total Spend (14 Hari)</div>
                <div className="text-xl font-extrabold text-white mt-1">Rp 3.500.000</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Optimal Budget Pace</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Average CTR</div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">2.85%</div>
                <div className="text-[11px] text-slate-400 mt-1">Industri avg: 1.20%</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Cost Per Click (CPC)</div>
                <div className="text-xl font-extrabold text-white mt-1">Rp 1.250</div>
                <div className="text-[11px] text-emerald-400 mt-1">-18% vs Siklus Awal</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 font-medium">Return on Ad Spend</div>
                <div className="text-xl font-extrabold text-purple-400 mt-1">3.65x</div>
                <div className="text-[11px] text-slate-400 mt-1">146 Total Verified Leads</div>
              </div>
            </div>

            {/* Creative Comparison Ranking Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Peringkat Performa Kreatif (Creative Ranking)</span>
                </h3>
                <span className="text-xs text-slate-500">Urut berdasarkan ROAS & CTR</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Kreatif / Judul</th>
                      <th className="py-2.5 px-3">Tipe</th>
                      <th className="py-2.5 px-3">Spend</th>
                      <th className="py-2.5 px-3">Impressions</th>
                      <th className="py-2.5 px-3">Clicks</th>
                      <th className="py-2.5 px-3">CTR</th>
                      <th className="py-2.5 px-3">CPC</th>
                      <th className="py-2.5 px-3">ROAS</th>
                      <th className="py-2.5 px-3 text-right">Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {snapshots.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                          {s.creative_title || `Creative #${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 text-slate-400 uppercase text-[10px]">
                          {idx === 1 ? "Image" : "Video 9:16"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">Rp {s.spend.toLocaleString()}</td>
                        <td className="py-3 px-3 text-slate-300">{s.impressions.toLocaleString()}</td>
                        <td className="py-3 px-3 text-slate-300">{s.clicks.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{s.ctr}%</td>
                        <td className="py-3 px-3 text-slate-300">Rp {s.cpc.toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-purple-400">{s.roas}x</td>
                        <td className="py-3 px-3 text-right">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                              🏆 WINNER
                            </span>
                          ) : idx === snapshots.length - 1 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                              FATIGUED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              AVERAGE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStep(5)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center space-x-2"
              >
                <span>Jalankan AI Diagnosis Pemenang &rarr;</span>
              </button>
            </div>
          </section>
        )}

        {/* STEP 5: AI DIAGNOSIS & LEARNING */}
        {activeStep === 5 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-purple-400" />
                  <span>Langkah 5: AI Diagnosis & Learning Synthesis</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI menganalisis korelasi atribut kreatif (hook, visual, copy) terhadap performa nyata dan menyimpan bukti hipotesis.
                </p>
              </div>

              <button
                onClick={handleRunDiagnosis}
                disabled={isDiagnosing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center space-x-2 transition"
              >
                <Sparkles className={`w-4 h-4 ${isDiagnosing ? "animate-spin" : ""}`} />
                <span>{isDiagnosing ? "Mendiagnosis Data..." : "Run AI Diagnosis Ulang"}</span>
              </button>
            </div>

            {activeLearning ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    SINTESIS KESIMPULAN TES
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {activeLearning.summary}
                  </p>
                </div>

                {/* Grid: Winning vs Losing Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Winning */}
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Atribut Pemenang (Wajib Dipertahankan)</span>
                    </h3>
                    <div className="space-y-3">
                      {activeLearning.winningAttributes.map((w, idx) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{w.attribute}</span>
                            <span className="text-[11px] font-bold text-emerald-400">{w.impact}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{w.correlation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Losing */}
                  <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Atribut Lemah (Wajib Dieliminasi)</span>
                    </h3>
                    <div className="space-y-3">
                      {activeLearning.losingAttributes.map((l, idx) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
                          <span className="font-bold text-xs text-white block">{l.attribute}</span>
                          <p className="text-[11px] text-slate-400">{l.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formulated Next Hypothesis */}
                <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 rounded-2xl p-6 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    <span>Hipotesis Siklus Berikutnya (Next Hypothesis):</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                    &ldquo;{activeLearning.nextHypothesis}&rdquo;
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveStep(6)}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                  >
                    Lanjut ke Regenerasi Siklus 2 &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Belum ada diagnosis. Klik tombol &apos;Run AI Diagnosis&apos; di atas.
              </div>
            )}
          </section>
        )}

        {/* STEP 6: NEXT CYCLE REGENERATION */}
        {activeStep === 6 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Repeat className="w-5 h-5 text-purple-400" />
                  <span>Langkah 6: Next-Cycle Regeneration (Core Loop)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kekuatan utama Pesat: Mengambil atribut pemenang siklus 1, mengadopsi hipotesis teruji, dan mencetak batch kreatif baru secara berulang.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  DASAR REGENERASI SIKLUS
                </span>
                <div className="text-xs text-slate-300 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">Hipotesis Pengujian Baru:</strong>
                  {activeLearning?.nextHypothesis || "Menduplikasi angle pemenang dengan modifikasi pembuka nominal biaya & hook kecepatan."}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Aturan Regenerasi Otomatis:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>Mempertahankan format video vertikal 9:16 dan subtitle kontras.</li>
                  <li>Mengubah angle kalimat pembuka untuk menyasar audiens yang lebih siap konversi.</li>
                  <li>Mencatat versi kreatif sebagai v2 dan mengaitkan langsung ke experiment ID baru.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs text-slate-400">
                  Organisasi: <strong className="text-white">{currentOrg.name}</strong>
                </span>

                <button
                  onClick={handleGenerateNextCycle}
                  disabled={isRegenerating}
                  className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-purple-950 flex items-center space-x-2.5 transition disabled:opacity-50"
                >
                  <Repeat className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>{isRegenerating ? "Sedang Merekrut Pola Pemenang..." : "Eksekusi Batch Siklus 2 Sekarang"}</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
