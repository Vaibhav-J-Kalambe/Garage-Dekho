"use client";

export default function Card({
  children,
  className = "",
  hover = false,
  glass = false,
  padding = true,
  ...props
}) {
  return (
    <div
      className={[
        "rounded-2xl",
        glass ? "glass" : "bg-white shadow-card",
        padding ? "p-4" : "",
        hover
          ? "transition-all duration-300 ease-spring hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer"
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
