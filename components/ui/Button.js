"use client";

import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-primary text-white shadow-glow-primary hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white border border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary hover:bg-primary/5",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "bg-red-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:brightness-110 active:brightness-95",
  accent:
    "bg-accent text-white shadow-glow-accent hover:brightness-110 active:brightness-95",
  "outline-primary":
    "border border-primary/30 text-primary hover:bg-primary/5",
};

const SIZES = {
  xs: "h-7 px-2.5 text-[11px] gap-1 rounded-full",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-full",
  md: "h-10 px-4 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2.5 rounded-2xl",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
