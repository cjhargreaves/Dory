from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, events, spend

app = FastAPI(title="Dory API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(events.router)
app.include_router(spend.router)
