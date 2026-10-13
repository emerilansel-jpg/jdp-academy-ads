"use client";

import React, { useState, useEffect } from "react";
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
  Sun,
  Moon,
} from "lucide-react";
import { WorkspaceStore } from "@/lib/store";
import { AppRole } from "@/lib/types";
import { Theme, getInitialTheme, applyTheme } from "@/lib/theme";

export function Navbar({ store, onStateChange }: { store: WorkspaceStore; onStateChange: () => void }) {
  const pathname = usePathname();
  const currentOrg = store.getCurrentOrg();
  const currentRole = store.getCurrentRole();
  const state = store.getState();

  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = getInitialTheme();
    setTheme(init);
    applyTheme(init);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  // Internal Next.js paths. basePath "/ads" is prepended automatically by Next.js <Link>
  const navLinks = [
    { href: "/", label: "Growth Loop", icon: RefreshCw },
    { href: "/library", label: "Creative Library", icon: Layers },
    { href: "/analytics", label: "Performance", icon: BarChart3 },
    { href: "/billing", label: "Billing & Plans", icon: CreditCard },
  ];

  if (currentRole === "platform_admin" || currentRole === "owner") {
    navLinks.push({ href: "/admin", label: "Platform Admin", icon: ShieldCheck });
  }

  // Helper to determine active link
  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/ads" || pathname === "/ads/";
    }
    return pathname.includes(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/20 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  Pesat
                </span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                  MVP Loop
                </span>
              </div>
            </Link>

            {/* Workspace / Org Switcher */}
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={currentOrg?.id}
                onChange={(e) => {
                  store.switchOrg(e.target.value);
                  onStateChange();
                }}
                className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
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
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status Pills & Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Meta Connection Status */}
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Meta Connected: act_983727121349868</span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => {
                  store.switchRole(e.target.value as AppRole);
                  onStateChange();
                }}
                className="bg-transparent text-xs text-purple-700 dark:text-purple-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="owner">Owner</option>
                <option value="marketer">Marketer</option>
                <option value="creative">Creative</option>
                <option value="platform_admin">Platform Admin</option>
              </select>
            </div>

            {/* Light / Dark Mode Toggle Switcher */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center justify-center"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-purple-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
