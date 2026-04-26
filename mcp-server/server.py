import os
import json
import asyncio
import urllib.request
import urllib.error
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

API_URL = os.environ.get("DORY_API_URL", "http://localhost:8000")
API_KEY = os.environ.get("DORY_API_KEY", "")

# Optional per-agent budgets via env: DORY_BUDGET_myagent=5.00
# or a global fallback: DORY_BUDGET=10.00
GLOBAL_BUDGET = float(os.environ.get("DORY_BUDGET", "0") or "0")

server = Server("dory")


def api_get(path: str) -> dict:
    req = urllib.request.Request(
        f"{API_URL}{path}",
        headers={"X-API-Key": API_KEY},
    )
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def get_budget_for(agent: str) -> float:
    key = f"DORY_BUDGET_{agent.upper().replace('-', '_')}"
    val = os.environ.get(key, "0") or "0"
    return float(val) or GLOBAL_BUDGET


def fmt_usd(n: float) -> str:
    return f"${n:.4f}"


def fmt_call_site(call: dict) -> str:
    cs = call.get("call_site")
    if cs:
        return f"{cs['file']}:{cs['line']} in {cs['function']}()"
    fn = call.get("function_name")
    return fn or "unknown"


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="session_spend",
            description=(
                "Show how much has been spent in the current session (last N hours), "
                "broken down by agent with the most expensive individual calls and their "
                "exact source locations. Use this to understand where cost is coming from."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "hours": {
                        "type": "integer",
                        "description": "How many hours back to look. Defaults to 4.",
                        "default": 4,
                    },
                },
            },
        ),
        types.Tool(
            name="budget_remaining",
            description=(
                "Check how much budget an agent has left. Returns current spend, "
                "configured budget, and whether the agent is over or approaching its limit. "
                "Use this before starting expensive operations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "agent": {
                        "type": "string",
                        "description": "Agent name to check.",
                    },
                },
                "required": ["agent"],
            },
        ),
        types.Tool(
            name="top_expensive_calls",
            description=(
                "Return the most expensive individual API calls with exact source file and "
                "line number. Useful for pinpointing which specific function or line of code "
                "is driving the most cost."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "hours": {
                        "type": "integer",
                        "description": "How many hours back to look. Defaults to 24.",
                        "default": 24,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of calls to return. Defaults to 5.",
                        "default": 5,
                    },
                },
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        if name == "session_spend":
            hours = int(arguments.get("hours", 4))
            data = api_get(f"/api/spend/session?hours={hours}")

            if data["call_count"] == 0:
                return [types.TextContent(type="text", text=f"No spend recorded in the last {hours}h.")]

            lines = [
                f"Session spend (last {hours}h): {fmt_usd(data['total_cost_usd'])} across {data['call_count']} calls",
                "",
                "By agent:",
            ]
            for a in data["agents"]:
                lines.append(f"  {a['agent']}: {fmt_usd(a['total_cost_usd'])} — {a['call_count']} calls")

            if data["top_calls"]:
                lines += ["", "Most expensive calls:"]
                for c in data["top_calls"][:5]:
                    source = fmt_call_site(c)
                    lines.append(f"  {fmt_usd(c['cost_usd'])}  {c['agent']} / {c['model']}  ← {source}")

            return [types.TextContent(type="text", text="\n".join(lines))]

        if name == "budget_remaining":
            agent = arguments["agent"]
            hours = 24 * 30
            data = api_get(f"/api/spend/session?hours={hours}")
            match = next((a for a in data["agents"] if a["agent"] == agent), None)
            spent = match["total_cost_usd"] if match else 0.0
            calls = match["call_count"] if match else 0
            budget = get_budget_for(agent)

            if budget == 0:
                return [types.TextContent(
                    type="text",
                    text=f"{agent}: {fmt_usd(spent)} spent across {calls} calls (30d). No budget configured — set DORY_BUDGET_{agent.upper()} to enable limits.",
                )]

            remaining = budget - spent
            pct = (spent / budget) * 100

            status = "✓ under budget"
            if pct >= 100:
                status = "✗ OVER BUDGET"
            elif pct >= 80:
                status = "⚠ approaching limit"

            return [types.TextContent(
                type="text",
                text=f"{agent}: {fmt_usd(spent)} of {fmt_usd(budget)} used ({pct:.1f}%) — {fmt_usd(remaining)} remaining. {status}",
            )]

        if name == "top_expensive_calls":
            hours = int(arguments.get("hours", 24))
            limit = int(arguments.get("limit", 5))
            data = api_get(f"/api/spend/session?hours={hours}")

            if not data["top_calls"]:
                return [types.TextContent(type="text", text=f"No calls recorded in the last {hours}h.")]

            lines = [f"Top {limit} most expensive calls (last {hours}h):"]
            for c in data["top_calls"][:limit]:
                source = fmt_call_site(c)
                lines.append(
                    f"\n  {fmt_usd(c['cost_usd'])}  {c['agent']} / {c['model']}"
                    f"\n  {c['input_tokens']} in + {c['output_tokens']} out tokens"
                    f"\n  Source: {source}"
                )

            return [types.TextContent(type="text", text="\n".join(lines))]

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        return [types.TextContent(type="text", text=f"Dory backend error: HTTP {e.code} {body or e.reason}")]
    except urllib.error.URLError as e:
        return [types.TextContent(type="text", text=f"Dory backend unreachable: {e.reason}")]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
