"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import { api } from "@/app/api-client";
import { 
  Search, 
  Trophy, 
  Sparkles, 
  User, 
  ShieldAlert, 
  ArrowUpDown, 
  ChevronDown,
  Flame,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Award
} from "lucide-react";

export default function PlayersPage() {
  const [season, setSeason] = useState("All Seasons");
  const [activeTab, setActiveTab] = useState("batting"); // "batting" or "bowling"
  const [playersList, setPlayersList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState("total_runs_desc");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // When tab changes, reset sorting criteria & clear profile selection
  useEffect(() => {
    setSelectedPlayer(null);
    setPlayerProfile(null);
    if (activeTab === "batting") {
      setSortCriteria("total_runs_desc");
    } else {
      setSortCriteria("total_wickets_desc");
    }
  }, [activeTab]);

  useEffect(() => {
    async function loadPlayersData() {
      setLoading(true);
      try {
        const seasonParam = season === "All Seasons" ? null : parseInt(season);
        let data = [];

        // Parse sortCriteria to match backend query structure
        let apiSortBy = activeTab === "batting" ? "total_runs" : "total_wickets";
        let apiAscending = false;

        if (activeTab === "batting") {
          if (sortCriteria === "total_runs_desc") { apiSortBy = "total_runs"; apiAscending = false; }
          else if (sortCriteria === "total_runs_asc") { apiSortBy = "total_runs"; apiAscending = true; }
          else if (sortCriteria === "batting_avg_desc") { apiSortBy = "batting_avg"; apiAscending = false; }
          else if (sortCriteria === "batting_avg_asc") { apiSortBy = "batting_avg"; apiAscending = true; }
          else if (sortCriteria === "strike_rate_desc") { apiSortBy = "strike_rate"; apiAscending = false; }
          else if (sortCriteria === "strike_rate_asc") { apiSortBy = "strike_rate"; apiAscending = true; }
          else if (sortCriteria === "highest_score_desc") { apiSortBy = "highest_score"; apiAscending = false; }
          else if (sortCriteria === "highest_score_asc") { apiSortBy = "highest_score"; apiAscending = true; }
          else if (sortCriteria === "matches_desc") { apiSortBy = "matches"; apiAscending = false; }
          else if (sortCriteria === "matches_asc") { apiSortBy = "matches"; apiAscending = true; }
          else if (sortCriteria === "innings_desc") { apiSortBy = "innings"; apiAscending = false; }
          else if (sortCriteria === "innings_asc") { apiSortBy = "innings"; apiAscending = true; }
        } else {
          if (sortCriteria === "total_wickets_desc") { apiSortBy = "total_wickets"; apiAscending = false; }
          else if (sortCriteria === "total_wickets_asc") { apiSortBy = "total_wickets"; apiAscending = true; }
          else if (sortCriteria === "economy_asc") { apiSortBy = "economy"; apiAscending = true; }
          else if (sortCriteria === "economy_desc") { apiSortBy = "economy"; apiAscending = false; }
          else if (sortCriteria === "bowling_avg_asc") { apiSortBy = "bowling_avg"; apiAscending = true; }
          else if (sortCriteria === "bowling_avg_desc") { apiSortBy = "bowling_avg"; apiAscending = false; }
          else if (sortCriteria === "five_wkt_hauls_desc") { apiSortBy = "five_wkt_hauls"; apiAscending = false; }
          else if (sortCriteria === "five_wkt_hauls_asc") { apiSortBy = "five_wkt_hauls"; apiAscending = true; }
          else if (sortCriteria === "dot_ball_pct_desc") { apiSortBy = "dot_ball_pct"; apiAscending = false; }
          else if (sortCriteria === "dot_ball_pct_asc") { apiSortBy = "dot_ball_pct"; apiAscending = true; }
          else if (sortCriteria === "matches_desc") { apiSortBy = "matches"; apiAscending = false; }
          else if (sortCriteria === "matches_asc") { apiSortBy = "matches"; apiAscending = true; }
          else if (sortCriteria === "total_balls_desc") { apiSortBy = "total_balls"; apiAscending = false; }
          else if (sortCriteria === "total_balls_asc") { apiSortBy = "total_balls"; apiAscending = true; }
        }

        if (activeTab === "batting") {
          data = await api.getBattingLeaderboard({
            season: seasonParam,
            sort_by: apiSortBy,
            ascending: apiAscending,
            limit: 100
          });
        } else {
          data = await api.getBowlingLeaderboard({
            season: seasonParam,
            sort_by: apiSortBy,
            ascending: apiAscending,
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
  }, [season, activeTab, sortCriteria]);

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

        {/* Search, Tabs & Custom sorting dropdown Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-ink/10 pb-5">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <input
                type="text"
                placeholder="Search player name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-2.5 rounded-xl border border-ink/15 text-xs font-semibold bg-white/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ink/20 shadow-sm"
              />
            </div>

            {/* Premium Sort dropdown */}
            <div className="relative w-full sm:w-56">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <select
                value={sortCriteria}
                onChange={(e) => setSortCriteria(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-ink/15 text-xs font-semibold bg-white/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-ink/20 shadow-sm appearance-none cursor-pointer text-ink/75"
              >
                {activeTab === "batting" ? (
                  <>
                    <option value="total_runs_desc">Runs: Highest first</option>
                    <option value="total_runs_asc">Runs: Lowest first</option>
                    <option value="batting_avg_desc">Average: Highest first</option>
                    <option value="batting_avg_asc">Average: Lowest first</option>
                    <option value="strike_rate_desc">Strike Rate: Highest first</option>
                    <option value="strike_rate_asc">Strike Rate: Lowest first</option>
                    <option value="highest_score_desc">Highest Score first</option>
                  </>
                ) : (
                  <>
                    <option value="total_wickets_desc">Wickets: Most first</option>
                    <option value="total_wickets_asc">Wickets: Least first</option>
                    <option value="economy_asc">Economy: Best first</option>
                    <option value="economy_desc">Economy: Worst first</option>
                    <option value="bowling_avg_asc">Bowling Avg: Best first</option>
                    <option value="five_wkt_hauls_desc">5-Wicket Hauls first</option>
                    <option value="dot_ball_pct_desc">Dot Ball %: Most first</option>
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35 pointer-events-none" />
            </div>
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
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "matches_desc" ? "matches_asc" : "matches_desc")}>M</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "innings_desc" ? "innings_asc" : "innings_desc")}>Inn</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_runs_desc" ? "total_runs_asc" : "total_runs_desc")}>Runs</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "strike_rate_desc" ? "strike_rate_asc" : "strike_rate_desc")}>SR</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "batting_avg_desc" ? "batting_avg_asc" : "batting_avg_desc")}>Avg</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "highest_score_desc" ? "highest_score_asc" : "highest_score_desc")}>HS</th>
                    <th className="p-3.5 text-right font-black">100s/50s</th>
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
                        <td className="p-3.5 text-ink/80 font-medium">{player.batting_avg || "0.0"}</td>
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
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "matches_desc" ? "matches_asc" : "matches_desc")}>M</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_balls_desc" ? "total_balls_asc" : "total_balls_desc")}>Balls</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_wickets_desc" ? "total_wickets_asc" : "total_wickets_desc")}>Wickets</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "economy_asc" ? "economy_desc" : "economy_asc")}>Econ</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "bowling_avg_asc" ? "bowling_avg_desc" : "bowling_avg_asc")}>Avg</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "dot_ball_pct_desc" ? "dot_ball_pct_asc" : "dot_ball_pct_desc")}>Dot %</th>
                    <th className="p-3.5 text-right font-black">5w/4w</th>
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
                        <td className="p-3.5 text-ink/80 font-medium">{player.bowling_avg || "0.0"}</td>
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
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white font-display text-base font-black uppercase tracking-tight">
                        {playerProfile.player?.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-black text-ink uppercase tracking-tight leading-tight">
                          {playerProfile.player}
                        </h3>
                        <span className="text-[9px] font-black uppercase tracking-wider text-ink/35">IPL Career Profile</span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-ink/10 w-full my-5" />

                    {/* Batting Career Summary */}
                    {playerProfile.batting_summary && playerProfile.batting_summary.matches ? (
                      <div className="mb-6 bg-white/50 backdrop-blur-sm border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow transition duration-200">
                        <div className="text-[10px] font-black text-wicket uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-ink/5 pb-2">
                          <Trophy className="w-4 h-4 text-wicket" /> Batting Career Stats
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Flame className="w-5 h-5 text-boundary shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Total Runs</div>
                              <div className="text-sm font-black text-ink">{playerProfile.batting_summary.total_runs}</div>
                            </div>
                          </div>
                          
                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-wicket shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Average</div>
                              <div className="text-sm font-black text-ink">{playerProfile.batting_summary.batting_avg || "0.0"}</div>
                            </div>
                          </div>

                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Zap className="w-5 h-5 text-royal shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Strike Rate</div>
                              <div className="text-sm font-black text-royal">{playerProfile.batting_summary.strike_rate}</div>
                            </div>
                          </div>

                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-boundary shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Highest Score</div>
                              <div className="text-sm font-black text-ink">{playerProfile.batting_summary.highest_score}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between bg-ink/5 px-3 py-2 rounded-lg border border-ink/5 text-[9px] font-bold text-ink/65">
                          <span>Matches: <strong className="text-ink font-black">{playerProfile.batting_summary.matches}</strong></span>
                          <span>Innings: <strong className="text-ink font-black">{playerProfile.batting_summary.innings}</strong></span>
                          <span>100s / 50s: <strong className="text-boundary font-black">{playerProfile.batting_summary.hundreds} / {playerProfile.batting_summary.fifties}</strong></span>
                        </div>
                      </div>
                    ) : null}

                    {/* Bowling Career Summary */}
                    {playerProfile.bowling_summary && playerProfile.bowling_summary.matches ? (
                      <div className="mb-6 bg-white/50 backdrop-blur-sm border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow transition duration-200">
                        <div className="text-[10px] font-black text-royal uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-ink/5 pb-2">
                          <Sparkles className="w-4 h-4 text-royal" /> Bowling Career Stats
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Target className="w-5 h-5 text-boundary shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Wickets</div>
                              <div className="text-sm font-black text-ink">{playerProfile.bowling_summary.total_wickets}</div>
                            </div>
                          </div>
                          
                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <TrendingDown className="w-5 h-5 text-royal shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Economy</div>
                              <div className="text-sm font-black text-ink">{playerProfile.bowling_summary.economy}</div>
                            </div>
                          </div>

                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Activity className="w-5 h-5 text-wicket shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-wicket uppercase">Average</div>
                              <div className="text-sm font-black text-ink">{playerProfile.bowling_summary.bowling_avg || "0.0"}</div>
                            </div>
                          </div>

                          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-boundary shrink-0" />
                            <div>
                              <div className="text-[8px] font-black text-ink/40 uppercase">Dot Ball %</div>
                              <div className="text-sm font-black text-ink">{playerProfile.bowling_summary.dot_ball_pct}%</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between bg-ink/5 px-3 py-2 rounded-lg border border-ink/5 text-[9px] font-bold text-ink/65">
                          <span>Matches: <strong className="text-ink font-black">{playerProfile.bowling_summary.matches}</strong></span>
                          <span>Overs: <strong className="text-ink font-black">{Math.round(playerProfile.bowling_summary.total_balls / 6)}</strong></span>
                          <span>5w / 4w: <strong className="text-boundary font-black">{playerProfile.bowling_summary.five_wkt_hauls} / {playerProfile.bowling_summary.four_wkt_hauls}</strong></span>
                        </div>
                      </div>
                    ) : null}

                    {/* Impact Award Summaries */}
                    {playerProfile.pom_summary ? (
                      <div className="bg-wicket/5 border border-wicket/10 p-4 rounded-xl flex items-center justify-between text-xs hover:bg-wicket/10 transition duration-150">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-wicket shrink-0" />
                          <span className="font-bold text-ink/75">POM Awards (Player of Match):</span>
                        </div>
                        <span className="font-black text-boundary text-sm">{playerProfile.pom_summary.total_pom_awards}</span>
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
