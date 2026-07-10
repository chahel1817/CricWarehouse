"use client";

import { useEffect, useRef } from "react";

const PIPELINE_STAGES = [
  {
    id: "bronze",
    num: "01",
    phase: "INGESTION & STORAGE",
    title: "BRONZE LAYER",
    accent: "bg-boundary",
    accentText: "text-boundary",
    border: "border-boundary/30",
    borderLeft: "border-l-boundary",
    desc: "Raw IPL JSON and match data",
    icon: (
      <svg className="w-3.5 h-3.5 text-boundary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    details: [
      "Schema validation & enforcement",
      "Ingested directly from raw ball-by-ball matches",
      "Partitioned by season key",
      "Immutable write pattern"
    ]
  },
  {
    id: "silver",
    num: "02",
    phase: "PROCESSING & CLEANING",
    title: "SILVER LAYER",
    accent: "bg-royal",
    accentText: "text-royal",
    border: "border-royal/30",
    borderLeft: "border-l-royal",
    desc: "Cleaned, validated, and transformed PySpark datasets",
    icon: (
      <svg className="w-3.5 h-3.5 text-royal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    details: [
      "PySpark deduplication & cleaning",
      "Null values & format normalization",
      "Feature engineering (runs, strike rates)",
      "Enriched schemas stored as Parquet"
    ]
  },
  {
    id: "gold",
    num: "03",
    phase: "AGGREGATION & SERVING",
    title: "GOLD LAYER",
    accent: "bg-trophy",
    accentText: "text-trophy",
    border: "border-trophy/30",
    borderLeft: "border-l-trophy",
    desc: "Aggregated player, team, season, and match analytics",
    icon: (
      <svg className="w-3.5 h-3.5 text-trophy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    ),
    details: [
      "Analytics-ready SQL rollup views",
      "Aggregated player & team standings",
      "Optimized query performance profiles",
      "Direct consumption via Dashboard API"
    ]
  }
];

export default function MedallionSection() {
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
      id="architecture"
      ref={sectionRef}
      className="relative border-t border-ink/10 pt-16 pb-16 overflow-hidden"
      aria-label="Medallion Architecture pipeline details"
    >
      {/* Background accents */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-16 h-80 w-80 rounded-full bg-trophy/5 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-16 h-80 w-80 rounded-full bg-royal/5 blur-3xl" />

      {/* ── Section Header ── */}
      <div className="scroll-reveal" style={{ transitionDelay: "0s" }}>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-ink/25" aria-hidden="true" />
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(23,23,23,0.4)" }}>
            Medallion Architecture
          </span>
        </div>
        <h2
          className="mt-4 font-display font-black tracking-[-0.04em] leading-[0.9]"
          style={{ fontSize: "clamp(2.8rem, 5.5vw, 5rem)" }}
        >
          FROM RAW DELIVERIES
          <br />
          <span className="text-boundary">TO GOLD INSIGHTS.</span>
        </h2>
        <p className="mt-5 max-w-[50ch] text-[0.9rem] font-medium leading-[1.75] text-ink/50">
          CricWarehouse processes 1,243 matches and 250,000+ deliveries through three schema-validated layers using PySpark 4.1.
        </p>
      </div>

      {/* ── Pipeline Architecture Flow ── */}
      <div className="relative mt-14">
        {/* Stages list container */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 relative z-10">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={stage.id}
              className={`scroll-reveal relative flex flex-col p-6 rounded-2xl border-l-4 ${stage.borderLeft} bg-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/60 hover:-translate-y-1 min-h-[380px] lg:min-h-[410px]`}
              style={{ transitionDelay: `${0.1 + i * 0.12}s` }}
            >
              {/* Header node with number + line */}
              <div className="flex items-center gap-4">
                {/* Node circle */}
                <div
                  className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 border-2 ${stage.border} bg-[#f7f5ef] shape-grain shadow-sm`}
                >
                  <span className="font-display font-black text-lg text-ink/70">{stage.num}</span>
                </div>

                {/* Subtitle / phase */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black tracking-[0.2em] text-ink/40 uppercase">{stage.phase}</span>
                  <span className={`text-[11px] font-black tracking-[0.05em] uppercase ${stage.accentText}`}>{stage.title}</span>
                </div>
              </div>

              {/* Description */}
              <h3 className="mt-5 font-display text-xl font-black leading-snug tracking-tight text-ink/90">
                {stage.desc}
              </h3>

              {/* List details */}
              <ul className="mt-6 flex flex-col gap-3 border-t border-ink/8 pt-5 mt-auto">
                {stage.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-1 shrink-0" aria-hidden="true">
                      {stage.icon}
                    </span>
                    <span className="text-[12px] font-medium leading-relaxed text-ink/65">{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Thin dotted arrow lines showing data flow direction between cards (desktop only) */}
              {i < 2 && (
                <div className="hidden lg:flex absolute right-[-2.25rem] top-1/2 -translate-y-1/2 w-[2rem] z-0 items-center justify-center pointer-events-none">
                  <div className="w-full h-px border-t-2 border-dotted border-ink/20" />
                  <svg className="w-3 h-3 text-ink/20 absolute right-[-2px] top-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom stat strip ── */}
      <div
        className="scroll-reveal mt-16 grid grid-cols-2 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-4"
        style={{ transitionDelay: "0.25s" }}
      >
        {[
          { val: "1,243",  lbl: "Matches Indexed",   accent: "bg-boundary" },
          { val: "250k+",  lbl: "Ball Events",        accent: "bg-royal" },
          { val: "19",     lbl: "IPL Seasons",        accent: "bg-trophy" },
          { val: "3",      lbl: "Pipeline Layers",    accent: "bg-bronze" },
        ].map(({ val, lbl, accent }) => (
          <div key={lbl} className="flex flex-col gap-2">
            <div className={`h-1 w-8 rounded-full ${accent}`} aria-hidden="true" />
            <p className="font-display text-3xl font-black tracking-tight md:text-4xl">{val}</p>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(23,23,23,0.42)" }}>{lbl}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
