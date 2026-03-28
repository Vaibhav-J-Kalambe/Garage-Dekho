import Link from "next/link";
import { MapPin, Home, Navigation } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9fe] px-4 text-center">

      {/* Big 404 */}
      <p className="text-[96px] font-black leading-none text-[#e8e8f0] select-none">404</p>

      <div className="mt-2 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d8e2ff]">
        <MapPin className="h-7 w-7 text-[#0056b7]" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-[#1a1c1f]">
        Page not found
      </h1>
      <p className="mt-2 max-w-xs text-sm text-[#424656]">
        We couldn&apos;t find what you were looking for. It may have moved or no longer exists.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,86,183,0.25)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/near-me"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c2c6d8]/30 bg-white py-3 text-sm font-bold text-[#424656] transition hover:bg-[#f3f3f8] active:scale-[0.98]"
        >
          <Navigation className="h-4 w-4" />
          Find a Garage
        </Link>
      </div>

    </div>
  );
}
