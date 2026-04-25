# Dory

AI agent spend management. Track, monitor, and control costs across agentic AI APIs in one place.

## Stack

- **Frontend:** Next.js + Tailwind CSS
- **Backend:** FastAPI + MongoDB
- **Auth:** Auth0
- **SDK:** Python (`dory-sdk`)

## Getting started

```bash
# Backend
cd backend
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev

# Test the SDK
source backend/venv/bin/activate
pip install -e sdk/
python3 test.py
```

---

## What's done

- **Backend skeleton** - FastAPI app with CORS, health check, config
- **MongoDB validation** - backend startup now pings Atlas and creates the spend indexes it needs, instead of only creating a lazy client
- **SDK** - `dory.wrap()` wraps the Anthropic client, captures token usage, calculates cost per model, and fires spend events to the backend in a background thread
- **Spend ingestion** - `POST /api/events` receives SDK events and persists them to MongoDB (auth via API key)
- **Spend read endpoints** - `GET /api/spend/summary` and `GET /api/spend/events` for aggregated and raw data
- **Frontend dashboard preview** - the homepage can now fetch live summary and event data from the backend when `DORY_API_URL` and `DORY_API_KEY` are configured

## What's next

- **Auth0** - user login connected to the database so each user only sees their own agents and spend data
- **Landing page** - finalise design and copy
- **Pitch deck** - slides for YC application
- **Event coverage** - expand SDK to cover streaming responses, tool use, and multi-turn conversations
