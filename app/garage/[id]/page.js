"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  Wrench,
  ShieldCheck,
  Calendar,
  Loader2,
} from "lucide-react";
import { getGarageById } from "../../../lib/garages";
import { useAuth } from "../../../components/AuthProvider";
import { getSavedGarageIds, saveGarage, unsaveGarage } from "../../../lib/saved";
import BookingModal from "../../../components/BookingModal";

export default function GarageDetailPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router   = useRouter();

  const [garage,      setGarage]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saved,       setSaved]       = useState(false);
  const [savingHeart, setSavingHeart] = useState(false);
  const [activeTab,   setActiveTab]   = useState("services");
  const [showModal,   setShowModal]   = useState(false);
  const [preService,  setPreService]  = useState(null);

  function openBooking(svc = null) {
    if (!user) { router.push(`/auth?redirect=/garage/${id}`); return; }
    setPreService(svc);
    setShowModal(true);
  }

  useEffect(() => {
    getGarageById(id)
      .then(setGarage)
      .catch(() => setGarage(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    getSavedGarageIds(user.id).then((ids) => setSaved(ids.includes(id)));
  }, [user, id]);

  async function toggleSave() {
    if (!user) { router.push(`/auth?redirect=/garage/${id}`); return; }
    setSavingHeart(true);
    try {
      if (saved) { await unsaveGarage(user.id, id); setSaved(false); }
      else        { await saveGarage(user.id, id);   setSaved(true);  }
    } catch { /* silent */ }
    setSavingHeart(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-slate-400">Garage not found.</p>
          <Link href="/" className="mt-3 block text-sm font-semibold text-primary">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Hero Image ── */}
      <div className="relative h-64 w-full md:h-80">
        <img
          src={garage.image}
          alt={garage.name}
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

        {/* Floating header */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link
            href="/"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={async () => {
                if (navigator.share) {
                  try { await navigator.share({ title: garage.name, text: garage.speciality, url: window.location.href }); } catch {}
                } else {
                  navigator.clipboard.writeText(window.location.href).catch(() => {});
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Save"
              onClick={toggleSave}
              disabled={savingHeart}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition hover:bg-black/60 active:scale-95 disabled:opacity-60"
            >
              <Heart
                className={`h-4 w-4 transition ${saved ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </button>
          </div>
        </div>

        {/* Open/Closed badge on image */}
        <div className="absolute bottom-4 left-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm ${
              garage.isOpen
                ? "bg-green-500/90 text-white"
                : "bg-slate-700/80 text-slate-200"
            }`}
          >
            {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
          </span>
        </div>
      </div>

      {/* ── Main content — pulled up over hero ── */}
      <div className="relative -mt-5 rounded-t-3xl bg-[#F8FAFC]">
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-10">

          {/* ── Desktop: 2-column layout ── */}
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">

            {/* ── LEFT — main content ── */}
            <div className="flex flex-col gap-5 md:flex-1">

              {/* Garage Identity */}
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-xl font-black leading-tight text-slate-900">
                        {garage.name}
                      </h1>
                      {garage.verified && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-400">{garage.speciality}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-slate-800">{garage.rating}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{garage.reviews} reviews</span>
                  </div>
                </div>

                {/* Address + phone */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{garage.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{garage.openHours}</span>
                  </div>
                  <a
                    href={`tel:${garage.phone}`}
                    className="flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{garage.phone}</span>
                  </a>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Experience",  value: `${garage.experience} yrs` },
                  { label: "Vehicles",    value: `${garage.vehiclesServed.toLocaleString()}+` },
                  { label: "Vehicle Type",value: garage.vehicleType },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white p-3 shadow-card text-center"
                  >
                    <p className="text-base font-black text-slate-900">{value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card">
                {["services", "about", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold capitalize transition ${
                      activeTab === tab
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab: Services */}
              {activeTab === "services" && (
                <div className="flex flex-col gap-3">
                  {garage.services.map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">{svc.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{svc.duration}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="text-sm font-black text-primary">{svc.price}</span>
                        <button
                          type="button"
                          onClick={() => openBooking(svc)}
                          className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white transition hover:bg-primary/90 active:scale-95"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: About */}
              {activeTab === "about" && (
                <div className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-slate-900">About {garage.name}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-500">{garage.about}</p>
                </div>
              )}

              {/* Tab: Reviews */}
              {activeTab === "reviews" && (
                <div className="flex flex-col gap-3">
                  {/* Rating summary */}
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card">
                    <div className="text-center">
                      <p className="text-4xl font-black text-slate-900">{garage.rating}</p>
                      <div className="mt-1 flex items-center justify-center gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${s <= Math.round(garage.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{garage.reviews} reviews</p>
                    </div>
                    <div className="h-12 w-px bg-slate-100" />
                    <p className="flex-1 text-xs leading-relaxed text-slate-500">
                      Customers love this garage for its quick turnaround, transparent pricing, and professional staff.
                    </p>
                  </div>

                  {/* Review cards */}
                  {garage.reviewsList.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-white p-4 shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                            {review.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{review.name}</p>
                            <p className="text-[10px] text-slate-400">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* ── RIGHT — sticky booking card (desktop only) ── */}
            <div className="hidden md:block md:w-80 md:shrink-0 md:sticky md:top-6">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <h3 className="text-base font-black text-slate-900">Book a Service</h3>
                <p className="mt-1 text-xs text-slate-400">Select a service and schedule your visit</p>

                <div className="mt-4 space-y-2">
                  {garage.services.slice(0, 4).map((svc) => (
                    <div
                      key={svc.name}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-primary/30 hover:bg-primary/5 transition cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{svc.name}</p>
                        <p className="text-[10px] text-slate-400">{svc.duration}</p>
                      </div>
                      <span className="text-sm font-black text-primary">{svc.price}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Appointment
                </button>

                <a
                  href={`tel:${garage.phone}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:text-primary active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  Call to Book
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Booking Modal ── */}
      {showModal && garage && (
        <BookingModal
          garage={garage}
          preselectedService={preService}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); router.push("/bookings"); }}
        />
      )}

      {/* ── Sticky Book Now — mobile only ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 px-4 pt-3 pb-6 backdrop-blur-sm md:hidden" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        <div className="flex gap-3">
          <a
            href={`tel:${garage.phone}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <Phone className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => openBooking()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </button>
        </div>
      </div>

    </div>
  );
}
