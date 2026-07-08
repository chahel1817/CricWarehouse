"""
Bronze -> Silver Layer Pipeline
================================
Reads raw Cricsheet JSON files from data/bronze/ and produces two clean
Parquet datasets in data/silver/:

  1. silver/matches   - one row per match (1,243 rows expected)
  2. silver/deliveries - one row per ball  (250,000+ rows expected)

Key handling:
  - Season field comes as "2007/08" (string) in early files and as an
    integer (2016) in later files.  We normalise to a clean year integer
    by extracting the leading 4-digit year.
  - Extras columns (wides, noballs, legbyes, byes, penalty) are cast to
    int and null-filled with 0 so downstream aggregations work cleanly.
  - An innings_number column (1 or 2) is added to deliveries so we
    know which innings each ball belongs to.
  - Wicket details (player_out, dismissal_kind, fielder) are extracted
    from the nested wickets array.

Usage:
    python pipeline/bronze_to_silver.py
"""

import os
import sys

# -- Windows Hadoop setup: must happen BEFORE importing SparkSession ----------
os.environ["HADOOP_HOME"] = r"C:\hadoop"
os.environ["PATH"] = r"C:\hadoop\bin" + os.pathsep + os.environ.get("PATH", "")

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, explode, input_file_name, regexp_extract,
    when, coalesce, lit, posexplode
)
from pyspark.sql.types import IntegerType


def create_spark_session():
    """Create and return a Spark session configured for local processing."""
    spark = (
        SparkSession.builder
        .appName("IPL_Bronze_to_Silver")
        .master("local[*]")
        .config("spark.driver.memory", "4g")
        .config("spark.sql.legacy.timeParserPolicy", "LEGACY")
        .config("spark.ui.showConsoleProgress", "true")
        .getOrCreate()
    )
    # Suppress noisy Hadoop/Spark warnings
    spark.sparkContext.setLogLevel("ERROR")
    return spark


def read_bronze(spark, bronze_path):
    """Read all raw JSON files from bronze layer."""
    print(f"[bronze->silver] Reading JSON files from {bronze_path} ...")
    df = spark.read.option("multiline", "true").json(bronze_path)

    # Extract match_id from filename  (e.g.  335982.json -> 335982)
    df = df.withColumn(
        "match_id",
        regexp_extract(input_file_name(), r"(\d+)\.json", 1).cast("int"),
    )

    file_count = df.count()
    print(f"[bronze->silver] Loaded {file_count} match files.")
    return df


def normalize_team(col_ref):
    """
    Normalise team name variations to their latest/current spelling/branding
    to avoid fragmented stats (e.g. RCB, PBKS, DC rebranding).
    """
    return (
        when(col_ref == "Royal Challengers Bangalore", "Royal Challengers Bengaluru")
        .when(col_ref == "Kings XI Punjab", "Punjab Kings")
        .when(col_ref == "Delhi Daredevils", "Delhi Capitals")
        .otherwise(col_ref)
    )


def build_matches(df):
    """
    Flatten match-level info into a single row per match.

    Season normalisation
    --------------------
    Early seasons use strings like "2007/08"; later ones use plain
    integers like 2016.  We cast everything to string first, then
    extract the leading 4-digit year.
    """
    print("[bronze->silver] Building matches table ...")

    matches_df = df.select(
        col("match_id"),
        # --- season normalised to integer year --------------------------------
        when(col("info.season").cast("string") == "2007/08", 2008)
        .when(col("info.season").cast("string") == "2009/10", 2010)
        .when(col("info.season").cast("string") == "2020/21", 2020)
        .otherwise(
            regexp_extract(col("info.season").cast("string"), r"(\d{4})", 1).cast("int")
        ).alias("season"),
        col("info.city").alias("city"),
        col("info.dates").getItem(0).cast("date").alias("date"),
        col("info.event.name").alias("event_name"),
        col("info.event.match_number").cast("int").alias("match_number"),
        col("info.event.stage").alias("stage"),
        col("info.match_type").alias("match_type"),
        col("info.venue").alias("venue"),
        normalize_team(col("info.teams").getItem(0)).alias("team1"),
        normalize_team(col("info.teams").getItem(1)).alias("team2"),
        normalize_team(col("info.toss.winner")).alias("toss_winner"),
        col("info.toss.decision").alias("toss_decision"),
        normalize_team(col("info.outcome.winner")).alias("winner"),
        col("info.outcome.by.runs").cast("int").alias("win_by_runs"),
        col("info.outcome.by.wickets").cast("int").alias("win_by_wickets"),
        col("info.outcome.result").alias("result"),          # "no result" / "tie" etc.
        col("info.player_of_match").getItem(0).alias("player_of_match"),
        col("info.overs").cast("int").alias("overs_limit"),
    )

    row_count = matches_df.count()
    print(f"[bronze->silver] Matches table: {row_count} rows.")
    return matches_df


def build_deliveries(df):
    """
    Explode the nested innings -> overs -> deliveries structure into a
    flat table with one row per ball delivered.
    """
    print("[bronze->silver] Building deliveries table ...")

    # --- Step 1: explode innings with position (gives innings_number) --------
    innings_df = df.select(
        col("match_id"),
        when(col("info.season").cast("string") == "2007/08", 2008)
        .when(col("info.season").cast("string") == "2009/10", 2010)
        .when(col("info.season").cast("string") == "2020/21", 2020)
        .otherwise(
            regexp_extract(col("info.season").cast("string"), r"(\d{4})", 1).cast("int")
        ).alias("season"),
        posexplode(col("innings")).alias("innings_idx", "inning"),
    )
    # innings_idx is 0-based; convert to 1-based innings number
    innings_df = innings_df.withColumn("innings_number", col("innings_idx") + 1)

    # --- Step 2: explode overs inside each innings ---------------------------
    overs_df = innings_df.select(
        col("match_id"),
        col("season"),
        col("innings_number"),
        normalize_team(col("inning.team")).alias("batting_team"),
        explode(col("inning.overs")).alias("over"),
    )

    # --- Step 3: explode deliveries inside each over -------------------------
    deliveries_df = overs_df.select(
        col("match_id"),
        col("season"),
        col("innings_number"),
        col("batting_team"),
        col("over.over").alias("over_number"),
        explode(col("over.deliveries")).alias("delivery"),
    )

    # --- Step 4: flatten delivery fields -------------------------------------
    flat = deliveries_df.select(
        col("match_id"),
        col("season"),
        col("innings_number"),
        col("batting_team"),
        col("over_number"),
        col("delivery.batter").alias("batter"),
        col("delivery.bowler").alias("bowler"),
        col("delivery.non_striker").alias("non_striker"),
        # Runs
        col("delivery.runs.batter").cast("int").alias("batter_runs"),
        col("delivery.runs.extras").cast("int").alias("extra_runs"),
        col("delivery.runs.total").cast("int").alias("total_runs"),
        # Extras -- fill nulls with 0 for clean aggregations
        coalesce(col("delivery.extras.wides").cast("int"), lit(0)).alias("wides"),
        coalesce(col("delivery.extras.noballs").cast("int"), lit(0)).alias("noballs"),
        coalesce(col("delivery.extras.legbyes").cast("int"), lit(0)).alias("legbyes"),
        coalesce(col("delivery.extras.byes").cast("int"), lit(0)).alias("byes"),
        coalesce(col("delivery.extras.penalty").cast("int"), lit(0)).alias("penalty"),
        # Derived boolean flags
        when(col("delivery.extras.wides").isNotNull(), True).otherwise(False).alias("is_wide"),
        when(col("delivery.extras.noballs").isNotNull(), True).otherwise(False).alias("is_noball"),
        # Wicket details (first wicket only -- double-plays are extremely rare)
        col("delivery.wickets").getItem(0).getField("player_out").alias("player_out"),
        col("delivery.wickets").getItem(0).getField("kind").alias("dismissal_kind"),
        col("delivery.wickets")
            .getItem(0).getField("fielders")
            .getItem(0).getField("name").alias("fielder"),
        when(col("delivery.wickets").isNotNull(), True).otherwise(False).alias("is_wicket"),
    )

    row_count = flat.count()
    print(f"[bronze->silver] Deliveries table: {row_count} rows.")
    return flat


def write_silver(df, path, partition_col=None):
    """Write a DataFrame to Parquet in the silver layer."""
    writer = df.write.mode("overwrite")
    if partition_col:
        writer = writer.partitionBy(partition_col)
    writer.parquet(path)
    print(f"[bronze->silver] Written -> {path}")


def process_bronze_to_silver():
    """Main entry-point: read bronze JSONs -> write silver Parquet."""
    # Resolve paths relative to project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    bronze_path = os.path.join(project_root, "data", "bronze", "*.json")
    silver_matches_path = os.path.join(project_root, "data", "silver", "matches")
    silver_deliveries_path = os.path.join(project_root, "data", "silver", "deliveries")

    spark = create_spark_session()

    try:
        raw_df = read_bronze(spark, bronze_path)

        # --- Matches ---------------------------------------------------------
        matches_df = build_matches(raw_df)
        write_silver(matches_df, silver_matches_path)

        # --- Deliveries ------------------------------------------------------
        deliveries_df = build_deliveries(raw_df)
        write_silver(deliveries_df, silver_deliveries_path, partition_col="season")

        # --- Quick sanity check ----------------------------------------------
        print("\n========== SANITY CHECK ==========")
        print("Matches sample:")
        spark.read.parquet(silver_matches_path).show(5, truncate=False)

        print("Deliveries sample:")
        spark.read.parquet(silver_deliveries_path).show(5, truncate=False)

        del_count = spark.read.parquet(silver_deliveries_path).count()
        match_count = spark.read.parquet(silver_matches_path).count()
        print(f"\nSilver layer ready -- {match_count} matches, {del_count} deliveries")

    finally:
        spark.stop()


if __name__ == "__main__":
    process_bronze_to_silver()
