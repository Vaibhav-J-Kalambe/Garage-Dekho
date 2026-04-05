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
      { label: "List Your Garage",  href: "/portal/register" },
      { label: "Partner Login",     href: "/portal/login"    },
      { label: "Partner Register",  href: "/portal/register" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Profile",        href: "/profile"           },
      { label: "Saved Garages",  href: "/profile/saved"     },
      { label: "Addresses",      href: "/profile/addresses" },
      { label: "Sign In",        href: "/auth"              },
    ],
  },
];

const TRUST_BADGES = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    label: "Verified Garages",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "15-min Response",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12M6 8h12M6 13h8a4 4 0 0 0 0-5H6M6 13l6 8"/>
      </svg>
    ),
    label: "Fixed Pricing",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    label: "Razorpay Secured",
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
      <div className="border-b border-[#f3f3f8] bg-[#f9f9fe]">
        <div className="mx-auto flex max-w-screen-xl items-center justify-center gap-10 px-6 py-3.5">
          {TRUST_BADGES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[#424656]">
              <span className="text-[#0056b7]">{icon}</span>
              <span className="text-[12px] font-semibold">{label}</span>
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

          {/* Live badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[12px] font-semibold text-[#424656]">500+ partner garages live</span>
          </div>

          {/* Social links */}
          <div className="mt-5 flex items-center gap-3">
            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GarageDekho on Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#d8e2ff] hover:text-[#0056b7]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact on WhatsApp"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#d8e2ff] hover:text-[#0056b7]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </a>
            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GarageDekho on X"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f3f8] text-[#424656] transition-colors duration-150 hover:bg-[#d8e2ff] hover:text-[#0056b7]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          {/* App download */}
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#727687]">Get the app</p>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Download on the App Store"
                className="flex items-center gap-1.5 rounded-xl border border-[#c2c6d8]/40 bg-[#f3f3f8] px-3 py-2 transition-colors duration-150 hover:bg-[#d8e2ff] hover:border-[#0056b7]/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1c1f" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-[9px] text-[#727687] leading-none">Download on the</p>
                  <p className="text-[11px] font-bold text-[#1a1c1f] leading-tight">App Store</p>
                </div>
              </a>
              <a
                href="#"
                aria-label="Get it on Google Play"
                className="flex items-center gap-1.5 rounded-xl border border-[#c2c6d8]/40 bg-[#f3f3f8] px-3 py-2 transition-colors duration-150 hover:bg-[#d8e2ff] hover:border-[#0056b7]/20"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 20.5v-17c0-.83 1-.83 1.5-.5l14 8.5c.5.3.5 1-.0 1.3L4.5 21c-.5.33-1.5.33-1.5-.5z" fill="#1a1c1f"/>
                </svg>
                <div>
                  <p className="text-[9px] text-[#727687] leading-none">Get it on</p>
                  <p className="text-[11px] font-bold text-[#1a1c1f] leading-tight">Google Play</p>
                </div>
              </a>
            </div>
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
            © {new Date().getFullYear()} GarageDekho Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/profile/help" className="text-[12px] text-[#727687] hover:text-[#424656] transition-colors duration-150">
              Help & Support
            </Link>
            <span className="text-[#c2c6d8]">·</span>
            <span className="text-[12px] text-[#727687] cursor-default">Privacy Policy</span>
            <span className="text-[#c2c6d8]">·</span>
            <span className="text-[12px] text-[#727687] cursor-default">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
