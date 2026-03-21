"use client";

import { useState } from "react"; // useState kept for showLocation
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
  const pathname = usePathname();
  const { user } = useAuth();
  const { location } = useLocation();
  const [showLocation,  setShowLocation]  = useState(false);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <>
      <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">

          {/* Location selector — left */}
          <button
            type="button"
            onClick={() => setShowLocation(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-xl py-1 text-left transition hover:opacity-80 active:scale-95"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
                {location ? "Your area" : "Set location"}
              </p>
              <p className="mt-0.5 truncate text-sm font-black text-slate-900 leading-tight max-w-[120px]">
                {location ? location.area : "Detect location"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>

          {/* Brand — centre */}
          <Link
            href="/"
            className="text-lg font-black tracking-tight gradient-text select-none"
          >
            GarageDekho
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-primary/10 hover:text-primary ${
                    active ? "text-primary" : "text-slate-500"
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right — bell or login */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={user ? "/profile" : "/auth"} className="flex items-center gap-2 group">
              <Avatar name={name} size="sm" online={!!user} />
              <span className="hidden md:block text-sm font-bold text-slate-900 capitalize">{name.split(" ")[0]}</span>
            </Link>
            {user ? (
              <Link
                href="/offers"
                aria-label="Offers & Deals"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95"
              >
                <Tag className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-sm">
                  !
                </span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-glow-primary transition hover:brightness-110 active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                Log In
              </Link>
            )}
          </div>

        </div>

      </header>

      {showLocation && <LocationPopup onClose={() => setShowLocation(false)} />}
    </>
  );
}
