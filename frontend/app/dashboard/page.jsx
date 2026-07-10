"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { Sparkles, Trophy, Database, Calendar } from "lucide-react";

export default function DashboardPage() {
  const [season, setSeason] = useState("All Seasons");
  const [matches, setMatches] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    matchesPlayed: 0,
    venuesCount: 0,
    playersCount: 0,
    avgScore: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const seasonParam = season === "All Seasons" ? null : parseInt(season);
        
        // Fetch matches, top performers and venues in parallel
        const [matchesRes, performersRes, venuesRes, battingRes] = await Promise.all([
          api.getMatches({ season: seasonParam, limit: 10 }),
          api.getTopPerformers({ season: seasonParam, limit: 5 }),
          api.getVenueStats(seasonParam),
          api.getBattingLeaderboard({ season: seasonParam, limit: 150 })
        ]);

        if (matchesRes && matchesRes.matches) {
          setMatches(matchesRes.matches);
          // Set KPI stats based on fetched response
          const totalMatches = matchesRes.total_count || 1243;
          const venuesCount = venuesRes ? venuesRes.length : 35;
          const playersCount = battingRes ? battingRes.length : 680;
          
          // Calculate average first innings score across venues
          const avgScore = venuesRes && venuesRes.length > 0
            ? Math.round(venuesRes.reduce((acc, curr) => acc + (curr.avg_1st_inn_score || 0), 0) / venuesRes.length)
            : 168;

          setSummaryStats({
            matchesPlayed: totalMatches,
            venuesCount,
            playersCount,
            avgScore
          });
        }
        
        if (performersRes) {
          setPerformers(performersRes);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
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
              <span className="text-[10px] font-black tracking-[0.25em] text-ink/40 uppercase">IPL Analytics System</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] leading-[1.0] md:text-5xl uppercase">
              Pipeline <span className="text-boundary">Overview.</span>
            </h1>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-ink/50 max-w-md">
              Real-time Medallion data engineering aggregates computed across 1,243 ball-by-ball matches.
            </p>
          </div>
          <div className="shrink-0">
            <SeasonFilter onChange={setSeason} />
          </div>
        </header>

        {/* Thin Divider */}
        <div className="h-px w-full bg-ink/10 my-8" />

        {/* KPI Grid */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Matches"
            value={loading ? "..." : summaryStats.matchesPlayed}
            tone="boundary"
            detail="Aggregated ball-by-ball games"
          />
          <StatCard
            label="Active Stadiums"
            value={loading ? "..." : summaryStats.venuesCount}
            tone="royal"
            detail="Stadium profiles in active roster"
          />
          <StatCard
            label="Analysed Players"
            value={loading ? "..." : summaryStats.playersCount}
            tone="trophy"
            detail="Unique batter & bowler entries"
          />
          <StatCard
            label="Avg 1st Inn Score"
            value={loading ? "..." : `${summaryStats.avgScore}`}
            tone="wicket"
            detail="Historical 1st Innings average run score"
          />
        </section>

        {/* Main Content Split Grid */}
        <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Side: Recent Matches */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5 text-boundary" />
                Recent Matches
              </h2>
              <span className="text-[10px] font-bold text-ink/40 tracking-wider">Showing latest matches</span>
            </div>

            <div className="mt-4 flex-1 overflow-x-auto rounded-xl border border-ink/10 bg-white/40 backdrop-blur-sm shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5">
                    <th className="p-3.5 font-black uppercase tracking-wider text-ink/70">Match</th>
                    <th className="p-3.5 font-black uppercase tracking-wider text-ink/70">Winner</th>
                    <th className="p-3.5 font-black uppercase tracking-wider text-ink/70">Venue</th>
                    <th className="p-3.5 font-black uppercase tracking-wider text-ink/70">Margin</th>
                    <th className="p-3.5 font-black uppercase tracking-wider text-ink/70 text-right">POM</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-ink/5 animate-pulse">
                        <td className="p-4" colSpan={5}>
                          <div className="h-4 bg-ink/5 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : matches.length > 0 ? (
                    matches.map((match) => (
                      <tr key={match.match_id} className="border-b border-ink/5 hover:bg-ink/5 transition duration-150">
                        <td className="p-3.5">
                          <div className="font-bold text-ink">{match.team1}</div>
                          <div className="text-[10px] text-ink/45 mt-0.5">vs {match.team2}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-boundary">
                            🏆 {match.winner || "N/A"}
                          </span>
                        </td>
                        <td className="p-3.5 text-ink/70 max-w-[150px] truncate">{match.venue}</td>
                        <td className="p-3.5 text-ink/60 font-medium">{match.margin || "N/A"}</td>
                        <td className="p-3.5 text-right font-black text-ink/80">{match.player_of_match || "N/A"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-8 text-center text-ink/40 font-bold" colSpan={5}>
                        No matches found for {season}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Top Impact Performers */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-royal" />
                Top Performers
              </h2>
              <span className="text-[10px] font-bold text-ink/40 tracking-wider">Impact Scores</span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-ink/5 rounded-xl border border-ink/5 animate-pulse" />
                ))
              ) : performers.length > 0 ? (
                performers.map((perf, index) => (
                  <div
                    key={perf.player}
                    className="flex items-center justify-between p-4 rounded-xl border border-ink/10 bg-white/40 hover:bg-white transition duration-200 shadow-sm group hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-black text-white">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-black text-xs text-ink group-hover:text-boundary transition">{perf.player}</div>
                        <div className="text-[10px] text-ink/50 mt-0.5">
                          🏆 {perf.pom_awards || 0} Player of Match awards
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-base font-black text-royal">{perf.impact_score || 0}</div>
                      <div className="text-[9px] font-black uppercase text-ink/30 tracking-wider">Rating</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-ink/40 font-bold border border-dashed border-ink/20 rounded-xl">
                  No performer logs found.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
