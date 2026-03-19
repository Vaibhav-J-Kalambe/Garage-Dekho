"use client";

export default function Chip({
  children,
  active = false,
  onClick,
  icon: Icon,
  count,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95",
        active
          ? "bg-primary text-white shadow-glow-primary"
          : "bg-white text-slate-600 shadow-card hover:border-primary/30 hover:text-primary border border-slate-200",
        className,
      ].join(" ")}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {count !== undefined && (
        <span
          className={`h-4 min-w-4 rounded-full px-1 text-[10px] font-black leading-4 ${
            active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* Horizontal scroll container for a row of chips */
export function ChipRow({ children, className = "" }) {
  return (
    <div
      className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
