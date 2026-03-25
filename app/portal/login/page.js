"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    text: "Verified Partner Badge",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    text: "Live Bookings & SOS Requests",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    text: "Reach Thousands of Customers",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    text: "24/7 Partner Support",
  },
];

export default function PortalLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const { data: garage } = await supabase
      .from("portal_garages")
      .select("id")
      .eq("user_id", data.user.id)
      .single();

    if (!garage) {
      router.replace("/portal/register?complete=1");
      return;
    }

    router.replace("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — desktop only ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] lg:flex-col bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">

        {/* Dot-grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl" />

        {/* Back to home */}
        <Link
          href="/"
          aria-label="Back to GarageDekho"
          className="absolute left-6 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between px-12 py-16">

          {/* Top: logo + heading */}
          <div>
            {/* Logo */}
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-black text-white leading-none">GarageDekho</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200/70">Partner Portal</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-[2.6rem] font-black leading-[1.1] text-white">
              Grow Your<br />Garage Business
            </h1>
            <p className="mt-4 max-w-xs text-base text-blue-100/75 leading-relaxed">
              Join hundreds of trusted garages already using GarageDekho to reach more customers.
            </p>

            {/* Features */}
            <ul className="mt-10 flex flex-col gap-4">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                    {f.icon}
                  </div>
                  <span className="text-sm font-semibold text-blue-50">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom: testimonial */}
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10">
            <p className="text-sm font-medium text-white/90 leading-relaxed">
              "GarageDekho doubled our walk-ins within the first month. The booking system is seamless!"
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-black text-white">R</div>
              <div>
                <p className="text-sm font-bold text-white">Rajesh Kumar</p>
                <p className="text-xs text-blue-200/70">Owner, Kumar Auto Works · Mumbai</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col bg-white">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
          <Link
            href="/"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 active:scale-95"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0056D2]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="text-sm font-black text-slate-900">GarageDekho</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10" style={{ paddingBottom: "max(40px, calc(env(safe-area-inset-bottom) + 40px))" }}>
          <div className="w-full max-w-sm">

            <h2 className="text-[1.85rem] font-black tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-1.5 mb-8 text-sm text-slate-500">Sign in to manage your garage</p>

            {/* Error */}
            <div aria-live="polite" aria-atomic="true">
              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="portal-email" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input
                    id="portal-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourgarage.com"
                    autoComplete="email"
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="portal-password" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="portal-password"
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]"
                  />
                  <button
                    type="button"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors duration-150 hover:text-slate-600 active:scale-90"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {loading && (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                )}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New garage partner?{" "}
              <Link href="/portal/register" className="font-bold text-[#0056D2] transition-colors duration-150 hover:underline">
                Register here
              </Link>
            </p>

          </div>
        </div>

        {/* Footer */}
        <p className="pb-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GarageDekho · All rights reserved
        </p>
      </div>

    </div>
  );
}
