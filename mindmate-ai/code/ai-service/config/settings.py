"""
MindMate AI - Configuration Settings
Production-ready configuration management with environment variable support.
"""

import os
from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = Field(default="MindMate AI Service", env="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", env="APP_VERSION")
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="production", env="ENVIRONMENT")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    WORKERS: int = Field(default=4, env="WORKERS")
    
    # Security
    API_KEY: str = Field(default="", env="API_KEY")
    JWT_SECRET: str = Field(default="", env="JWT_SECRET")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_HOURS: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Claude API
    ANTHROPIC_API_KEY: str = Field(default="", env="ANTHROPIC_API_KEY")
    CLAUDE_MODEL: str = Field(default="claude-3-5-sonnet-20241022", env="CLAUDE_MODEL")
    CLAUDE_MAX_TOKENS: int = Field(default=4096, env="CLAUDE_MAX_TOKENS")
    CLAUDE_TEMPERATURE: float = Field(default=0.7, env="CLAUDE_TEMPERATURE")
    CLAUDE_TIMEOUT_SECONDS: int = Field(default=60, env="CLAUDE_TIMEOUT_SECONDS")
    CLAUDE_MAX_RETRIES: int = Field(default=3, env="CLAUDE_MAX_RETRIES")
    CLAUDE_RETRY_DELAY_SECONDS: float = Field(default=1.0, env="CLAUDE_RETRY_DELAY_SECONDS")
    CLAUDE_MAX_CONTEXT_TOKENS: int = Field(default=200000, env="CLAUDE_MAX_CONTEXT_TOKENS")
    
    # Pinecone
    PINECONE_API_KEY: str = Field(default="", env="PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: str = Field(default="", env="PINECONE_ENVIRONMENT")
    PINECONE_INDEX_NAME: str = Field(default="mindmate-memories", env="PINECONE_INDEX_NAME")
    PINECONE_NAMESPACE: str = Field(default="", env="PINECONE_NAMESPACE")
    PINECONE_DIMENSION: int = Field(default=1536, env="PINECONE_DIMENSION")
    PINECONE_TOP_K: int = Field(default=5, env="PINECONE_TOP_K")
    
    # Hume AI
    HUME_API_KEY: str = Field(default="", env="HUME_API_KEY")
    HUME_WEBHOOK_SECRET: str = Field(default="", env="HUME_WEBHOOK_SECRET")
    HUME_BATCH_SIZE: int = Field(default=100, env="HUME_BATCH_SIZE")
    
    # ElevenLabs
    ELEVENLABS_API_KEY: str = Field(default="", env="ELEVENLABS_API_KEY")
    ELEVENLABS_VOICE_ID: str = Field(default="21m00Tcm4TlvDq8ikWAM", env="ELEVENLABS_VOICE_ID")
    ELEVENLABS_MODEL: str = Field(default="eleven_multilingual_v2", env="ELEVENLABS_MODEL")
    ELEVENLABS_TIMEOUT_SECONDS: int = Field(default=30, env="ELEVENLABS_TIMEOUT_SECONDS")
    
    # OpenAI (for embeddings)
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    OPENAI_EMBEDDING_MODEL: str = Field(default="text-embedding-3-small", env="OPENAI_EMBEDDING_MODEL")
    
    # Redis (for session/cache)
    REDIS_URL: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    REDIS_SESSION_TTL: int = Field(default=3600, env="REDIS_SESSION_TTL")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # Crisis Detection
    CRISIS_KEYWORDS: List[str] = Field(
        default=[
            "suicide", "kill myself", "end my life", "want to die",
            "hurt myself", "self-harm", "cutting", "overdose",
            "no reason to live", "better off dead", "can't go on"
        ],
        env="CRISIS_KEYWORDS"
    )
    CRISIS_CONFIDENCE_THRESHOLD: float = Field(default=0.7, env="CRISIS_CONFIDENCE_THRESHOLD")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=60, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance
settings = get_settings()
