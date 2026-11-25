import psycopg
from psycopg.rows import dict_row

INTENT_ORDER = {
    "performance_gaming": """
        COALESCE((
          SELECT (b->>'score')::numeric
          FROM jsonb_array_elements(specs->'performance'->'benchmark_results') b
          WHERE b->>'test_name' = 'AnTuTu'
          ORDER BY (b->>'score')::numeric DESC
          LIMIT 1
        ), 0)
    """,
    "camera_creation": """
        (
          COALESCE((specs->'cameras'->'modules'->0->'lenses'->0->>'resolution_mp')::numeric, 0)
          + COALESCE((specs->'cameras'->'modules'->0->'lenses'->1->>'resolution_mp')::numeric, 0)
          + CASE WHEN (specs->'cameras'->'modules'->0->'lenses'->0->>'ois')::boolean THEN 20 ELSE 0 END
        )
    """,
    "battery_endurance": """
        COALESCE((specs->'battery'->>'capacity_mah')::numeric, 0)
    """,
    "everyday_value": """
        (
          COALESCE((SELECT (b->>'score')::numeric FROM jsonb_array_elements(specs->'performance'->'benchmark_results') b WHERE b->>'test_name'='AnTuTu' ORDER BY (b->>'score')::numeric DESC LIMIT 1), 0) / 1000.0
          + COALESCE((specs->'battery'->>'capacity_mah')::numeric, 0) / 100.0
          + COALESCE((specs->'displays'->0->>'refresh_rate_hz')::numeric, 0) / 10.0
          + COALESCE((specs->'cameras'->'modules'->0->'lenses'->0->>'resolution_mp')::numeric, 0) / 10.0
        )
    """,
    "media_productivity": """
        (
          COALESCE((specs->'displays'->0->>'size_inches')::numeric, 0) * 10
          + COALESCE((specs->'displays'->0->>'peak_brightness_nits')::numeric, 0) / 100.0
        )
    """,
    "design_durability": """
        (
          -COALESCE((specs->'physical'->>'weight_g')::numeric, 999)
          + CASE WHEN (specs->'physical'->'water_resistance'->>'rating') LIKE 'IP6%' THEN 50 ELSE 0 END
        )
    """,
}

def shortlist(conn, intent, price_min, price_max, limit=8, allow_stretch=True):
    order_expr = INTENT_ORDER.get(intent, "price_min_inr")

    with conn.cursor(row_factory=dict_row) as cur:
        # In-budget phones (the primary set)
        cur.execute(f"""
            SELECT id, brand, model_name, price_min_inr, specs, false AS is_stretch
            FROM phones
            WHERE has_price_data = true
              AND price_min_inr BETWEEN %s AND %s
            ORDER BY {order_expr} DESC NULLS LAST
            LIMIT %s
        """, (price_min, price_max, limit))
        in_budget = cur.fetchall()

        if not allow_stretch:
            return in_budget

        # Stretch phones: 5% over, capped at 10% over
        stretch_max = min(price_max * 1.10, price_max * 1.05 + 5000)
        cur.execute(f"""
            SELECT id, brand, model_name, price_min_inr, specs, true AS is_stretch
            FROM phones
            WHERE has_price_data = true
              AND price_min_inr > %s
              AND price_min_inr <= %s
            ORDER BY {order_expr} DESC NULLS LAST
            LIMIT 2
        """, (price_max, stretch_max))
        stretch = cur.fetchall()

    # Merge: keep all in-budget, add up to 2 stretch. Total <= limit.
    combined = in_budget[: max(0, limit - len(stretch))] + stretch
    return combined[:limit]