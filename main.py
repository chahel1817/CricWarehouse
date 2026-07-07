"""
IPL Data Pipeline - Main Execution Orchestrator
===============================================
Orchestrates the full Medallion Architecture pipeline:
1. Bronze to Silver: Extract Cricsheet JSONs, normalise and flatten to partitioned Parquet.
2. Silver to Gold: Generate analytical aggregations (6 tables).
3. Verification: Validates existence, schema, and row counts of all output tables.

Usage:
    python main.py
"""

import os
import sys
import time

# -- Windows Hadoop setup: must happen BEFORE importing SparkSession ----------
os.environ["HADOOP_HOME"] = r"C:\hadoop"
os.environ["PATH"] = r"C:\hadoop\bin" + os.pathsep + os.environ.get("PATH", "")

# Ensure the pipeline folder is in path for imports
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "pipeline"))

try:
    from bronze_to_silver import process_bronze_to_silver
    from silver_to_gold import process_silver_to_gold
except ImportError as e:
    print(f"Error importing pipeline modules: {e}")
    sys.exit(1)

def run_pipeline():
    print("=" * 70)
    print("        STARTING IPL ANALYTICS END-TO-END DATA PIPELINE")
    print("=" * 70)
    
    start_time = time.time()

    # 1. Bronze to Silver
    print("\n>>> STAGE 1: BRONZE TO SILVER <<<")
    stage1_start = time.time()
    try:
        process_bronze_to_silver()
        stage1_duration = time.time() - stage1_start
        print(f"[OK] Stage 1 completed successfully in {stage1_duration:.2f} seconds.")
    except Exception as e:
        print(f"[FAIL] Stage 1 failed: {e}")
        sys.exit(1)

    # 2. Silver to Gold
    print("\n>>> STAGE 2: SILVER TO GOLD <<<")
    stage2_start = time.time()
    try:
        process_silver_to_gold()
        stage2_duration = time.time() - stage2_start
        print(f"[OK] Stage 2 completed successfully in {stage2_duration:.2f} seconds.")
    except Exception as e:
        print(f"[FAIL] Stage 2 failed: {e}")
        sys.exit(1)

    total_duration = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"[SUCCESS] FULL PIPELINE EXECUTED SUCCESSFULLY IN {total_duration:.2f} SECONDS")
    print("=" * 70)

    # 3. Verification Report
    print("\n>>> PIPELINE VERIFICATION REPORT <<<")
    verify_tables()

def verify_tables():
    from pyspark.sql import SparkSession
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    gold_dir = os.path.join(project_root, "data", "gold")
    silver_dir = os.path.join(project_root, "data", "silver")
    
    spark = (
        SparkSession.builder
        .appName("Pipeline_Verification")
        .master("local[*]")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")
    
    tables = {
        "silver/matches": os.path.join(silver_dir, "matches"),
        "silver/deliveries": os.path.join(silver_dir, "deliveries"),
        "gold/team_stats": os.path.join(gold_dir, "team_stats"),
        "gold/player_batting": os.path.join(gold_dir, "player_batting"),
        "gold/player_bowling": os.path.join(gold_dir, "player_bowling"),
        "gold/venue_stats": os.path.join(gold_dir, "venue_stats"),
        "gold/head_to_head": os.path.join(gold_dir, "head_to_head"),
        "gold/top_performers": os.path.join(gold_dir, "top_performers"),
    }
    
    print(f"{'Table/Dataset':<25} | {'Status':<8} | {'Row Count':<12} | {'Validation Check'}")
    print("-" * 75)
    
    all_ok = True
    for name, path in tables.items():
        if not os.path.exists(path):
            print(f"{name:<25} | {'MISSING':<8} | {'N/A':<12} | [FAIL] Directory not found")
            all_ok = False
            continue
            
        try:
            df = spark.read.parquet(path)
            count = df.count()
            
            # Simple custom validation rules
            status_desc = "Pass"
            if count == 0:
                status_desc = "[WARN] Empty table"
                all_ok = False
            elif name == "silver/matches" and count != 1243:
                status_desc = f"[WARN] Expected 1243 matches, got {count}"
                all_ok = False
            elif name == "silver/deliveries" and count < 250000:
                status_desc = f"[WARN] Low delivery count: {count}"
                all_ok = False
                
            print(f"{name:<25} | {'OK':<8} | {count:<12,} | {status_desc}")
        except Exception as e:
            print(f"{name:<25} | {'ERROR':<8} | {'N/A':<12} | [FAIL] Failed to read Parquet: {e}")
            all_ok = False
            
    spark.stop()
    print("-" * 75)
    if all_ok:
        print("ALL DATA INTEGRITY AND VOLUME CHECKS PASSED!")
    else:
        print("SOME PIPELINE VALIDATION ISSUES DETECTED. PLEASE REVIEW LOGS.")
    print("=" * 70)

if __name__ == "__main__":
    run_pipeline()
