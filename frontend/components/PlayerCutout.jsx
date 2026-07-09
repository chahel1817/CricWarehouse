import Image from "next/image";

/**
 * PlayerCutout — transparent-background player sticker with
 * optional background shape, floating animation, data label, and drop shadow.
 *
 * Props:
 *   src: image path (string)
 *   alt: player name (string)
 *   width, height: intrinsic image dimensions
 *   floatClass: float-1 … float-5 CSS class string
 *   enterDelay: CSS delay string e.g. "0.3s"
 *   priority: bool — preload image
 *   label: { number, name, detail } — optional editorial data annotation
 *   labelPosition: "left" | "right" — which side to show label
 *   bgShape: JSX node — the shape element to render behind the player
 *   className: extra wrapper classes
 */
export default function PlayerCutout({
  src,
  alt,
  width = 300,
  height = 480,
  floatClass = "float-1",
  enterDelay = "0s",
  priority = false,
  label,
  labelPosition = "right",
  bgShape,
  className = "",
}) {
  return (
    <figure
      className={`player-enter relative flex flex-col items-center ${className}`}
      style={{ animationDelay: enterDelay }}
      aria-label={alt}
    >
      {/* Background geometric shape (renders behind) */}
      {bgShape && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-end justify-center"
        >
          {bgShape}
        </span>
      )}

      {/* The player image itself */}
      <div className={`player-cutout relative ${floatClass}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Editorial data label */}
      {label && (
        <div
          aria-label={`${label.name} — ${label.detail}`}
          className={`
            absolute top-[20%] z-20 flex flex-col gap-0.5 border-l-2 border-ink pl-2
            ${labelPosition === "left" ? "right-[calc(100%+8px)] items-end border-l-0 border-r-2 pr-2 pl-0" : "left-[calc(100%+8px)]"}
          `}
        >
          <span className="font-display text-2xl font-black leading-none tracking-tight text-ink">
            {label.number}
          </span>
          <span className="annotation text-ink">{label.name}</span>
          <span className="annotation text-ink/40">{label.detail}</span>
        </div>
      )}

      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  );
}
