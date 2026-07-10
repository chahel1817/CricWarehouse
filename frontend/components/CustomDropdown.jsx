"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomDropdown({
  value,
  onChange,
  options,
  icon: Icon,
  className = "",
  placeholder = "Select option..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || {
    value,
    label: value
  };

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-full flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/55 hover:bg-white/80 pl-11 pr-5 text-sm font-bold text-ink/75 shadow-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-ink/20"
      >
        {/* Left Icon (absolutely positioned or aligned to match search inputs) */}
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
        )}
        <span className="truncate text-left">{selectedOption.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-ink/35 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-ink/10 bg-white/95 backdrop-blur-md py-2 shadow-xl z-50 animate-fade-up duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors duration-150 ${
                  isSelected
                    ? "bg-ink text-white"
                    : "text-ink/65 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
