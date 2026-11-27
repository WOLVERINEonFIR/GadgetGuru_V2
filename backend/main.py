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
        candidates = shortlist(
            conn, req.intent, req.price_min, req.price_max,
            limit=200, allow_stretch=req.allow_stretch,
        )
        if not candidates:
            raise HTTPException(404, "No phones matched the price range")

        # Separate in-budget from stretch so we can cap stretch at 2
        in_budget = [c for c in candidates if not c.get("is_stretch")]
        stretch_pool = [c for c in candidates if c.get("is_stretch")]

        # Score in-budget: take top 8
        top_in_budget = score_and_rank(in_budget, req.intent, top_n=8, price_max=req.price_max)

        # Score stretch: take top 2, but only if they're genuinely competitive
        # (must score within 15 points of the #1 in-budget phone)
        stretch_picks = []
        if stretch_pool and top_in_budget:
            stretch_scored = score_and_rank(stretch_pool, req.intent, top_n=2, price_max=req.price_max)
            best_score = top_in_budget[0]["score"]
            stretch_picks = [s for s in stretch_scored if s["score"] >= best_score - 15]

        top10 = top_in_budget + stretch_picks[:2]

        try:
            ranking = rank(top10, req.intent, req.user_text or "")
        except Exception as e:
            raise HTTPException(502, f"LLM ranking failed: {e}")


        by_id = {r["id"]: r for r in top10}
        picks = []

        for p in ranking.get("picks", []):
            phone = by_id.get(p["id"])
            if not phone:
                continue

            picks.append({
                "rank": p["rank"],
                "id": phone["id"],
                "brand": phone["brand"],
                "model_name": phone["model_name"],
                "price_min_inr": float(phone["price_min_inr"]),
                "score": phone.get("score"),
                "ai_score": p["ai_score"],
                "reason": p.get("reason") if p["rank"] <= 3 else None,
                "specs": phone["specs"],
                "scores": phone.get("scores"),
                "is_stretch": phone.get("is_stretch", False),
            })

        picks.sort(key=lambda p: p["rank"])

        return {
            "intent": req.intent,
            "summary": ranking.get("summary", ""),
            "picks": picks,
        }