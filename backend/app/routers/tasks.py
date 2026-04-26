from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.dependencies import verify_api_key

router = APIRouter()


class TaskCreate(BaseModel):
    name: str
    agent: str = "cascade"


@router.post("/api/tasks", dependencies=[Depends(verify_api_key)])
async def create_task(body: TaskCreate):
    db = get_db()
    task_id = str(uuid.uuid4())[:8]
    await db.tasks.insert_one({
        "task_id": task_id,
        "name": body.name,
        "agent": body.agent,
        "started_at": datetime.now(timezone.utc),
        "ended_at": None,
    })
    return {"task_id": task_id, "name": body.name}


@router.post("/api/tasks/{task_id}/end", dependencies=[Depends(verify_api_key)])
async def end_task(task_id: str):
    db = get_db()
    task = await db.tasks.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    ended_at = datetime.now(timezone.utc)
    await db.tasks.update_one({"task_id": task_id}, {"$set": {"ended_at": ended_at}})

    events = await db.spend_events.find(
        {"agent": task["agent"], "timestamp": {"$gte": task["started_at"], "$lte": ended_at}},
        {"_id": 0, "cost_usd": 1},
    ).to_list(length=1000)

    total_cost = sum(e["cost_usd"] for e in events)
    duration_s = (ended_at - task["started_at"]).total_seconds()

    return {
        "task_id": task_id,
        "name": task["name"],
        "agent": task["agent"],
        "cost_usd": round(total_cost, 6),
        "call_count": len(events),
        "duration_seconds": round(duration_s),
    }


@router.get("/api/tasks", dependencies=[Depends(verify_api_key)])
async def list_tasks():
    db = get_db()
    now = datetime.now(timezone.utc)

    tasks = await db.tasks.find({}, {"_id": 0}).sort("started_at", -1).limit(20).to_list(length=20)

    result = []
    for task in tasks:
        ended_at = task.get("ended_at") or now
        events = await db.spend_events.find(
            {"agent": task["agent"], "timestamp": {"$gte": task["started_at"], "$lte": ended_at}},
            {"_id": 0, "cost_usd": 1},
        ).to_list(length=1000)

        result.append({
            "task_id": task["task_id"],
            "name": task["name"],
            "agent": task["agent"],
            "started_at": task["started_at"].isoformat(),
            "ended_at": task["ended_at"].isoformat() if task.get("ended_at") else None,
            "duration_seconds": round((ended_at - task["started_at"]).total_seconds()),
            "cost_usd": round(sum(e["cost_usd"] for e in events), 6),
            "call_count": len(events),
        })

    return {"tasks": result}
