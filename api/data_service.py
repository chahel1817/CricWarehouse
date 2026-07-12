"""
API Data Service
================
Handles high-performance local loading and querying of Parquet files
from the Silver and Gold layers using Pandas and PyArrow.
Caches dataframes in memory for fast response times.
"""

import os
import pandas as pd
import numpy as np
from pandas.api.types import is_scalar
from typing import Optional, List, Dict, Any

PLAYER_ALIASES = {
    "viratkohli": "V Kohli",
}

BOWLING_TYPE_OVERRIDES = {
    # Pace / seam
    "A Nehra": "Pacer",
    "AB Dinda": "Pacer",
    "B Kumar": "Pacer",
    "CH Morris": "Pacer",
    "CRD Fernando": "Pacer",
    "DJ Bravo": "Pacer",
    "DP Nannes": "Pacer",
    "DS Kulkarni": "Pacer",
    "DW Steyn": "Pacer",
    "Harshal Patel": "Pacer",
    "I Sharma": "Pacer",
    "IK Pathan": "Pacer",
    "J Archer": "Pacer",
    "JD Unadkat": "Pacer",
    "JJ Bumrah": "Pacer",
    "JP Faulkner": "Pacer",
    "K Rabada": "Pacer",
    "L Balaji": "Pacer",
    "LH Ferguson": "Pacer",
    "M Morkel": "Pacer",
    "MA Starc": "Pacer",
    "MM Sharma": "Pacer",
    "Mohammed Shami": "Pacer",
    "Mohammed Siraj": "Pacer",
    "Mustafizur Rahman": "Pacer",
    "P Kumar": "Pacer",
    "RP Singh": "Pacer",
    "S Sandeep Warrier": "Pacer",
    "S Sreesanth": "Pacer",
    "SL Malinga": "Pacer",
    "SP Narine": "Spinner",
    "SR Watson": "Pacer",
    "TA Boult": "Pacer",
    "UT Yadav": "Pacer",
    "VR Aaron": "Pacer",
    "Z Khan": "Pacer",
    # Spin
    "A Mishra": "Spinner",
    "AR Patel": "Spinner",
    "Bishnoi": "Spinner",
    "CV Varun": "Spinner",
    "Harbhajan Singh": "Spinner",
    "Imran Tahir": "Spinner",
    "Kuldeep Yadav": "Spinner",
    "M Muralitharan": "Spinner",
    "PP Chawla": "Spinner",
    "R Ashwin": "Spinner",
    "RA Jadeja": "Spinner",
    "RD Chahar": "Spinner",
    "Rashid Khan": "Spinner",
    "S Badree": "Spinner",
    "S Nadeem": "Spinner",
    "Shakib Al Hasan": "Spinner",
    "SK Raina": "Spinner",
    "SK Warne": "Spinner",
    "Washington Sundar": "Spinner",
    "YBK Jaiswal": "Spinner",
    "YS Chahal": "Spinner",
}

PACE_HINTS = (
    "kumar", "shami", "siraj", "bumrah", "malinga", "boult", "starc", "steyn",
    "morkel", "rabada", "archer", "umesh", "ishant", "nehra", "natarajan",
    "unadkat", "sandeep", "thakur", "ferguson", "mustafizur", "pathirana",
)

SPIN_HINTS = (
    "ashwin", "chahal", "chawla", "mishra", "jadeja", "narine", "rashid",
    "kuldeep", "harbhajan", "warne", "tahir", "axar", "bishnoi", "varun",
    "sundar", "shakib", "muralitharan", "gopal", "nadeem",
)

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

def classify_bowling_type(player_name: str) -> str:
    """Best-effort bowling type classification for analytics filtering."""
    if player_name in BOWLING_TYPE_OVERRIDES:
        return BOWLING_TYPE_OVERRIDES[player_name]

    compact = normalize_lookup_text(player_name)
    if any(hint in compact for hint in SPIN_HINTS):
        return "Spinner"
    if any(hint in compact for hint in PACE_HINTS):
        return "Pacer"
    return "Unknown"

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

    def get_deliveries(self) -> pd.DataFrame:
        return self._get_df("silver", "deliveries")

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

    def _query_batting_from_deliveries(self, season: Optional[int] = None, team: Optional[str] = None) -> pd.DataFrame:
        """Build batting stats from silver deliveries when team filtering is needed."""
        deliveries = self.get_deliveries().copy()

        if season is not None:
            deliveries = deliveries[deliveries["season"] == season]

        if team is not None:
            normalized_team = normalize_query_team(team) or team
            deliveries = deliveries[deliveries["batting_team"].str.lower() == normalized_team.lower()]

        if deliveries.empty:
            return pd.DataFrame(columns=[
                "batter", "matches", "innings", "total_runs", "total_balls",
                "total_fours", "total_sixes", "highest_score", "dismissals",
                "not_outs", "fifties", "hundreds", "batting_avg", "strike_rate",
                "season", "total_boundaries",
            ])

        balls = deliveries[deliveries["is_wide"] == False].copy()
        batting_card = balls.groupby(
            ["match_id", "season", "innings_number", "batter"], dropna=False
        ).agg(
            runs=("batter_runs", "sum"),
            balls_faced=("batter_runs", "count"),
            fours=("batter_runs", lambda s: int((s == 4).sum())),
            sixes=("batter_runs", lambda s: int((s == 6).sum())),
        ).reset_index()

        dismissals = deliveries[deliveries["is_wicket"] == True][
            ["match_id", "innings_number", "player_out"]
        ].drop_duplicates().rename(columns={"player_out": "batter"})
        dismissals["was_dismissed"] = True

        batting_card = batting_card.merge(
            dismissals,
            on=["match_id", "innings_number", "batter"],
            how="left",
        )
        batting_card["is_out"] = batting_card["was_dismissed"].fillna(False).astype(bool)

        grouped = batting_card.groupby("batter", dropna=False).agg(
            matches=("match_id", "nunique"),
            innings=("match_id", "count"),
            total_runs=("runs", "sum"),
            total_balls=("balls_faced", "sum"),
            total_fours=("fours", "sum"),
            total_sixes=("sixes", "sum"),
            highest_score=("runs", "max"),
            dismissals=("is_out", "sum"),
            not_outs=("is_out", lambda s: int((~s).sum())),
            fifties=("runs", lambda s: int(((s >= 50) & (s < 100)).sum())),
            hundreds=("runs", lambda s: int((s >= 100).sum())),
        ).reset_index()

        grouped["strike_rate"] = (grouped["total_runs"] / grouped["total_balls"].replace(0, np.nan) * 100).round(2)
        grouped["batting_avg"] = (grouped["total_runs"] / grouped["dismissals"].replace(0, np.nan)).round(2)
        grouped["batting_avg"] = grouped["batting_avg"].fillna(grouped["total_runs"])
        grouped["season"] = season if season is not None else "All-Time"
        grouped["total_boundaries"] = grouped["total_fours"] + grouped["total_sixes"]
        if team is not None:
            grouped["team"] = normalize_query_team(team) or team
        return grouped

    def query_batting(
        self,
        season: Optional[int] = None,
        sort_by: str = "total_runs",
        ascending: bool = False,
        limit: int = 50,
        team: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query player batting stats with filtering and sorting."""
        if team is not None:
            filtered = self._query_batting_from_deliveries(season=season, team=team)
        else:
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

            filtered["total_boundaries"] = filtered["total_fours"] + filtered["total_sixes"]
            
        sort_by = validate_sort_column(sort_by, list(filtered.columns), "total_runs")
            
        filtered = filtered.sort_values(sort_by, ascending=ascending)
        top_n = filtered.head(limit)
        return clean_records(top_n)

    def _query_bowling_from_deliveries(self, season: Optional[int] = None, team: Optional[str] = None) -> pd.DataFrame:
        """Build bowling stats from silver deliveries when derived filters are needed."""
        deliveries = self.get_deliveries().copy()

        if season is not None:
            deliveries = deliveries[deliveries["season"] == season]

        matches = self.get_matches()[["match_id", "team1", "team2"]].drop_duplicates("match_id")
        deliveries = deliveries.merge(matches, on="match_id", how="left")
        deliveries["bowling_team"] = np.where(
            deliveries["batting_team"] == deliveries["team1"],
            deliveries["team2"],
            deliveries["team1"],
        )

        if team is not None:
            normalized_team = normalize_query_team(team) or team
            deliveries = deliveries[deliveries["bowling_team"].str.lower() == normalized_team.lower()]

        if deliveries.empty:
            return pd.DataFrame(columns=[
                "bowler", "matches", "total_balls", "total_runs_conceded",
                "total_wickets", "total_dots", "best_wickets_in_match",
                "four_wkt_hauls", "five_wkt_hauls", "maiden_overs",
                "overs", "economy", "bowling_avg", "bowling_sr", "dot_ball_pct",
                "season",
            ])

        deliveries["bowler_runs"] = deliveries["total_runs"] - deliveries["legbyes"] - deliveries["byes"]
        deliveries["is_legal"] = ~(deliveries["is_wide"].astype(bool) | deliveries["is_noball"].astype(bool))
        excluded_dismissals = {"run out", "retired hurt", "retired out", "obstructing the field"}
        deliveries["credited_wicket"] = deliveries["is_wicket"].astype(bool) & ~deliveries["dismissal_kind"].isin(excluded_dismissals)
        deliveries["dot_ball"] = deliveries["bowler_runs"] == 0

        spell = deliveries.groupby(["match_id", "season", "bowler"], dropna=False).agg(
            runs_conceded=("bowler_runs", "sum"),
            wickets=("credited_wicket", "sum"),
            dots=("dot_ball", "sum"),
            legal_balls=("is_legal", "sum"),
        ).reset_index()

        over_summary = deliveries.groupby(["match_id", "season", "bowler", "over_number"], dropna=False).agg(
            over_runs=("bowler_runs", "sum"),
            legal_balls=("is_legal", "sum"),
        ).reset_index()
        maiden_summary = over_summary[
            (over_summary["legal_balls"] == 6) & (over_summary["over_runs"] == 0)
        ].groupby(["match_id", "season", "bowler"], dropna=False).size().reset_index(name="maidens")

        spell = spell.merge(maiden_summary, on=["match_id", "season", "bowler"], how="left")
        spell["maidens"] = spell["maidens"].fillna(0).astype(int)

        grouped = spell.groupby("bowler", dropna=False).agg(
            matches=("match_id", "nunique"),
            total_balls=("legal_balls", "sum"),
            total_runs_conceded=("runs_conceded", "sum"),
            total_wickets=("wickets", "sum"),
            total_dots=("dots", "sum"),
            best_wickets_in_match=("wickets", "max"),
            four_wkt_hauls=("wickets", lambda s: int((s >= 4).sum())),
            five_wkt_hauls=("wickets", lambda s: int((s >= 5).sum())),
            maiden_overs=("maidens", "sum"),
        ).reset_index()

        grouped["overs"] = (grouped["total_balls"] / 6).round(1)
        grouped["economy"] = (grouped["total_runs_conceded"] / (grouped["total_balls"] / 6).replace(0, np.nan)).round(2)
        grouped["bowling_avg"] = (grouped["total_runs_conceded"] / grouped["total_wickets"].replace(0, np.nan)).round(2)
        grouped["bowling_sr"] = (grouped["total_balls"] / grouped["total_wickets"].replace(0, np.nan)).round(2)
        grouped["dot_ball_pct"] = (grouped["total_dots"] / grouped["total_balls"].replace(0, np.nan) * 100).round(1)
        grouped["season"] = season if season is not None else "All-Time"
        if team is not None:
            grouped["team"] = normalize_query_team(team) or team
        return grouped

    def query_bowling(
        self,
        season: Optional[int] = None,
        sort_by: str = "total_wickets",
        ascending: bool = False,
        limit: int = 50,
        team: Optional[str] = None,
        min_overs: Optional[float] = None,
        bowling_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Query player bowling stats with filtering and sorting."""
        filtered = self._query_bowling_from_deliveries(season=season, team=team)
        filtered["bowling_type"] = filtered["bowler"].apply(classify_bowling_type)

        if min_overs is not None:
            filtered = filtered[filtered["overs"] >= min_overs]

        if bowling_type and bowling_type.lower() != "all":
            valid_types = {"pacer": "Pacer", "spinner": "Spinner"}
            normalized_type = valid_types.get(bowling_type.lower())
            if normalized_type is None:
                raise ValueError("Invalid bowling_type. Valid values are: All, Pacer, Spinner")
            filtered = filtered[filtered["bowling_type"] == normalized_type]
            
        sort_by = validate_sort_column(sort_by, list(filtered.columns), "total_wickets")
            
        filtered = filtered.sort_values(sort_by, ascending=ascending)
        top_n = filtered.head(limit)
        return clean_records(top_n)

    def _classify_player_role(self, player_name: str, bat_summary: Dict, bowl_summary: Dict) -> str:
        """Classify player role based on career stats ratios."""
        has_bat = bool(bat_summary and bat_summary.get("matches", 0) > 0)
        has_bowl = bool(bowl_summary and bowl_summary.get("matches", 0) > 0)

        if not has_bat and not has_bowl:
            return "UNKNOWN"
        if not has_bowl:
            return "BATSMAN"
        if not has_bat:
            return "BOWLER"

        bat_matches = bat_summary.get("matches", 0)
        bowl_matches = bowl_summary.get("matches", 0)
        total_runs = bat_summary.get("total_runs", 0)
        total_wickets = bowl_summary.get("total_wickets", 0)
        batting_avg = bat_summary.get("batting_avg", 0)
        innings = bat_summary.get("innings", 0)

        # Known wicketkeepers
        wk_names = {"MS Dhoni", "KD Karthik", "Q de Kock", "RR Pant", "KL Rahul",
                     "W Saha", "PP Shaw", "RV Uthappa", "N Rana", "SV Samson",
                     "JC Buttler", "AB de Villiers", "KS Bharat", "Ishan Kishan"}
        if player_name in wk_names:
            return "WK-BATSMAN"

        # Pure bowler: high bowling matches, low batting contribution
        if bowl_matches > bat_matches * 0.8 and total_runs < 500 and total_wickets > 30:
            return "BOWLER"

        # Pure batsman: very few wickets
        if total_wickets < 10 and total_runs > 500:
            return "BATSMAN"

        # All-rounder: significant contributions in both
        if total_runs > 1000 and total_wickets > 30:
            return "ALL-ROUNDER"
        if batting_avg > 20 and total_wickets > 20 and innings > 30:
            return "ALL-ROUNDER"

        # Bowling all-rounder (bowls primarily, but bats a bit)
        if total_wickets > total_runs / 20:
            return "BOWLER"

        return "BATSMAN"

    def _get_player_current_team(self, player_name: str) -> Optional[str]:
        """Find the most recent team a player played for."""
        deliveries = self.get_deliveries()
        matches = self.get_matches()

        # Find matches where player batted or bowled
        player_match_ids = set()
        bat_matches = deliveries[deliveries["batter"] == player_name]["match_id"].unique()
        bowl_matches = deliveries[deliveries["bowler"] == player_name]["match_id"].unique()
        player_match_ids = set(bat_matches) | set(bowl_matches)

        if not player_match_ids:
            return None

        player_matches = matches[matches["match_id"].isin(player_match_ids)].sort_values("date", ascending=False)
        if player_matches.empty:
            return None

        latest_match = player_matches.iloc[0]
        latest_match_id = latest_match["match_id"]

        # Check which team the player was on in that match
        latest_deliveries = deliveries[deliveries["match_id"] == latest_match_id]
        bat_team = latest_deliveries[latest_deliveries["batter"] == player_name]["batting_team"].values
        if len(bat_team) > 0:
            return str(bat_team[0])

        # Derive bowling team (opposite of batting_team)
        bowl_rows = latest_deliveries[latest_deliveries["bowler"] == player_name]
        if not bowl_rows.empty:
            batting_team_when_bowling = bowl_rows.iloc[0]["batting_team"]
            t1, t2 = str(latest_match["team1"]), str(latest_match["team2"])
            return t2 if str(batting_team_when_bowling) == t1 else t1

        return None

    def _get_career_bests(self, player_name: str) -> Dict[str, Any]:
        """Get best batting and bowling performances with opponent info."""
        deliveries = self.get_deliveries()
        matches = self.get_matches()

        result = {}

        # Best batting score
        bat_deliveries = deliveries[deliveries["batter"] == player_name].copy()
        if not bat_deliveries.empty:
            non_wide = bat_deliveries[bat_deliveries["is_wide"] == False]
            match_runs = non_wide.groupby(["match_id", "season"]).agg(
                runs=("batter_runs", "sum")
            ).reset_index()
            if not match_runs.empty:
                best_idx = match_runs["runs"].idxmax()
                best_row = match_runs.loc[best_idx]
                best_match_id = best_row["match_id"]
                # Find opponent
                match_info = matches[matches["match_id"] == best_match_id]
                if not match_info.empty:
                    m = match_info.iloc[0]
                    batting_team = bat_deliveries[bat_deliveries["match_id"] == best_match_id]["batting_team"].iloc[0]
                    opponent = m["team2"] if str(batting_team) == str(m["team1"]) else m["team1"]
                    result["best_batting"] = {
                        "runs": int(best_row["runs"]),
                        "vs": self._team_abbreviation(str(opponent)),
                        "season": int(best_row["season"])
                    }

        # Best bowling figures
        bowl_deliveries = deliveries[deliveries["bowler"] == player_name].copy()
        if not bowl_deliveries.empty:
            excluded = {"run out", "retired hurt", "retired out", "obstructing the field"}
            bowl_deliveries["credited_wicket"] = (
                bowl_deliveries["is_wicket"].astype(bool) &
                ~bowl_deliveries["dismissal_kind"].isin(excluded)
            )
            bowl_deliveries["bowler_runs"] = (
                bowl_deliveries["total_runs"] - bowl_deliveries["legbyes"] - bowl_deliveries["byes"]
            )
            match_bowling = bowl_deliveries.groupby(["match_id", "season"]).agg(
                wickets=("credited_wicket", "sum"),
                runs_conceded=("bowler_runs", "sum"),
            ).reset_index()
            if not match_bowling.empty and match_bowling["wickets"].max() > 0:
                # Best by wickets, then by fewest runs
                match_bowling = match_bowling.sort_values(
                    ["wickets", "runs_conceded"], ascending=[False, True]
                )
                best_row = match_bowling.iloc[0]
                best_match_id = best_row["match_id"]
                match_info = matches[matches["match_id"] == best_match_id]
                if not match_info.empty:
                    m = match_info.iloc[0]
                    bowling_bat_team = bowl_deliveries[bowl_deliveries["match_id"] == best_match_id]["batting_team"].iloc[0]
                    opponent = str(bowling_bat_team)
                    result["best_bowling"] = {
                        "wickets": int(best_row["wickets"]),
                        "runs": int(best_row["runs_conceded"]),
                        "vs": self._team_abbreviation(opponent),
                        "season": int(best_row["season"])
                    }

        return result

    def _get_win_contribution(self, player_name: str, role: str) -> Optional[Dict[str, Any]]:
        """Calculate win contribution: % of matches won when player performed well."""
        deliveries = self.get_deliveries()
        matches = self.get_matches()

        if role in ("BOWLER", "ALL-ROUNDER"):
            # Wicket-based: matches where player took 2+ wickets
            excluded = {"run out", "retired hurt", "retired out", "obstructing the field"}
            bowl_del = deliveries[deliveries["bowler"] == player_name].copy()
            if bowl_del.empty:
                return None
            bowl_del["credited_wicket"] = (
                bowl_del["is_wicket"].astype(bool) &
                ~bowl_del["dismissal_kind"].isin(excluded)
            )
            match_wickets = bowl_del.groupby("match_id")["credited_wicket"].sum().reset_index()
            threshold_matches = match_wickets[match_wickets["credited_wicket"] >= 2]["match_id"].values
            if len(threshold_matches) == 0:
                return None

            # Find which team player was on
            threshold_match_data = matches[matches["match_id"].isin(threshold_matches)]
            wins = 0
            total = len(threshold_match_data)
            for _, m in threshold_match_data.iterrows():
                # Determine player's team
                bat_team_rows = bowl_del[bowl_del["match_id"] == m["match_id"]]["batting_team"]
                if bat_team_rows.empty:
                    continue
                opponent = str(bat_team_rows.iloc[0])
                player_team = m["team2"] if opponent == str(m["team1"]) else m["team1"]
                if str(m["winner"]) == str(player_team):
                    wins += 1

            if total == 0:
                return None
            return {
                "stat": f"Team won {round(wins / total * 100)}% of matches where {player_name} took 2+ wickets",
                "wins": wins,
                "total": total,
                "pct": round(wins / total * 100)
            }
        else:
            # Batting-based: matches where player scored 30+
            bat_del = deliveries[deliveries["batter"] == player_name].copy()
            if bat_del.empty:
                return None
            non_wide = bat_del[bat_del["is_wide"] == False]
            match_runs = non_wide.groupby("match_id")["batter_runs"].sum().reset_index()
            threshold_matches = match_runs[match_runs["batter_runs"] >= 30]["match_id"].values
            if len(threshold_matches) == 0:
                return None

            threshold_match_data = matches[matches["match_id"].isin(threshold_matches)]
            wins = 0
            total = len(threshold_match_data)
            for _, m in threshold_match_data.iterrows():
                bat_team_rows = bat_del[bat_del["match_id"] == m["match_id"]]["batting_team"]
                if bat_team_rows.empty:
                    continue
                player_team = str(bat_team_rows.iloc[0])
                if str(m["winner"]) == player_team:
                    wins += 1

            if total == 0:
                return None
            return {
                "stat": f"Team won {round(wins / total * 100)}% of matches where {player_name} scored 30+",
                "wins": wins,
                "total": total,
                "pct": round(wins / total * 100)
            }

    def _get_head_to_head_vs_teams(self, player_name: str, role: str) -> List[Dict[str, Any]]:
        """Get wickets or runs per opponent team."""
        deliveries = self.get_deliveries()

        if role in ("BOWLER", "ALL-ROUNDER"):
            bowl_del = deliveries[deliveries["bowler"] == player_name].copy()
            if bowl_del.empty:
                return []
            excluded = {"run out", "retired hurt", "retired out", "obstructing the field"}
            bowl_del["credited_wicket"] = (
                bowl_del["is_wicket"].astype(bool) &
                ~bowl_del["dismissal_kind"].isin(excluded)
            )
            team_stats = bowl_del.groupby("batting_team").agg(
                wickets=("credited_wicket", "sum"),
                matches=("match_id", "nunique"),
            ).reset_index()
            team_stats = team_stats.sort_values("wickets", ascending=False)
            return [
                {
                    "team": self._team_abbreviation(str(row["batting_team"])),
                    "team_full": str(row["batting_team"]),
                    "value": int(row["wickets"]),
                    "label": "wickets",
                    "matches": int(row["matches"]),
                }
                for _, row in team_stats.iterrows()
                if int(row["wickets"]) > 0
            ]
        else:
            bat_del = deliveries[deliveries["batter"] == player_name].copy()
            if bat_del.empty:
                return []
            # Need to find bowling team (opponent)
            matches_df = self.get_matches()[["match_id", "team1", "team2"]].drop_duplicates("match_id")
            bat_del = bat_del.merge(matches_df, on="match_id", how="left")
            bat_del["bowling_team"] = np.where(
                bat_del["batting_team"] == bat_del["team1"],
                bat_del["team2"],
                bat_del["team1"]
            )
            non_wide = bat_del[bat_del["is_wide"] == False]
            team_stats = non_wide.groupby("bowling_team").agg(
                runs=("batter_runs", "sum"),
                matches=("match_id", "nunique"),
            ).reset_index()
            team_stats = team_stats.sort_values("runs", ascending=False)
            return [
                {
                    "team": self._team_abbreviation(str(row["bowling_team"])),
                    "team_full": str(row["bowling_team"]),
                    "value": int(row["runs"]),
                    "label": "runs",
                    "matches": int(row["matches"]),
                }
                for _, row in team_stats.iterrows()
                if int(row["runs"]) > 0
            ]

    def _team_abbreviation(self, team_name: str) -> str:
        """Convert full team name to abbreviation."""
        abbrevs = {
            "Chennai Super Kings": "CSK",
            "Mumbai Indians": "MI",
            "Royal Challengers Bengaluru": "RCB",
            "Royal Challengers Bangalore": "RCB",
            "Kolkata Knight Riders": "KKR",
            "Delhi Capitals": "DC",
            "Delhi Daredevils": "DC",
            "Rajasthan Royals": "RR",
            "Punjab Kings": "PBKS",
            "Kings XI Punjab": "PBKS",
            "Sunrisers Hyderabad": "SRH",
            "Deccan Chargers": "DC*",
            "Gujarat Titans": "GT",
            "Lucknow Super Giants": "LSG",
            "Rising Pune Supergiant": "RPS",
            "Rising Pune Supergiants": "RPS",
            "Pune Warriors": "PWI",
            "Kochi Tuskers Kerala": "KTK",
            "Gujarat Lions": "GL",
        }
        return abbrevs.get(team_name, team_name[:3].upper())

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

        # --- Enhanced profile data ---
        
        # Role classification
        role = self._classify_player_role(real_name, bat_summary, bowl_summary)

        # Current team
        current_team = self._get_player_current_team(real_name)
        current_team_abbr = self._team_abbreviation(current_team) if current_team else None

        # Seasons active
        all_seasons = set()
        if not p_bat.empty:
            all_seasons.update(int(s) for s in p_bat["season"].unique())
        if not p_bowl.empty:
            all_seasons.update(int(s) for s in p_bowl["season"].unique())
        seasons_list = sorted(all_seasons)
        first_season = seasons_list[0] if seasons_list else None
        last_season = seasons_list[-1] if seasons_list else None
        total_seasons = len(seasons_list)

        # Career best performances
        career_bests = self._get_career_bests(real_name)

        # Win contribution
        win_contribution = self._get_win_contribution(real_name, role)

        # Head-to-head vs teams
        head_to_head = self._get_head_to_head_vs_teams(real_name, role)
            
        return {
            "player": real_name,
            "role": role,
            "current_team": current_team,
            "current_team_abbr": current_team_abbr,
            "first_season": first_season,
            "last_season": last_season,
            "total_seasons": total_seasons,
            "career_bests": career_bests,
            "win_contribution": win_contribution,
            "head_to_head": head_to_head[:10],  # Top 10 opponents
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

    def get_venue_details(self, venue_name: str) -> Dict[str, Any]:
        """Calculates dynamic stats for a specific venue (most wins, toss winner win rate, top batsman)."""
        matches_df = self._get_df("silver", "matches")
        deliveries_df = self._get_df("silver", "deliveries")
        
        # Standardize venue name in lookup
        venue_mapping = {
            "Eden Gardens, Kolkata": "Eden Gardens",
            "Wankhede Stadium, Mumbai": "Wankhede Stadium",
            "M.Chinnaswamy Stadium": "M Chinnaswamy Stadium",
            "M Chinnaswamy Stadium, Bengaluru": "M Chinnaswamy Stadium",
            "MA Chidambaram Stadium, Chepauk, Chennai": "MA Chidambaram Stadium, Chepauk",
            "MA Chidambaram Stadium": "MA Chidambaram Stadium, Chepauk",
            "Rajiv Gandhi International Stadium, Uppal, Hyderabad": "Rajiv Gandhi International Stadium, Uppal",
            "Rajiv Gandhi International Stadium": "Rajiv Gandhi International Stadium, Uppal",
            "Sawai Mansingh Stadium, Jaipur": "Sawai Mansingh Stadium",
            "Punjab Cricket Association IS Bindra Stadium, Mohali": "Punjab Cricket Association Stadium, Mohali",
            "Punjab Cricket Association IS Bindra Stadium, Mohali, Chandigarh": "Punjab Cricket Association Stadium, Mohali",
            "Punjab Cricket Association IS Bindra Stadium": "Punjab Cricket Association Stadium, Mohali",
            "Punjab Cricket Association Stadium, Mohali": "Punjab Cricket Association Stadium, Mohali",
            "Dr DY Patil Sports Academy, Mumbai": "Dr DY Patil Sports Academy",
            "Brabourne Stadium, Mumbai": "Brabourne Stadium",
            "Maharashtra Cricket Association Stadium, Pune": "Maharashtra Cricket Association Stadium",
            "Arun Jaitley Stadium, Delhi": "Arun Jaitley Stadium",
            "Feroz Shah Kotla": "Arun Jaitley Stadium",
            "Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam": "Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium",
            "Maharaja Yadavindra Singh International Cricket Stadium, New Chandigarh": "Maharaja Yadavindra Singh International Cricket Stadium",
            "Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur": "Maharaja Yadavindra Singh International Cricket Stadium",
            "Himachal Pradesh Cricket Association Stadium, Dharamsala": "Himachal Pradesh Cricket Association Stadium",
            "Shaheed Veer Narayan Singh International Stadium, Raipur": "Shaheed Veer Narayan Singh International Stadium",
            "Zayed Cricket Stadium, Abu Dhabi": "Sheikh Zayed Stadium"
        }
        
        # Filter matches at this venue (standardizing in matches df)
        v_matches = matches_df[matches_df["venue"].map(lambda x: venue_mapping.get(x, x)) == venue_name]
        
        if len(v_matches) == 0:
            # Fallback if no exact match found
            v_matches = matches_df[matches_df["venue"] == venue_name]
            
        # 1. Team with most wins
        win_counts = v_matches["winner"].value_counts()
        most_wins_team = "N/A"
        most_wins_count = 0
        if len(win_counts) > 0:
            raw_team = win_counts.index[0]
            most_wins_count = int(win_counts.values[0])
            
            # Use abbreviation
            team_abbreviations = {
                "Kolkata Knight Riders": "KKR",
                "Mumbai Indians": "MI",
                "Royal Challengers Bengaluru": "RCB",
                "Royal Challengers Bangalore": "RCB",
                "Chennai Super Kings": "CSK",
                "Delhi Capitals": "DC",
                "Delhi Daredevils": "DC",
                "Rajasthan Royals": "RR",
                "Punjab Kings": "PBKS",
                "Kings XI Punjab": "PBKS",
                "Sunrisers Hyderabad": "SRH",
                "Deccan Chargers": "SRH",
                "Gujarat Titans": "GT",
                "Lucknow Super Giants": "LSG",
                "Rising Pune Supergiant": "RPS",
                "Rising Pune Supergiants": "RPS",
                "Kochi Tuskers Kerala": "KTK",
                "Pune Warriors": "PWI"
            }
            most_wins_team = team_abbreviations.get(raw_team, raw_team)
            
        # 2. Toss winner win rate
        toss_winner_matches = v_matches[v_matches["toss_winner"] == v_matches["winner"]]
        toss_win_pct = 0
        if len(v_matches) > 0:
            toss_win_pct = round((len(toss_winner_matches) / len(v_matches)) * 100)
            
        # 3. Top run scorer
        v_match_ids = v_matches["match_id"].tolist()
        v_deliveries = deliveries_df[deliveries_df["match_id"].isin(v_match_ids)]
        runs_by_batter = v_deliveries.groupby("batter")["batter_runs"].sum().reset_index()
        top_batter = "N/A"
        top_runs = 0
        if len(runs_by_batter) > 0:
            runs_by_batter = runs_by_batter.sort_values("batter_runs", ascending=False)
            top_batter = runs_by_batter.iloc[0]["batter"]
            top_runs = int(runs_by_batter.iloc[0]["batter_runs"])
            
        # 4. Season by season average scores for visual chart!
        gold_venue_stats = self._get_df("gold", "venue_stats")
        venue_seasons = gold_venue_stats[gold_venue_stats["venue"] == venue_name].sort_values("season")
        
        chart_data = []
        for _, row in venue_seasons.iterrows():
            try:
                season_val = int(row["season"])
                chart_data.append({
                    "season": season_val,
                    "avg_1st_inn": float(row["avg_1st_inn_score"]),
                    "avg_2nd_inn": float(row["avg_2nd_inn_score"]),
                    "matches": int(row["matches_played"])
                })
            except:
                continue
                
        return {
            "venue": venue_name,
            "most_wins_team": most_wins_team,
            "most_wins_count": most_wins_count,
            "toss_win_pct": toss_win_pct,
            "top_batter": top_batter,
            "top_runs": top_runs,
            "chart_data": chart_data
        }

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
