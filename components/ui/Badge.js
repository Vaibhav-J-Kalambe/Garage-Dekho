"use client";

const VARIANTS = {
  default:  "bg-slate-100 text-slate-600",
  primary:  "bg-primary/10 text-primary",
  success:  "bg-green-50 text-green-600",
  warning:  "bg-amber-50 text-amber-600",
  danger:   "bg-red-50 text-red-500",
  info:     "bg-blue-50 text-blue-600",
  accent:   "bg-orange-50 text-orange-600",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon: Icon,
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center font-bold rounded-full",
        VARIANTS[variant] ?? VARIANTS.default,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            variant === "success" ? "bg-green-500"
            : variant === "danger" ? "bg-red-500"
            : variant === "warning" ? "bg-amber-500"
            : variant === "primary" ? "bg-primary"
            : "bg-current"
          }`}
        />
      )}
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}
