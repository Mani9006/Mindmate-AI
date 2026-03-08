"""
MindMate AI - Memory Service Tests
Unit tests for the memory service components.
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock

from models import (
    MemoryChunk, SessionTranscript, RetrievedMemory,
    UserProfile, ConsolidationResult,
    MemoryType, MemoryStatus
)


# ============================================================================
# Model Tests
# ============================================================================

class TestMemoryChunk:
    """Tests for MemoryChunk model."""
    
    def test_create_memory_chunk(self):
        """Test creating a new memory chunk."""
        chunk = MemoryChunk.create(
            user_id="user_123",
            session_id="session_456",
            content="Test content",
            memory_type=MemoryType.SESSION,
            metadata={"key": "value"}
        )
        
        assert chunk.user_id == "user_123"
        assert chunk.session_id == "session_456"
        assert chunk.content == "Test content"
        assert chunk.memory_type == MemoryType.SESSION
        assert chunk.status == MemoryStatus.ACTIVE
        assert chunk.metadata == {"key": "value"}
        assert chunk.embedding is None
    
    def test_to_pinecone_record(self):
        """Test conversion to Pinecone record format."""
        chunk = MemoryChunk.create(
            user_id="user_123",
            session_id="session_456",
            content="Test content"
        )
        chunk.embedding = [0.1, 0.2, 0.3]
        
        record = chunk.to_pinecone_record()
        
        assert record["id"] == chunk.id
        assert record["values"] == [0.1, 0.2, 0.3]
        assert record["metadata"]["user_id"] == "user_123"
        assert record["metadata"]["content"] == "Test content"
    
    def test_from_pinecone_record(self):
        """Test creation from Pinecone record."""
        record = {
            "id": "test_id",
            "values": [0.1, 0.2, 0.3],
            "metadata": {
                "user_id": "user_123",
                "session_id": "session_456",
                "content": "Test content",
                "memory_type": "session",
                "status": "active",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }
        }
        
        chunk = MemoryChunk.from_pinecone_record(record)
        
        assert chunk.id == "test_id"
        assert chunk.embedding == [0.1, 0.2, 0.3]
        assert chunk.user_id == "user_123"
        assert chunk.memory_type == MemoryType.SESSION


class TestSessionTranscript:
    """Tests for SessionTranscript model."""
    
    def test_to_text(self):
        """Test converting transcript to text."""
        transcript = SessionTranscript(
            session_id="session_123",
            user_id="user_456",
            messages=[
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there"}
            ],
            started_at=datetime.utcnow()
        )
        
        text = transcript.to_text()
        
        assert "user: Hello" in text
        assert "assistant: Hi there" in text
    
    def test_to_chunks_small(self):
        """Test chunking small transcript."""
        transcript = SessionTranscript(
            session_id="session_123",
            user_id="user_456",
            messages=[
                {"role": "user", "content": "Hello"}
            ],
            started_at=datetime.utcnow()
        )
        
        chunks = transcript.to_chunks(chunk_size=1000, overlap=200)
        
        assert len(chunks) == 1
        assert "Hello" in chunks[0]
    
    def test_to_chunks_large(self):
        """Test chunking large transcript."""
        # Create a large transcript
        messages = [{"role": "user", "content": "Word " * 200}] * 10
        
        transcript = SessionTranscript(
            session_id="session_123",
            user_id="user_456",
            messages=messages,
            started_at=datetime.utcnow()
        )
        
        chunks = transcript.to_chunks(chunk_size=500, overlap=100)
        
        assert len(chunks) > 1


class TestUserProfile:
    """Tests for UserProfile model."""
    
    def test_to_dict(self):
        """Test converting profile to dictionary."""
        profile = UserProfile(
            user_id="user_123",
            summary="Test summary",
            key_topics=["topic1", "topic2"],
            preferences={"style": "casual"},
            interaction_count=10,
            first_interaction=datetime(2024, 1, 1),
            last_interaction=datetime(2024, 1, 15)
        )
        
        data = profile.to_dict()
        
        assert data["user_id"] == "user_123"
        assert data["summary"] == "Test summary"
        assert data["key_topics"] == ["topic1", "topic2"]
        assert data["preferences"] == {"style": "casual"}
        assert data["interaction_count"] == 10
    
    def test_from_dict(self):
        """Test creating profile from dictionary."""
        data = {
            "user_id": "user_123",
            "summary": "Test summary",
            "key_topics": ["topic1"],
            "preferences": {},
            "interaction_count": 5,
            "first_interaction": "2024-01-01T00:00:00",
            "last_interaction": "2024-01-15T00:00:00",
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-15T00:00:00"
        }
        
        profile = UserProfile.from_dict(data)
        
        assert profile.user_id == "user_123"
        assert profile.summary == "Test summary"
        assert profile.interaction_count == 5


# ============================================================================
# Service Tests (with mocks)
# ============================================================================

@pytest.fixture
def mock_pinecone():
    """Mock Pinecone client."""
    with patch("memory_service.get_pinecone_client") as mock:
        client = Mock()
        client.get_namespace.return_value = "mindmate_user_123"
        client.upsert_vectors.return_value = {"upserted_count": 3}
        client.query_vectors.return_value = [
            {
                "id": "mem_1",
                "score": 0.95,
                "metadata": {
                    "user_id": "user_123",
                    "session_id": "session_456",
                    "content": "Test memory",
                    "memory_type": "session",
                    "status": "active",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            }
        ]
        mock.return_value = client
        yield client


@pytest.fixture
def mock_embedding():
    """Mock embedding service."""
    with patch("memory_service.get_embedding_service") as mock:
        service = Mock()
        
        # Mock embed_text
        embed_result = Mock()
        embed_result.embedding = [0.1] * 1536
        embed_result.tokens_used = 10
        embed_result.latency_ms = 100
        
        service.embed_text = AsyncMock(return_value=embed_result)
        
        # Mock embed_batch
        batch_result = Mock()
        batch_result.embedding = [0.1] * 1536
        batch_result.tokens_used = 10
        batch_result.latency_ms = 100
        
        service.embed_batch = AsyncMock(return_value=[batch_result] * 3)
        
        mock.return_value = service
        yield service


@pytest.mark.asyncio
async def test_store_session_memory(mock_pinecone, mock_embedding):
    """Test storing session memory."""
    from memory_service import MemoryService
    
    memory = MemoryService()
    
    transcript = SessionTranscript(
        session_id="session_123",
        user_id="user_456",
        messages=[
            {"role": "user", "content": "Hello there, how are you?"},
            {"role": "assistant", "content": "I'm doing well, thank you!"}
        ],
        started_at=datetime.utcnow()
    )
    
    result = await memory.store_session_memory("session_123", transcript)
    
    assert result["stored"] == 3
    assert result["session_id"] == "session_123"
    assert result["user_id"] == "user_456"
    mock_pinecone.upsert_vectors.assert_called_once()


@pytest.mark.asyncio
async def test_retrieve_relevant_memories(mock_pinecone, mock_embedding):
    """Test retrieving relevant memories."""
    from memory_service import MemoryService
    
    memory = MemoryService()
    
    memories = await memory.retrieve_relevant_memories(
        user_id="user_123",
        query="test query",
        limit=5
    )
    
    assert len(memories) == 1
    assert memories[0].score == 0.95
    assert memories[0].memory.content == "Test memory"
    mock_pinecone.query_vectors.assert_called_once()


@pytest.mark.asyncio
async def test_delete_user_memories_soft(mock_pinecone):
    """Test soft deleting user memories."""
    from memory_service import MemoryService
    
    memory = MemoryService()
    
    result = await memory.delete_user_memories(
        user_id="user_123",
        hard_delete=False
    )
    
    assert result["deleted"] == False
    assert result["marked_for_deletion"] == True
    assert result["delete_after_days"] == 30


@pytest.mark.asyncio
async def test_delete_user_memories_hard(mock_pinecone):
    """Test hard deleting user memories."""
    from memory_service import MemoryService
    
    memory = MemoryService()
    
    result = await memory.delete_user_memories(
        user_id="user_123",
        hard_delete=True
    )
    
    assert result["deleted"] == True
    assert result["hard_delete"] == True
    mock_pinecone.delete_vectors.assert_called_once()


# ============================================================================
# Integration Tests (require real API keys)
# ============================================================================

@pytest.mark.integration
@pytest.mark.asyncio
async def test_integration_health_check():
    """Integration test for health check (requires API keys)."""
    from memory_service import MemoryService
    
    memory = MemoryService()
    health = await memory.health_check()
    
    assert "status" in health
    assert "pinecone" in health
    assert "embedding" in health


# ============================================================================
# Run tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
