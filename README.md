# Dory

Dory tracks what your AI agents spend. Wrap your LLM client with one line of Python and every call — tokens, cost, source location — shows up in your dashboard in real time.

## Why

Agentic AI costs are invisible until they aren't. Dory makes them visible as they happen: per agent, per function, per line of code. You can see which task cost $0.43, which function is driving 80% of your bill, and whether an agent is on track to blow its budget before it does.

## Features

- **Multi-provider SDK** — wraps Anthropic, OpenAI, and Gemini clients with zero code changes
- **Source capture** — records the exact file, line, and function that triggered each call
- **Live dashboard** — real-time spend via MongoDB change streams, no refresh needed
- **Agent pie chart + time series** — cost breakdown and trend over time
- **Function breakdown** — see spend by function with inline code snippets
- **Per-task tracking** — `start_task` / `end_task` in your MCP agent to group spend by what you were building
- **Budget tracking** — check remaining budget for any agent mid-task
- **MCP integration** — five tools available to any MCP-compatible coding agent (Windsurf/Cascade is the first supported)
- **AI suggestions** — Gemini-powered cost analysis with actionable recommendations

## Stack

- **Frontend:** Next.js + Tailwind, deployed on Vercel
- **Backend:** FastAPI + MongoDB Atlas, deployed on Railway
- **Auth:** Clerk
- **SDK:** Python (`dory-sdk`)
- **MCP Server:** stdio, works with any MCP-compatible agent

## SDK

```bash
pip install dory-sdk
```

Wrap your client once. Everything else is unchanged.

**Anthropic**
```python
import anthropic, dory

client = dory.wrap(
    anthropic.Anthropic(api_key="sk-ant-..."),
    agent="my-agent",
    api_url="https://your-backend.up.railway.app",
    api_key="your-dory-key",
)

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=256,
    messages=[{"role": "user", "content": "Summarise this"}],
)
```

**OpenAI**
```python
import openai, dory

client = dory.wrap(
    openai.OpenAI(api_key="sk-..."),
    agent="my-agent",
    api_url="https://your-backend.up.railway.app",
    api_key="your-dory-key",
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Summarise this"}],
)
```

**Gemini**
```python
import google.genai, dory

client = dory.wrap(
    google.genai.Client(api_key="AIza..."),
    agent="my-agent",
    api_url="https://your-backend.up.railway.app",
    api_key="your-dory-key",
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Summarise this",
)
```

`dory.wrap()` auto-detects the client type. After each call it reads token usage, calculates cost, and fires the event to your backend in a background thread — no latency added to your agent.

## API

All endpoints require `X-API-Key: <your-dory-key>`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/events` | Ingest a spend event (used by the SDK) |
| `GET` | `/api/spend/summary` | 30-day aggregated spend by agent, model, and function |
| `GET` | `/api/spend/session?hours=N` | Rolling window spend with top calls and source locations |
| `GET` | `/api/spend/events` | Raw 50 most recent events |
| `GET` | `/api/spend/stream` | SSE stream — fires `update` on every new event (MongoDB change stream) |
| `POST` | `/api/tasks` | Create a named task `{"name": "...", "agent": "..."}` |
| `POST` | `/api/tasks/{id}/end` | Close a task and return cost summary |
| `GET` | `/api/tasks` | List recent tasks with cost and duration |
| `DELETE` | `/api/spend/all` | Clear all spend data |

## Local setup

**Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

`backend/.env`:
```
MONGODB_URL=your-mongodb-atlas-url
MONGODB_DB=dory
DORY_API_KEY=your-api-key
GEMINI_API_KEY=your-gemini-key
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your-api-key
```

**MCP server** — see [doryswimming.xyz/docs](https://doryswimming.xyz/docs) for setup guide.
