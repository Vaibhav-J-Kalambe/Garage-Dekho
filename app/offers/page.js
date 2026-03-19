"use client";

import { useState } from "react";
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
} from "lucide-react";
import Header from "../../components/Header";
import offers from "./data.json";
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

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-white/50 bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
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

      {/* Tag */}
      <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
        {offer.tag}
      </span>

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
  const [active, setActive] = useState("all");

  const filtered =
    active === "all" ? offers : offers.filter((o) => o.category === active);

  const featured     = offers[0];
  const rest         = filtered.filter((o) => o.id !== featured.id);
  const showFeatured = active === "all";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 md:px-8
                        pb-28 md:pb-10 pt-5 md:pt-8">

        {/* Heading */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Offers & Deals</h1>
          <p className="mt-0.5 text-sm text-slate-400">Exclusive discounts just for you</p>
        </div>

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

        {/* Featured offer */}
        {showFeatured && (
          <div className="animate-slide-up delay-100">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Featured
            </p>
            <OfferCard offer={featured} />
          </div>
        )}

        {/* Offer grid */}
        {filtered.length === 0 ? (
          <EmptyState preset="offers" />
        ) : (
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
  );
}
