"use client";

import { useState } from "react";

const seasons = ["All Seasons", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];

export default function SeasonFilter({ onChange }) {
  const [season, setSeason] = useState("All Seasons");

  function handleChange(event) {
    const value = event.target.value;
    setSeason(value);
    onChange?.(value);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50">Filter by season</span>
      <div className="relative">
        <select
          value={season}
          onChange={handleChange}
          className="w-full cursor-pointer appearance-none border border-ink bg-ink px-5 py-3.5 pr-12 text-sm font-black uppercase tracking-wide text-white outline-none transition hover:bg-ink/90 focus:shadow-hard"
        >
          {seasons.map((item) => (
            <option key={item} value={item} className="bg-ink text-white">
              {item}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white" aria-hidden>
          ↓
        </span>
      </div>
    </div>
  );
}
