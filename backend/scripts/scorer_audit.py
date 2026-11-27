"""
Audit the v2 scorer over the full priced catalog.

Reports:
1. Score distribution per intent (percentiles)
2. Correlation between score and price
3. Within-price-band spread
4. Field coverage (% of phones with each field populated)
"""

import os, sys
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from app.scoring import compute_phone_scores_v2, score_phone_v2

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

conn = psycopg.connect(os.getenv("DATABASE_URL"), sslmode="require", row_factory=dict_row)
with conn.cursor() as cur:
    cur.execute("SELECT id, brand, model_name, price_min_inr, specs FROM phones WHERE has_price_data = true")
    phones = cur.fetchall()

print(f"Loaded {len(phones)} priced phones\n")

# ============ 1. Field coverage ============
def has(specs, path):
    cur = specs
    for key in path:
        if not isinstance(cur, dict):
            return False
        cur = cur.get(key)
        if cur is None:
            return False
    return True

FIELDS = [
    ("chipset model", ("performance", "chipset", "variants")),
    ("process_nm", ("performance", "chipset", "variants")),
    ("gpu variants", ("performance", "gpu", "variants")),
    ("battery capacity", ("battery", "capacity_mah")),
    ("battery wired W", ("battery", "wired_charging", "max_power_w")),
    ("battery active use", ("battery", "active_use_score_minutes")),
    ("display refresh", ("displays",)),
    ("display peak nits", ("displays",)),
    ("display ppi", ("displays",)),
    ("rear lenses", ("cameras", "modules")),
    ("overall OIS", ("cameras", "overall_ois_claim")),
    ("weight", ("physical", "weight_g")),
    ("IP rating", ("physical", "water_resistance", "rating")),
    ("OS updates", ("software", "update_policy", "major_os_updates")),
    ("ram options", ("derived", "filter", "ram_options_gb")),
]

print("=== FIELD COVERAGE ===")
for label, path in FIELDS:
    count = sum(1 for p in phones if has(p["specs"], path))
    pct = 100 * count / len(phones)
    flag = "⚠️" if pct < 60 else ""
    print(f"  {label:25s} {count:3d}/{len(phones)} ({pct:5.1f}%) {flag}")

# ============ 2. Score distribution per intent ============
def percentile(sorted_vals, p):
    if not sorted_vals:
        return 0
    k = int(len(sorted_vals) * p / 100)
    return sorted_vals[min(k, len(sorted_vals) - 1)]

INTENTS = ["performance_gaming", "camera_creation", "battery_endurance",
           "everyday_value", "media_productivity", "design_durability"]

print("\n=== SCORE DISTRIBUTION PER INTENT (all phones) ===")
print(f"  {'intent':22s} {'min':>4s} {'p25':>4s} {'p50':>4s} {'p75':>4s} {'max':>4s} {'spread':>7s}")
for intent in INTENTS:
    totals = []
    for p in phones:
        total, _ = score_phone_v2(p["specs"], intent)
        totals.append(total)
    totals.sort()
    mn, p25, p50, p75, mx = totals[0], percentile(totals, 25), percentile(totals, 50), percentile(totals, 75), totals[-1]
    print(f"  {intent:22s} {mn:4.0f} {p25:4.0f} {p50:4.0f} {p75:4.0f} {mx:4.0f} {mx-mn:7.0f}")

# ============ 3. Correlation: score vs price ============
print("\n=== CORRELATION: score vs price (per intent) ===")
# Spearman-ish: rank both, correlate ranks
def rank(arr):
    indexed = sorted(enumerate(arr), key=lambda x: x[1])
    ranks = [0] * len(arr)
    for rank_pos, (orig_idx, _) in enumerate(indexed):
        ranks[orig_idx] = rank_pos
    return ranks

def pearson(x, y):
    n = len(x)
    mx, my = sum(x)/n, sum(y)/n
    cov = sum((x[i]-mx)*(y[i]-my) for i in range(n))
    sx = (sum((v-mx)**2 for v in x)) ** 0.5
    sy = (sum((v-my)**2 for v in y)) ** 0.5
    if sx == 0 or sy == 0:
        return 0
    return cov / (sx * sy)

prices = [float(p["price_min_inr"]) for p in phones]
price_ranks = rank(prices)
for intent in INTENTS:
    scores = [score_phone_v2(p["specs"], intent)[0] for p in phones]
    score_ranks = rank(scores)
    corr = pearson(price_ranks, score_ranks)
    flag = "⚠️ weak" if corr < 0.3 else "✓" if corr > 0.5 else "ok"
    print(f"  {intent:22s} ρ={corr:+.2f}  {flag}")

# ============ 4. Within-band spread (everyday_value) ============
print("\n=== WITHIN-BAND SPREAD (everyday_value, per price bucket) ===")
BUCKETS = [(0, 20000), (20000, 30000), (30000, 45000), (45000, 70000), (70000, 150000), (150000, 500000)]
for lo, hi in BUCKETS:
    in_band = [p for p in phones if lo <= float(p["price_min_inr"]) < hi]
    if not in_band:
        continue
    scores = sorted(score_phone_v2(p["specs"], "everyday_value")[0] for p in in_band)
    spread = scores[-1] - scores[0] if scores else 0
    flag = "⚠️ narrow" if spread < 15 else ""
    print(f"  ₹{lo:>6,}–{hi:>6,}  n={len(in_band):3d}  min={scores[0]:4.0f}  max={scores[-1]:4.0f}  spread={spread:4.0f} {flag}")