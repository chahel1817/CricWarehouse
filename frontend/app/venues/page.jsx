"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { Landmark, Compass, Search, Trophy, Coins, Zap } from "lucide-react";

export default function VenuesPage() {
  const [season, setSeason] = useState("All Seasons");
  const [venueStats, setVenueStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueDetails, setVenueDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Load all venues data
  useEffect(() => {
    async function loadVenuesData() {
      setLoading(true);
      try {
        const seasonParam = season === "All Seasons" ? null : parseInt(season);
        const data = await api.getVenueStats({ season: seasonParam });
        setVenueStats(data || []);
        
        // Retain selection if still in the list, otherwise default to first
        if (data && data.length > 0) {
          const stillExists = data.find(v => v.venue === selectedVenue?.venue);
          if (!stillExists) {
            setSelectedVenue(data[0]);
          } else {
            setSelectedVenue(stillExists);
          }
        } else {
          setSelectedVenue(null);
        }
      } catch (err) {
        console.error("Error loading venues data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVenuesData();
  }, [season]);

  // Load selected venue extra details (most wins, toss rate, top batsman, and chart)
  useEffect(() => {
    if (!selectedVenue) {
      setVenueDetails(null);
      return;
    }

    async function loadVenueDetails() {
      setDetailsLoading(true);
      try {
        const details = await api.getVenueDetails({ venue: selectedVenue.venue });
        setVenueDetails(details);
      } catch (err) {
        console.error("Error loading venue details:", err);
      } finally {
        setDetailsLoading(false);
      }
    }

    loadVenueDetails();
  }, [selectedVenue]);

  // Filter venues by search query
  const filteredVenues = venueStats.filter((v) =>
    v.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        {/* Search Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg border border-ink/10 bg-white/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-boundary/30 transition duration-150"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink/30" />
          </div>
          {filteredVenues.length > 0 && (
            <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">
              Showing {filteredVenues.length} stadiums
            </div>
          )}
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Venues Table */}
          <section className="lg:col-span-7 overflow-x-auto rounded-xl border border-ink/10 bg-white/40 backdrop-blur-sm shadow-sm h-fit">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase tracking-wider text-ink/75">
                  <th className="p-4 text-center w-12 cursor-help" title="Rank by matches played">#</th>
                  <th className="p-4 cursor-help" title="Name of the stadium venue">Venue Stadium</th>
                  <th className="p-4 cursor-help" title="Total matches played at this venue">Played</th>
                  <th className="p-4 cursor-help" title="Average score batting first at this venue">Avg 1st Inn</th>
                  <th className="p-4 cursor-help" title="Average score chasing at this venue">Avg 2nd Inn</th>
                  <th className="p-4 cursor-help text-right" title="Percentage of matches won by the team batting first">Win 1st %</th>
                  <th className="p-4 cursor-help text-right text-boundary" title="Highest innings total recorded at this venue">Highest</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-ink/5 animate-pulse">
                      <td className="p-4" colSpan={7}>
                        <div className="h-5 bg-ink/5 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredVenues.length > 0 ? (
                  filteredVenues.map((item, index) => {
                    const winPct = item.bat_first_wins + item.chase_wins > 0 
                      ? Math.round((item.bat_first_wins / (item.bat_first_wins + item.chase_wins)) * 100) 
                      : 0;
                    const isSelected = selectedVenue?.venue === item.venue;

                    return (
                      <tr
                        key={item.venue}
                        onClick={() => setSelectedVenue(item)}
                        className={`border-b border-ink/5 hover:bg-ink/5 transition duration-150 cursor-pointer ${
                          isSelected ? "bg-boundary/10 hover:bg-boundary/15 font-semibold text-boundary" : ""
                        }`}
                      >
                        <td className="p-4 text-center font-bold text-ink/30">#{index + 1}</td>
                        <td className="p-4 font-bold text-ink">{item.venue}</td>
                        <td className="p-4 text-ink/70 font-semibold">{item.matches_played}</td>
                        <td className="p-4 text-royal font-bold">{item.avg_1st_inn_score}</td>
                        <td className="p-4 text-ink/80">{item.avg_2nd_inn_score}</td>
                        <td className="p-4 text-right font-semibold text-ink/70">{winPct}%</td>
                        <td className="p-4 text-right text-boundary font-black">{item.highest_total}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink/40 font-bold">
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
                      <span>BATTING FIRST ({selectedVenue.bat_first_wins} wins)</span>
                      <span>CHASING ({selectedVenue.chase_wins} wins)</span>
                    </div>
                    {/* Visual bar with percentages overlayed */}
                    {selectedVenue.bat_first_wins + selectedVenue.chase_wins > 0 ? (
                      (() => {
                        const total = selectedVenue.bat_first_wins + selectedVenue.chase_wins;
                        const batFirstPct = Math.round((selectedVenue.bat_first_wins / total) * 100);
                        const chasePct = 100 - batFirstPct;

                        return (
                          <div className="h-4 w-full bg-ink/5 rounded-full overflow-hidden flex border border-ink/10 shadow-inner">
                            {batFirstPct > 0 && (
                              <div
                                style={{ width: `${batFirstPct}%` }}
                                className="bg-boundary h-full flex items-center justify-center text-[9px] font-black text-white"
                                title={`Batting First Wins: ${batFirstPct}%`}
                              >
                                {batFirstPct >= 15 && `${batFirstPct}%`}
                              </div>
                            )}
                            {chasePct > 0 && (
                              <div
                                style={{ width: `${chasePct}%` }}
                                className="bg-royal h-full flex items-center justify-center text-[9px] font-black text-white"
                                title={`Chasing Wins: ${chasePct}%`}
                              >
                                {chasePct >= 15 && `${chasePct}%`}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="h-4 w-full bg-ink/10 rounded-full" />
                    )}
                    <div className="mt-1.5 flex justify-between text-[9px] font-bold text-ink/40">
                      <span>Prefer defending pitch?</span>
                      <span>Prefer chasing pitch?</span>
                    </div>
                  </div>

                  {/* Dynamic Premium Metrics */}
                  <div className="space-y-3.5 my-6">
                    {/* Most Wins */}
                    <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-ink/5">
                      <div className="p-1.5 rounded bg-amber-500/10 text-amber-600">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-ink/40 uppercase">Most Wins At Venue</div>
                        <div className="text-xs font-bold text-ink mt-0.5">
                          {detailsLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : venueDetails ? (
                            `${venueDetails.most_wins_team} (${venueDetails.most_wins_count} wins)`
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Toss Winner Match Win Rate */}
                    <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-ink/5">
                      <div className="p-1.5 rounded bg-blue-500/10 text-blue-600">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-ink/40 uppercase">Toss Win Advantage</div>
                        <div className="text-xs font-bold text-ink mt-0.5">
                          {detailsLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : venueDetails ? (
                            `Toss winner wins ${venueDetails.toss_win_pct}% of matches`
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top Scorer */}
                    <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-ink/5">
                      <div className="p-1.5 rounded bg-boundary/10 text-boundary">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-ink/40 uppercase">All-Time Venue Top Scorer</div>
                        <div className="text-xs font-bold text-ink mt-0.5">
                          {detailsLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : venueDetails ? (
                            `${venueDetails.top_batter} — ${venueDetails.top_runs} runs`
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Venue detail boundary statistics */}
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

                {/* Pitch Character Card */}
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

                {/* Visual SVG Chart: Avg Score by Season */}
                {venueDetails?.chart_data?.length > 0 && (
                  <div className="mt-6 bg-ink/5 p-4 rounded-xl border border-ink/5">
                    <div className="text-[10px] font-black text-ink/40 uppercase tracking-wider mb-3">
                      Historical Average Scores by Season
                    </div>
                    <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 px-2 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 border-b border-ink/10">
                        <div className="border-t border-ink/10 w-full" />
                        <div className="border-t border-ink/10 w-full" />
                        <div className="border-t border-ink/10 w-full" />
                      </div>

                      {/* Render Bars for last 6 seasons */}
                      {venueDetails.chart_data.slice(-6).map((d) => {
                        // Max score for scaling height is 220
                        const scale = 80; // max height in px
                        const h1 = Math.min(scale, (d.avg_1st_inn / 220) * scale);
                        const h2 = Math.min(scale, (d.avg_2nd_inn / 220) * scale);

                        return (
                          <div key={d.season} className="flex flex-col items-center flex-1 group relative">
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center bg-ink text-white text-[8px] font-black p-1.5 rounded shadow-lg z-10 w-24 text-center pointer-events-none">
                              <div>Season {d.season}</div>
                              <div className="text-boundary">1st: {d.avg_1st_inn}</div>
                              <div className="text-royal">2nd: {d.avg_2nd_inn}</div>
                              <div className="text-ink/40">Matches: {d.matches}</div>
                            </div>

                            {/* Two bars side-by-side */}
                            <div className="flex items-end gap-0.5 h-20">
                              <div
                                style={{ height: `${h1}px` }}
                                className="w-2.5 bg-boundary rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                                title={`Avg 1st: ${d.avg_1st_inn}`}
                              />
                              <div
                                style={{ height: `${h2}px` }}
                                className="w-2.5 bg-royal rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                                title={`Avg 2nd: ${d.avg_2nd_inn}`}
                              />
                            </div>
                            <span className="text-[8px] font-black text-ink/40 mt-1.5">{d.season}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="mt-2.5 flex justify-center gap-4 text-[8px] font-black uppercase tracking-wider text-ink/50">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-boundary" />
                        Avg 1st Inn
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-royal" />
                        Avg 2nd Inn
                      </div>
                    </div>
                  </div>
                )}
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
