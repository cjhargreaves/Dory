# Dory

<img src="frontend/public/icon.png" width="80" />

Dory tracks what your AI agents spend. Wrap your LLM client with one line of Python and every call, tokens, cost, and source location shows up in your dashboard in real time.

## Why

Agentic AI costs are invisible until they aren't. Dory makes them visible as they happen: per agent, per function, per line of code. You can see which task cost $0.43, which function is driving 80% of your bill, and whether an agent is approaching its budget before it does.

## Features

- Multi-provider SDK wrapping Anthropic, OpenAI, and Gemini with zero code changes
- Source capture records the exact file, line, and function behind each call
- Live dashboard via MongoDB change streams, no refresh needed
- Agent pie chart and time series showing cost breakdown and trend
- Function breakdown with inline code snippets
- Per-task tracking groups spend by what you were building
- Budget tracking lets any MCP agent check remaining budget mid-task
- MCP integration with five tools for any MCP-compatible coding agent
- AI suggestions powered by Gemini with actionable cost recommendations

## Stack

- **Frontend:** Next.js + Tailwind, deployed on Vercel
- **Backend:** FastAPI + MongoDB Atlas, deployed on Railway
- **Auth:** Clerk
- **SDK:** Python (`dory-sdk`)
- **MCP Server:** stdio, works with any MCP-compatible agent

## API

All endpoints require `X-API-Key: <your-dory-key>`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/events` | Ingest a spend event (used by the SDK) |
| `GET` | `/api/spend/summary` | 30-day aggregated spend by agent, model, and function |
| `GET` | `/api/spend/session?hours=N` | Rolling window spend with top calls and source locations |
| `GET` | `/api/spend/events` | Raw 50 most recent events |
| `GET` | `/api/spend/stream` | SSE stream, fires `update` on every new event via MongoDB change stream |
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

**SDK and MCP setup:** [doryswimming.xyz/docs](https://doryswimming.xyz/docs)
