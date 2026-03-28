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
      aria-pressed={active}
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 active:scale-95",
        active
          ? "bg-[#0056b7] text-white shadow-glow-primary"
          : "bg-[#f3f3f8] text-[#424656] hover:bg-[#ededf2]",
        className,
      ].join(" ")}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {count !== undefined && (
        <span
          className={`h-4 min-w-4 rounded-full px-1 text-[10px] font-black leading-4 ${
            active ? "bg-white/25 text-white" : "bg-[#e8e8f0] text-[#424656]"
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
      className={`-mx-4 flex gap-2 overflow-x-auto px-4 py-1 scrollbar-hide md:mx-0 md:px-0 ${className}`}
    >
      {children}
    </div>
  );
}
