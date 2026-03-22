"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

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

    // Check if this user has a portal_garages record
    const { data: garage } = await supabase
      .from("portal_garages")
      .select("id")
      .eq("user_id", data.user.id)
      .single();

    // If no garage record — account exists but registration was incomplete, finish it
    if (!garage) {
      router.replace("/portal/register?complete=1");
      return;
    }

    router.replace("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-5">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0056D2] shadow-[0_8px_32px_rgba(0,86,210,0.4)]">
          <Wrench className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black text-white">GarageDekho</h1>
          <p className="text-sm font-semibold text-slate-400">Partner Portal</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-black text-slate-900">Welcome back</h2>
        <p className="mb-6 text-sm text-slate-500">Sign in to manage your garage</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@yourgarage.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-3 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,86,210,0.4)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New garage partner?{" "}
          <Link href="/portal/register" className="font-bold text-[#0056D2] hover:underline">
            Register here
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-slate-600">
        Customer app?{" "}
        <Link href="/" className="text-slate-400 hover:text-white underline">
          Go to GarageDekho
        </Link>
      </p>
    </div>
  );
}
