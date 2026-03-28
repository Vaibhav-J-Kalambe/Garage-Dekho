"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_ON = ["/admin", "/sos", "/garage/", "/partner", "/portal"];


const NAV_COLS = [
  {
    heading: "Explore",
    links: [
      { label: "Find a Garage",   href: "/near-me"  },
      { label: "My Bookings",     href: "/bookings" },
      { label: "Offers & Deals",  href: "/offers"   },
      { label: "Emergency SOS",   href: "/sos"      },
    ],
  },
  {
    heading: "For Garages",
    links: [
      { label: "List Your Garage",  href: "/partner"        },
      { label: "Partner Login",     href: "/portal/login"   },
      { label: "Partner Register",  href: "/portal/register"},
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Profile",           href: "/profile"              },
      { label: "Saved Garages",     href: "/profile/saved"        },
      { label: "Addresses",         href: "/profile/addresses"    },
      { label: "Sign In",           href: "/auth"                 },
    ],
  },
];

const TRUST_BADGES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    label: "Verified Garages",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "15-min Response",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: "Fixed Pricing",
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer
      className="hidden md:block bg-white border-t border-[#f3f3f8] mt-16"
      aria-label="Site footer"
    >
      {/* Trust bar */}
      <div className="border-b border-[#f3f3f8]">
        <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-10 px-6 py-4">
          {TRUST_BADGES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[#424656]">
              <span className="text-[#0056b7]">{icon}</span>
              <span className="text-[13px] font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto grid max-w-screen-xl grid-cols-4 gap-8 px-6 py-12">
        {/* Brand column */}
        <div>
          <Link href="/" className="text-[1.1rem] font-black tracking-tight text-[#0056b7]">
            GarageDekho
          </Link>
          <p className="mt-3 text-[13px] leading-relaxed text-[#424656]">
            India&apos;s hyperlocal automotive service marketplace. Find verified garages, book services, and get 24/7 roadside help.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[12px] font-semibold text-[#424656]">500+ partner garages live</span>
          </div>
        </div>

        {/* Nav columns */}
        {NAV_COLS.map(({ heading, links }) => (
          <div key={heading}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#727687]">
              {heading}
            </p>
            <ul className="space-y-3">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] font-medium text-[#424656] transition-colors duration-150 hover:text-[#0056b7]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#f3f3f8]">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
          <p className="text-[12px] text-[#727687]">
            © {new Date().getFullYear()} GarageDekho. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/profile/help" className="text-[12px] text-[#727687] hover:text-[#424656] transition-colors duration-150">
              Help
            </Link>
            <span className="text-[#c2c6d8]">·</span>
            <span className="text-[12px] text-[#727687]">Privacy Policy</span>
            <span className="text-[#c2c6d8]">·</span>
            <span className="text-[12px] text-[#727687]">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
