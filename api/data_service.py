"""
API Data Service
================
Handles high-performance local loading and querying of Parquet files
from the Silver and Gold layers using Pandas and PyArrow.
Caches dataframes in memory for fast response times.
"""

import os
import pandas as pd
from typing import Optional, List, Dict, Any

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
        df = self.get_team_stats()
        filtered = df[df["team"].str.lower() == team_name.lower()].copy()
        filtered = filtered.sort_values("season", ascending=True)
        # Convert NaN values to None so they serialize to null in JSON
        return filtered.where(pd.notnull(filtered), None).to_dict(orient="records")

    def get_team_head_to_head(self, team_name: str) -> List[Dict[str, Any]]:
        """Gets all-time head-to-head stats for matchups involving the team."""
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

# Global singleton instance
data_service = DataService()
