# CricWarehouse: End-to-End IPL Analytics Platform

Welcome to **CricWarehouse**, a full-stack, high-performance web application and data pipeline designed to ingest, process, and visualize Indian Premier League (IPL) cricket data.

This project implements a complete **Medallion Data Architecture (Bronze -> Silver -> Gold)**, robust **FastAPI backend**, and a modern, beautiful **Next.js frontend**.

---

## 🏗️ Architecture & Data Flow

The platform is designed around a scalable data processing pipeline that transforms raw JSON event data into lightning-fast, queryable Parquet formats, ultimately served to a Next.js web application.

### 1. Data Engineering (Medallion Architecture)
- **Bronze Layer:** Raw ball-by-ball IPL match data obtained from Cricsheet in JSON format.
- **Silver Layer:** Cleaned, flattened, and normalized data saved as partitioned **Parquet** files (`matches` and `deliveries`). Team aliases are resolved, and data anomalies are filtered out using **PySpark**.
- **Gold Layer:** Highly optimized, pre-aggregated analytics tables (`team_stats`, `player_batting`, `player_bowling`, `venue_stats`, `head_to_head`, `top_performers`) created for immediate consumption.

### 2. Backend (FastAPI)
The REST API uses **Pandas & PyArrow** to load the Silver and Gold Parquet layers directly into memory for lightning-fast reads. It processes complex on-the-fly analytical queries like win contributions, player role classifications, and dynamic batting/bowling statistics.

### 3. Frontend (Next.js)
A visually stunning, dynamic UI built with **Next.js 14**, **React 18**, and **Tailwind CSS**. It consumes the FastAPI endpoints to render interactive player showcases, leaderboards, team histories, and venue statistics.

---

## 💻 Tech Stack

### Data Pipeline
*   **Apache Spark (PySpark):** For distributed data transformation and aggregation.
*   **Pandas & PyArrow:** For fast in-memory querying and Parquet file processing.
*   **Parquet:** Optimized columnar storage format used for Silver and Gold data.

### Backend
*   **Python 3.x**
*   **FastAPI:** High-performance async web framework for building the REST APIs.
*   **Uvicorn:** Lightning-fast ASGI server.

### Frontend
*   **Next.js (App Router):** React framework for SSR and routing.
*   **React 18:** Component-based UI library.
*   **Tailwind CSS:** Utility-first CSS framework for custom styling.
*   **Lucide React:** Iconography.

### Deployment
*   **Frontend Hosting:** [Vercel](https://vercel.com/)
*   **Backend Hosting:** [Render](https://render.com/) (Web Service)

---

## 🚀 Running the Project Locally

### 1. Run the Data Pipeline
To process the raw JSON files into the Silver and Gold layers:
```powershell
# Make sure you are in the project root
python main.py
```
*(Note for Windows users: The PySpark pipeline requires Hadoop utilities configured locally).*

### 2. Start the Backend API
Start the FastAPI server:
```powershell
# Activate your virtual environment if you have one
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
python -m uvicorn api.server:app --host 127.0.0.1 --port 8000 --reload
```
Once running, explore the interactive API documentation at `http://127.0.0.1:8000/docs`.

### 3. Start the Frontend
In a new terminal window, start the Next.js development server:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the application.

---

## 📡 API Endpoints Summary

The backend exposes several robust endpoints designed specifically for the frontend application.

*   `GET /health` - System health and dataset readiness.
*   `GET /metadata` - Filter options (seasons, teams, sorting fields).
*   `GET /teams/{team_name}/summary` - All-time stats and win percentages.
*   `GET /teams/{team_name}/head-to-head` - Win/Loss records against all opponents.
*   `GET /players/{player_name}/history` - Comprehensive career deep-dive, including win contributions, role classifications, and career bests.
*   `GET /players/batting` & `GET /players/bowling` - Sortable leaderboards.
*   `GET /venues/stats` - Insights on pitch behavior (e.g., chase wins vs. defend wins).
*   `GET /matches` - Filterable match logs.

*(Team and Player names have robust alias matching built into the API layer. "RCB", "Royal Challengers Bangalore", and "Royal Challengers Bengaluru" resolve seamlessly).*

---

## 🌍 Deployment Guide

### Backend (Render)
Create a new **Web Service** on Render and point it to your repository.
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn api.server:app --host 0.0.0.0 --port $PORT`
*   *Note: Ensure the `data/silver` and `data/gold` directories are committed to Git so Render can access the Parquet files!*

### Frontend (Vercel)
Import the repository into Vercel.
*   **Framework:** Next.js
*   **Root Directory:** `frontend`
*   **Environment Variables:** Add `NEXT_PUBLIC_API_URL` and set it to your deployed Render URL (e.g., `https://my-backend.onrender.com`).
