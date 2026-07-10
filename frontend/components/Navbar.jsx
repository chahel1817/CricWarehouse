"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Teams", href: "/teams" },
    { label: "Players", href: "/players" },
    { label: "Venues", href: "/venues" }
  ];

  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between py-5 md:py-6">
        {/* Brand */}
        <Link
          href="/"
          className="font-display text-[1.45rem] font-black tracking-[-0.03em] md:text-[1.65rem]"
        >
          Cric<span className="text-boundary">Warehouse</span>
          <span className="ml-0.5 text-boundary">.</span>
        </Link>

        {/* Nav links — desktop */}
        <nav
          className="hidden items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50 md:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors duration-200 hover:text-boundary hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-boundary ${
                  isActive ? "text-ink underline decoration-2 underline-offset-4 decoration-boundary font-black" : "text-ink/50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          
          <a
            href="https://github.com/chahel1817/CricWarehouse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-ink transition hover:border-ink hover:bg-ink hover:text-white"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
        </nav>

        {/* Mobile Hamburger button */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-transparent transition hover:border-ink/20 hover:bg-ink/5 md:hidden"
        >
          <span className={`block h-0.5 w-5 bg-ink transition-transform duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-ink transition-opacity duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-ink transition-transform duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-paper border border-ink/15 rounded-2xl p-6 shadow-hard flex flex-col gap-4 z-50 md:hidden animate-fade-in">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-[12px] font-bold uppercase tracking-wider py-2 border-b border-ink/5 ${
                  isActive ? "text-boundary font-black" : "text-ink/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/chahel1817/CricWarehouse"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-ink/25 py-3 text-xs font-black uppercase tracking-wider text-white bg-ink transition hover:bg-boundary"
          >
            GitHub
          </a>
        </div>
      )}

      {/* Thin horizontal divider */}
      <div className="h-px w-full bg-ink/12" />
    </header>
  );
}
