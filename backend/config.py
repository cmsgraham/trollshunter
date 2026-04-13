from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    x_client_id: str = ""
    x_client_secret: str = ""
    x_bearer_token: str = ""
    app_secret_key: str = "change-this-to-a-random-secret-key"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    x_callback_url: str = "http://localhost:8000/auth/callback"
    database_url: str = "sqlite:///./trollhunter.db"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
