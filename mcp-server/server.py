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

server = Server("dory")


def api_get(path: str) -> dict:
    req = urllib.request.Request(
        f"{API_URL}{path}",
        headers={"X-API-Key": API_KEY},
    )
    return json.loads(urllib.request.urlopen(req, timeout=5).read())


def api_post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API_URL}{path}",
        data=data,
        headers={"Content-Type": "application/json", "X-API-Key": API_KEY},
    )
    return json.loads(urllib.request.urlopen(req, timeout=5).read())


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="log_spend",
            description="Log an AI API spend event to Dory. Call this after any model call to track cost.",
            inputSchema={
                "type": "object",
                "properties": {
                    "agent":         {"type": "string", "description": "Name of the agent or task"},
                    "model":         {"type": "string", "description": "Model used e.g. claude-sonnet-4-6"},
                    "input_tokens":  {"type": "integer"},
                    "output_tokens": {"type": "integer"},
                    "cost_usd":      {"type": "number"},
                },
                "required": ["agent", "model", "input_tokens", "output_tokens", "cost_usd"],
            },
        ),
        types.Tool(
            name="get_summary",
            description="Get total spend and per-agent breakdown for the last 30 days.",
            inputSchema={"type": "object", "properties": {}},
        ),
        types.Tool(
            name="check_budget",
            description="Check how much an agent has spent and whether it is approaching its limit. Use this before expensive operations.",
            inputSchema={
                "type": "object",
                "properties": {
                    "agent": {"type": "string", "description": "Agent name to check"},
                },
                "required": ["agent"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        if name == "log_spend":
            result = api_post("/api/events", arguments)
            return [types.TextContent(type="text", text=f"Logged: {arguments['agent']} used {arguments['model']} — ${arguments['cost_usd']:.6f}")]

        if name == "get_summary":
            result = api_get("/api/spend/summary")
            lines = [f"Total (30d): ${result['total_cost_usd']:.6f}", ""]
            for a in result["agents"]:
                lines.append(f"  {a['agent']}: ${a['total_cost_usd']:.6f} over {a['call_count']} calls")
            return [types.TextContent(type="text", text="\n".join(lines))]

        if name == "check_budget":
            agent = arguments["agent"]
            result = api_get("/api/spend/summary")
            match = next((a for a in result["agents"] if a["agent"] == agent), None)
            if not match:
                return [types.TextContent(type="text", text=f"No spend recorded for agent '{agent}'")]
            return [types.TextContent(
                type="text",
                text=f"{agent}: ${match['total_cost_usd']:.6f} spent, {match['call_count']} calls in the last 30 days",
            )]

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
