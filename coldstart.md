# Pesat: AI Ads Growth Loop MVP - Coldstart Memory

## Overview
Pesat adalah platform AI Ads Growth Loop (Tier 4 MVP) multi-tenant yang menghubungkan riset kreatif, peluncuran kampanye ke Meta Ads, pemantauan analitik performa riil, diagnosis AI atas elemen pemenang/kalah, dan regenerasi variasi siklus berikutnya ke dalam satu lingkaran umpan balik tertutup (*closed feedback loop*).

- Target URL: https://jdp.academy/ads
- Direct Worker: https://jdpacademy-ads.emerilansel.workers.dev/ads
- GitHub Repository: https://github.com/emerilansel-jpg/jdp-academy-ads

---

## Tech Stack
- **Framework**: Next.js 15.3.3 (App Router, Static Export `output: 'export'`, `basePath: '/ads'`)
- **Language**: TypeScript 5.5.2 (Strict mode)
- **Styling**: Tailwind CSS 3.4.4 + `@tailwindcss/forms`
- **Icons**: Lucide React
- **Deploy**: Cloudflare Workers (Wrangler 4.108.0)
- **Database & Storage**: Supabase PostgreSQL with Row Level Security (RLS) & Storage buckets
- **Integrasi Eksternal**:
  - **Meta Marketing API**: Graph API v21.0 live connection (Ad Account: `act_983727121349868`)
  - **AI Engine Adapter**: Google Gemini 1.5 Flash + fallback Realistic Synthesizer
  - **Stripe Billing Adapter**: Tiered subscription gating (Free, Starter, Growth, Enterprise) & simulated checkout lifecycle

---

## Struktur Folder Repositori
```
/app
  /admin        → Platform Admin Dashboard (cross-tenant monitoring, health matrix, audit logs)
  /analytics    → Performance Analytics (KPI cards, CTR, CPC, ROAS, creative ranking)
  /billing      → Subscriptions, plan tiers & generation volume quotas
  /library      → Creative Library (variant filtering, review, direct Meta publishing)
  layout.tsx    → Root layout & styling
  page.tsx      → Main 6-Step Growth Loop Interactive Pipeline
/components
  Navbar.tsx    → Top navigation, workspace/org switcher, role gating switcher, Meta status
/lib
  /adapters
    aiAdapter.ts     → Multi-angle strategy generation, performance diagnosis, next-cycle synthesis
    metaAdapter.ts   → Meta Marketing API connector (campaigns, ad sets, insights, publishing)
    stripeAdapter.ts → Subscription tiers & quota checks
  store.ts           → Reactive workspace store with offline-first persistence & multi-tenant isolation
  supabase.ts        → Supabase client wrapper
  types.ts           → TypeScript domain models (13 PRD entities)
/supabase
  /migrations
    20261013120000_pesat_ai_ads_growth_loop.sql → Full multi-tenant schema with RLS & audit tables
/src
  worker.ts     → Cloudflare Worker asset router with redirect rewriting for /ads subpath
next.config.mjs → Next.js configuration with basePath /ads
wrangler.jsonc  → Cloudflare Workers configuration for jdpacademy-ads
coldstart.md    → Coldstart memory & architecture documentation
```

---

## 6-Step Closed Feedback Loop (Alur Utama)

1. **Brand & Offer Context (`/ads` - Step 1)**:
   - Menyimpan konteks produk, penawaran (offer), target audiens, value proposition, tone of voice, CTA, dan catatan strategi.
   - Disimpan per organisasi sehingga dapat digunakan berulang kali oleh tim marketing.

2. **AI Campaign & Creative Generation (`/ads` - Step 2)**:
   - Menghasilkan variasi multi-angle (contoh: Portofolio vs Loker, Efisiensi Waktu, Social Proof).
   - Setiap varian memiliki: Headline, Hook 3 detik awal (stop-scrolling), Body copy terstruktur, Visual direction, Image prompt, dan Script video vertikal 9:16.

3. **Creative Review & Library (`/ads/library` & Step 3)**:
   - Manajemen status siklus hidup kreatif: `Draft` &rarr; `Approved` &rarr; `Published` &rarr; `Archived`.
   - Tombol 1-klik **Publish to Meta** yang langsung memvalidasi izin role (Owner/Marketer) dan membuat Ad Creative serta mempublikasikannya ke Meta Ad Set yang dipilih.

4. **Performance Analytics & Snapshot Sync (`/ads/analytics` & Step 4)**:
   - Menghubungkan metrik live dari Meta Graph API: Spend, Impressions, Clicks, CTR, CPC, CPM, Conversions, ROAS.
   - Peringkat kreatif terbaik (Top Performer) vs terlemah (Fatigued).

5. **AI Diagnosis & Learning (`/ads` - Step 5)**:
   - Menganalisis korelasi atribut kreatif terhadap data performa.
   - Mengekstrak **Atribut Pemenang** (wajib dipertahankan) dan **Atribut Lemah** (wajib dieliminasi).
   - Merumuskan hipotesis baru yang teruji untuk pengujian berikutnya (*Next Hypothesis*).

6. **Next-Cycle Regeneration (`/ads` - Step 6)**:
   - Inti dari feedback loop Pesat: 1-klik meregenerasi batch kreatif baru (Cycle v2) yang mengadopsi atribut pemenang siklus lalu dan mengeksekusi hipotesis baru tanpa memulai dari nol.

---

## Role-Based Access Control (RBAC)
- **Owner**: Mengelola billing, tim, integrasi, seluruh data workspace, dan publishing.
- **Marketer**: Mengelola kampanye, publishing ke Meta, analitik performa, dan eksperimen.
- **Creative**: Mengelola brand context, generasi ide AI, dan creative library (tanpa akses billing).
- **Platform Admin**: Akses dashboard monitoring lintas-organisasi (`/ads/admin`), status integrasi API, dan audit logs.

---

## Log Verifikasi & Deployment (13 Oktober 2026)
- **TypeScript Check**: `0 error` (`tsc --noEmit`).
- **Static Export**: 8/8 pages sukses diekspor ke `./out` dengan prefix `/ads`.
- **Cloudflare Worker Deploy**:
  - Worker `jdpacademy-ads` live di `https://jdpacademy-ads.emerilansel.workers.dev`.
  - Main router di `https://jdp.academy/ads` live mengarah ke worker Pesat dengan status `200 OK` di semua rute (`/ads/`, `/ads/library/`, `/ads/analytics/`, `/ads/admin/`, `/ads/billing/`).
  - Tidak ada interferensi pada rute eksisting JDP Academy (`/`, `/vibe-coding/`, `/about/` tetap `200 OK`).
