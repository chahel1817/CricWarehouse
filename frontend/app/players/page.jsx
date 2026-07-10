"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { Search, Trophy, Sparkles, User, ShieldAlert } from "lucide-react";

export default function PlayersPage() {
  const [season, setSeason] = useState("All Seasons");
  const [activeTab, setActiveTab] = useState("batting"); // "batting" or "bowling"
  const [playersList, setPlayersList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_runs");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // When tab changes, reset default sorting column
  useEffect(() => {
    if (activeTab === "batting") {
      setSortBy("total_runs");
    } else {
      setSortBy("total_wickets");
    }
  }, [activeTab]);

  useEffect(() => {
    async function loadPlayersData() {
      setLoading(true);
      try {
        const seasonParam = season === "All Seasons" ? null : parseInt(season);
        let data = [];

        if (activeTab === "batting") {
          data = await api.getBattingLeaderboard({
            season: seasonParam,
            sort_by: sortBy,
            limit: 100
          });
        } else {
          data = await api.getBowlingLeaderboard({
            season: seasonParam,
            sort_by: sortBy,
            limit: 100
          });
        }

        setPlayersList(data || []);
      } catch (err) {
        console.error("Error loading players data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlayersData();
  }, [season, activeTab, sortBy]);

  // Load selected player career details when clicked
  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerProfile(null);
      return;
    }

    async function loadProfile() {
      setProfileLoading(true);
      try {
        const profile = await api.getPlayerProfile(selectedPlayer);
        setPlayerProfile(profile);
      } catch (err) {
        console.error("Error loading player profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [selectedPlayer]);

  // Client side search filtering
  const filteredPlayers = playersList.filter((p) => {
    const name = activeTab === "batting" ? p.batter : p.bowler;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen text-ink bg-paper grain w-full overflow-hidden py-6" role="main">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-14">
        <Navbar />

        {/* Header Block */}
        <header className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-wicket animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.25em] text-ink/40 uppercase">Player Registries</span>
            </div>
            <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] leading-[1.0] md:text-5xl uppercase">
              Player <span className="text-wicket">Analytics.</span>
            </h1>
            <p className="mt-3 text-xs font-semibold leading-relaxed text-ink/50 max-w-md">
              Perform detail-level lookups for batting strike rates, averages, run records and bowling economy metrics.
            </p>
          </div>
          <div className="shrink-0">
            <SeasonFilter onChange={setSeason} />
          </div>
        </header>

        {/* Thin Divider */}
        <div className="h-px w-full bg-ink/10 my-8" />

        {/* Search & Tabs Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10 pb-5">
          {/* Tab buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("batting")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === "batting"
                  ? "bg-ink text-white shadow-md"
                  : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              }`}
            >
              Batting Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("bowling")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === "bowling"
                  ? "bg-ink text-white shadow-md"
                  : "bg-ink/5 text-ink/50 hover:bg-ink/10"
              }`}
            >
              Bowling Leaderboard
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
            <input
              type="text"
              placeholder="Search player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-2.5 rounded-xl border border-ink/15 text-xs font-semibold bg-white/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ink/20 shadow-sm"
            />
          </div>
        </div>

        {/* Columns Grid */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Table container */}
          <section className="lg:col-span-8 overflow-x-auto rounded-xl border border-ink/10 bg-white/40 backdrop-blur-sm shadow-sm">
            {activeTab === "batting" ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase tracking-wider text-ink/75">
                    <th className="p-3.5">Player</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("matches")}>M</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("innings")}>Inn</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("total_runs")}>Runs</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("strike_rate")}>SR</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("batting_avg")}>Avg</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("highest_score")}>HS</th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("hundreds")}>100s/50s</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-ink/5 animate-pulse">
                        <td className="p-4" colSpan={8}>
                          <div className="h-4 bg-ink/5 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <tr
                        key={player.batter}
                        onClick={() => setSelectedPlayer(player.batter)}
                        className={`border-b border-ink/5 hover:bg-ink/5 transition duration-150 cursor-pointer ${
                          selectedPlayer === player.batter ? "bg-wicket/10 hover:bg-wicket/15" : ""
                        }`}
                      >
                        <td className="p-3.5 font-bold text-ink">{player.batter}</td>
                        <td className="p-3.5 text-ink/70">{player.matches}</td>
                        <td className="p-3.5 text-ink/70">{player.innings}</td>
                        <td className="p-3.5 text-ink font-black">{player.total_runs}</td>
                        <td className="p-3.5 text-royal font-bold">{player.strike_rate}</td>
                        <td className="p-3.5 text-ink/80 font-medium">{player.batting_avg || "N/A"}</td>
                        <td className="p-3.5 text-ink/70">{player.highest_score}</td>
                        <td className="p-3.5 text-right font-semibold text-boundary">
                          {player.hundreds}/{player.fifties}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-ink/40 font-bold">
                        No batters matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase tracking-wider text-ink/75">
                    <th className="p-3.5">Player</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("matches")}>M</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("total_balls")}>Balls</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("total_wickets")}>Wickets</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("economy")}>Econ</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("bowling_avg")}>Avg</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("dot_ball_pct")}>Dot %</th>
                    <th className="p-3.5 text-right cursor-pointer hover:text-boundary transition" onClick={() => setSortBy("five_wkt_hauls")}>5w/4w</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-ink/5 animate-pulse">
                        <td className="p-4" colSpan={8}>
                          <div className="h-4 bg-ink/5 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <tr
                        key={player.bowler}
                        onClick={() => setSelectedPlayer(player.bowler)}
                        className={`border-b border-ink/5 hover:bg-ink/5 transition duration-150 cursor-pointer ${
                          selectedPlayer === player.bowler ? "bg-wicket/10 hover:bg-wicket/15" : ""
                        }`}
                      >
                        <td className="p-3.5 font-bold text-ink">{player.bowler}</td>
                        <td className="p-3.5 text-ink/70">{player.matches}</td>
                        <td className="p-3.5 text-ink/70">{player.total_balls}</td>
                        <td className="p-3.5 text-ink font-black">{player.total_wickets}</td>
                        <td className="p-3.5 text-royal font-bold">{player.economy}</td>
                        <td className="p-3.5 text-ink/80 font-medium">{player.bowling_avg || "N/A"}</td>
                        <td className="p-3.5 text-ink/70">{player.dot_ball_pct}%</td>
                        <td className="p-3.5 text-right font-semibold text-boundary">
                          {player.five_wkt_hauls}/{player.four_wkt_hauls}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-ink/40 font-bold">
                        No bowlers matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>

          {/* Player career modal/side panel */}
          <section className="lg:col-span-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h2 className="font-display text-lg font-black tracking-[-0.02em] uppercase flex items-center gap-2">
                <User className="w-5 h-5 text-wicket" />
                Player Profile
              </h2>
              <span className="text-[10px] font-bold text-ink/40 tracking-wider">Historical Career Summary</span>
            </div>

            {selectedPlayer ? (
              <div className="mt-6 p-6 rounded-xl border border-ink/10 bg-white/40 shadow-sm min-h-[400px] flex flex-col justify-between">
                {profileLoading ? (
                  <div className="h-64 flex items-center justify-center animate-pulse bg-ink/5 rounded-xl w-full" />
                ) : playerProfile ? (
                  <div>
                    <h3 className="font-display text-xl font-black text-ink uppercase tracking-tight">
                      {playerProfile.player}
                    </h3>
                    <div className="h-px bg-ink/10 w-full my-4" />

                    {/* Batting Career Summary */}
                    {playerProfile.batting_summary && playerProfile.batting_summary.matches ? (
                      <div className="mb-6">
                        <div className="text-[10px] font-black text-wicket uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Trophy className="w-4 h-4" /> Batting Career
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">Runs</div>
                            <div className="text-sm font-bold text-ink mt-0.5">{playerProfile.batting_summary.total_runs}</div>
                          </div>
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">Avg</div>
                            <div className="text-sm font-bold text-ink mt-0.5">{playerProfile.batting_summary.batting_avg}</div>
                          </div>
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">SR</div>
                            <div className="text-sm font-bold text-royal mt-0.5">{playerProfile.batting_summary.strike_rate}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-ink/50 text-center">
                          Highest Score: <span className="text-boundary font-black">{playerProfile.batting_summary.highest_score}</span> | 100s: <span className="font-black text-ink">{playerProfile.batting_summary.hundreds}</span> | 50s: <span className="font-black text-ink">{playerProfile.batting_summary.fifties}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Bowling Career Summary */}
                    {playerProfile.bowling_summary && playerProfile.bowling_summary.matches ? (
                      <div>
                        <div className="text-[10px] font-black text-royal uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Sparkles className="w-4 h-4" /> Bowling Career
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">Wickets</div>
                            <div className="text-sm font-bold text-ink mt-0.5">{playerProfile.bowling_summary.total_wickets}</div>
                          </div>
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">Econ</div>
                            <div className="text-sm font-bold text-royal mt-0.5">{playerProfile.bowling_summary.economy}</div>
                          </div>
                          <div className="bg-ink/5 p-2 rounded-lg border border-ink/5 text-center">
                            <div className="text-[8px] font-black text-ink/40 uppercase">Dot %</div>
                            <div className="text-sm font-bold text-ink mt-0.5">{playerProfile.bowling_summary.dot_ball_pct}%</div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Impact Award Summaries */}
                    {playerProfile.pom_summary ? (
                      <div className="mt-6 bg-wicket/5 border border-wicket/10 p-3 rounded-lg flex items-center justify-between text-xs">
                        <span className="font-bold text-ink/75">POM Awards:</span>
                        <span className="font-black text-boundary">{playerProfile.pom_summary.total_pom_awards}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center text-ink/40 font-bold">
                    Profile not found.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 p-8 text-center text-ink/40 font-bold border border-dashed border-ink/20 rounded-xl min-h-[400px] flex items-center justify-center">
                Select a player from the leaderboard table to load their full profile.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
