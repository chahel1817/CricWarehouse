"use client";

import { useState, useEffect } from "react";

export default function PipelineMonitor() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jobs");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeTab, refreshKey]);

  return (
    <section id="pipeline" className="relative border-t border-ink/10 pt-16 pb-4 overflow-hidden">
      {/* Background accents */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-16 h-80 w-80 rounded-full bg-royal/5 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-16 h-80 w-80 rounded-full bg-boundary/5 blur-3xl" />

      <div className="scroll-reveal">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-ink/25" aria-hidden="true" />
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(23,23,23,0.4)" }}>
            Live Data Engine
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mt-4">
          <h2
            className="font-display font-black tracking-[-0.04em] leading-[0.9]"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
          >
            PIPELINE METRICS
            <br />
            <span className="text-royal">AND LIVE DATABASE.</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="inline-flex items-center gap-2 border border-ink/15 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-ink/60 transition duration-300 hover:border-ink hover:text-ink hover:scale-102 bg-white/50 hover:bg-white rounded-lg shadow-sm"
              aria-label="Refresh database preview"
            >
              <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
              </svg>
              Trigger Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-ink/10 gap-6">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`pb-3 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 relative ${activeTab === "jobs" ? "text-ink" : "text-ink/40 hover:text-ink/75"}`}
        >
          PySpark Jobs
          {activeTab === "jobs" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-royal rounded-full animate-fade-in" />}
        </button>
        <button
          onClick={() => setActiveTab("gold")}
          className={`pb-3 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 relative ${activeTab === "gold" ? "text-ink" : "text-ink/40 hover:text-ink/75"}`}
        >
          Gold Table Preview
          {activeTab === "gold" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-trophy rounded-full animate-fade-in" />}
        </button>
      </div>

      {/* Content Area with Loading Skeleton */}
      <div className="mt-8 min-h-[220px]">
        {loading ? (
          <SkeletonLoader type={activeTab} />
        ) : (
          <div className="transition-all duration-500 ease-out animate-fade-in">
            {activeTab === "jobs" ? <JobsPanel /> : <GoldTablePanel />}
          </div>
        )}
      </div>
    </section>
  );
}

function SkeletonLoader({ type }) {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      {type === "jobs" ? (
        <>
          <div className="flex items-center justify-between p-4 bg-ink/5 rounded-xl border border-ink/5">
            <div className="flex items-center gap-4 w-2/3">
              <div className="w-8 h-8 rounded-full bg-ink/10" />
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-3.5 bg-ink/10 rounded w-3/4" />
                <div className="h-2.5 bg-ink/10 rounded w-1/2" />
              </div>
            </div>
            <div className="w-20 h-6 bg-ink/10 rounded-full" />
          </div>
          <div className="flex items-center justify-between p-4 bg-ink/5 rounded-xl border border-ink/5">
            <div className="flex items-center gap-4 w-2/3">
              <div className="w-8 h-8 rounded-full bg-ink/10" />
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-3.5 bg-ink/10 rounded w-2/3" />
                <div className="h-2.5 bg-ink/10 rounded w-1/3" />
              </div>
            </div>
            <div className="w-20 h-6 bg-ink/10 rounded-full" />
          </div>
          <div className="flex items-center justify-between p-4 bg-ink/5 rounded-xl border border-ink/5">
            <div className="flex items-center gap-4 w-2/3">
              <div className="w-8 h-8 rounded-full bg-ink/10" />
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-3.5 bg-ink/10 rounded w-4/5" />
                <div className="h-2.5 bg-ink/10 rounded w-2/3" />
              </div>
            </div>
            <div className="w-20 h-6 bg-ink/10 rounded-full" />
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/5 bg-ink/5 p-4">
          <div className="flex gap-4 mb-4 border-b border-ink/10 pb-3">
            <div className="h-4 bg-ink/10 rounded w-1/4" />
            <div className="h-4 bg-ink/10 rounded w-1/4" />
            <div className="h-4 bg-ink/10 rounded w-1/4" />
            <div className="h-4 bg-ink/10 rounded w-1/4" />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 bg-ink/10 rounded w-1/4" />
                <div className="h-3 bg-ink/10 rounded w-1/4" />
                <div className="h-3 bg-ink/10 rounded w-1/4" />
                <div className="h-3 bg-ink/10 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobsPanel() {
  const jobs = [
    { id: "Job 204", task: "Partition deliveries by season key", duration: "1.24s", status: "Completed" },
    { id: "Job 203", task: "Aggregate player batting stats (strike_rate, runs)", duration: "4.82s", status: "Completed" },
    { id: "Job 202", task: "Clean matches & resolve team names", duration: "2.11s", status: "Completed" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => (
        <div key={job.id} className="flex items-center justify-between p-4 bg-white/40 hover:bg-white/70 transition-all duration-300 rounded-xl border border-ink/5 shadow-sm hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-royal/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-royal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[12px] font-black text-ink/90">{job.task}</p>
              <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "rgba(23,23,23,0.4)" }}>
                {job.id} · Execution time: {job.duration}
              </p>
            </div>
          </div>
          <span className="bg-[#22b86a]/10 text-[#22b86a] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#22b86a]/20">
            {job.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function GoldTablePanel() {
  const stats = [
    { rank: 1, batter: "Virat Kohli", team: "RCB", runs: 8004, sr: 131.2, avg: 37.2 },
    { rank: 2, batter: "Shikhar Dhawan", team: "PBKS", runs: 6769, sr: 127.1, avg: 35.3 },
    { rank: 3, batter: "Rohit Sharma", team: "MI", runs: 6628, sr: 131.3, avg: 29.5 },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-ink/5 bg-white/40 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-ink/8">
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Rank</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Player</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Team</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Runs</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Strike Rate</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-ink/40">Average</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row) => (
            <tr key={row.rank} className="border-b border-ink/5 last:border-0 hover:bg-white/60 transition-colors duration-200">
              <td className="p-4 text-xs font-black text-ink/80">#0{row.rank}</td>
              <td className="p-4 text-xs font-black text-ink">{row.batter}</td>
              <td className="p-4 text-xs font-medium text-ink/60">{row.team}</td>
              <td className="p-4 text-xs font-black text-boundary">{row.runs.toLocaleString()}</td>
              <td className="p-4 text-xs font-semibold text-ink/70">{row.sr}</td>
              <td className="p-4 text-xs font-semibold text-ink/70">{row.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
