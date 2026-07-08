"""
API Data Service
================
Handles high-performance local loading and querying of Parquet files
from the Silver and Gold layers using Pandas and PyArrow.
Caches dataframes in memory for fast response times.
"""

import os
import pandas as pd
from pandas.api.types import is_scalar
from typing import Optional, List, Dict, Any

PLAYER_ALIASES = {
    "viratkohli": "V Kohli",
}

def normalize_query_team(team_name: Optional[str]) -> Optional[str]:
    """
    Normalizes a query team name to the unified team name used in the silver/gold layers.
    Handles historical rebranding names and common abbreviations.
    """
    if not team_name:
        return team_name

    aliases = {
        "royal challengers bangalore": "Royal Challengers Bengaluru",
        "royal challengers bengaluru": "Royal Challengers Bengaluru",
        "rcb": "Royal Challengers Bengaluru",
        "kings xi punjab": "Punjab Kings",
        "punjab kings": "Punjab Kings",
        "kxip": "Punjab Kings",
        "delhi daredevils": "Delhi Capitals",
        "delhi capitals": "Delhi Capitals",
        "dd": "Delhi Capitals",
    }
    return aliases.get(team_name.lower().strip(), team_name.strip())

def normalize_lookup_text(value: Optional[str]) -> str:
    """Normalizes names for forgiving URL lookups."""
    if not value:
        return ""
    return "".join(str(value).lower().split())

def normalize_query_player(player_name: Optional[str]) -> Optional[str]:
    """Maps common full-name inputs to the Cricsheet player names in the data."""
    if not player_name:
        return player_name

    compact = normalize_lookup_text(player_name)
    return PLAYER_ALIASES.get(compact, player_name.strip())

def clean_value(value: Any) -> Any:
    """Converts pandas/numpy scalar values into JSON-safe Python values."""
    if value is None:
        return None
    if is_scalar(value) and pd.isna(value):
        return None
    if hasattr(value, "item"):
        value = value.item()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value

def clean_records(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Converts a dataframe to JSON-safe records."""
    return [
        {key: clean_value(value) for key, value in record.items()}
        for record in df.to_dict(orient="records")
    ]

def validate_sort_column(sort_by: str, valid_cols: List[str], default_col: str) -> str:
    """Returns a valid sort column or raises a client-facing validation error."""
    if not sort_by:
        return default_col
    if sort_by not in valid_cols:
        valid = ", ".join(valid_cols)
        raise ValueError(f"Invalid sort_by '{sort_by}'. Valid values are: {valid}")
    return sort_by

class DataService:
    def __init__(self):
        # Resolve paths relative to project root
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.silver_dir = os.path.join(self.project_root, "data", "silver")
        self.gold_dir = os.path.join(self.project_root, "data", "gold")
        
        # In-memory dataframe cache
        self._cache: Dict[str, pd.DataFrame] = {}

    def _get_df(self, layer: str, table_name: str) -> pd.DataFrame:
        """Helper to read and cache a Parquet dataset."""
        cache_key = f"{layer}/{table_name}"
        if cache_key not in self._cache:
            base_dir = self.silver_dir if layer == "silver" else self.gold_dir
            path = os.path.join(base_dir, table_name)
            if not os.path.exists(path):
                raise FileNotFoundError(f"Parquet path not found: {path}")
            self._cache[cache_key] = pd.read_parquet(path)
        return self._cache[cache_key]

    def get_dataset_status(self) -> Dict[str, Any]:
        """Returns load status and row counts for all backend datasets."""
        datasets = {
            "silver_matches": ("silver", "matches"),
            "gold_team_stats": ("gold", "team_stats"),
            "gold_player_batting": ("gold", "player_batting"),
            "gold_player_bowling": ("gold", "player_bowling"),
            "gold_venue_stats": ("gold", "venue_stats"),
            "gold_head_to_head": ("gold", "head_to_head"),
            "gold_top_performers": ("gold", "top_performers"),
        }
        details = {}
        all_ok = True

        for name, (layer, table) in datasets.items():
            try:
                df = self._get_df(layer, table)
                details[name] = {
                    "status": "ok",
                    "rows": int(len(df)),
                    "columns": list(df.columns),
                }
            except Exception as exc:
                all_ok = False
                details[name] = {
                    "status": "error",
                    "error": str(exc),
                }

        return {"status": "ok" if all_ok else "error", "datasets": details}

    def get_metadata(self) -> Dict[str, Any]:
        """Returns lightweight filter metadata for frontend dropdowns."""
        return {
            "seasons": self.get_all_seasons(),
            "teams": self.get_all_teams(),
            "venues": self.get_all_venues(),
            "batting_sort_fields": list(self.get_player_batting().columns),
            "bowling_sort_fields": list(self.get_player_bowling().columns),
        }

    # ---------- Data loaders --------------------
    
    def get_team_stats(self) -> pd.DataFrame:
        return self._get_df("gold", "team_stats")

    def get_player_batting(self) -> pd.DataFrame:
        return self._get_df("gold", "player_batting")

    def get_player_bowling(self) -> pd.DataFrame:
        return self._get_df("gold", "player_bowling")

    def get_venue_stats(self) -> pd.DataFrame:
        return self._get_df("gold", "venue_stats")

    def get_head_to_head(self) -> pd.DataFrame:
        return self._get_df("gold", "head_to_head")

    def get_top_performers(self) -> pd.DataFrame:
        return self._get_df("gold", "top_performers")

    def get_matches(self) -> pd.DataFrame:
        return self._get_df("silver", "matches")

    # ---------- Specialized queries --------------------

    def get_all_teams(self) -> List[str]:
        """Returns a sorted list of unique team names across all seasons."""
        df = self.get_team_stats()
        return sorted(df["team"].unique().tolist())

    def get_all_seasons(self) -> List[int]:
        """Returns a sorted list of unique seasons."""
        df = self.get_team_stats()
        return sorted([int(s) for s in df["season"].unique().tolist()])

    def get_team_history(self, team_name: str) -> List[Dict[str, Any]]:
        """Gets season-by-season stats for a specific team."""
        team_name = normalize_query_team(team_name) or team_name
        df = self.get_team_stats()
        filtered = df[df["team"].str.lower() == team_name.lower()].copy()
        filtered = filtered.sort_values("season", ascending=True)
        # Convert NaN values to None so they serialize to null in JSON
        return clean_records(filtered)

    def get_team_head_to_head(self, team_name: str) -> List[Dict[str, Any]]:
        """Gets all-time head-to-head stats for matchups involving the team."""
        team_name = normalize_query_team(team_name) or team_name
        df = self.get_head_to_head()
        # Find matches where this team is either team_a or team_b
        name_lower = team_name.lower()
        filtered = df[
            (df["team_a"].str.lower() == name_lower) | 
            (df["team_b"].str.lower() == name_lower)
        ].copy()
        
        # Re-orient matches so that the queried team is always "team" and opponent is "opponent"
        records = []
        for _, row in filtered.iterrows():
            is_a = row["team_a"].lower() == name_lower
            records.append({
                "opponent": row["team_b"] if is_a else row["team_a"],
                "matches_played": int(row["total_matches"]),
                "wins": int(row["team_a_wins"] if is_a else row["team_b_wins"]),
                "losses": int(row["team_b_wins"] if is_a else row["team_a_wins"]),
                "no_results": int(row["no_results"]),
                "first_played": str(row["first_played"]),
                "last_played": str(row["last_played"])
            })
        return sorted(records, key=lambda x: x["matches_played"], reverse=True)

    def team_exists(self, team_name: str) -> bool:
        """Checks whether a team or supported historical alias exists."""
        normalized_team = normalize_query_team(team_name)
        if not normalized_team:
            return False

        teams = self.get_all_teams()
        normalized_lower = normalized_team.lower()
        return any(team.lower() == normalized_lower for team in teams)

    # ---------- Player queries --------------------

    def get_all_players(self, search: Optional[str] = None, limit: int = 100) -> List[str]:
        """Returns player names known to the batting, bowling, and POM tables."""
        names = set()
        for df, column in [
            (self.get_player_batting(), "batter"),
            (self.get_player_bowling(), "bowler"),
            (self.get_top_performers(), "player"),
        ]:
            names.update(str(name) for name in df[column].dropna().unique().tolist())

        sorted_names = sorted(names)
        if search:
            search_key = normalize_lookup_text(search)
            sorted_names = [
                name for name in sorted_names
                if search_key in normalize_lookup_text(name)
                or any(
                    search_key in alias_key and canonical == name
                    for alias_key, canonical in PLAYER_ALIASES.items()
                )
            ]
        return sorted_names[:limit]

    def query_batting(self, season: Optional[int] = None, sort_by: str = "total_runs", ascending: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        """Query player batting stats with filtering and sorting."""
        df = self.get_player_batting()
        filtered = df.copy()
        
        if season is not None:
            filtered = filtered[filtered["season"] == season]
        else:
            # Aggregate all-time if season is not specified
            # Group by player (batter)
            filtered = filtered.groupby("batter").agg({
                "matches": "sum",
                "innings": "sum",
                "total_runs": "sum",
                "total_balls": "sum",
                "dismissals": "sum",
                "total_fours": "sum",
                "total_sixes": "sum",
                "fifties": "sum",
                "hundreds": "sum",
                "highest_score": "max"
            }).reset_index()
            
            # Recompute rates/averages
            filtered["strike_rate"] = (filtered["total_runs"] / filtered["total_balls"].replace(0, 1) * 100).round(2)
            filtered["batting_avg"] = (filtered["total_runs"] / filtered["dismissals"].replace(0, 1)).round(2)
            filtered["season"] = "All-Time"
            
        sort_by = validate_sort_column(sort_by, list(filtered.columns), "total_runs")
            
        filtered = filtered.sort_values(sort_by, ascending=ascending)
        top_n = filtered.head(limit)
        return clean_records(top_n)

    def query_bowling(self, season: Optional[int] = None, sort_by: str = "total_wickets", ascending: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        """Query player bowling stats with filtering and sorting."""
        df = self.get_player_bowling()
        filtered = df.copy()
        
        if season is not None:
            filtered = filtered[filtered["season"] == season]
        else:
            # Aggregate all-time if season is not specified
            filtered = filtered.groupby("bowler").agg({
                "matches": "sum",
                "total_balls": "sum",
                "total_runs_conceded": "sum",
                "total_wickets": "sum",
                "total_dots": "sum",
                "four_wkt_hauls": "sum",
                "five_wkt_hauls": "sum"
            }).reset_index()
            
            # Recompute rates/averages
            filtered["overs"] = (filtered["total_balls"] / 6).round(1)
            filtered["economy"] = (filtered["total_runs_conceded"] / (filtered["total_balls"] / 6).replace(0, 1)).round(2)
            filtered["bowling_avg"] = (filtered["total_runs_conceded"] / filtered["total_wickets"].replace(0, 1)).round(2)
            filtered["bowling_sr"] = (filtered["total_balls"] / filtered["total_wickets"].replace(0, 1)).round(2)
            filtered["dot_ball_pct"] = (filtered["total_dots"] / filtered["total_balls"].replace(0, 1) * 100).round(1)
            filtered["season"] = "All-Time"
            
        sort_by = validate_sort_column(sort_by, list(filtered.columns), "total_wickets")
            
        filtered = filtered.sort_values(sort_by, ascending=ascending)
        top_n = filtered.head(limit)
        return clean_records(top_n)

    def get_player_history(self, player_name: str) -> Dict[str, Any]:
        """Gets career seasonal breakdown (batting & bowling) and career totals."""
        bat_df = self.get_player_batting()
        bowl_df = self.get_player_bowling()
        pom_df = self.get_top_performers()

        player_name = normalize_query_player(player_name) or player_name
        lookup_name = normalize_lookup_text(player_name)
        
        p_bat = bat_df[bat_df["batter"].apply(normalize_lookup_text) == lookup_name].copy().sort_values("season")
        p_bowl = bowl_df[bowl_df["bowler"].apply(normalize_lookup_text) == lookup_name].copy().sort_values("season")
        p_pom = pom_df[pom_df["player"].apply(normalize_lookup_text) == lookup_name].copy().sort_values("season")
        
        # Real player name (proper capitalization)
        real_name = player_name
        if not p_bat.empty:
            real_name = p_bat.iloc[0]["batter"]
        elif not p_bowl.empty:
            real_name = p_bowl.iloc[0]["bowler"]
        elif not p_pom.empty:
            real_name = p_pom.iloc[0]["player"]
        else:
            return {}
            
        # Career aggregate batting
        bat_summary = {}
        if not p_bat.empty:
            total_runs = int(p_bat["total_runs"].sum())
            total_balls = int(p_bat["total_balls"].sum())
            total_dismissals = int(p_bat["dismissals"].sum())
            bat_summary = {
                "matches": int(p_bat["matches"].sum()),
                "innings": int(p_bat["innings"].sum()),
                "total_runs": total_runs,
                "total_balls": total_balls,
                "strike_rate": round(total_runs / total_balls * 100, 2) if total_balls > 0 else 0.0,
                "batting_avg": round(total_runs / total_dismissals, 2) if total_dismissals > 0 else float(total_runs),
                "total_fours": int(p_bat["total_fours"].sum()),
                "total_sixes": int(p_bat["total_sixes"].sum()),
                "fifties": int(p_bat["fifties"].sum()),
                "hundreds": int(p_bat["hundreds"].sum()),
                "highest_score": int(p_bat["highest_score"].max())
            }
            
        # Career aggregate bowling
        bowl_summary = {}
        if not p_bowl.empty:
            total_balls_bowled = int(p_bowl["total_balls"].sum())
            total_runs_conceded = int(p_bowl["total_runs_conceded"].sum())
            total_wickets = int(p_bowl["total_wickets"].sum())
            bowl_summary = {
                "matches": int(p_bowl["matches"].sum()),
                "total_balls": total_balls_bowled,
                "overs": round(total_balls_bowled / 6, 1),
                "total_runs_conceded": total_runs_conceded,
                "total_wickets": total_wickets,
                "economy": round(total_runs_conceded / (total_balls_bowled / 6), 2) if total_balls_bowled > 0 else 0.0,
                "bowling_avg": round(total_runs_conceded / total_wickets, 2) if total_wickets > 0 else 0.0,
                "bowling_sr": round(total_balls_bowled / total_wickets, 2) if total_wickets > 0 else 0.0,
                "total_dots": int(p_bowl["total_dots"].sum()),
                "dot_ball_pct": round(p_bowl["total_dots"].sum() / total_balls_bowled * 100, 1) if total_balls_bowled > 0 else 0.0,
                "four_wkt_hauls": int(p_bowl["four_wkt_hauls"].sum()),
                "five_wkt_hauls": int(p_bowl["five_wkt_hauls"].sum())
            }

        pom_summary = {
            "total_pom_awards": int(p_pom["pom_awards"].sum()) if not p_pom.empty else 0,
            "max_impact_score": float(p_pom["impact_score"].max()) if not p_pom.empty else 0.0
        }
            
        return {
            "player": real_name,
            "batting_summary": bat_summary,
            "bowling_summary": bowl_summary,
            "pom_summary": pom_summary,
            "batting_history": clean_records(p_bat),
            "bowling_history": clean_records(p_bowl)
        }

    def query_top_performers(self, season: Optional[int] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Query top performers / impact scores."""
        df = self.get_top_performers()
        filtered = df.copy()
        
        if season is not None:
            filtered = filtered[filtered["season"] == season]
        else:
            # Aggregate all-time POM awards and max impact score
            filtered = filtered.groupby("player").agg({
                "pom_awards": "sum",
                "season_runs": "sum",
                "season_wickets": "sum",
                "impact_score": "max"
            }).reset_index()
            filtered["season"] = "All-Time"
            
        filtered = filtered.sort_values("impact_score", ascending=False)
        top_n = filtered.head(limit)
        return clean_records(top_n)

    # ---------- Venue queries --------------------

    def get_all_venues(self) -> List[str]:
        """Returns unique sorted list of venues."""
        df = self.get_venue_stats()
        return sorted(df["venue"].unique().tolist())

    def query_venues(self, season: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query venue-level stats."""
        df = self.get_venue_stats()
        filtered = df.copy()
        
        if season is not None:
            filtered = filtered[filtered["season"] == season]
        else:
            # Aggregate all-time
            filtered = filtered.groupby("venue").agg({
                "matches_played": "sum",
                "avg_1st_inn_score": "mean",
                "avg_2nd_inn_score": "mean",
                "bat_first_wins": "sum",
                "chase_wins": "sum",
                "highest_total": "max",
                "lowest_total": "min",
                "avg_sixes_per_innings": "mean",
                "avg_fours_per_innings": "mean"
            }).reset_index()
            filtered["avg_1st_inn_score"] = filtered["avg_1st_inn_score"].round(1)
            filtered["avg_2nd_inn_score"] = filtered["avg_2nd_inn_score"].round(1)
            filtered["avg_sixes_per_innings"] = filtered["avg_sixes_per_innings"].round(1)
            filtered["avg_fours_per_innings"] = filtered["avg_fours_per_innings"].round(1)
            filtered["season"] = "All-Time"
            
        filtered = filtered.sort_values("matches_played", ascending=False)
        return clean_records(filtered)

    # ---------- Match queries --------------------

    def query_matches(self, season: Optional[int] = None, team: Optional[str] = None, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get match list with paging and filter options."""
        df = self.get_matches()
        filtered = df.copy()
        
        if season is not None:
            filtered = filtered[filtered["season"] == season]
            
        if team is not None:
            team = normalize_query_team(team) or team
            team_lower = team.lower()
            filtered = filtered[
                (filtered["team1"].str.lower() == team_lower) | 
                (filtered["team2"].str.lower() == team_lower)
            ]
            
        filtered = filtered.sort_values("date", ascending=False)
        total_count = len(filtered)
        
        # Paginate
        page_df = filtered.iloc[offset : offset + limit]
        
        return {
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "matches": clean_records(page_df)
        }

    def get_match_by_id(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get a single match by its ID."""
        df = self.get_matches()
        match_row = df[df["match_id"] == match_id]
        if match_row.empty:
            return None
        record = match_row.iloc[0].to_dict()
        return {key: clean_value(value) for key, value in record.items()}

# Global singleton instance
data_service = DataService()
