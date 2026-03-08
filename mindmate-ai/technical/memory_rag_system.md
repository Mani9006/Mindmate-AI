# MindMate AI: Vector Memory & RAG System Architecture

## Executive Summary

This document defines the complete vector memory architecture for MindMate AI, a mental wellness companion platform. The system uses **Pinecone** as the primary vector database with a multi-tier memory hierarchy: **Session Memory** (short-term), **Consolidated Memory** (medium-term), and **User Profile Memory** (long-term).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Session Chunking, Embedding & Storage](#2-session-chunking-embedding--storage)
3. [Memory Retrieval System](#3-memory-retrieval-system)
4. [Memory Consolidation Job](#4-memory-consolidation-job)
5. [Data Models & Schemas](#5-data-models--schemas)
6. [Implementation Details](#6-implementation-details)
7. [Performance Considerations](#7-performance-considerations)
8. [Security & Privacy](#8-security--privacy)

---

## 1. Architecture Overview

### 1.1 Memory Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY HIERARCHY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  USER PROFILE   │    │  CONSOLIDATED   │    │   SESSION    │ │
│  │    MEMORY       │◄───│    MEMORY       │◄───│   MEMORY     │ │
│  │  (Long-term)    │    │  (Medium-term)  │    │ (Short-term) │ │
│  │                 │    │                 │    │              │ │
│  │ • Core traits   │    │ • Weekly        │    │ • Raw        │ │
│  │ • Preferences   │    │   summaries     │    │   messages   │ │
│  │ • Goals         │    │ • Theme         │    │ • Emotion    │ │
│  │ • Relationships │    │   clusters      │    │   tags       │ │
│  │ • Coping styles │    │ • Insights      │    │ • Timestamps │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           ▲                      ▲                    ▲         │
│           │                      │                    │         │
│           └──────────────────────┴────────────────────┘         │
│                         NIGHTLY CONSOLIDATION                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Vector Database | Pinecone | Primary vector storage & similarity search |
| Embedding Model | `text-embedding-3-large` (OpenAI) | 3072-dimension embeddings |
| Backup Vector DB | Weaviate (optional) | Multi-modal support, hybrid search |
| Message Queue | Redis Streams | Real-time event streaming |
| Orchestration | Temporal.io | Background job management |
| Cache | Redis | Hot memory caching |

### 1.3 Namespace Strategy

```
Pinecone Index: "mindmate-memory"
├── Namespace: "sessions-{user_id}"      # Individual session chunks
├── Namespace: "consolidated-{user_id}"  # Weekly summaries & themes
├── Namespace: "profile-{user_id}"       # Long-term user profile vectors
└── Namespace: "global-insights"         # Cross-user patterns (anonymized)
```

---

## 2. Session Chunking, Embedding & Storage

### 2.1 Session Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Message   │───►│   Chunker   │───►│  Embedding  │───►│  Pinecone   │
│   Stream    │    │   Engine    │    │   Service   │    │   Storage   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.2 Chunking Strategy

#### 2.2.1 Message-Level Chunking (Primary)

Each message becomes its own chunk with rich metadata:

```python
class MessageChunk:
    """Individual message as a retrievable unit"""
    
    # Core content
    content: str                    # The actual message text
    role: Literal["user", "assistant", "system"]
    
    # Temporal metadata
    timestamp: datetime
    session_id: str
    message_index: int              # Position in session
    
    # Emotional metadata (from emotion detection service)
    emotions: Dict[str, float]      # {joy: 0.8, anxiety: 0.3, ...}
    sentiment_score: float          # -1.0 to 1.0
    intensity: float                # 0.0 to 1.0
    
    # Contextual metadata
    topic_tags: List[str]           # ["work_stress", "sleep", "relationships"]
    wellness_indicators: List[str]  # ["mood_decline", "positive_coping"]
    
    # Retrieval boosters
    importance_score: float         # 0.0 to 1.0 (calculated)
    is_key_moment: bool             # Flagged significant moments
```

#### 2.2.2 Sliding Window Chunking (Contextual)

For conversation context, create overlapping multi-message chunks:

```python
class ContextChunk:
    """Multi-message context window"""
    
    content: str                    # Concatenated messages with separators
    window_size: int                # Number of messages (default: 5)
    overlap: int                    # Messages overlapping with previous chunk (default: 2)
    start_message_index: int
    end_message_index: int
    
    # Aggregated metadata
    dominant_emotion: str
    emotion_variance: float         # How much emotions changed
    topic_coherence: float          # Topic consistency score
```

#### 2.2.3 Semantic Chunking (Theme-Based)

Group messages by semantic similarity within a session:

```python
class SemanticChunk:
    """Theme-clustered message group"""
    
    content: str                    # Summarized theme content
    messages: List[str]             # Original message IDs
    theme_label: str                # Auto-generated theme name
    coherence_score: float          # Semantic similarity within cluster
    
    # Created post-session or during consolidation
```

### 2.3 Chunking Configuration

```yaml
# config/chunking.yaml
chunking:
  message_level:
    enabled: true
    max_content_length: 4000       # Characters before truncation
    
  sliding_window:
    enabled: true
    window_size: 5                 # Messages per window
    overlap: 2                     # Overlapping messages
    max_gap_seconds: 300           # Max gap to include in window
    
  semantic:
    enabled: true
    similarity_threshold: 0.85     # Cosine similarity for clustering
    min_cluster_size: 3            # Minimum messages per cluster
    max_cluster_size: 20           # Maximum messages per cluster
```

### 2.4 Embedding Pipeline

#### 2.4.1 Embedding Generation

```python
import openai
from typing import List, Dict
import hashlib

class EmbeddingService:
    """
    Service for generating and caching embeddings.
    Uses text-embedding-3-large for 3072-dimensional vectors.
    """
    
    MODEL = "text-embedding-3-large"
    DIMENSIONS = 3072
    
    def __init__(self, redis_client, pinecone_index):
        self.openai = openai.AsyncOpenAI()
        self.redis = redis_client
        self.pinecone = pinecone_index
        
    async def generate_embedding(
        self, 
        text: str,
        user_id: str,
        metadata: Dict = None
    ) -> List[float]:
        """
        Generate embedding with caching and deduplication.
        """
        # Create content hash for cache key
        content_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
        cache_key = f"embedding:{content_hash}"
        
        # Check cache
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Generate embedding
        response = await self.openai.embeddings.create(
            model=self.MODEL,
            input=text[:8000],  # Model limit
            dimensions=self.DIMENSIONS
        )
        
        embedding = response.data[0].embedding
        
        # Cache for 7 days
        await self.redis.setex(
            cache_key,
            timedelta(days=7),
            json.dumps(embedding)
        )
        
        return embedding
    
    async def batch_generate(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """Batch embedding generation for efficiency."""
        embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.openai.embeddings.create(
                model=self.MODEL,
                input=batch
            )
            embeddings.extend([d.embedding for d in response.data])
            
        return embeddings
```

#### 2.4.2 Enhanced Embedding Strategy

```python
class EnhancedEmbeddingService(EmbeddingService):
    """
    Creates contextually enhanced embeddings by prepending
    metadata context to improve retrieval relevance.
    """
    
    def create_enhanced_text(
        self,
        content: str,
        metadata: Dict
    ) -> str:
        """
        Create enhanced text for embedding by prepending context.
        This improves semantic search by including emotional/topic context.
        """
        context_parts = []
        
        # Add emotional context
        if metadata.get('dominant_emotion'):
            context_parts.append(f"[Emotion: {metadata['dominant_emotion']}]")
        
        # Add topic context
        if metadata.get('topic_tags'):
            topics = ', '.join(metadata['topic_tags'])
            context_parts.append(f"[Topics: {topics}]")
        
        # Add temporal context
        if metadata.get('time_context'):
            context_parts.append(f"[Time: {metadata['time_context']}]")
        
        # Combine: context + original content
        enhanced = ' '.join(context_parts) + ' ' + content
        
        return enhanced[:8000]  # Respect token limit
```

### 2.5 Storage Pipeline

#### 2.5.1 Pinecone Vector Structure

```python
from pinecone import Vector

class MemoryStorageService:
    """Service for storing memory vectors in Pinecone."""
    
    def create_session_vector(
        self,
        chunk: MessageChunk,
        embedding: List[float],
        user_id: str
    ) -> Vector:
        """Create a Pinecone vector from a message chunk."""
        
        vector_id = f"{chunk.session_id}:{chunk.message_index}"
        
        return Vector(
            id=vector_id,
            values=embedding,
            metadata={
                # Content (stored for retrieval/display)
                "content": chunk.content[:1000],  # Truncated for storage
                "content_full_hash": hashlib.sha256(
                    chunk.content.encode()
                ).hexdigest()[:16],
                
                # Identifiers
                "user_id": user_id,
                "session_id": chunk.session_id,
                "message_index": chunk.message_index,
                
                # Temporal
                "timestamp": chunk.timestamp.isoformat(),
                "hour_of_day": chunk.timestamp.hour,
                "day_of_week": chunk.timestamp.weekday(),
                
                # Emotional
                "dominant_emotion": chunk.emotions.get('dominant', 'neutral'),
                "sentiment_score": chunk.sentiment_score,
                "intensity": chunk.intensity,
                "emotions_json": json.dumps(chunk.emotions),
                
                # Topical
                "topic_tags": chunk.topic_tags,
                "wellness_indicators": chunk.wellness_indicators,
                
                # Retrieval
                "importance_score": chunk.importance_score,
                "is_key_moment": chunk.is_key_moment,
                
                # Vector type for filtering
                "vector_type": "session_message",
                "chunking_strategy": "message_level"
            }
        )
    
    async def store_session_chunks(
        self,
        chunks: List[MessageChunk],
        user_id: str,
        session_id: str
    ):
        """Store all chunks from a session."""
        
        namespace = f"sessions-{user_id}"
        vectors = []
        
        # Generate embeddings in batch
        texts = [chunk.content for chunk in chunks]
        embeddings = await self.embedding_service.batch_generate(texts)
        
        # Create vectors
        for chunk, embedding in zip(chunks, embeddings):
            vector = self.create_session_vector(chunk, embedding, user_id)
            vectors.append(vector)
        
        # Upsert to Pinecone in batches
        for i in range(0, len(vectors), 100):
            batch = vectors[i:i + 100]
            self.pinecone.upsert(
                vectors=batch,
                namespace=namespace
            )
```

#### 2.5.2 Async Storage Flow

```python
async def store_session_memory(
    session_id: str,
    user_id: str,
    messages: List[Message]
):
    """
    Complete flow for storing a session's memory.
    Called at end of session or periodically during long sessions.
    """
    
    # 1. Chunk messages
    chunks = await chunking_service.create_chunks(messages)
    
    # 2. Analyze emotions (parallel)
    emotion_tasks = [
        emotion_service.analyze(chunk.content)
        for chunk in chunks
    ]
    emotions = await asyncio.gather(*emotion_tasks)
    
    # 3. Tag topics (parallel)
    topic_tasks = [
        topic_service.tag(chunk.content)
        for chunk in chunks
    ]
    topics = await asyncio.gather(*topic_tasks)
    
    # 4. Enrich chunks with metadata
    for chunk, emotion, topic in zip(chunks, emotions, topics):
        chunk.emotions = emotion
        chunk.topic_tags = topic.tags
        chunk.wellness_indicators = topic.wellness_signals
        chunk.importance_score = calculate_importance(chunk, emotion, topic)
    
    # 5. Generate embeddings
    embeddings = await embedding_service.batch_generate([
        embedding_service.create_enhanced_text(c.content, c.__dict__)
        for c in chunks
    ])
    
    # 6. Store in Pinecone
    await storage_service.store_vectors(chunks, embeddings, user_id)
    
    # 7. Update session metadata in PostgreSQL
    await session_repo.update_memory_status(session_id, "stored")
    
    # 8. Publish event for consolidation tracking
    await event_bus.publish("session.memory_stored", {
        "user_id": user_id,
        "session_id": session_id,
        "chunk_count": len(chunks),
        "timestamp": datetime.utcnow().isoformat()
    })
```

---

## 3. Memory Retrieval System

### 3.1 Retrieval Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MEMORY RETRIEVAL PIPELINE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User Query                                                         │
│       │                                                              │
│       ▼                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐  │
│   │   Query     │────►│  Embedding  │────►│  Multi-Strategy     │  │
│   │  Analyzer   │     │  Generation │     │  Retrieval Engine   │  │
│   └─────────────┘     └─────────────┘     └─────────────────────┘  │
│                                                    │                 │
│                       ┌────────────────────────────┼────────────┐   │
│                       ▼                            ▼            ▼   │
│              ┌─────────────┐              ┌─────────────┐  ┌──────┐│
│              │   Session   │              │ Consolidated│  │Profile│
│              │   Memory    │              │   Memory    │  │Memory │
│              └─────────────┘              └─────────────┘  └──────┘│
│                       │                            │            │   │
│                       └────────────────────────────┴────────────┘   │
│                                                    │                 │
│                                                    ▼                 │
│                                          ┌─────────────────┐        │
│                                          │  Reranking &    │        │
│                                          │  Deduplication  │        │
│                                          └─────────────────┘        │
│                                                    │                 │
│                                                    ▼                 │
│                                          ┌─────────────────┐        │
│                                          │ Context Builder │        │
│                                          │ & Injection     │        │
│                                          └─────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Query Analysis

```python
class QueryAnalyzer:
    """
    Analyzes user messages to determine retrieval strategy.
    """
    
    async def analyze(self, message: str, session_context: Dict) -> QueryPlan:
        """
        Determine what types of memories to retrieve and how.
        """
        
        # Use LLM to analyze query intent
        analysis_prompt = f"""
        Analyze this user message for memory retrieval:
        
        User message: "{message}"
        Current session topics: {session_context.get('topics', [])}
        
        Determine:
        1. Is the user referencing past conversations? (yes/no/maybe)
        2. What emotional state are they expressing?
        3. What topics are they discussing?
        4. What time frame might be relevant? (today/recent/anytime)
        5. Do they seem to need continuity from previous sessions?
        
        Return JSON with: needs_memory, emotion_focus, topics, timeframe, continuity_needed
        """
        
        analysis = await llm.analyze(analysis_prompt)
        
        return QueryPlan(
            needs_memory=analysis['needs_memory'],
            emotion_focus=analysis.get('emotion_focus'),
            topics=analysis.get('topics', []),
            timeframe=analysis.get('timeframe', 'anytime'),
            continuity_needed=analysis.get('continuity_needed', False),
            retrieval_depth=self._calculate_depth(analysis)
        )
    
    def _calculate_depth(self, analysis: Dict) -> str:
        """Determine how deep/memory-intensive retrieval should be."""
        if analysis.get('needs_memory') == 'yes':
            return 'deep'
        elif analysis.get('continuity_needed'):
            return 'medium'
        return 'light'
```

### 3.3 Multi-Strategy Retrieval

#### 3.3.1 Retrieval Strategies

```python
class MemoryRetrievalService:
    """
    Multi-strategy memory retrieval from Pinecone.
    """
    
    def __init__(self, pinecone_index, embedding_service):
        self.pinecone = pinecone_index
        self.embedding = embedding_service
        
    async def retrieve_memories(
        self,
        query: str,
        user_id: str,
        query_plan: QueryPlan,
        current_session_id: str
    ) -> RetrievedMemories:
        """
        Execute multi-strategy retrieval based on query plan.
        """
        
        # Generate query embedding
        query_embedding = await self.embedding.generate_embedding(query, user_id)
        
        # Execute parallel retrieval strategies
        retrieval_tasks = []
        
        if query_plan.retrieval_depth in ['medium', 'deep']:
            retrieval_tasks.append(
                self._semantic_search(
                    query_embedding, user_id, 
                    top_k=15, filter_recent=True
                )
            )
            
        if query_plan.retrieval_depth == 'deep':
            retrieval_tasks.append(
                self._emotion_based_search(
                    query_embedding, user_id,
                    target_emotion=query_plan.emotion_focus,
                    top_k=10
                )
            )
            
        if query_plan.topics:
            retrieval_tasks.append(
                self._topic_filtered_search(
                    query_embedding, user_id,
                    topics=query_plan.topics,
                    top_k=10
                )
            )
            
        # Always retrieve from user profile
        retrieval_tasks.append(
            self._profile_memory_search(user_id)
        )
        
        # Execute all retrievals
        results = await asyncio.gather(*retrieval_tasks, return_exceptions=True)
        
        # Combine and deduplicate
        all_memories = self._combine_results(results)
        
        # Rerank by relevance
        ranked = await self._rerank_memories(query, all_memories)
        
        return RetrievedMemories(
            memories=ranked[:20],  # Max 20 memories
            sources=self._identify_sources(results),
            confidence=self._calculate_confidence(ranked)
        )
```

#### 3.3.2 Semantic Search

```python
async def _semantic_search(
    self,
    query_embedding: List[float],
    user_id: str,
    top_k: int = 15,
    filter_recent: bool = True
) -> List[RetrievedMemory]:
    """
    Pure semantic similarity search on session memory.
    """
    
    namespace = f"sessions-{user_id}"
    
    # Build filter
    filter_dict = {"vector_type": "session_message"}
    
    if filter_recent:
        # Only search last 30 days for recency bias
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        filter_dict["timestamp"] = {"$gte": thirty_days_ago}
    
    # Query Pinecone
    results = self.pinecone.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=top_k,
        filter=filter_dict,
        include_metadata=True
    )
    
    return [
        RetrievedMemory(
            content=match.metadata['content'],
            source='session_semantic',
            timestamp=match.metadata['timestamp'],
            score=match.score,
            metadata=match.metadata,
            vector_id=match.id
        )
        for match in results.matches
    ]
```

#### 3.3.3 Emotion-Based Search

```python
async def _emotion_based_search(
    self,
    query_embedding: List[float],
    user_id: str,
    target_emotion: str,
    top_k: int = 10
) -> List[RetrievedMemory]:
    """
    Search for memories with similar emotional context.
    """
    
    namespace = f"sessions-{user_id}"
    
    # Filter by emotion
    filter_dict = {
        "vector_type": "session_message",
        "dominant_emotion": target_emotion
    }
    
    results = self.pinecone.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=top_k,
        filter=filter_dict,
        include_metadata=True
    )
    
    return [
        RetrievedMemory(
            content=match.metadata['content'],
            source='session_emotion',
            timestamp=match.metadata['timestamp'],
            score=match.score * 1.1,  # Boost emotion matches
            metadata=match.metadata,
            emotion_match=True
        )
        for match in results.matches
    ]
```

#### 3.3.4 Topic-Filtered Search

```python
async def _topic_filtered_search(
    self,
    query_embedding: List[float],
    user_id: str,
    topics: List[str],
    top_k: int = 10
) -> List[RetrievedMemory]:
    """
    Search within specific topic tags.
    """
    
    namespace = f"sessions-{user_id}"
    
    # Pinecone doesn't support array contains directly
    # Use $in operator for topic matching
    filter_dict = {
        "vector_type": "session_message",
        "topic_tags": {"$in": topics}
    }
    
    results = self.pinecone.query(
        namespace=namespace,
        vector=query_embedding,
        top_k=top_k,
        filter=filter_dict,
        include_metadata=True
    )
    
    return [
        RetrievedMemory(
            content=match.metadata['content'],
            source='session_topic',
            timestamp=match.metadata['timestamp'],
            score=match.score,
            metadata=match.metadata,
            matched_topics=[t for t in topics if t in match.metadata.get('topic_tags', [])]
        )
        for match in results.matches
    ]
```

#### 3.3.5 Profile Memory Search

```python
async def _profile_memory_search(
    self,
    user_id: str
) -> List[RetrievedMemory]:
    """
    Retrieve long-term profile memories (always included).
    """
    
    namespace = f"profile-{user_id}"
    
    # Get all profile vectors (typically small number)
    results = self.pinecone.query(
        namespace=namespace,
        vector=[0.0] * 3072,  # Dummy vector, use fetch instead
        top_k=50,
        include_metadata=True
    )
    
    # Alternative: use fetch with known IDs
    # profile_ids = await self._get_profile_vector_ids(user_id)
    # results = self.pinecone.fetch(ids=profile_ids, namespace=namespace)
    
    return [
        RetrievedMemory(
            content=match.metadata['content'],
            source='user_profile',
            timestamp=match.metadata.get('created_at'),
            score=1.0,  # Profile memories are always relevant
            metadata=match.metadata,
            is_profile=True
        )
        for match in results.matches
    ]
```

### 3.4 Reranking & Deduplication

```python
class MemoryReranker:
    """
    Reranks retrieved memories using cross-encoder and deduplicates.
    """
    
    def __init__(self):
        # Use sentence-transformers cross-encoder
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
    async def rerank(
        self,
        query: str,
        memories: List[RetrievedMemory],
        top_k: int = 15
    ) -> List[RetrievedMemory]:
        """
        Rerank memories using cross-encoder for better relevance.
        """
        
        if not memories:
            return []
        
        # Prepare pairs for cross-encoder
        pairs = [(query, m.content) for m in memories]
        
        # Get scores
        scores = self.cross_encoder.predict(pairs)
        
        # Update scores and sort
        for memory, score in zip(memories, scores):
            memory.rerank_score = float(score)
            # Combine vector similarity with cross-encoder score
            memory.final_score = (memory.score * 0.4) + (score * 0.6)
        
        # Sort by final score
        sorted_memories = sorted(
            memories,
            key=lambda m: m.final_score,
            reverse=True
        )
        
        # Deduplicate similar content
        deduplicated = self._deduplicate(sorted_memories)
        
        return deduplicated[:top_k]
    
    def _deduplicate(
        self,
        memories: List[RetrievedMemory],
        similarity_threshold: float = 0.85
    ) -> List[RetrievedMemory]:
        """
        Remove near-duplicate memories based on content similarity.
        """
        
        deduplicated = []
        
        for memory in memories:
            is_duplicate = False
            
            for existing in deduplicated:
                similarity = self._text_similarity(
                    memory.content,
                    existing.content
                )
                if similarity > similarity_threshold:
                    is_duplicate = True
                    # Keep the one with higher score
                    if memory.final_score > existing.final_score:
                        deduplicated.remove(existing)
                        deduplicated.append(memory)
                    break
            
            if not is_duplicate:
                deduplicated.append(memory)
        
        return deduplicated
```

### 3.5 Context Injection

#### 3.5.1 Context Builder

```python
class ContextBuilder:
    """
    Builds the memory context to inject into Claude's prompt.
    """
    
    def build_memory_context(
        self,
        retrieved: RetrievedMemories,
        current_session_messages: List[Message],
        max_tokens: int = 3000
    ) -> str:
        """
        Build formatted memory context for Claude.
        """
        
        sections = []
        
        # 1. User Profile Section (always included)
        profile_memories = [m for m in retrieved.memories if m.is_profile]
        if profile_memories:
            sections.append(self._format_profile_section(profile_memories))
        
        # 2. Recent Context (from current session)
        if current_session_messages:
            sections.append(self._format_recent_context(current_session_messages))
        
        # 3. Relevant Past Memories
        past_memories = [m for m in retrieved.memories if not m.is_profile]
        if past_memories:
            sections.append(self._format_past_memories(past_memories))
        
        # 4. Insights/Patterns (if available)
        insights = self._extract_insights(retrieved.memories)
        if insights:
            sections.append(self._format_insights(insights))
        
        # Combine and truncate to fit token budget
        context = '\n\n'.join(sections)
        
        return self._truncate_to_tokens(context, max_tokens)
    
    def _format_profile_section(self, memories: List[RetrievedMemory]) -> str:
        """Format user profile memories."""
        
        lines = ["## User Profile (Long-term Memory)"]
        
        for memory in memories:
            content = memory.metadata.get('content_type', 'note')
            lines.append(f"- [{content}] {memory.content}")
        
        return '\n'.join(lines)
    
    def _format_recent_context(self, messages: List[Message]) -> str:
        """Format recent session context."""
        
        lines = ["## Current Session Context"]
        
        # Include last 5 messages for continuity
        for msg in messages[-5:]:
            role = "User" if msg.role == "user" else "Assistant"
            lines.append(f"{role}: {msg.content[:200]}")
        
        return '\n'.join(lines)
    
    def _format_past_memories(self, memories: List[RetrievedMemory]) -> str:
        """Format relevant past memories."""
        
        lines = ["## Relevant Past Conversations"]
        
        # Group by time period
        grouped = self._group_by_time_period(memories)
        
        for period, period_memories in grouped.items():
            lines.append(f"\n### {period}")
            for memory in period_memories[:5]:  # Max 5 per period
                date = self._format_date(memory.timestamp)
                emotion = memory.metadata.get('dominant_emotion', '')
                emotion_tag = f" [{emotion}]" if emotion else ""
                lines.append(f"- ({date}){emotion_tag} {memory.content[:150]}")
        
        return '\n'.join(lines)
```

#### 3.5.2 Complete Prompt Integration

```python
class MemoryEnhancedPromptBuilder:
    """
    Builds the complete prompt with injected memories.
    """
    
    SYSTEM_PROMPT_TEMPLATE = """You are MindMate, a compassionate AI wellness companion. 
You have access to the user's conversation history to provide personalized, continuous support.

{memory_context}

Guidelines for using memory:
1. Reference past conversations naturally when relevant
2. Show you remember important details the user shared
3. Track emotional patterns and gently point them out
4. Build on previous coping strategies discussed
5. Never be preachy or clinical - be warm and supportive
6. If you don't have relevant memory, focus on the present

Current time: {current_time}
User's local time: {user_local_time}
"""
    
    def build_prompt(
        self,
        user_message: str,
        memory_context: str,
        user_timezone: str
    ) -> List[Dict]:
        """
        Build the complete message list for Claude.
        """
        
        system_prompt = self.SYSTEM_PROMPT_TEMPLATE.format(
            memory_context=memory_context,
            current_time=datetime.utcnow().isoformat(),
            user_local_time=self._get_user_time(user_timezone)
        )
        
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
```

### 3.6 Retrieval Configuration

```yaml
# config/retrieval.yaml
retrieval:
  # Token budgets
  max_memory_context_tokens: 3000
  max_profile_tokens: 800
  max_recent_context_tokens: 1000
  max_past_memory_tokens: 1200
  
  # Retrieval counts
  semantic_search_top_k: 15
  emotion_search_top_k: 10
  topic_search_top_k: 10
  final_memory_count: 15
  
  # Scoring weights
  vector_similarity_weight: 0.4
  cross_encoder_weight: 0.6
  recency_boost_hours: 48        # Boost memories from last 48 hours
  recency_boost_factor: 1.2
  key_moment_boost: 1.3
  
  # Filters
  max_memory_age_days: 90        # Don't retrieve memories older than 90 days
  min_relevance_score: 0.6       # Minimum similarity threshold
  
  # Caching
  cache_retrievals: true
  cache_ttl_seconds: 60          # Cache retrievals for 1 minute within session
```

---

## 4. Memory Consolidation Job

### 4.1 Consolidation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NIGHTLY CONSOLIDATION PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐                                                     │
│  │   Trigger   │  2:00 AM UTC daily (Temporal.io scheduled workflow) │
│  │  (2AM UTC)  │                                                     │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              ORCHESTRATOR (Temporal Workflow)                │    │
│  │                                                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │  Identify   │  │  For Each   │  │  Consolidation      │  │    │
│  │  │  Active     │──►│  User:      │──►│  Workflow           │  │    │
│  │  │  Users      │  │  Spawn Job  │  │  (Child Workflow)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              PER-USER CONSOLIDATION WORKFLOW                 │    │
│  │                                                              │    │
│  │  Phase 1: Session Summarization                              │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │    │
│  │  │  Fetch New  │───►│  Generate   │───►│  Store Summary  │  │    │
│  │  │  Sessions   │    │  Summaries  │    │  Vectors        │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────────┘  │    │
│  │                                                              │    │
│  │  Phase 2: Theme Extraction                                   │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │    │
│  │  │  Cluster    │───►│  Extract    │───►│  Store Theme    │  │    │
│  │  │  Sessions   │    │  Themes     │    │  Vectors        │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────────┘  │    │
│  │                                                              │    │
│  │  Phase 3: Profile Update                                     │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │    │
│  │  │  Analyze    │───►│  Update     │───►│  Store Profile  │  │    │
│  │  │  Patterns   │    │  Profile    │    │  Vectors        │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────────┘  │    │
│  │                                                              │    │
│  │  Phase 4: Cleanup                                            │    │
│  │  ┌─────────────┐    ┌─────────────┐                          │    │
│  │  │  Archive    │───►│  Update     │                          │    │
│  │  │  Old Data   │    │  Metadata   │                          │    │
│  │  └─────────────┘    └─────────────┘                          │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Temporal Workflow Definition

```python
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class NightlyConsolidationWorkflow:
    """
    Main orchestrator for nightly memory consolidation.
    """
    
    @workflow.run
    async def run(self) -> ConsolidationResult:
        """
        Execute nightly consolidation for all active users.
        """
        
        # Get all users with sessions in the last 24 hours
        active_users = await workflow.execute_activity(
            get_active_users,
            start_to_close_timeout=timedelta(minutes=5)
        )
        
        # Spawn child workflows for each user (parallel)
        user_workflows = []
        for user_id in active_users:
            handle = await workflow.start_child_workflow(
                UserConsolidationWorkflow.run,
                user_id,
                id=f"consolidation-{user_id}-{workflow.now().isoformat()}
            )
            user_workflows.append(handle)
        
        # Wait for all to complete
        results = await asyncio.gather(*[
            handle.result() for handle in user_workflows
        ], return_exceptions=True)
        
        # Aggregate results
        return ConsolidationResult(
            total_users=len(active_users),
            successful=sum(1 for r in results if not isinstance(r, Exception)),
            failed=sum(1 for r in results if isinstance(r, Exception)),
            timestamp=workflow.now().isoformat()
        )


@workflow.defn
class UserConsolidationWorkflow:
    """
    Per-user consolidation workflow.
    """
    
    @workflow.run
    async def run(self, user_id: str) -> UserConsolidationResult:
        """
        Consolidate memory for a single user.
        """
        
        # Phase 1: Session Summarization
        session_summaries = await workflow.execute_activity(
            summarize_sessions,
            user_id,
            start_to_close_timeout=timedelta(minutes=10)
        )
        
        # Phase 2: Theme Extraction
        themes = await workflow.execute_activity(
            extract_themes,
            user_id,
            start_to_close_timeout=timedelta(minutes=10)
        )
        
        # Phase 3: Profile Update
        profile_update = await workflow.execute_activity(
            update_user_profile,
            args=(user_id, session_summaries, themes),
            start_to_close_timeout=timedelta(minutes=10)
        )
        
        # Phase 4: Cleanup
        await workflow.execute_activity(
            archive_old_memories,
            user_id,
            start_to_close_timeout=timedelta(minutes=5)
        )
        
        return UserConsolidationResult(
            user_id=user_id,
            sessions_summarized=len(session_summaries),
            themes_extracted=len(themes),
            profile_updated=profile_update.success,
            timestamp=workflow.now().isoformat()
        )
```

### 4.3 Phase 1: Session Summarization

```python
@activity.defn
async def summarize_sessions(user_id: str) -> List[SessionSummary]:
    """
    Generate summaries for sessions that haven't been consolidated yet.
    """
    
    # Fetch unconsolidated sessions
    sessions = await session_repo.get_unconsolidated_sessions(user_id)
    
    summaries = []
    for session in sessions:
        # Fetch all messages for this session
        messages = await message_repo.get_session_messages(session.id)
        
        # Generate summary using LLM
        summary = await generate_session_summary(session, messages)
        
        # Create embedding and store
        await store_session_summary(user_id, session.id, summary)
        
        summaries.append(summary)
    
    return summaries

async def generate_session_summary(
    session: Session,
    messages: List[Message]
) -> SessionSummary:
    """
    Use LLM to generate a structured summary of a session.
    """
    
    # Prepare conversation for summarization
    conversation_text = format_conversation_for_summary(messages)
    
    summary_prompt = f"""
    Summarize this wellness conversation session. Extract key information:
    
    CONVERSATION:
    {conversation_text}
    
    Provide a JSON summary with:
    - overview: Brief 2-3 sentence summary
    - key_topics: List of main topics discussed
    - emotional_journey: How emotions changed during session
    - key_insights: Important realizations or breakthroughs
    - action_items: Any commitments or plans made
    - coping_strategies: Techniques discussed or used
    - concerns: Any wellness concerns to monitor
    - follow_up_needs: Topics for future sessions
    """
    
    response = await llm.generate_json(summary_prompt)
    
    return SessionSummary(
        session_id=session.id,
        user_id=session.user_id,
        timestamp=session.created_at,
        duration_minutes=session.duration_minutes,
        message_count=len(messages),
        **response
    )

async def store_session_summary(
    user_id: str,
    session_id: str,
    summary: SessionSummary
):
    """
    Store session summary as a vector in consolidated namespace.
    """
    
    # Create rich text for embedding
    summary_text = f"""
    Session Summary ({summary.timestamp.date()}):
    {summary.overview}
    
    Topics: {', '.join(summary.key_topics)}
    Emotional journey: {summary.emotional_journey}
    Key insights: {summary.key_insights}
    """
    
    # Generate embedding
    embedding = await embedding_service.generate_embedding(summary_text, user_id)
    
    # Store in Pinecone
    vector = Vector(
        id=f"summary:{session_id}",
        values=embedding,
        metadata={
            "vector_type": "session_summary",
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": summary.timestamp.isoformat(),
            "overview": summary.overview,
            "key_topics": summary.key_topics,
            "emotional_journey": summary.emotional_journey,
            "key_insights": summary.key_insights,
            "action_items": summary.action_items,
            "coping_strategies": summary.coping_strategies,
            "concerns": summary.concerns,
            "follow_up_needs": summary.follow_up_needs,
            "message_count": summary.message_count,
            "duration_minutes": summary.duration_minutes
        }
    )
    
    pinecone.upsert(
        vectors=[vector],
        namespace=f"consolidated-{user_id}"
    )
```

### 4.4 Phase 2: Theme Extraction

```python
@activity.defn
async def extract_themes(user_id: str) -> List[ThemeCluster]:
    """
    Extract recurring themes from recent sessions.
    """
    
    # Fetch recent session summaries
    summaries = await get_recent_summaries(user_id, days=30)
    
    if len(summaries) < 3:
        return []  # Not enough data for theme extraction
    
    # Generate embeddings for all summaries
    summary_texts = [s.overview for s in summaries]
    embeddings = await embedding_service.batch_generate(summary_texts)
    
    # Perform clustering
    clusters = cluster_summaries(summaries, embeddings)
    
    # Generate theme labels for each cluster
    themes = []
    for cluster in clusters:
        theme = await generate_theme_label(cluster)
        await store_theme_vector(user_id, theme)
        themes.append(theme)
    
    return themes

def cluster_summaries(
    summaries: List[SessionSummary],
    embeddings: List[List[float]],
    min_cluster_size: int = 2
) -> List[SummaryCluster]:
    """
    Cluster session summaries by semantic similarity.
    """
    
    from sklearn.cluster import HDBSCAN
    
    # Convert to numpy array
    X = np.array(embeddings)
    
    # Cluster using HDBSCAN
    clusterer = HDBSCAN(
        min_cluster_size=min_cluster_size,
        metric='cosine'
    )
    labels = clusterer.fit_predict(X)
    
    # Group by cluster label
    clusters = defaultdict(list)
    for summary, label in zip(summaries, labels):
        if label != -1:  # Ignore noise points
            clusters[label].append(summary)
    
    return [
        SummaryCluster(
            cluster_id=f"theme-{user_id}-{label}",
            summaries=summaries,
            centroid=np.mean([
                embeddings[summaries.index(s)] for s in summaries
            ], axis=0).tolist()
        )
        for label, summaries in clusters.items()
    ]

async def generate_theme_label(cluster: SummaryCluster) -> ThemeCluster:
    """
    Use LLM to generate a human-readable theme label.
    """
    
    # Combine all summary overviews
    combined_text = '\n'.join([
        f"- {s.overview}" for s in cluster.summaries
    ])
    
    theme_prompt = f"""
    Based on these session summaries, identify the recurring theme:
    
    SUMMARIES:
    {combined_text}
    
    Provide:
    1. A short theme name (2-4 words)
    2. A brief description of the pattern
    3. The emotional tone of this theme
    4. Any progression or changes over time
    
    Return as JSON.
    """
    
    response = await llm.generate_json(theme_prompt)
    
    return ThemeCluster(
        cluster_id=cluster.cluster_id,
        theme_name=response['theme_name'],
        description=response['description'],
        emotional_tone=response['emotional_tone'],
        progression=response['progression'],
        session_count=len(cluster.summaries),
        first_occurrence=min(s.timestamp for s in cluster.summaries),
        last_occurrence=max(s.timestamp for s in cluster.summaries),
        centroid=cluster.centroid
    )
```

### 4.5 Phase 3: Profile Update

```python
@activity.defn
async def update_user_profile(
    user_id: str,
    session_summaries: List[SessionSummary],
    themes: List[ThemeCluster]
) -> ProfileUpdateResult:
    """
    Update the user's long-term profile based on recent activity.
    """
    
    # Fetch existing profile
    existing_profile = await profile_repo.get_profile(user_id)
    
    # Generate updated profile
    updated_profile = await generate_profile_update(
        existing_profile,
        session_summaries,
        themes
    )
    
    # Store updated profile vectors
    await store_profile_vectors(user_id, updated_profile)
    
    # Update PostgreSQL profile record
    await profile_repo.update_profile(user_id, updated_profile)
    
    return ProfileUpdateResult(
        success=True,
        profile_version=updated_profile.version,
        changes_detected=updated_profile.changes
    )

async def generate_profile_update(
    existing: UserProfile,
    summaries: List[SessionSummary],
    themes: List[ThemeCluster]
) -> UserProfile:
    """
    Use LLM to generate updated profile based on recent sessions.
    """
    
    # Prepare context
    context = {
        "existing_profile": existing.to_dict() if existing else None,
        "recent_summaries": [s.to_dict() for s in summaries],
        "extracted_themes": [t.to_dict() for t in themes],
        "time_period": f"{summaries[0].timestamp.date()} to {summaries[-1].timestamp.date()}"
    }
    
    profile_prompt = f"""
    Update the user's wellness profile based on recent sessions.
    
    EXISTING PROFILE:
    {json.dumps(context['existing_profile'], indent=2)}
    
    RECENT SESSIONS ({context['time_period']}):
    {json.dumps(context['recent_summaries'], indent=2)}
    
    EXTRACTED THEMES:
    {json.dumps(context['extracted_themes'], indent=2)}
    
    Generate an updated profile with:
    
    1. core_traits: Key personality/behavioral traits observed
    2. emotional_patterns: Recurring emotional states and triggers
    3. wellness_goals: Stated or inferred wellness objectives
    4. coping_strategies: Techniques that work for this user
    5. support_preferences: How they prefer to receive support
    6. risk_factors: Any concerns to monitor
    7. strengths: Positive qualities and resilience factors
    8. conversation_style: Preferred communication style
    9. important_context: Key background information
    10. progress_notes: Observed changes over time
    
    Return as structured JSON.
    """
    
    response = await llm.generate_json(profile_prompt)
    
    return UserProfile(
        user_id=existing.user_id if existing else summaries[0].user_id,
        version=(existing.version if existing else 0) + 1,
        updated_at=datetime.utcnow(),
        **response
    )

async def store_profile_vectors(user_id: str, profile: UserProfile):
    """
    Store profile components as separate vectors for targeted retrieval.
    """
    
    namespace = f"profile-{user_id}"
    vectors = []
    
    # Create vector for each profile component
    components = [
        ("core_traits", profile.core_traits),
        ("emotional_patterns", profile.emotional_patterns),
        ("wellness_goals", profile.wellness_goals),
        ("coping_strategies", profile.coping_strategies),
        ("support_preferences", profile.support_preferences),
        ("strengths", profile.strengths),
        ("important_context", profile.important_context),
    ]
    
    for component_name, content in components:
        if not content:
            continue
            
        # Generate embedding
        text = f"{component_name}: {json.dumps(content)}"
        embedding = await embedding_service.generate_embedding(text, user_id)
        
        vector = Vector(
            id=f"profile:{component_name}",
            values=embedding,
            metadata={
                "vector_type": "profile_component",
                "component_name": component_name,
                "content": json.dumps(content)[:1000],
                "user_id": user_id,
                "version": profile.version,
                "updated_at": profile.updated_at.isoformat()
            }
        )
        vectors.append(vector)
    
    # Upsert all profile vectors
    pinecone.upsert(vectors=vectors, namespace=namespace)
```

### 4.6 Phase 4: Cleanup & Archival

```python
@activity.defn
async def archive_old_memories(user_id: str):
    """
    Archive old session memories to cold storage.
    Keep recent and consolidated memories in Pinecone.
    """
    
    # Archive sessions older than 90 days
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    
    # Fetch old session vectors
    old_vectors = await fetch_old_session_vectors(user_id, cutoff_date)
    
    if old_vectors:
        # Export to S3 for archival
        await export_to_s3(user_id, old_vectors)
        
        # Delete from Pinecone (keep summaries)
        vector_ids = [v.id for v in old_vectors]
        pinecone.delete(
            ids=vector_ids,
            namespace=f"sessions-{user_id}"
        )
    
    # Update metadata
    await session_repo.mark_archived(user_id, cutoff_date)
```

### 4.7 Consolidation Configuration

```yaml
# config/consolidation.yaml
consolidation:
  schedule:
    cron: "0 2 * * *"              # 2:00 AM UTC daily
    timezone: "UTC"
    
  session_summarization:
    enabled: true
    min_messages: 5                # Minimum messages to summarize
    max_age_days: 7                # Only summarize sessions from last 7 days
    
  theme_extraction:
    enabled: true
    min_sessions: 3                # Minimum sessions for theme extraction
    lookback_days: 30              # Look back 30 days for themes
    min_cluster_size: 2            # Minimum sessions per theme
    
  profile_update:
    enabled: true
    update_frequency: "weekly"     # Update profile weekly
    
  archival:
    enabled: true
    archive_after_days: 90         # Archive raw sessions after 90 days
    keep_summaries: true           # Keep summaries in Pinecone
    
  temporal:
    workflow_timeout: "2h"
    activity_retry_policy:
      initial_interval: "30s"
      backoff_coefficient: 2.0
      maximum_interval: "5m"
      maximum_attempts: 3
```

---

## 5. Data Models & Schemas

### 5.1 Core Data Models

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum

class VectorType(str, Enum):
    SESSION_MESSAGE = "session_message"
    SESSION_SUMMARY = "session_summary"
    THEME_CLUSTER = "theme_cluster"
    PROFILE_COMPONENT = "profile_component"
    CONSOLIDATED_INSIGHT = "consolidated_insight"

@dataclass
class MessageChunk:
    """Individual message chunk for storage."""
    content: str
    role: str
    timestamp: datetime
    session_id: str
    message_index: int
    emotions: Dict[str, float]
    sentiment_score: float
    intensity: float
    topic_tags: List[str]
    wellness_indicators: List[str]
    importance_score: float = 0.5
    is_key_moment: bool = False

@dataclass
class SessionSummary:
    """Generated summary of a session."""
    session_id: str
    user_id: str
    timestamp: datetime
    duration_minutes: int
    message_count: int
    overview: str
    key_topics: List[str]
    emotional_journey: str
    key_insights: List[str]
    action_items: List[str]
    coping_strategies: List[str]
    concerns: List[str]
    follow_up_needs: List[str]

@dataclass
class ThemeCluster:
    """Extracted theme from multiple sessions."""
    cluster_id: str
    theme_name: str
    description: str
    emotional_tone: str
    progression: str
    session_count: int
    first_occurrence: datetime
    last_occurrence: datetime
    centroid: List[float]

@dataclass
class UserProfile:
    """Long-term user profile."""
    user_id: str
    version: int
    updated_at: datetime
    core_traits: Dict
    emotional_patterns: Dict
    wellness_goals: List[str]
    coping_strategies: List[str]
    support_preferences: Dict
    risk_factors: List[str]
    strengths: List[str]
    conversation_style: str
    important_context: Dict
    progress_notes: List[str]

@dataclass
class RetrievedMemory:
    """Memory retrieved from vector store."""
    content: str
    source: str
    timestamp: Optional[datetime]
    score: float
    metadata: Dict
    vector_id: Optional[str] = None
    rerank_score: float = 0.0
    final_score: float = 0.0
    is_profile: bool = False
    emotion_match: bool = False
    matched_topics: List[str] = None
```

### 5.2 Pinecone Index Schema

```python
# Pinecone Index Configuration
PINECONE_INDEX_CONFIG = {
    "name": "mindmate-memory",
    "dimension": 3072,              # text-embedding-3-large
    "metric": "cosine",
    "spec": {
        "serverless": {
            "cloud": "aws",
            "region": "us-east-1"
        }
    }
}

# Vector Metadata Schema (all namespaces)
VECTOR_METADATA_SCHEMA = {
    # Core identifiers
    "user_id": "string",           # UUID
    "session_id": "string",        # UUID (optional for profile)
    "vector_type": "string",       # Enum: session_message, session_summary, etc.
    
    # Content
    "content": "string",           # Truncated content (max 1000 chars)
    "content_full_hash": "string", # For deduplication
    
    # Temporal
    "timestamp": "string",         # ISO 8601 datetime
    "hour_of_day": "integer",      # 0-23
    "day_of_week": "integer",      # 0-6
    
    # Emotional
    "dominant_emotion": "string",
    "sentiment_score": "float",    # -1.0 to 1.0
    "intensity": "float",          # 0.0 to 1.0
    "emotions_json": "string",     # Serialized emotion dict
    
    # Topical
    "topic_tags": ["string"],      # Array of topic tags
    "wellness_indicators": ["string"],
    
    # Retrieval
    "importance_score": "float",   # 0.0 to 1.0
    "is_key_moment": "boolean",
    
    # Type-specific fields
    "message_index": "integer",    # For session messages
    "chunking_strategy": "string", # message_level, sliding_window, semantic
    "component_name": "string",    # For profile components
    "version": "integer",          # For profile versions
}
```

---

## 6. Implementation Details

### 6.1 Service Dependencies

```python
# Dependency injection setup
from functools import lru_cache

@lru_cache()
def get_pinecone_index():
    """Get or create Pinecone index connection."""
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index("mindmate-memory")

@lru_cache()
def get_embedding_service():
    """Get embedding service instance."""
    return EmbeddingService(
        redis_client=get_redis_client(),
        pinecone_index=get_pinecone_index()
    )

@lru_cache()
def get_memory_retrieval_service():
    """Get memory retrieval service."""
    return MemoryRetrievalService(
        pinecone_index=get_pinecone_index(),
        embedding_service=get_embedding_service()
    )
```

### 6.2 Error Handling & Resilience

```python
class MemoryServiceError(Exception):
    """Base exception for memory service errors."""
    pass

class EmbeddingError(MemoryServiceError):
    """Error generating embeddings."""
    pass

class RetrievalError(MemoryServiceError):
    """Error retrieving memories."""
    pass

# Retry configuration
RETRY_CONFIG = {
    "embedding": {
        "max_attempts": 3,
        "backoff_factor": 2.0,
        "exceptions": [openai.RateLimitError, openai.APIError]
    },
    "pinecone": {
        "max_attempts": 3,
        "backoff_factor": 1.5,
        "exceptions": [PineconeApiException]
    }
}
```

---

## 7. Performance Considerations

### 7.1 Query Performance Targets

| Operation | Target Latency | Max Latency |
|-----------|---------------|-------------|
| Embedding Generation | 200ms | 500ms |
| Semantic Search | 100ms | 300ms |
| Full Retrieval (all strategies) | 500ms | 1s |
| Context Building | 50ms | 100ms |
| **Total Memory Retrieval** | **850ms** | **2s** |

### 7.2 Optimization Strategies

```python
# 1. Embedding caching
# - Cache embeddings by content hash
# - 7-day TTL
# - Redis-backed

# 2. Retrieval caching
# - Cache retrievals per session
# - 60-second TTL
# - Invalidated on new message

# 3. Batch operations
# - Batch embedding generation (100 at a time)
# - Batch Pinecone upserts (100 at a time)

# 4. Index optimization
# - Use metadata filters to reduce search space
# - Namespace per user for query isolation

# 5. Async operations
# - All I/O operations are async
# - Parallel retrieval strategies
```

### 7.3 Scaling Considerations

| Metric | Current | Scale Target |
|--------|---------|--------------|
| Concurrent Users | 1,000 | 10,000 |
| Sessions/Day | 10,000 | 100,000 |
| Messages/Day | 500,000 | 5,000,000 |
| Vectors Stored | 10M | 100M |
| Pinecone Cost | ~$200/mo | ~$1,500/mo |

---

## 8. Security & Privacy

### 8.1 Data Privacy Measures

```yaml
privacy:
  encryption:
    at_rest: true                 # Pinecone encrypts at rest
    in_transit: true              # TLS 1.3
    
  data_retention:
    raw_sessions: 90_days         # Archive after 90 days
    summaries: 2_years            # Keep summaries longer
    profiles: indefinite          # Keep until account deletion
    
  access_control:
    namespace_isolation: true     # One namespace per user
    row_level_security: true      # Filter by user_id in queries
    
  anonymization:
    cross_user_insights: true     # Anonymized patterns only
    pii_detection: true           # Detect and flag PII
```

### 8.2 PII Handling

```python
class PIIDetector:
    """Detect and handle PII in memory content."""
    
    SENSITIVE_PATTERNS = [
        (r'\b\d{3}-\d{2}-\d{4}\b', 'SSN'),
        (r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', 'CREDIT_CARD'),
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'EMAIL'),
        (r'\b\d{3}-\d{3}-\d{4}\b', 'PHONE'),
    ]
    
    def sanitize(self, text: str) -> str:
        """Remove or mask PII from text before storage."""
        sanitized = text
        
        for pattern, pii_type in self.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, f'[{pii_type}_REDACTED]', sanitized)
        
        return sanitized
```

---

## 9. Monitoring & Observability

### 9.1 Key Metrics

```python
# Metrics to track
MEMORY_METRICS = {
    "retrieval": [
        "memory.retrieval.latency",           # Histogram
        "memory.retrieval.success_rate",      # Counter
        "memory.retrieval.cache_hit_rate",    # Gauge
        "memory.retrieval.memories_returned", # Histogram
    ],
    "embedding": [
        "embedding.generation.latency",
        "embedding.generation.cache_hit_rate",
        "embedding.batch_size",
    ],
    "storage": [
        "storage.upsert.latency",
        "storage.vectors_stored",
        "storage.namespace_size",
    ],
    "consolidation": [
        "consolidation.duration",
        "consolidation.sessions_processed",
        "consolidation.themes_extracted",
        "consolidation.failures",
    ]
}
```

### 9.2 Alerting Rules

```yaml
alerts:
  - name: HighRetrievalLatency
    condition: memory.retrieval.latency.p99 > 2s
    severity: warning
    
  - name: EmbeddingFailures
    condition: rate(embedding.generation.errors[5m]) > 0.01
    severity: critical
    
  - name: ConsolidationStuck
    condition: consolidation.duration > 3h
    severity: warning
```

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| **Chunk** | A unit of text stored as a vector |
| **Embedding** | Numerical vector representation of text |
| **Namespace** | Logical partition in Pinecone (per-user) |
| **Consolidation** | Process of summarizing and archiving memories |
| **RAG** | Retrieval-Augmented Generation |
| **Cross-Encoder** | Model for reranking retrieved results |

### 10.2 Related Documents

- [API Design](../api/api_design.md)
- [Database Schema](../database/schema.md)
- [Temporal Workflows](../workflows/temporal_setup.md)
- [LLM Integration](../llm/llm_integration.md)

---

*Document Version: 1.0*
*Last Updated: 2024*
*Owner: Agent 31 - Memory & RAG System Architect*
