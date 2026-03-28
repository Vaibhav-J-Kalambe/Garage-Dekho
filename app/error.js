"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log to error tracking service here (e.g. Sentry.captureException(error))
    console.error("[GarageDekho Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9f9fe] px-4 text-center">

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffdad6]">
        <AlertTriangle className="h-8 w-8 text-[#ba1a1a]" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-[#1a1c1f]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-xs text-sm text-[#424656]">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0056b7] py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,86,183,0.25)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c2c6d8]/30 bg-white py-3 text-sm font-bold text-[#424656] transition hover:bg-[#f3f3f8] active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-[#727687]">
        If this keeps happening, contact{" "}
        <a href="mailto:support@garagedekho.in" className="underline hover:text-[#424656]">
          support@garagedekho.in
        </a>
      </p>

    </div>
  );
}
