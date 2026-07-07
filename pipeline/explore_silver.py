"""
Quick script to explore and verify the silver layer output.
Run:  python pipeline/explore_silver.py
"""

import os

os.environ["HADOOP_HOME"] = r"C:\hadoop"
os.environ["PATH"] = r"C:\hadoop\bin" + os.pathsep + os.environ.get("PATH", "")

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, min, max, sum

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

spark = (
    SparkSession.builder
    .appName("Explore_Silver")
    .master("local[*]")
    .config("spark.driver.memory", "2g")
    .getOrCreate()
)
spark.sparkContext.setLogLevel("ERROR")

matches = spark.read.parquet(os.path.join(project_root, "data", "silver", "matches"))
deliveries = spark.read.parquet(os.path.join(project_root, "data", "silver", "deliveries"))

print("=" * 60)
print("SILVER LAYER VERIFICATION")
print("=" * 60)

# 1. Row counts
print(f"\nTotal matches:    {matches.count()}")
print(f"Total deliveries: {deliveries.count()}")

# 2. Schema
print("\n--- MATCHES SCHEMA ---")
matches.printSchema()

print("\n--- DELIVERIES SCHEMA ---")
deliveries.printSchema()

# 3. Seasons covered
print("\n--- SEASONS COVERED ---")
matches.select("season").distinct().orderBy("season").show(50, truncate=False)

# 4. Matches per season
print("\n--- MATCHES PER SEASON ---")
matches.groupBy("season").agg(count("*").alias("matches")).orderBy("season").show(50)

# 5. Top 10 run scorers (all time)
print("\n--- TOP 10 RUN SCORERS (ALL TIME) ---")
deliveries.groupBy("batter") \
    .agg(sum("batter_runs").alias("total_runs")) \
    .orderBy(col("total_runs").desc()) \
    .show(10, truncate=False)

# 6. Top 10 wicket takers
print("\n--- TOP 10 WICKET TAKERS (ALL TIME) ---")
deliveries.filter(
    (col("is_wicket") == True) &
    (~col("dismissal_kind").isin("run out", "retired hurt", "obstructing the field"))
).groupBy("bowler") \
    .agg(count("*").alias("wickets")) \
    .orderBy(col("wickets").desc()) \
    .show(10, truncate=False)

# 7. Sample match data (first IPL match ever)
print("\n--- FIRST IPL MATCH (2008) ---")
matches.filter(col("match_id") == 335982).show(1, truncate=False, vertical=True)

# 8. Sample deliveries from that match
print("\n--- FIRST 10 BALLS OF MATCH 335982 ---")
deliveries.filter(col("match_id") == 335982) \
    .orderBy("innings_number", "over_number") \
    .select("innings_number", "over_number", "batter", "bowler", "batter_runs", "total_runs", "is_wicket") \
    .show(10, truncate=False)

spark.stop()
print("\nDone!")
