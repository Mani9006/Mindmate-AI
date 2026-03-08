# MindMate AI - Memory Service

A production-ready vector memory service for conversational AI, built with Pinecone and OpenAI embeddings.

## Features

- **Vector Storage & Retrieval**: Store and retrieve conversation memories using semantic similarity
- **Session Management**: Automatically chunk and embed session transcripts
- **RAG (Retrieval-Augmented Generation)**: Find relevant past conversations for context
- **Memory Consolidation**: Nightly job to summarize and archive old memories
- **GDPR Compliance**: Soft and hard deletion with purge jobs
- **User Profiles**: Generate and maintain high-level user context

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Service                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Pinecone   │  │   OpenAI     │  │   Memory Mgmt    │  │
│  │   Client     │  │  Embeddings  │  │   & Consolidation│  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐         ┌──────────┐
   │Pinecone │          │  OpenAI  │         │  User    │
   │  Index  │          │   API    │         │ Profile  │
   └─────────┘          └──────────┘         └──────────┘
```

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Set environment variables:

```bash
export PINECONE_API_KEY="your-pinecone-api-key"
export OPENAI_API_KEY="your-openai-api-key"
export PINECONE_INDEX_NAME="mindmate-memories"
```

Or create a `.env` file:

```env
PINECONE_API_KEY=your-pinecone-api-key
OPENAI_API_KEY=your-openai-api-key
PINECONE_INDEX_NAME=mindmate-memories
PINECONE_DIMENSION=1536
EMBEDDING_MODEL=text-embedding-3-small
```

### Basic Usage

```python
import asyncio
from datetime import datetime
from memory_service import MemoryService, SessionTranscript

async def main():
    # Initialize service
    memory = MemoryService()
    
    # Create and store a session
    transcript = SessionTranscript(
        session_id="session_001",
        user_id="user_123",
        messages=[
            {"role": "user", "content": "I've been feeling stressed about work"},
            {"role": "assistant", "content": "I'm sorry to hear that. Tell me more."},
        ],
        started_at=datetime.utcnow()
    )
    
    await memory.store_session_memory("session_001", transcript)
    
    # Retrieve relevant memories
    memories = await memory.retrieve_relevant_memories(
        user_id="user_123",
        query="work stress",
        limit=5
    )
    
    for mem in memories:
        print(f"Score: {mem.score}, Content: {mem.memory.content}")

asyncio.run(main())
```

## API Reference

### 1. `store_session_memory(session_id, transcript)`

Store a session transcript as vector memories.

**Parameters:**
- `session_id` (str): Unique session identifier
- `transcript` (SessionTranscript): Session transcript with messages
- `metadata` (dict, optional): Additional metadata

**Returns:**
```python
{
    "stored": 3,              # Number of chunks stored
    "chunks": ["id1", "id2"], # Chunk IDs
    "session_id": "...",
    "user_id": "..."
}
```

### 2. `retrieve_relevant_memories(user_id, query, limit=5)`

Retrieve memories relevant to a query using RAG.

**Parameters:**
- `user_id` (str): User identifier
- `query` (str): Search query
- `limit` (int): Maximum results (default: 5)
- `memory_types` (list, optional): Filter by memory types
- `min_score` (float, optional): Minimum similarity threshold

**Returns:**
```python
[
    RetrievedMemory(
        memory=MemoryChunk(...),
        score=0.95
    ),
    ...
]
```

### 3. `consolidate_memories(user_id, days=7, min_memories=10)`

Consolidate old memories into a summary (nightly job).

**Parameters:**
- `user_id` (str): User identifier
- `days` (int): Days back to consolidate
- `min_memories` (int): Minimum memories required

**Returns:**
```python
ConsolidationResult(
    user_id="...",
    consolidated_count=1,
    archived_count=25,
    summary="Consolidated summary...",
    key_topics=["work", "stress", "family"]
)
```

### 4. `delete_user_memories(user_id, hard_delete=False, session_id=None)`

Delete user memories (GDPR compliant).

**Parameters:**
- `user_id` (str): User identifier
- `hard_delete` (bool): Immediate permanent deletion
- `session_id` (str, optional): Specific session to delete

**Returns:**
```python
# Soft delete
{
    "deleted": False,
    "marked_for_deletion": True,
    "count": 25,
    "delete_after_days": 30
}

# Hard delete
{
    "deleted": True,
    "hard_delete": True
}
```

### 5. `get_user_profile_summary(user_id, refresh=False)`

Get high-level user profile summary.

**Parameters:**
- `user_id` (str): User identifier
- `refresh` (bool): Force refresh the profile

**Returns:**
```python
UserProfile(
    user_id="...",
    summary="User with interests in...",
    key_topics=["work", "health", "family"],
    preferences={"style": "empathetic"},
    interaction_count=50,
    first_interaction=datetime(...),
    last_interaction=datetime(...)
)
```

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PINECONE_API_KEY` | Required | Pinecone API key |
| `OPENAI_API_KEY` | Required | OpenAI API key |
| `PINECONE_INDEX_NAME` | `mindmate-memories` | Pinecone index name |
| `PINECONE_DIMENSION` | `1536` | Embedding dimension |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `MEMORY_CHUNK_SIZE` | `1000` | Text chunk size |
| `MEMORY_CHUNK_OVERLAP` | `200` | Chunk overlap |
| `MEMORY_DEFAULT_TOP_K` | `5` | Default retrieval limit |
| `MEMORY_SIMILARITY_THRESHOLD` | `0.7` | Minimum similarity score |
| `MEMORY_CONSOLIDATION_DAYS` | `7` | Days before consolidation |
| `MEMORY_SOFT_DELETE_TTL` | `30` | Days before purging soft-deleted |

## Memory Types

| Type | Description |
|------|-------------|
| `SESSION` | Individual conversation sessions |
| `CONSOLIDATED` | Summarized old sessions |
| `PROFILE` | User profile data |
| `SUMMARY` | Generated summaries |

## Memory Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Currently searchable |
| `CONSOLIDATED` | Archived after consolidation |
| `ARCHIVED` | Manually archived |
| `PENDING_DELETE` | Marked for deletion (GDPR) |

## Running Tests

```bash
# Run all tests
pytest test_memory_service.py -v

# Run unit tests only
pytest test_memory_service.py -v -m "not integration"

# Run integration tests (requires API keys)
pytest test_memory_service.py -v -m integration
```

## Example Usage

See `example_usage.py` for complete examples:

```bash
python example_usage.py
```

## Nightly Jobs

### Memory Consolidation

```python
async def nightly_consolidation():
    memory = MemoryService()
    
    # Get all active users
    users = await get_active_users()
    
    for user_id in users:
        result = await memory.consolidate_memories(user_id)
        print(f"Consolidated {result.archived_count} memories for {user_id}")
```

### GDPR Purge

```python
async def gdpr_purge_job():
    memory = MemoryService()
    
    # Purge all soft-deleted memories past TTL
    result = await memory.purge_deleted_memories()
    print(f"Purged memories: {result}")
```

## Health Check

```python
memory = MemoryService()
health = await memory.health_check()

print(health)
# {
#     "status": "healthy",
#     "pinecone": {"status": "healthy", ...},
#     "embedding": {"status": "healthy", ...}
# }
```

## License

MIT License - MindMate AI
