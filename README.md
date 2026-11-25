# GadgetGuru V2

AI-powered phone recommendation engine. Enter a budget and intent, get 3 phones ranked by Gemini with reasons grounded in real specs.

## Stack

- **Backend:** FastAPI + PostgreSQL (Supabase) + pgvector-ready
- **Frontend:** React + Vite + Tailwind
- **LLM:** Google Gemini 3.5 Flash-Lite (intent-aware ranking)
- **Data:** 600+ phones scraped from GSMArena (152 priced)

## How it works

1. User picks intent (gaming / camera / battery / balanced / media / design), price range, optional free text
2. SQL pre-filters phones by price range
3. Python heuristic scorer ranks by intent (5 weighted sub-scores)
4. Top 10 phones become compact "spec cards" (\~200 tokens each)
5. Gemini ranks the 10 and picks 3 with one-sentence reasons

## Architecture

\\\
User → React → POST /recommend
                    ↓
              SQL price filter (152 priced phones)
                    ↓
              Heuristic scorer (intent-weighted)
                    ↓
              Top 10 → render_llm_card() (pruned)
                    ↓
              Gemini ranks → top 3 → JSON
                    ↓
              React renders cards with reasons
\\\

## Local setup

### Backend

\\\ash
cd backend
python -m venv .venv
.venv\\Scripts\\activate    # Windows
pip install -r requirements.txt
cp ../.env.example .env    # fill in DATABASE_URL + GEMINI_API_KEY
python -m uvicorn main:app --reload --port 8000
\\\

### Frontend

\\\ash
cd gadgetguru-frontend
npm install
npm run dev
\\\

Frontend at http://localhost:5173, backend at http://localhost:8000.
API docs at http://localhost:8000/docs.

## Design tradeoffs

- **JSONB over full normalization:** phone specs are read-whole, write-once. 22 normalized tables would mean 22 joins for a detail page. JSONB + promoted filter columns (generated) gives the best of both.
- **Heuristic shortlist before LLM:** sending all 152 phones to Gemini costs \~50k tokens per request. The Python scorer + compact cards keeps it at \~2.5k.
- **Intent-aware weights, not one global score:** "camera phone" and "gaming phone" should not produce the same ranking. The scorer weights 5 sub-scores differently per intent.
- **pgvector is wired but unused:** pros/cons embeddings are Phase 2. The schema and pipeline hooks are in place.

## Roadmap

- [x] Postgres schema, ingest 600 phones
- [x] FastAPI /recommend endpoint
- [x] Gemini intent-aware ranking
- [x] Stretch-phone suggestions (+5% budget)
- [ ] Pros/cons scraper + pgvector semantic rerank (Phase 2)
- [ ] Search / catalog page
- [ ] Compare page (3 phones side-by-side)
- [ ] Analytics dashboard (Recharts)
