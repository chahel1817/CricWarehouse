"""
Venues Router
=============
Provides endpoints for retrieving venue-level match averages, win distributions
(batting first vs chasing), boundary aggregates, and run scores.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from api.data_service import data_service

router = APIRouter(
    prefix="/venues",
    tags=["Venues"]
)

@router.get("", response_model=List[str])
def list_venues():
    """Get a list of all unique stadium venue names in IPL history."""
    try:
        return data_service.get_all_venues()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load venues: {str(e)}")

@router.get("/stats", response_model=List[Dict[str, Any]])
def get_venue_stats(
    season: Optional[int] = Query(None, description="Filter stats by a specific IPL season. If omitted, aggregates all-time stats.")
):
    """Retrieve stadium venue statistics, including averages, high/low scores, and batting first vs. chasing win counts."""
    try:
        return data_service.query_venues(season=season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load venue stats: {str(e)}")

@router.get("/details", response_model=Dict[str, Any])
def get_venue_details(
    venue: str = Query(..., description="The name of the venue to retrieve details for.")
):
    """Retrieve dynamic stats for a specific venue (most wins by a team, toss win rate, top batsman, and historical chart data)."""
    try:
        return data_service.get_venue_details(venue)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load venue details: {str(e)}")
