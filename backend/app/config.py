from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_url: str
    mongodb_db: str = "keel"
    mongodb_server_selection_timeout_ms: int = 5000
    mongodb_connect_timeout_ms: int = 5000

    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    google_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_api_version: str = "v1beta"
    keel_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    @property
    def backend_api_key(self) -> str:
        api_key = self.keel_api_key or self.anthropic_api_key
        if not api_key:
            raise ValueError("Set DORY_API_KEY or ANTHROPIC_API_KEY in backend/.env")
        return api_key

    @property
    def gemini_backend_api_key(self) -> str:
        api_key = self.gemini_api_key or self.google_api_key
        if not api_key:
            raise ValueError("Set GEMINI_API_KEY or GOOGLE_API_KEY in backend/.env")
        return api_key


settings = Settings()
