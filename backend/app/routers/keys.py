import hashlib
import secrets
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.database import get_db
from app.limiter import limiter

router = APIRouter()


def _generate_key() -> tuple[str, str]:
    raw = secrets.token_hex(24)
    full_key = f"keel_sk_live_{raw}"
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, key_hash


class CreateKeyRequest(BaseModel):
    user_id: str
    name: str


@router.post("/api/keys")
@limiter.limit("10/minute")
async def create_key(request: Request, body: CreateKeyRequest):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    full_key, key_hash = _generate_key()
    db = get_db()
    doc = {
        "user_id": body.user_id,
        "name": body.name.strip(),
        "key_prefix": full_key[:20] + "...",
        "key_hash": key_hash,
        "created_at": datetime.now(timezone.utc),
        "last_used_at": None,
        "is_active": True,
    }
    result = await db.api_keys.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "name": doc["name"],
        "key": full_key,
        "key_prefix": doc["key_prefix"],
        "created_at": doc["created_at"].isoformat(),
    }


@router.get("/api/keys")
@limiter.limit("30/minute")
async def list_keys(request: Request, user_id: str):
    db = get_db()
    cursor = db.api_keys.find(
        {"user_id": user_id, "is_active": True},
        {"key_hash": 0},
    ).sort("created_at", -1)
    keys = []
    async for doc in cursor:
        keys.append({
            "id": str(doc["_id"]),
            "name": doc["name"],
            "key_prefix": doc["key_prefix"],
            "created_at": doc["created_at"].isoformat(),
            "last_used_at": doc["last_used_at"].isoformat() if doc.get("last_used_at") else None,
        })
    return {"keys": keys}


@router.delete("/api/keys/{key_id}")
@limiter.limit("20/minute")
async def revoke_key(request: Request, key_id: str, user_id: str):
    db = get_db()
    try:
        oid = ObjectId(key_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid key ID")
    result = await db.api_keys.update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": {"is_active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"ok": True}
