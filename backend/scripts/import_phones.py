import json, os, re
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
JSON_FILE = "backend\phones_data.json"

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def get_price(specs):
    f = specs.get("derived", {}).get("filter", {})
    return f.get("price_min_inr"), f.get("price_max_inr"), bool(f.get("has_price_data", False))

def main():
    print("Loading JSON...")
    with open(JSON_FILE, encoding="utf-8") as fh:
        data = json.load(fh)

    # handle both plain array and {"phones": [...]}
        if isinstance(data, dict):
            data = data.get("phones") or data.get("data") or []

    # only phones that have price data
    data = [
        p for p in data
        if p.get("derived", {}).get("filter", {}).get("has_price_data") is True
    ]
    print(f"Loaded {len(data)} priced phones")

    with psycopg.connect(DATABASE_URL, sslmode="require", row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            for i, specs in enumerate(data, 1):
                try:
                    ident = specs["identity"]
                    brand = ident["brand"]
                    model = ident["model_name"]
                    slug = slugify(f"{brand} {model}")

                    cur.execute("SELECT 1 FROM phones WHERE slug = %s", (slug,))
                    if cur.fetchone():
                        print(f"[{i}/{len(data)}] skip exists: {slug}")
                        continue

                    pmin, pmax, has = get_price(specs)
                    cur.execute("""
                        INSERT INTO phones
                          (brand, model_name, slug, release_date, image_url, specs,
                           price_min_inr, price_max_inr, has_price_data,
                           parse_status, parse_warnings)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        RETURNING id
                    """, (
                        brand, model, slug,
                        ident.get("release_date_iso"), ident.get("image_url"),
                        json.dumps(specs), pmin, pmax, has,
                        specs.get("parse_quality", {}).get("status", "parsed"),
                        json.dumps(specs.get("parse_quality", {}).get("warnings", [])),
                    ))
                    phone_id = cur.fetchone()["id"]

                    if has:
                        for offer in specs.get("price_offers", []):
                            if not offer.get("amount"):
                                continue
                            cur.execute("""
                                INSERT INTO prices
                                  (phone_id, amount, currency, market, source_name,
                                   offer_url, observed_at)
                                VALUES (%s,%s,%s,%s,%s,%s,%s)
                            """, (
                                phone_id, offer["amount"],
                                offer.get("currency", "INR"),
                                offer.get("market"), offer.get("source_name"),
                                offer.get("offer_url"), offer.get("observed_at"),
                            ))

                    conn.commit()
                    print(f"[{i}/{len(data)}] ok: {slug}")
                except Exception as e:
                    conn.rollback()
                    print(f"[{i}/{len(data)}] FAIL: {e}")

    print("Done.")

if __name__ == "__main__":
    main()