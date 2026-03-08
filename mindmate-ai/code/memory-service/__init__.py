"""
MindMate AI - Memory Service
Vector memory service for conversational AI with Pinecone and OpenAI embeddings.

This package provides:
- Vector storage and retrieval using Pinecone
- Text embeddings via OpenAI
- Memory consolidation and summarization
- GDPR-compliant data deletion
- User profile management

Example Usage:
    from memory_service import MemoryService, SessionTranscript
    
    # Initialize service
    memory = MemoryService()
    
    # Store a session
    transcript = SessionTranscript(
        session_id="session_123",
        user_id="user_456",
        messages=[
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi there!"}
        ],
        started_at=datetime.utcnow()
    )
    await memory.store_session_memory("session_123", transcript)
    
    # Retrieve relevant memories
    memories = await memory.retrieve_relevant_memories(
        user_id="user_456",
        query="What did we discuss about work?",
        limit=5
    )
    
    # Get user profile
    profile = await memory.get_user_profile_summary("user_456")
"""

__version__ = "1.0.0"
__author__ = "MindMate AI"

# Core exports
from .memory_service import MemoryService, store_session, retrieve_memories
from .pinecone_client import PineconeClient, get_pinecone_client
from .embedding_service import EmbeddingService, get_embedding_service, embed_text, embed_texts
from .models import (
    MemoryChunk,
    SessionTranscript,
    RetrievedMemory,
    UserProfile,
    ConsolidationResult,
    MemoryType,
    MemoryStatus,
)
from .config import config, Config

__all__ = [
    # Main service
    "MemoryService",
    "store_session",
    "retrieve_memories",
    
    # Clients
    "PineconeClient",
    "get_pinecone_client",
    "EmbeddingService",
    "get_embedding_service",
    "embed_text",
    "embed_texts",
    
    # Models
    "MemoryChunk",
    "SessionTranscript",
    "RetrievedMemory",
    "UserProfile",
    "ConsolidationResult",
    "MemoryType",
    "MemoryStatus",
    
    # Config
    "config",
    "Config",
]
