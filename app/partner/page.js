"use client";

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle,
  MapPin, Phone, Clock, Wrench, User, Building2,
  Plus, Trash2, LocateFixed, Car, Bike, Zap, Truck,
  Lock, IndianRupee, Sparkles,
} from "lucide-react";

const TOTAL_STEPS = 5;

const VEHICLE_TYPE_OPTIONS = [
  { value: "4-Wheeler",     icon: Car   },
  { value: "2-Wheeler",     icon: Bike  },
  { value: "EV",            icon: Zap   },
  { value: "Heavy Vehicle", icon: Truck },
];

const SERVICE_TEMPLATES = [
  { name: "Oil Change",       price: "₹499",  duration: "45 min" },
  { name: "Car Service",      price: "₹1499", duration: "3 hrs"  },
  { name: "Bike Service",     price: "₹299",  duration: "1 hr"   },
  { name: "Tyre Repair",      price: "₹199",  duration: "30 min" },
  { name: "Battery Check",    price: "₹99",   duration: "20 min" },
  { name: "AC Repair",        price: "₹999",  duration: "2 hrs"  },
  { name: "Engine Repair",    price: "₹2499", duration: "4 hrs"  },
  { name: "Brake Service",    price: "₹599",  duration: "1 hr"   },
  { name: "Wheel Alignment",  price: "₹399",  duration: "45 min" },
  { name: "General Repair",   price: "₹299",  duration: "1 hr"   },
];

const HOURS_OPTIONS = [
  "8:00 AM – 8:00 PM",
  "9:00 AM – 7:00 PM",
  "8:00 AM – 10:00 PM",
  "24 Hours",
  "Custom",
];

function StepIndicator({ current }) {
  const labels = ["Basic Info", "Location", "Services", "Hours & Contact", "Review"];
  return (
    <div className="mb-2 flex items-start justify-between px-2">
      {labels.map((label, i) => {
        const step   = i + 1;
        const done   = step < current;
        const active = step === current;
        return (
          <div key={step} className="relative flex flex-1 flex-col items-center gap-1">
            {i > 0 && (
              <div className={`absolute left-0 top-4 h-0.5 w-1/2 -translate-y-1/2 transition-all duration-500 ${done ? "bg-green-500" : active ? "bg-[#0056D2]" : "bg-slate-200"}`} />
            )}
            {i < labels.length - 1 && (
              <div className={`absolute right-0 top-4 h-0.5 w-1/2 -translate-y-1/2 transition-all duration-500 ${done ? "bg-green-500" : "bg-slate-200"}`} />
            )}
            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
              done   ? "bg-green-500 text-white" :
              active ? "bg-[#0056D2] text-white ring-4 ring-[#0056D2]/20" :
                       "bg-slate-200 text-slate-500"
            }`}>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              ) : step}
            </div>
            <span className={`mt-1 text-center text-[10px] font-bold leading-tight ${
              active ? "text-[#0056D2]" : done ? "text-green-600" : "text-slate-400"
            } ${active ? "block" : "hidden sm:block"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function InputField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-400">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

/* text-[16px] prevents iOS Safari auto-zoom */
const inputCls = "w-full min-h-[48px] rounded-xl border border-slate-200 px-3 py-3 text-[16px] leading-snug text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors duration-150";

export default function PartnerPage() {
  const [step,       setStep]       = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState(null);
  const [locating,   setLocating]   = useState(false);

  // Step 1
  const [ownerName,    setOwnerName]    = useState("");
  const [garageName,   setGarageName]   = useState("");
  const [speciality,   setSpeciality]   = useState("");
  const [about,        setAbout]        = useState("");
  const [experience,   setExperience]   = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Step 2
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("");
  const [pincode, setPincode] = useState("");
  const [lat,     setLat]     = useState("");
  const [lng,     setLng]     = useState("");

  // Step 3
  const [services, setServices] = useState([{ name: "", price: "", duration: "" }]);

  // Step 4
  const [openHours,   setOpenHours]   = useState("");
  const [customHours, setCustomHours] = useState("");
  const [phone,       setPhone]       = useState("");
  const [whatsapp,    setWhatsapp]    = useState("");
  const [email,       setEmail]       = useState("");

  function toggleVehicleType(type) {
    setVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function addService() {
    setServices((prev) => [...prev, { name: "", price: "", duration: "" }]);
  }

  function removeService(i) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateService(i, field, value) {
    setServices((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function addTemplate(tpl) {
    if (services.some((s) => s.name === tpl.name)) return;
    setServices((prev) => {
      const blank = prev.findIndex((s) => !s.name && !s.price);
      if (blank >= 0) return prev.map((s, i) => i === blank ? { ...tpl } : s);
      return [...prev, { ...tpl }];
    });
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude.toFixed(6));
        setLng(coords.longitude.toFixed(6));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          setAddress([a.road || a.pedestrian, a.neighbourhood || a.suburb].filter(Boolean).join(", "));
          setCity(a.city || a.town || a.village || "");
          setPincode(a.postcode || "");
        } catch { /* ignore */ }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validateStep() {
    setError(null);
    if (step === 1) {
      if (!ownerName.trim())    { setError("Owner name is required.");    return false; }
      if (!garageName.trim())   { setError("Garage name is required.");   return false; }
      if (!speciality.trim())   { setError("Speciality is required.");    return false; }
      if (!vehicleTypes.length) { setError("Select at least one vehicle type."); return false; }
    }
    if (step === 2) {
      if (!address.trim()) { setError("Address is required."); return false; }
      if (!city.trim())    { setError("City is required.");    return false; }
      if (!pincode.trim()) { setError("Pincode is required."); return false; }
    }
    if (step === 3) {
      const valid = services.filter((s) => s.name.trim() && s.price.trim());
      if (!valid.length) { setError("Add at least one service with name and price."); return false; }
    }
    if (step === 4) {
      if (!phone.trim()) { setError("Phone number is required."); return false; }
      if (!/^[6-9]\d{9}$/.test(phone.trim())) { setError("Enter a valid 10-digit Indian mobile number."); return false; }
      const hrs = openHours === "Custom" ? customHours : openHours;
      if (!hrs.trim()) { setError("Operating hours are required."); return false; }
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true); setError(null);
    try {
      const finalHours    = openHours === "Custom" ? customHours : openHours;
      const validServices = services.filter((s) => s.name.trim() && s.price.trim());
      const res = await fetch("/api/garage-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name:    ownerName.trim(),
          garage_name:   garageName.trim(),
          speciality:    speciality.trim(),
          about:         about.trim(),
          experience:    experience.trim(),
          vehicle_types: vehicleTypes.join(", "),
          address:       address.trim(),
          city:          city.trim(),
          pincode:       pincode.trim(),
          lat, lng,
          services:      validServices,
          open_hours:    finalHours,
          phone:         phone.trim(),
          whatsapp:      whatsapp.trim(),
          email:         email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success Screen ────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">
        {["top-8 left-12","top-16 right-16","top-4 left-1/2","bottom-32 left-8","bottom-20 right-10","top-32 right-8"].map((pos, i) => (
          <div key={i} className={`pointer-events-none absolute ${pos} h-3 w-3 rounded-full opacity-70 animate-ping`}
            style={{ backgroundColor: ["#F59E0B","#34D399","#F87171","#60A5FA","#A78BFA","#FBBF24"][i], animationDelay: `${i * 150}ms` }} />
        ))}
        <div className="relative mx-4 w-full max-w-md animate-pop">
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_8px_32px_rgba(52,211,153,0.45)]">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Application Submitted!</h1>
            <p className="mt-2 text-sm font-semibold text-primary">{garageName}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              We've received your application, <strong>{ownerName}</strong>. Our team will contact you on <strong>{phone}</strong> within 24–48 hours.
            </p>
            <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-50 p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">What happens next</p>
              {["Our team reviews your application","We verify your garage location","You get a call for final onboarding","Your garage goes live on GarageDekho"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
            <a
              href="/"
              className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2]">

      {/* ── Hero ── */}
      <div
        data-hero
        className="relative overflow-hidden bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] pb-32 pt-[77px] text-center"
      >
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
          aria-hidden="true"
        />
        {/* Glow blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />

        {/* Back to home */}
        <a
          href="/"
          aria-label="Back to GarageDekho"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>

        {/* Logo + heading */}
        <div className="relative z-10 mx-auto max-w-sm px-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0056D2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">GarageDekho</h1>
          <p className="mt-1 text-sm text-blue-200">Partner Onboarding</p>

          {/* Trust chips */}
          <div className="mt-4 flex items-center justify-center gap-x-3 text-[11px] font-semibold text-blue-200">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              Free Listing
            </span>
            <span className="h-3 w-px bg-blue-300/40 shrink-0" />
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              5 min setup
            </span>
            <span className="h-3 w-px bg-blue-300/40 shrink-0" />
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              1000+ Partners
            </span>
          </div>
        </div>
      </div>

      {/* ── Pull-up card ── */}
      <div
        className="relative -mt-12 flex-1 rounded-t-[3rem] bg-[#F8FAFC] overflow-y-auto px-4 pt-8 md:px-8"
        style={{ paddingBottom: "max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))" }}
      >
        <div className="mx-auto max-w-lg">

          {/* Step indicator */}
          <div className="mb-6">
            <StepIndicator current={step} />
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card sm:p-6 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-semibold text-red-500">{error}</p>
              </div>
            )}

            {/* ── STEP 1: Basic Info ── */}
            {step === 1 && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Basic Information</h2>
                </div>

                <InputField label="Your Name" required>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    autoComplete="name"
                    className={inputCls}
                  />
                </InputField>

                <InputField label="Garage Name" required>
                  <input
                    value={garageName}
                    onChange={(e) => setGarageName(e.target.value)}
                    placeholder="e.g. Kumar Auto Works"
                    autoComplete="organization"
                    className={inputCls}
                  />
                </InputField>

                <InputField label="Speciality" required>
                  <input
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="e.g. AC Repair Specialist, Multi-brand"
                    className={inputCls}
                  />
                </InputField>

                <InputField label="Years of Experience">
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls}>
                    <option value="">Select</option>
                    {["Less than 1 year","1–3 years","3–5 years","5–10 years","10+ years"].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="About Your Garage">
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell customers what makes your garage special..."
                    rows={3}
                    className={inputCls + " resize-none"}
                  />
                </InputField>

                <InputField label="Vehicle Types Supported" required>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_TYPE_OPTIONS.map(({ value, icon: VIcon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleVehicleType(value)}
                        className={`flex min-h-[52px] items-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition-colors duration-150 active:scale-95 ${
                          vehicleTypes.includes(value)
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-100 text-slate-500 hover:border-primary/30"
                        }`}
                      >
                        <VIcon className="h-4 w-4 shrink-0" />
                        {value}
                      </button>
                    ))}
                  </div>
                </InputField>
              </>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 2 && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Garage Location</h2>
                </div>

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 text-sm font-bold text-primary transition-colors duration-150 hover:bg-primary/10 active:scale-[0.98] disabled:opacity-60"
                >
                  {locating
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Detecting…</>
                    : <><LocateFixed className="h-4 w-4" /> Auto-detect my location</>
                  }
                </button>

                <InputField label="Street Address" required>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 4, MG Road, Near Bus Stand"
                    autoComplete="street-address"
                    className={inputCls}
                  />
                </InputField>

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="City" required>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      autoComplete="address-level2"
                      className={inputCls}
                    />
                  </InputField>
                  <InputField label="Pincode" required>
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="400001"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      className={inputCls}
                    />
                  </InputField>
                </div>

                {lat && lng && (
                  <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-xs font-semibold text-green-700">
                      GPS captured: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  GPS coordinates help customers find your garage on the map. Use auto-detect or we'll geocode your address.
                </p>
              </>
            )}

            {/* ── STEP 3: Services ── */}
            {step === 3 && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Services & Pricing</h2>
                </div>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Quick Add</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => addTemplate(tpl)}
                        className="min-h-[44px] rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors duration-150 hover:border-primary hover:text-primary active:scale-95"
                      >
                        + {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {services.map((svc, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500">Service {i + 1}</p>
                        {services.length > 1 && (
                          <button
                            type="button"
                            aria-label="Remove service"
                            onClick={() => removeService(i)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-red-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <input
                        value={svc.name}
                        onChange={(e) => updateService(i, "name", e.target.value)}
                        placeholder="Service name *"
                        className={inputCls}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={svc.price}
                          onChange={(e) => updateService(i, "price", e.target.value)}
                          placeholder="Price (e.g. ₹499)"
                          className={inputCls}
                        />
                        <input
                          value={svc.duration}
                          onChange={(e) => updateService(i, "duration", e.target.value)}
                          placeholder="Duration (e.g. 1 hr)"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addService}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-bold text-primary transition-colors duration-150 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" /> Add Another Service
                </button>
              </>
            )}

            {/* ── STEP 4: Hours & Contact ── */}
            {step === 4 && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Hours & Contact</h2>
                </div>

                <InputField label="Operating Hours" required>
                  <div className="grid grid-cols-1 gap-2">
                    {HOURS_OPTIONS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setOpenHours(h)}
                        className={`min-h-[48px] rounded-xl border px-3 py-3 text-left text-sm font-bold transition-colors duration-150 active:scale-[0.98] ${
                          openHours === h
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-100 text-slate-600 hover:border-primary/30"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </InputField>

                {openHours === "Custom" && (
                  <InputField label="Custom Hours">
                    <input
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      placeholder="e.g. 10:00 AM – 6:00 PM (Mon–Sat)"
                      className={inputCls}
                    />
                  </InputField>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Contact Details</h2>
                </div>

                <InputField label="Mobile Number" required>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={10}
                    className={inputCls}
                  />
                </InputField>

                <InputField label="WhatsApp Number">
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Same as mobile or different"
                    inputMode="tel"
                    maxLength={10}
                    className={inputCls}
                  />
                </InputField>

                <InputField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="garage@example.com"
                    autoComplete="email"
                    inputMode="email"
                    className={inputCls}
                  />
                </InputField>
              </>
            )}

            {/* ── STEP 5: Review & Submit ── */}
            {step === 5 && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-slate-900">Review & Submit</h2>
                </div>

                <div className="space-y-3">
                  {[
                    ["Owner",         ownerName],
                    ["Garage",        garageName],
                    ["Speciality",    speciality],
                    ["Experience",    experience],
                    ["Vehicle Types", vehicleTypes.join(", ")],
                    ["Address",       [address, city, pincode].filter(Boolean).join(", ")],
                    ["GPS",           lat && lng ? "Auto-detected ✓" : "Not captured"],
                    ["Hours",         openHours === "Custom" ? customHours : openHours],
                    ["Phone",         phone],
                    ["WhatsApp",      whatsapp || "—"],
                    ["Email",         email || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <span className="w-28 shrink-0 font-bold text-slate-400">{label}</span>
                      <span className="break-all text-slate-800">{value || "—"}</span>
                    </div>
                  ))}

                  <div>
                    <p className="mb-2 text-sm font-bold text-slate-400">
                      Services ({services.filter((s) => s.name).length})
                    </p>
                    <div className="space-y-1">
                      {services.filter((s) => s.name.trim()).map((s, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                          <span className="font-semibold text-slate-700">{s.name}</span>
                          <span className="font-black text-primary">{s.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    By submitting, you confirm that all details are accurate. Our team will verify and contact you within 24–48 hours.
                  </p>
                </div>
              </>
            )}

            {/* ── Navigation ── */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex min-h-[48px] items-center gap-1 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-2xl bg-primary text-sm font-bold text-white shadow-glow-primary transition-colors duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 text-sm font-bold text-white transition-colors duration-150 hover:bg-green-600 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <>Submit Application <CheckCircle2 className="h-4 w-4" /></>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { Icon: Lock,        text: "Secure & Private", color: "text-slate-600" },
              { Icon: Sparkles,    text: "Go live in 48hrs", color: "text-primary"   },
              { Icon: IndianRupee, text: "Zero listing fee",  color: "text-green-600" },
            ].map(({ Icon, text, color }) => (
              <div key={text} className="rounded-2xl bg-white p-3 shadow-card">
                <Icon className={`mx-auto h-5 w-5 ${color}`} />
                <p className="mt-1 text-[11px] font-bold text-slate-500">{text}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
