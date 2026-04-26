import asyncio
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.dependencies import verify_api_key

router = APIRouter()


@router.get("/api/spend/summary", dependencies=[Depends(verify_api_key)])
async def spend_summary():
    db = get_db()

    since = datetime.now(timezone.utc) - timedelta(days=30)

    # Agent-level aggregation
    agent_pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {
            "_id": "$agent",
            "total_cost_usd": {"$sum": "$cost_usd"},
            "total_input_tokens": {"$sum": "$input_tokens"},
            "total_output_tokens": {"$sum": "$output_tokens"},
            "call_count": {"$sum": 1},
            "last_seen": {"$max": "$timestamp"},
        }},
        {"$sort": {"total_cost_usd": -1}},
    ]

    agents = await db.spend_events.aggregate(agent_pipeline).to_list(length=100)
    for a in agents:
        a["agent"] = a.pop("_id")

    # Model-level aggregation
    model_pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {
            "_id": "$model",
            "total_cost_usd": {"$sum": "$cost_usd"},
            "total_input_tokens": {"$sum": "$input_tokens"},
            "total_output_tokens": {"$sum": "$output_tokens"},
            "call_count": {"$sum": 1},
            "agents": {"$addToSet": "$agent"},
        }},
        {"$sort": {"total_cost_usd": -1}},
    ]

    models = await db.spend_events.aggregate(model_pipeline).to_list(length=100)
    for m in models:
        m["model"] = m.pop("_id")
        m["agent_count"] = len(m["agents"])
        del m["agents"]

    # Function-level spend aggregation (e.g. authentication, parsing, routing)
    function_pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {
            "_id": {"function_name": {"$ifNull": ["$function_name", "unspecified"]}},
            "total_cost_usd": {"$sum": "$cost_usd"},
            "total_input_tokens": {"$sum": "$input_tokens"},
            "total_output_tokens": {"$sum": "$output_tokens"},
            "call_count": {"$sum": 1},
            "models": {"$addToSet": "$model"},
            "call_site": {"$last": "$call_site"},
        }},
        {"$sort": {"total_cost_usd": -1}},
    ]

    functions = await db.spend_events.aggregate(function_pipeline).to_list(length=100)
    for f in functions:
        f["function_name"] = f.pop("_id")["function_name"]
        f["model_count"] = len(f["models"])
        del f["models"]
        if not f.get("call_site"):
            f.pop("call_site", None)

    total = sum(a["total_cost_usd"] for a in agents)

    return {
        "total_cost_usd": round(total, 6),
        "agents": agents,
        "models": models,
        "functions": functions,
    }


@router.get("/api/spend/detailed", dependencies=[Depends(verify_api_key)])
async def spend_detailed():
    db = get_db()

    since = datetime.now(timezone.utc) - timedelta(days=30)

    pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {
            "_id": {"agent": "$agent", "model": "$model", "function_name": {"$ifNull": ["$function_name", "unspecified"]}},
            "total_cost_usd": {"$sum": "$cost_usd"},
            "total_input_tokens": {"$sum": "$input_tokens"},
            "total_output_tokens": {"$sum": "$output_tokens"},
            "call_count": {"$sum": 1},
            "last_seen": {"$max": "$timestamp"},
        }},
        {"$sort": {"total_cost_usd": -1}},
    ]

    details = await db.spend_events.aggregate(pipeline).to_list(length=200)
    for d in details:
        d["agent"] = d["_id"]["agent"]
        d["model"] = d["_id"]["model"]
        d["function_name"] = d["_id"]["function_name"]
        del d["_id"]

    return {"details": details}


@router.delete("/api/spend/all", dependencies=[Depends(verify_api_key)])
async def delete_all_events():
    db = get_db()
    result = await db.spend_events.delete_many({})
    return {"deleted": result.deleted_count}


@router.get("/api/spend/events", dependencies=[Depends(verify_api_key)])
async def recent_events():
    db = get_db()
    events = await db.spend_events.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(length=50)
    return {"events": events}


@router.get("/api/spend/session", dependencies=[Depends(verify_api_key)])
async def session_spend(hours: int = 4):
    db = get_db()
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    events = await db.spend_events.find(
        {"timestamp": {"$gte": since}}, {"_id": 0}
    ).sort("cost_usd", -1).to_list(length=500)

    total = sum(e["cost_usd"] for e in events)

    by_agent: dict = {}
    for e in events:
        a = e["agent"]
        if a not in by_agent:
            by_agent[a] = {"agent": a, "total_cost_usd": 0.0, "call_count": 0}
        by_agent[a]["total_cost_usd"] += e["cost_usd"]
        by_agent[a]["call_count"] += 1

    agents = sorted(by_agent.values(), key=lambda x: x["total_cost_usd"], reverse=True)
    for a in agents:
        a["total_cost_usd"] = round(a["total_cost_usd"], 6)

    top_calls = []
    for e in events[:10]:
        call = {
            "agent": e["agent"],
            "model": e.get("model", "unknown"),
            "cost_usd": round(e["cost_usd"], 6),
            "input_tokens": e.get("input_tokens", 0),
            "output_tokens": e.get("output_tokens", 0),
            "function_name": e.get("function_name"),
        }
        if e.get("call_site"):
            call["call_site"] = e["call_site"]
        top_calls.append(call)

    return {
        "hours": hours,
        "total_cost_usd": round(total, 6),
        "call_count": len(events),
        "agents": agents,
        "top_calls": top_calls,
    }


@router.get("/api/spend/stream")
async def spend_stream(request: Request):
    db = get_db()

    async def generate():
        yield "data: connected\n\n"
        try:
            async with db.spend_events.watch(
                [{"$match": {"operationType": "insert"}}],
                full_document="updateLookup",
            ) as stream:
                async for _ in stream:
                    if await request.is_disconnected():
                        break
                    yield "data: update\n\n"
        except Exception:
            # MongoDB without replica set: fall back to heartbeat-only
            while not await request.is_disconnected():
                await asyncio.sleep(30)
                yield "data: ping\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
