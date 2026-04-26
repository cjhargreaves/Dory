from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_url: str
    mongodb_db: str = "dory"
    mongodb_server_selection_timeout_ms: int = 5000
    mongodb_connect_timeout_ms: int = 5000

    anthropic_api_key: str | None = None
    dory_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

    @property
    def backend_api_key(self) -> str:
        api_key = self.dory_api_key or self.anthropic_api_key
        if not api_key:
            raise ValueError("Set DORY_API_KEY or ANTHROPIC_API_KEY in backend/.env")
        return api_key


settings = Settings()
