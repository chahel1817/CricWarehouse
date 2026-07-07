"""
Silver -> Gold Layer Pipeline
================================
Reads clean Parquet from data/silver/ and builds analytical gold tables
in data/gold/:

  1. gold/team_stats        - per-team, per-season aggregate stats
  2. gold/player_batting    - per-player, per-season batting stats
  3. gold/player_bowling    - per-player, per-season bowling stats
  4. gold/venue_stats       - per-venue, per-season match analysis
  5. gold/head_to_head      - team vs team historical records
  6. gold/top_performers    - player of match + impact rankings

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
# GOLD TABLE 3:  player_bowling
# ---------------------------------------------------------------------------
def build_player_bowling(matches, deliveries):
    """
    Per-player, per-season bowling stats:
      overs, maidens, runs_conceded, wickets, economy, bowling_avg,
      best_figures, four_wicket_hauls, five_wicket_hauls, dot_ball_pct
    """
    print("[silver->gold] Building player_bowling ...")

    # Legal deliveries for overs count (exclude wides and noballs)
    legal = deliveries.filter((col("is_wide") == False) & (col("is_noball") == False))

    # Runs conceded by bowler = total_runs - legbyes - byes (those aren't bowler's fault)
    dl = deliveries.withColumn(
        "bowler_runs", col("total_runs") - col("legbyes") - col("byes")
    )

    # Per-match spell
    spell = dl.groupBy("match_id", "season", "bowler").agg(
        spark_sum("bowler_runs").alias("runs_conceded"),
        spark_sum(when(col("is_wicket") & (~col("dismissal_kind").isin(
            "run out", "retired hurt", "retired out", "obstructing the field"
        )), 1).otherwise(0)).alias("wickets"),
        spark_sum(when(col("bowler_runs") == 0, 1).otherwise(0)).alias("dots"),
    )

    # Legal balls per spell for overs
    legal_spell = legal.groupBy("match_id", "season", "bowler").agg(
        count("*").alias("legal_balls"),
    )
    spell = spell.join(legal_spell, ["match_id", "season", "bowler"], "left")

    # Season aggregation
    player_bowling = spell.groupBy("season", "bowler").agg(
        countDistinct("match_id").alias("matches"),
        spark_sum("legal_balls").alias("total_balls"),
        spark_sum("runs_conceded").alias("total_runs_conceded"),
        spark_sum("wickets").alias("total_wickets"),
        spark_sum("dots").alias("total_dots"),
        spark_max("wickets").alias("best_wickets_in_match"),
        spark_sum(when(col("wickets") >= 4, 1).otherwise(0)).alias("four_wkt_hauls"),
        spark_sum(when(col("wickets") >= 5, 1).otherwise(0)).alias("five_wkt_hauls"),
    )

    player_bowling = player_bowling.withColumn(
        "overs", spark_round(col("total_balls") / 6, 1)
    ).withColumn(
        "economy",
        spark_round(col("total_runs_conceded") / (col("total_balls") / 6), 2)
    ).withColumn(
        "bowling_avg",
        spark_round(
            when(col("total_wickets") > 0, col("total_runs_conceded") / col("total_wickets"))
            .otherwise(lit(None)),
            2
        )
    ).withColumn(
        "bowling_sr",
        spark_round(
            when(col("total_wickets") > 0, col("total_balls") / col("total_wickets"))
            .otherwise(lit(None)),
            2
        )
    ).withColumn(
        "dot_ball_pct",
        spark_round(col("total_dots") / col("total_balls") * 100, 1)
    ).orderBy(col("season"), col("total_wickets").desc())

    row_count = player_bowling.count()
    print(f"[silver->gold] player_bowling: {row_count} rows.")
    return player_bowling


# ---------------------------------------------------------------------------
# GOLD TABLE 4:  venue_stats
# ---------------------------------------------------------------------------
def build_venue_stats(matches, deliveries):
    """
    Per-venue, per-season stats:
      matches_played, avg_1st_innings_score, avg_2nd_innings_score,
      bat_first_wins, chase_wins, highest_total, lowest_total
    """
    print("[silver->gold] Building venue_stats ...")

    # Innings totals per match
    innings_totals = deliveries.groupBy("match_id", "season", "innings_number", "batting_team").agg(
        spark_sum("total_runs").alias("innings_total"),
        spark_sum(when(col("is_wicket") == True, 1).otherwise(0)).alias("wickets_fell"),
        spark_sum(when(col("batter_runs") == 6, 1).otherwise(0)).alias("sixes"),
        spark_sum(when(col("batter_runs") == 4, 1).otherwise(0)).alias("fours"),
    )

    # Join with matches to get venue
    innings_with_venue = innings_totals.join(
        matches.select("match_id", "venue", "winner", "team1", "toss_winner", "toss_decision"),
        "match_id",
    )

    # First & second innings
    first_inn = innings_with_venue.filter(col("innings_number") == 1)
    second_inn = innings_with_venue.filter(col("innings_number") == 2)

    # Bat-first team = innings 1 batting team
    bat_first_wins = first_inn.filter(
        col("batting_team") == col("winner")
    ).groupBy("season", "venue").agg(count("*").alias("bat_first_wins"))

    chase_wins = second_inn.filter(
        col("batting_team") == col("winner")
    ).groupBy("season", "venue").agg(count("*").alias("chase_wins"))

    # Venue aggregation
    venue_agg = innings_with_venue.groupBy("season", "venue").agg(
        countDistinct("match_id").alias("matches_played"),
        spark_round(avg("innings_total"), 1).alias("avg_score"),
        spark_max("innings_total").alias("highest_total"),
        spark_min("innings_total").alias("lowest_total"),
        spark_round(avg("sixes"), 1).alias("avg_sixes_per_innings"),
        spark_round(avg("fours"), 1).alias("avg_fours_per_innings"),
    )

    first_inn_avg = first_inn.groupBy("season", "venue").agg(
        spark_round(avg("innings_total"), 1).alias("avg_1st_inn_score"),
    )
    second_inn_avg = second_inn.groupBy("season", "venue").agg(
        spark_round(avg("innings_total"), 1).alias("avg_2nd_inn_score"),
    )

    venue_stats = venue_agg \
        .join(first_inn_avg, ["season", "venue"], "left") \
        .join(second_inn_avg, ["season", "venue"], "left") \
        .join(bat_first_wins, ["season", "venue"], "left") \
        .join(chase_wins, ["season", "venue"], "left") \
        .na.fill(0, ["bat_first_wins", "chase_wins"]) \
        .orderBy("season", "venue")

    row_count = venue_stats.count()
    print(f"[silver->gold] venue_stats: {row_count} rows.")
    return venue_stats


# ---------------------------------------------------------------------------
# GOLD TABLE 5:  head_to_head
# ---------------------------------------------------------------------------
def build_head_to_head(matches):
    """
    Team vs team historical record (all-time):
      team_a, team_b, total_matches, team_a_wins, team_b_wins,
      no_results, last_played
    """
    print("[silver->gold] Building head_to_head ...")

    # Normalise so team_a < team_b alphabetically (avoids duplicates)
    h2h_base = matches.withColumn(
        "team_a",
        when(col("team1") < col("team2"), col("team1")).otherwise(col("team2"))
    ).withColumn(
        "team_b",
        when(col("team1") < col("team2"), col("team2")).otherwise(col("team1"))
    )

    head_to_head = h2h_base.groupBy("team_a", "team_b").agg(
        count("*").alias("total_matches"),
        spark_sum(when(col("winner") == col("team_a"), 1).otherwise(0)).alias("team_a_wins"),
        spark_sum(when(col("winner") == col("team_b"), 1).otherwise(0)).alias("team_b_wins"),
        spark_sum(when(col("winner").isNull(), 1).otherwise(0)).alias("no_results"),
        spark_max("date").alias("last_played"),
        spark_min("date").alias("first_played"),
    ).orderBy(col("total_matches").desc())

    row_count = head_to_head.count()
    print(f"[silver->gold] head_to_head: {row_count} rows.")
    return head_to_head


# ---------------------------------------------------------------------------
# GOLD TABLE 6:  top_performers
# ---------------------------------------------------------------------------
def build_top_performers(matches, deliveries):
    """
    Player of Match awards per season + all-time, plus impact score.
    """
    print("[silver->gold] Building top_performers ...")

    # POM awards per player per season
    pom = matches.filter(col("player_of_match").isNotNull()) \
        .groupBy("season", "player_of_match").agg(
            count("*").alias("pom_awards"),
        ).withColumnRenamed("player_of_match", "player")

    # All-time POM
    pom_alltime = matches.filter(col("player_of_match").isNotNull()) \
        .groupBy(col("player_of_match").alias("player")).agg(
            count("*").alias("career_pom_awards"),
        )

    # Season batting runs for context
    balls = deliveries.filter(col("is_wide") == False)
    bat_season = balls.groupBy("season", "batter").agg(
        spark_sum("batter_runs").alias("season_runs"),
    ).withColumnRenamed("batter", "player")

    # Season bowling wickets for context
    bowl_season = deliveries.filter(
        (col("is_wicket") == True) &
        (~col("dismissal_kind").isin("run out", "retired hurt", "retired out"))
    ).groupBy("season", "bowler").agg(
        count("*").alias("season_wickets"),
    ).withColumnRenamed("bowler", "player")

    # Merge: POM + batting + bowling
    top_perf = pom \
        .join(bat_season, ["season", "player"], "left") \
        .join(bowl_season, ["season", "player"], "left") \
        .na.fill(0, ["season_runs", "season_wickets"])

    # Impact score = POM*10 + runs/50 + wickets*2
    top_perf = top_perf.withColumn(
        "impact_score",
        spark_round(
            col("pom_awards") * 10
            + col("season_runs") / 50
            + col("season_wickets") * 2,
            1
        )
    ).orderBy(col("season"), col("impact_score").desc())

    row_count = top_perf.count()
    print(f"[silver->gold] top_performers: {row_count} rows.")
    return top_perf


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
    gold_dir = os.path.join(project_root, "data", "gold")

    spark = create_spark_session()

    try:
        print("[silver->gold] Reading silver layer ...")
        matches = spark.read.parquet(silver_matches)
        deliveries = spark.read.parquet(silver_deliveries)
        print(f"[silver->gold] Silver: {matches.count()} matches, {deliveries.count()} deliveries")

        # -- Gold Table 1: Team Stats ----------------------------------------
        ts = build_team_stats(matches, deliveries)
        write_gold(ts, os.path.join(gold_dir, "team_stats"))

        # -- Gold Table 2: Player Batting ------------------------------------
        pb = build_player_batting(matches, deliveries)
        write_gold(pb, os.path.join(gold_dir, "player_batting"))

        # -- Gold Table 3: Player Bowling ------------------------------------
        pw = build_player_bowling(matches, deliveries)
        write_gold(pw, os.path.join(gold_dir, "player_bowling"))

        # -- Gold Table 4: Venue Stats ---------------------------------------
        vs = build_venue_stats(matches, deliveries)
        write_gold(vs, os.path.join(gold_dir, "venue_stats"))

        # -- Gold Table 5: Head to Head --------------------------------------
        h2h = build_head_to_head(matches)
        write_gold(h2h, os.path.join(gold_dir, "head_to_head"))

        # -- Gold Table 6: Top Performers ------------------------------------
        tp = build_top_performers(matches, deliveries)
        write_gold(tp, os.path.join(gold_dir, "top_performers"))

        # -- Sanity check ----------------------------------------------------
        print("\n========== SANITY CHECK ==========")

        print("\n--- TOP BOWLERS 2026 ---")
        spark.read.parquet(os.path.join(gold_dir, "player_bowling")) \
            .filter(col("season") == 2026) \
            .orderBy(col("total_wickets").desc()) \
            .select("bowler","matches","overs","total_wickets","economy","bowling_avg","bowling_sr","dot_ball_pct") \
            .show(10, truncate=False)

        print("\n--- TOP VENUES 2026 ---")
        spark.read.parquet(os.path.join(gold_dir, "venue_stats")) \
            .filter(col("season") == 2026) \
            .orderBy(col("matches_played").desc()) \
            .select("venue","matches_played","avg_1st_inn_score","avg_2nd_inn_score","bat_first_wins","chase_wins","highest_total") \
            .show(10, truncate=False)

        print("\n--- TOP HEAD-TO-HEAD RIVALRIES ---")
        spark.read.parquet(os.path.join(gold_dir, "head_to_head")) \
            .orderBy(col("total_matches").desc()) \
            .show(10, truncate=False)

        print("\n--- TOP PERFORMERS 2026 ---")
        spark.read.parquet(os.path.join(gold_dir, "top_performers")) \
            .filter(col("season") == 2026) \
            .orderBy(col("impact_score").desc()) \
            .show(10, truncate=False)

        # Summary counts
        counts = {}
        for t in ["team_stats","player_batting","player_bowling","venue_stats","head_to_head","top_performers"]:
            counts[t] = spark.read.parquet(os.path.join(gold_dir, t)).count()
        print("\n========== GOLD LAYER SUMMARY ==========")
        for k, v in counts.items():
            print(f"  {k}: {v} rows")

    finally:
        spark.stop()


if __name__ == "__main__":
    process_silver_to_gold()
