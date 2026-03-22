"use client";

import { useState, useEffect, useRef } from "react";
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
  const [scrolled,     setScrolled]     = useState(false);
  const [hidden,       setHidden]       = useState(false);
  const lastScrollY = useRef(0);

  /* Scroll sentinel — elevates nav on scroll; hides on scroll-down, reveals on scroll-up */
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (y > lastScrollY.current && y > 80) {
        setHidden(true);   // scrolling down past 80px — hide
      } else if (y < lastScrollY.current) {
        setHidden(false);  // scrolling up — reveal
      }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLocationClose() {
    setShowLocation(false);
    setPinPulsing(true);
    setTimeout(() => setPinPulsing(false), 700);
  }

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-20 bg-white transition-[transform,box-shadow] duration-300 ${
          hidden ? "-translate-y-full" : ""
        } ${
          scrolled
            ? "shadow-[0_2px_24px_rgba(0,0,0,0.09)]"
            : "border-b border-slate-100/80"
        }`}
      >
        {/* ── Brand-signature accent strip — 3px gradient top line ── */}
        {/* Gives the nav a distinctive identity mark without being loud */}
        <div
          aria-hidden="true"
          className="animate-accent-in h-[3px] bg-gradient-to-r from-[#0047BE] via-[#38bdf8] to-[#0047BE]"
        />

        <div className="mx-auto flex max-w-5xl items-center px-4 py-2.5">

          {/* ── Left col (flex-1) — location pill left-aligned ── */}
          <div className="flex flex-1 items-center">
            <button
              type="button"
              aria-label={location ? `Location: ${location.area}. Tap to change` : "Set your location"}
              aria-expanded={showLocation}
              onClick={() => setShowLocation((v) => !v)}
              className="group flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] min-h-[44px]"
            >
              <div className="relative shrink-0">
                {pinPulsing && (
                  <span className="pointer-events-none absolute -inset-1 animate-ping rounded-full bg-primary/30" aria-hidden="true" />
                )}
                <MapPin className="relative z-10 h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </div>

              {/* Desktop: two-line label + area */}
              <div className="hidden min-w-0 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                  {location ? "Your area" : "Location"}
                </p>
                <p className="mt-0.5 max-w-[100px] truncate text-xs font-black text-slate-800 leading-tight">
                  {location ? location.area : "Set location"}
                </p>
              </div>

              {/* Mobile: single-line compact */}
              <p className="max-w-[68px] truncate text-xs font-bold text-slate-700 sm:hidden">
                {location ? location.area : "Location"}
              </p>

              <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          </div>

          {/* ── Center — brand always visually centered ── */}
          <Link
            href="/"
            className="shrink-0 px-4 text-[15px] font-black tracking-tight gradient-text select-none md:text-lg"
          >
            GarageDekho
          </Link>

          {/* ── Right col (flex-1) — nav + user right-aligned ── */}
          <div className="flex flex-1 items-center justify-end gap-2">

            {/* Desktop nav links */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-0.5 md:flex"
            >
              {NAV_LINKS.map(({ label, href }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-[color,background-color] duration-150 ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={user ? "/profile" : "/auth"}
                aria-label={user ? `View profile for ${name}` : "Sign in"}
                className="flex items-center gap-2"
              >
                <Avatar name={name} size="sm" online={!!user} />
                {user && (
                  <span className="hidden text-sm font-bold text-slate-800 capitalize md:block">
                    {name.split(" ")[0]}
                  </span>
                )}
              </Link>

              {user ? (
                <Link
                  href="/offers"
                  aria-label="Offers & Deals"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-[color,background-color,transform] duration-150 hover:bg-primary/10 hover:text-primary active:scale-95"
                >
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-white"
                  >
                    !
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow-primary transition-[transform,filter] duration-150 hover:brightness-110 active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  Log In
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>

      {showLocation && <LocationPopup onClose={handleLocationClose} />}
    </>
  );
}
