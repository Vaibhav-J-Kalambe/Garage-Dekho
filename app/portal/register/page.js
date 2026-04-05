"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const SERVICES_LIST = [
  "General Repair","Oil Change","Tyre Service","Battery Replacement",
  "Brake Service","AC Repair","Wheel Alignment","Suspension",
  "Engine Repair","Electricals","Body Work","Accident Repair",
];

const STEPS = [
  { n: 1, label: "Account"  },
  { n: 2, label: "Basic Info" },
  { n: 3, label: "Location" },
  { n: 4, label: "Services" },
  { n: 5, label: "Hours"    },
  { n: 6, label: "Payout"   },
];

const inp = "w-full rounded-xl border border-[#e8e8f0] bg-[#f9f9fe] px-4 py-3 text-sm text-[#1a1c1f] outline-none focus:border-[#0056b7] focus:ring-1 focus:ring-[#0056b7]/20 transition";

export default function PortalRegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isComplete   = searchParams.get("complete") === "1";

  const [step, setStep] = useState(isComplete ? 2 : 1);
  const [userId, setUserId] = useState(null);

  // ── Step 1: Auth ──
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp,      setOtp]      = useState("");
  const [otpSent,  setOtpSent]  = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Step 2: Basic Info ──
  const [ownerName,   setOwnerName]   = useState("");
  const [garageName,  setGarageName]  = useState("");
  const [speciality,  setSpeciality]  = useState("");
  const [experience,  setExperience]  = useState("");
  const [about,       setAbout]       = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // ── Step 3: Location ──
  const [address,  setAddress]  = useState("");
  const [city,     setCity]     = useState("");
  const [pincode,  setPincode]  = useState("");
  const [lat,      setLat]      = useState(null);
  const [lng,      setLng]      = useState(null);
  const [locating, setLocating] = useState(false);

  // ── Step 4: Services ──
  const [services, setServices] = useState([{ name: "", price: "", duration: "" }]);

  // ── Step 5: Hours & Contact ──
  const [openTime,   setOpenTime]   = useState("09:00");
  const [closeTime,  setCloseTime]  = useState("21:00");
  const [closedDays, setClosedDays] = useState(["Sunday"]);
  const [phone,      setPhone]      = useState("");
  const [whatsapp,   setWhatsapp]   = useState("");
  const [garageEmail,setGarageEmail]= useState("");

  // ── Step 6: Payout ──
  const [upiId,       setUpiId]       = useState("");
  const [bankName,    setBankName]    = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc,    setBankIfsc]    = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isComplete) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUserId(session.user.id); setStep(2); }
    });
  }, [isComplete]);

  function startResendTimer() {
    setResendTimer(30);
    const t = setInterval(() => {
      setResendTimer((v) => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  }

  // ── Auth handlers ──
  async function handleGoogle() {
    setLoading(true); setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal/register?complete=1` },
    });
  }

  async function handleSendOtp(e) {
    e.preventDefault(); setLoading(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (err) { setError(err.message); setLoading(false); return; }
    setOtpSent(true); setLoading(false); startResendTimer();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault(); setLoading(true); setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.session?.user) {
      await supabase.auth.updateUser({ password });
      setUserId(data.session.user.id);
    }
    setLoading(false); setStep(2);
  }

  // ── Location detect ──
  function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude); setLng(coords.longitude);
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=16`, { headers: { "Accept-Language": "en" } });
          const data = await res.json();
          const a    = data.address ?? {};
          if (!address) setAddress([a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", "));
          if (!city)    setCity(a.city || a.town || a.village || "");
          if (!pincode) setPincode(a.postcode || "");
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Services helpers ──
  function addService()      { setServices((s) => [...s, { name: "", price: "", duration: "" }]); }
  function removeService(i)  { setServices((s) => s.filter((_, idx) => idx !== i)); }
  function updateService(i, key, val) {
    setServices((s) => s.map((svc, idx) => idx === i ? { ...svc, [key]: val } : svc));
  }
  function togglePreset(name) {
    setServices((prev) => {
      const exists = prev.find((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev.filter((s) => s.name !== ""), { name, price: "", duration: "" }];
    });
  }

  function toggleDay(day) {
    setClosedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }
  function toggleVehicle(v) {
    setVehicleTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  // ── Final submit ──
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/portal/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingId:  userId,
          email,
          password,
          ownerName:   ownerName.trim(),
          garageName:  garageName.trim(),
          speciality:  speciality.trim(),
          experience,
          about:       about.trim(),
          vehicleTypes,
          address:     address.trim(),
          city:        city.trim(),
          pincode:     pincode.trim(),
          lat, lng,
          services:    services.filter((s) => s.name.trim()),
          openTime, closeTime, closedDays,
          phone:       phone.trim(),
          whatsapp:    whatsapp.trim(),
          garageEmail: garageEmail.trim(),
          upiId:       upiId.trim(),
          bankName:    bankName.trim(),
          bankAccount: bankAccount.trim(),
          bankIfsc:    bankIfsc.trim().toUpperCase(),
        }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error || "Registration failed."); setLoading(false); return; }

      // Sign in if new account
      if (!userId) {
        await supabase.auth.signInWithPassword({ email, password });
      }
      router.replace("/portal/pending");
    } catch (err) {
      setError("Network error: " + err.message);
      setLoading(false);
    }
  }

  const stepTitles = ["", "Create Account", "Basic Info", "Location", "Services", "Hours & Contact", "Payout Details"];

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel - identical to login ── */}
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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-black text-white leading-none">GarageDekho</p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200/70">Partner Portal</p>
              </div>
            </div>

            <h1 className="text-[2.6rem] font-black leading-[1.1] text-white">Grow Your<br />Garage Business</h1>
            <p className="mt-4 max-w-xs text-base text-blue-100/75 leading-relaxed">
              Join hundreds of trusted garages already using GarageDekho to reach more customers.
            </p>

            <ul className="mt-10 flex flex-col gap-4">
              {[
                { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>, color: "#86efac", label: "Verified Partner Badge" },
                { icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>, color: "#93c5fd", label: "Live Bookings & SOS Requests" },
                { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, color: "#93c5fd", label: "Reach Thousands of Customers" },
                { icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, color: "#93c5fd", label: "24/7 Partner Support" },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{f.icon}</svg>
                  </div>
                  <span className="text-sm font-semibold text-blue-50">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col bg-white">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          ) : (
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            {STEPS.map(({ n }) => (
              <div key={n} className={`rounded-full transition-all ${step === n ? "w-4 h-2 bg-[#0056b7]" : step > n ? "w-2 h-2 bg-green-400" : "w-2 h-2 bg-slate-200"}`} />
            ))}
          </div>
          <div className="w-9" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-8 sm:py-10" style={{ paddingBottom: "max(24px, calc(env(safe-area-inset-bottom) + 24px))" }}>
          <div className="w-full max-w-sm my-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-md sm:p-6">

            {/* Step indicator inside card */}
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0056b7]">Step {step} of {STEPS.length}</p>
              <div className="flex items-center gap-1">
                {STEPS.map(({ n }) => (
                  <div key={n} className={`rounded-full transition-all ${step === n ? "w-4 h-1.5 bg-[#0056b7]" : step > n ? "w-1.5 h-1.5 bg-green-400" : "w-1.5 h-1.5 bg-slate-200"}`} />
                ))}
              </div>
            </div>
            <h2 className="text-[1.85rem] font-black tracking-tight text-slate-900 mb-6">{stepTitles[step]}</h2>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <div className="space-y-4">
                <button type="button" onClick={handleGoogle} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#e8e8f0] bg-white py-3 text-sm font-semibold text-[#1a1c1f] hover:bg-[#f9f9fe] active:scale-95 transition disabled:opacity-60">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#e8e8f0]" />
                  <span className="text-xs text-[#727687]">or with email</span>
                  <div className="flex-1 h-px bg-[#e8e8f0]" />
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required style={{ fontSize: 16 }} className={inp} />
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" required minLength={6} style={{ fontSize: 16 }} className={inp + " pr-12"} />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727687] hover:text-[#1a1c1f]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
                      </button>
                    </div>
                    <button type="submit" disabled={loading || !email || !password} className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                      {loading ? "Sending code…" : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <p className="text-sm text-[#727687]">Code sent to <span className="font-semibold text-[#1a1c1f]">{email}</span></p>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} required style={{ fontSize: 16 }} className={inp + " text-center tracking-[0.3em] font-mono text-lg"} />
                    <button type="submit" disabled={loading || !otp} className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                      {loading ? "Verifying…" : "Verify & Continue"}
                    </button>
                    <button type="button" onClick={resendTimer > 0 ? undefined : handleSendOtp} className={`w-full text-sm text-center ${resendTimer > 0 ? "text-[#c2c6d8]" : "text-[#0056b7] hover:underline"}`}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                    </button>
                  </form>
                )}

                <p className="text-center text-xs text-[#727687] pt-2">
                  Already registered?{" "}
                  <Link href="/portal/login" className="font-semibold text-[#0056b7] hover:underline">Sign in</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2: Basic Info ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Your Name *</label>
                  <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Rajesh Kumar" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Garage Name *</label>
                  <input type="text" value={garageName} onChange={(e) => setGarageName(e.target.value)} placeholder="e.g. Kumar Auto Works" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Speciality</label>
                  <input type="text" value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. AC Repair Specialist, Multi-brand" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Years of Experience</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} style={{ fontSize: 16 }} className={inp}>
                    <option value="">Select</option>
                    {["Less than 1 year","1-3 years","3-5 years","5-10 years","10-20 years","20+ years"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">About Your Garage</label>
                  <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell customers what makes your garage special…" rows={3} style={{ fontSize: 16 }} className={inp + " resize-none"} />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#727687]">Vehicle Types Served</label>
                  <div className="flex flex-wrap gap-2">
                    {["2-Wheeler","4-Wheeler","EV","Commercial"].map((v) => (
                      <button key={v} type="button" onClick={() => toggleVehicle(v)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${vehicleTypes.includes(v) ? "border-[#0056b7] bg-[#0056b7]/10 text-[#0056b7]" : "border-[#e8e8f0] text-[#727687] hover:border-[#0056b7]/30"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" disabled={!ownerName || !garageName} onClick={() => setStep(3)}
                  className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 3: Location ── */}
            {step === 3 && (
              <div className="space-y-4">
                <button type="button" onClick={detectLocation} disabled={locating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#0056b7]/30 bg-[#0056b7]/5 py-3 text-sm font-semibold text-[#0056b7] hover:bg-[#0056b7]/10 active:scale-95 transition disabled:opacity-60">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                  {locating ? "Detecting…" : "Use Current Location"}
                </button>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Street Address *</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop no, street, area" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">City *</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" style={{ fontSize: 16 }} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Pincode</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400001" inputMode="numeric" maxLength={6} style={{ fontSize: 16 }} className={inp} />
                  </div>
                </div>
                {lat && lng && (
                  <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-xs font-semibold text-green-700 border border-green-100">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Location pinned: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </div>
                )}
                <button type="button" disabled={!address || !city} onClick={() => setStep(4)}
                  className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 4: Services ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#727687]">Quick Select</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SERVICES_LIST.map((s) => {
                      const active = services.some((svc) => svc.name === s);
                      return (
                        <button key={s} type="button" onClick={() => togglePreset(s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${active ? "border-[#0056b7] bg-[#0056b7]/10 text-[#0056b7]" : "border-[#e8e8f0] text-[#727687] hover:border-[#0056b7]/30"}`}>
                          {active && "✓ "}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-[#727687]">Add Price & Duration</p>
                <div className="space-y-3">
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={svc.name} onChange={(e) => updateService(i, "name", e.target.value)} placeholder="Service name" style={{ fontSize: 16 }} className={inp + " flex-[2]"} />
                      <input type="text" value={svc.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder="₹299" style={{ fontSize: 16 }} className={inp + " flex-1"} />
                      <input type="text" value={svc.duration} onChange={(e) => updateService(i, "duration", e.target.value)} placeholder="1 hr" style={{ fontSize: 16 }} className={inp + " flex-1"} />
                      {services.length > 1 && (
                        <button type="button" onClick={() => removeService(i)} className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-[#c2c6d8] hover:bg-red-50 hover:text-red-400 transition">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addService} className="text-sm font-semibold text-[#0056b7] hover:underline">+ Add another service</button>
                <button type="button" onClick={() => setStep(5)}
                  className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 transition">
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 5: Hours & Contact ── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Opens at</label>
                    <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={{ fontSize: 16 }} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Closes at</label>
                    <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={{ fontSize: 16 }} className={inp} />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#727687]">Closed on</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button key={day} type="button" onClick={() => toggleDay(day)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${closedDays.includes(day) ? "border-red-200 bg-red-50 text-red-600" : "border-[#e8e8f0] text-[#727687] hover:border-[#c2c6d8]"}`}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Phone *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" inputMode="numeric" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">WhatsApp <span className="normal-case font-normal">(optional)</span></label>
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Same as phone or different" inputMode="numeric" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Garage Email <span className="normal-case font-normal">(optional)</span></label>
                  <input type="email" value={garageEmail} onChange={(e) => setGarageEmail(e.target.value)} placeholder="garage@example.com" style={{ fontSize: 16 }} className={inp} />
                </div>
                <button type="button" disabled={!phone} onClick={() => setStep(6)}
                  className="w-full rounded-xl bg-[#0056b7] py-3 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition">
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 6: Payout Details ── */}
            {step === 6 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-[#727687] leading-relaxed -mt-2">
                  Add your payout details so we can transfer your earnings after each booking. You can also add these later from your profile.
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">UPI ID <span className="normal-case font-normal text-green-600">(Recommended - instant transfer)</span></label>
                  <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" style={{ fontSize: 16 }} className={inp} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#e8e8f0]" />
                  <span className="text-xs text-[#727687]">or bank account</span>
                  <div className="flex-1 h-px bg-[#e8e8f0]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Account Holder Name</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Name as per bank" style={{ fontSize: 16 }} className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">Account Number</label>
                    <input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Account number" style={{ fontSize: 16 }} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#727687]">IFSC Code</label>
                    <input type="text" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="SBIN0001234" style={{ fontSize: 16 }} className={inp + " font-mono"} />
                  </div>
                </div>

                <p className="text-[11px] text-[#c2c6d8]">You can skip payout details and add them later from your portal profile.</p>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[#0056b7] py-3.5 text-sm font-bold text-white hover:brightness-110 active:scale-95 disabled:opacity-60 transition">
                  {loading ? "Submitting…" : "Submit & Go Live 🚀"}
                </button>
                <button type="button" onClick={() => setStep(5)} className="w-full text-sm text-[#727687] hover:text-[#1a1c1f] transition">
                  ← Back
                </button>
              </form>
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
