"use client";

const SIZES = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];

function getGradient(name = "") {
  const code = name.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

export default function Avatar({
  name = "",
  src,
  size = "md",
  online = false,
  className = "",
}) {
  const initial  = name?.[0]?.toUpperCase() ?? "?";
  const gradient = getGradient(name);

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={[
          "flex items-center justify-center rounded-full font-bold text-white",
          `bg-gradient-to-br ${gradient}`,
          SIZES[size] ?? SIZES.md,
        ].join(" ")}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
      )}
    </div>
  );
}
