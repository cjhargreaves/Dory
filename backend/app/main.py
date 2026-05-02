from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai, health, events, spend, tasks, keys
from app.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db = await connect_db()
    print(f"[keel] MongoDB connected to database '{db.name}'")
    yield
    # Shutdown
    await close_db()
    print("[keel] MongoDB disconnected")


app = FastAPI(title="Keel API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://keeldev.xyz",
        "https://www.keeldev.xyz",
        "https://keel.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(events.router)
app.include_router(spend.router)
app.include_router(ai.router)
app.include_router(tasks.router)
app.include_router(keys.router)
