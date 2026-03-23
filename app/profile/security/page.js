"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, Loader2, Shield, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* text-[16px] prevents iOS Safari auto-zoom on focus */
  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] leading-snug text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors duration-150";

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPw !== confirmPw) { setError("Passwords don't match."); return; }
    if (newPw.length < 6)   { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setNewPw(""); setConfirmPw("");
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="min-h-screen bg-[#001f5b]">

      {/* ── Hero ── */}
      <div
        data-hero
        className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] px-4 pb-16 pt-[77px] sm:pb-20"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-sky-300/20 blur-2xl" aria-hidden />

        <div className="relative mx-auto max-w-lg">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/25 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">Preferences</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight text-white">Privacy & Security</h1>
          <p className="mt-1 text-sm text-blue-100/70">Manage your account security</p>
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="-mt-12 min-h-screen rounded-t-[2.5rem] bg-[#F8FAFC] px-4 pt-6"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg space-y-5">

          {/* Account info */}
          <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-black text-slate-900">Account Info</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Email</span>
                <span className="truncate font-semibold text-slate-700">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Provider</span>
                <span className="font-semibold text-slate-700 capitalize">{user?.app_metadata?.provider || "email"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account status</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up delay-75">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <p className="text-sm font-black text-slate-900">Change Password</p>
            </div>

            {success && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Password updated successfully!
              </div>
            )}
            {error && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-500">{error}</p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3" autoComplete="off">
              <input type="password" autoComplete="current-password" style={{ display: "none" }} readOnly />
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputCls + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
                className={inputCls}
              />
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-card animate-slide-up delay-100">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-black text-red-500">Danger Zone</p>
            </div>
            <p className="mb-3 text-xs text-slate-400">Deleting your account is permanent and cannot be undone.</p>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                  To delete your account, email us at <strong>support@garagedekho.com</strong> from your registered email address.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 transition-colors duration-150 hover:bg-slate-50 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="min-h-[44px] w-full rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-500 transition-colors duration-150 hover:bg-red-50 active:scale-95"
              >
                Delete Account
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
