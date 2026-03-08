"""
MindMate AI - Embedding Service
Text embedding generation using OpenAI and other providers.
"""

import logging
import asyncio
from typing import List, Union, Optional
from dataclasses import dataclass
import time

import openai
from openai import AsyncOpenAI

from config import config, EmbeddingConfig

logger = logging.getLogger(__name__)


@dataclass
class EmbeddingResult:
    """Result of embedding generation."""
    text: str
    embedding: List[float]
    model: str
    tokens_used: int
    latency_ms: float


class EmbeddingService:
    """
    Service for generating text embeddings.
    
    Supports multiple providers (OpenAI, Cohere) with caching and batching.
    """
    
    _instance: Optional["EmbeddingService"] = None
    _client: Optional[AsyncOpenAI] = None
    
    def __new__(cls) -> "EmbeddingService":
        """Singleton pattern for embedding service."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize embedding service."""
        if self._client is not None:
            return
        
        self.cfg: EmbeddingConfig = config.embedding
        self._initialize_client()
        self._cache: dict = {}  # Simple in-memory cache
    
    def _initialize_client(self) -> None:
        """Initialize the embedding client."""
        if self.cfg.provider == "openai":
            self._client = AsyncOpenAI(api_key=self.cfg.api_key)
            logger.info(f"OpenAI embedding client initialized with model: {self.cfg.model}")
        elif self.cfg.provider == "cohere":
            # TODO: Implement Cohere support
            raise NotImplementedError("Cohere provider not yet implemented")
        else:
            raise ValueError(f"Unsupported embedding provider: {self.cfg.provider}")
    
    @property
    def client(self) -> AsyncOpenAI:
        """Get the embedding client."""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        import hashlib
        return hashlib.md5(f"{self.cfg.model}:{text}".encode()).hexdigest()
    
    async def embed_text(
        self,
        text: str,
        use_cache: bool = True
    ) -> EmbeddingResult:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            use_cache: Whether to use caching
            
        Returns:
            Embedding result
        """
        start_time = time.time()
        
        # Check cache
        if use_cache:
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                cached = self._cache[cache_key]
                return EmbeddingResult(
                    text=text,
                    embedding=cached["embedding"],
                    model=self.cfg.model,
                    tokens_used=cached.get("tokens", 0),
                    latency_ms=0
                )
        
        try:
            response = await self.client.embeddings.create(
                model=self.cfg.model,
                input=text,
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            tokens_used = response.usage.total_tokens if response.usage else 0
            latency_ms = (time.time() - start_time) * 1000
            
            # Cache result
            if use_cache:
                self._cache[cache_key] = {
                    "embedding": embedding,
                    "tokens": tokens_used
                }
            
            return EmbeddingResult(
                text=text,
                embedding=embedding,
                model=self.cfg.model,
                tokens_used=tokens_used,
                latency_ms=latency_ms
            )
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    async def embed_batch(
        self,
        texts: List[str],
        use_cache: bool = True,
        batch_size: Optional[int] = None
    ) -> List[EmbeddingResult]:
        """
        Generate embeddings for multiple texts in batches.
        
        Args:
            texts: List of texts to embed
            use_cache: Whether to use caching
            batch_size: Override default batch size
            
        Returns:
            List of embedding results
        """
        if not texts:
            return []
        
        batch_size = batch_size or self.cfg.batch_size
        results = []
        
        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_results = await self._embed_batch_internal(batch, use_cache)
            results.extend(batch_results)
        
        return results
    
    async def _embed_batch_internal(
        self,
        texts: List[str],
        use_cache: bool
    ) -> List[EmbeddingResult]:
        """Internal batch embedding method."""
        start_time = time.time()
        
        # Check cache for each text
        texts_to_embed = []
        cache_indices = {}
        cached_results = {}
        
        for idx, text in enumerate(texts):
            if use_cache:
                cache_key = self._get_cache_key(text)
                if cache_key in self._cache:
                    cached = self._cache[cache_key]
                    cached_results[idx] = EmbeddingResult(
                        text=text,
                        embedding=cached["embedding"],
                        model=self.cfg.model,
                        tokens_used=cached.get("tokens", 0),
                        latency_ms=0
                    )
                else:
                    texts_to_embed.append((idx, text, cache_key))
            else:
                texts_to_embed.append((idx, text, None))
        
        # If all cached, return cached results
        if not texts_to_embed:
            return [cached_results[i] for i in range(len(texts))]
        
        # Embed non-cached texts
        try:
            response = await self.client.embeddings.create(
                model=self.cfg.model,
                input=[t[1] for t in texts_to_embed],
                encoding_format="float"
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Build results
            results = [None] * len(texts)
            
            # Fill cached results
            for idx, result in cached_results.items():
                results[idx] = result
            
            # Fill new results
            for i, (idx, text, cache_key) in enumerate(texts_to_embed):
                embedding = response.data[i].embedding
                
                # Cache result
                if use_cache and cache_key:
                    self._cache[cache_key] = {
                        "embedding": embedding,
                        "tokens": 0  # Batch doesn't give per-item token count
                    }
                
                results[idx] = EmbeddingResult(
                    text=text,
                    embedding=embedding,
                    model=self.cfg.model,
                    tokens_used=0,
                    latency_ms=latency_ms / len(texts_to_embed) if texts_to_embed else 0
                )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            raise
    
    def clear_cache(self) -> int:
        """Clear embedding cache. Returns number of entries cleared."""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cleared {count} entries from embedding cache")
        return count
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics."""
        return {
            "entries": len(self._cache),
            "estimated_size_bytes": len(self._cache) * self.cfg.dimension * 4  # float32
        }
    
    async def health_check(self) -> dict:
        """Perform health check on embedding service."""
        try:
            start_time = time.time()
            result = await self.embed_text("health check", use_cache=False)
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "provider": self.cfg.provider,
                "model": self.cfg.model,
                "dimension": len(result.embedding),
                "latency_ms": latency_ms,
                "cache_entries": len(self._cache)
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": self.cfg.provider,
                "model": self.cfg.model,
                "error": str(e)
            }


# Global service instance
def get_embedding_service() -> EmbeddingService:
    """Get the global embedding service instance."""
    return EmbeddingService()


# Convenience functions for direct use
async def embed_text(text: str) -> List[float]:
    """Quick embed function for single text."""
    service = get_embedding_service()
    result = await service.embed_text(text)
    return result.embedding


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Quick embed function for multiple texts."""
    service = get_embedding_service()
    results = await service.embed_batch(texts)
    return [r.embedding for r in results]
