from fastapi import APIRouter, Depends, HTTPException, Header
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.config import settings

router = APIRouter()


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


@router.get("/api/spend/summary", dependencies=[Depends(verify_api_key)])
async def spend_summary():
    db = get_db()

    since = datetime.now(timezone.utc) - timedelta(days=30)

    pipeline = [
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

    agents = await db.spend_events.aggregate(pipeline).to_list(length=100)
    for a in agents:
        a["agent"] = a.pop("_id")

    total = sum(a["total_cost_usd"] for a in agents)

    return {
        "total_cost_usd": round(total, 6),
        "agents": agents,
    }


@router.get("/api/spend/events", dependencies=[Depends(verify_api_key)])
async def recent_events():
    db = get_db()
    events = await db.spend_events.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(length=50)
    return {"events": events}
