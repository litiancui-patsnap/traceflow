from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Traceflow"
    app_env: str = "development"
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    database_url: str = "sqlite:///./app.db"
    openai_api_key: str = ""
    openai_base_url: str = "https://ai.hhhl.cc/v1"
    openai_model: str = "gpt-5.4"
    openai_trust_env: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
