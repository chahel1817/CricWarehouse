"""
Matches Router
==============
Provides endpoints for listing, filtering, and paging matches, as well as
retrieving individual match information.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from api.data_service import data_service

router = APIRouter(
    prefix="/matches",
    tags=["Matches"]
)

@router.get("", response_model=Dict[str, Any])
def list_matches(
    season: Optional[int] = Query(None, description="Filter matches by season."),
    team: Optional[str] = Query(None, description="Filter matches involving a specific team."),
    limit: int = Query(20, ge=1, le=100, description="Number of match records to return per page."),
    offset: int = Query(0, ge=0, description="Offset for pagination.")
):
    """Retrieve a list of matches sorted by date descending, supporting filtering by season, team, and pagination."""
    try:
        return data_service.query_matches(season=season, team=team, limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load matches: {str(e)}")

@router.get("/{match_id}", response_model=Dict[str, Any])
def get_match(match_id: int):
    """Retrieve detailed outcome information for a specific match ID."""
    try:
        match_info = data_service.get_match_by_id(match_id)
        if not match_info:
            raise HTTPException(
                status_code=404,
                detail=f"Match with ID {match_id} not found. Use /matches?limit=10 to discover valid match_id values."
            )
        return match_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading match: {str(e)}")
