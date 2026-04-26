from fastapi import Header, HTTPException

from app.config import settings


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.backend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
