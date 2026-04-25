from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime, timezone

from app.config import settings

router = APIRouter()


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.anthropic_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


class SpendEvent(BaseModel):
    agent: str
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float


@router.post("/api/events", dependencies=[Depends(verify_api_key)])
async def ingest_event(event: SpendEvent):
    print(f"[dory] agent={event.agent} model={event.model} "
          f"input={event.input_tokens} output={event.output_tokens} "
          f"cost=${event.cost_usd:.6f}")
    # db = get_db()
    # await db.spend_events.insert_one({
    #     **event.model_dump(),
    #     "timestamp": datetime.now(timezone.utc),
    # })
    return {"ok": True}
