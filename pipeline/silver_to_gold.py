"""
Silver -> Gold Layer Pipeline
================================
Reads clean Parquet from data/silver/ and builds analytical gold tables
in data/gold/:

  1. gold/team_stats        - per-team, per-season aggregate stats
  2. gold/player_batting    - per-player, per-season batting stats

Usage:
    python pipeline/silver_to_gold.py
"""

import os

# -- Windows Hadoop setup: must happen BEFORE importing SparkSession ----------
os.environ["HADOOP_HOME"] = r"C:\hadoop"
os.environ["PATH"] = r"C:\hadoop\bin" + os.pathsep + os.environ.get("PATH", "")

from pyspark.sql import SparkSession, Window
from pyspark.sql.functions import (
    col, count, sum as spark_sum, avg, max as spark_max, min as spark_min,
    when, lit, round as spark_round, dense_rank, countDistinct,
    concat_ws, collect_list, first
)


# ---------------------------------------------------------------------------
# Spark session
# ---------------------------------------------------------------------------
def create_spark_session():
    """Create and return a Spark session configured for local processing."""
    spark = (
        SparkSession.builder
        .appName("IPL_Silver_to_Gold")
        .master("local[*]")
        .config("spark.driver.memory", "4g")
        .config("spark.ui.showConsoleProgress", "true")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")
    return spark


# ---------------------------------------------------------------------------
# GOLD TABLE 1:  team_stats
# ---------------------------------------------------------------------------
def build_team_stats(matches, deliveries):
    """
    Build per-team, per-season stats:
      - matches_played, wins, losses, no_results, win_pct
      - titles_won (finals won that season)
      - total_runs_scored, total_runs_conceded
      - avg_score, highest_score, lowest_score
      - total_wickets_taken, total_sixes, total_fours
      - toss_wins
    """
    print("[silver->gold] Building team_stats ...")

    # ---------- Part A: match-level stats per team --------------------------
    # Create a row per team per match (team can appear as team1 or team2)
    team1 = matches.select(
        col("match_id"), col("season"),
        col("team1").alias("team"),
        col("winner"), col("result"),
        col("toss_winner"), col("stage"),
    )
    team2 = matches.select(
        col("match_id"), col("season"),
        col("team2").alias("team"),
        col("winner"), col("result"),
        col("toss_winner"), col("stage"),
    )
    team_matches = team1.union(team2)

    match_agg = team_matches.groupBy("season", "team").agg(
        count("*").alias("matches_played"),
        spark_sum(when(col("winner") == col("team"), 1).otherwise(0)).alias("wins"),
        spark_sum(when(
            (col("winner").isNotNull()) & (col("winner") != col("team")), 1
        ).otherwise(0)).alias("losses"),
        spark_sum(when(col("result") == "no result", 1).otherwise(0)).alias("no_results"),
        spark_sum(when(col("toss_winner") == col("team"), 1).otherwise(0)).alias("toss_wins"),
        # Did they win a final this season?
        spark_sum(when(
            (col("stage") == "Final") & (col("winner") == col("team")), 1
        ).otherwise(0)).alias("titles_won"),
    )

    match_agg = match_agg.withColumn(
        "win_pct",
        spark_round(col("wins") / col("matches_played") * 100, 1)
    )

    # ---------- Part B: innings-level batting/bowling stats -----------------
    # Runs scored by each team per match (batting innings)
    batting_innings = deliveries.groupBy("match_id", "season", "batting_team").agg(
        spark_sum("total_runs").alias("innings_total"),
        spark_sum(when(col("batter_runs") == 4, 1).otherwise(0)).alias("fours"),
        spark_sum(when(col("batter_runs") == 6, 1).otherwise(0)).alias("sixes"),
        spark_sum(when(col("is_wicket") == True, 1).otherwise(0)).alias("wickets_lost"),
    )

    # Aggregate batting stats per team per season
    batting_agg = batting_innings.groupBy("season", "batting_team").agg(
        spark_sum("innings_total").alias("total_runs_scored"),
        spark_round(avg("innings_total"), 1).alias("avg_score"),
        spark_max("innings_total").alias("highest_score"),
        spark_min("innings_total").alias("lowest_score"),
        spark_sum("fours").alias("total_fours"),
        spark_sum("sixes").alias("total_sixes"),
    ).withColumnRenamed("batting_team", "team")

    # Bowling: runs conceded = the opponent's batting total
    # Join matches to find the bowling team for each batting innings
    bowling_agg = batting_innings.groupBy("season", "batting_team").agg(
        spark_sum("innings_total").alias("total_runs_conceded"),
        spark_sum("wickets_lost").alias("total_wickets_taken"),
    ).withColumnRenamed("batting_team", "opponent")

    # For bowling stats, we need to flip: when opponent bats, it's this team bowling
    # We join back through matches to find who was bowling
    # Simpler approach: use deliveries to find bowling team stats directly

    # Get bowling team per innings by joining with matches
    # The bowling team is whichever team in the match is NOT the batting team
    innings_with_bowl = batting_innings.alias("bi").join(
        matches.select("match_id", "team1", "team2").alias("m"),
        col("bi.match_id") == col("m.match_id"),
    ).withColumn(
        "bowling_team",
        when(col("bi.batting_team") == col("m.team1"), col("m.team2"))
        .otherwise(col("m.team1"))
    )

    bowling_season = innings_with_bowl.groupBy("season", "bowling_team").agg(
        spark_sum("innings_total").alias("total_runs_conceded"),
        spark_sum("wickets_lost").alias("total_wickets_taken"),
    ).withColumnRenamed("bowling_team", "team")

    # ---------- Part C: merge everything ------------------------------------
    team_stats = match_agg \
        .join(batting_agg, ["season", "team"], "left") \
        .join(bowling_season, ["season", "team"], "left") \
        .orderBy("season", "team")

    row_count = team_stats.count()
    print(f"[silver->gold] team_stats: {row_count} rows.")
    return team_stats


# ---------------------------------------------------------------------------
# GOLD TABLE 2:  player_batting
# ---------------------------------------------------------------------------
def build_player_batting(matches, deliveries):
    """
    Build per-player, per-season batting stats:
      - matches, innings, runs, balls_faced, fours, sixes
      - highest_score, average, strike_rate
      - not_outs, fifties, hundreds
    """
    print("[silver->gold] Building player_batting ...")

    # -- balls faced: exclude wides (batters don't face wides) ---------------
    balls = deliveries.filter(col("is_wide") == False)

    # -- per-match, per-innings batting card ---------------------------------
    batting_card = balls.groupBy("match_id", "season", "innings_number", "batter").agg(
        spark_sum("batter_runs").alias("runs"),
        count("*").alias("balls_faced"),
        spark_sum(when(col("batter_runs") == 4, 1).otherwise(0)).alias("fours"),
        spark_sum(when(col("batter_runs") == 6, 1).otherwise(0)).alias("sixes"),
    )

    # Was the batter dismissed? (if player_out == batter in same match+innings)
    dismissals = deliveries.filter(col("is_wicket") == True) \
        .select(
            col("match_id"),
            col("innings_number"),
            col("player_out").alias("batter"),
        ).distinct()

    batting_card = batting_card.join(
        dismissals, ["match_id", "innings_number", "batter"], "left"
    ).withColumn(
        "is_out", dismissals["batter"].isNotNull()
    )
    # The join duplicates the batter column; fix by using a flag approach
    # Simpler: mark not_out
    batting_card_clean = balls.groupBy("match_id", "season", "innings_number", "batter").agg(
        spark_sum("batter_runs").alias("runs"),
        count("*").alias("balls_faced"),
        spark_sum(when(col("batter_runs") == 4, 1).otherwise(0)).alias("fours"),
        spark_sum(when(col("batter_runs") == 6, 1).otherwise(0)).alias("sixes"),
    )

    # Add dismissal info
    dismissal_flag = deliveries.filter(col("is_wicket") == True) \
        .select(
            col("match_id"),
            col("innings_number"),
            col("player_out"),
        ).distinct() \
        .withColumn("was_dismissed", lit(True))

    batting_card_final = batting_card_clean.join(
        dismissal_flag,
        (batting_card_clean["match_id"] == dismissal_flag["match_id"]) &
        (batting_card_clean["innings_number"] == dismissal_flag["innings_number"]) &
        (batting_card_clean["batter"] == dismissal_flag["player_out"]),
        "left"
    ).select(
        batting_card_clean["match_id"],
        batting_card_clean["season"],
        batting_card_clean["innings_number"],
        batting_card_clean["batter"],
        "runs", "balls_faced", "fours", "sixes",
        when(col("was_dismissed") == True, True).otherwise(False).alias("is_out"),
    )

    # -- per-player, per-season aggregation ----------------------------------
    player_batting = batting_card_final.groupBy("season", "batter").agg(
        countDistinct("match_id").alias("matches"),
        count("*").alias("innings"),
        spark_sum("runs").alias("total_runs"),
        spark_sum("balls_faced").alias("total_balls"),
        spark_sum("fours").alias("total_fours"),
        spark_sum("sixes").alias("total_sixes"),
        spark_max("runs").alias("highest_score"),
        spark_sum(when(col("is_out") == True, 1).otherwise(0)).alias("dismissals"),
        spark_sum(when(col("is_out") == False, 1).otherwise(0)).alias("not_outs"),
        spark_sum(when(col("runs") >= 50, 1).otherwise(0)).alias("fifties"),
        spark_sum(when(col("runs") >= 100, 1).otherwise(0)).alias("hundreds"),
    )

    # -- derived columns -----------------------------------------------------
    player_batting = player_batting.withColumn(
        "batting_avg",
        spark_round(
            when(col("dismissals") > 0, col("total_runs") / col("dismissals"))
            .otherwise(col("total_runs")),  # not out all innings
            2
        )
    ).withColumn(
        "strike_rate",
        spark_round(col("total_runs") / col("total_balls") * 100, 2)
    ).withColumn(
        # fifties should not double-count hundreds
        "fifties",
        col("fifties") - col("hundreds")
    ).orderBy(col("season"), col("total_runs").desc())

    row_count = player_batting.count()
    print(f"[silver->gold] player_batting: {row_count} rows.")
    return player_batting


# ---------------------------------------------------------------------------
# Writer
# ---------------------------------------------------------------------------
def write_gold(df, path):
    """Write a DataFrame to Parquet in the gold layer."""
    df.write.mode("overwrite").parquet(path)
    print(f"[silver->gold] Written -> {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def process_silver_to_gold():
    """Main entry-point: read silver Parquet -> write gold Parquet."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    silver_matches = os.path.join(project_root, "data", "silver", "matches")
    silver_deliveries = os.path.join(project_root, "data", "silver", "deliveries")
    gold_team_stats = os.path.join(project_root, "data", "gold", "team_stats")
    gold_player_batting = os.path.join(project_root, "data", "gold", "player_batting")

    spark = create_spark_session()

    try:
        print("[silver->gold] Reading silver layer ...")
        matches = spark.read.parquet(silver_matches)
        deliveries = spark.read.parquet(silver_deliveries)
        print(f"[silver->gold] Silver: {matches.count()} matches, {deliveries.count()} deliveries")

        # -- Gold Table 1: Team Stats ----------------------------------------
        team_stats = build_team_stats(matches, deliveries)
        write_gold(team_stats, gold_team_stats)

        # -- Gold Table 2: Player Batting ------------------------------------
        player_batting = build_player_batting(matches, deliveries)
        write_gold(player_batting, gold_player_batting)

        # -- Sanity check ----------------------------------------------------
        print("\n========== SANITY CHECK ==========")
        print("\n--- TEAM STATS SAMPLE (2026 season) ---")
        spark.read.parquet(gold_team_stats) \
            .filter(col("season") == 2026) \
            .orderBy(col("wins").desc()) \
            .show(10, truncate=False)

        print("\n--- TOP 10 BATTERS 2026 ---")
        spark.read.parquet(gold_player_batting) \
            .filter(col("season") == 2026) \
            .orderBy(col("total_runs").desc()) \
            .show(10, truncate=False)

        print("\n--- ALL-TIME RUN LEADERS (aggregate across seasons) ---")
        spark.read.parquet(gold_player_batting) \
            .groupBy("batter") \
            .agg(
                spark_sum("total_runs").alias("career_runs"),
                spark_sum("matches").alias("career_matches"),
                spark_max("highest_score").alias("best_score"),
            ) \
            .orderBy(col("career_runs").desc()) \
            .show(10, truncate=False)

        ts_count = spark.read.parquet(gold_team_stats).count()
        pb_count = spark.read.parquet(gold_player_batting).count()
        print(f"\nGold layer ready -- {ts_count} team_stats rows, {pb_count} player_batting rows")

    finally:
        spark.stop()


if __name__ == "__main__":
    process_silver_to_gold()
