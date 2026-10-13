import {
  Organization,
  Membership,
  BrandProfile,
  AdAccount,
  Campaign,
  Creative,
  PerformanceSnapshot,
  Experiment,
  Learning,
  Recommendation,
  AuditLog,
  AppRole,
  SubscriptionPlan,
} from "./types";
import { aiAdapter } from "./adapters/aiAdapter";
import { metaAdapter } from "./adapters/metaAdapter";

const STORAGE_KEY = "pesat_workspace_state_v1";

export interface WorkspaceState {
  currentOrgId: string;
  currentUserRole: AppRole;
  currentUserId: string;
  organizations: Organization[];
  memberships: Membership[];
  brandProfiles: Record<string, BrandProfile>; // orgId -> profile
  savedBrandProfiles?: BrandProfile[];
  adAccounts: AdAccount[];
  campaigns: Campaign[];
  creatives: Creative[];
  snapshots: PerformanceSnapshot[];
  experiments: Experiment[];
  learnings: Learning[];
  recommendations: Recommendation[];
  auditLogs: AuditLog[];
}

export const INITIAL_DEMO_STATE: WorkspaceState = {
  currentOrgId: "org-jdp-101",
  currentUserRole: "owner",
  currentUserId: "user-emeril-1",
  organizations: [
    {
      id: "org-jdp-101",
      name: "JDP Academy (PT Vibe Edukasi Indonesia)",
      owner_user_id: "user-emeril-1",
      plan_id: "growth",
      status: "active",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "org-client-202",
      name: "Kopi Kenangan Nusantara (Client Sandbox)",
      owner_user_id: "user-emeril-1",
      plan_id: "starter",
      status: "active",
      created_at: "2026-10-01T14:30:00Z",
    },
  ],
  memberships: [
    {
      id: "mem-1",
      organization_id: "org-jdp-101",
      user_id: "user-emeril-1",
      role: "owner",
      status: "active",
      user_name: "Emeril Ansel",
      user_email: "emerilansel@gmail.com",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "mem-2",
      organization_id: "org-jdp-101",
      user_id: "user-marketer-2",
      role: "marketer",
      status: "active",
      user_name: "Jessica Amber (Meta Lead)",
      user_email: "jessica@jdp.academy",
      created_at: "2026-09-05T11:00:00Z",
    },
    {
      id: "mem-3",
      organization_id: "org-jdp-101",
      user_id: "user-creative-3",
      role: "creative",
      status: "active",
      user_name: "Budi Copywriter",
      user_email: "budi@jdp.academy",
      created_at: "2026-09-10T09:15:00Z",
    },
  ],
  brandProfiles: {
    "org-jdp-101": {
      id: "brand-1",
      organization_id: "org-jdp-101",
      product_name: "Vibe Coding Bootcamp 120 Hari",
      offer: "Diskon Early Bird Batch 4 + Jaminan Portofolio 3 Web App Live",
      audience: "Fresh graduate IT, junior developer & career switchers usia 19-32 tahun di Indonesia",
      value_prop: "Belajar coding modern mengarahkan AI (LLM / Vibe Coding) dari problem framing sampai deployment nyata tanpa hafalan sintaks rumit",
      tone: "Inspiratif, lugas, anti-basa-basi, empati pada tantangan loker entry-level",
      cta: "Mulai Bangun Portofolio Sekarang",
      brand_notes: "Fokuskan pada kontras antara 'Loker Minta Pengalaman 1 Tahun' vs 'Pengalaman Dibangun Lewat Karya Nyata'.",
    },
  },
  savedBrandProfiles: [
    {
      id: "preset-jdp-1",
      organization_id: "org-jdp-101",
      product_name: "Vibe Coding Bootcamp 120 Hari",
      offer: "Diskon Early Bird Batch 4 + Jaminan Portofolio 3 Web App Live",
      audience: "Fresh graduate IT, junior developer & career switchers usia 19-32 tahun di Indonesia",
      value_prop: "Belajar coding modern mengarahkan AI (LLM / Vibe Coding) dari problem framing sampai deployment nyata tanpa hafalan sintaks rumit",
      tone: "Inspiratif, lugas, anti-basa-basi, empati pada tantangan loker entry-level",
      cta: "Mulai Bangun Portofolio Sekarang",
      brand_notes: "Fokuskan pada kontras antara 'Loker Minta Pengalaman 1 Tahun' vs 'Pengalaman Dibangun Lewat Karya Nyata'.",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "preset-coffee-2",
      organization_id: "org-jdp-101",
      product_name: "Kopi Kenangan Nusantara Promo Bundle",
      offer: "Beli 2 Gratis 1 + Gratis Ongkir Seluruh Jakarta",
      audience: "Pekerja kantoran, mahasiswa, dan penikmat kopi susu usia 20-35 tahun",
      value_prop: "Kopi arabika asli nusantara dengan gula aren premium segar siap antar 15 menit",
      tone: "Ceria, santai, menggugah selera, kasual anak muda",
      cta: "Pesan Sekarang di Aplikasi",
      brand_notes: "Highlight kesegaran es kopi di jam ngantuk kantor (13:00 - 15:00).",
      created_at: "2026-10-01T14:30:00Z",
    },
    {
      id: "preset-saas-3",
      organization_id: "org-jdp-101",
      product_name: "Pesat AI Ads Generator (SaaS)",
      offer: "Coba Gratis 14 Hari Tanpa Kartu Kredit",
      audience: "Digital agency, media buyer, pemilik brand e-commerce di Indonesia",
      value_prop: "Buat puluhan varian hook iklan Meta Ads berbasis formula pemenang hanya dalam 60 detik",
      tone: "Data-driven, solutif, percaya diri, efisien",
      cta: "Coba Generator Gratis Sekarang",
      brand_notes: "Tekankan penghematan waktu copywriter & media buyer dari 5 jam jadi 5 menit.",
      created_at: "2026-10-05T09:00:00Z",
    },
  ],
  adAccounts: [
    {
      id: "act-1",
      organization_id: "org-jdp-101",
      platform: "meta",
      external_account_id: "act_983727121349868",
      account_name: "Jessica Amber - JDP Academy Primary Ads",
      status: "connected",
      token_reference: "META_ACCESS_TOKEN",
      connected_at: "2026-09-02T08:00:00Z",
    },
  ],
  campaigns: [
    {
      id: "camp-1",
      organization_id: "org-jdp-101",
      ad_account_id: "act-1",
      external_campaign_id: "120249668304940473",
      name: "[Cycle 1] Vibe Coding - Fresh Graduate Portofolio",
      objective: "OUTCOME_LEADS",
      status: "ACTIVE",
      budget: 3500000,
      synced_at: "2026-10-12T18:00:00Z",
      created_at: "2026-10-01T00:00:00Z",
    },
  ],
  creatives: [
    {
      id: "cr-1",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      type: "video",
      title: "Video - Testing Google Flow w subtitle (Fresh Grad 18-28)",
      hook: "Belum punya pengalaman kerja? Justru aplikasi bikinan sendiri bisa kamu tunjukin pas ngelamar.",
      angle: "Bukti Portofolio vs Syarat Loker",
      copy: "Lowongan junior programmer minta pengalaman 1 tahun, padahal kamu baru wisuda. Pengalaman itu bisa kamu bangun sendiri lewat aplikasi yang kamu bikin. Di Vibe Coding Bootcamp, kamu belajar ngarahin AI bikin aplikasi lewat alur Build, Review, Revisi sampai jadi portofolio.\n\nVibe Coding Bootcamp, 120 hari.\nPengalaman pertamamu bisa mulai dibangun dari sekarang.\nFresh graduate juga? Mulai di jdp.academy",
      asset_url: "https://scontent-cgk2-1.xx.fbcdn.net/v/t15.5256-10/843458851_1773695820604149_3561687325394712335_n.jpg",
      version: 1,
      status: "published",
      created_at: "2026-10-02T10:00:00Z",
      ctr: 3.42,
      cpc: 1080,
      roas: 4.15,
      conversions: 86,
      spend: 1850000,
    },
    {
      id: "cr-2",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      type: "image",
      title: "Statik - Teori Otodidak vs Jalur Terpadu",
      hook: "Stop buang waktu 6 bulan belajar otodidak tanpa arah.",
      angle: "Efisiensi Waktu & Mentor Langsung",
      copy: "Capek nonton ratusan video tutorial YouTube tanpa tahu apa yang harus dibikin? Di JDP Academy kamu belajar sistematis dengan bimbingan mentor sampai kamu lulus dengan kredensial terverifikasi.",
      version: 1,
      status: "published",
      created_at: "2026-10-02T10:30:00Z",
      ctr: 1.45,
      cpc: 2150,
      roas: 1.82,
      conversions: 18,
      spend: 950000,
    },
    {
      id: "cr-3",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      type: "video",
      title: "Video - 92% Alumni Launching App di Hari ke-30",
      hook: "92% orang yang gak punya latar belakang IT bisa rilis web app pertama mereka di sini.",
      angle: "Social Proof & Validasi Cepat",
      copy: "Gak perlu jenius matematika untuk bikin software bermanfaat di era AI. Yang kamu butuhin adalah logika pemecahan masalah dan kemampuan berkomunikasi dengan AI model.",
      version: 1,
      status: "approved",
      created_at: "2026-10-05T14:00:00Z",
      ctr: 2.91,
      cpc: 1320,
      roas: 3.2,
      conversions: 42,
      spend: 700000,
    },
  ],
  snapshots: [
    {
      id: "snap-1",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      creative_id: "cr-1",
      date: "2026-10-12",
      spend: 1850000,
      impressions: 54100,
      clicks: 1850,
      ctr: 3.42,
      cpc: 1000,
      cpm: 34195,
      conversions: 86,
      conversion_value: 7680000,
      roas: 4.15,
      creative_title: "Video - Testing Google Flow w subtitle",
    },
    {
      id: "snap-2",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      creative_id: "cr-2",
      date: "2026-10-12",
      spend: 950000,
      impressions: 30400,
      clicks: 441,
      ctr: 1.45,
      cpc: 2154,
      cpm: 31250,
      conversions: 18,
      conversion_value: 1729000,
      roas: 1.82,
      creative_title: "Statik - Teori Otodidak vs Jalur Terpadu",
    },
    {
      id: "snap-3",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      creative_id: "cr-3",
      date: "2026-10-12",
      spend: 700000,
      impressions: 21500,
      clicks: 625,
      ctr: 2.91,
      cpc: 1120,
      cpm: 32558,
      conversions: 42,
      conversion_value: 2240000,
      roas: 3.2,
      creative_title: "Video - 92% Alumni Launching App",
    },
  ],
  experiments: [
    {
      id: "exp-1",
      organization_id: "org-jdp-101",
      campaign_id: "camp-1",
      hypothesis: "Konten video vertikal dengan hook kontras syarat kerja ('Minimal 1 Tahun Exp') akan mengungguli materi statis minimal 2x lipat pada metrik CTR.",
      variants: ["cr-1", "cr-2", "cr-3"],
      start_at: "2026-10-02T10:00:00Z",
      end_at: "2026-10-12T18:00:00Z",
      status: "completed",
      winner_creative_id: "cr-1",
      created_at: "2026-10-02T09:00:00Z",
    },
  ],
  learnings: [
    {
      id: "lrn-1",
      organization_id: "org-jdp-101",
      experiment_id: "exp-1",
      summary: "Iklan Video Varian 1 (Portofolio vs Loker) mutlak memenangkan siklus pengujian dengan CTR 3.42% dan ROAS 4.15x. Hook 3 detik pertama terbukti menghentikan scroll fresh graduate. Format statis terbukti kalah bersaing.",
      winningAttributes: [
        {
          attribute: "Hook 'Syarat Loker 1 Tahun vs Karya Nyata'",
          impact: "+135% CTR dibanding varian statis",
          correlation: "Menyentuh langsung frustrasi audiens yang fresh graduate."
        },
        {
          attribute: "Format Video 9:16 dengan Subtitle Besar",
          impact: "Engagement Rate 8.4%",
          correlation: "Audiens Instagram Reels menonton hingga detik ke-18."
        }
      ],
      losingAttributes: [
        {
          attribute: "Format Desain Grafis Statis 1:1",
          reason: "Kurang dinamis untuk audiens muda dan biaya per klik 2x lebih mahal."
        }
      ],
      nextHypothesis: "Jika kita mempertahankan premis 'Pengalaman Dibangun Sendiri' namun membuka dengan pertanyaan nominal ('Berapa modal bikin 3 aplikasi portofolio?'), maka rasio konversi leads akan meningkat 25% lebih tinggi.",
      created_at: "2026-10-12T19:00:00Z",
    },
  ],
  recommendations: [
    {
      id: "rec-1",
      organization_id: "org-jdp-101",
      source_learning_id: "lrn-1",
      type: "creative_regeneration",
      payload: {
        action: "generate_next_cycle",
        base_creative_id: "cr-1",
        target_focus: "Refined Hook with Cost-to-value angle",
      },
      approval_status: "pending",
      created_at: "2026-10-12T19:30:00Z",
    },
  ],
  auditLogs: [
    {
      id: "log-1",
      organization_id: "org-jdp-101",
      actor_user_id: "user-emeril-1",
      actor_name: "Emeril Ansel",
      action: "WORKSPACE_INITIALIZED",
      entity_type: "organization",
      entity_id: "org-jdp-101",
      created_at: "2026-09-01T10:00:00Z",
    },
    {
      id: "log-2",
      organization_id: "org-jdp-101",
      actor_user_id: "user-emeril-1",
      actor_name: "Emeril Ansel",
      action: "META_ACCOUNT_CONNECTED",
      entity_type: "ad_account",
      entity_id: "act_983727121349868",
      created_at: "2026-09-02T08:00:00Z",
    },
    {
      id: "log-3",
      organization_id: "org-jdp-101",
      actor_user_id: "user-marketer-2",
      actor_name: "Jessica Amber",
      action: "CREATIVE_PUBLISHED_TO_META",
      entity_type: "creative",
      entity_id: "cr-1",
      metadata: { adset_id: "120250014768730473" },
      created_at: "2026-10-02T10:15:00Z",
    },
    {
      id: "log-4",
      organization_id: "org-jdp-101",
      actor_user_id: "system",
      actor_name: "Pesat AI Diagnoser",
      action: "EXPERIMENT_EVALUATED",
      entity_type: "experiment",
      entity_id: "exp-1",
      created_at: "2026-10-12T19:00:00Z",
    },
  ],
};

export class WorkspaceStore {
  private state: WorkspaceState;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch {
          this.state = INITIAL_DEMO_STATE;
        }
      } else {
        this.state = INITIAL_DEMO_STATE;
      }
    } else {
      this.state = INITIAL_DEMO_STATE;
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  getState(): WorkspaceState {
    return this.state;
  }

  getCurrentOrg(): Organization {
    return (
      this.state.organizations.find((o) => o.id === this.state.currentOrgId) ||
      this.state.organizations[0]
    );
  }

  getCurrentRole(): AppRole {
    return this.state.currentUserRole;
  }

  switchOrg(orgId: string) {
    this.state.currentOrgId = orgId;
    this.persist();
  }

  switchRole(role: AppRole) {
    this.state.currentUserRole = role;
    this.persist();
  }

  getBrandProfile(orgId?: string): BrandProfile {
    const id = orgId || this.state.currentOrgId;
    return (
      this.state.brandProfiles[id] || {
        id: `brand-${Date.now()}`,
        organization_id: id,
        product_name: "Produk Baru",
        offer: "Penawaran Menarik",
        audience: "Target Market",
        value_prop: "Nilai Unggul Produk",
        tone: "Profesional dan Bersahabat",
        cta: "Beli Sekarang",
        brand_notes: "",
      }
    );
  }

  saveBrandProfile(profile: BrandProfile) {
    this.state.brandProfiles[profile.organization_id] = profile;
    this.logAudit("BRAND_PROFILE_UPDATED", "brand_profile", profile.id);
    this.persist();
  }

  getSavedBrandProfiles(): BrandProfile[] {
    if (!this.state.savedBrandProfiles || this.state.savedBrandProfiles.length === 0) {
      this.state.savedBrandProfiles = [...(INITIAL_DEMO_STATE.savedBrandProfiles || [])];
      this.persist();
    }
    return this.state.savedBrandProfiles;
  }

  saveBrandProfilePreset(profile: Omit<BrandProfile, "id"> & { id?: string }): BrandProfile {
    const profiles = [...this.getSavedBrandProfiles()];
    const existingIndex = profile.id ? profiles.findIndex((p) => p.id === profile.id) : -1;

    const saved: BrandProfile = {
      ...profile,
      id: profile.id || `preset-${Date.now()}`,
      created_at: profile.created_at || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = saved;
    } else {
      profiles.unshift(saved);
    }

    this.state.savedBrandProfiles = profiles;
    this.state.brandProfiles[this.state.currentOrgId] = saved;
    this.logAudit("BRAND_PROFILE_PRESET_SAVED", "brand_profile", saved.id, {
      product_name: saved.product_name,
    });
    this.persist();
    return saved;
  }

  deleteBrandProfilePreset(id: string) {
    if (!this.state.savedBrandProfiles) return;
    this.state.savedBrandProfiles = this.state.savedBrandProfiles.filter((p) => p.id !== id);
    this.persist();
  }

  getCreatives(orgId?: string): Creative[] {
    const id = orgId || this.state.currentOrgId;
    return this.state.creatives.filter((c) => c.organization_id === id);
  }

  addCreatives(newCreatives: Creative[]) {
    this.state.creatives = [...newCreatives, ...this.state.creatives];
    this.logAudit("BATCH_CREATIVES_GENERATED", "creative", newCreatives[0]?.id, {
      count: newCreatives.length,
    });
    this.persist();
  }

  updateCreativeStatus(id: string, status: Creative["status"]) {
    this.state.creatives = this.state.creatives.map((c) =>
      c.id === id ? { ...c, status } : c
    );
    this.logAudit("CREATIVE_STATUS_CHANGED", "creative", id, { status });
    this.persist();
  }

  deleteCreative(id: string) {
    this.state.creatives = this.state.creatives.filter((c) => c.id !== id);
    this.persist();
  }

  getSnapshots(orgId?: string): PerformanceSnapshot[] {
    const id = orgId || this.state.currentOrgId;
    return this.state.snapshots.filter((s) => s.organization_id === id);
  }

  getExperiments(orgId?: string): Experiment[] {
    const id = orgId || this.state.currentOrgId;
    return this.state.experiments.filter((e) => e.organization_id === id);
  }

  getLearnings(orgId?: string): Learning[] {
    const id = orgId || this.state.currentOrgId;
    return this.state.learnings.filter((l) => l.organization_id === id);
  }

  getAuditLogs(orgId?: string): AuditLog[] {
    const id = orgId || this.state.currentOrgId;
    return this.state.auditLogs.filter((a) => a.organization_id === id);
  }

  getAllAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  logAudit(action: string, entity_type: string, entity_id?: string, metadata?: any) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organization_id: this.state.currentOrgId,
      actor_user_id: this.state.currentUserId,
      actor_name:
        this.state.currentUserRole === "platform_admin"
          ? "Platform Administrator"
          : "Emeril Ansel",
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs = [log, ...this.state.auditLogs];
    this.persist();
  }

  addLearning(learning: Learning) {
    this.state.learnings = [learning, ...this.state.learnings];
    this.logAudit("AI_DIAGNOSIS_COMPLETED", "learning", learning.id);
    this.persist();
  }

  addExperiment(exp: Experiment) {
    this.state.experiments = [exp, ...this.state.experiments];
    this.persist();
  }

  updateSubscriptionPlan(orgId: string, plan: SubscriptionPlan) {
    this.state.organizations = this.state.organizations.map((o) =>
      o.id === orgId ? { ...o, plan_id: plan } : o
    );
    this.logAudit("SUBSCRIPTION_PLAN_CHANGED", "organization", orgId, { plan });
    this.persist();
  }
}
