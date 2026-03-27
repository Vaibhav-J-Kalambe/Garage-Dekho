import Link from "next/link";
import { MapPin, Home, Navigation } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">

      {/* Big 404 */}
      <p className="text-[96px] font-black leading-none text-slate-100 select-none">404</p>

      <div className="mt-2 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <MapPin className="h-7 w-7 text-primary" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        We couldn&apos;t find what you were looking for. It may have moved or no longer exists.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/near-me"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <Navigation className="h-4 w-4" />
          Find a Garage
        </Link>
      </div>

    </div>
  );
}
