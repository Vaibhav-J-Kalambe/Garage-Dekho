"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Star, CheckCircle2, Wrench, ChevronRight,
  TrendingUp, MapPin, Zap, Car, Bike, GitCompare, Trophy, ThumbsUp, MoveRight,
} from "lucide-react";
import Header from "../../components/Header";
import { getAllGarages } from "../../lib/garages";

/* ── Haversine distance ── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Badge ── */
function Badge({ children, green, blue, amber, gray }) {
  const cls = green ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
    : blue  ? "bg-[#d8e2ff] dark:bg-[#1a2f52] text-[#0056b7] dark:text-[#4d91ff]"
    : amber ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
    : "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99]";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

/* ── Smart auto-select ── */
function autoSelect(all, { ids, mode }) {
  const anchors = ids.map((id) => all.find((g) => String(g.id) === String(id))).filter(Boolean);
  const pool    = all.filter((g) => !anchors.find((a) => a.id === g.id));

  if (mode === "top-rated") {
    const top = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    return { garages: top, title: "Top Rated Garages", subtitle: "Comparing the highest-rated garages near you" };
  }
  if (mode === "nearest") {
    const near = [...all].sort((a, b) => (parseFloat(a.distance) || 99) - (parseFloat(b.distance) || 99)).slice(0, 3);
    return { garages: near, title: "Nearest Garages", subtitle: "Comparing the 3 closest garages to you" };
  }
  if (mode === "ev") {
    const evs = all.filter((g) => { const vt = Array.isArray(g.vehicleType) ? g.vehicleType.join(",") : String(g.vehicleType || ""); return vt.toLowerCase().includes("ev"); });
    const top = [...evs].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    return { garages: top, title: "Best EV Garages", subtitle: "Comparing top garages for electric vehicles" };
  }
  if (mode === "bikes") {
    const bk = all.filter((g) => { const vt = Array.isArray(g.vehicleType) ? g.vehicleType.join(",") : String(g.vehicleType || ""); return vt.toLowerCase().includes("2-wheeler") || vt.toLowerCase().includes("bike"); });
    const top = [...bk].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    return { garages: top, title: "Best Bike Garages", subtitle: "Comparing top garages for 2-wheelers & bikes" };
  }
  if (mode === "cars") {
    const cr = all.filter((g) => { const vt = Array.isArray(g.vehicleType) ? g.vehicleType.join(",") : String(g.vehicleType || ""); return vt.toLowerCase().includes("4-wheeler") || vt.toLowerCase().includes("car"); });
    const top = [...cr].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    return { garages: top, title: "Best Car Garages", subtitle: "Comparing top garages for 4-wheelers & cars" };
  }
  if (anchors.length >= 2) {
    return { garages: anchors, title: "Garage Comparison", subtitle: `Comparing ${anchors.length} garages side by side` };
  }
  if (anchors.length === 1) {
    const base = anchors[0];
    const vt   = Array.isArray(base.vehicleType) ? base.vehicleType[0] : base.vehicleType;
    const byType = pool.filter((g) => { const gvt = Array.isArray(g.vehicleType) ? g.vehicleType.join(",") : String(g.vehicleType || ""); return gvt.includes(vt || ""); });
    const fill = [...(byType.length ? byType : pool)].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 2);
    return { garages: [base, ...fill], title: `${base.name} vs Similar`, subtitle: `Comparing ${base.name} with top-rated similar garages` };
  }
  const top = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  return { garages: top, title: "Top Rated Garages", subtitle: "Comparing the highest-rated garages near you" };
}

/* ── Render table cell ── */
function renderCell(key, value, allValues) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-[#c2c6d8] dark:text-[#444654]">—</span>;
  }
  if (key === "rating") {
    const nums = allValues.map(Number).filter(Boolean);
    const best = nums.length > 1 ? Math.max(...nums) : null;
    const isBest = best !== null && Number(value) === best;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
        <span className={`font-bold text-sm ${isBest ? "text-amber-500" : "text-[#1a1c1f] dark:text-[#e4e2e6]"}`}>{value || "New"}</span>
        {isBest && <Badge amber>Best</Badge>}
      </div>
    );
  }
  if (key === "reviews") {
    const nums = allValues.map(Number).filter(Boolean);
    const best = nums.length > 1 ? Math.max(...nums) : null;
    const isBest = best !== null && Number(value) === best;
    return <span className={`text-sm font-semibold ${isBest ? "text-amber-500" : "text-[#1a1c1f] dark:text-[#e4e2e6]"}`}>{value}{isBest && <> <Badge amber>Most</Badge></>}</span>;
  }
  if (key === "isOpen") return value ? <Badge green>Open Now</Badge> : <Badge gray>Closed</Badge>;
  if (key === "distance") {
    const nums = allValues.map((v) => parseFloat(v) || 99);
    const best = nums.length > 1 ? Math.min(...nums) : null;
    const isBest = best !== null && (parseFloat(value) || 99) === best;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-sm font-semibold ${isBest ? "text-[#0056b7] dark:text-[#4d91ff]" : "text-[#1a1c1f] dark:text-[#e4e2e6]"}`}>{value}</span>
        {isBest && <Badge blue>Nearest</Badge>}
      </div>
    );
  }
  if (key === "vehicleType") {
    const types = Array.isArray(value) ? value : [value];
    return <div className="flex flex-wrap gap-1">{types.map((t) => <Badge key={t} gray>{t}</Badge>)}</div>;
  }
  return <span className="text-[13px] text-[#1a1c1f] dark:text-[#e4e2e6] leading-snug">{String(value)}</span>;
}

/* ── Summary generator ── */
function buildSummary(garages) {
  if (!garages.length) return [];
  const summary = [];
  const rated    = [...garages].filter(g => g.rating).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const nearest  = [...garages].filter(g => g.distance).sort((a, b) => (parseFloat(a.distance) || 99) - (parseFloat(b.distance) || 99));
  const reviewed = [...garages].filter(g => g.reviews > 0).sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  const open     = garages.filter(g => g.isOpen);
  if (rated.length)    summary.push({ icon: Trophy,       color: "amber", label: "Best Rated",    name: rated[0].name,    detail: `${rated[0].rating} ★` });
  if (nearest.length)  summary.push({ icon: MapPin,       color: "blue",  label: "Nearest",       name: nearest[0].name,  detail: nearest[0].distance });
  if (reviewed.length) summary.push({ icon: ThumbsUp,     color: "green", label: "Most Reviewed", name: reviewed[0].name, detail: `${reviewed[0].reviews} reviews` });
  if (open.length === 1) summary.push({ icon: CheckCircle2, color: "green", label: "Open Now",    name: open[0].name,     detail: "Only one open right now" });
  if (open.length > 1)   summary.push({ icon: CheckCircle2, color: "green", label: "Open Now",   name: `${open.length} garages`, detail: "All open right now" });
  return summary;
}

const MODES = [
  { label: "Top Rated",  mode: "top-rated", icon: TrendingUp },
  { label: "Nearest",    mode: "nearest",   icon: MapPin     },
  { label: "Best Cars",  mode: "cars",      icon: Car        },
  { label: "Best Bikes", mode: "bikes",     icon: Bike       },
  { label: "Best EV",    mode: "ev",        icon: Zap        },
];

const ROWS = [
  { label: "Rating",        key: "rating"      },
  { label: "Reviews",       key: "reviews"     },
  { label: "Distance",      key: "distance"    },
  { label: "Status",        key: "isOpen"      },
  { label: "Wait Time",     key: "waitTime"    },
  { label: "Speciality",    key: "speciality"  },
  { label: "Vehicle Type",  key: "vehicleType" },
  { label: "Experience",    key: "experience"  },
  { label: "Open Hours",    key: "openHours"   },
  { label: "Address",       key: "address"     },
];

/* ── Layout constants ── */
const LABEL_W  = "86px";   // sticky label column
const COL_W    = "150px";  // min width per garage column

function CompareContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const scrollRef    = useRef(null);

  const [garages,    setGarages]    = useState([]);
  const [title,      setTitle]      = useState("Garage Comparison");
  const [subtitle,   setSubtitle]   = useState("");
  const [loading,    setLoading]    = useState(true);
  const [activeMode, setActiveMode] = useState(searchParams.get("mode") || "");
  const [userCoords, setUserCoords] = useState(null);
  const [canScroll,  setCanScroll]  = useState(false);

  const rawIds = searchParams.get("ids") || "";
  const ids    = rawIds.split(",").filter(Boolean);

  /* GPS once */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    getAllGarages().then((all) => {
      const result = autoSelect(all, { ids, mode: activeMode });
      setGarages(result.garages);
      setTitle(result.title);
      setSubtitle(result.subtitle);
      setLoading(false);
    });
  }, [rawIds, activeMode]);

  /* Detect if horizontal scroll is needed */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 4);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [garages]);

  function switchMode(m) { setActiveMode(m); setLoading(true); }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0056b7] border-t-transparent" />
      </div>
    );
  }

  /* Enrich with live GPS distance */
  const enriched = garages.map((g) => {
    if (userCoords && g.lat && g.lng) {
      const km = haversine(userCoords[0], userCoords[1], g.lat, g.lng);
      return { ...g, distance: km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`, _distKm: km };
    }
    return g;
  });

  const n       = enriched.length;
  const summary = buildSummary(enriched);

  /* Inline grid: sticky label + N garage cols */
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `${LABEL_W} repeat(${n}, minmax(${COL_W}, 1fr))`,
  };
  const tableMinW = `calc(${LABEL_W} + ${n} * ${COL_W})`;

  const allRows = [
    ...ROWS,
    ...(enriched.some(g => g.services?.length) ? [{ label: "Services", key: "services" }] : []),
  ];

  return (
    <div className="min-h-screen bg-surface pb-28 md:pb-12">
      <Header />

      <main className="mx-auto max-w-screen-lg px-4 md:px-6 pt-20 md:pt-24">

        {/* Back */}
        <button type="button" onClick={() => router.back()}
          className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-[#424656] dark:text-[#938f99] hover:text-[#0056b7] dark:hover:text-[#4d91ff] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Title */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="h-5 w-5 text-[#0056b7]" />
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-[#1a1c1f] dark:text-[#e4e2e6]">{title}</h1>
          </div>
          {subtitle && <p className="text-sm text-[#424656] dark:text-[#938f99]">{subtitle}</p>}
        </div>

        {/* Mode switcher */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {MODES.map(({ label, mode: m, icon: Icon }) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95 ${
                activeMode === m
                  ? "bg-[#0056b7] text-white shadow-sm"
                  : "bg-[#f3f3f8] dark:bg-[#2a2a2e] text-[#424656] dark:text-[#938f99] hover:bg-[#d8e2ff] dark:hover:bg-[#1a2f52] hover:text-[#0056b7] dark:hover:text-[#4d91ff]"
              }`}>
              <Icon className="h-3 w-3" />{label}
            </button>
          ))}
        </div>

        {/* Scroll hint — only when content overflows on mobile */}
        {canScroll && (
          <div className="flex items-center gap-1.5 mb-3 md:hidden text-[11px] font-semibold text-[#727687] dark:text-[#918f9a]">
            <MoveRight className="h-3.5 w-3.5" />
            Swipe right to compare all garages
          </div>
        )}

        {/* ── Unified scrollable block ── */}
        <div className="rounded-2xl bg-white dark:bg-[#1e1e22] border border-transparent dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-6 overflow-hidden">
          <div ref={scrollRef} className="overflow-x-auto">
            <div style={{ minWidth: tableMinW }}>

              {/* ── Garage cards header ── */}
              <div style={gridStyle} className="border-b border-[#f3f3f8] dark:border-white/5">
                {/* Sticky label cell */}
                <div className="sticky left-0 z-10 bg-[#f9f9fe] dark:bg-[#17171a] flex items-end justify-start px-3 pb-3 border-r border-[#f3f3f8] dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#727687] dark:text-[#918f9a]">Garage</span>
                </div>
                {/* Cards */}
                {enriched.map((g, i) => (
                  <div key={g.id} className="flex flex-col items-center text-center gap-2 p-3 border-l border-[#f3f3f8] dark:border-white/5">
                    {/* Your Pick badge — fixed height so all cards align */}
                    <div className="h-5 flex items-center justify-center">
                      {i === 0 && ids.length > 0 && (
                        <span className="text-[10px] font-black bg-[#0056b7] text-white rounded-full px-2.5 py-0.5 whitespace-nowrap">Your Pick</span>
                      )}
                    </div>
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-[#f3f3f8] dark:bg-[#2a2a2e] shrink-0">
                      {g.image
                        ? <Image src={g.image} alt={g.name} fill className="object-cover" sizes="56px" />
                        : <div className="flex h-full w-full items-center justify-center"><Wrench className="h-6 w-6 text-[#c2c6d8]" /></div>
                      }
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="flex items-center justify-center gap-1">
                        <p className="truncate text-[13px] font-black text-[#1a1c1f] dark:text-[#e4e2e6]">{g.name}</p>
                        {g.verified && <CheckCircle2 className="h-3 w-3 shrink-0 text-[#0056b7]" />}
                      </div>
                      <p className="text-[11px] text-[#424656] dark:text-[#938f99] truncate">{g.speciality}</p>
                    </div>
                    <Link href={`/garage/${g.id}`}
                      className="w-full rounded-xl bg-[#0056b7] py-2 text-[11px] font-bold text-white flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all">
                      Book Now <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* ── Table rows ── */}
              {allRows.map(({ label, key }, idx) => (
                <div key={key} style={gridStyle}
                  className={idx !== 0 ? "border-t border-[#f3f3f8] dark:border-white/5" : ""}>
                  {/* Sticky label */}
                  <div className="sticky left-0 z-10 flex items-center px-3 py-3 bg-[#f9f9fe] dark:bg-[#17171a] border-r border-[#f3f3f8] dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#727687] dark:text-[#918f9a] leading-tight break-words">{label}</span>
                  </div>
                  {/* Values */}
                  {enriched.map((g) => (
                    <div key={g.id} className="flex items-start px-3 py-3 border-l border-[#f3f3f8] dark:border-white/5">
                      {key === "services"
                        ? <div className="flex flex-wrap gap-1">
                            {(g.services || []).slice(0, 3).map((s) => <Badge key={s.name || s} blue>{s.name || s}</Badge>)}
                            {(g.services || []).length > 3 && <Badge gray>+{g.services.length - 3}</Badge>}
                            {!(g.services || []).length && <span className="text-[#c2c6d8]">—</span>}
                          </div>
                        : renderCell(key, g[key], enriched.map((gg) => gg[key]))
                      }
                    </div>
                  ))}
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* ── Summary ── */}
        {summary.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#1e1e22] border border-transparent dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 md:p-6">
            <h2 className="text-base font-black text-[#1a1c1f] dark:text-[#e4e2e6] mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Comparison Summary
            </h2>
            <div className={`grid gap-3 ${summary.length >= 3 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
              {summary.map(({ icon: Icon, color, label, name, detail }) => (
                <div key={label} className="rounded-xl bg-[#f9f9fe] dark:bg-[#17171a] p-3 flex flex-col gap-1.5">
                  <div className={`flex items-center gap-1.5 ${
                    color === "amber" ? "text-amber-500"
                    : color === "blue" ? "text-[#0056b7] dark:text-[#4d91ff]"
                    : "text-green-600 dark:text-green-400"
                  }`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
                  </div>
                  <p className="text-[13px] font-black text-[#1a1c1f] dark:text-[#e4e2e6] truncate">{name}</p>
                  <p className="text-[11px] text-[#727687] dark:text-[#938f99]">{detail}</p>
                </div>
              ))}
            </div>


            {/* Recommendation — changes with active mode */}
            {enriched.length >= 2 && (() => {
              let best, reason;
              if (activeMode === "nearest") {
                best   = [...enriched].sort((a, b) => (parseFloat(a.distance) || 99) - (parseFloat(b.distance) || 99))[0];
                reason = `closest to you${best.distance ? ` at ${best.distance}` : ""}${best.isOpen ? " and open right now" : ""}`;
              } else if (activeMode === "top-rated") {
                best   = [...enriched].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                reason = `highest rated${best.rating ? ` at ${best.rating} ★` : ""}${best.isOpen ? " and open right now" : ""}`;
              } else if (activeMode === "cars") {
                best   = [...enriched].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                reason = `top pick for cars${best.rating ? ` with ${best.rating} ★` : ""}${best.distance ? `, ${best.distance} away` : ""}`;
              } else if (activeMode === "bikes") {
                best   = [...enriched].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                reason = `top pick for bikes${best.rating ? ` with ${best.rating} ★` : ""}${best.distance ? `, ${best.distance} away` : ""}`;
              } else if (activeMode === "ev") {
                best   = [...enriched].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
                reason = `top pick for EVs${best.rating ? ` with ${best.rating} ★` : ""}${best.distance ? `, ${best.distance} away` : ""}`;
              } else {
                best   = [...enriched].sort((a, b) => {
                  const score = (g) => (g.rating || 0) * 2 + (g.isOpen ? 1 : 0) - (parseFloat(g.distance) || 10) * 0.1;
                  return score(b) - score(a);
                })[0];
                reason = `best overall score — rated ${best.rating || "N/A"} ★${best.isOpen ? ", open right now" : ""}${best.distance ? ` and only ${best.distance} away` : ""}`;
              }
              return (
                <div className="mt-4 rounded-xl bg-[#d8e2ff]/40 dark:bg-[#1a2f52]/40 border border-[#0056b7]/10 dark:border-[#4d91ff]/10 p-3 flex items-start gap-3">
                  <ThumbsUp className="h-4 w-4 text-[#0056b7] dark:text-[#4d91ff] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-black text-[#0056b7] dark:text-[#4d91ff]">Our Recommendation</p>
                    <p className="text-[13px] text-[#1a1c1f] dark:text-[#e4e2e6] mt-0.5">
                      <strong>{best.name}</strong> is the {reason}.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </main>
    </div>
  );
}

export default function ComparePage() {
  return <Suspense><CompareContent /></Suspense>;
}
