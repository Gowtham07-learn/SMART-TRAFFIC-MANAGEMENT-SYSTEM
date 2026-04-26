from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/stms"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "stms-super-secret-key-2026-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
