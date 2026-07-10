"use client";

import { useEffect, useRef } from "react";
import { Play, FileCode, Layers, Sparkles, Database, AreaChart } from 'lucide-react';


/* ─────────────────────────────────────────────────────────
   TECH ANNOTATION TAGS
───────────────────────────────────────────────────────── */
const TECH = ["PYSPARK", "SQL", "PARQUET", "PYTHON", "ETL"];

function Label({ children, className = "" }) {
  return (
    <span className={`annotation text-ink/50 ${className}`}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   EDITORIAL MEDALLION SVG FLOW
   A clean, scalable, technical graphic explaining the flow
   RAW DATA -> BRONZE -> SILVER -> GOLD -> INSIGHTS.
───────────────────────────────────────────────────────── */
function MedallionSVG() {
  return (
    <svg
      viewBox="0 0 540 430"
      className="w-full h-auto max-w-[540px] lg:max-w-full drop-shadow-sm select-none overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(23, 23, 23, 0.05)" />
        </pattern>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7c948" />
          <stop offset="100%" stopColor="#d4af37" />
        </linearGradient>
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dfe7d9" />
          <stop offset="100%" stopColor="#9ea3aa" />
        </linearGradient>
        <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5a2f" />
          <stop offset="100%" stopColor="#cd7f32" />
        </linearGradient>
      </defs>

      {/* Grid background for technical blueprint style */}
      <rect width="100%" height="100%" fill="url(#grid)" rx="16" opacity="0.8" />

      {/* Technical blueprint dashed circles */}
      <circle cx="250" cy="200" r="145" fill="none" stroke="rgba(23,23,23,0.03)" strokeWidth="1" strokeDasharray="5,5" />
      <circle cx="250" cy="200" r="95" fill="none" stroke="rgba(23,23,23,0.02)" strokeWidth="1" />

      {/* Connection Paths */}
      {/* RAW (250, 55) -> BRONZE (80, 200) */}
      <line x1="226" y1="79" x2="104" y2="176" stroke="rgba(23,23,23,0.12)" strokeWidth="2" strokeDasharray="3,3" />
      <path d="M 112,171 L 104,176 L 109,183" fill="none" stroke="rgba(23,23,23,0.3)" strokeWidth="2" />

      {/* BRONZE (80, 200) -> SILVER (250, 200) */}
      <line x1="115" y1="200" x2="215" y2="200" stroke="rgba(23,23,23,0.15)" strokeWidth="2" />
      <path d="M 210,195 L 215,200 L 210,205" fill="none" stroke="rgba(23,23,23,0.35)" strokeWidth="2" />

      {/* SILVER (250, 200) -> GOLD (420, 200) */}
      <line x1="285" y1="200" x2="385" y2="200" stroke="rgba(23,23,23,0.15)" strokeWidth="2" />
      <path d="M 380,195 L 385,200 L 380,205" fill="none" stroke="rgba(23,23,23,0.35)" strokeWidth="2" />

      {/* GOLD (420, 200) -> INSIGHTS (250, 340) */}
      <line x1="396" y1="224" x2="296" y2="320" stroke="rgba(23,23,23,0.12)" strokeWidth="2" strokeDasharray="3,3" />
      <path d="M 299,311 L 296,320 L 305,317" fill="none" stroke="rgba(23,23,23,0.3)" strokeWidth="2" />

      {/* Animated Flowing Dots */}
      <circle r="4.5" fill="rgba(255,90,47,0.75)">
        <animateMotion dur="3s" repeatCount="indefinite" path="M 226 79 L 104 176" />
      </circle>
      <circle r="5" fill="#3d63ff">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 115 200 L 215 200" />
      </circle>
      <circle r="5" fill="#f7c948">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 285 200 L 385 200" />
      </circle>
      <circle r="4.5" fill="#22b86a">
        <animateMotion dur="3s" repeatCount="indefinite" path="M 396 224 L 296 320" />
      </circle>

      {/* ── STAGE 0: RAW DATA ── */}
      <g transform="translate(250, 55)" className="cursor-help">
        <title>RAW DATA: 1,243 raw match files containing nested ball-by-ball JSON structure</title>
        <circle cx="0" cy="0" r="34" fill="#f7f5ef" stroke="rgba(23,23,23,0.15)" strokeWidth="2" />
        <circle cx="0" cy="0" r="28" fill="rgba(23,23,23,0.04)" />
        <g transform="translate(-10, -15)">
          <FileCode width={20} height={20} className="text-ink/80" strokeWidth={2} />
        </g>
        <text x="0" y="16" textAnchor="middle" fill="#171717" fontSize="9.5" fontWeight="950" letterSpacing="0.05em">RAW DATA</text>
        <text x="0" y="48" textAnchor="middle" fill="rgba(23,23,23,0.5)" fontSize="9.5" fontWeight="900" letterSpacing="0.05em">250K+ MATCH EVENTS</text>
      </g>

      {/* ── STAGE 1: BRONZE ── */}
      <g transform="translate(80, 200)" className="cursor-help">
        <title>BRONZE LAYER: Raw ingestion layer. Appends metadata and preserves immutable raw state as Parquet format.</title>
        <circle cx="0" cy="0" r="35" fill="#f7f5ef" stroke="url(#bronzeGrad)" strokeWidth="3" />
        <circle cx="0" cy="0" r="27" fill="none" stroke="rgba(205,127,50,0.15)" strokeWidth="5" />
        <g transform="translate(-10, -17)">
          <Layers width={20} height={20} className="text-boundary" strokeWidth={2.2} />
        </g>
        <text x="0" y="16" textAnchor="middle" fill="#cd7f32" fontSize="9" fontWeight="950" letterSpacing="0.05em">BRONZE</text>
        <text x="0" y="52" textAnchor="middle" fill="#171717" fontSize="10.5" fontWeight="950" letterSpacing="0.05em">BRONZE LAYER</text>
        <text x="0" y="64" textAnchor="middle" fill="rgba(23,23,23,0.5)" fontSize="9" fontWeight="900">RAW INGESTION</text>
        {/* Technical annotation */}
        <text x="-35" y="-45" fill="rgba(23,23,23,0.4)" fontSize="9" fontWeight="900" letterSpacing="0.1em">SYS: INGEST</text>
        <line x1="-35" y1="-38" x2="-10" y2="-20" stroke="rgba(23,23,23,0.15)" strokeWidth="1" />
      </g>

      {/* ── STAGE 2: SILVER ── */}
      <g transform="translate(250, 200)" className="cursor-help">
        <title>SILVER LAYER: Cleaned, conformed, deduplicated, and schema-enforced records ready for analytic queries.</title>
        <circle cx="0" cy="0" r="35" fill="#f7f5ef" stroke="url(#silverGrad)" strokeWidth="3" />
        <circle cx="0" cy="0" r="27" fill="none" stroke="rgba(158,163,170,0.15)" strokeWidth="5" />
        <g transform="translate(-10, -17)">
          <Sparkles width={20} height={20} className="text-royal" strokeWidth={2.2} />
        </g>
        <text x="0" y="16" textAnchor="middle" fill="#9ea3aa" fontSize="9" fontWeight="950" letterSpacing="0.05em">SILVER</text>
        <text x="0" y="52" textAnchor="middle" fill="#171717" fontSize="10.5" fontWeight="950" letterSpacing="0.05em">SILVER LAYER</text>
        <text x="0" y="64" textAnchor="middle" fill="rgba(23,23,23,0.5)" fontSize="9.5" fontWeight="900">TRANSFORMED</text>
        {/* Spark engine badge */}
        <rect x="-35" y="-55" width="70" height="14" rx="4" fill="rgba(61,99,255,0.08)" stroke="rgba(61,99,255,0.2)" strokeWidth="1" />
        <text x="0" y="-46" textAnchor="middle" fill="#3d63ff" fontSize="8.5" fontWeight="950" letterSpacing="0.1em">PYSPARK ENGINE</text>
      </g>

      {/* ── STAGE 3: GOLD ── */}
      <g transform="translate(420, 200)" className="cursor-help">
        <title>GOLD LAYER: Richly aggregated business-level tables optimized for rapid reporting and FastAPI analytics endpoints.</title>
        <circle cx="0" cy="0" r="35" fill="#f7f5ef" stroke="url(#goldGrad)" strokeWidth="3" />
        <circle cx="0" cy="0" r="27" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="5" />
        <g transform="translate(-10, -17)">
          <Database width={20} height={20} className="text-trophy" strokeWidth={2.2} />
        </g>
        <text x="0" y="16" textAnchor="middle" fill="#d4af37" fontSize="9" fontWeight="950" letterSpacing="0.05em">GOLD</text>
        <text x="0" y="52" textAnchor="middle" fill="#171717" fontSize="10.5" fontWeight="950" letterSpacing="0.05em">GOLD LAYER</text>
        <text x="0" y="64" textAnchor="middle" fill="rgba(23,23,23,0.5)" fontSize="9.5" fontWeight="900">ANALYTICS READY</text>
        {/* Technical annotation */}
        <text x="35" y="-45" fill="rgba(23,23,23,0.4)" fontSize="9" fontWeight="900" letterSpacing="0.1em">DB: PARQUET</text>
        <line x1="35" y1="-38" x2="10" y2="-20" stroke="rgba(23,23,23,0.15)" strokeWidth="1" />
      </g>

      {/* ── STAGE 4: INSIGHTS ── */}
      <g transform="translate(250, 340)" className="cursor-help">
        <title>API & SERVING: FastAPI endpoints consuming optimized Gold parquet data to feed Next.js web application views.</title>
        <rect x="-65" y="-20" width="130" height="40" rx="20" fill="#f7f5ef" stroke="#22b86a" strokeWidth="2.5" />
        <g transform="translate(-48, -10)">
          <AreaChart width={20} height={20} className="text-[#22b86a]" strokeWidth={2.2} />
        </g>
        <text x="14" y="5" textAnchor="middle" fill="#22b86a" fontSize="12" fontWeight="950" letterSpacing="0.1em">INSIGHTS ↗</text>
        <text x="0" y="34" textAnchor="middle" fill="rgba(23,23,23,0.5)" fontSize="8.5" fontWeight="900" letterSpacing="0.05em">KPI DASHBOARD SERVING</text>
      </g>
    </svg>
  );
}

export default function HeroSection() {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function handleMove(e) {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

      stage.querySelectorAll("[data-depth]").forEach((el) => {
        const d = parseFloat(el.dataset.depth) || 0;
        el.style.transform = `translate(${dx * d * 25}px, ${dy * d * 15}px)`;
      });
    }

    function handleLeave() {
      stage.querySelectorAll("[data-depth]").forEach((el) => {
        el.style.transition = "transform 0.8s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 820);
      });
    }

    stage.addEventListener("mousemove", handleMove);
    stage.addEventListener("mouseleave", handleLeave);
    return () => {
      stage.removeEventListener("mousemove", handleMove);
      stage.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <section
      className="relative overflow-visible border-b border-ink/5"
      aria-label="CricWarehouse hero section"
      style={{ minHeight: "88vh", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      {/* ════════════════════════════════════════
          DESKTOP (lg+) — Two-Column Composition
          ════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:items-center lg:gap-8" style={{ minHeight: "82vh" }}>

        {/* ── LEFT COLUMN: Headline & Compositional Flow ── */}
        <div
          className="relative flex flex-col justify-center"
          style={{ width: "46%", paddingTop: "3rem", paddingBottom: "3rem" }}
        >
          {/* Visual line connector from top margin */}
          <div className="absolute top-0 left-0 w-px h-16 bg-ink/10" aria-hidden="true" />

          {/* Super-label */}
          <div className="reveal flex items-center gap-3 pl-4">
            <span className="h-px w-8 bg-ink/25" aria-hidden="true" />
            <Label>IPL DATA PIPELINE · 1,243 MATCHES · 2008–2026</Label>
          </div>

          {/* ── MAIN HEADLINE (Two Lines Max) ── */}
          <h1
            className="reveal reveal-d1 mt-6 font-display font-black tracking-[-0.045em] leading-[0.9]"
            style={{ fontSize: "clamp(3.8rem, 7.2vw, 6.8rem)" }}
          >
            <span className="flex flex-wrap items-center gap-x-4">
              <span>TURNING IPL DATA</span>
              <span
                aria-hidden="true"
                className="shape-grain inline-block shrink-0 rounded-full bg-boundary"
                style={{ width: "clamp(1.8rem,3vw,2.8rem)", height: "clamp(1.8rem,3vw,2.8rem)" }}
              />
            </span>
            <span className="flex flex-wrap items-center gap-x-4 mt-1">
              <span>INTO INSIGHTS.</span>
              <span
                aria-hidden="true"
                className="shape-grain inline-block shrink-0 rotate-45 bg-trophy"
                style={{ width: "clamp(1.6rem,2.8vw,2.6rem)", height: "clamp(1.6rem,2.8vw,2.6rem)" }}
              />
            </span>
          </h1>

          {/* EYE PATH CONNECTOR: Grey/black line next to description */}
          <div className="relative mt-6 pl-4">
            {/* Visual connector lines (Grey instead of orange) */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-ink/20" aria-hidden="true" />
            
            {/* Project description */}
            <p className="reveal reveal-d2 pl-3 text-[1.05rem] lg:text-[1.12rem] font-semibold leading-[1.75] text-ink/75 max-w-[45ch]">
              An end-to-end IPL data engineering pipeline — raw ball-by-ball JSON
              transformed through Bronze, Silver, and Gold layers into analytics-ready insights.
            </p>

            {/* Tech Tags - Moved directly below description */}
            <div className="reveal reveal-d3 mt-6 pl-3 flex items-center gap-3 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider text-ink/35">Built with:</span>
              <div className="flex flex-wrap gap-1.5">
                {TECH.map((t) => (
                  <span
                    key={t}
                    className="border border-ink/10 bg-white/30 px-2 py-0.5 text-[8.5px] font-bold tracking-[0.18em] text-ink/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="reveal reveal-d4 mt-6 pl-3 flex flex-wrap items-center gap-4">
              <a
                href="#architecture"
                className="cta-btn group inline-flex items-center gap-3 bg-ink px-6 py-3.5 text-xs font-black uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-boundary"
              >
                Explore Pipeline
                <Play className="h-4 w-4" />
              </a>
              <a
                href="#players"
                className="inline-flex items-center gap-2 border border-ink/15 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-ink/60 transition hover:border-ink hover:text-ink"
              >
                Player Analytics
              </a>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Redesigned Medallion Pipeline Graphic ── */}
        <div
          ref={stageRef}
          className="relative flex-1 flex items-center justify-center overflow-visible"
          style={{ minHeight: "82vh" }}
          aria-label="IPL data pipeline visualization"
        >
          {/* Labeled geometric backgrounds (color-matched to Bronze/Silver/Gold layers) */}
          <span
            data-depth="0.25"
            aria-hidden="true"
            className="shape-grain absolute rounded-full bg-boundary/8 flex items-center justify-center border border-boundary/15 spin-slow-rev"
            style={{ width: "60%", aspectRatio: "1", top: "8%", right: "-8%" }}
          >
            <span className="text-[10px] font-black tracking-[0.25em] text-boundary/40 uppercase mt-[-45%]">BRONZE</span>
          </span>

          <span
            data-depth="0.1"
            aria-hidden="true"
            className="shape-grain absolute rounded-[2rem] bg-royal/6 flex items-center justify-center border border-royal/15"
            style={{ width: "38%", height: "38%", bottom: "8%", left: "2%" }}
          >
            <span className="text-[10px] font-black tracking-[0.25em] text-royal/40 uppercase -rotate-12">SILVER</span>
          </span>

          <span
            data-depth="0.18"
            aria-hidden="true"
            className="shape-grain absolute bg-trophy/6 flex items-center justify-center border border-trophy/15 rotate-45"
            style={{ width: "24%", aspectRatio: "1", top: "25%", left: "72%" }}
          >
            <span className="text-[10px] font-black tracking-[0.25em] text-trophy/40 uppercase -rotate-45">GOLD</span>
          </span>

          {/* Connection line from left column tags */}
          <div className="absolute left-[-5%] top-[55%] w-[15%] h-px border-t border-dashed border-ink/15 hidden lg:block" aria-hidden="true" />
          <span className="absolute left-[10%] top-[53.5%] h-2.5 w-2.5 rounded-full bg-ink/15 hidden lg:block" aria-hidden="true" />

          {/* SVG Pipeline Diagram (Scaled up slightly to fill space, with overflow allowed) */}
          <div data-depth="0.15" className="relative z-10 w-[125%] -ml-[10%] reveal reveal-d3 px-2 overflow-visible">
            <MedallionSVG />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          TABLET (md → lg)
          Headline full width, pipeline below
          ════════════════════════════════════════ */}
      <div className="hidden pt-10 pb-8 md:block lg:hidden">
        <div className="reveal flex items-center gap-3">
          <span className="h-px w-8 bg-ink/20" aria-hidden="true" />
          <Label>IPL DATA PIPELINE · 1,243 MATCHES · 2008–2026</Label>
        </div>

        <h1
          className="reveal reveal-d1 mt-5 font-display font-black tracking-[-0.045em] leading-[0.9]"
          style={{ fontSize: "clamp(3rem, 7vw, 4.8rem)" }}
        >
          <span className="flex items-center gap-3">
            TURNING IPL DATA
            <span aria-hidden="true" className="shape-grain inline-block shrink-0 rounded-full bg-boundary w-8 h-8" />
          </span>
          <span className="flex items-center gap-3 mt-1">
            INTO INSIGHTS.
            <span aria-hidden="true" className="shape-grain inline-block shrink-0 rotate-45 bg-trophy w-7 h-7" />
          </span>
        </h1>

        <p className="reveal reveal-d2 mt-5 max-w-[50ch] text-[0.88rem] font-medium leading-[1.75] text-ink/55">
          End-to-end IPL data engineering — raw JSON to analytics-ready insights via PySpark and Medallion Architecture.
        </p>

        <div className="reveal reveal-d3 mt-6 flex flex-wrap items-center gap-4">
          <a href="#architecture" className="cta-btn group inline-flex items-center gap-3 bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.13em] text-white transition hover:bg-boundary">
            Explore Pipeline <span className="cta-arrow" aria-hidden="true">→</span>
          </a>
          <div className="flex flex-wrap gap-1.5">
            {TECH.slice(0, 3).map(t => (
              <span key={t} className="border border-ink/10 px-2 py-0.5 text-[8px] font-bold tracking-[0.2em] text-ink/40">{t}</span>
            ))}
          </div>
        </div>

        {/* Pipeline SVG below the text */}
        <div className="reveal reveal-d4 mt-10 flex justify-center border-t border-ink/5 pt-10">
          <div className="w-full max-w-[480px]">
            <MedallionSVG />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE (< md)
          ════════════════════════════════════════ */}
      <div className="pt-8 pb-8 md:hidden">
        <div className="reveal flex items-center gap-2">
          <span className="h-px w-5 bg-ink/20" aria-hidden="true" />
          <Label>IPL DATA PIPELINE · 1,243 MATCHES · 2008–2026</Label>
        </div>

        <h1
          className="reveal reveal-d1 mt-4 font-display font-black tracking-[-0.05em] leading-[0.9]"
          style={{ fontSize: "clamp(2rem, 9vw, 3rem)" }}
        >
          <span className="flex items-center gap-2">
            TURNING IPL DATA
            <span aria-hidden="true" className="shape-grain inline-block shrink-0 rounded-full bg-boundary w-6 h-6" />
          </span>
          <span className="flex items-center gap-2 mt-0.5">
            INTO INSIGHTS.
            <span aria-hidden="true" className="shape-grain inline-block shrink-0 rotate-45 bg-trophy w-5.5 h-5.5" />
          </span>
        </h1>

        <p className="reveal reveal-d2 mt-4 text-xs font-medium leading-[1.7] text-ink/55">
          Raw ball JSON → Bronze → Silver → Gold → Analytics.
        </p>

        <div className="reveal reveal-d3 mt-5 flex items-center gap-3">
          <a href="#architecture" className="cta-btn group inline-flex items-center gap-2.5 bg-ink px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-boundary">
            Explore <span className="cta-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        {/* Compact version of SVG */}
        <div className="reveal reveal-d4 mt-8 border-t border-ink/5 pt-8 flex justify-center">
          <div className="w-full max-w-[360px]">
            <MedallionSVG />
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce z-10 cursor-pointer hidden lg:flex" 
        onClick={() => document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}
      >
        <span className="text-[9px] font-black tracking-[0.25em] text-ink/30 uppercase">Scroll Down</span>
        <svg className="w-4 h-4 text-ink/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
