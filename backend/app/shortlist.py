import psycopg
from psycopg.rows import dict_row


def shortlist(conn, intent, price_min, price_max, limit=200):
    """
    SQL pre-filter only. Returns phones in the price range, sorted by price.
    No intent scoring here — app.scoring.score_and_rank() handles that.
    The `intent` param is unused but kept in signature for API compatibility.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("""
            SELECT id, brand, model_name, price_min_inr, specs
            FROM phones
            WHERE has_price_data = true
              AND price_min_inr BETWEEN %s AND %s
            ORDER BY price_min_inr ASC
            LIMIT %s
        """, (price_min, price_max, limit))
        return cur.fetchall()