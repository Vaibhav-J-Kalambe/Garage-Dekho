"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench, Mail, Lock, Phone, MapPin, Building2, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function PortalRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isComplete   = searchParams.get("complete") === "1"; // came from login with existing account

  const [step,        setStep]        = useState(isComplete ? 2 : 1); // skip to step 2 if completing
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [existingId,  setExistingId]  = useState(null); // set when completing existing account

  // If completing an existing account, grab the session user ID
  useEffect(() => {
    if (!isComplete) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setExistingId(session.user.id);
    });
  }, [isComplete]);
  const [garageName,  setGarageName]  = useState("");
  const [phone,       setPhone]       = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("Pune");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  async function handleRegister(e) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);

    let res, result;
    try {
      res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // If completing existing account, send userId instead of email/password
          ...(existingId
            ? { existingId }
            : { email, password }
          ),
          garageName: garageName.trim(),
          phone:      phone.trim(),
          address:    address.trim(),
          city:       city.trim(),
        }),
      });
      result = await res.json();
    } catch (fetchErr) {
      setError("Network error: " + fetchErr.message);
      setLoading(false);
      return;
    }

    if (!res.ok) {
      setError(result.error || `Error ${res.status}: Registration failed.`);
      setLoading(false);
      return;
    }

    // If completing an existing account, already signed in — go straight to dashboard
    if (existingId) {
      router.replace("/portal/dashboard");
      return;
    }

    // New account — sign in immediately (auto-confirmed server-side)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError("Account created! Please sign in.");
      router.replace("/portal/login");
      return;
    }

    router.replace("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0056D2] shadow-[0_8px_32px_rgba(0,86,210,0.4)]">
          <Wrench className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-black text-white">GarageDekho Partner</h1>
          <p className="text-xs text-slate-400">Register your garage</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-5 flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className={`h-2 w-10 rounded-full transition-all ${s <= step ? "bg-[#0056D2]" : "bg-white/20"}`} />
        ))}
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-black text-slate-900">
          {step === 1 ? "Create account" : "Garage details"}
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          {step === 1 ? "Step 1 of 2 — Your login credentials" : "Step 2 of 2 — Tell us about your garage"}
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {step === 1 ? (
            <>
              <Field label="Email" icon={Mail}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourgarage.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
              <Field label="Password" icon={Lock}>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
            </>
          ) : (
            <>
              <Field label="Garage Name" icon={Building2}>
                <input type="text" required value={garageName} onChange={(e) => setGarageName(e.target.value)}
                  placeholder="e.g. Ram Motors"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
              <Field label="Phone Number" icon={Phone}>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
              <Field label="Address" icon={MapPin}>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Area"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
              <Field label="City" icon={MapPin}>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Pune"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[#0056D2] focus:ring-2 focus:ring-[#0056D2]/20 transition" />
              </Field>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,86,210,0.4)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating account…" : step === 1 ? "Next →" : "Register Garage"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/portal/login" className="font-bold text-[#0056D2] hover:underline">Sign in</Link>
        </p>
      </div>

    </div>
  );
}  // end RegisterForm

function Field({ label, icon: Icon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
