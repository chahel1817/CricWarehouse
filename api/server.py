"""
IPL REST API Server
===================
Exposes structured analytical data from the Gold and Silver layers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routers import teams, players, venues, matches

app = FastAPI(
    title="IPL Analytics Platform API",
    description="REST API serving cleaned and aggregated IPL match, player, and team statistics from the Medallion Data Pipeline.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(venues.router)
app.include_router(matches.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "IPL Analytics API is ready to serve data.",
        "endpoints": [
            "/teams",
            "/players/batting",
            "/players/bowling",
            "/players/top-performers",
            "/venues/stats",
            "/matches"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)
