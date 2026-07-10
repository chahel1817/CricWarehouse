"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { Award, BarChart3, Users, Percent } from "lucide-react";

export default function TeamsPage() {
  const [season, setSeason] = useState("All Seasons");
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("wins"); // "wins" or "win_pct"
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    async function loadTeamsData() {
      setLoading(true);
      try {
        const teams = await api.getTeams();
        if (!teams) return;

        // Fetch histories in parallel
        const histories = await Promise.all(
          teams.map(async (team) => {
            const history = await api.getTeamHistory(team);
            return { team, history };
          })
        );

        // Process based on selected season
        const processed = histories.map(({ team, history }) => {
          if (season === "All Seasons") {
            const totalPlayed = history.reduce((acc, curr) => acc + (curr.matches_played || 0), 0);
            const totalWins = history.reduce((acc, curr) => acc + (curr.wins || 0), 0);
            const totalLosses = history.reduce((acc, curr) => acc + (curr.losses || 0), 0);
            const totalTitles = history.reduce((acc, curr) => acc + (curr.titles_won || 0), 0);
            const winPct = totalPlayed > 0 ? parseFloat(((totalWins / totalPlayed) * 100).toFixed(1)) : 0;
            return {
              team,
              matches_played: totalPlayed,
              wins: totalWins,
              losses: totalLosses,
              titles: totalTitles,
              win_pct: winPct
            };
          } else {
            const seasonInt = parseInt(season);
            const seasonStats = history.find((h) => h.season === seasonInt) || {
              matches_played: 0,
              wins: 0,
              losses: 0,
              titles_won: 0
            };
            const played = seasonStats.matches_played || 0;
            const wins = seasonStats.wins || 0;
            const winPct = played > 0 ? parseFloat(((wins / played) * 100).toFixed(1)) : 0;
            return {
              team,
              matches_played: played,
              wins,
              losses: seasonStats.losses || 0,
              titles: seasonStats.titles_won || 0,
              win_pct: winPct
            };
          }
        });

        // Filter out teams that didn't play in this specific season
        const activeTeams = processed.filter(t => t.matches_played > 0);
        
        // Sort by wins desc
        activeTeams.sort((a, b) => b.wins - a.wins);

        setTeamData(activeTeams);
        if (activeTeams.length > 0) {
          setSelectedTeam(activeTeams[0]);
        }
      } catch (err) {
        console.error("Error loading teams data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamsData();
  }, [season]);

  // SVG Bar Chart Dimensions
  const chartHeight = 260;
  const padding = 40;
  
  const maxValue = teamData.length > 0
    ? Math.max(...teamData.map(t => metric === "wins" ? t.wins : t.win_pct), 10)
    : 100;

  return (
    <main className="min-h-screen text-ink bg-paper grain w-full overflow-hidden py-6" role="main">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-14">
        <Navbar />

        {/* Header Block */}
        <header className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-royal animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.25em] text-ink/40 uppercase">Teams & Franchises</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] leading-[1.0] md:text-5xl uppercase">
              Franchise <span className="text-royal">Leaderboard.</span>
            </h1>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-ink/50 max-w-md">
              Visualise wins, losses, win rates and championships across all active franchises.
            </p>
          </div>
          <div className="shrink-0">
            <SeasonFilter onChange={setSeason} />
          </div>
        </header>

        {/* Thin Divider */}
        <div className="h-px w-full bg-ink/10 my-8" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Bar Chart Visualization */}
          <section className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-royal" />
                Performance Comparison
              </h2>
              {/* Metric Toggle */}
              <div className="flex gap-1.5 bg-ink/5 p-1 rounded-lg">
                <button
                  onClick={() => setMetric("wins")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition ${
                    metric === "wins" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  Wins
                </button>
                <button
                  onClick={() => setMetric("win_pct")}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition ${
                    metric === "win_pct" ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  Win %
                </button>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="mt-6 flex-1 min-h-[320px] rounded-xl border border-ink/10 bg-white/40 backdrop-blur-sm p-6 shadow-sm flex flex-col justify-center">
              {loading ? (
                <div className="h-64 flex items-center justify-center animate-pulse bg-ink/5 rounded-lg w-full" />
              ) : teamData.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 600 ${chartHeight}`}
                    className="w-full min-w-[500px] overflow-visible"
                  >
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = padding + (chartHeight - padding * 2) * (1 - ratio);
                      const gridVal = Math.round(maxValue * ratio);
                      return (
                        <g key={ratio} className="opacity-30">
                          <line
                            x1={padding * 1.5}
                            y1={y}
                            x2={600 - padding}
                            y2={y}
                            stroke="rgba(23,23,23,0.12)"
                            strokeWidth={1}
                            strokeDasharray="3,3"
                          />
                          <text
                            x={padding}
                            y={y + 3}
                            className="fill-ink/50 text-[9px] font-black text-right"
                            textAnchor="end"
                          >
                            {gridVal}
                            {metric === "win_pct" ? "%" : ""}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars */}
                    {teamData.map((data, index) => {
                      const val = metric === "wins" ? data.wins : data.win_pct;
                      const numBars = teamData.length;
                      const chartWidth = 600 - padding * 2.5;
                      const barSpacing = chartWidth / numBars;
                      const barWidth = Math.max(12, barSpacing * 0.45);
                      
                      const x = padding * 1.8 + index * barSpacing;
                      const valHeight = (val / maxValue) * (chartHeight - padding * 2);
                      const y = chartHeight - padding - valHeight;
                      
                      const isHovered = selectedTeam?.team === data.team;

                      return (
                        <g
                          key={data.team}
                          className="cursor-pointer group"
                          onClick={() => setSelectedTeam(data)}
                        >
                          {/* Invisible hover helper */}
                          <rect
                            x={x - barSpacing * 0.2}
                            y={padding}
                            width={barWidth + barSpacing * 0.4}
                            height={chartHeight - padding * 2}
                            fill="transparent"
                          />

                          {/* Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={valHeight}
                            rx={4}
                            className={`transition-all duration-300 ${
                              isHovered
                                ? "fill-royal drop-shadow-md"
                                : "fill-ink/20 group-hover:fill-royal/50"
                            }`}
                          />

                          {/* Interactive Value Tooltip inside bar */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            textAnchor="middle"
                            className={`text-[9px] font-black transition-all duration-300 ${
                              isHovered ? "fill-royal opacity-100 scale-110" : "fill-ink/40 opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {val}
                            {metric === "win_pct" ? "%" : ""}
                          </text>

                          {/* X-Axis labels (Abbreviation/Icon placeholder) */}
                          <text
                            x={x + barWidth / 2}
                            y={chartHeight - padding + 15}
                            textAnchor="middle"
                            className={`text-[8.5px] font-black transition ${
                              isHovered ? "fill-ink font-bold" : "fill-ink/40"
                            }`}
                            transform={`rotate(-22 ${x + barWidth / 2} ${chartHeight - padding + 15})`}
                          >
                            {data.team.split(" ").map(w => w[0]).join("")}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bottom axis line */}
                    <line
                      x1={padding * 1.5}
                      y1={chartHeight - padding}
                      x2={600 - padding}
                      y2={chartHeight - padding}
                      stroke="rgba(23,23,23,0.3)"
                      strokeWidth={1.5}
                    />
                  </svg>
                </div>
              ) : (
                <div className="p-8 text-center text-ink/40 font-bold">No active teams found.</div>
              )}
            </div>
          </section>

          {/* Right Column: Team Stats Details */}
          <section className="lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <Users className="w-5 h-5 text-boundary" />
                Franchise Info
              </h2>
              <span className="text-[10px] font-bold text-ink/40 tracking-wider">Select a bar to view</span>
            </div>

            {selectedTeam ? (
              <div className="mt-6 p-6 rounded-xl border border-ink/10 bg-white/40 shadow-sm flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-black text-ink tracking-tight uppercase">
                    {selectedTeam.team}
                  </h3>
                  <div className="h-px bg-ink/10 w-full my-4" />
                  
                  {/* Detailed metrics grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider">Games Played</div>
                      <div className="text-xl font-display font-black text-ink mt-1">
                        {selectedTeam.matches_played}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider">Total Wins</div>
                      <div className="text-xl font-display font-black text-boundary mt-1">
                        {selectedTeam.wins}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider">Total Losses</div>
                      <div className="text-xl font-display font-black text-ink/80 mt-1">
                        {selectedTeam.losses}
                      </div>
                    </div>
                    <div className="bg-ink/5 p-3 rounded-lg border border-ink/5">
                      <div className="text-[9px] font-black text-ink/40 uppercase tracking-wider">Win Rate</div>
                      <div className="text-xl font-display font-black text-royal mt-1 flex items-center gap-0.5">
                        {selectedTeam.win_pct}
                        <Percent className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-royal/5 border border-royal/10 p-4 rounded-xl flex items-center gap-3">
                  <Award className="w-8 h-8 text-royal shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-royal/60 uppercase tracking-wider">Championship Titles</div>
                    <div className="font-display text-lg font-black text-royal mt-0.5">
                      {selectedTeam.titles} {selectedTeam.titles === 1 ? "Title" : "Titles"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-8 text-center text-ink/40 font-bold border border-dashed border-ink/20 rounded-xl flex-1 flex items-center justify-center">
                Select a bar to view franchise details.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
