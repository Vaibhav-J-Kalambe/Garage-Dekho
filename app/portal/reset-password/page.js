"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [ready,     setReady]     = useState(false);
  const [done,      setDone]      = useState(false);

  useEffect(() => {
    // Supabase puts the code in the URL — exchange it for a session
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError("This reset link is invalid or has expired. Please request a new one.");
        else setReady(true);
      });
    } else {
      // Fallback: check if there's already an active recovery session (hash-based flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
        else setError("This reset link is invalid or has expired. Please request a new one.");
      });
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.replace("/portal/login"), 2500);
  }

  return (
    <div className="min-h-screen bg-[#f9f9fe] flex items-center justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white border border-[#f0f0f0] shadow-md p-6">

        {done ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border-2 border-green-200 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-xl font-black text-[#1a1c1f] mb-2">Password updated!</h2>
            <p className="text-sm text-[#727687]">Redirecting you to sign in…</p>
          </div>
        ) : error && !ready ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-2 border-red-200 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <h2 className="text-xl font-black text-[#1a1c1f] mb-2">Link expired</h2>
            <p className="text-sm text-[#727687] mb-5">{error}</p>
            <a href="/portal/forgot-password" className="text-sm font-bold text-[#0056b7] hover:underline">
              Request a new reset link
            </a>
          </div>
        ) : !ready ? (
          <div className="flex justify-center py-8">
            <div className="h-7 w-7 rounded-full border-4 border-[#0056b7] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-[#1a1c1f] mb-1">Set new password</h2>
            <p className="text-sm text-[#727687] mb-6">Choose a strong password for your account.</p>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 6 chars)" minLength={6}
                  style={{ fontSize: 16 }}
                  className="w-full rounded-xl border border-[#e8e8f0] bg-[#f9f9fe] px-4 py-3 pr-12 text-sm text-[#1a1c1f] outline-none focus:border-[#0056b7] focus:ring-1 focus:ring-[#0056b7]/20 transition"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727687] hover:text-[#1a1c1f]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
              <input
                type={showPass ? "text" : "password"} required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password" minLength={6}
                style={{ fontSize: 16 }}
                className="w-full rounded-xl border border-[#e8e8f0] bg-[#f9f9fe] px-4 py-3 text-sm text-[#1a1c1f] outline-none focus:border-[#0056b7] focus:ring-1 focus:ring-[#0056b7]/20 transition"
              />
              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
