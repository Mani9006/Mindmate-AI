"""
MindMate AI - Memory Service Models
Data models for memory storage and retrieval.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Any
import uuid
import json


class MemoryType(str, Enum):
    """Types of memory entries."""
    SESSION = "session"
    CONSOLIDATED = "consolidated"
    PROFILE = "profile"
    SUMMARY = "summary"


class MemoryStatus(str, Enum):
    """Status of memory entries."""
    ACTIVE = "active"
    CONSOLIDATED = "consolidated"
    ARCHIVED = "archived"
    PENDING_DELETE = "pending_delete"


@dataclass
class MemoryChunk:
    """A single chunk of memory with embedding."""
    id: str
    user_id: str
    session_id: str
    content: str
    memory_type: MemoryType
    status: MemoryStatus
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None
    
    @classmethod
    def create(
        cls,
        user_id: str,
        session_id: str,
        content: str,
        memory_type: MemoryType = MemoryType.SESSION,
        metadata: Optional[Dict[str, Any]] = None
    ) -> "MemoryChunk":
        """Create a new memory chunk."""
        now = datetime.utcnow()
        chunk_id = f"{user_id}_{session_id}_{uuid.uuid4().hex[:12]}"
        
        return cls(
            id=chunk_id,
            user_id=user_id,
            session_id=session_id,
            content=content,
            memory_type=memory_type,
            status=MemoryStatus.ACTIVE,
            created_at=now,
            updated_at=now,
            metadata=metadata or {},
            embedding=None
        )
    
    def to_pinecone_record(self) -> Dict[str, Any]:
        """Convert to Pinecone record format."""
        return {
            "id": self.id,
            "values": self.embedding or [],
            "metadata": {
                "user_id": self.user_id,
                "session_id": self.session_id,
                "content": self.content,
                "memory_type": self.memory_type.value,
                "status": self.status.value,
                "created_at": self.created_at.isoformat(),
                "updated_at": self.updated_at.isoformat(),
                **self.metadata
            }
        }
    
    @classmethod
    def from_pinecone_record(cls, record: Dict[str, Any]) -> "MemoryChunk":
        """Create from Pinecone record."""
        metadata = record.get("metadata", {})
        
        return cls(
            id=record["id"],
            user_id=metadata.get("user_id", ""),
            session_id=metadata.get("session_id", ""),
            content=metadata.get("content", ""),
            memory_type=MemoryType(metadata.get("memory_type", "session")),
            status=MemoryStatus(metadata.get("status", "active")),
            created_at=datetime.fromisoformat(metadata.get("created_at", datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(metadata.get("updated_at", datetime.utcnow().isoformat())),
            metadata={k: v for k, v in metadata.items() if k not in [
                "user_id", "session_id", "content", "memory_type", 
                "status", "created_at", "updated_at"
            ]},
            embedding=record.get("values")
        )


@dataclass
class SessionTranscript:
    """A complete session transcript."""
    session_id: str
    user_id: str
    messages: List[Dict[str, Any]]
    started_at: datetime
    ended_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_text(self) -> str:
        """Convert transcript to plain text for embedding."""
        lines = []
        for msg in self.messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            lines.append(f"{role}: {content}")
        return "\n".join(lines)
    
    def to_chunks(self, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split transcript into overlapping chunks."""
        text = self.to_text()
        chunks = []
        
        if len(text) <= chunk_size:
            return [text]
        
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            
            # Try to break at a sentence boundary
            if end < len(text):
                # Look for sentence endings
                for i in range(end - 1, max(start, end - 100), -1):
                    if text[i] in '.!?':
                        end = i + 1
                        break
            
            chunks.append(text[start:end].strip())
            start = end - overlap
        
        return chunks


@dataclass
class RetrievedMemory:
    """A retrieved memory with similarity score."""
    memory: MemoryChunk
    score: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.memory.id,
            "content": self.memory.content,
            "memory_type": self.memory.memory_type.value,
            "created_at": self.memory.created_at.isoformat(),
            "score": self.score,
            "metadata": self.memory.metadata
        }


@dataclass
class UserProfile:
    """High-level user profile summary."""
    user_id: str
    summary: str
    key_topics: List[str] = field(default_factory=list)
    preferences: Dict[str, Any] = field(default_factory=dict)
    interaction_count: int = 0
    first_interaction: Optional[datetime] = None
    last_interaction: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "summary": self.summary,
            "key_topics": self.key_topics,
            "preferences": self.preferences,
            "interaction_count": self.interaction_count,
            "first_interaction": self.first_interaction.isoformat() if self.first_interaction else None,
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserProfile":
        """Create from dictionary."""
        return cls(
            user_id=data["user_id"],
            summary=data["summary"],
            key_topics=data.get("key_topics", []),
            preferences=data.get("preferences", {}),
            interaction_count=data.get("interaction_count", 0),
            first_interaction=datetime.fromisoformat(data["first_interaction"]) if data.get("first_interaction") else None,
            last_interaction=datetime.fromisoformat(data["last_interaction"]) if data.get("last_interaction") else None,
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat())),
            updated_at=datetime.fromisoformat(data.get("updated_at", datetime.utcnow().isoformat()))
        )


@dataclass
class ConsolidationResult:
    """Result of memory consolidation."""
    user_id: str
    consolidated_count: int
    archived_count: int
    summary: str
    key_topics: List[str]
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "user_id": self.user_id,
            "consolidated_count": self.consolidated_count,
            "archived_count": self.archived_count,
            "summary": self.summary,
            "key_topics": self.key_topics,
            "created_at": self.created_at.isoformat()
        }
