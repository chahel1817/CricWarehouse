export default function Navbar() {
  return (
    <header className="relative">
      <div className="flex items-center justify-between py-5 md:py-6">
        {/* Brand */}
        <a
          href="/"
          className="font-display text-[1.45rem] font-black tracking-[-0.03em] md:text-[1.65rem]"
        >
          Cric<span className="text-boundary">Warehouse</span>
          <span className="ml-0.5 text-boundary">.</span>
        </a>

        {/* Nav links — desktop */}
        <nav
          className="hidden items-center gap-12 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50 md:flex"
          aria-label="Primary navigation"
        >
          <a href="#pipeline" className="transition-colors duration-200 hover:text-boundary hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-boundary">Pipeline</a>
          <a href="#stats"    className="transition-colors duration-200 hover:text-boundary hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-boundary">Analytics</a>
          <a href="#seasons"  className="transition-colors duration-200 hover:text-boundary hover:underline hover:decoration-2 hover:underline-offset-4 hover:decoration-boundary">Architecture</a>
          <a
            href="https://github.com"
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

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-transparent transition hover:border-ink/20 hover:bg-ink/5 md:hidden"
        >
          <span className="block h-0.5 w-5 bg-ink" />
          <span className="block h-0.5 w-5 bg-ink" />
        </button>
      </div>

      {/* Thin horizontal divider */}
      <div className="h-px w-full bg-ink/12" />
    </header>
  );
}
