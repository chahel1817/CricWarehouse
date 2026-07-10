"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { Landmark, Compass, Award, ShieldAlert, Percent } from "lucide-react";

export default function VenuesPage() {
  const [season, setSeason] = useState("All Seasons");
  const [venueStats, setVenueStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    async function loadVenuesData() {
      setLoading(true);
      try {
        const seasonParam = season === "All Seasons" ? null : parseInt(season);
        const data = await api.getVenueStats(seasonParam);
        setVenueStats(data || []);
        if (data && data.length > 0) {
          setSelectedVenue(data[0]);
        }
      } catch (err) {
        console.error("Error loading venues data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVenuesData();
  }, [season]);

  return (
    <main className="min-h-screen text-ink bg-paper grain w-full overflow-hidden py-6" role="main">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-14">
        <Navbar />

        {/* Header Block */}
        <header className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-boundary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.25em] text-ink/40 uppercase">Stadium Analytics</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] leading-[1.0] md:text-5xl uppercase">
              Stadium <span className="text-boundary">Insights.</span>
            </h1>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-ink/50 max-w-md">
              Discover stadium pitch tendencies, average scores, boundaries, and win distribution ratios.
            </p>
          </div>
          <div className="shrink-0">
            <SeasonFilter onChange={setSeason} />
          </div>
        </header>

        {/* Thin Divider */}
        <div className="h-px w-full bg-ink/10 my-8" />

        {/* Split Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Venues Table */}
          <section className="lg:col-span-7 overflow-x-auto rounded-xl border border-ink/10 bg-white/40 backdrop-blur-sm shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase tracking-wider text-ink/75">
                  <th className="p-3.5">Venue Stadium</th>
                  <th className="p-3.5">Played</th>
                  <th className="p-3.5">Avg 1st Inn</th>
                  <th className="p-3.5">Avg 2nd Inn</th>
                  <th className="p-3.5 text-right">Highest</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-ink/5 animate-pulse">
                      <td className="p-4" colSpan={5}>
                        <div className="h-4 bg-ink/5 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : venueStats.length > 0 ? (
                  venueStats.map((item) => (
                    <tr
                      key={item.venue}
                      onClick={() => setSelectedVenue(item)}
                      className={`border-b border-ink/5 hover:bg-ink/5 transition duration-150 cursor-pointer ${
                        selectedVenue?.venue === item.venue ? "bg-boundary/10 hover:bg-boundary/15" : ""
                      }`}
                    >
                      <td className="p-3.5 font-bold text-ink">{item.venue}</td>
                      <td className="p-3.5 text-ink/70 font-semibold">{item.matches_played}</td>
                      <td className="p-3.5 text-royal font-bold">{item.avg_1st_inn_score}</td>
                      <td className="p-3.5 text-ink/80">{item.avg_2nd_inn_score}</td>
                      <td className="p-3.5 text-right text-boundary font-black">{item.highest_total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-ink/40 font-bold">
                      No active stadium stats located.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Right Column: Venue Detail Analysis */}
          <section className="lg:col-span-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <Landmark className="w-5 h-5 text-boundary" />
                Pitch Tendencies
              </h2>
              <span className="text-[10px] font-bold text-ink/40 tracking-wider">Historical Records</span>
            </div>

            {selectedVenue ? (
              <div className="mt-6 p-6 rounded-xl border border-ink/10 bg-white/40 shadow-sm min-h-[420px] flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-black text-ink uppercase tracking-tight">
                    {selectedVenue.venue}
                  </h3>
                  <div className="h-px bg-ink/10 w-full my-4" />

                  {/* Win distribution first vs chasing ratio bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase text-ink/50 mb-1.5">
                      <span>Batting 1st ({selectedVenue.bat_first_wins} wins)</span>
                      <span>Chasing ({selectedVenue.chase_wins} wins)</span>
                    </div>
                    {/* Visual bar */}
                    {selectedVenue.bat_first_wins + selectedVenue.chase_wins > 0 ? (
                      <div className="h-3 w-full bg-ink/5 rounded-full overflow-hidden flex border border-ink/10 shadow-inner">
                        <div
                          style={{
                            width: `${(selectedVenue.bat_first_wins / (selectedVenue.bat_first_wins + selectedVenue.chase_wins)) * 100}%`
                          }}
                          className="bg-boundary h-full"
                          title="Batting 1st Wins"
                        />
                        <div
                          style={{
                            width: `${(selectedVenue.chase_wins / (selectedVenue.bat_first_wins + selectedVenue.chase_wins)) * 100}%`
                          }}
                          className="bg-royal h-full"
                          title="Chasing Wins"
                        />
                      </div>
                    ) : (
                      <div className="h-3 w-full bg-ink/10 rounded-full" />
                    )}
                    <div className="mt-1 flex justify-between text-[9px] font-bold text-ink/40">
                      <span>Prefer defending pitch?</span>
                      <span>Prefer chasing pitch?</span>
                    </div>
                  </div>

                  {/* Venue detail statistics */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase">Avg 4s per Inn</div>
                      <div className="text-lg font-display font-black text-ink mt-1">
                        {selectedVenue.avg_fours_per_innings}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase">Avg 6s per Inn</div>
                      <div className="text-lg font-display font-black text-boundary mt-1">
                        {selectedVenue.avg_sixes_per_innings}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase">Highest Score</div>
                      <div className="text-lg font-display font-black text-royal mt-1">
                        {selectedVenue.highest_total}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase">Lowest Score</div>
                      <div className="text-lg font-display font-black text-ink mt-1">
                        {selectedVenue.lowest_total}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-boundary/5 border border-boundary/10 p-4 rounded-xl flex items-center gap-3">
                  <Compass className="w-8 h-8 text-boundary shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-boundary/60 uppercase tracking-wider">Pitch Character</div>
                    <div className="text-[11px] font-bold text-ink/75 mt-0.5 leading-normal">
                      {selectedVenue.avg_1st_inn_score >= 170
                        ? "High scoring boundary haven, heavily favors aggressive top-order batters."
                        : "Balanced or bowler-friendly wicket, requiring patience and smart strike rotation."}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-8 text-center text-ink/40 font-bold border border-dashed border-ink/20 rounded-xl min-h-[420px] flex items-center justify-center">
                Select a stadium venue to view detailed historical pitch tendencies.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
