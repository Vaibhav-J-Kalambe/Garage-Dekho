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

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">Profile</p>
            <h1 className="text-sm font-black text-slate-900">Edit Profile</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-10">
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
              <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">{error}</p>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name" required className={inputCls + " pl-10"} />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210" className={inputCls + " pl-10"} />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} readOnly
                  className={inputCls + " pl-10 cursor-not-allowed bg-slate-50 text-slate-400"} />
              </div>
              <p className="text-[11px] text-slate-400 pl-1">Email cannot be changed here.</p>
            </div>

            {/* Save */}
            <button type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
