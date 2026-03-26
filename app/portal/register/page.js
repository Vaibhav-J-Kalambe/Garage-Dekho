"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const isComplete   = searchParams.get("complete") === "1";

  const [step,       setStep]       = useState(isComplete ? 2 : 1);
  const [existingId, setExistingId] = useState(null);

  const [authMethod, setAuthMethod] = useState("email");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [authPhone,  setAuthPhone]  = useState("");
  const [otp,           setOtp]           = useState("");
  const [otpSent,       setOtpSent]       = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendTimer,   setResendTimer]   = useState(0);

  const [garageName,  setGarageName]  = useState("");
  const [garagePhone, setGaragePhone] = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("Pune");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!isComplete) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setExistingId(session.user.id);
    });
  }, [isComplete]);

  function resetMessages() { setError(null); setSuccess(null); }

  function startResendTimer() {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  }

  async function handleGoogle() {
    setLoading(true); resetMessages();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal/register?complete=1` },
    });
  }

  async function handleSendEmailOtp(e) {
    e.preventDefault();
    setLoading(true); resetMessages();
    const { error: otpErr } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (otpErr) { setError(otpErr.message); setLoading(false); return; }
    setOtpSent(true);
    setSuccess(`Verification code sent to ${email}`);
    setLoading(false);
    startResendTimer();
  }

  async function handleVerifyEmailOtp(e) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the code you received."); return; }
    setLoading(true); resetMessages();
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (verifyErr) { setError(verifyErr.message); setLoading(false); return; }
    setExistingId(data.session?.user?.id ?? null);
    setEmailVerified(true);
    setLoading(false);
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setLoading(true); resetMessages();
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) { setError(pwErr.message); setLoading(false); return; }
    setLoading(false);
    setStep(2);
  }

  async function handleSendOtp(e) {
    e?.preventDefault();
    if (!authPhone.trim()) { setError("Enter a valid phone number."); return; }
    setLoading(true); resetMessages();
    const fullPhone = authPhone.startsWith("+") ? authPhone : `+91${authPhone.replace(/\D/g, "")}`;
    const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (otpErr) { setError(otpErr.message); setLoading(false); return; }
    setOtpSent(true);
    setSuccess(`OTP sent to ${fullPhone}`);
    setLoading(false);
    startResendTimer();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP you received."); return; }
    setLoading(true); resetMessages();
    const fullPhone = authPhone.startsWith("+") ? authPhone : `+91${authPhone.replace(/\D/g, "")}`;
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
    if (verifyErr) { setError(verifyErr.message); setLoading(false); return; }
    setExistingId(data.session?.user?.id ?? null);
    setLoading(false);
    setStep(2);
  }

  async function handleGarageSubmit(e) {
    e.preventDefault();
    setLoading(true); resetMessages();
    let res, result;
    try {
      res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(existingId ? { existingId } : { email, password }),
          garageName: garageName.trim(),
          phone:      garagePhone.trim(),
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
    if (!res.ok) { setError(result.error || `Error ${res.status}: Registration failed.`); setLoading(false); return; }
    if (existingId) { router.replace("/portal/dashboard"); return; }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) { router.replace("/portal/login"); return; }
    router.replace("/portal/dashboard");
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — desktop only ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] lg:flex-col bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl" />

        <Link href="/" aria-label="Back to GarageDekho" className="absolute left-6 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-between px-12 py-16">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-md">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <p className="text-lg font-black text-white leading-none">GarageDekho</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200/70">Partner Portal</p>
              </div>
            </div>
            <h1 className="text-[2.6rem] font-black leading-[1.1] text-white">Grow Your<br />Garage Business</h1>
            <p className="mt-4 max-w-xs text-base text-blue-100/75 leading-relaxed">Join hundreds of trusted garages already using GarageDekho to reach more customers.</p>
            <ul className="mt-10 flex flex-col gap-4">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">{f.icon}</div>
                  <span className="text-sm font-semibold text-blue-50">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col bg-slate-50">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
          <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 active:scale-95">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0056D2]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <span className="text-sm font-black text-slate-900">GarageDekho</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Form area */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-6 sm:justify-center sm:px-8 sm:py-10" style={{ paddingBottom: "max(24px, calc(env(safe-area-inset-bottom) + 24px))" }}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-md sm:p-6">

            <div aria-live="polite" aria-atomic="true">
              {error && (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  <p className="text-xs font-semibold text-green-700">{success}</p>
                </div>
              )}
            </div>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div>
                <h2 className="text-[1.85rem] font-black tracking-tight text-slate-900">Create account</h2>
                <p className="mt-1.5 mb-8 text-sm text-slate-500">Step 1 of 2 — Choose how to sign up</p>

                <button type="button" onClick={handleGoogle} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,background-color] duration-150 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-60 min-h-[48px]">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs text-slate-400 font-medium">or</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
                  {[{ key: "email", label: "Email" }, { key: "phone", label: "Phone" }].map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => { setAuthMethod(key); setOtpSent(false); setOtp(""); setEmailVerified(false); resetMessages(); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-[background-color,color,box-shadow] duration-150 ${authMethod === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                      {key === "email" ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"/></svg>}
                      {label}
                    </button>
                  ))}
                </div>

                {authMethod === "email" && !otpSent && !emailVerified && (
                  <form onSubmit={handleSendEmailOtp} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</label>
                      <div className="relative">
                        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@yourgarage.com" autoComplete="email" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} aria-busy={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                      {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                      {loading ? "Sending code…" : "Send Verification Code"}
                    </button>
                  </form>
                )}

                {authMethod === "email" && otpSent && !emailVerified && (
                  <form onSubmit={handleVerifyEmailOtp} className="flex flex-col gap-5">
                    <p className="text-xs text-slate-500 text-center">Code sent to <span className="font-bold text-slate-700">{email}</span><button type="button" onClick={() => { setOtpSent(false); setOtp(""); resetMessages(); }} className="ml-2 font-bold text-[#0056D2]">Change</button></p>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reg-email-otp" className="text-xs font-bold uppercase tracking-wide text-slate-500">Verification Code</label>
                      <div className="relative">
                        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        <input id="reg-email-otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="6-digit code" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-center tracking-[0.3em] font-bold text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[36px]" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} aria-busy={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                      {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                      {loading ? "Verifying…" : "Verify & Continue"}
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      {resendTimer > 0 ? <>Resend code in <span className="font-bold text-slate-600">{resendTimer}s</span></> : <button type="button" onClick={handleSendEmailOtp} className="font-bold text-[#0056D2]">Resend code</button>}
                    </p>
                  </form>
                )}

                {authMethod === "email" && emailVerified && (
                  <form onSubmit={handleSetPassword} className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      <p className="text-xs font-semibold text-green-700">Email verified — <span className="font-normal text-green-600">{email}</span></p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wide text-slate-500">Set Password</label>
                      <div className="relative">
                        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <input id="reg-password" type={showPass ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" autoFocus style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                        <button type="button" aria-label={showPass ? "Hide password" : "Show password"} onClick={() => setShowPass((v) => !v)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors duration-150 hover:text-slate-600 active:scale-90">
                          {showPass ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} aria-busy={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                      {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                      {loading ? "Saving…" : "Set Password & Continue →"}
                    </button>
                  </form>
                )}

                {authMethod === "phone" && !otpSent && (
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reg-phone-auth" className="text-xs font-bold uppercase tracking-wide text-slate-500">Mobile Number</label>
                      <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3 text-sm font-bold text-slate-500">+91</span>
                        <input id="reg-phone-auth" type="tel" required value={authPhone} onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile number" maxLength={10} autoComplete="tel" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} aria-busy={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                      {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                      {loading ? "Sending OTP…" : "Send OTP"}
                    </button>
                  </form>
                )}

                {authMethod === "phone" && otpSent && (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                    <p className="text-xs text-slate-500 text-center">OTP sent to <span className="font-bold text-slate-700">+91 {authPhone}</span><button type="button" onClick={() => { setOtpSent(false); resetMessages(); }} className="ml-2 font-bold text-[#0056D2]">Change</button></p>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="reg-otp" className="text-xs font-bold uppercase tracking-wide text-slate-500">Enter OTP</label>
                      <div className="relative">
                        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                        <input id="reg-otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="6-digit OTP" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-center tracking-[0.3em] font-bold text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[36px]" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} aria-busy={loading} className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                      {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                      {loading ? "Verifying…" : "Verify & Continue"}
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      {resendTimer > 0 ? <>Resend OTP in <span className="font-bold text-slate-600">{resendTimer}s</span></> : <button type="button" onClick={() => handleSendOtp()} className="font-bold text-[#0056D2]">Resend OTP</button>}
                    </p>
                  </form>
                )}

                <p className="mt-7 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/portal/login" className="font-bold text-[#0056D2] transition-colors duration-150 hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <h2 className="text-[1.85rem] font-black tracking-tight text-slate-900">Garage details</h2>
                <p className="mt-1.5 mb-8 text-sm text-slate-500">Step 2 of 2 — Tell us about your garage</p>
                <form onSubmit={handleGarageSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-garage" className="text-xs font-bold uppercase tracking-wide text-slate-500">Garage Name</label>
                    <div className="relative">
                      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <input id="reg-garage" type="text" required value={garageName} onChange={(e) => setGarageName(e.target.value)} placeholder="e.g. Ram Motors" autoComplete="organization" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-gphone" className="text-xs font-bold uppercase tracking-wide text-slate-500">Garage Phone</label>
                    <div className="relative">
                      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
                      <input id="reg-gphone" type="tel" required value={garagePhone} onChange={(e) => setGaragePhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-address" className="text-xs font-bold uppercase tracking-wide text-slate-500">Address</label>
                    <div className="relative">
                      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <input id="reg-address" type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / Area" autoComplete="street-address" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-city" className="text-xs font-bold uppercase tracking-wide text-slate-500">City</label>
                    <div className="relative">
                      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      <input id="reg-city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune" autoComplete="address-level2" style={{ fontSize: 16 }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#0056D2] focus:bg-white focus:ring-2 focus:ring-[#0056D2]/15 min-h-[44px]" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} aria-busy={loading} className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0056D2] text-sm font-bold text-white shadow-glow-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
                    {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>}
                    {loading ? "Registering…" : "Register Garage"}
                  </button>
                  {!existingId && (
                    <button type="button" onClick={() => setStep(1)} className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:scale-[0.98]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      Back
                    </button>
                  )}
                </form>
              </div>
            )}

          </div>
        </div>

        <p className="pb-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} GarageDekho · All rights reserved
        </p>
      </div>

    </div>
  );
}
