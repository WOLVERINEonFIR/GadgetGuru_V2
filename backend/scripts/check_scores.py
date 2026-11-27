"""
Load 3 phones from Postgres and print their v2 sub-scores.
Run once to sanity-check the scorer before wiring into /recommend.

Usage:
    cd C:\\projects\\GadgetGuru
    .venv\\Scripts\\activate
    python backend/scripts/check_scores.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

from app.scoring import compute_phone_scores_v2, score_phone_v2

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL missing from .env")

# Pick one flagship, one mid-range, one budget by price
QUERIES = [
    ("FLAGSHIP", "SELECT id, brand, model_name, price_min_inr, specs FROM phones WHERE has_price_data = true ORDER BY price_min_inr DESC LIMIT 1"),
    ("MID-RANGE", "SELECT id, brand, model_name, price_min_inr, specs FROM phones WHERE has_price_data = true AND price_min_inr BETWEEN 25000 AND 45000 ORDER BY price_min_inr DESC LIMIT 1"),
    ("BUDGET", "SELECT id, brand, model_name, price_min_inr, specs FROM phones WHERE has_price_data = true ORDER BY price_min_inr ASC LIMIT 1"),
]

INTENTS = ["performance_gaming", "camera_creation", "battery_endurance", "everyday_value", "media_productivity", "design_durability"]

with psycopg.connect(DATABASE_URL, sslmode="require", row_factory=dict_row) as conn:
    for label, sql in QUERIES:
        with conn.cursor() as cur:
            cur.execute(sql)
            row = cur.fetchone()
        if not row:
            print(f"{label}: no phone found")
            continue
        specs = row["specs"]
        subs = compute_phone_scores_v2(specs)
        print(f"\n=== {label}: {row['model_name']} (₹{row['price_min_inr']}) ===")
        print(f"  perf={subs['performance']:3d}  gaming={subs['gaming']:3d}  camera={subs['camera']:3d}  "
              f"display={subs['display']:3d}  battery={subs['battery']:3d}  build={subs['build']:3d}  software={subs['software']:3d}")
        print("  Intent totals:")
        for intent in INTENTS:
            total, _ = score_phone_v2(specs, intent)
            print(f"    {intent:22s} -> {total:5.1f}")