"use client";

import { useState, useEffect } from "react";
import {
  Tag,
  Copy,
  Check,
  Clock,
  Zap,
  Car,
  Bike,
  Users,
  Sparkles,
  Flame,
} from "lucide-react";
import Header from "../../components/Header";
import { getOffers } from "../../lib/offers";
import Chip, { ChipRow } from "../../components/ui/Chip";
import EmptyState from "../../components/ui/EmptyState";

const FILTERS = [
  { label: "All",   value: "all",   icon: Sparkles },
  { label: "Cars",  value: "car",   icon: Car      },
  { label: "Bikes", value: "bike",  icon: Bike     },
  { label: "EV",    value: "ev",    icon: Zap      },
  { label: "Refer", value: "refer", icon: Users    },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function OfferSkeleton() {
  return (
    <div className="rounded-2xl p-5 animate-shimmer" style={{ background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
      <div className="h-4 w-16 rounded-full bg-white/40 mb-3" />
      <div className="h-8 w-24 rounded-lg bg-white/40 mb-2" />
      <div className="h-4 w-40 rounded-lg bg-white/40 mb-1" />
      <div className="h-3 w-56 rounded-lg bg-white/30 mb-4" />
      <div className="border-t border-white/20 pt-3 flex items-end justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-white/30" />
          <div className="h-3 w-20 rounded bg-white/30" />
        </div>
        <div className="h-8 w-20 rounded-xl bg-white/40" />
      </div>
    </div>
  );
}

function getDaysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(dateStr);
  return Math.round((exp - today) / 86400000);
}

function CopyButton({ code }) {
  const [copied,   setCopied]   = useState(false);
  const [revealed, setRevealed] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-white/50 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
      >
        <span className="select-none blur-sm pointer-events-none">{code}</span>
        <span className="ml-0.5 text-[10px] font-black uppercase tracking-wide opacity-90">Reveal</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-white/50 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95 animate-pop"
    >
      {copied ? (
        <><Check className="h-3 w-3" />Copied!</>
      ) : (
        <><Copy className="h-3 w-3" />{code}</>
      )}
    </button>
  );
}

function OfferCard({ offer, featured = false }) {
  const [from, to] = offer.gradient;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98] ${
        featured ? "md:col-span-2" : ""
      }`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -right-2 h-20 w-20 rounded-full bg-white/10" />

      {/* Tag + urgency */}
      <div className="flex items-center gap-2">
        <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
          {offer.tag}
        </span>
        {(() => {
          const days = getDaysUntilExpiry(offer.validTill);
          if (days !== null && days <= 7 && days >= 0) {
            return (
              <span className="flex items-center gap-1 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-black text-white">
                <Flame className="h-2.5 w-2.5" />
                {days === 0 ? "Expires today!" : `${days}d left`}
              </span>
            );
          }
          return null;
        })()}
      </div>

      {/* Discount */}
      <div className="mt-3">
        <span className="text-3xl font-black leading-none">{offer.discount}</span>
      </div>

      {/* Title + description */}
      <p className="mt-1 text-sm font-bold leading-snug">{offer.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/75">{offer.description}</p>

      {/* Divider */}
      <div className="my-3 border-t border-white/20" />

      {/* Footer */}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Valid till {formatDate(offer.validTill)}</span>
          </div>
          {offer.minOrder && (
            <p className="text-[10px] text-white/70">Min order: {offer.minOrder}</p>
          )}
          <p className="text-[10px] text-white/70">{offer.usageLimit}</p>
        </div>
        <CopyButton code={offer.code} />
      </div>
    </div>
  );
}

export default function OffersPage() {
  const [active,  setActive]  = useState("all");
  const [offers,  setOffers]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOffers().then(setOffers).finally(() => setLoading(false));
  }, []);

  const filtered =
    active === "all" ? offers : offers.filter((o) => o.category === active);

  const featured     = offers[0];
  const rest         = filtered.filter((o) => o.id !== featured?.id);
  const showFeatured = active === "all" && !!featured;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      {/* ── Hero band ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0047BE] via-[#0056D2] to-[#3730A3] px-4 pb-14 pt-6 md:px-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-amber-400/10" />
        <div className="mx-auto max-w-5xl flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Savings</p>
            <h1 className="text-2xl font-black text-white">Offers & Deals</h1>
            <p className="mt-0.5 text-sm text-blue-100/80">Exclusive discounts · Save up to 30%</p>
          </div>
        </div>
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-[#F8FAFC]">
      <main aria-label="Offers and deals" className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:px-8
                        pb-28 md:pb-10 pt-5 md:pt-8">

        {/* Filter chips — horizontal scroll on mobile */}
        <ChipRow className="animate-slide-up delay-75">
          {FILTERS.map(({ label, value, icon: Icon }) => (
            <Chip
              key={value}
              active={active === value}
              onClick={() => setActive(value)}
              icon={Icon}
            >
              {label}
            </Chip>
          ))}
        </ChipRow>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-up">
            {[1, 2, 3, 4].map((n) => <OfferSkeleton key={n} />)}
          </div>
        )}

        {/* Featured offer */}
        {!loading && showFeatured && (
          <div className="animate-slide-up delay-100">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Featured
            </p>
            <OfferCard offer={featured} />
          </div>
        )}

        {/* Offer grid */}
        {!loading && filtered.length === 0 ? (
          <EmptyState preset="offers" />
        ) : !loading && (
          <div className="animate-slide-up delay-150">
            {rest.length > 0 && showFeatured && (
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                All Offers
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(showFeatured ? rest : filtered).map((offer, i) => (
                <div
                  key={offer.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      </div>
    </div>
  );
}
