# Dory

AI agent spend management. Track, monitor, and control costs across agentic AI APIs in one place.

## Stack

- **Frontend:** Next.js + Tailwind CSS
- **Backend:** FastAPI + MongoDB
- **Auth:** Auth0
- **SDK:** Python (`dory-sdk`)
- **MCP Server:** Windsurf/Cascade integration

## Getting started

### Backend

```bash
cd backend
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

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
    api_url="http://localhost:8000",
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

To test the full pipeline:

```bash
source backend/venv/bin/activate
pip install -e sdk/
python3 test.py
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
        "DORY_API_URL": "http://localhost:8000",
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

- **Backend skeleton** - FastAPI app with CORS, health check, config
- **SDK** - `dory.wrap()` wraps the Anthropic client, captures token usage, calculates cost per model, and fires spend events to the backend in a background thread
- **Spend ingestion** - `POST /api/events` receives SDK events and logs cost (auth via API key)
- **Spend read endpoints** - `GET /api/spend/summary` and `GET /api/spend/events` for aggregated and raw data
- **MCP server** - Windsurf/Cascade integration exposing log_spend, get_summary, and check_budget tools

## What's next

- **MongoDB (Atlas)** - connect the database so spend events are persisted instead of just logged
- **Live dashboard** - wire the frontend to the backend APIs to show real cost breakdowns per agent, replacing the placeholder numbers
- **Auth0** - user login connected to the database so each user only sees their own agents and spend data
- **Landing page** - finalise design and copy
- **Pitch deck** - slides for YC application
- **Event coverage** - expand SDK to cover streaming responses, tool use, and multi-turn conversations
