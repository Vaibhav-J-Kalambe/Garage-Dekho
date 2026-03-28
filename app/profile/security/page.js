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
  const inputCls = "w-full rounded-xl border border-[#c2c6d8] bg-white px-4 py-3 text-[16px] leading-snug text-[#424656] placeholder:text-[#727687] focus:border-[#0056b7] focus:outline-none focus:ring-1 focus:ring-[#0056b7]/10 transition-colors duration-150";

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
    <div className="min-h-screen bg-[#f9f9fe]">

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-lg px-4 pt-6 pb-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#ededf2] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#727687]">Preferences</p>
          <h1 className="mt-1 text-[2rem] md:text-[2.5rem] font-bold tracking-tight text-[#1a1c1f]">Privacy & Security</h1>
          <p className="mt-1 text-sm text-[#727687]">Manage your account security</p>
        </div>
      </div>

      <div
        className="px-4 pt-4"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg space-y-5">

          {/* Account info */}
          <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-black text-[#1a1c1f]">Account Info</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#727687]">Email</span>
                <span className="truncate font-semibold text-[#424656]">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727687]">Provider</span>
                <span className="font-semibold text-[#424656] capitalize">{user?.app_metadata?.provider || "email"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727687]">Account status</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="rounded-2xl bg-white p-4 shadow-card animate-slide-up delay-75">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <p className="text-sm font-black text-[#1a1c1f]">Change Password</p>
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
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-[#727687] hover:text-[#424656]"
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
            <p className="mb-3 text-xs text-[#727687]">Deleting your account is permanent and cannot be undone.</p>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                  To delete your account, email us at <strong>support@garagedekho.com</strong> from your registered email address.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[44px] w-full rounded-xl border border-[#c2c6d8]/30 py-2.5 text-sm font-bold text-[#727687] transition-colors duration-150 hover:bg-[#f3f3f8] active:scale-95"
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
