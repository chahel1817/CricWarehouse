"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const LEGENDS = [
  {
    id: "virat",
    number: "18",
    firstName: "VIRAT",
    lastName: "KOHLI",
    stat: "8,000+",
    statLabel: "CAREER RUNS",
    subStat: "17 IPL SEASONS",
    src: "/players/virat.avif",
    imgW: 520,
    imgH: 520,
    shapeBg: "rgba(255,90,47,0.12)",
    shapeStyle: "rounded-full",
    accentColor: "bg-boundary",
    accentText: "text-boundary",
    numberColor: "rgba(255,90,47,0.06)",
    floatClass: "float-1",
    enterDelay: "0.08s",
    imageAlign: "right",
    imgStyle: { transform: "scale(1.08) translateY(6%)", transformOrigin: "bottom center" },
  },
  {
    id: "dhoni",
    number: "7",
    firstName: "MS",
    lastName: "DHONI",
    stat: "5×",
    statLabel: "IPL CHAMPION",
    subStat: "4,746 CAREER RUNS",
    src: "/players/dhoni.avif",
    imgW: 460,
    imgH: 700,
    shapeBg: "rgba(247,201,72,0.13)",
    shapeStyle: "rounded-[3rem]",
    accentColor: "bg-trophy",
    accentText: "text-trophy",
    numberColor: "rgba(247,201,72,0.07)",
    floatClass: "float-2",
    enterDelay: "0.18s",
    imageAlign: "left",
    imgStyle: { transform: "scale(0.88) translateY(2%)", transformOrigin: "bottom center" },
  },
  {
    id: "rohit",
    number: "45",
    firstName: "ROHIT",
    lastName: "SHARMA",
    stat: "6,628",
    statLabel: "CAREER RUNS",
    subStat: "5× MI CHAMPION",
    src: "/players/rohitt.avif",
    imgW: 460,
    imgH: 700,
    shapeBg: "rgba(61,99,255,0.10)",
    shapeStyle: "rounded-t-full",
    accentColor: "bg-royal",
    accentText: "text-royal",
    numberColor: "rgba(61,99,255,0.06)",
    floatClass: "float-3",
    enterDelay: "0.28s",
    imageAlign: "right",
    imgStyle: { transform: "scale(1.22) translateY(12%)", transformOrigin: "bottom center" },
  },
];

// Continuous composition height (60-70vh max)
const COMP_HEIGHT = "clamp(340px, 44vw, 520px)";

export default function PlayerShowcase() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".scroll-reveal") ?? [];
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.08 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="players"
      ref={sectionRef}
      className="relative border-t border-ink/10 pt-12 pb-12 overflow-hidden"
      aria-label="Player analytics showcase"
    >
      {/* Section Header */}
      <div className="scroll-reveal" style={{ transitionDelay: "0s" }}>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-ink/22" aria-hidden="true" />
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(23,23,23,0.4)" }}>
            Player Analytics
          </span>
        </div>
        <h2
          className="mt-4 font-display font-black tracking-[-0.04em] leading-[0.9]"
          style={{ fontSize: "clamp(2.6rem, 5vw, 4.8rem)" }}
        >
          THE NUMBERS
          <br />
          <span
            className="font-black"
            style={{ WebkitTextStroke: "2px rgba(23,23,23,0.75)", color: "transparent" }}
          >
            BEHIND THE LEGENDS.
          </span>
        </h2>
      </div>

      {/* Player Compositions List */}
      <div className="mt-10 flex flex-col gap-0 border-t border-ink/8">
        {LEGENDS.map((p, idx) => (
          <PlayerComposition key={p.id} player={p} idx={idx} />
        ))}
      </div>
    </section>
  );
}

function PlayerComposition({ player: p, idx }) {
  const isImageLeft = p.imageAlign === "left";

  return (
    <article
      className="scroll-reveal relative overflow-hidden border-b border-ink/8"
      style={{
        transitionDelay: `${0.08 + idx * 0.12}s`,
        minHeight: COMP_HEIGHT,
        isolation: "isolate", // Forcing stacking context to ensure absolutely positioned elements clip properly
      }}
      aria-label={`${p.firstName} ${p.lastName} player analytics`}
    >
      {/* ── BACKGROUND JERSEY NUMBER ── */}
      <span
        aria-hidden="true"
        className="jersey-number pointer-events-none absolute select-none"
        style={{
          top: "8%",
          [isImageLeft ? "right" : "left"]: "5%",
          zIndex: 0,
          fontFamily: "var(--font-display), sans-serif",
          color: p.numberColor,
        }}
      >
        {p.number}
      </span>

      {/* ── BACKGROUND GEOMETRIC SHAPE ── */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute shape-grain ${p.shapeStyle}`}
        style={{
          width: "28%",
          aspectRatio: "1",
          top: "15%",
          [isImageLeft ? "left" : "right"]: "8%",
          background: p.shapeBg,
          zIndex: 1,
        }}
      />

      {/* Technical accent lines & dots */}
      <span
        aria-hidden="true"
        className={`absolute h-2.5 w-2.5 rounded-full ${p.accentColor}`}
        style={{ top: "25%", [isImageLeft ? "right" : "left"]: "46%", zIndex: 2 }}
      />
      <span
        aria-hidden="true"
        className="absolute h-1 w-1 rounded-full bg-ink/15"
        style={{ top: "32%", [isImageLeft ? "right" : "left"]: "49%", zIndex: 2 }}
      />

      {/* ── MAIN CONTENT LAYER ── */}
      <div
        className={`relative z-10 flex h-full ${isImageLeft ? "flex-row" : "flex-row-reverse"} items-end justify-between`}
        style={{ minHeight: COMP_HEIGHT }}
      >
        {/* Player Cutout Image Side */}
        <div
          className="relative flex items-end justify-center self-end overflow-visible"
          style={{ width: "42%" }}
        >
          <figure
            className={`player-enter player-cutout ${p.floatClass} relative w-full flex justify-center`}
            style={{ animationDelay: p.enterDelay }}
            aria-label={`${p.firstName} ${p.lastName} cutout`}
          >
            {/* Apply p.imgStyle wrapper transform to ensure browser renders scaling robustly */}
            <div
              className="relative w-full max-w-[280px] md:max-w-[340px] lg:max-w-[380px] overflow-visible"
              style={p.imgStyle}
            >
              <Image
                src={p.src}
                alt={`${p.firstName} ${p.lastName}`}
                width={p.imgW}
                height={p.imgH}
                className="h-auto w-full object-contain object-bottom"
                draggable={false}
              />
            </div>
            <figcaption className="sr-only">{p.firstName} {p.lastName}</figcaption>
          </figure>
        </div>

        {/* Text Details Side */}
        <div
          className="flex flex-1 flex-col justify-end px-6 pb-8 pt-8 md:px-10 lg:px-16"
        >
          {/* Jersey Label */}
          <div className="flex items-center gap-3 mb-3">
            <span className={`h-0.5 w-8 ${p.accentColor}`} aria-hidden="true" />
            <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(23,23,23,0.36)" }}>
              LEGEND / #0{p.number}
            </span>
          </div>

          {/* Player Name */}
          <h3
            className="font-display font-black leading-[0.88] tracking-[-0.04em] text-ink/90"
            style={{ fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)" }}
          >
            {p.firstName}
            <br />
            <span className={p.accentText}>{p.lastName}</span>
          </h3>

          {/* Composition Divider */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`h-0.5 w-10 ${p.accentColor} opacity-40`} aria-hidden="true" />
            <span className="h-px flex-1 bg-ink/6" aria-hidden="true" />
          </div>

          {/* Primary Statistic */}
          <div className="mt-4 flex items-end gap-3.5">
            <span
              className="font-display font-black leading-none tracking-[-0.04em] text-ink"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)" }}
            >
              {p.stat}
            </span>
            <div className="mb-0.5 flex flex-col gap-0.5">
              <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(23,23,23,0.65)" }}>
                {p.statLabel}
              </span>
              <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(23,23,23,0.35)" }}>
                {p.subStat}
              </span>
            </div>
          </div>

          {/* Bottom Accent */}
          <div className={`mt-5 h-1 w-12 rounded-full ${p.accentColor}`} aria-hidden="true" />
        </div>
      </div>

      {/* Responsive layout style for mobile devices */}
      <style jsx>{`
        @media (max-width: 767px) {
          article > div.flex {
            flex-direction: column !important;
            align-items: center;
          }
          article > div.flex > div:first-child {
            width: 70% !important;
            max-width: 250px;
          }
          article > div.flex > div:last-child {
            padding: 1.25rem 1rem !important;
            text-align: center;
            align-items: center;
          }
          article > div.flex > div:last-child div.flex {
            justify-content: center;
          }
        }
      `}</style>
    </article>
  );
}
