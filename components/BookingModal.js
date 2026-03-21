"use client";

import { useState, useEffect, useRef } from "react";
import { X, Truck, Car, Bike, Zap, Wrench, Loader2, CheckCircle2, Tag, Check, MapPin, LocateFixed, CreditCard, Store, Calendar, Star } from "lucide-react";
import { createBooking, getLastBooking } from "../lib/bookings";
import { useAuth } from "./AuthProvider";
import { getUserVehicles } from "../lib/vehicles";
import SwipeableSheet from "./SwipeableSheet";
import { useFocusTrap } from "../hooks/useFocusTrap";
import DatePicker from "./ui/DatePicker";

// Promo codes are validated server-side — see /api/promo/validate

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "2:00 PM",  "3:00 PM",
  "4:00 PM",  "5:00 PM",  "6:00 PM",
];

const VEHICLE_TYPES = [
  { label: "Car",   icon: Car,    requires: "4-Wheeler" },
  { label: "Bike",  icon: Bike,   requires: "2-Wheeler" },
  { label: "EV",    icon: Zap,    requires: "EV"        },
  { label: "Other", icon: Wrench, requires: null        },
];

export default function BookingModal({ garage, preselectedService, onClose, onSuccess }) {
  const { user } = useAuth();
  const scrollRef  = useRef(null);
  const trapRef    = useRef(null);
  useFocusTrap(trapRef, { onEscape: onClose });

  const [service,     setService]     = useState(preselectedService ?? garage?.services?.[0] ?? null);
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const supportedVehicles = VEHICLE_TYPES.filter(({ requires }) =>
    !requires || (garage.vehicleType || "").includes(requires)
  );
  const [vehicleType, setVehicleType] = useState(supportedVehicles[0]?.label ?? "Car");

  // Pre-fill vehicle type from user's saved vehicles
  useEffect(() => {
    if (!user) return;
    getUserVehicles(user.id).then((vehicles) => {
      if (!vehicles.length) return;
      const first = vehicles[0];
      // Map saved vehicle type to a supported booking type
      const typeMap = { Car: "Car", Bike: "Bike", EV: "EV", Other: "Other" };
      const mapped = typeMap[first.type] ?? "Car";
      const isSupported = supportedVehicles.some((v) => v.label === mapped);
      if (isSupported) setVehicleType(mapped);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const [pickupDrop,    setPickupDrop]    = useState(false);
  const [flatNo,        setFlatNo]        = useState("");
  const [building,      setBuilding]      = useState("");
  const [landmark,      setLandmark]      = useState("");
  const [locality,      setLocality]      = useState("");
  const [locating,      setLocating]      = useState(false);
  const [notes,         setNotes]         = useState("");
  const promoCache    = useRef(new Map());
  const [promoInput,  setPromoInput]  = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError,  setPromoError]  = useState(null);
  const [payMethod,   setPayMethod]   = useState("online"); // "online" | "later"
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [done,        setDone]        = useState(false);
  const [paymentId,   setPaymentId]   = useState(null);

  const today = new Date().toISOString().split("T")[0];

  function isVehicleSupported(requires) {
    if (!requires) return true;
    return (garage.vehicleType || "").includes(requires);
  }

  async function detectLocation() {
    if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1&zoom=18`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address ?? {};
          const parts = [
            a.road || a.pedestrian || a.footway || a.path,
            a.neighbourhood || a.quarter || a.suburb || a.residential || a.city_district,
            a.city || a.town || a.village || a.county,
            a.state,
            a.postcode,
          ].filter(Boolean);
          setLocality(parts.join(", "));
        } catch {
          setError("Could not fetch address. Please type it manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        if (err.code === 1) setError("Location permission denied. Please allow location access and try again.");
        else if (err.code === 2) setError("Location unavailable. Please type your address manually.");
        else setError("Location request timed out. Please try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const [promoLoading, setPromoLoading] = useState(false);
  const [promoConfetti, setPromoConfetti] = useState(false);
  const [lastServiceName, setLastServiceName] = useState(null);

  useEffect(() => {
    if (!user) return;
    getLastBooking(user.id)
      .then((b) => { if (b?.service_name) setLastServiceName(b.service_name); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    // Check client-side cache first — avoid hitting the server for repeated attempts
    if (promoCache.current.has(code)) {
      const cached = promoCache.current.get(code);
      if (cached.valid) setPromoApplied({ code, ...cached });
      else setPromoError(cached.error || "Invalid promo code.");
      return;
    }
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      promoCache.current.set(code, data); // cache result
      if (data.valid) {
        setPromoApplied({ code, label: data.label, type: data.type, value: data.value });
        setPromoConfetti(true);
        setTimeout(() => setPromoConfetti(false), 1200);
      } else {
        setPromoApplied(null);
        setPromoError(data.error || "Invalid promo code.");
      }
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  function getFinalAmount() {
    const raw = parseFloat((service?.price || "").replace(/[^\d.]/g, ""));
    if (isNaN(raw)) return 0;
    if (!promoApplied) return raw;
    if (promoApplied.type === "percent") return Math.round(raw * (1 - promoApplied.value / 100));
    if (promoApplied.type === "flat")    return Math.max(0, raw - promoApplied.value);
    return 0; // free
  }

  async function finishBooking(paidId) {
    const pickupAddress = pickupDrop
      ? [flatNo, building, landmark, locality].filter(Boolean).join(", ")
      : null;

    await createBooking({
      user_id:        user.id,
      garage_id:      garage.id,
      garage_name:    garage.name,
      garage_image:   garage.image,
      service_name:   service?.name  ?? "General Service",
      service_price:  service?.price ?? "",
      booking_date:   date,
      booking_time:   time,
      vehicle_type:   vehicleType,
      notes:          notes.trim() || null,
      pickup_drop:    pickupDrop,
      pickup_address: pickupAddress,
      status:          "confirmed",
      payment_id:      paidId ?? null,
      payment_method:  paidId ? "online" : payMethod === "later" ? "pay_at_garage" : "free",
    });

    // Send confirmation email — fire and forget
    fetch("/api/booking/confirm", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail:    user.email,
        userName:     user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
        garageName:   garage.name,
        serviceName:  service?.name  ?? "General Service",
        servicePrice: service?.price ?? "",
        bookingDate:  date,
        bookingTime:  time,
        vehicleType,
        pickupDrop,
        pickupAddress,
        promoCode:    promoApplied?.code ?? null,
      }),
    }).catch(() => {});

    setPaymentId(paidId ?? null);
    setDone(true);
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) { setError("Please choose a date."); return; }
    if (!time) { setError("Please choose a time slot."); return; }
    if (pickupDrop && !locality.trim()) { setError("Please enter your pickup address or use current location."); return; }

    setLoading(true); setError(null);

    try {
      const amount = getFinalAmount(); // in rupees

      // Free service, free promo, or Pay at Garage — skip Razorpay
      if (amount === 0 || payMethod === "later") {
        await finishBooking(null);
        return;
      }

      // Create Razorpay order
      const orderRes = await fetch("/api/payment/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  amount * 100, // paise
          receipt: "bkg_" + Date.now(),
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not create payment order");

      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway. Check your internet connection.");

      // Open checkout
      const options = {
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        "GarageDekho",
        description: service?.name ?? "Garage Service",
        order_id:    order.id,
        prefill: {
          name:  user.user_metadata?.full_name || "",
          email: user.email || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled. Please try again to confirm your booking.");
            setLoading(false);
          },
        },
        handler: async function (response) {
          try {
            // Verify signature on server
            const verifyRes = await fetch("/api/payment/verify", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verify = await verifyRes.json();
            if (!verify.ok) throw new Error("Payment verification failed");

            await finishBooking(response.razorpay_payment_id);
          } catch (err) {
            setError(err.message + " — contact support with payment ID: " + response.razorpay_payment_id);
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setError("Payment failed: " + (resp.error?.description || "Unknown error"));
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0056D2]/95 to-[#3730A3]/95 backdrop-blur-sm" />
        <div className="relative w-full max-w-sm mx-4 animate-pop">
          {/* Confetti dots */}
          {["top-4 left-8","top-8 right-12","top-16 left-1/2","bottom-24 left-6","bottom-16 right-8"].map((pos, i) => (
            <div key={i} className={`pointer-events-none absolute ${pos} h-3 w-3 rounded-full opacity-60 animate-ping`}
              style={{ backgroundColor: ["#F59E0B","#34D399","#F87171","#60A5FA","#A78BFA"][i], animationDelay: `${i*120}ms` }} />
          ))}

          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl">
            {/* Big tick */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_8px_32px_rgba(52,211,153,0.45)]">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">You're booked!</h2>
            <p className="mt-1 text-sm font-semibold text-primary">{garage.name}</p>
            <p className="mt-3 text-sm text-slate-500">
              {service?.name || "Service"} · {date} at {time}
            </p>

            {paymentId && (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2">
                <p className="text-[11px] text-slate-400">Payment ID: <span className="font-mono font-semibold text-slate-600">{paymentId}</span></p>
              </div>
            )}

            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" />
              View My Bookings
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
            >
              Stay on this page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal sheet */}
      <SwipeableSheet
        onClose={onClose}
        scrollRef={scrollRef}
        className="relative w-full max-w-lg rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"
      >
      <div ref={(el) => { scrollRef.current = el; trapRef.current = el; }} className="overflow-y-auto" style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs text-slate-400">Booking at</p>
            <p className="text-base font-black text-slate-900">{garage.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 pb-8 md:pb-5">

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* ── Service selection ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Select Service</p>
            <div className="flex flex-col gap-2">
              {(garage.services ?? []).map((svc, idx) => {
                const isUsual = lastServiceName &&
                  svc.name.toLowerCase().includes(lastServiceName.toLowerCase().split(/[\s/]/)[0]);
                const isRecommended = !isUsual && idx === 0;
                return (
                  <button
                    key={svc.name}
                    type="button"
                    onClick={() => setService(svc)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] ${
                      service?.name === svc.name
                        ? "border-primary bg-primary/5"
                        : "border-slate-100 hover:border-primary/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800">{svc.name}</p>
                        {isUsual && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-600">
                            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Your usual
                          </span>
                        )}
                        {isRecommended && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-black text-primary">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">{svc.duration}</p>
                    </div>
                    <span className="text-sm font-black text-primary">{svc.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Date ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Date</p>
            <DatePicker value={date} min={today} onChange={setDate} />
            {date && (
              <p className="mt-1.5 text-xs font-semibold text-primary">
                Selected: {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* ── Time slots ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Time Slot</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`rounded-xl py-2 text-xs font-bold transition active:scale-95 ${
                    time === t
                      ? "bg-primary text-white"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Vehicle type ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Vehicle Type</p>
            <div className="grid grid-cols-4 gap-2">
              {VEHICLE_TYPES.filter(({ requires }) => isVehicleSupported(requires)).map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setVehicleType(label)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-bold transition active:scale-95 ${
                    vehicleType === label
                      ? "bg-primary text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Pickup & drop ── */}
          <div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 transition hover:border-primary/30">
              <input
                type="checkbox"
                checked={pickupDrop}
                onChange={(e) => setPickupDrop(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <div className="flex flex-1 items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Pickup & Drop Service</p>
                  <p className="text-[10px] text-slate-400">We'll collect and return your vehicle</p>
                </div>
              </div>
            </label>

            {pickupDrop && (
              <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pickup Address</p>

                {/* Auto-detect */}
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white py-2.5 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:opacity-60 active:scale-[0.98]"
                >
                  {locating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting location…</>
                  ) : (
                    <><LocateFixed className="h-3.5 w-3.5" /> Use my current location</>
                  )}
                </button>

                {/* Flat / House No */}
                <input
                  type="text"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="Flat / House No. (e.g. B-204)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-base"
                />

                {/* Building / Society / Chawl */}
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Building / Society / Chawl name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-base"
                />

                {/* Locality — auto-filled or typed */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="Area / Locality, City, Pincode *"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-base"
                  />
                </div>

                {/* Landmark */}
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Nearby landmark (optional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-base"
                />
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue or any special instructions…"
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-base"
            />
          </div>

          {/* ── Promo Code ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Promo Code (optional)</p>
            {promoConfetti && (
            <div className="pointer-events-none fixed inset-x-0 z-[60]" style={{ top: "35%" }}>
              {[
                { pos: "left-[20%]", color: "#F59E0B" },
                { pos: "left-[35%]", color: "#34D399" },
                { pos: "left-[50%]", color: "#F87171" },
                { pos: "left-[65%]", color: "#60A5FA" },
                { pos: "left-[80%]", color: "#A78BFA" },
              ].map(({ pos, color }, i) => (
                <div key={i} className={`absolute ${pos} h-2.5 w-2.5 rounded-full animate-ping opacity-80`}
                  style={{ backgroundColor: color, animationDelay: `${i * 100}ms`, animationDuration: "0.6s" }} />
              ))}
            </div>
          )}
          {promoApplied ? (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                <Check className="h-4 w-4 shrink-0 text-green-500" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-700">{promoApplied.code} applied — {promoApplied.label}</p>
                </div>
                <button type="button" onClick={() => { setPromoApplied(null); setPromoInput(""); }} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                  <Tag className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                    placeholder="Enter code…"
                    className="flex-1 bg-transparent text-base uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={!promoInput.trim() || promoLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  {promoLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Apply
                </button>
              </div>
            )}
            {promoError && <p className="mt-1 text-[11px] text-red-500">{promoError}</p>}
          </div>

          {/* ── Payment Method ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod("online")}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition active:scale-95 ${
                  payMethod === "online"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-100 text-slate-500 hover:border-primary/30"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Pay Now</span>
                <span className="text-center text-[10px] font-normal leading-tight text-slate-400">UPI / Card / Netbanking</span>
              </button>
              <button
                type="button"
                onClick={() => setPayMethod("later")}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-bold transition active:scale-95 ${
                  payMethod === "later"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-100 text-slate-500 hover:border-primary/30"
                }`}
              >
                <Store className="h-5 w-5" />
                <span>Pay at Garage</span>
                <span className="text-center text-[10px] font-normal leading-tight text-slate-400">Cash / UPI after service</span>
              </button>
            </div>
          </div>

          {/* ── Price summary ── */}
          {service && (() => {
            const raw = parseFloat((service.price || "").replace(/[^\d.]/g, ""));
            if (isNaN(raw) || raw === 0) return null;
            const final = getFinalAmount();
            const discount = raw - final;
            return (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Service charge</span>
                  <span className="font-semibold text-slate-800">₹{raw}</span>
                </div>
                {promoApplied && discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">Promo ({promoApplied.code})</span>
                    <span className="font-semibold text-green-600">−₹{discount}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">Total</span>
                  <span className="text-base font-black text-primary">₹{final}</span>
                </div>
              </div>
            );
          })()}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading || !service}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </span>
            ) : (
              (() => {
              if (!service) return "Confirm Booking";
              const finalAmt = getFinalAmount();
              if (isNaN(finalAmt) || finalAmt === 0) return "Confirm Booking (Free)";
              if (payMethod === "later") return "Book Now · Pay ₹" + finalAmt + " at Garage";
              return "Pay & Book · ₹" + finalAmt;
            })()
            )}
          </button>

        </form>
      </div>
      </SwipeableSheet>
    </div>
  );
}
