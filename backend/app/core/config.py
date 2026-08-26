from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379/0"
    database_url: str = "postgresql+psycopg://anykit:anykit@postgres:5432/anykit"
    jwt_secret: str = "anykit-development-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 1440
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
