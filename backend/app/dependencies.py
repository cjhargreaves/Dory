import hashlib
from datetime import datetime, timezone

from fastapi import Header, HTTPException

from app.config import settings
from app.database import get_db


async def verify_api_key(x_api_key: str = Header(...)):
    # Master key always works
    if x_api_key == settings.backend_api_key:
        return

    # Check against stored key hashes
    db = get_db()
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    doc = await db.api_keys.find_one({"key_hash": key_hash, "is_active": True})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid API key")

    await db.api_keys.update_one(
        {"_id": doc["_id"]},
        {"$set": {"last_used_at": datetime.now(timezone.utc)}},
    )
