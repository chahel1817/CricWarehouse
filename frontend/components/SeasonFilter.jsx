"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const seasons = [
  "All Seasons",
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020"
];

export default function SeasonFilter({ onChange }) {
  const [season, setSeason] = useState("All Seasons");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(value) {
    setSeason(value);
    setIsOpen(false);
    onChange?.(value);
  }

  return (
    <div className="flex w-full sm:w-48 flex-col gap-2 relative" ref={containerRef}>
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/40">Filter by season</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between border border-ink bg-ink px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white outline-none transition hover:bg-ink/90 active:scale-[0.98] shadow-sm rounded-xl"
        >
          <span>{season}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 left-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-ink/10 bg-white/95 backdrop-blur-md py-1.5 shadow-lg z-50 scrollbar-none">
            {seasons.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-5 py-2.5 text-xs font-bold transition-colors ${
                  season === item
                    ? "bg-ink text-white"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
