# IPL Analytics Backend

FastAPI backend for serving IPL Silver/Gold layer analytics from local Parquet files.

## Run locally

```powershell
cd D:\ipl-pipeline
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn api.server:app --host 127.0.0.1 --port 8000 --reload
```

Open the API docs:

```text
http://127.0.0.1:8000/docs
```

## Rebuild the data pipeline

```powershell
python main.py
```

This rebuilds `data/silver` and `data/gold`. The Spark pipeline expects Hadoop utilities under `C:\hadoop\bin` on Windows.

## Frontend-ready endpoints

```text
GET /health
GET /metadata
GET /teams
GET /teams/seasons
GET /teams/{team_name}/summary
GET /teams/{team_name}/history
GET /teams/{team_name}/head-to-head
GET /players?search=virat&limit=10
GET /players/{player_name}/history
GET /players/batting?season=2026&sort_by=total_runs&limit=10
GET /players/bowling?season=2026&sort_by=total_wickets&limit=10
GET /players/top-performers?season=2026&limit=10
GET /venues
GET /venues/stats?season=2026
GET /matches?season=2026&team=Royal%20Challengers%20Bangalore&limit=10&offset=0
GET /matches/{match_id}
```

Team aliases such as `Royal Challengers Bangalore`, `Royal Challengers Bengaluru`, and `RCB` resolve to the same data. Player aliases such as `ViratKohli`, `Virat Kohli`, and `V Kohli` resolve to the same profile.
