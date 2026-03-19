"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Wrench,
  Bike,
  Car,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Truck,
  Wind,
  Gauge,
  ChevronRight,
  Droplets,
  RotateCcw,
  Tag,
  Search,
  Mic,
  Heart,
  Star,
} from "lucide-react";
import Header from "../components/Header";
import { getAllGarages } from "../lib/garages";
import Skeleton from "../components/ui/Skeleton";

const SERVICES = [
  { label: "Bike Service",   icon: Bike,     color: "from-blue-500 to-indigo-500"   },
  { label: "Car Service",    icon: Car,      color: "from-violet-500 to-purple-500"  },
  { label: "Oil Change",     icon: Droplets, color: "from-cyan-500 to-sky-500"       },
  { label: "Tyre Repair",    icon: Gauge,    color: "from-slate-500 to-slate-700"    },
  { label: "Battery Jump",   icon: Zap,      color: "from-amber-500 to-orange-500"   },
  { label: "Towing",         icon: Truck,    color: "from-rose-500 to-red-500"       },
  { label: "AC Repair",      icon: Wind,     color: "from-teal-500 to-emerald-500"   },
  { label: "General Repair", icon: Wrench,   color: "from-primary to-blue-400"       },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const [topGarages,    setTopGarages]    = useState([]);
  const [garagesLoading, setGaragesLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getAllGarages()
      .then(setTopGarages)
      .catch(console.error)
      .finally(() => setGaragesLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:px-8 pb-28 md:pb-10 pt-5 md:pt-8">

        {/* ── Hero + Search ── */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">

          {/* Headline */}
          <div className="space-y-1 md:flex-1 animate-slide-up">
            <p className="flex items-center gap-2 text-sm text-slate-400">
              {getGreeting()} —{" "}
              <span className="flex items-center gap-1.5 font-semibold text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                28 mechanics online
              </span>
            </p>
            <h1 className="text-[2.1rem] font-black leading-tight tracking-tight text-slate-900">
              Find Your<br />
              <span className="gradient-text">Mechanic!</span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 md:flex-1 animate-slide-up delay-75">
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-card transition focus-within:shadow-card-hover focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Search garage, service…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <Mic className="h-4 w-4 shrink-0 text-slate-400 cursor-pointer hover:text-primary transition" onClick={() => { setToast("Voice search coming soon"); setTimeout(() => setToast(null), 2500); }} />
            </div>
            <button
              type="button"
              aria-label="Use my location"
              onClick={() => router.push('/near-me')}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>

        </div>

        {/* ── Book Again + SOS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-100">

          {/* Book Again — full width on mobile, half on desktop */}
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition hover:shadow-card-hover">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Last visited</p>
              <p className="truncate text-sm font-bold text-slate-900">
                Prime Auto Care · Oil Change
              </p>
            </div>
            <Link href="/bookings" className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95">
              Book Again
            </Link>
          </div>

          {/* SOS card — desktop only; on mobile the bottom nav SOS button is always reachable */}
          <Link href="/sos" className="hidden md:block">
            <div className="flex h-full items-center gap-4 rounded-2xl bg-[#D32F2F] p-4 text-white shadow-sos transition hover:brightness-105 active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black leading-tight">Roadside Emergency?</p>
                <p className="mt-0.5 text-xs text-red-100">24/7 instant assistance, one tap away</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/60" />
            </div>
          </Link>

        </div>

        {/* ── Services ── */}
        <section className="animate-slide-up delay-150">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              How can we help?
            </h2>
            <Link href="/near-me" className="text-xs font-semibold text-primary hover:underline">See All</Link>
          </div>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-x-visible md:px-0 md:pb-0">
            {SERVICES.map(({ label, icon: Icon, color }) => (
              <Link
                key={label}
                href="/near-me"
                className="flex shrink-0 flex-col items-center gap-2.5 md:shrink group"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-card transition duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5 active:scale-95`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="w-16 text-center text-[11px] font-semibold leading-tight text-slate-500 group-hover:text-primary transition">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Top Rated Garages ── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Top Rated Garages
            </h2>
            <Link href="/near-me" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>

          {garagesLoading ? (
            <Skeleton.GarageList count={3} />
          ) : (
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
              {topGarages.map((garage, i) => (
                <Link key={garage.id} href={`/garage/${garage.id}`} className="block animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]">

                    {/* Photo */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={garage.image}
                        alt={garage.name}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        loading="lazy"
                      />
                      {garage.isOpen && (
                        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-sm font-bold text-slate-900">{garage.name}</h3>
                        {garage.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">{garage.speciality}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">{garage.rating}</span>
                        <span className="text-[11px] text-slate-400">({garage.reviews} Reviews)</span>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        aria-label="Save garage"
                        className="text-slate-200 transition hover:text-red-400 active:scale-90"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold text-primary">{garage.distance}</span>
                      <span className={`text-[10px] font-semibold ${garage.isOpen ? "text-green-500" : "text-slate-400"}`}>
                        {garage.isOpen ? `Open · ${garage.waitTime}` : "Closed"}
                      </span>
                    </div>

                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Promo + Trust ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-200">

          {/* Promo */}
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-promo">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Tag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-tight">First service free!</p>
              <p className="mt-0.5 text-xs text-amber-100">
                Free inspection on your first booking
              </p>
            </div>
            <Link href="/offers" className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 transition hover:bg-white/90 active:scale-95">
              Claim
            </Link>
          </div>

          {/* Trust bar */}
          <section className="rounded-2xl bg-white p-4 shadow-card">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="flex items-start gap-3 pr-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Fixed Pricing</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    No hidden surprises.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 pl-4">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Verified Experts</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    Quality-checked garages.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>

      </main>
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
