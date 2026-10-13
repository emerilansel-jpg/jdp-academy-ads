"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { WorkspaceStore } from "@/lib/store";
import { Creative, CreativeStatus } from "@/lib/types";
import { metaAdapter } from "@/lib/adapters/metaAdapter";
import { Layers, Send, CheckCircle2, Archive, Filter, Sparkles } from "lucide-react";

export default function LibraryPage() {
  const [store, setStore] = useState<WorkspaceStore | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [, setTick] = useState(0);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; success: boolean; text: string } | null>(null);

  useEffect(() => {
    setStore(new WorkspaceStore());
  }, []);

  const refresh = () => {
    setTick((t) => t + 1);
  };

  if (!store) return null;

  const currentRole = store.getCurrentRole();
  const creatives = store.getCreatives();

  const filtered = creatives.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const handleApprove = (id: string) => {
    store.updateCreativeStatus(id, "approved");
    refresh();
  };

  const handleArchive = (id: string) => {
    store.updateCreativeStatus(id, "archived");
    refresh();
  };

  const handlePublish = async (cr: Creative) => {
    if (currentRole !== "owner" && currentRole !== "marketer") {
      alert("Hanya Owner atau Marketer yang berhak publish ke Meta Ads.");
      return;
    }

    setPublishingId(cr.id);
    const res = await metaAdapter.publishCreativeToMeta({
      adSetId: "120249668304950473",
      adName: cr.title,
      headline: cr.title,
      primaryText: cr.copy,
    });

    if (res.success) {
      store.updateCreativeStatus(cr.id, "published");
      setMsg({ id: cr.id, success: true, text: `Telah live di Meta Ads Manager (ID: ${res.adId})` });
      refresh();
    } else {
      setMsg({ id: cr.id, success: false, text: res.error || "Gagal publish ke Meta" });
    }
    setPublishingId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar store={store} onStateChange={refresh} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Creative Library & Versioned Assets</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pustaka seluruh aset kreatif iklan per siklus. Kelola status dan pantau atribusi performa.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {["all", "draft", "approved", "published", "archived"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  filter === st
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            msg.success ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cr) => (
            <div
              key={cr.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    cr.status === "published"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : cr.status === "approved"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : cr.status === "draft"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {cr.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Cycle v{cr.version} &bull; {cr.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{cr.title}</h3>
                  {cr.angle && <div className="text-[11px] text-purple-400 mt-0.5">{cr.angle}</div>}
                </div>

                {cr.hook && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                    <span className="text-[10px] font-bold text-amber-400 block mb-0.5">HOOK 3 DETIK:</span>
                    <span className="text-slate-200 italic">&ldquo;{cr.hook}&rdquo;</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 line-clamp-4 whitespace-pre-line leading-relaxed">
                  {cr.copy}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {cr.status === "draft" && (
                  <>
                    <button
                      onClick={() => handleApprove(cr.id)}
                      className="flex-1 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleArchive(cr.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                    >
                      Archive
                    </button>
                  </>
                )}

                {cr.status === "approved" && (
                  <>
                    <button
                      onClick={() => handlePublish(cr)}
                      disabled={publishingId === cr.id}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{publishingId === cr.id ? "Publishing..." : "Publish to Meta"}</span>
                    </button>
                    <button
                      onClick={() => handleArchive(cr.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                    >
                      Archive
                    </button>
                  </>
                )}

                {cr.status === "published" && (
                  <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded-lg">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Live on Meta Ads</span>
                    </span>
                    <button
                      onClick={() => handleArchive(cr.id)}
                      className="text-slate-500 hover:text-slate-300 text-[11px] underline"
                    >
                      Archive
                    </button>
                  </div>
                )}

                {cr.status === "archived" && (
                  <button
                    onClick={() => handleApprove(cr.id)}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Restore to Approved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
