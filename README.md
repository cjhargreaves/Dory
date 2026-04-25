# Dory

AI agent spend management — track, monitor, and control costs across agentic AI APIs in one place. Think Ramp for AI agents.

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

- **Landing page** — full marketing page with brand palette
- **Backend skeleton** — FastAPI app with CORS, health check, config
- **SDK** — `dory.wrap()` wraps the Anthropic client, captures token usage, calculates cost per model, and fires spend events to the backend in a background thread
- **Spend ingestion** — `POST /api/events` receives SDK events and logs cost (auth via API key)
- **Spend read endpoints** — `GET /api/spend/summary` and `GET /api/spend/events` for aggregated and raw data

## What's next

- **MongoDB (Atlas)** — connect the database so spend events are persisted instead of just logged; enables the summary and events endpoints to return real data
- **Live dashboard** — wire the frontend to the backend APIs to show real cost breakdowns per agent, replacing the placeholder numbers
- **Auth0** — user login connected to the database so each user only sees their own agents and spend data
