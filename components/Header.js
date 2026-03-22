"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, LogIn, MapPin, ChevronDown } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useLocation } from "../context/LocationContext";
import Avatar from "./ui/Avatar";
import LocationPopup from "./LocationPopup";

const NAV_LINKS = [
  { label: "Home",     href: "/"         },
  { label: "Near Me",  href: "/near-me"  },
  { label: "Bookings", href: "/bookings" },
  { label: "Offers",   href: "/offers"   },
  { label: "Profile",  href: "/profile"  },
];

export default function Header() {
  const pathname     = usePathname();
  const { user }     = useAuth();
  const { location } = useLocation();

  const [showLocation, setShowLocation] = useState(false);
  const [pinPulsing,   setPinPulsing]   = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('[data-hero], section[aria-label="Search for garages"]');
    if (!hero) {
      setScrolled(true);
      return;
    }
    setScrolled(false);
    const onScroll = () => {
      // Turn white the moment the hero's bottom edge reaches the navbar (~64px from top)
      setScrolled(hero.getBoundingClientRect().bottom <= 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  function handleLocationClose() {
    setShowLocation(false);
    setPinPulsing(true);
    setTimeout(() => setPinPulsing(false), 700);
  }

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  // dark = at top of page (over hero), light = scrolled (over white content)
  const dark = !scrolled;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-20 transition-[background-color,box-shadow,border-color] duration-150 ease-in-out ${
          scrolled
            ? "bg-white shadow-none border-b border-transparent"
            : "bg-transparent border-b border-transparent shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">

          {/* ── Left — brand + nav links ── */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`shrink-0 pr-3 text-[15px] font-black tracking-tight select-none md:text-lg ${
                dark ? "text-white" : "gradient-text"
              }`}
            >
              GarageDekho
            </Link>

            <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map(({ label, href }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-[color,background-color] duration-150 ${
                      dark
                        ? active
                          ? "bg-white/15 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                        : active
                          ? "bg-primary/10 text-primary"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── Right — location pill + user/login ── */}
          <div className="ml-auto flex items-center gap-2">

            {/* Location pill */}
            <button
              type="button"
              aria-label={location ? `Location: ${location.area}. Tap to change` : "Set your location"}
              aria-expanded={showLocation}
              onClick={() => setShowLocation((v) => !v)}
              className={`group flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.97] min-h-[44px] ${
                dark
                  ? "border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15"
                  : "border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <div className="relative shrink-0">
                {pinPulsing && (
                  <span className={`pointer-events-none absolute -inset-1 animate-ping rounded-full ${dark ? "bg-blue-400/40" : "bg-primary/30"}`} aria-hidden="true" />
                )}
                <MapPin className={`relative z-10 h-3.5 w-3.5 ${dark ? "text-blue-300" : "text-primary"}`} aria-hidden="true" />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${dark ? "text-white/50" : "text-slate-400"}`}>
                  {location ? "Your area" : "Location"}
                </p>
                <p className={`mt-0.5 max-w-[100px] truncate text-xs font-black leading-tight ${dark ? "text-white" : "text-slate-800"}`}>
                  {location ? location.area : "Set location"}
                </p>
              </div>

              <p className={`max-w-[68px] truncate text-xs font-bold sm:hidden ${dark ? "text-white/80" : "text-slate-700"}`}>
                {location ? location.area : "Location"}
              </p>

              <ChevronDown className={`h-3 w-3 shrink-0 ${dark ? "text-white/40" : "text-slate-400"}`} aria-hidden="true" />
            </button>

            {/* Avatar — only when logged in */}
            {user && (
              <Link
                href="/profile"
                aria-label={`View profile for ${name}`}
                className="flex items-center gap-2"
              >
                <Avatar name={name} size="sm" online />
                <span className={`hidden text-sm font-bold capitalize md:block ${dark ? "text-white" : "text-slate-800"}`}>
                  {name.split(" ")[0]}
                </span>
              </Link>
            )}

            {/* Offers / Login */}
            {user ? (
              <Link
                href="/offers"
                aria-label="Offers & Deals"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-[color,background-color,transform] duration-150 active:scale-95 ${
                  dark
                    ? "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Tag className="h-4 w-4" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ${dark ? "ring-[#003091]" : "ring-white"}`}
                >
                  !
                </span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-[background-color,color,border-color] duration-150 active:scale-95 ${
                  dark
                    ? "border-white/25 text-white hover:bg-white/10 hover:border-white/40"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Log In
              </Link>
            )}
          </div>

        </div>
      </header>

      {showLocation && <LocationPopup onClose={handleLocationClose} />}
    </>
  );
}
