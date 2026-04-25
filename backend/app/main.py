from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, events, spend
from app.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db = await connect_db()
    print(f"[dory] MongoDB connected to database '{db.name}'")
    yield
    # Shutdown
    await close_db()
    print("[dory] MongoDB disconnected")


app = FastAPI(title="Dory API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(events.router)
app.include_router(spend.router)
