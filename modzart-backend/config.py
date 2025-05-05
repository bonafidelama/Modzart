# config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:lama123@localhost/gta_mods"
    SECRET_KEY: str = "YOUR_VERY_SECRET_KEY_NEEDS_TO_BE_CHANGED"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Storage configuration
    STORAGE_MODE: str = "local"  # Options: "local" or "s3"
    LOCAL_STORAGE_PATH: str = "local_storage"
    
    # S3 Settings (used when STORAGE_MODE is "s3")
    S3_BUCKET_NAME: str = "modzart-files"
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None

    TEMP_UPLOAD_DIR: str = "temp_uploads"
    VIRUS_TOTAL_API_KEY: str | None = None

    class Config:
        env_file = '.env'
        extra = 'ignore'

settings = Settings()