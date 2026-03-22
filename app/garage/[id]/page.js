"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Navigation,
  Droplets,
  Gauge,
  Zap,
  Wind,
  Truck,
  RotateCcw,
  Settings,
  Thermometer,
  Paintbrush,
  Battery,
  Scan,
  MessageCircle,
} from "lucide-react";

function getServiceIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("oil") || n.includes("fluid") || n.includes("coolant")) return Droplets;
  if (n.includes("tyre") || n.includes("tire") || n.includes("wheel") || n.includes("puncture")) return Gauge;
  if (n.includes("battery") || n.includes("electric") || n.includes("ev")) return Battery;
  if (n.includes("ac") || n.includes("air con") || n.includes("cooling")) return Wind;
  if (n.includes("tow") || n.includes("pickup") || n.includes("recovery")) return Truck;
  if (n.includes("wash") || n.includes("clean") || n.includes("polish") || n.includes("detailing")) return Paintbrush;
  if (n.includes("engine") || n.includes("tuning") || n.includes("alignment")) return Settings;
  if (n.includes("inspect") || n.includes("diagnos") || n.includes("check")) return Scan;
  if (n.includes("brake") || n.includes("suspension")) return RotateCcw;
  if (n.includes("heat") || n.includes("radiator")) return Thermometer;
  if (n.includes("zap") || n.includes("jump") || n.includes("start")) return Zap;
  return Wrench;
}
import { getGarageById, getAllGarages } from "../../../lib/garages";
import Skeleton from "../../../components/ui/Skeleton";
import { useAuth } from "../../../components/AuthProvider";
import { getSavedGarageIds, saveGarage, unsaveGarage } from "../../../lib/saved";
import { getGarageReviews } from "../../../lib/reviews";
import { useToast } from "../../../context/ToastContext";
import BookingModal from "../../../components/BookingModal";
import EmptyState from "../../../components/ui/EmptyState";

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
  const [reviews,         setReviews]         = useState([]);
  const [similarGarages,  setSimilarGarages]  = useState([]);
  const { showToast } = useToast();

  function openBooking(svc = null) {
    if (!user) { router.push(`/auth?redirect=/garage/${id}`); return; }
    setPreService(svc);
    setShowModal(true);
  }

  useEffect(() => {
    getGarageById(id)
      .then((g) => {
        setGarage(g);
        // Load similar garages from cache or DB
        const CACHE_KEY = "gd_garages_v1";
        try {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            const { data } = JSON.parse(raw);
            // Try matching by vehicleType first, fall back to top rated garages
            const byType = data.filter((x) => x.id !== id && x.vehicleType === g?.vehicleType);
            const similar = (byType.length > 0 ? byType : data.filter((x) => x.id !== id))
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 3);
            setSimilarGarages(similar);
            return;
          }
        } catch {}
        getAllGarages().then((all) => {
          const byType = all.filter((x) => x.id !== id && x.vehicleType === g?.vehicleType);
          setSimilarGarages(
            (byType.length > 0 ? byType : all.filter((x) => x.id !== id))
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 3)
          );
        }).catch(() => {});
      })
      .catch(() => setGarage(null))
      .finally(() => setLoading(false));
    getGarageReviews(id).then(setReviews);
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

  if (loading) return <Skeleton.GarageDetail />;

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
    <div className="min-h-screen bg-[#001f5b]">

      {/* ── Hero Image ── */}
      <div className="relative h-60 w-full md:h-96">
        {garage.image
          ? <Image src={garage.image} alt={garage.name} fill priority className="object-cover" sizes="100vw" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#001f5b] via-[#003091] to-[#0056D2] flex items-center justify-center">
              <Wrench className="h-16 w-16 text-white/20" />
            </div>
        }
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Photo count badge */}
        <div className="absolute bottom-20 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v1H2V4zm0 3h12v5a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm5 2a1 1 0 100 2 1 1 0 000-2z"/></svg>
          1 photo
        </div>

        {/* Floating header */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-12">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={async () => {
                if (navigator.share) {
                  try { await navigator.share({ title: garage.name, text: garage.speciality, url: window.location.href }); } catch {}
                } else {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast("Link copied to clipboard!");
                  } catch {
                    showToast("Could not copy link. Please copy manually.");
                  }
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Save"
              onClick={toggleSave}
              disabled={savingHeart}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition hover:bg-black/70 active:scale-95 disabled:opacity-60"
            >
              <Heart
                className={`h-4 w-4 transition-colors duration-150 ${saved ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </button>
          </div>
        </div>

        {/* Garage name + open badge over image bottom */}
        <div className="absolute bottom-8 left-4 right-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">{garage.speciality}</p>
            <h1 className="text-2xl font-black text-white leading-tight drop-shadow">{garage.name}</h1>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${
              garage.isOpen
                ? "bg-green-500 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
          </span>
        </div>
      </div>

      {/* ── Main content — pulled up over hero ── */}
      <div className="relative -mt-6 rounded-t-[2.5rem] bg-[#F8FAFC]">
        <div className="mx-auto max-w-5xl px-4 pb-36 pt-5 md:px-8 md:pb-10">

          {/* ── Desktop: 2-column layout ── */}
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">

            {/* ── LEFT — main content ── */}
            <div className="flex flex-col gap-5 md:flex-1">

              {/* Garage Identity */}
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-lg font-black leading-tight text-slate-900 truncate">{garage.name}</h2>
                    {garage.verified && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-black text-amber-600">{garage.rating}</span>
                    <span className="text-[11px] text-amber-400 font-medium">({reviews.length > 0 ? reviews.length : garage.reviews})</span>
                  </div>
                </div>

                {/* Address + hours + phone */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>{garage.address}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(garage.name + " " + garage.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/10 active:scale-95"
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{garage.openHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${garage.phone}`}
                      className="flex items-center gap-2 text-sm font-semibold text-primary"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{garage.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${garage.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I found your garage on GarageDekho. I'd like to enquire about your services.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600 active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Experience",   value: garage.experience ? `${garage.experience} yrs` : "—" },
                  { label: "Vehicles",     value: garage.vehiclesServed ? `${garage.vehiclesServed.toLocaleString()}+` : "—" },
                  { label: "Vehicle Type", value: garage.vehicleType || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl bg-white p-3 shadow-card text-center">
                    <p className="truncate text-base font-black text-slate-900" title={value}>{value}</p>
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
                    className={`flex-1 rounded-xl py-2 text-xs font-bold capitalize transition-[background-color,color] duration-150 ${
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
                  {garage.services.map((svc) => {
                    const SvcIcon = getServiceIcon(svc.name);
                    return (
                      <div
                        key={svc.name}
                        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition-shadow duration-150 hover:shadow-card-hover"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <SvcIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900">{svc.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{svc.duration}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span className="text-sm font-black text-primary">{svc.price}</span>
                          {garage.isOpen && garage.waitTime && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${
                              garage.waitTime.toLowerCase().includes("busy") || parseInt(garage.waitTime) > 30
                                ? "text-red-500"
                                : "text-amber-500"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                garage.waitTime.toLowerCase().includes("busy") || parseInt(garage.waitTime) > 30
                                  ? "bg-red-500 animate-ping"
                                  : "bg-amber-400"
                              }`} />
                              ~{garage.waitTime}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => openBooking(svc)}
                            className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white min-h-[36px] transition-colors duration-150 hover:brightness-110 active:scale-95"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  {(() => {
                    const counts = [5,4,3,2,1].map((star) => ({
                      star,
                      count: reviews.filter((r) => r.rating === star).length,
                    }));
                    const max = Math.max(...counts.map((c) => c.count), 1);
                    return (
                      <div className="flex items-start gap-5 rounded-2xl bg-white p-5 shadow-card">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <p className="text-5xl font-black text-slate-900 leading-none">{garage.rating}</p>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(garage.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          {counts.map(({ star, count }) => (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-[11px] w-3 text-right font-semibold text-slate-500">{star}</span>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                  style={{ width: reviews.length ? `${(count / max) * 100}%` : "0%" }}
                                />
                              </div>
                              <span className="text-[11px] w-4 text-slate-400">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Review cards */}
                  {reviews.length === 0 ? (
                    <EmptyState
                      title="No reviews yet"
                      description="Book a service and be the first to share your experience."
                      className="py-8"
                    />
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl bg-white p-4 shadow-card">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                              {(review.user_name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                            <p className="text-xs font-semibold text-slate-700">{review.user_name || "User"}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* ── Similar Garages ── */}
            {similarGarages.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                <h3 className="text-sm font-black text-slate-900">Similar Garages Nearby</h3>
                {similarGarages.map((sg) => (
                  <Link key={sg.id} href={`/garage/${sg.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card transition-shadow duration-150 hover:shadow-card-hover active:scale-[0.99]">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Image src={sg.image || "/placeholder-garage.svg"} alt={sg.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{sg.name}</p>
                      <p className="text-[11px] text-slate-500">{sg.speciality}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">{sg.rating}</span>
                        <span className="text-[11px] text-slate-400">· {sg.distance}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">View</span>
                  </Link>
                ))}
              </div>
            )}

            {/* ── RIGHT — sticky booking card (desktop only) ── */}
            <div className="hidden md:block md:w-80 md:shrink-0 md:sticky md:top-6">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <h3 className="text-base font-black text-slate-900">Book a Service</h3>
                <p className="mt-1 text-xs text-slate-400">Select a service and schedule your visit</p>

                <div className="mt-4 space-y-2">
                  {garage.services.slice(0, 4).map((svc) => {
                    const SvcIcon = getServiceIcon(svc.name);
                    return (
                      <button
                        key={svc.name}
                        type="button"
                        onClick={() => openBooking(svc)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left transition-colors duration-150 hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] cursor-pointer"
                      >
                        <SvcIcon className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800">{svc.name}</p>
                          <p className="text-[10px] text-slate-500">{svc.duration}</p>
                        </div>
                        <span className="text-sm font-black text-primary">{svc.price}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => openBooking()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition-colors duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Appointment
                </button>

                <a
                  href={`tel:${garage.phone}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-colors duration-150 hover:border-primary/40 hover:text-primary active:scale-[0.98]"
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
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition-colors duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4" />
            Book Appointment
          </button>
        </div>
      </div>

    </div>
  );
}
