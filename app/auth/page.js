"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Mail, Lock, User, Wrench, ArrowLeft, Eye, EyeOff, ShieldCheck, BadgeCheck, Clock, AlertCircle, Loader2, Phone, KeyRound } from "lucide-react";
import Link from "next/link";

const inputCls =
  "w-full bg-white border border-[#c2c6d8]/20 rounded-2xl px-4 py-2.5 text-[#1a1c1f] placeholder:text-[#c2c6d8] focus:border-[#0056b7] focus:outline-none focus:ring-2 focus:ring-[#0056b7]/20 min-h-[44px] transition-[border-color,box-shadow] duration-150";

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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-6 pb-32 md:py-12">

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-12 md:gap-16 items-center">

        {/* ── LEFT: editorial panel (md+) ── */}
        <div className="hidden md:flex flex-col flex-1 gap-8">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition hover:bg-[#e8e8f0] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656] mb-3">GarageDekho</p>
            <h1 className="text-[3.5rem] font-bold tracking-tight text-[#1a1c1f] leading-[1.1]">
              {tab === "login" ? (
                <>Welcome<br />back.</>
              ) : (
                <>Join<br /><span style={{ color: "#0056b7" }}>GarageDekho</span></>
              )}
            </h1>
            <p className="mt-4 text-base text-[#424656] leading-relaxed max-w-xs">
              Trusted garages · Fixed prices · Instant booking
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#d8e2ff]/40 px-4 py-2 text-sm font-semibold text-[#0056b7]">
              <BadgeCheck className="h-4 w-4" /> Verified Garages
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#d8e2ff]/40 px-4 py-2 text-sm font-semibold text-[#0056b7]">
              <ShieldCheck className="h-4 w-4" /> Fixed Pricing
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#d8e2ff]/40 px-4 py-2 text-sm font-semibold text-[#0056b7]">
              <Clock className="h-4 w-4" /> 24/7 Support
            </span>
          </div>
        </div>

        {/* ── RIGHT: auth card ── */}
        <div className="w-full md:w-[420px] flex-shrink-0">

          {/* Mobile back link + heading row */}
          <div className="md:hidden flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition hover:bg-[#e8e8f0] active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">GarageDekho</p>
              <h2 className="text-lg font-bold text-[#1a1c1f] leading-tight">
                {tab === "login" ? "Welcome back." : <>Join <span style={{ color: "#0056b7" }}>GarageDekho</span></>}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 md:p-8 shadow-[0_8px_64px_rgba(0,86,183,0.08)] space-y-3 md:space-y-5">

            {/* Login / Sign Up tabs */}
            <div role="tablist" aria-label="Authentication mode" className="flex gap-1.5 rounded-xl bg-[#f3f3f8] p-1.5">
              {[{ key: "login", label: "Log In" }, { key: "signup", label: "Sign Up" }].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => { setTab(key); resetState(); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                    tab === key
                      ? "bg-white text-[#0056b7] shadow-sm"
                      : "text-[#424656] hover:text-[#1a1c1f]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Google OAuth - shown first, most users prefer this */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#c2c6d8]/30 bg-white py-2.5 text-sm font-semibold text-[#1a1c1f] shadow-sm transition hover:shadow-md hover:border-[#c2c6d8]/60 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
              style={{ fontSize: 16 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#f3f3f8]" />
              <span className="text-xs text-[#c2c6d8] font-medium">or sign in with</span>
              <div className="h-px flex-1 bg-[#f3f3f8]" />
            </div>

            {/* Alerts */}
            <div aria-live="polite" aria-atomic="true" className="space-y-2">
              {error && (
                <p role="alert" className="flex items-center gap-2 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/20 px-4 py-3 text-sm font-semibold text-[#ba1a1a]">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
                </p>
              )}
              {success && (
                <p className="flex items-center gap-2 rounded-2xl bg-[#d8e2ff]/40 border border-[#0056b7]/20 px-4 py-3 text-sm font-semibold text-[#0056b7]">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{success}
                </p>
              )}
            </div>

            {/* Email / Phone method toggle */}
            <div className="flex gap-2">
              {[{ key: "email", label: "Email", Icon: Mail }, { key: "phone", label: "Phone", Icon: Phone }].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMethod(key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition-[background-color,color,border-color] duration-150 ${
                    method === key
                      ? "border-[#0056b7] bg-[#d8e2ff]/30 text-[#0056b7]"
                      : "border-[#c2c6d8]/30 text-[#424656] hover:border-[#c2c6d8]/60"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── EMAIL FORM ── */}
            {method === "email" && (
              <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3">
                {tab === "signup" && (
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
                    <input
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Full name" required
                      className={inputCls + " pl-11"}
                      style={{ fontSize: 16 }}
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address" required
                    className={inputCls + " pl-11"}
                    style={{ fontSize: 16 }}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)" required minLength={6}
                    className={inputCls + " pl-11 pr-11"}
                    style={{ fontSize: 16 }}
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2c6d8] hover:text-[#424656] active:scale-90 transition"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 px-6 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
                </button>
              </form>
            )}

            {/* ── PHONE LOGIN - phone + password ── */}
            {method === "phone" && tab === "login" && !otpSent && (
              <form onSubmit={handlePhoneLogin} className="space-y-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#424656]">+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10} required
                    className={inputCls + " pl-14"}
                    style={{ fontSize: 16 }}
                  />
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
                  <input
                    type={showPhonePw ? "text" : "password"}
                    value={phonePw} onChange={(e) => setPhonePw(e.target.value)}
                    placeholder="Password" required minLength={6}
                    className={inputCls + " pl-11 pr-11"}
                    style={{ fontSize: 16 }}
                  />
                  <button type="button" aria-label={showPhonePw ? "Hide password" : "Show password"}
                    onClick={() => setShowPhonePw((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2c6d8] hover:text-[#424656] transition"
                  >
                    {showPhonePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loading} aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 px-6 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Please wait…" : "Log In"}
                </button>
              </form>
            )}

            {/* ── PHONE SIGN UP - OTP ── */}
            {method === "phone" && tab === "signup" && !otpSent && (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
                  <input
                    type="text" value={phoneName}
                    onChange={(e) => setPhoneName(e.target.value)}
                    placeholder="Full name" required
                    className={inputCls + " pl-11"}
                    style={{ fontSize: 16 }}
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#424656]">+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10} required
                    className={inputCls + " pl-14"}
                    style={{ fontSize: 16 }}
                  />
                </div>
                <button type="submit" disabled={loading} aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 px-6 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>
              </form>
            )}

            {/* ── OTP VERIFY ── */}
            {method === "phone" && otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <p className="text-sm text-[#424656] text-center">
                  OTP sent to <span className="font-bold text-[#1a1c1f]">+91 {phone}</span>
                  <button type="button" onClick={() => { setOtpSent(false); resetState(); }} className="ml-2 font-bold text-[#0056b7]">Change</button>
                </p>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c2c6d8]" />
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
                    className={inputCls + " pl-11 tracking-[0.3em] font-bold text-center"}
                    style={{ fontSize: 16 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 px-6 text-base font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
                <p className="text-center text-sm text-[#c2c6d8]">
                  {resendTimer > 0
                    ? <>Resend OTP in <span className="font-bold text-[#424656]">{resendTimer}s</span></>
                    : <button type="button" onClick={handleSendOtp} className="font-bold text-[#0056b7]">Resend OTP</button>
                  }
                </p>
              </form>
            )}

            {/* Switch tab hint */}
            {method === "email" && (
              <p className="text-center text-sm text-[#c2c6d8]">
                {tab === "login"
                  ? <>No account? <button onClick={() => { setTab("signup"); resetState(); }} className="font-bold text-[#0056b7]">Sign up free</button></>
                  : <>Have an account? <button onClick={() => { setTab("login"); resetState(); }} className="font-bold text-[#0056b7]">Log in</button></>
                }
              </p>
            )}

            <p className="text-center text-[10px] text-[#c2c6d8]">
              By continuing you agree to our Terms &amp; Privacy Policy
            </p>

          </div>
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
