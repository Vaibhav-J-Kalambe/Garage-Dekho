"use client";

const SIZES = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const GRADIENTS = [
  "from-[#0056b7] to-[#006de6]",
  "from-[#4c4aca] to-[#6664e4]",
  "from-[#a33200] to-[#cc4204]",
  "from-[#ba1a1a] to-[#c62828]",
  "from-[#0056b7] to-[#4c4aca]",
  "from-[#424656] to-[#1a1c1f]",
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
