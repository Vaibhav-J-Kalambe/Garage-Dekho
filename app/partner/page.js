"use client";

import { useState } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
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
    <div className="flex items-start justify-between px-2 mb-8">
      {labels.map((label, i) => {
        const step = i + 1;
        const done   = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex flex-1 flex-col items-center gap-1 relative">
            {/* Connector line — left half */}
            {i > 0 && (
              <div className={`absolute left-0 top-4 h-0.5 w-1/2 -translate-y-1/2 transition-all duration-500 ${done || active ? "bg-primary" : "bg-slate-200"}`} />
            )}
            {/* Connector line — right half */}
            {i < labels.length - 1 && (
              <div className={`absolute right-0 top-4 h-0.5 w-1/2 -translate-y-1/2 transition-all duration-500 ${done ? "bg-primary" : "bg-slate-200"}`} />
            )}
            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
              done   ? "bg-green-500 text-white" :
              active ? "bg-primary text-white ring-4 ring-primary/20" :
                       "bg-slate-100 text-slate-400"
            }`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : step}
            </div>
            <span className={`hidden sm:block text-[10px] font-bold text-center leading-tight mt-1 ${
              active ? "text-primary" : done ? "text-green-500" : "text-slate-400"
            }`}>{label}</span>
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

const inputCls = "w-full min-h-[48px] rounded-xl border border-slate-200 px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20";

export default function PartnerPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);

  // Step 1 — Basic Info
  const [ownerName,    setOwnerName]    = useState("");
  const [garageName,   setGarageName]   = useState("");
  const [speciality,   setSpeciality]   = useState("");
  const [about,        setAbout]        = useState("");
  const [experience,   setExperience]   = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Step 2 — Location
  const [address,  setAddress]  = useState("");
  const [city,     setCity]     = useState("");
  const [pincode,  setPincode]  = useState("");
  const [lat,      setLat]      = useState("");
  const [lng,      setLng]      = useState("");

  // Step 3 — Services
  const [services, setServices] = useState([
    { name: "", price: "", duration: "" },
  ]);

  // Step 4 — Hours & Contact
  const [openHours,    setOpenHours]    = useState("");
  const [customHours,  setCustomHours]  = useState("");
  const [phone,        setPhone]        = useState("");
  const [whatsapp,     setWhatsapp]     = useState("");
  const [email,        setEmail]        = useState("");

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
      if (blank >= 0) {
        return prev.map((s, i) => i === blank ? { ...tpl } : s);
      }
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
            "https://nominatim.openstreetmap.org/reverse?format=json&lat=" +
            coords.latitude + "&lon=" + coords.longitude + "&addressdetails=1",
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
      if (!ownerName.trim()) { setError("Owner name is required."); return false; }
      if (!garageName.trim()) { setError("Garage name is required."); return false; }
      if (!speciality.trim()) { setError("Speciality is required."); return false; }
      if (vehicleTypes.length === 0) { setError("Select at least one vehicle type."); return false; }
    }
    if (step === 2) {
      if (!address.trim()) { setError("Address is required."); return false; }
      if (!city.trim())    { setError("City is required."); return false; }
      if (!pincode.trim()) { setError("Pincode is required."); return false; }
    }
    if (step === 3) {
      const valid = services.filter((s) => s.name.trim() && s.price.trim());
      if (valid.length === 0) { setError("Add at least one service with name and price."); return false; }
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
      const finalHours = openHours === "Custom" ? customHours : openHours;
      const validServices = services.filter((s) => s.name.trim() && s.price.trim());

      const res = await fetch("/api/garage-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name:   ownerName.trim(),
          garage_name:  garageName.trim(),
          speciality:   speciality.trim(),
          about:        about.trim(),
          experience:   experience.trim(),
          vehicle_types: vehicleTypes.join(", "),
          address:      address.trim(),
          city:         city.trim(),
          pincode:      pincode.trim(),
          lat, lng,
          services:     validServices,
          open_hours:   finalHours,
          phone:        phone.trim(),
          whatsapp:     whatsapp.trim(),
          email:        email.trim(),
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

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0047BE] via-[#0056D2] to-[#3730A3]">
        {/* Confetti dots */}
        {["top-8 left-12","top-16 right-16","top-4 left-1/2","bottom-32 left-8","bottom-20 right-10","top-32 right-8"].map((pos, i) => (
          <div key={i} className={`pointer-events-none absolute ${pos} h-3 w-3 rounded-full opacity-70 animate-ping`}
            style={{ backgroundColor: ["#F59E0B","#34D399","#F87171","#60A5FA","#A78BFA","#FBBF24"][i], animationDelay: `${i * 150}ms` }} />
        ))}
        <div className="relative w-full max-w-md mx-4 animate-pop">
          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_8px_32px_rgba(52,211,153,0.45)]">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Application Submitted!</h1>
            <p className="mt-2 text-sm font-semibold text-primary">{garageName}</p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              We've received your application, <strong>{ownerName}</strong>. Our team will contact you on <strong>{phone}</strong> within 24–48 hours.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">What happens next</p>
              {["Our team reviews your application", "We verify your garage location", "You get a call for final onboarding", "Your garage goes live on GarageDekho"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
            <a href="/" className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-[0.98]">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Hero band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0047BE] via-[#0056D2] to-[#3730A3] px-4 pb-16 pt-6 md:px-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-white/[0.04]" />
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <a href="/" className="text-xl font-black text-white">GarageDekho</a>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-blue-200">Partner Onboarding</p>
            <h1 className="mt-2 text-2xl font-black text-white">List Your Garage</h1>
            <p className="mt-0.5 text-sm text-blue-100/80">Join 500+ garages earning more with us</p>
          </div>
          <div className="shrink-0 hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Wrench className="h-8 w-8 text-white/80" />
          </div>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-slate-50">
      <div className="mx-auto max-w-lg px-4 pt-8">

        <StepIndicator current={step} />

        <div className="rounded-3xl bg-white p-6 shadow-sm space-y-5">

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Basic Information</h2>
              </div>

              <InputField label="Your Name" required>
                <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar" className={inputCls} />
              </InputField>

              <InputField label="Garage Name" required>
                <input value={garageName} onChange={(e) => setGarageName(e.target.value)}
                  placeholder="e.g. Kumar Auto Works" className={inputCls} />
              </InputField>

              <InputField label="Speciality" required>
                <input value={speciality} onChange={(e) => setSpeciality(e.target.value)}
                  placeholder="e.g. AC Repair Specialist, Multi-brand" className={inputCls} />
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
                <textarea value={about} onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell customers what makes your garage special..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </InputField>

              <InputField label="Vehicle Types Supported" required>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPE_OPTIONS.map(({ value, icon: VIcon }) => (
                    <button key={value} type="button" onClick={() => toggleVehicleType(value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition active:scale-95 ${
                        vehicleTypes.includes(value)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-100 text-slate-500 hover:border-primary/30"
                      }`}>
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
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Garage Location</h2>
              </div>

              <button type="button" onClick={detectLocation} disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-3 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60">
                {locating ? <><Loader2 className="h-4 w-4 animate-spin" /> Detecting…</> : <><LocateFixed className="h-4 w-4" /> Auto-detect my location</>}
              </button>

              <InputField label="Street Address" required>
                <input value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop 4, MG Road, Near Bus Stand" className={inputCls} />
              </InputField>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="City" required>
                  <input value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai" className={inputCls} />
                </InputField>
                <InputField label="Pincode" required>
                  <input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="400001" className={inputCls} maxLength={6} />
                </InputField>
              </div>

              {lat && lng && (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-green-700 font-semibold">GPS captured: {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}</p>
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
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Services & Pricing</h2>
              </div>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Quick Add</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TEMPLATES.map((tpl) => (
                    <button key={tpl.name} type="button" onClick={() => addTemplate(tpl)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-primary hover:text-primary active:scale-95">
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
                        <button type="button" onClick={() => removeService(i)}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <input value={svc.name} onChange={(e) => updateService(i, "name", e.target.value)}
                      placeholder="Service name *" className={inputCls} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={svc.price} onChange={(e) => updateService(i, "price", e.target.value)}
                        placeholder="Price (e.g. ₹499)" className={inputCls} />
                      <input value={svc.duration} onChange={(e) => updateService(i, "duration", e.target.value)}
                        placeholder="Duration (e.g. 1 hr)" className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addService}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-3 text-sm font-bold text-primary transition hover:bg-primary/5">
                <Plus className="h-4 w-4" /> Add Another Service
              </button>
            </>
          )}

          {/* ── STEP 4: Hours & Contact ── */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Hours & Contact</h2>
              </div>

              <InputField label="Operating Hours" required>
                <div className="grid grid-cols-1 gap-2">
                  {HOURS_OPTIONS.map((h) => (
                    <button key={h} type="button" onClick={() => setOpenHours(h)}
                      className={`rounded-xl border px-3 py-3 text-sm font-bold text-left transition active:scale-[0.98] ${
                        openHours === h
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-100 text-slate-600 hover:border-primary/30"
                      }`}>
                      {h}
                    </button>
                  ))}
                </div>
              </InputField>

              {openHours === "Custom" && (
                <InputField label="Custom Hours">
                  <input value={customHours} onChange={(e) => setCustomHours(e.target.value)}
                    placeholder="e.g. 10:00 AM – 6:00 PM (Mon–Sat)" className={inputCls} />
                </InputField>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Phone className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Contact Details</h2>
              </div>

              <InputField label="Mobile Number" required>
                <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number" className={inputCls} maxLength={10} />
              </InputField>

              <InputField label="WhatsApp Number">
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Same as mobile or different" className={inputCls} maxLength={10} />
              </InputField>

              <InputField label="Email Address">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="garage@example.com" className={inputCls} />
              </InputField>
            </>
          )}

          {/* ── STEP 5: Review & Submit ── */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-slate-900">Review & Submit</h2>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Owner", value: ownerName },
                  { label: "Garage", value: garageName },
                  { label: "Speciality", value: speciality },
                  { label: "Experience", value: experience },
                  { label: "Vehicle Types", value: vehicleTypes.join(", ") },
                  { label: "Address", value: [address, city, pincode].filter(Boolean).join(", ") },
                  { label: "GPS", value: lat && lng ? lat + ", " + lng : "Not captured" },
                  { label: "Hours", value: openHours === "Custom" ? customHours : openHours },
                  { label: "Phone", value: phone },
                  { label: "WhatsApp", value: whatsapp || "—" },
                  { label: "Email", value: email || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span className="w-28 shrink-0 font-bold text-slate-400">{label}</span>
                    <span className="text-slate-800 break-all">{value || "—"}</span>
                  </div>
                ))}

                <div>
                  <p className="mb-2 text-sm font-bold text-slate-400">Services ({services.filter(s => s.name).length})</p>
                  <div className="space-y-1">
                    {services.filter(s => s.name.trim()).map((s, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-semibold text-slate-700">{s.name}</span>
                        <span className="font-black text-primary">{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700 font-semibold">
                  By submitting, you confirm that all details are accurate. Our team will verify and contact you within 24–48 hours.
                </p>
              </div>
            </>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={back}
                className="flex items-center gap-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button type="button" onClick={next}
                className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white transition hover:bg-green-600 active:scale-[0.98] disabled:opacity-60">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Submit Application <CheckCircle2 className="h-4 w-4" /></>}
              </button>
            )}
          </div>

        </div>

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { Icon: Lock,          text: "Secure & Private", color: "text-slate-600" },
            { Icon: Sparkles,      text: "Go live in 48hrs", color: "text-primary"   },
            { Icon: IndianRupee,   text: "Zero listing fee", color: "text-green-600" },
          ].map(({ Icon, text, color }) => (
            <div key={text} className="rounded-2xl bg-white p-3 shadow-sm">
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
