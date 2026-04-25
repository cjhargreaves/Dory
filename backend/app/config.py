from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_url: str
    mongodb_db: str = "dory"

    auth0_domain: str
    auth0_audience: str
    auth0_client_id: str

    model_config = {"env_file": ".env"}


settings = Settings()
