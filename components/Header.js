"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogIn } from "lucide-react";
import { useAuth } from "./AuthProvider";
import Avatar from "./ui/Avatar";

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
  const [toast, setToast] = useState(null);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <header className="sticky top-0 z-20 glass border-b border-white/40 px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">

        {/* Logo + greeting */}
        <Link href={user ? "/profile" : "/auth"} className="flex items-center gap-3 group">
          <Avatar name={name} size="md" online={!!user} />
          <div>
            <p className="text-[11px] text-slate-400">Hello,</p>
            <p className="text-sm font-bold leading-tight text-slate-900 capitalize">{name}</p>
          </div>
        </Link>

        {/* Brand mark — centre on desktop */}
        <Link
          href="/"
          className="hidden md:block text-xl font-black tracking-tight gradient-text select-none"
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

        {/* Right action */}
        {user ? (
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => { setToast("Notifications coming soon"); setTimeout(() => setToast(null), 2500); }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-600 shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <Bell className="h-5 w-5" />
          </button>
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
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm md:bottom-8">
          {toast}
        </div>
      )}
    </header>
  );
}
