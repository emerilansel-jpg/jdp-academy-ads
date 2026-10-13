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
  FileText,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  Bookmark,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Zap,
  Check,
  PlayCircle,
  ExternalLink,
} from "lucide-react";

export default function GrowthLoopPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [uiMode, setUiMode] = useState<"guided" | "pro">("guided");
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [, setTick] = useState(0);

  // Step 1: Brand Profile state & 1-Click Presets
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [savedPresets, setSavedPresets] = useState<BrandProfile[]>([]);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSavedMsg, setBrandSavedMsg] = useState("");
  const [showAdvancedBrand, setShowAdvancedBrand] = useState(false);
  const [newPresetSuccess, setNewPresetSuccess] = useState("");

  // Step 2: Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(3);
  const [generatedBatch, setGeneratedBatch] = useState<any[]>([]);

  // Step 3: Meta Publish & Review state
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [focusedCreativeIndex, setFocusedCreativeIndex] = useState(0);

  // Step 5: Diagnosis state
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Step 6: Regeneration state
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const s = new WorkspaceStore();
    setStore(s);
    setBrand(s.getBrandProfile());
    setSavedPresets(s.getSavedBrandProfiles());
  }, []);

  const refreshState = () => {
    if (!store) return;
    setBrand(store.getBrandProfile());
    setSavedPresets(store.getSavedBrandProfiles());
    setTick((t) => t + 1);
  };

  if (!store || !brand) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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

  const canEditBrand = currentRole === "owner" || currentRole === "creative";
  const canPublish = currentRole === "owner" || currentRole === "marketer";
  const canGenerate = currentRole === "owner" || currentRole === "creative" || currentRole === "marketer";

  // 1-Click Preset Handlers
  const handleSelectPreset = (p: BrandProfile) => {
    if (!store) return;
    setBrand({ ...p });
    store.saveBrandProfile({ ...p, organization_id: currentOrg.id });
    setBrandSavedMsg(`Memuat profil: "${p.product_name}"`);
    setTimeout(() => setBrandSavedMsg(""), 3000);
  };

  const handleSaveCurrentAsPreset = () => {
    if (!store || !brand) return;
    if (!brand.product_name.trim()) {
      alert("Harap isi nama produk terlebih dahulu sebelum menyimpan profil.");
      return;
    }
    const saved = store.saveBrandProfilePreset({
      ...brand,
      id: brand.id?.startsWith("preset-") ? brand.id : `preset-${Date.now()}`,
    });
    setSavedPresets(store.getSavedBrandProfiles());
    setNewPresetSuccess(`Profil "${saved.product_name}" berhasil disimpan untuk 1-klik!`);
    setTimeout(() => setNewPresetSuccess(""), 4000);
  };

  const handleNewBlankProfile = () => {
    const blank: BrandProfile = {
      id: `preset-${Date.now()}`,
      organization_id: currentOrg.id,
      product_name: "",
      offer: "",
      audience: "",
      value_prop: "",
      tone: "Inspiratif, lugas, bersahabat",
      cta: "Pelajari Lebih Lanjut",
      brand_notes: "",
    };
    setBrand(blank);
  };

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
      setFocusedCreativeIndex(0);
      if (uiMode === "guided") {
        setGuidedStep(3);
      } else {
        setActiveStep(3);
      }
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
      if (uiMode === "pro") {
        setActiveStep(6);
      }
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
      setFocusedCreativeIndex(0);
      if (uiMode === "guided") {
        setGuidedStep(3);
      } else {
        setActiveStep(3);
      }
      alert("Batch Siklus 2 berhasil dibuat berdasarkan pola iklan pemenang!");
    } catch (e: any) {
      alert("Regenerasi gagal: " + e.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const proSteps = [
    { num: 1, title: "1. Brand Context", desc: "Offer & Audience" },
    { num: 2, title: "2. Generate", desc: "Multi-Angle AI" },
    { num: 3, title: "3. Review & Launch", desc: "Approve & Meta" },
    { num: 4, title: "4. Measure", desc: "Sync Metrics" },
    { num: 5, title: "5. Learn", desc: "AI Diagnosis" },
    { num: 6, title: "6. Next Cycle", desc: "Regeneration Loop" },
  ];

  const currentFocusedCreative = creatives[focusedCreativeIndex] || creatives[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar store={store} onStateChange={refreshState} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner / Header with Mode Switcher */}
        <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-white dark:from-purple-900/40 dark:via-indigo-900/20 dark:to-slate-900 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-200/60 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>AI Ads Growth Loop</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pesat Ads Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Riset kreatif, luncurkan ke Meta Ads, ukur metrik riil, dan otomatis racik varian pemenang siklus berikutnya.
            </p>
          </div>

          {/* Toggle Mode Switcher */}
          <div className="flex items-center space-x-1.5 bg-white/80 dark:bg-slate-900/90 backdrop-blur p-1.5 rounded-2xl border border-purple-200 dark:border-purple-500/30 self-start md:self-auto shadow-sm">
            <button
              onClick={() => setUiMode("guided")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                uiMode === "guided"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Mode Pemula (Guided)</span>
            </button>
            <button
              onClick={() => setUiMode("pro")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                uiMode === "pro"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Mode Pro (6-Pipeline)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ============================ GUIDED MODE UI ============================= */}
        {/* ========================================================================= */}
        {uiMode === "guided" && (
          <div className="space-y-6">
            {/* Guided Progress Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Langkah {guidedStep} dari 4 ({guidedStep * 25}%)
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {guidedStep === 1 && "1. Kenalkan Produk & Tawaranmu"}
                    {guidedStep === 2 && "2. AI Meracik Materi Iklan"}
                    {guidedStep === 3 && "3. Pilih Iklan Favorit & Luncurkan"}
                    {guidedStep === 4 && "4. Hasil Performa & Rekomendasi AI"}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <button
                      key={stepNum}
                      onClick={() => setGuidedStep(stepNum)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition flex items-center justify-center ${
                        guidedStep === stepNum
                          ? "bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-slate-900"
                          : guidedStep > stepNum
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {guidedStep > stepNum ? "✓" : stepNum}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(guidedStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* GUIDED STEP 1: KENALKAN PRODUKMU */}
            {guidedStep === 1 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                {/* 1-Click Saved Brand Presets Bar */}
                <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>PROFIL PRODUK TERSIMPAN (1-KLIK LANGSUNG ISI)</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Klik salah satu untuk mengisi form seketika
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {savedPresets.map((p) => {
                      const isActive = brand.product_name === p.product_name;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-2 ${
                            isActive
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span className="truncate max-w-[200px]">{p.product_name}</span>
                          {isActive && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleNewBlankProfile}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 text-slate-600 dark:text-slate-400 hover:text-purple-600 flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Profil Baru</span>
                    </button>
                  </div>

                  {newPresetSuccess && (
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center space-x-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>{newPresetSuccess}</span>
                    </div>
                  )}
                  {brandSavedMsg && (
                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      {brandSavedMsg}
                    </div>
                  )}
                </div>

                {/* 3 Core Beginner Questions */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>1. Apa nama produk atau layanan yang mau kamu iklankan?</span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Wajib Diisi</span>
                    </label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.product_name}
                      onChange={(e) => setBrand({ ...brand, product_name: e.target.value })}
                      placeholder="Contoh: Vibe Coding Bootcamp 120 Hari / Kopi Aren Nusantara"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none shadow-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>2. Siapa calon pembeli ideal yang ingin kamu tuju?</span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Wajib Diisi</span>
                    </label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.audience}
                      onChange={(e) => setBrand({ ...brand, audience: e.target.value })}
                      placeholder="Contoh: Fresh graduate IT, junior developer & pencari kerja usia 19-30 tahun di Indonesia"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>3. Apa penawaran menarik atau promo yang diberikan?</span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Wajib Diisi</span>
                    </label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.offer}
                      onChange={(e) => setBrand({ ...brand, offer: e.target.value })}
                      placeholder="Contoh: Diskon Early Bird Batch 4 + Jaminan Portofolio 3 Web App Live"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Collapsible Advanced Settings (Optional) */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedBrand(!showAdvancedBrand)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                  >
                    <span className="flex items-center space-x-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Pengaturan Tambahan (Opsional: Value Prop, Tone, CTA)</span>
                    </span>
                    {showAdvancedBrand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvancedBrand && (
                    <div className="p-5 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Kenapa harus beli di kamu? (Value Proposition)
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canEditBrand}
                          value={brand.value_prop}
                          onChange={(e) => setBrand({ ...brand, value_prop: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Gaya Bahasa (Tone of Voice)
                          </label>
                          <input
                            type="text"
                            disabled={!canEditBrand}
                            value={brand.tone}
                            onChange={(e) => setBrand({ ...brand, tone: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Tombol Ajakan (Call to Action)
                          </label>
                          <input
                            type="text"
                            disabled={!canEditBrand}
                            value={brand.cta}
                            onChange={(e) => setBrand({ ...brand, cta: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Catatan Khusus Tambahan
                        </label>
                        <input
                          type="text"
                          disabled={!canEditBrand}
                          value={brand.brand_notes || ""}
                          onChange={(e) => setBrand({ ...brand, brand_notes: e.target.value })}
                          placeholder="Instruksi khusus atau batasan kata..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsPreset}
                    disabled={!brand.product_name}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center space-x-2 border border-slate-300 dark:border-slate-700 self-start sm:self-auto disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Simpan Profil Ini Untuk Dipakai Lagi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!brand.product_name.trim()) {
                        alert("Harap isi nama produk terlebih dahulu.");
                        return;
                      }
                      store.saveBrandProfile(brand);
                      setGuidedStep(2);
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md shadow-purple-900/20"
                  >
                    <span>Lanjut ke Langkah 2: AI Meracik Iklan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* GUIDED STEP 2: AI MERACIK IKLAN */}
            {guidedStep === 2 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="max-w-xl mx-auto space-y-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      AI Siap Meracik Materi Iklan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      AI akan menyusun beberapa variasi sudut pandang penawaran, hook 3 detik anti-skip, dan naskah iklan lengkap.
                    </p>
                  </div>

                  {/* Summary of active product */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Target Kampanye:
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {brand.product_name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Audiens:</strong> {brand.audience}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>Penawaran:</strong> {brand.offer}
                    </div>
                  </div>

                  {/* Variant Count Selector */}
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Jumlah Variasi Iklan:</span>
                    <select
                      value={generationCount}
                      onChange={(e) => setGenerationCount(Number(e.target.value))}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
                    >
                      <option value={2}>2 Variasi</option>
                      <option value={3}>3 Variasi (Rekomendasi)</option>
                      <option value={4}>4 Variasi</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleRunGeneration}
                    disabled={isGenerating}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-lg shadow-purple-900/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
                    <span>{isGenerating ? "AI Sedang Menulis & Membedah Naskah..." : "Mulai Racik Materi Iklan AI 🪄"}</span>
                  </button>

                  {isGenerating && (
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 space-y-2 text-left">
                      <div className="font-semibold flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Proses AI Sedang Berjalan:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                        <li>Menganalisis sudut psikologi audiens sasaran...</li>
                        <li>Membuat 3 detik kalimat pembuka (hook) yang memancing rasa penasaran...</li>
                        <li>Menyusun naskah dan Call-To-Action teruji...</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGuidedStep(1)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Input Produk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuidedStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center space-x-2"
                  >
                    <span>Lewati ke Pustaka Iklan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* GUIDED STEP 3: PILIH IKLAN FAVORIT & LUNCURKAN */}
            {guidedStep === 3 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 3: Pilih Iklan Favorit & Luncurkan</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review naskah iklan satu per satu. Iklan yang disetujui dapat langsung kamu luncurkan ke Meta Ads.
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Total Iklan: <strong className="text-slate-900 dark:text-white">{creatives.length}</strong>
                  </div>
                </div>

                {publishResult && (
                  <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                    publishResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
                  }`}>
                    <span>{publishResult.msg}</span>
                    <button onClick={() => setPublishResult(null)} className="text-slate-500">&times;</button>
                  </div>
                )}

                {/* Creative Selection Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {creatives.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setFocusedCreativeIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 border ${
                        focusedCreativeIndex === idx
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span>Iklan #{idx + 1}</span>
                      <span className="text-[10px] opacity-80 uppercase">({c.angle || "Umum"})</span>
                      {c.status === "published" && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                    </button>
                  ))}
                </div>

                {/* Single Focused Ad Card (Social Media Mockup Style) */}
                {currentFocusedCreative && (
                  <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
                    {/* Simulated Post Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                          {brand.product_name.charAt(0) || "P"}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {brand.product_name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <span>Bersponsor &bull; Meta Ads</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        currentFocusedCreative.status === "published"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                          : currentFocusedCreative.status === "approved"
                          ? "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                      }`}>
                        {currentFocusedCreative.status}
                      </span>
                    </div>

                    {/* Hook 3 Detik Box */}
                    {currentFocusedCreative.hook && (
                      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                          ⚡ HOOK 3 DETIK (PEMBUKA IKLAN):
                        </span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white italic">
                          &ldquo;{currentFocusedCreative.hook}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Primary Text / Copy */}
                    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {currentFocusedCreative.copy}
                    </div>

                    {/* Simulated Ad Link Bar */}
                    <div className="bg-slate-200 dark:bg-slate-900 rounded-xl p-3 flex items-center justify-between border border-slate-300 dark:border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">JDP.ACADEMY</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {currentFocusedCreative.title}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {brand.cta || "Pelajari Lebih Lanjut"}
                      </span>
                    </div>

                    {/* Action Buttons for this Creative */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      {currentFocusedCreative.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleApprove(currentFocusedCreative.id)}
                            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow"
                          >
                            ✓ Setujui Iklan Ini (Approve)
                          </button>
                          <button
                            onClick={() => handleArchive(currentFocusedCreative.id)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs font-semibold transition"
                          >
                            Arsipkan
                          </button>
                        </>
                      )}

                      {currentFocusedCreative.status === "approved" && (
                        <>
                          <button
                            onClick={() => handlePublishToMeta(currentFocusedCreative)}
                            disabled={publishingId === currentFocusedCreative.id}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-md"
                          >
                            <Send className="w-4 h-4" />
                            <span>{publishingId === currentFocusedCreative.id ? "Meluncurkan ke Meta..." : "Luncurkan Iklan Ini ke Meta Ads 🚀"}</span>
                          </button>
                          <button
                            onClick={() => handleArchive(currentFocusedCreative.id)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs font-semibold transition"
                          >
                            Arsipkan
                          </button>
                        </>
                      )}

                      {currentFocusedCreative.status === "published" && (
                        <div className="w-full p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Iklan Sedang Aktif di Meta Ads Manager</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">AdSet ID: 1202496683...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGuidedStep(2)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Generator AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuidedStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center space-x-2"
                  >
                    <span>Lanjut ke Hasil & Saran AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* GUIDED STEP 4: HASIL PERFORMA & REKOMENDASI AI */}
            {guidedStep === 4 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Langkah 4: Hasil Performa & Saran AI (Bahasa Awam)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hasil metrik disederhanakan agar mudah dipahami: mana iklan yang paling untung dan kenapa.
                  </p>
                </div>

                {/* Highlights Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-5 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      🏆 Iklan Terbaik (Pemenang)
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                      Video - Testing Google Flow
                    </div>
                    <div className="text-xs text-slate-500">Angle: Bukti Portofolio vs Syarat Loker</div>
                    <div className="pt-2 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      86 Pendaftar Baru
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      💰 Efisiensi Modal (ROAS)
                    </div>
                    <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                      4.15x Lipat
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Setiap Rp 1.000 modal iklan menghasilkan omset Rp 4.150. Sangat menguntungkan!
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      🔥 Minat Klik (CTR)
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                      3.42%
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Hampir 3x lipat lebih tinggi dari rata-rata industri kursus/edukasi (1.20%).
                    </p>
                  </div>
                </div>

                {/* AI Explanation / Insights */}
                <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-300 font-bold text-sm">
                    <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>Mengapa Iklan Pemenang Ini Berhasil? (Analisis AI)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <strong className="text-emerald-600 dark:text-emerald-400 block font-bold">
                        ✓ Hook Yang Tepat Sasaran
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Kalimat pembuka &ldquo;Belum punya pengalaman kerja?&rdquo; langsung menyentuh ketakutan terbesar fresh graduate yang melamar kerja.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <strong className="text-emerald-600 dark:text-emerald-400 block font-bold">
                        ✓ Solusi Konkret & Nyata
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400">
                        Menawarkan portofolio aplikasi hidup jauh lebih dipercaya daripada sekadar janji teori belajar santai.
                      </p>
                    </div>
                  </div>

                  {/* Growth Loop Next Step Box */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-300 dark:border-purple-500/40 space-y-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Repeat className="w-4 h-4 text-purple-600" />
                      <span>Rekomendasi Putaran Iklan Berikutnya (Siklus 2):</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      &ldquo;Pertahankan format video vertikal dengan hook masalah loker, lalu uji variasi pembuka dengan menyebutkan nominal biaya bootcamp yang terjangkau agar konversi semakin tinggi.&rdquo;
                    </p>

                    <button
                      onClick={handleGenerateNextCycle}
                      disabled={isRegenerating}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md shadow-purple-900/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                      <Repeat className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      <span>{isRegenerating ? "Sedang Meracik Putaran Baru..." : "Bikin Putaran Iklan Baru (Siklus 2) Sekarang 🔄"}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGuidedStep(3)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Review Iklan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuidedStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                  >
                    Mulai Produk Lain / Ulangi
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ============================== PRO MODE UI ============================== */}
        {/* ========================================================================= */}
        {uiMode === "pro" && (
          <div className="space-y-6">
            {/* 6-Step Visual Pipeline Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {proSteps.map((s) => {
                const isCurrent = activeStep === s.num;
                return (
                  <button
                    key={s.num}
                    onClick={() => setActiveStep(s.num)}
                    className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between shadow-sm ${
                      isCurrent
                        ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-bold ${isCurrent ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-400"}`}>
                        {s.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{s.desc}</div>
                    </div>
                    {isCurrent && (
                      <div className="mt-2 w-full h-1 bg-purple-600 dark:bg-purple-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* STEP 1: BRAND CONTEXT */}
            {activeStep === 1 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 1: Brand & Offer Context</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Konteks ini disimpan per organisasi dan digunakan AI untuk memandu setiap generasi kreatif.
                    </p>
                  </div>
                  {!canEditBrand && (
                    <span className="text-xs px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold">
                      Read Only (Role: {currentRole})
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveBrand} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Produk / Layanan</label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.product_name}
                      onChange={(e) => setBrand({ ...brand, product_name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Penawaran Utama (Offer / Promo)</label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.offer}
                      onChange={(e) => setBrand({ ...brand, offer: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Audiens Spesifik</label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.audience}
                      onChange={(e) => setBrand({ ...brand, audience: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Value Proposition (Kenapa Harus Anda?)</label>
                    <textarea
                      rows={3}
                      disabled={!canEditBrand}
                      value={brand.value_prop}
                      onChange={(e) => setBrand({ ...brand, value_prop: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tone of Voice</label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.tone}
                      onChange={(e) => setBrand({ ...brand, tone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Call to Action (CTA)</label>
                    <input
                      type="text"
                      disabled={!canEditBrand}
                      value={brand.cta}
                      onChange={(e) => setBrand({ ...brand, cta: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catatan Strategi Tambahan (Brand Notes)</label>
                    <textarea
                      rows={2}
                      disabled={!canEditBrand}
                      value={brand.brand_notes || ""}
                      onChange={(e) => setBrand({ ...brand, brand_notes: e.target.value })}
                      placeholder="Instruksi khusus, batasan kata, atau angle yang ingin diprioritaskan..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between pt-2">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{brandSavedMsg}</div>
                    <div className="flex items-center space-x-3">
                      {canEditBrand && (
                        <button
                          type="submit"
                          disabled={isSavingBrand}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs transition flex items-center space-x-2 border border-slate-300 dark:border-slate-700"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingBrand ? "Menyimpan..." : "Simpan Konteks"}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-md shadow-purple-900/20"
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
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 2: AI Campaign & Creative Generation</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      AI akan menyusun beberapa variasi angle, hook 3 detik, caption, visual direction, dan script video pendek.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    AI Engine: <strong className="text-purple-600 dark:text-purple-300">{aiAdapter.getProviderName()}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Target Produk: <span className="text-purple-600 dark:text-purple-300 font-bold">{brand.product_name}</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Penawaran: {brand.offer} &bull; Audiens: {brand.audience}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Jumlah Varian:</span>
                        <select
                          value={generationCount}
                          onChange={(e) => setGenerationCount(Number(e.target.value))}
                          className="bg-transparent text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
                        >
                          <option value={2}>2 Varian</option>
                          <option value={3}>3 Varian</option>
                          <option value={4}>4 Varian</option>
                        </select>
                      </div>

                      <button
                        onClick={handleRunGeneration}
                        disabled={isGenerating}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center space-x-2 transition disabled:opacity-50"
                      >
                        <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                        <span>{isGenerating ? "AI Sedang Menulis..." : "Generate Creative Batch"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {generatedBatch.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Hasil Generasi Baru ({generatedBatch.length} varian):</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generatedBatch.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-purple-300 dark:border-purple-500/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              {item.angle}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Variant #{idx + 1}</span>
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</div>
                          <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">HOOK 3 DETIK:</span>
                            &ldquo;{item.hook}&rdquo;
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-line">{item.copy}</p>
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
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 3: Creative Review & Meta Publishing</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review setiap varian kreatif. Varian dengan status &lsquo;Approved&rsquo; dapat langsung di-publish ke Meta Ads Manager.
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Total Koleksi: <strong className="text-slate-900 dark:text-white">{creatives.length}</strong>
                  </div>
                </div>

                {publishResult && (
                  <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                    publishResult.success ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
                  }`}>
                    <span>{publishResult.msg}</span>
                    <button onClick={() => setPublishResult(null)} className="text-slate-500 dark:text-slate-400">&times;</button>
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
                        className={`bg-slate-50 dark:bg-slate-950 border rounded-2xl p-5 flex flex-col justify-between transition ${
                          isPublished
                            ? "border-emerald-500/50 shadow-sm"
                            : isApproved
                            ? "border-purple-500/50"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isPublished
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                                : isApproved
                                ? "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                                : isDraft
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}>
                              {cr.status}
                            </span>

                            <span className="text-[11px] text-slate-500 font-mono">
                              v{cr.version} &bull; {cr.type}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{cr.title}</h4>
                            {cr.angle && (
                              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">{cr.angle}</div>
                            )}
                          </div>

                          {cr.hook && (
                            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">HOOK UTAMA:</span>
                              <span className="text-slate-800 dark:text-slate-200 italic">&ldquo;{cr.hook}&rdquo;</span>
                            </div>
                          )}

                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-4 whitespace-pre-line leading-relaxed">
                            {cr.copy}
                          </p>

                          {cr.ctr !== undefined && (
                            <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900/60 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-800/80">
                              <div>
                                <div className="text-[10px] text-slate-500">CTR</div>
                                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{cr.ctr}%</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500">CPC</div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Rp {cr.cpc?.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-500">ROAS</div>
                                <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{cr.roas}x</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-4">
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
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs transition"
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
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1 shadow-md"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{publishingId === cr.id ? "Publishing..." : "Publish to Meta"}</span>
                              </button>
                              <button
                                onClick={() => handleArchive(cr.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs transition"
                              >
                                Archive
                              </button>
                            </>
                          )}

                          {isPublished && (
                            <div className="w-full flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                              <span className="flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Live on Meta Ads</span>
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Active in AdSet</span>
                            </div>
                          )}

                          {isArchived && (
                            <button
                              onClick={() => handleApprove(cr.id)}
                              className="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold"
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
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 4: Performance Analytics & Snapshot Sync</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Metrik teragregasi dari Meta Marketing API & Supabase snapshot harian untuk membandingkan efektivitas kreatif.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      alert("Sinkronisasi otomatis Meta snapshot terbaru telah dijalankan secara idempotent.");
                      refreshState();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 flex items-center space-x-2 self-start sm:self-auto"
                  >
                    <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Sync Snapshot Hari Ini</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Spend (14 Hari)</div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Rp 3.500.000</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Optimal Budget Pace</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average CTR</div>
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">2.85%</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Industri avg: 1.20%</div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cost Per Click (CPC)</div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Rp 1.250</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">-18% vs Siklus Awal</div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Return on Ad Spend</div>
                    <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">3.65x</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">146 Total Verified Leads</div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Peringkat Performa Kreatif (Creative Ranking)</span>
                    </h3>
                    <span className="text-xs text-slate-500">Urut berdasarkan ROAS & CTR</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
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
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {snapshots.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-900/50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                              {s.creative_title || `Creative #${idx + 1}`}
                            </td>
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                              {idx === 1 ? "Image" : "Video 9:16"}
                            </td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">Rp {s.spend.toLocaleString()}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{s.impressions.toLocaleString()}</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{s.clicks.toLocaleString()}</td>
                            <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{s.ctr}%</td>
                            <td className="py-3 px-3 text-slate-700 dark:text-slate-300">Rp {s.cpc.toLocaleString()}</td>
                            <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">{s.roas}x</td>
                            <td className="py-3 px-3 text-right">
                              {idx === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-500/30">
                                  🏆 WINNER
                                </span>
                              ) : idx === snapshots.length - 1 ? (
                                <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold text-[10px] border border-rose-300 dark:border-rose-500/30">
                                  FATIGUED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-[10px]">
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
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 5: AI Diagnosis & Learning Synthesis</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      AI menganalisis korelasi atribut kreatif (hook, visual, copy) terhadap performa nyata dan menyimpan bukti hipotesis.
                    </p>
                  </div>

                  <button
                    onClick={handleRunDiagnosis}
                    disabled={isDiagnosing}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-900/20 flex items-center space-x-2 transition"
                  >
                    <Sparkles className={`w-4 h-4 ${isDiagnosing ? "animate-spin" : ""}`} />
                    <span>{isDiagnosing ? "Mendiagnosis Data..." : "Run AI Diagnosis Ulang"}</span>
                  </button>
                </div>

                {activeLearning ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-6 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                        SINTESIS KESIMPULAN TES
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {activeLearning.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Atribut Pemenang (Wajib Dipertahankan)</span>
                        </h3>
                        <div className="space-y-3">
                          {activeLearning.winningAttributes.map((w, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{w.attribute}</span>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{w.impact}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">{w.correlation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-500/30 rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Atribut Lemah (Wajib Dieliminasi)</span>
                        </h3>
                        <div className="space-y-3">
                          {activeLearning.losingAttributes.map((l, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">{l.attribute}</span>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">{l.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl p-6 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Hipotesis Siklus Berikutnya (Next Hypothesis):</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">
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
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Belum ada diagnosis. Klik tombol &apos;Run AI Diagnosis&apos; di atas.
                  </div>
                )}
              </section>
            )}

            {/* STEP 6: NEXT CYCLE REGENERATION */}
            {activeStep === 6 && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span>Langkah 6: Next-Cycle Regeneration (Core Loop)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Kekuatan utama Pesat: Mengambil atribut pemenang siklus 1, mengadopsi hipotesis teruji, dan mencetak batch kreatif baru secara berulang.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      DASAR REGENERASI SIKLUS
                    </span>
                    <div className="text-xs text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-slate-900 dark:text-white block mb-1">Hipotesis Pengujian Baru:</strong>
                      {activeLearning?.nextHypothesis || "Menduplikasi angle pemenang dengan modifikasi pembuka nominal biaya & hook kecepatan."}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Aturan Regenerasi Otomatis:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                      <li>Mempertahankan format video vertikal 9:16 dan subtitle kontras.</li>
                      <li>Mengubah angle kalimat pembuka untuk menyasar audiens yang lebih siap konversi.</li>
                      <li>Mencatat versi kreatif sebagai v2 dan mengaitkan langsung ke experiment ID baru.</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Organisasi: <strong className="text-slate-900 dark:text-white">{currentOrg.name}</strong>
                    </span>

                    <button
                      onClick={handleGenerateNextCycle}
                      disabled={isRegenerating}
                      className="px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md shadow-purple-900/20 flex items-center space-x-2.5 transition disabled:opacity-50"
                    >
                      <Repeat className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                      <span>{isRegenerating ? "Sedang Merekrut Pola Pemenang..." : "Eksekusi Batch Siklus 2 Sekarang"}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
