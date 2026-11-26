# backend/scripts/check_top10.py
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from app.shortlist import shortlist
from app.scoring import score_and_rank

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
conn = psycopg.connect(os.getenv("DATABASE_URL"), sslmode="require", row_factory=dict_row)

for intent in ["performance_gaming", "camera_creation", "battery_endurance", "everyday_value", "media_productivity", "design_durability"]:
    print(f"\n=== {intent} top 10 (under ₹89,999) ===")
    candidates = shortlist(conn, intent, 0, 89999, limit=200)
    top10 = score_and_rank(candidates, intent, top_n=10)
    for i, p in enumerate(top10, 1):
        print(f"  #{i:2d}  {p['score']:5.1f}  {p['model_name']:40s}  ₹{p['price_min_inr']:,.0f}")