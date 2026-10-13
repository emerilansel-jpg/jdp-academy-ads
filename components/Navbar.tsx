"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Layers,
  BarChart3,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { WorkspaceStore } from "@/lib/store";
import { AppRole } from "@/lib/types";

export function Navbar({ store, onStateChange }: { store: WorkspaceStore; onStateChange: () => void }) {
  const pathname = usePathname();
  const currentOrg = store.getCurrentOrg();
  const currentRole = store.getCurrentRole();
  const state = store.getState();

  const navLinks = [
    { href: "/ads", label: "Growth Loop", icon: RefreshCw },
    { href: "/ads/library", label: "Creative Library", icon: Layers },
    { href: "/ads/analytics", label: "Performance", icon: BarChart3 },
    { href: "/ads/billing", label: "Billing & Plans", icon: CreditCard },
  ];

  if (currentRole === "platform_admin" || currentRole === "owner") {
    navLinks.push({ href: "/ads/admin", label: "Platform Admin", icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/ads" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                  Pesat
                </span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  MVP Loop
                </span>
              </div>
            </Link>

            {/* Workspace / Org Switcher */}
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={currentOrg?.id}
                onChange={(e) => {
                  store.switchOrg(e.target.value);
                  onStateChange();
                }}
                className="bg-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              >
                {state.organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.plan_id.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/ads" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Role Tester & Status Pills */}
          <div className="flex items-center space-x-3">
            {/* Meta Connection Status */}
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Meta Connected: act_983727121349868</span>
            </div>

            {/* Role Switcher (PRD Role Gating Test Tool) */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => {
                  store.switchRole(e.target.value as AppRole);
                  onStateChange();
                }}
                className="bg-transparent text-xs text-purple-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="owner" className="bg-slate-900 text-slate-100">Owner</option>
                <option value="marketer" className="bg-slate-900 text-slate-100">Marketer</option>
                <option value="creative" className="bg-slate-900 text-slate-100">Creative</option>
                <option value="platform_admin" className="bg-slate-900 text-slate-100">Platform Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
