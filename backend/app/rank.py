import os
import json
from dotenv import load_dotenv
from google import genai
from .llm_card import render_llm_card

load_dotenv()  # must run BEFORE reading the key

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise SystemExit("GEMINI_API_KEY not set — add it to .env in the project root")

client = genai.Client(api_key=_api_key)
MODEL = "gemini-3.5-flash-lite"

INTENT_DEFINITIONS = {
    "performance_gaming": "the user wants maximum gaming and processing performance — prioritize AnTuTu/GeekBench scores, chipset tier, and high refresh rate.",
    "camera_creation": "the user prioritizes camera quality — weight main sensor resolution, OIS, telephoto presence, and aperture (lower f-number is better).",
    "battery_endurance": "the user wants maximum battery life — prioritize mAh capacity, active-use minutes, and fast charging wattage.",
    "everyday_value": "the user wants a well-rounded phone with no major weaknesses at a fair price. Do NOT simply pick the cheapest option — prioritize phones that are strong across performance, camera, battery, and display.",
    "media_productivity": "the user prioritizes display and media — weight screen size, brightness, refresh rate, and stereo speakers.",
    "design_durability": "the user prioritizes build quality and/or compact size — weight IP rating, weight in grams, and premium materials.",
}

SYSTEM_PROMPT = """You are a phone recommendation expert.
You receive a user's intent, optional free text, and a shortlist of phones.
Rank the best 3 phones for this user.
Return ONLY valid JSON in this exact shape:
{"picks":[{"id":<int>,"reason":"<one sentence>","stretch":<true|false>}],"summary":"<one sentence overall>"}
Do not wrap in markdown. Do not add extra keys.
If a candidate is marked "~5% over budget", you may still recommend it IF it offers
a clearly better experience than the in-budget options (better chipset, camera, or
display). In your reason, explicitly say why the small price jump is worth it.
If it is not worth the extra cost, prefer an in-budget phone instead."""

def rank(shortlist_rows: list[dict], intent: str, user_text: str) -> dict:
    cards = []
    for r in shortlist_rows:
        card = render_llm_card(r['specs'], intent, is_stretch=r.get('is_stretch', False))
        cards.append(f"--- PHONE id={r['id']} ---\n{card}")
    
    intent_hint = INTENT_DEFINITIONS.get(intent, "")
    user_msg = (
        f"Intent: {intent}\n"
        f"Intent meaning: {intent_hint}\n"
        f"User notes: {user_text or '(none)'}\n\n"
        "Candidates:\n" + "\n\n".join(cards)
    )

    resp = client.models.generate_content(
        model=MODEL,
        contents=user_msg,
        config={"system_instruction": SYSTEM_PROMPT, "temperature": 0.3},
    )
    raw = resp.text.strip()
    # strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)