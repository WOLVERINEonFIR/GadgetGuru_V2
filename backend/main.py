import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import psycopg

from app.shortlist import shortlist
from app.scoring import score_and_rank
from app.rank import rank

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("DATABASE_URL not set")

app = FastAPI(title="GadgetGuru")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_INTENTS = {
    "performance_gaming", "camera_creation", "battery_endurance",
    "everyday_value", "media_productivity", "design_durability",
}

class RecommendRequest(BaseModel):
    intent: str
    price_min: float = Field(0, ge=0)
    price_max: float = Field(..., gt=0)
    user_text: Optional[str] = ""
    allow_stretch: bool = True

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/recommend")
def recommend(req: RecommendRequest):
    if req.intent not in VALID_INTENTS:
        raise HTTPException(400, f"intent must be one of {sorted(VALID_INTENTS)}")
    if req.price_min > req.price_max:
        raise HTTPException(400, "price_min > price_max")

    with psycopg.connect(DATABASE_URL, sslmode="require") as conn:
        # 1. SQL: cheap price-range filter → up to 200 candidates
        candidates = shortlist(conn, req.intent, req.price_min, req.price_max, limit=200)
        if not candidates:
            raise HTTPException(404, "No phones matched the price range")

        # 2. Python scorer: intent-aware heuristic → top 10
        top10 = score_and_rank(candidates, req.intent, top_n=10)

        # 3. Gemini: re-rank the 10, pick best 3 with reasons
        try:
            ranking = rank(top10, req.intent, req.user_text or "")
        except Exception as e:
            raise HTTPException(502, f"LLM ranking failed: {e}")

        # 4. Join Gemini's picks back to full phone data
        by_id = {r["id"]: r for r in top10}
        picks = []
        for p in ranking.get("picks", []):
            phone = by_id.get(p["id"])
            if not phone:
                continue
            picks.append({
                "id": phone["id"],
                "brand": phone["brand"],
                "model_name": phone["model_name"],
                "price_min_inr": float(phone["price_min_inr"]),
                "reason": p["reason"],
                "specs": phone["specs"],
                "score": phone.get("score"),
                "scores": phone.get("scores"),
            })
        return {
            "intent": req.intent,
            "summary": ranking.get("summary", ""),
            "picks": picks,
        }