"""
Teams Router
============
Provides endpoints for retrieving team-level lists, season-by-season stats,
historical summary metrics, and head-to-head records.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from api.data_service import data_service

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

@router.get("", response_model=List[str])
def list_teams():
    """Get a list of all unique team names in IPL history."""
    try:
        return data_service.get_all_teams()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load teams: {str(e)}")

@router.get("/seasons", response_model=List[int])
def list_seasons():
    """Get a list of all IPL seasons covered in the dataset."""
    try:
        return data_service.get_all_seasons()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load seasons: {str(e)}")

@router.get("/{team_name}/history", response_model=List[Dict[str, Any]])
def get_team_history(team_name: str):
    """Get season-by-season performance stats for a specific team."""
    try:
        history = data_service.get_team_history(team_name)
        if not history:
            raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found.")
        return history
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading history: {str(e)}")

@router.get("/{team_name}/head-to-head", response_model=List[Dict[str, Any]])
def get_team_head_to_head(team_name: str):
    """Get all-time head-to-head records against all opponents for a specific team."""
    try:
        if not data_service.team_exists(team_name):
            raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found.")
            
        return data_service.get_team_head_to_head(team_name)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading head-to-head: {str(e)}")

@router.get("/{team_name}/summary", response_model=Dict[str, Any])
def get_team_summary(team_name: str):
    """Get aggregate overall career stats and titles summary for a specific team."""
    try:
        history = data_service.get_team_history(team_name)
        if not history:
            raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found.")
            
        # Aggregate stats across all seasons
        total_played = sum(h["matches_played"] for h in history if h["matches_played"] is not None)
        total_wins = sum(h["wins"] for h in history if h["wins"] is not None)
        total_losses = sum(h["losses"] for h in history if h["losses"] is not None)
        total_no_results = sum(h["no_results"] for h in history if h["no_results"] is not None)
        total_toss_wins = sum(h["toss_wins"] for h in history if h["toss_wins"] is not None)
        total_titles = sum(h["titles_won"] for h in history if h["titles_won"] is not None)
        
        total_runs_scored = sum(h["total_runs_scored"] for h in history if h["total_runs_scored"] is not None)
        total_runs_conceded = sum(h["total_runs_conceded"] for h in history if h["total_runs_conceded"] is not None)
        total_sixes = sum(h["total_sixes"] for h in history if h["total_sixes"] is not None)
        total_fours = sum(h["total_fours"] for h in history if h["total_fours"] is not None)
        total_wickets_taken = sum(h["total_wickets_taken"] for h in history if h["total_wickets_taken"] is not None)
        
        highest_score = max(h["highest_score"] for h in history if h["highest_score"] is not None)
        lowest_score = min(h["lowest_score"] for h in history if h["lowest_score"] is not None)
        
        win_pct = round(total_wins / total_played * 100, 2) if total_played > 0 else 0.0
        
        # Collect list of years when titles were won
        title_years = [h["season"] for h in history if h["titles_won"] is not None and h["titles_won"] > 0]

        return {
            "team": history[0]["team"],
            "seasons_active": len(history),
            "matches_played": total_played,
            "wins": total_wins,
            "losses": total_losses,
            "no_results": total_no_results,
            "win_pct": win_pct,
            "toss_wins": total_toss_wins,
            "titles_won": total_titles,
            "title_years": title_years,
            "total_runs_scored": total_runs_scored,
            "total_runs_conceded": total_runs_conceded,
            "total_sixes": total_sixes,
            "total_fours": total_fours,
            "total_wickets_taken": total_wickets_taken,
            "highest_score": highest_score,
            "lowest_score": lowest_score
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating team summary: {str(e)}")
