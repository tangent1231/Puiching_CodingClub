"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "Puiching Coding Club Honor Wall API"
    debug: bool = False
    frontend_origin: str = "http://localhost:5173"
    allowed_origins: str = ""

    # Feishu / Lark credentials
    feishu_app_id: str = ""
    feishu_app_secret: str = ""
    feishu_base_token: str = ""

    # Feishu Base table IDs
    feishu_table_awards: str = "tblz5yriuusSS0Bx"
    feishu_table_events: str = "tblSq9j0n3qCCCC4"
    feishu_table_photos: str = "tblAffWQi5HBxAcA"

    # Admin auth
    admin_username: str = "admin"
    admin_password_hash: str = ""
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Rate limiting
    login_rate_limit: int = 5
    login_rate_limit_window_seconds: int = 60

    @property
    def feishu_configured(self) -> bool:
        return bool(
            self.feishu_app_id and self.feishu_app_secret and self.feishu_base_token
        )

    @property
    def cors_origins(self) -> list[str]:
        origins = []
        if self.frontend_origin:
            origins.append(self.frontend_origin)
        if self.allowed_origins:
            origins.extend([o.strip() for o in self.allowed_origins.split(",")])
        return origins or ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
