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
import EmptyState from "../../components/ui/EmptyState";

const FILTERS = [
  { label: "All",   value: "all",   icon: Sparkles },
  { label: "Cars",  value: "car",   icon: Car      },
  { label: "Bikes", value: "bike",  icon: Bike     },
  { label: "EV",    value: "ev",    icon: Zap      },
  { label: "Refer", value: "refer", icon: Users    },
];

function formatDate(dateStr) {
  if (!dateStr) return "No expiry";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "No expiry";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function OfferSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 animate-pulse">
      <div className="h-3 w-16 rounded-full bg-[#f3f3f8] mb-4" />
      <div className="h-8 w-24 rounded-xl bg-[#f3f3f8] mb-3" />
      <div className="h-4 w-40 rounded-lg bg-[#f3f3f8] mb-2" />
      <div className="h-3 w-56 rounded-lg bg-[#f3f3f8] mb-6" />
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-[#f3f3f8]" />
          <div className="h-3 w-20 rounded bg-[#f3f3f8]" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-[#f3f3f8]" />
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

function CopyButton({ code, featured = false }) {
  const [copied,   setCopied]   = useState(false);
  const [revealed, setRevealed] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (featured) {
    // Featured card: white-on-blue style
    if (!revealed) {
      return (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-white/40 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
        >
          <span className="select-none blur-sm pointer-events-none">{code}</span>
          <span className="text-[10px] font-black uppercase tracking-wide opacity-90">Reveal</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-white/40 bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
      >
        {copied ? (
          <><Check className="h-4 w-4" />Copied!</>
        ) : (
          <><Copy className="h-4 w-4" />{code}</>
        )}
      </button>
    );
  }

  // Regular card: stitch style coupon row
  if (!revealed) {
    return (
      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 bg-[#f3f3f8] rounded-xl px-3 py-2 font-mono text-sm text-[#424656] select-none blur-sm pointer-events-none">{code}</div>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-xl bg-[#0056b7] text-white px-4 py-2 text-sm font-bold transition hover:brightness-110 active:scale-95"
        >
          Reveal
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <div className="flex-1 bg-[#f3f3f8] rounded-xl px-3 py-2 font-mono text-sm font-bold text-[#1a1c1f] border border-dashed border-[#c2c6d8]">{code}</div>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl bg-[#0056b7] text-white px-4 py-2 text-sm font-bold transition hover:brightness-110 active:scale-95 flex items-center gap-1.5"
      >
        {copied ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
      </button>
    </div>
  );
}

function FeaturedOfferCard({ offer }) {
  const days = getDaysUntilExpiry(offer.validTill);

  return (
    <div className="relative overflow-hidden rounded-3xl p-8 bg-[#0056b7] text-white shadow-[0_8px_32px_rgba(0,86,183,0.25)]">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-10 right-8 h-28 w-28 rounded-full bg-white/10" />

      <div className="relative flex flex-col gap-4">
        {/* Tag + urgency */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
            {offer.tag}
          </span>
          {days !== null && days <= 7 && days >= 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/80 px-2.5 py-1 text-[10px] font-black text-white">
              <Flame className="h-2.5 w-2.5" />
              {days === 0 ? "Expires today!" : `${days}d left`}
            </span>
          )}
        </div>

        {/* Discount + title */}
        <div>
          <p className="text-[3rem] font-black leading-none tracking-tight">{offer.discount}</p>
          <p className="mt-2 text-base font-bold leading-snug">{offer.title}</p>
          <p className="mt-1 text-sm text-white/75 leading-relaxed">{offer.description}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pt-2 border-t border-white/20">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Valid till {formatDate(offer.validTill)}</span>
            </div>
            {offer.minOrder && (
              <p className="text-xs text-white/70">Min order: {offer.minOrder}</p>
            )}
            <p className="text-xs text-white/70">{offer.usageLimit}</p>
          </div>
          <CopyButton code={offer.code} featured />
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer }) {
  const days = getDaysUntilExpiry(offer.validTill);
  const [from] = offer.gradient;

  return (
    <div className="h-full bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/10 flex flex-col transition hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] active:scale-[0.98]">
      {/* Tag + urgency */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white"
          style={{ backgroundColor: from }}
        >
          {offer.tag}
        </span>
        {days !== null && days <= 7 && days >= 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[#ffdad6] px-2.5 py-1 text-[10px] font-black text-[#ba1a1a]">
            <Flame className="h-2.5 w-2.5" />
            {days === 0 ? "Expires today!" : `${days}d left`}
          </span>
        )}
      </div>

      {/* Discount */}
      <p className="text-3xl font-black leading-none text-[#1a1c1f]">{offer.discount}</p>

      {/* Title + description */}
      <p className="mt-2 text-lg font-bold text-[#1a1c1f] leading-snug">{offer.title}</p>
      <p className="mt-1 text-sm text-[#424656] leading-relaxed flex-1">{offer.description}</p>

      {/* Validity */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#424656]">
        <Clock className="h-3.5 w-3.5 shrink-0 text-[#c2c6d8]" />
        <span>Valid till {formatDate(offer.validTill)}</span>
        {offer.minOrder && <span className="ml-2 text-[#c2c6d8]">·</span>}
        {offer.minOrder && <span>Min {offer.minOrder}</span>}
      </div>
      {offer.usageLimit && (
        <p className="mt-1 text-xs text-[#c2c6d8]">{offer.usageLimit}</p>
      )}

      {/* Coupon copy */}
      <CopyButton code={offer.code} />
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
    <div className="min-h-screen bg-[#f9f9fe]">
      <Header />

      <div style={{ paddingTop: 64 }}>
        <div className="mx-auto max-w-5xl px-4 md:px-8 pt-8 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">Savings</p>
          <h1 className="mt-2 text-[3rem] md:text-[3.5rem] font-bold tracking-tight text-[#1a1c1f] leading-[1.1]">
            Offers &amp; <span style={{ color: "#0056b7" }}>Deals</span>
          </h1>
          <p className="mt-2 text-sm text-[#424656]">Exclusive discounts · Save up to 30%</p>
        </div>
      </div>

      <main aria-label="Offers and deals" className="mx-auto flex max-w-5xl flex-col gap-6 px-4 md:px-8 pb-28 md:pb-10 pt-6 md:pt-8">

        {/* Filter chips - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {FILTERS.map(({ label, value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActive(value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                active === value
                  ? "bg-[#0056b7] text-white shadow-sm"
                  : "bg-[#f3f3f8] text-[#424656] hover:bg-[#e8e8f0]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => <OfferSkeleton key={n} />)}
          </div>
        )}

        {/* Featured offer */}
        {!loading && showFeatured && (
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">
              Featured
            </p>
            <FeaturedOfferCard offer={featured} />
          </div>
        )}

        {/* Offer grid */}
        {!loading && filtered.length === 0 ? (
          <EmptyState preset="offers" />
        ) : !loading && (
          <div>
            {rest.length > 0 && showFeatured && (
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#424656]">
                All Offers
              </p>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
              {(showFeatured ? rest : filtered).map((offer, i) => (
                <div
                  key={offer.id}
                  className="h-full"
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
  );
}
