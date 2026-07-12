"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SeasonFilter from "@/components/SeasonFilter";
import CustomDropdown from "@/components/CustomDropdown";
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
  Award,
  CalendarDays,
  Medal,
  Swords,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

const BATTING_SORT_OPTIONS = [
  { value: "total_runs_desc", label: "Runs: Highest first" },
  { value: "total_runs_asc", label: "Runs: Lowest first" },
  { value: "total_boundaries_desc", label: "Boundaries: Most first" },
  { value: "total_fours_desc", label: "Fours: Most first" },
  { value: "total_sixes_desc", label: "Sixes: Most first" },
  { value: "batting_avg_desc", label: "Average: Highest first" },
  { value: "batting_avg_asc", label: "Average: Lowest first" },
  { value: "strike_rate_desc", label: "Strike Rate: Highest first" },
  { value: "strike_rate_asc", label: "Strike Rate: Lowest first" },
  { value: "highest_score_desc", label: "Highest Score first" },
];

const BOWLING_SORT_OPTIONS = [
  { value: "total_wickets_desc", label: "Wickets: Most first" },
  { value: "total_wickets_asc", label: "Wickets: Least first" },
  { value: "economy_asc", label: "Economy: Best first" },
  { value: "economy_desc", label: "Economy: Worst first" },
  { value: "bowling_avg_asc", label: "Bowling Avg: Best first" },
  { value: "maiden_overs_desc", label: "Maiden Overs: Most first" },
  { value: "five_wkt_hauls_desc", label: "5-Wicket Hauls first" },
  { value: "dot_ball_pct_desc", label: "Dot Ball %: Most first" },
];

const TEAM_COLORS = {
  "CSK": "bg-yellow-400 text-black",
  "MI": "bg-blue-600 text-white",
  "RCB": "bg-red-600 text-white",
  "KKR": "bg-purple-800 text-white",
  "DC": "bg-blue-500 text-white",
  "RR": "bg-pink-500 text-white",
  "PBKS": "bg-red-500 text-white",
  "SRH": "bg-orange-500 text-white",
  "GT": "bg-teal-700 text-white",
  "LSG": "bg-cyan-800 text-white",
  "RPS": "bg-purple-500 text-white",
  "GL": "bg-orange-400 text-white",
  "PWI": "bg-blue-400 text-white",
  "KTK": "bg-orange-600 text-white",
  "DC*": "bg-gray-400 text-white",
};

export default function PlayersPage() {
  const [season, setSeason] = useState("All Seasons");
  const [activeTab, setActiveTab] = useState("batting"); // "batting" or "bowling"
  const [playersList, setPlayersList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortCriteria, setSortCriteria] = useState("total_runs_desc");
  const [teams, setTeams] = useState([]);
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const teamOptions = [
    { value: "All Teams", label: "All Teams" },
    ...teams.map((team) => ({ value: team, label: team }))
  ];

  const sortOptions = activeTab === "batting" ? BATTING_SORT_OPTIONS : BOWLING_SORT_OPTIONS;
  const [playerProfile, setPlayerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [viewMode, setViewMode] = useState("career"); // "career" or "season"

  useEffect(() => {
    async function loadMetadata() {
      try {
        const metadata = await api.getMetadata();
        setTeams(metadata?.teams || []);
      } catch (err) {
        console.error("Error loading player filters:", err);
      }
    }

    loadMetadata();
  }, []);

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
          else if (sortCriteria === "total_boundaries_desc") { apiSortBy = "total_boundaries"; apiAscending = false; }
          else if (sortCriteria === "total_boundaries_asc") { apiSortBy = "total_boundaries"; apiAscending = true; }
          else if (sortCriteria === "total_fours_desc") { apiSortBy = "total_fours"; apiAscending = false; }
          else if (sortCriteria === "total_fours_asc") { apiSortBy = "total_fours"; apiAscending = true; }
          else if (sortCriteria === "total_sixes_desc") { apiSortBy = "total_sixes"; apiAscending = false; }
          else if (sortCriteria === "total_sixes_asc") { apiSortBy = "total_sixes"; apiAscending = true; }
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
          else if (sortCriteria === "overs_desc") { apiSortBy = "overs"; apiAscending = false; }
          else if (sortCriteria === "overs_asc") { apiSortBy = "overs"; apiAscending = true; }
          else if (sortCriteria === "maiden_overs_desc") { apiSortBy = "maiden_overs"; apiAscending = false; }
          else if (sortCriteria === "maiden_overs_asc") { apiSortBy = "maiden_overs"; apiAscending = true; }
        }

        if (activeTab === "batting") {
          data = await api.getBattingLeaderboard({
            season: seasonParam,
            sort_by: apiSortBy,
            ascending: apiAscending,
            team: teamFilter === "All Teams" ? null : teamFilter,
            limit: 100
          });
        } else {
          data = await api.getBowlingLeaderboard({
            season: seasonParam,
            sort_by: apiSortBy,
            ascending: apiAscending,
            team: teamFilter === "All Teams" ? null : teamFilter,
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
  }, [season, activeTab, sortCriteria, teamFilter]);

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
        setViewMode("career"); // Reset to career view on new player
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

  const renderBattingSection = (summary, isSecondary = false) => {
    if (!summary || !summary.matches) return null;
    return (
      <div className={`mb-6 bg-white/50 backdrop-blur-sm border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow transition duration-200 ${isSecondary ? 'opacity-80' : ''}`}>
        <div className="text-[10px] font-black text-wicket uppercase tracking-widest mb-3 flex items-center justify-between border-b border-ink/5 pb-2">
          <div className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-wicket" /> Batting Stats</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Flame className="w-5 h-5 text-wicket shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Total Runs</div>
              <div className="text-sm font-black text-boundary">{summary.total_runs}</div>
            </div>
          </div>
          
          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Activity className="w-5 h-5 text-wicket shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Average</div>
              <div className="text-sm font-black text-ink">{summary.batting_avg || "0.0"}</div>
            </div>
          </div>

          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Zap className="w-5 h-5 text-wicket shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Strike Rate</div>
              <div className="text-sm font-black text-ink">{summary.strike_rate}</div>
            </div>
          </div>

          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-wicket shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Highest Score</div>
              <div className="text-sm font-black text-ink">{summary.highest_score}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between bg-ink/5 px-3 py-2 rounded-lg border border-ink/5 text-[9px] font-bold text-ink/65">
          <span>Matches: <strong className="text-ink font-black">{summary.matches}</strong></span>
          {!isSecondary && <span>Innings: <strong className="text-ink font-black">{summary.innings}</strong></span>}
          <span>100s/50s: <strong className="text-wicket font-black">{summary.hundreds}/{summary.fifties}</strong></span>
        </div>
      </div>
    );
  };

  const renderBowlingSection = (summary, isSecondary = false) => {
    if (!summary || !summary.matches) return null;
    return (
      <div className={`mb-6 bg-white/50 backdrop-blur-sm border border-ink/10 rounded-xl p-4 shadow-sm hover:shadow transition duration-200 ${isSecondary ? 'opacity-80' : ''}`}>
        <div className="text-[10px] font-black text-royal uppercase tracking-widest mb-3 flex items-center justify-between border-b border-ink/5 pb-2">
          <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-royal" /> Bowling Stats</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Target className="w-5 h-5 text-royal shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Wickets</div>
              <div className="text-sm font-black text-boundary">{summary.total_wickets}</div>
            </div>
          </div>
          
          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-royal shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Economy</div>
              <div className="text-sm font-black text-ink">{summary.economy}</div>
            </div>
          </div>

          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Activity className="w-5 h-5 text-royal shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Average</div>
              <div className="text-sm font-black text-ink">{summary.bowling_avg || "0.0"}</div>
            </div>
          </div>

          <div className="bg-ink/5 p-3 rounded-lg border border-ink/5 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-royal shrink-0" />
            <div>
              <div className="text-[8px] font-black text-ink/40 uppercase">Dot Ball %</div>
              <div className="text-sm font-black text-ink">{summary.dot_ball_pct}%</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between bg-ink/5 px-3 py-2 rounded-lg border border-ink/5 text-[9px] font-bold text-ink/65">
          <span>Matches: <strong className="text-ink font-black">{summary.matches}</strong></span>
          <span>Overs: <strong className="text-ink font-black">{Math.round(summary.total_balls / 6)}</strong></span>
          <span>5w/4w: <strong className="text-royal font-black">{summary.five_wkt_hauls}/{summary.four_wkt_hauls}</strong></span>
        </div>
      </div>
    );
  };

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

        {/* Compact Leaderboard Controls */}
        <div className="border-b border-ink/10 pb-5">
          <div className="grid gap-3 xl:grid-cols-[410px_1fr] xl:items-start">
            {/* Tab buttons */}
            <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <button
              onClick={() => setActiveTab("batting")}
              className={`min-h-14 rounded-2xl px-5 text-center text-xs font-black uppercase tracking-[0.12em] transition ${
                activeTab === "batting"
                  ? "bg-ink text-white shadow-sm"
                  : "bg-ink/5 text-ink/45 hover:bg-ink/10"
              }`}
            >
              Batting Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("bowling")}
              className={`min-h-14 rounded-2xl px-5 text-center text-xs font-black uppercase tracking-[0.12em] transition ${
                activeTab === "bowling"
                  ? "bg-ink text-white shadow-sm"
                  : "bg-ink/5 text-ink/45 hover:bg-ink/10"
              }`}
            >
              Bowling Leaderboard
            </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search bar */}
              <div className="relative sm:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35" />
              <input
                type="text"
                placeholder="Search player name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-ink/10 bg-white/55 pl-11 pr-5 text-sm font-semibold text-ink/75 shadow-sm outline-none transition placeholder:text-ink/35 focus:bg-white focus:ring-1 focus:ring-ink/20"
              />
            </div>

              {/* Sort dropdown */}
              <CustomDropdown
                value={sortCriteria}
                onChange={setSortCriteria}
                options={sortOptions}
                icon={ArrowUpDown}
              />

              {/* Team dropdown */}
              <CustomDropdown
                value={teamFilter}
                onChange={setTeamFilter}
                options={teamOptions}
                icon={ShieldAlert}
              />


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
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_boundaries_desc" ? "total_boundaries_asc" : "total_boundaries_desc")}>Bnd</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_fours_desc" ? "total_fours_asc" : "total_fours_desc")}>4s</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_sixes_desc" ? "total_sixes_asc" : "total_sixes_desc")}>6s</th>
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
                        <td className="p-4" colSpan={11}>
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
                        <td className="p-3.5 text-boundary font-black">{player.total_runs}</td>
                        <td className="p-3.5 text-ink font-black">{player.total_boundaries ?? (player.total_fours + player.total_sixes)}</td>
                        <td className="p-3.5 text-ink/70 font-bold">{player.total_fours}</td>
                        <td className="p-3.5 text-ink/70 font-bold">{player.total_sixes}</td>
                        <td className="p-3.5 text-ink font-bold">{player.strike_rate}</td>
                        <td className="p-3.5 text-ink/80 font-medium">{player.batting_avg || "0.0"}</td>
                        <td className="p-3.5 text-ink/70">{player.highest_score}</td>
                        <td className="p-3.5 text-right font-semibold text-wicket">
                          {player.hundreds}/{player.fifties}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-ink/40 font-bold">
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
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "overs_desc" ? "overs_asc" : "overs_desc")}>Overs</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "total_wickets_desc" ? "total_wickets_asc" : "total_wickets_desc")}>Wickets</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "economy_asc" ? "economy_desc" : "economy_asc")}>Econ</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "bowling_avg_asc" ? "bowling_avg_desc" : "bowling_avg_asc")}>Avg</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "maiden_overs_desc" ? "maiden_overs_asc" : "maiden_overs_desc")}>Mdns</th>
                    <th className="p-3.5 cursor-pointer hover:text-boundary transition" onClick={() => setSortCriteria(sortCriteria === "dot_ball_pct_desc" ? "dot_ball_pct_asc" : "dot_ball_pct_desc")}>Dot %</th>
                    <th className="p-3.5 text-right font-black">5w/4w</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-ink/5 animate-pulse">
                        <td className="p-4" colSpan={10}>
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
                        <td className="p-3.5 text-ink/70">{player.overs}</td>
                        <td className="p-3.5 text-ink/55 font-bold">{player.bowling_type || "Unknown"}</td>
                        <td className="p-3.5 text-boundary font-black">{player.total_wickets}</td>
                        <td className="p-3.5 text-ink font-bold">{player.economy}</td>
                        <td className="p-3.5 text-ink/80 font-medium">{player.bowling_avg || "0.0"}</td>
                        <td className="p-3.5 text-ink font-black">{player.maiden_overs || 0}</td>
                        <td className="p-3.5 text-ink/70">{player.dot_ball_pct}%</td>
                        <td className="p-3.5 text-right font-semibold text-royal">
                          {player.five_wkt_hauls}/{player.four_wkt_hauls}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-ink/40 font-bold">
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
              {playerProfile && (
                <div className="flex bg-ink/5 rounded-lg p-1">
                  <button 
                    onClick={() => setViewMode("career")}
                    className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md transition ${viewMode === "career" ? "bg-white shadow-sm text-ink" : "text-ink/40 hover:text-ink/70"}`}
                  >
                    Career
                  </button>
                  <button 
                    onClick={() => setViewMode("season")}
                    className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md transition ${viewMode === "season" ? "bg-white shadow-sm text-ink" : "text-ink/40 hover:text-ink/70"}`}
                  >
                    By Season
                  </button>
                </div>
              )}
            </div>

            {selectedPlayer ? (
              <div className="mt-6 p-6 rounded-xl border border-ink/10 bg-white/40 shadow-sm min-h-[400px] flex flex-col">
                {profileLoading ? (
                  <div className="h-64 flex items-center justify-center animate-pulse bg-ink/5 rounded-xl w-full" />
                ) : playerProfile ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden font-display text-base font-black tracking-tight shadow-sm ${playerProfile.current_team_abbr ? TEAM_COLORS[playerProfile.current_team_abbr] || 'bg-ink text-white' : 'bg-ink text-white'}`}>
                        {playerProfile.current_team_abbr && ['CSK','DC','GT','KKR','LSG','MI','PBKS','RCB','RR','SRH'].includes(playerProfile.current_team_abbr.replace('*', '')) ? (
                          <img 
                            src={`/teams/${playerProfile.current_team_abbr.replace('*', '').toLowerCase()}.jpg`} 
                            alt={playerProfile.current_team_abbr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{playerProfile.current_team_abbr || playerProfile.player?.split(" ").map(n => n[0]).join("")}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-black text-ink uppercase tracking-tight leading-tight">
                          {playerProfile.player}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-black uppercase tracking-wider text-ink/50">
                          <span className="text-boundary">{playerProfile.role}</span>
                          {playerProfile.current_team_abbr && (
                            <>
                              <span>•</span>
                              <span>{playerProfile.current_team_abbr}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-px bg-ink/10 w-full my-5" />

                    {viewMode === "career" ? (
                      <>
                        {/* Longevity & Quick Bests */}
                        <div className="mb-5 flex flex-wrap gap-2 text-[9px] uppercase tracking-widest font-bold">
                          {playerProfile.total_seasons > 0 && (
                            <span className="bg-ink/5 text-ink/70 px-2 py-1 rounded flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3" /> Active: {playerProfile.first_season} - {playerProfile.last_season} ({playerProfile.total_seasons} yrs)
                            </span>
                          )}
                          {playerProfile.career_bests?.best_batting && (
                            <span className="bg-wicket/10 text-wicket px-2 py-1 rounded flex items-center gap-1.5">
                              <Medal className="w-3 h-3" /> Best Bat: {playerProfile.career_bests.best_batting.runs} vs {playerProfile.career_bests.best_batting.vs}
                            </span>
                          )}
                          {playerProfile.career_bests?.best_bowling && (
                            <span className="bg-royal/10 text-royal px-2 py-1 rounded flex items-center gap-1.5">
                              <Medal className="w-3 h-3" /> Best Bowl: {playerProfile.career_bests.best_bowling.wickets}/{playerProfile.career_bests.best_bowling.runs} vs {playerProfile.career_bests.best_bowling.vs}
                            </span>
                          )}
                        </div>

                        {/* Win Contribution */}
                        {playerProfile.win_contribution && (
                          <div className="mb-5 p-3 bg-boundary/5 border border-boundary/10 rounded-lg flex items-start gap-3">
                            <Trophy className="w-5 h-5 text-boundary shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-black uppercase text-boundary/70 tracking-wider">Match Winner</div>
                              <div className="text-xs font-bold text-ink mt-0.5 leading-snug">{playerProfile.win_contribution.stat}</div>
                            </div>
                          </div>
                        )}

                        {/* Render Bowling/Batting based on role */}
                        {playerProfile.role === "BOWLER" || playerProfile.role === "ALL-ROUNDER" ? (
                          <>
                            {renderBowlingSection(playerProfile.bowling_summary, false)}
                            {renderBattingSection(playerProfile.batting_summary, true)}
                          </>
                        ) : (
                          <>
                            {renderBattingSection(playerProfile.batting_summary, false)}
                            {renderBowlingSection(playerProfile.bowling_summary, true)}
                          </>
                        )}

                        {/* Head to Head */}
                        {playerProfile.head_to_head && playerProfile.head_to_head.length > 0 && (
                          <div className="mt-5 border-t border-ink/5 pt-4">
                            <h4 className="text-[10px] font-black uppercase text-ink/50 tracking-wider flex items-center gap-1.5 mb-3">
                              <Swords className="w-4 h-4" /> Top Targets ({playerProfile.head_to_head[0].label})
                            </h4>
                            <div className="grid grid-cols-1 gap-1.5">
                              {playerProfile.head_to_head.slice(0, 3).map(h2h => (
                                <div key={h2h.team} className="flex justify-between items-center text-xs bg-ink/5 px-3 py-1.5 rounded text-ink/75">
                                  <span className="font-bold flex items-center gap-2">
                                    {['CSK','DC','GT','KKR','LSG','MI','PBKS','RCB','RR','SRH'].includes(h2h.team.replace('*', '')) ? (
                                      <img src={`/teams/${h2h.team.replace('*', '').toLowerCase()}.jpg`} alt={h2h.team} className="w-5 h-5 rounded-full object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.05)]" />
                                    ) : (
                                      <span className={`w-2 h-2 rounded-full ${TEAM_COLORS[h2h.team] || 'bg-ink'}`}></span>
                                    )}
                                    vs {h2h.team}
                                  </span>
                                  <span className="font-black text-ink">{h2h.value} <span className="text-[9px] text-ink/40 font-bold ml-1">in {h2h.matches}M</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Impact Award Summaries */}
                        {playerProfile.pom_summary?.total_pom_awards > 0 && (
                          <div className="mt-5 bg-wicket/5 border border-wicket/10 p-3 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-wicket shrink-0" />
                              <span className="font-bold text-ink/75">Player of Match Awards</span>
                            </div>
                            <span className="font-black text-boundary text-sm">{playerProfile.pom_summary.total_pom_awards}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex-1 overflow-auto max-h-[500px] pr-2">
                        {/* By Season View */}
                        <div className="space-y-6">
                          {(playerProfile.role === "BOWLER" || playerProfile.role === "ALL-ROUNDER") && playerProfile.bowling_history?.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase text-royal tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Bowling Progression
                              </h4>
                              <table className="w-full text-left text-[11px] border-collapse">
                                <thead>
                                  <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase text-ink/50">
                                    <th className="py-2 px-3">Season</th>
                                    <th className="py-2 px-3">Wickets</th>
                                    <th className="py-2 px-3">Econ</th>
                                    <th className="py-2 px-3">Avg</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {playerProfile.bowling_history.filter(h => h.season !== "All-Time").reverse().map(h => (
                                    <tr key={`bowl-${h.season}`} className="border-b border-ink/5 hover:bg-ink/5 transition">
                                      <td className="py-2 px-3 font-bold">{h.season}</td>
                                      <td className="py-2 px-3 font-black text-boundary">{h.total_wickets}</td>
                                      <td className="py-2 px-3 font-semibold">{h.economy}</td>
                                      <td className="py-2 px-3 text-ink/60">{h.bowling_avg}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {(playerProfile.role === "BATSMAN" || playerProfile.role === "ALL-ROUNDER" || playerProfile.role === "WK-BATSMAN") && playerProfile.batting_history?.length > 0 && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase text-wicket tracking-widest mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Batting Progression
                              </h4>
                              <table className="w-full text-left text-[11px] border-collapse">
                                <thead>
                                  <tr className="border-b border-ink/10 bg-ink/5 font-black uppercase text-ink/50">
                                    <th className="py-2 px-3">Season</th>
                                    <th className="py-2 px-3">Runs</th>
                                    <th className="py-2 px-3">SR</th>
                                    <th className="py-2 px-3">Avg</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {playerProfile.batting_history.filter(h => h.season !== "All-Time").reverse().map(h => (
                                    <tr key={`bat-${h.season}`} className="border-b border-ink/5 hover:bg-ink/5 transition">
                                      <td className="py-2 px-3 font-bold">{h.season}</td>
                                      <td className="py-2 px-3 font-black text-boundary">{h.total_runs}</td>
                                      <td className="py-2 px-3 font-semibold">{h.strike_rate}</td>
                                      <td className="py-2 px-3 text-ink/60">{h.batting_avg}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
