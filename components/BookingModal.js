"use client";

import { useState } from "react";
import { X, Truck, Car, Bike, Zap, Wrench, Loader2, CheckCircle2, Tag, Check } from "lucide-react";
import { createBooking } from "../lib/bookings";
import { useAuth } from "./AuthProvider";

/* Valid promo codes — discount in percentage or flat rupees */
const PROMO_CODES = {
  FIRST100:  { label: "Free inspection",    type: "free",    value: 0    },
  WEEKEND20: { label: "20% off",            type: "percent", value: 20   },
  BIKE100:   { label: "₹100 off",           type: "flat",    value: 100  },
  EVCARE:    { label: "₹199 flat price",    type: "flat",    value: 199  },
  REFER200:  { label: "₹200 credit",        type: "flat",    value: 200  },
  MONSOON15: { label: "15% off",            type: "percent", value: 15   },
};

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

  const [service,     setService]     = useState(preselectedService ?? garage?.services?.[0] ?? null);
  const [date,        setDate]        = useState("");
  const [time,        setTime]        = useState("");
  const supportedVehicles = VEHICLE_TYPES.filter(({ requires }) =>
    !requires || (garage.vehicleType || "").includes(requires)
  );
  const [vehicleType, setVehicleType] = useState(supportedVehicles[0]?.label ?? "Car");
  const [pickupDrop,  setPickupDrop]  = useState(false);
  const [notes,       setNotes]       = useState("");
  const [promoInput,  setPromoInput]  = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError,  setPromoError]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [done,        setDone]        = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function isVehicleSupported(requires) {
    if (!requires) return true;
    return (garage.vehicleType || "").includes(requires);
  }

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    const promo = PROMO_CODES[code];
    if (promo) {
      setPromoApplied({ code, ...promo });
      setPromoError(null);
    } else {
      setPromoApplied(null);
      setPromoError("Invalid promo code.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) { setError("Please choose a date."); return; }
    if (!time) { setError("Please choose a time slot."); return; }
    setLoading(true); setError(null);
    try {
      await createBooking({
        user_id:       user.id,
        garage_id:     garage.id,
        garage_name:   garage.name,
        garage_image:  garage.image,
        service_name:  service?.name  ?? "General Service",
        service_price: service?.price ?? "",
        booking_date:  date,
        booking_time:  time,
        vehicle_type:  vehicleType,
        notes:         notes.trim() || null,
        pickup_drop:   pickupDrop,
        status:        "confirmed",
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { onSuccess(); onClose(); }} />
        <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-8 text-center shadow-2xl md:rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Booking Confirmed!</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your appointment at <strong>{garage.name}</strong> is confirmed for {date} at {time}.
          </p>
          <button
            onClick={() => { onSuccess(); onClose(); }}
            className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal sheet */}
      <div className="relative w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl md:rounded-3xl"
           style={{ maxHeight: "92vh" }}>

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

        <form onSubmit={handleSubmit} className="space-y-6 p-5">

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>
          )}

          {/* ── Service selection ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Select Service</p>
            <div className="flex flex-col gap-2">
              {(garage.services ?? []).map((svc) => (
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
                    <p className="text-sm font-bold text-slate-800">{svc.name}</p>
                    <p className="text-[10px] text-slate-400">{svc.duration}</p>
                  </div>
                  <span className="text-sm font-black text-primary">{svc.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Date ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Date</p>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* ── Time slots ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Time Slot</p>
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
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Vehicle Type</p>
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

          {/* ── Notes ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue or any special instructions…"
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* ── Promo Code ── */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Promo Code (optional)</p>
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
                    placeholder="Enter code…"
                    className="flex-1 bg-transparent text-sm uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={!promoInput.trim()}
                  className="rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            )}
            {promoError && <p className="mt-1 text-[11px] text-red-500">{promoError}</p>}
          </div>

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
              `Confirm Booking${service ? ` · ${service.price}` : ""}`
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
