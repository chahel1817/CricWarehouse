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
    desc: "Raw IPL JSON and match data",
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
    desc: "Cleaned, validated, and transformed PySpark datasets",
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
    desc: "Aggregated player, team, season, and match analytics",
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
          CricFlow processes ball-by-ball matches through three robust, schema-validated layers to deliver highly optimized analytics.
        </p>
      </div>

      {/* ── Pipeline Architecture Flow ── */}
      <div className="relative mt-14">
        {/* Horizontal Line connecting stages on desktop */}
        <div className="absolute top-[28px] left-[5%] right-[5%] h-0.5 bg-ink/8 hidden lg:block z-0" aria-hidden="true" />

        {/* Stages list container */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 relative z-10">
          {PIPELINE_STAGES.map((stage, i) => (
            <div
              key={stage.id}
              className="scroll-reveal flex flex-col"
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
              <h3 className="mt-5 font-display text-lg font-black leading-snug tracking-tight text-ink/85 max-w-[24ch]">
                {stage.desc}
              </h3>

              {/* List details */}
              <ul className="mt-6 flex flex-col gap-3 border-t border-ink/8 pt-5">
                {stage.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${stage.accent}`} aria-hidden="true" />
                    <span className="text-[12px] font-medium leading-relaxed text-ink/60">{detail}</span>
                  </li>
                ))}
              </ul>
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
