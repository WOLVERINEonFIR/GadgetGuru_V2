import psycopg
from psycopg.rows import dict_row


def shortlist(conn, intent, price_min, price_max, limit=250, min_release_year=2024, allow_stretch=True):
    """
    SQL pre-filter with optional stretch tier.

    Returns phones in [effective_min, price_max] as regular candidates,
    plus up to 2 phones in (price_max, stretch_max] flagged with is_stretch=True.
    """
    if price_max >= 50000:
        effective_min = max(price_min, int(price_max * 0.45))
    elif price_max >= 15000:
        effective_min = max(price_min, int(price_max * 0.55))
    else:
        effective_min = price_min

    # Stretch ceiling: at most 10% over budget, or 5% + 5000, whichever is smaller
    stretch_max = price_max * 1.10
    if allow_stretch:
        stretch_max = min(price_max * 1.10, price_max * 1.05 + 5000)

    with conn.cursor(row_factory=dict_row) as cur:
        # 1. In-budget phones
        cur.execute("""
            SELECT id, brand, model_name, price_min_inr, specs, false AS is_stretch
            FROM phones
            WHERE has_price_data = true
              AND price_min_inr BETWEEN %s AND %s
              AND COALESCE(
                  NULLIF(LEFT(specs->'identity'->>'release_date_iso', 4), '')::int,
                  NULLIF(substring(specs->'identity'->>'announced_text' FROM '(20[0-9]{2})'), '')::int,
                  2025
              ) >= %s
            ORDER BY price_min_inr DESC
            LIMIT %s
        """, (effective_min, price_max, min_release_year, limit))
        in_budget = cur.fetchall()

        if not allow_stretch:
            return in_budget

        # 2. Stretch phones — strictly above price_max, up to stretch_max
        cur.execute("""
            SELECT id, brand, model_name, price_min_inr, specs, true AS is_stretch
            FROM phones
            WHERE has_price_data = true
              AND price_min_inr > %s
              AND price_min_inr <= %s
              AND COALESCE(
                  NULLIF(LEFT(specs->'identity'->>'release_date_iso', 4), '')::int,
                  NULLIF(substring(specs->'identity'->>'announced_text' FROM '(20[0-9]{2})'), '')::int,
                  2025
              ) >= %s
            ORDER BY price_min_inr ASC
            LIMIT 10
        """, (price_max, stretch_max, min_release_year))
        stretch = cur.fetchall()

    return in_budget + stretch