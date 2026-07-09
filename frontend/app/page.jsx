import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MedallionSection from "@/components/MedallionSection";
import PlayerShowcase from "@/components/PlayerShowcase";

export default function Home() {
  return (
    <main className="min-h-screen px-3 py-4 text-ink sm:px-5 sm:py-6" role="main">
      <section className="grain mx-auto max-w-7xl rounded-[1.75rem] bg-paper px-5 py-0 shadow-soft sm:px-8 md:px-12 lg:px-14 overflow-hidden">

        {/* ── Navbar ── */}
        <div className="py-0">
          <Navbar />
        </div>

        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Medallion Architecture (replaces old stat cards) ── */}
        <MedallionSection />

        {/* ── Player Showcase (replaces old player card grid) ── */}
        <PlayerShowcase />

        {/* ── Footer ── */}
        <footer className="border-t border-ink/10 py-8 mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-black tracking-[-0.03em]">
                Cric<span className="text-boundary">Warehouse</span><span className="text-boundary">.</span>
              </p>
              <p className="mt-1 text-[11px] font-medium text-ink/30">
                IPL Data Engineering · Medallion Architecture · PySpark
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {["Pipeline","Analytics","Architecture","GitHub"].map(link => (
                <a
                  key={link}
                  href={link === "GitHub" ? "https://github.com" : `#${link.toLowerCase()}`}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/35 transition hover:text-ink"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
