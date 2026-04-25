"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res  = await fetch("/api/portal/forgot-password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error || "Something went wrong."); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#f9f9fe] flex items-center justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="w-full max-w-sm">

        <div className="rounded-2xl bg-white border border-[#f0f0f0] shadow-md p-6">

          {sent ? (
            <div className="flex flex-col items-center text-center py-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border-2 border-green-200 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-xl font-black text-[#1a1c1f] mb-2">Check your email</h2>
              <p className="text-sm text-[#727687] leading-relaxed mb-6">
                We sent a password reset link to<br />
                <span className="font-bold text-[#1a1c1f]">{email}</span>
              </p>
              <p className="text-xs text-[#c2c6d8] mb-4">Didn&apos;t receive it? Check your spam folder.</p>
              <Link href="/portal/login" className="text-sm font-bold text-[#0056b7] hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link href="/portal/login" className="flex items-center gap-1.5 text-xs font-semibold text-[#727687] hover:text-[#1a1c1f] transition mb-5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to Sign In
              </Link>

              <h2 className="text-2xl font-black text-[#1a1c1f] mb-1">Forgot password?</h2>
              <p className="text-sm text-[#727687] mb-6">Enter your email and we&apos;ll send you a reset link.</p>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ fontSize: 16 }}
                  className="w-full rounded-xl border border-[#e8e8f0] bg-[#f9f9fe] px-4 py-3 text-sm text-[#1a1c1f] outline-none focus:border-[#0056b7] focus:ring-1 focus:ring-[#0056b7]/20 transition"
                />
                <button type="submit" disabled={loading || !email}
                  className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
