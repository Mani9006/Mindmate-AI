"""
MindMate AI - Memory Store (Pinecone RAG)
Vector-based memory retrieval using Pinecone for semantic search.
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass
import numpy as np

import pinecone
from pinecone import Pinecone, ServerlessSpec
import openai

from config.settings import settings
from config.logging_config import logger
from src.models import Memory, RetrievedMemory, EmotionType


@dataclass
class SearchResult:
    """Result from vector search."""
    id: str
    score: float
    metadata: Dict[str, Any]
    vector: Optional[List[float]] = None


class EmbeddingGenerator:
    """Generate embeddings using OpenAI's embedding models."""
    
    def __init__(self, model: str = None, api_key: str = None):
        self.model = model or settings.OPENAI_EMBEDDING_MODEL
        self.client = openai.AsyncOpenAI(api_key=api_key or settings.OPENAI_API_KEY)
        self._cache: Dict[str, List[float]] = {}
    
    async def generate_embedding(
        self, 
        text: str, 
        use_cache: bool = True
    ) -> List[float]:
        """
        Generate embedding for text.
        
        Args:
            text: Text to embed
            use_cache: Whether to use caching
            
        Returns:
            Embedding vector as list of floats
        """
        if not text.strip():
            raise ValueError("Cannot embed empty text")
        
        # Check cache
        cache_key = hash(text)
        if use_cache and cache_key in self._cache:
            return self._cache[cache_key]
        
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text[:8000],  # Truncate if too long
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            
            # Cache result
            if use_cache:
                self._cache[cache_key] = embedding
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    async def generate_embeddings_batch(
        self, 
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts in batches."""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            try:
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=[t[:8000] for t in batch],
                    encoding_format="float"
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                embeddings.extend(batch_embeddings)
                
            except Exception as e:
                logger.error(f"Error generating batch embeddings: {e}")
                raise
        
        return embeddings
    
    def clear_cache(self):
        """Clear the embedding cache."""
        self._cache.clear()


class MemoryStore:
    """
    Pinecone-based vector store for user memories.
    Implements RAG (Retrieval-Augmented Generation) for context-aware responses.
    """
    
    def __init__(self):
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.namespace = settings.PINECONE_NAMESPACE or "default"
        self.dimension = settings.PINECONE_DIMENSION
        self.top_k = settings.PINECONE_TOP_K
        
        self.embedding_generator = EmbeddingGenerator()
        self._index: Optional[Any] = None
        
        # Initialize index
        self._ensure_index_exists()
    
    def _ensure_index_exists(self):
        """Ensure the Pinecone index exists, create if not."""
        try:
            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            
            if self.index_name not in [idx.name for idx in existing_indexes]:
                logger.info(f"Creating Pinecone index: {self.index_name}")
                
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT or "us-east-1"
                    )
                )
            
            self._index = self.pc.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Error ensuring index exists: {e}")
            raise
    
    @property
    def index(self):
        """Get the Pinecone index, initializing if needed."""
        if self._index is None:
            self._index = self.pc.Index(self.index_name)
        return self._index
    
    async def store_memory(
        self, 
        memory: Memory,
        generate_embedding: bool = True
    ) -> str:
        """
        Store a memory in the vector database.
        
        Args:
            memory: Memory object to store
            generate_embedding: Whether to generate embedding (if not provided)
            
        Returns:
            ID of stored memory
        """
        try:
            # Generate embedding if not provided
            if generate_embedding or memory.embedding is None:
                memory.embedding = await self.embedding_generator.generate_embedding(
                    memory.content
                )
            
            # Prepare metadata
            metadata = {
                "user_id": memory.user_id,
                "content": memory.content,
                "memory_type": memory.memory_type,
                "emotion_tags": [e.value for e in memory.emotion_tags],
                "importance_score": memory.importance_score,
                "created_at": memory.created_at.isoformat(),
                "access_count": memory.access_count,
                **memory.metadata
            }
            
            # Upsert to Pinecone
            self.index.upsert(
                vectors=[{
                    "id": memory.id,
                    "values": memory.embedding,
                    "metadata": metadata
                }],
                namespace=f"{self.namespace}_{memory.user_id}"
            )
            
            logger.info(
                f"Stored memory {memory.id} for user {memory.user_id}",
                extra={"memory_id": memory.id, "user_id": memory.user_id}
            )
            
            return memory.id
            
        except Exception as e:
            logger.error(f"Error storing memory: {e}")
            raise
    
    async def retrieve_memories(
        self,
        user_id: str,
        query: str,
        top_k: int = None,
        emotion_filter: Optional[List[EmotionType]] = None,
        memory_type_filter: Optional[List[str]] = None,
        min_importance: float = 0.0,
        recency_boost: bool = True
    ) -> List[RetrievedMemory]:
        """
        Retrieve relevant memories using semantic search.
        
        Args:
            user_id: User ID to search memories for
            query: Search query text
            top_k: Number of results to return
            emotion_filter: Filter by emotion tags
            memory_type_filter: Filter by memory types
            min_importance: Minimum importance score
            recency_boost: Boost recent memories in scoring
            
        Returns:
            List of retrieved memories with relevance scores
        """
        try:
            top_k = top_k or self.top_k
            
            # Generate query embedding
            query_embedding = await self.embedding_generator.generate_embedding(query)
            
            # Build filter
            filter_dict = {"user_id": {"$eq": user_id}}
            
            if emotion_filter:
                filter_dict["emotion_tags"] = {
                    "$in": [e.value for e in emotion_filter]
                }
            
            if memory_type_filter:
                filter_dict["memory_type"] = {"$in": memory_type_filter}
            
            if min_importance > 0:
                filter_dict["importance_score"] = {"$gte": min_importance}
            
            # Query Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k * 2,  # Fetch more for re-ranking
                namespace=f"{self.namespace}_{user_id}",
                filter=filter_dict if len(filter_dict) > 1 else None,
                include_metadata=True
            )
            
            if not results.matches:
                return []
            
            # Convert to RetrievedMemory objects
            retrieved_memories = []
            
            for match in results.matches:
                metadata = match.metadata or {}
                
                # Create Memory object
                memory = Memory(
                    id=match.id,
                    user_id=metadata.get("user_id", user_id),
                    content=metadata.get("content", ""),
                    memory_type=metadata.get("memory_type", "conversation"),
                    emotion_tags=[
                        EmotionType(e) for e in metadata.get("emotion_tags", [])
                    ],
                    importance_score=metadata.get("importance_score", 0.5),
                    created_at=datetime.fromisoformat(
                        metadata.get("created_at", datetime.utcnow().isoformat())
                    ),
                    access_count=metadata.get("access_count", 0),
                    metadata={k: v for k, v in metadata.items() 
                             if k not in ["user_id", "content", "memory_type", 
                                        "emotion_tags", "importance_score", 
                                        "created_at", "access_count"]}
                )
                
                # Apply recency boost if enabled
                relevance_score = match.score
                if recency_boost:
                    age_days = (datetime.utcnow() - memory.created_at).days
                    recency_factor = max(0.5, 1 - (age_days / 365))  # Decay over a year
                    relevance_score = relevance_score * 0.7 + recency_factor * 0.3
                
                retrieved_memories.append(RetrievedMemory(
                    memory=memory,
                    relevance_score=relevance_score,
                    retrieval_context=query
                ))
            
            # Sort by relevance and take top_k
            retrieved_memories.sort(key=lambda x: x.relevance_score, reverse=True)
            
            # Update access counts
            for rm in retrieved_memories[:top_k]:
                await self._update_access_count(rm.memory.id, user_id)
            
            logger.info(
                f"Retrieved {len(retrieved_memories[:top_k])} memories for user {user_id}",
                extra={
                    "user_id": user_id,
                    "query": query[:100],
                    "results_count": len(retrieved_memories[:top_k])
                }
            )
            
            return retrieved_memories[:top_k]
            
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []
    
    async def _update_access_count(self, memory_id: str, user_id: str):
        """Update access count for a memory."""
        try:
            # Fetch current metadata
            result = self.index.fetch(
                ids=[memory_id],
                namespace=f"{self.namespace}_{user_id}"
            )
            
            if memory_id in result.vectors:
                current_metadata = result.vectors[memory_id].metadata
                current_count = current_metadata.get("access_count", 0)
                
                # Update access count
                self.index.update(
                    id=memory_id,
                    namespace=f"{self.namespace}_{user_id}",
                    set_metadata={"access_count": current_count + 1}
                )
        except Exception as e:
            logger.warning(f"Failed to update access count for {memory_id}: {e}")
    
    async def delete_memory(self, memory_id: str, user_id: str) -> bool:
        """Delete a memory from the store."""
        try:
            self.index.delete(
                ids=[memory_id],
                namespace=f"{self.namespace}_{user_id}"
            )
            
            logger.info(f"Deleted memory {memory_id} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False
    
    async def get_memory_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics about user's memories."""
        try:
            stats = self.index.describe_index_stats()
            
            # Query for user's memories
            results = self.index.query(
                vector=[0] * self.dimension,  # Dummy vector
                top_k=10000,
                namespace=f"{self.namespace}_{user_id}",
                include_metadata=False
            )
            
            return {
                "total_memories": len(results.matches) if results.matches else 0,
                "index_dimension": self.dimension,
                "namespace": f"{self.namespace}_{user_id}"
            }
            
        except Exception as e:
            logger.error(f"Error getting memory stats: {e}")
            return {"error": str(e)}
    
    async def search_by_emotion(
        self,
        user_id: str,
        emotion: EmotionType,
        top_k: int = 5
    ) -> List[RetrievedMemory]:
        """Search memories by emotion tag."""
        return await self.retrieve_memories(
            user_id=user_id,
            query=f"memories related to {emotion.value}",
            emotion_filter=[emotion],
            top_k=top_k
        )


# Singleton instance
_memory_store: Optional[MemoryStore] = None


def get_memory_store() -> MemoryStore:
    """Get or create singleton memory store instance."""
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore()
    return _memory_store
