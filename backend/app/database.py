from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    if client is not None:
        return client[settings.mongodb_db]

    client = AsyncIOMotorClient(
        settings.mongodb_url,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        connectTimeoutMS=settings.mongodb_connect_timeout_ms,
    )
    await client.admin.command("ping")

    db = client[settings.mongodb_db]
    await db.spend_events.create_index("timestamp")
    await db.spend_events.create_index([("agent", 1), ("timestamp", -1)])
    await db.spend_events.create_index([("model", 1), ("timestamp", -1)])

    return db


async def close_db():
    global client
    if client:
        client.close()
        client = None


def get_db():
    if client is None:
        raise RuntimeError("MongoDB client is not connected")
    return client[settings.mongodb_db]
