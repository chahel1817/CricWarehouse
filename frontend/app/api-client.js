// API Client for CricWarehouse Frontend
// Connects to FastAPI backend at http://localhost:8000

const API_BASE_URL = "http://localhost:8000";

// Fallback mock data if the API is offline
const MOCK_DATA = {
  metadata: {
    seasons: [2026, 2025, 2024, 2023, 2022, 2021, 2020],
    teams: [
      "Chennai Super Kings",
      "Delhi Capitals",
      "Gujarat Titans",
      "Kolkata Knight Riders",
      "Lucknow Super Giants",
      "Mumbai Indians",
      "Punjab Kings",
      "Rajasthan Royals",
      "Royal Challengers Bengaluru",
      "Sunrisers Hyderabad"
    ]
  },
  matches: {
    total_count: 1243,
    matches: [
      { match_id: 1, season: 2026, team1: "Chennai Super Kings", team2: "Mumbai Indians", winner: "Chennai Super Kings", venue: "M.Chinnaswamy Stadium", date: "2026-05-24", margin: "24 runs", player_of_match: "MS Dhoni" },
      { match_id: 2, season: 2026, team1: "Royal Challengers Bengaluru", team2: "Kolkata Knight Riders", winner: "Royal Challengers Bengaluru", venue: "M.Chinnaswamy Stadium", date: "2026-05-23", margin: "4 wickets", player_of_match: "Virat Kohli" },
      { match_id: 3, season: 2026, team1: "Sunrisers Hyderabad", team2: "Rajasthan Royals", winner: "Sunrisers Hyderabad", venue: "Rajiv Gandhi International Stadium", date: "2026-05-22", margin: "15 runs", player_of_match: "Travis Head" },
      { match_id: 4, season: 2025, team1: "Kolkata Knight Riders", team2: "Sunrisers Hyderabad", winner: "Kolkata Knight Riders", venue: "Eden Gardens", date: "2025-05-26", margin: "8 wickets", player_of_match: "Shreyas Iyer" }
    ]
  },
  batting: [
    { batter: "Virat Kohli", matches: 243, innings: 243, total_runs: 8004, total_balls: 6098, strike_rate: 131.2, batting_avg: 37.2, total_fours: 680, total_sixes: 245, fifties: 52, hundreds: 8, highest_score: 113 },
    { batter: "Shikhar Dhawan", matches: 210, innings: 209, total_runs: 6617, total_balls: 5240, strike_rate: 126.3, batting_avg: 35.1, total_fours: 720, total_sixes: 148, fifties: 48, hundreds: 2, highest_score: 106 },
    { batter: "David Warner", matches: 176, innings: 176, total_runs: 6397, total_balls: 4572, strike_rate: 139.9, batting_avg: 41.5, total_fours: 620, total_sixes: 220, fifties: 60, hundreds: 4, highest_score: 126 },
    { batter: "Rohit Sharma", matches: 257, innings: 252, total_runs: 6628, total_balls: 5047, strike_rate: 131.3, batting_avg: 29.5, total_fours: 560, total_sixes: 272, fifties: 42, hundreds: 2, highest_score: 109 },
    { batter: "Suresh Raina", matches: 205, innings: 200, total_runs: 5528, total_balls: 4040, strike_rate: 136.8, batting_avg: 32.5, total_fours: 506, total_sixes: 203, fifties: 39, hundreds: 1, highest_score: 100 },
    { batter: "AB de Villiers", matches: 184, innings: 170, total_runs: 5162, total_balls: 3400, strike_rate: 151.8, batting_avg: 39.7, total_fours: 413, total_sixes: 251, fifties: 40, hundreds: 3, highest_score: 133 },
    { batter: "MS Dhoni", matches: 250, innings: 218, total_runs: 4746, total_balls: 3510, strike_rate: 135.2, batting_avg: 38.8, total_fours: 348, total_sixes: 252, fifties: 24, hundreds: 0, highest_score: 84 }
  ],
  bowling: [
    { bowler: "Yuzvendra Chahal", matches: 145, total_balls: 3200, total_runs_conceded: 4050, total_wickets: 205, economy: 7.6, bowling_avg: 19.7, bowling_sr: 15.6, dot_ball_pct: 38.5, four_wkt_hauls: 5, five_wkt_hauls: 1 },
    { bowler: "Dwayne Bravo", matches: 161, total_balls: 3100, total_runs_conceded: 4300, total_wickets: 183, economy: 8.32, bowling_avg: 23.5, bowling_sr: 16.9, dot_ball_pct: 34.2, four_wkt_hauls: 2, five_wkt_hauls: 0 },
    { bowler: "Piyush Chawla", matches: 181, total_balls: 3700, total_runs_conceded: 4800, total_wickets: 179, economy: 7.78, bowling_avg: 26.8, bowling_sr: 20.6, dot_ball_pct: 36.8, four_wkt_hauls: 2, five_wkt_hauls: 0 },
    { bowler: "Amit Mishra", matches: 161, total_balls: 3200, total_runs_conceded: 3900, total_wickets: 173, economy: 7.31, bowling_avg: 22.5, bowling_sr: 18.5, dot_ball_pct: 40.2, four_wkt_hauls: 4, five_wkt_hauls: 1 },
    { bowler: "Ravichandran Ashwin", matches: 197, total_balls: 4100, total_runs_conceded: 4700, total_wickets: 171, economy: 6.87, bowling_avg: 27.4, bowling_sr: 23.9, dot_ball_pct: 41.5, four_wkt_hauls: 1, five_wkt_hauls: 0 },
    { bowler: "Lasith Malinga", matches: 122, total_balls: 2827, total_runs_conceded: 3320, total_wickets: 170, economy: 7.04, bowling_avg: 19.5, bowling_sr: 16.6, dot_ball_pct: 42.1, four_wkt_hauls: 4, five_wkt_hauls: 1 },
    { bowler: "Jasprit Bumrah", matches: 133, total_balls: 3000, total_runs_conceded: 3400, total_wickets: 158, economy: 6.8, bowling_avg: 21.5, bowling_sr: 18.9, dot_ball_pct: 44.5, four_wkt_hauls: 3, five_wkt_hauls: 1 }
  ],
  venues: [
    { venue: "Wankhede Stadium", matches_played: 115, avg_1st_inn_score: 168.5, avg_2nd_inn_score: 159.2, bat_first_wins: 52, chase_wins: 63, highest_total: 235, lowest_total: 67, avg_sixes_per_innings: 8.5, avg_fours_per_innings: 16.2 },
    { venue: "M.Chinnaswamy Stadium", matches_played: 98, avg_1st_inn_score: 175.2, avg_2nd_inn_score: 162.8, bat_first_wins: 41, chase_wins: 57, highest_total: 263, lowest_total: 82, avg_sixes_per_innings: 11.2, avg_fours_per_innings: 15.4 },
    { venue: "Eden Gardens", matches_played: 93, avg_1st_inn_score: 164.8, avg_2nd_inn_score: 156.4, bat_first_wins: 38, chase_wins: 55, highest_total: 245, lowest_total: 49, avg_sixes_per_innings: 7.9, avg_fours_per_innings: 17.1 },
    { venue: "Narendra Modi Stadium", matches_played: 45, avg_1st_inn_score: 172.1, avg_2nd_inn_score: 160.5, bat_first_wins: 21, chase_wins: 24, highest_total: 233, lowest_total: 89, avg_sixes_per_innings: 9.1, avg_fours_per_innings: 16.5 }
  ],
  topPerformers: [
    { player: "Virat Kohli", pom_awards: 17, season_runs: 8004, season_wickets: 4, impact_score: 98.5 },
    { player: "AB de Villiers", pom_awards: 25, season_runs: 5162, season_wickets: 0, impact_score: 96.2 },
    { player: "MS Dhoni", pom_awards: 17, season_runs: 4746, season_wickets: 0, impact_score: 94.8 },
    { player: "Rohit Sharma", pom_awards: 19, season_runs: 6628, season_wickets: 15, impact_score: 92.5 }
  ]
};

async function fetchFromApi(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // Safely normalize params to a valid object
  const safeParams = params && typeof params === 'object' ? params : {};
  
  Object.keys(safeParams).forEach(key => {
    if (safeParams[key] !== undefined && safeParams[key] !== null && safeParams[key] !== "All Seasons") {
      url.searchParams.append(key, safeParams[key]);
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 } // Cache for 60s
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch from ${endpoint}, using fallback mock data.`, error);
    // Return appropriate fallback based on endpoint
    if (endpoint === "/metadata") return MOCK_DATA.metadata;
    if (endpoint === "/matches") return MOCK_DATA.matches;
    if (endpoint === "/players/batting") return MOCK_DATA.batting;
    if (endpoint === "/players/bowling") return MOCK_DATA.bowling;
    if (endpoint === "/players/top-performers") return MOCK_DATA.topPerformers;
    if (endpoint === "/venues/stats") return MOCK_DATA.venues;
    if (endpoint === "/teams") return MOCK_DATA.metadata.teams;
    if (endpoint.includes("/summary")) {
      const team = endpoint.split("/")[2] || "Chennai Super Kings";
      return {
        team: decodeURIComponent(team),
        seasons_active: 17,
        matches_played: 250,
        wins: 140,
        losses: 105,
        no_results: 5,
        win_pct: 56.0,
        toss_wins: 120,
        titles_won: 5,
        title_years: [2010, 2011, 2018, 2021, 2023],
        total_runs_scored: 42000,
        total_runs_conceded: 40500,
        total_sixes: 1200,
        total_fours: 2500,
        total_wickets_taken: 1450,
        highest_score: 246,
        lowest_score: 79
      };
    }
    if (endpoint.includes("/history")) {
      return [
        { season: 2026, matches_played: 14, wins: 8, losses: 6, no_results: 0, titles_won: 0 },
        { season: 2025, matches_played: 15, wins: 9, losses: 6, no_results: 0, titles_won: 0 },
        { season: 2024, matches_played: 14, wins: 7, losses: 7, no_results: 0, titles_won: 0 },
        { season: 2023, matches_played: 16, wins: 10, losses: 5, no_results: 1, titles_won: 1 }
      ];
    }
    return null;
  }
}

export const api = {
  getMetadata: () => fetchFromApi("/metadata"),
  getMatches: (params) => fetchFromApi("/matches", params),
  getBattingLeaderboard: (params) => fetchFromApi("/players/batting", params),
  getBowlingLeaderboard: (params) => fetchFromApi("/players/bowling", params),
  getTopPerformers: (params) => fetchFromApi("/players/top-performers", params),
  getVenueStats: (params) => fetchFromApi("/venues/stats", params),
  getTeams: () => fetchFromApi("/teams"),
  getTeamSummary: (team) => fetchFromApi(`/teams/${encodeURIComponent(team)}/summary`),
  getTeamHistory: (team) => fetchFromApi(`/teams/${encodeURIComponent(team)}/history`),
  getTeamHeadToHead: (team) => fetchFromApi(`/teams/${encodeURIComponent(team)}/head-to-head`),
  getPlayerProfile: (player) => fetchFromApi(`/players/${encodeURIComponent(player)}/history`)
};
