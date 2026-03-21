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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        An unexpected error occurred. Our team has been notified. Please try again.
      </p>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={reset}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-card-hover transition hover:brightness-110 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-slate-300">
        If this keeps happening, contact{" "}
        <a href="mailto:support@garagedekho.in" className="underline hover:text-slate-500">
          support@garagedekho.in
        </a>
      </p>

    </div>
  );
}
