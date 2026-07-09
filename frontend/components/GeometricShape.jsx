/**
 * GeometricShape — reusable abstract background shapes for the editorial hero.
 *
 * Props:
 *   variant: "circle" | "semicircle-r" | "semicircle-t" | "rounded-rect" | "pill" | "ring" | "dot"
 *   color: Tailwind bg-* class string
 *   size: Tailwind w-*/h-* pair as string  e.g. "w-48 h-48"
 *   className: extra Tailwind classes (positioning, z-index, rotation, etc.)
 *   grainy: boolean — whether to apply .shape-grain texture
 *   spinSlow: boolean — whether to apply slow rotation animation
 */
export default function GeometricShape({
  variant = "circle",
  color = "bg-boundary",
  size = "w-40 h-40",
  className = "",
  grainy = true,
  spinSlow = false,
}) {
  const base = `${size} ${color} ${grainy ? "shape-grain" : ""} ${spinSlow ? "spin-slow" : ""}`;

  const shapeClass = {
    circle: "rounded-full",
    "semicircle-r": "rounded-r-full",
    "semicircle-l": "rounded-l-full",
    "semicircle-t": "rounded-t-full",
    "semicircle-b": "rounded-b-full",
    "rounded-rect": "rounded-2xl",
    pill: "rounded-full",
    ring: "rounded-full border-[12px] bg-transparent",
    dot: "rounded-full w-3 h-3",
  }[variant] ?? "rounded-full";

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block shrink-0 ${base} ${shapeClass} ${className}`}
    />
  );
}
