"""
Players Router
==============
Provides endpoints for retrieving player batting leaderboards, bowling leaderboards,
impact ratings, and detailed individual career profiles.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from api.data_service import data_service

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)

@router.get("", response_model=List[str])
def list_players(
    search: Optional[str] = Query(None, description="Optional case-insensitive player search text."),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of player names to return.")
):
    """Get player names for frontend search/autocomplete."""
    try:
        return data_service.get_all_players(search=search, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load players: {str(e)}")

@router.get("/batting", response_model=List[Dict[str, Any]])
def get_batting_leaderboard(
    season: Optional[int] = Query(None, description="Filter stats by a specific IPL season. If omitted, aggregates all-time career stats."),
    sort_by: str = Query("total_runs", description="Column to sort by (e.g. total_runs, strike_rate, batting_avg, fifties, hundreds)."),
    ascending: bool = Query(False, description="Sort order. True = ASC, False = DESC."),
    team: Optional[str] = Query(None, description="Filter by batting team/franchise."),
    limit: int = Query(50, ge=1, le=200, description="Number of player records to return.")
):
    """Retrieve batting leaderboard statistics with custom sorting and filters."""
    try:
        return data_service.query_batting(
            season=season,
            sort_by=sort_by,
            ascending=ascending,
            team=team,
            limit=limit,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load batting stats: {str(e)}")

@router.get("/bowling", response_model=List[Dict[str, Any]])
def get_bowling_leaderboard(
    season: Optional[int] = Query(None, description="Filter stats by a specific IPL season. If omitted, aggregates all-time career stats."),
    sort_by: str = Query("total_wickets", description="Column to sort by (e.g. total_wickets, economy, bowling_avg, dot_ball_pct, maiden_overs)."),
    ascending: bool = Query(False, description="Sort order. True = ASC, False = DESC."),
    team: Optional[str] = Query(None, description="Filter by bowling team/franchise."),
    min_overs: Optional[float] = Query(None, ge=0, description="Minimum overs bowled required in the leaderboard."),
    bowling_type: Optional[str] = Query(None, description="Filter by bowling type: All, Pacer, or Spinner."),
    limit: int = Query(50, ge=1, le=200, description="Number of player records to return.")
):
    """Retrieve bowling leaderboard statistics with custom sorting and filters."""
    try:
        return data_service.query_bowling(
            season=season,
            sort_by=sort_by,
            ascending=ascending,
            limit=limit,
            team=team,
            min_overs=min_overs,
            bowling_type=bowling_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load bowling stats: {str(e)}")

@router.get("/top-performers", response_model=List[Dict[str, Any]])
def get_top_performers(
    season: Optional[int] = Query(None, description="Filter stats by a specific IPL season. If omitted, aggregates all-time career stats."),
    limit: int = Query(50, ge=1, le=200, description="Number of player records to return.")
):
    """Retrieve player impact rankings and Player of the Match award leaders."""
    try:
        return data_service.query_top_performers(season=season, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load top performers: {str(e)}")

@router.get("/{player_name}/history", response_model=Dict[str, Any])
def get_player_profile(player_name: str):
    """Retrieve a detailed profile of a player, including career aggregate totals and season-by-season stats."""
    try:
        profile = data_service.get_player_history(player_name)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found.")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading player profile: {str(e)}")
