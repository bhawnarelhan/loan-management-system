from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:Password@localhost:3306/loan_management"
    SECRET_KEY: str = "anybc57e08dc6ababe63fbea1e4944556c3a6aa23ae7d1594d8ade2f8b977099c71"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()