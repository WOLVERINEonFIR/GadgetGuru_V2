# backend/scripts/check_top10.py
import os, sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from app.shortlist import shortlist
from app.scoring import score_and_rank

load_dotenv(ROOT_DIR / ".env")

BUDGETS = [
    10000,
    15000,
    20000,
    30000,
    40000,
    50000,
    70000,
    90000,
    120000,
    150000,
    200000,
]

INTENTS = [
    "performance_gaming",
    "camera_creation",
    "battery_endurance",
    "everyday_value",
    "media_productivity",
    "design_durability",
]

TOP_N = 20
OUTPUT_FILE = Path(__file__).resolve().parent / "audit_results.txt"

with psycopg.connect(os.getenv("DATABASE_URL"), sslmode="require", row_factory=dict_row) as conn, \
     open(OUTPUT_FILE, "w", encoding="utf-8") as f:

    for budget_max in BUDGETS:
        print(f"Processing budget tier: under ₹{budget_max:,}...")
        f.write("\n" + "=" * 72 + "\n")
        f.write(f"BUDGET TIER: UNDER ₹{budget_max:,}\n")
        f.write("=" * 72 + "\n")

        for intent in INTENTS:
            f.write(f"\n=== {intent} top {TOP_N} (under ₹{budget_max:,}) ===\n")
            candidates = shortlist(conn, intent, 0, budget_max, limit=250)
            ranked = score_and_rank(candidates, intent, top_n=TOP_N, price_max=budget_max)

            if not ranked:
                f.write("  (No phones found in this price range)\n")
                continue

            for i, p in enumerate(ranked, 1):
                f.write(f"  #{i:2d}  {p['score']:5.1f}  {p['model_name']:40s}  ₹{p['price_min_inr']:,.0f}\n")

print(f"\nDone! Saved all results to: {OUTPUT_FILE}")
