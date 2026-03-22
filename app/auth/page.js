"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Mail, Lock, User, Wrench, ArrowLeft, Eye, EyeOff, ShieldCheck, BadgeCheck, Clock, AlertCircle, Loader2, Phone, KeyRound } from "lucide-react";
import Link from "next/link";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] transition-[border-color,box-shadow] duration-150";

function AuthForm() {
  const [tab, setTab]           = useState("login");   // "login" | "signup"
  const [method, setMethod]     = useState("email");   // "email" | "phone"

  // email fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);

  // phone fields
  const [phone, setPhone]             = useState("");
  const [phoneName, setPhoneName]     = useState("");
  const [phonePw, setPhonePw]         = useState("");
  const [showPhonePw, setShowPhonePw] = useState(false);
  const [otp, setOtp]                 = useState("");
  const [otpSent, setOtpSent]         = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") || "/";

  function resetState() { setError(null); setSuccess(null); }

  function startResendTimer() {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  }

  async function handleGoogle() {
    setLoading(true); resetState();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirect}` },
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); resetState();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push(redirect);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true); resetState();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else {
      setSuccess("Account created! Check your email to confirm your account, then log in.");
      setLoading(false);
    }
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!phone.trim()) { setError("Enter a valid phone number."); return; }
    setLoading(true); resetState();
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (error) { setError(error.message); setLoading(false); }
    else {
      setOtpSent(true);
      setSuccess(`OTP sent to ${fullPhone}`);
      setLoading(false);
      startResendTimer();
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) { setError("Enter the OTP you received."); return; }
    setLoading(true); resetState();
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
    if (error) { setError(error.message); setLoading(false); }
    else {
      // Save name to profile after phone verification
      if (phoneName.trim()) {
        await supabase.auth.updateUser({ data: { full_name: phoneName.trim() } });
      }
      router.push(redirect);
    }
  }

  async function handlePhoneLogin(e) {
    e.preventDefault();
    setLoading(true); resetState();
    const fullPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithPassword({ phone: fullPhone, password: phonePw });
    if (error) { setError(error.message); setLoading(false); }
    else router.push(redirect);
  }

  function switchMethod(m) {
    setMethod(m);
    setOtpSent(false);
    setOtp("");
    setPhone("");
    setPhonePw("");
    setPhoneName("");
    resetState();
  }

  return (
    <div className="min-h-[101vh] bg-[#F8FAFC]">

      {/* ── Hero band ── */}
      <div data-hero className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] px-4 pb-20 pt-[77px] text-center">
        {/* Dot-grid texture — matches home page hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Ambient glow blobs — matches home page hero */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />

        <Link
          href="/"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">GarageDekho</h1>
          <p className="mt-1 text-sm text-blue-200">Trusted garages · Fixed prices · Instant booking</p>

          <div className="mt-4 flex items-center justify-center gap-5 text-[11px] font-semibold text-blue-200">
            <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-green-300" /> Verified Garages</span>
            <span className="h-3 w-px bg-blue-300/40" />
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-blue-300" /> Fixed Pricing</span>
            <span className="h-3 w-px bg-blue-300/40" />
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-blue-300" /> 24/7 Support</span>
          </div>
        </div>
      </div>

      {/* ── Form pulled up ── */}
      <div className="relative -mt-12 rounded-t-[2.5rem] bg-[#F8FAFC]">
        <div className="mx-auto max-w-sm px-4 pb-28 pt-6">

          {/* Login / Sign Up tabs — always visible */}
          <div role="tablist" aria-label="Authentication mode" className="flex gap-1 rounded-2xl bg-white p-1 shadow-card mb-4">
            {[{ key: "login", label: "Log In" }, { key: "signup", label: "Sign Up" }].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => { setTab(key); resetState(); }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-[background-color,color] duration-150 ${
                  tab === key ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white p-5 shadow-card space-y-3 min-h-[320px]">

            <div aria-live="polite" aria-atomic="true">
              {error && (
                <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
                </p>
              )}
              {success && (
                <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-600">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{success}
                </p>
              )}
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-[border-color,box-shadow,background-color] duration-150 hover:shadow-card hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Email / Phone method toggle */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[{ key: "email", label: "Email", Icon: Mail }, { key: "phone", label: "Phone", Icon: Phone }].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMethod(key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-[background-color,color,box-shadow] duration-150 ${
                    method === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── EMAIL FORM ── */}
            {method === "email" && (
              <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3">
                {tab === "signup" && (
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Full name" required
                      className={inputCls + " pl-10"}
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address" required
                    className={inputCls + " pl-10"}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)" required minLength={6}
                    className={inputCls + " pl-10 pr-10"}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
                </button>
              </form>
            )}

            {/* ── PHONE LOGIN — phone + password (same as email flow) ── */}
            {method === "phone" && tab === "login" && !otpSent && (
              <form onSubmit={handlePhoneLogin} className="space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10} required
                    className={inputCls + " pl-12"}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPhonePw ? "text" : "password"}
                    value={phonePw} onChange={(e) => setPhonePw(e.target.value)}
                    placeholder="Password" required minLength={6}
                    className={inputCls + " pl-10 pr-10"}
                  />
                  <button type="button" aria-label={showPhonePw ? "Hide password" : "Show password"}
                    onClick={() => setShowPhonePw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPhonePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading} aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Please wait…" : "Log In"}
                </button>
              </form>
            )}

            {/* ── PHONE SIGN UP — OTP to create & verify account ── */}
            {method === "phone" && tab === "signup" && !otpSent && (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" value={phoneName}
                    onChange={(e) => setPhoneName(e.target.value)}
                    placeholder="Full name" required
                    className={inputCls + " pl-10"}
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10} required
                    className={inputCls + " pl-12"}
                  />
                </div>
                <button type="submit" disabled={loading} aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            )}

            {method === "phone" && otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-xs text-slate-500 text-center">
                  OTP sent to <span className="font-bold text-slate-700">+91 {phone}</span>
                  <button type="button" onClick={() => { setOtpSent(false); resetState(); }} className="ml-2 font-bold text-primary">Change</button>
                </p>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    required
                    autoFocus
                    className={inputCls + " pl-10 tracking-[0.3em] font-bold text-center"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
                <p className="text-center text-xs text-slate-400">
                  {resendTimer > 0
                    ? <>Resend OTP in <span className="font-bold text-slate-600">{resendTimer}s</span></>
                    : <button type="button" onClick={handleSendOtp} className="font-bold text-primary">Resend OTP</button>
                  }
                </p>
              </form>
            )}

          </div>

          {method === "email" && (
            <p className="mt-4 text-center text-xs text-slate-400">
              {tab === "login"
                ? <>No account? <button onClick={() => { setTab("signup"); resetState(); }} className="font-bold text-primary">Sign up free</button></>
                : <>Have an account? <button onClick={() => { setTab("login"); resetState(); }} className="font-bold text-primary">Log in</button></>
              }
            </p>
          )}

          <p className="mt-3 text-center text-[10px] text-slate-300">
            By continuing you agree to our Terms & Privacy Policy
          </p>

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
