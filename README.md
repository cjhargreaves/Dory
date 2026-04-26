# Dory

AI agent spend management. Track, monitor, and control costs across agentic AI APIs in one place.

## Stack

- **Frontend:** Next.js + Tailwind CSS, deployed on Vercel
- **Backend:** FastAPI + MongoDB, deployed on Railway
- **Auth:** Clerk
- **SDK:** Python (`dory-sdk`)
- **MCP Server:** Windsurf/Cascade integration

## Getting started

### Backend (local)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `backend/.env`:

```
MONGODB_URL=your-mongodb-atlas-url
MONGODB_DB=dory
DORY_API_KEY=your-api-key
```

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your-api-key
```


## SDK usage

Install and wrap your Anthropic client with one line:

```bash
pip install -e sdk/
```

```python
import anthropic
import dory

client = dory.wrap(
    anthropic.Anthropic(api_key="sk-ant-..."),
    agent="my-agent",
    api_url="https://your-railway-url.up.railway.app",
    api_key="your-dory-key",
)

# Use exactly like the normal Anthropic client
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=100,
    messages=[{"role": "user", "content": "Hello"}],
)
```

Every call automatically tracks token usage and cost in the background without blocking your agent.

To seed test data:

```bash
python3 test_data.py
```

---

## MCP server usage (Windsurf/Cascade)

The MCP server gives Cascade budget awareness tools it can call mid-task.

Install dependencies:

```bash
source backend/venv/bin/activate
pip install -e mcp-server/
```

Add to your Windsurf MCP config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "dory": {
      "command": "/Users/cjh/Work/Dory/backend/venv/bin/python3",
      "args": ["/Users/cjh/Work/Dory/mcp-server/server.py"],
      "env": {
        "DORY_API_URL": "https://your-railway-url.up.railway.app",
        "DORY_API_KEY": "your-dory-key"
      }
    }
  }
}
```

Restart Windsurf. Cascade will have access to three tools:

- `log_spend` - log a spend event for a given agent and model
- `get_summary` - get total spend and per-agent breakdown for the last 30 days
- `check_budget` - check how much a specific agent has spent

---

## What's done

- **Backend** - FastAPI app with CORS, health check, MongoDB Atlas connection
- **SDK** - `dory.wrap()` wraps the Anthropic client, captures token usage, calculates cost per model, and fires spend events to the backend in a background thread
- **Spend ingestion** - `POST /api/events` receives SDK events and persists them to MongoDB
- **Spend read endpoints** - `GET /api/spend/summary` and `GET /api/spend/events` for aggregated and raw data
- **MCP server** - Windsurf/Cascade integration exposing log_spend, get_summary, and check_budget tools
- **Auth** - Clerk authentication, dashboard protected behind login
- **Frontend** - Landing page + dashboard showing real spend data per agent
- **Deployment** - Frontend on Vercel, backend on Railway

## What's next

- Per-user data isolation so each user only sees their own agents and spend
- Budget alerts and hard caps per agent
- Streaming response support in the SDK
- Expand event coverage to tool use and multi-turn conversations
