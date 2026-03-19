"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, Loader2, Shield, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState(null);

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition";

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    if (newPw.length < 6)   { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    // In a real app, call a server-side function to delete the user
    alert("Account deletion requires contacting support at support@garagedekho.com");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Preferences</p>
            <h1 className="text-sm font-black text-slate-900">Privacy & Security</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10 space-y-5">

        {/* Account info */}
        <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-black text-slate-900">Account Info</p>
          </div>
          <div className="space-y-2 text-sm text-slate-500">
            <div className="flex justify-between">
              <span>Email</span>
              <span className="font-semibold text-slate-700">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Provider</span>
              <span className="font-semibold text-slate-700 capitalize">{user?.app_metadata?.provider || "email"}</span>
            </div>
            <div className="flex justify-between">
              <span>Account status</span>
              <span className="font-semibold text-green-600">Active</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up delay-75">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-4 w-4 text-primary" />
            <p className="text-sm font-black text-slate-900">Change Password</p>
          </div>

          {success && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Password updated successfully!
            </div>
          )}
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3" autoComplete="off">
            {/* Hidden field prevents browser autofill on the real inputs */}
            <input type="password" autoComplete="current-password" style={{ display: "none" }} readOnly />
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 6 chars)" required minLength={6}
                autoComplete="new-password"
                className={inputCls + " pr-10"} />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input type={showPw ? "text" : "password"} value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm new password" required
              autoComplete="new-password"
              className={inputCls} />
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-card animate-slide-up delay-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-black text-red-500">Danger Zone</p>
          </div>
          <p className="text-xs text-slate-400 mb-3">Deleting your account is permanent and cannot be undone.</p>
          <button type="button" onClick={handleDeleteAccount}
            className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50 active:scale-95">
            Delete Account
          </button>
        </div>

      </main>
    </div>
  );
}
