from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import verify_api_key

router = APIRouter()


class CallSite(BaseModel):
    file: str
    line: int
    function: str
    snippet: Optional[str] = None
    snippet_start_line: Optional[int] = None


class SpendEvent(BaseModel):
    agent: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    function_name: Optional[str] = None
    call_site: Optional[CallSite] = None


@router.post("/api/events", dependencies=[Depends(verify_api_key)])
async def ingest_event(event: SpendEvent):
    print(f"[dory] agent={event.agent} model={event.model} "
          f"input={event.input_tokens} output={event.output_tokens} "
          f"cost=${event.cost_usd:.6f}")
    db = get_db()
    event_data = event.model_dump(exclude_none=True)
    await db.spend_events.insert_one({
        **event_data,
        "timestamp": datetime.now(timezone.utc),
    })
    return {"ok": True}
