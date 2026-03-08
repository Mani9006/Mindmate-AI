"""
MindMate AI - Memory Service Configuration
Vector memory service configuration for Pinecone and embedding settings.
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class PineconeConfig:
    """Pinecone vector database configuration."""
    api_key: str
    environment: str
    index_name: str
    namespace_prefix: str = "mindmate"
    dimension: int = 1536  # OpenAI text-embedding-3-small dimension
    metric: str = "cosine"
    cloud: str = "aws"
    region: str = "us-east-1"


@dataclass
class EmbeddingConfig:
    """Embedding service configuration."""
    provider: str = "openai"  # openai, cohere, etc.
    model: str = "text-embedding-3-small"
    api_key: str = ""
    batch_size: int = 100
    max_tokens_per_chunk: int = 8191


@dataclass
class MemoryConfig:
    """Memory service configuration."""
    # Chunking settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Retrieval settings
    default_top_k: int = 5
    max_top_k: int = 20
    similarity_threshold: float = 0.7
    
    # Consolidation settings
    consolidation_days: int = 7
    min_memories_for_consolidation: int = 10
    max_summary_length: int = 2000
    
    # GDPR settings
    soft_delete_ttl_days: int = 30
    
    # Caching settings
    cache_ttl_seconds: int = 300


class Config:
    """Main configuration class for Memory Service."""
    
    def __init__(self):
        # Pinecone settings
        self.pinecone = PineconeConfig(
            api_key=os.getenv("PINECONE_API_KEY", ""),
            environment=os.getenv("PINECONE_ENVIRONMENT", "us-east-1-aws"),
            index_name=os.getenv("PINECONE_INDEX_NAME", "mindmate-memories"),
            namespace_prefix=os.getenv("PINECONE_NAMESPACE_PREFIX", "mindmate"),
            dimension=int(os.getenv("PINECONE_DIMENSION", "1536")),
            metric=os.getenv("PINECONE_METRIC", "cosine"),
            cloud=os.getenv("PINECONE_CLOUD", "aws"),
            region=os.getenv("PINECONE_REGION", "us-east-1"),
        )
        
        # Embedding settings
        self.embedding = EmbeddingConfig(
            provider=os.getenv("EMBEDDING_PROVIDER", "openai"),
            model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
            api_key=os.getenv("OPENAI_API_KEY", ""),
            batch_size=int(os.getenv("EMBEDDING_BATCH_SIZE", "100")),
            max_tokens_per_chunk=int(os.getenv("EMBEDDING_MAX_TOKENS", "8191")),
        )
        
        # Memory settings
        self.memory = MemoryConfig(
            chunk_size=int(os.getenv("MEMORY_CHUNK_SIZE", "1000")),
            chunk_overlap=int(os.getenv("MEMORY_CHUNK_OVERLAP", "200")),
            default_top_k=int(os.getenv("MEMORY_DEFAULT_TOP_K", "5")),
            max_top_k=int(os.getenv("MEMORY_MAX_TOP_K", "20")),
            similarity_threshold=float(os.getenv("MEMORY_SIMILARITY_THRESHOLD", "0.7")),
            consolidation_days=int(os.getenv("MEMORY_CONSOLIDATION_DAYS", "7")),
            min_memories_for_consolidation=int(os.getenv("MEMORY_MIN_CONSOLIDATION", "10")),
            max_summary_length=int(os.getenv("MEMORY_MAX_SUMMARY_LENGTH", "2000")),
            soft_delete_ttl_days=int(os.getenv("MEMORY_SOFT_DELETE_TTL", "30")),
            cache_ttl_seconds=int(os.getenv("MEMORY_CACHE_TTL", "300")),
        )
    
    def validate(self) -> list[str]:
        """Validate configuration and return list of errors."""
        errors = []
        
        if not self.pinecone.api_key:
            errors.append("PINECONE_API_KEY is required")
        
        if not self.embedding.api_key:
            errors.append("EMBEDDING_API_KEY (or OPENAI_API_KEY) is required")
        
        if self.pinecone.dimension not in [384, 768, 1024, 1536, 3072]:
            errors.append(f"Invalid embedding dimension: {self.pinecone.dimension}")
        
        return errors


# Global config instance
config = Config()
