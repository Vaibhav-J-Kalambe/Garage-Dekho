"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, User, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [name,    setName]    = useState(user?.user_metadata?.full_name || "");
  const [phone,   setPhone]   = useState(user?.user_metadata?.phone || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState(null);

  const email = user?.email || "";

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: name.trim(), phone: phone.trim() },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => router.push("/profile"), 1500);
  }

  /* text-[16px] prevents iOS Safari auto-zoom on focus */
  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[16px] leading-snug text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors duration-150";

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
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">Profile</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight text-white">Edit Profile</h1>
          <p className="mt-1 text-sm text-blue-100/70">Update your personal details</p>
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="-mt-12 min-h-screen rounded-t-[2.5rem] bg-[#F8FAFC] px-4 pt-6"
        style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <div className="mx-auto max-w-lg">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center animate-slide-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-black text-slate-900">Profile Updated!</p>
              <p className="text-sm text-slate-400">Redirecting back…</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 animate-slide-up">
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>
              )}

              {/* Full name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    inputMode="tel"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={inputCls + " pl-10 cursor-not-allowed bg-slate-50 text-slate-400"}
                  />
                </div>
                <p className="pl-1 text-[11px] text-slate-400">Email cannot be changed here.</p>
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
