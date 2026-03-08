"""
MindMate AI - Memory Service
Main memory service with vector storage, retrieval, and management.

Functions:
1. store_session_memory(session_id, transcript) — embed and store session
2. retrieve_relevant_memories(user_id, query, limit=5) — RAG retrieval
3. consolidate_memories(user_id) — nightly summarization job
4. delete_user_memories(user_id) — GDPR deletion
5. get_user_profile_summary(user_id) — high-level user context
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import asdict

from pinecone_client import get_pinecone_client, PineconeClient
from embedding_service import get_embedding_service, EmbeddingService
from models import (
    MemoryChunk, SessionTranscript, RetrievedMemory,
    UserProfile, ConsolidationResult,
    MemoryType, MemoryStatus
)
from config import config

logger = logging.getLogger(__name__)


class MemoryService:
    """
    Main memory service for MindMate AI.
    
    Provides vector-based memory storage, retrieval, and management
    using Pinecone and OpenAI embeddings.
    """
    
    _instance: Optional["MemoryService"] = None
    
    def __new__(cls) -> "MemoryService":
        """Singleton pattern for memory service."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize memory service."""
        self.pinecone: PineconeClient = get_pinecone_client()
        self.embedding: EmbeddingService = get_embedding_service()
        self.cfg = config.memory
    
    # ========================================================================
    # 1. STORE SESSION MEMORY
    # ========================================================================
    
    async def store_session_memory(
        self,
        session_id: str,
        transcript: SessionTranscript,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Store a session transcript as vector memories.
        
        Embeds the transcript, chunks it, and stores in Pinecone.
        
        Args:
            session_id: Unique session identifier
            transcript: Session transcript with messages
            metadata: Optional additional metadata
            
        Returns:
            Storage result with chunk IDs and stats
        """
        logger.info(f"Storing session memory: {session_id} for user: {transcript.user_id}")
        
        try:
            # Split transcript into chunks
            chunks = transcript.to_chunks(
                chunk_size=self.cfg.chunk_size,
                overlap=self.cfg.chunk_overlap
            )
            
            if not chunks:
                logger.warning(f"No content to store for session: {session_id}")
                return {"stored": 0, "chunks": [], "session_id": session_id}
            
            # Create memory chunks
            memory_chunks = [
                MemoryChunk.create(
                    user_id=transcript.user_id,
                    session_id=session_id,
                    content=chunk,
                    memory_type=MemoryType.SESSION,
                    metadata={
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "session_started": transcript.started_at.isoformat(),
                        **(metadata or {})
                    }
                )
                for i, chunk in enumerate(chunks)
            ]
            
            # Generate embeddings for chunks
            texts = [chunk.content for chunk in memory_chunks]
            embedding_results = await self.embedding.embed_batch(texts)
            
            # Attach embeddings to chunks
            for chunk, result in zip(memory_chunks, embedding_results):
                chunk.embedding = result.embedding
            
            # Convert to Pinecone records
            vectors = [chunk.to_pinecone_record() for chunk in memory_chunks]
            
            # Store in Pinecone
            namespace = self.pinecone.get_namespace(transcript.user_id)
            upsert_result = self.pinecone.upsert_vectors(
                vectors=vectors,
                namespace=namespace
            )
            
            logger.info(f"Stored {len(memory_chunks)} chunks for session: {session_id}")
            
            return {
                "stored": upsert_result["upserted_count"],
                "chunks": [chunk.id for chunk in memory_chunks],
                "session_id": session_id,
                "user_id": transcript.user_id,
                "namespace": namespace
            }
            
        except Exception as e:
            logger.error(f"Failed to store session memory: {e}")
            raise
    
    # ========================================================================
    # 2. RETRIEVE RELEVANT MEMORIES (RAG)
    # ========================================================================
    
    async def retrieve_relevant_memories(
        self,
        user_id: str,
        query: str,
        limit: int = 5,
        memory_types: Optional[List[MemoryType]] = None,
        min_score: Optional[float] = None
    ) -> List[RetrievedMemory]:
        """
        Retrieve relevant memories using RAG (Retrieval-Augmented Generation).
        
        Embeds the query and searches for similar memories in Pinecone.
        
        Args:
            user_id: User identifier
            query: Search query text
            limit: Maximum number of results (default: 5)
            memory_types: Filter by memory types
            min_score: Minimum similarity score threshold
            
        Returns:
            List of retrieved memories with similarity scores
        """
        logger.info(f"Retrieving memories for user: {user_id}, query: {query[:50]}...")
        
        try:
            # Validate limit
            limit = min(limit, self.cfg.max_top_k)
            min_score = min_score or self.cfg.similarity_threshold
            
            # Embed query
            query_embedding = await self.embedding.embed_text(query)
            
            # Build filter
            filter_dict = {"status": {"$eq": MemoryStatus.ACTIVE.value}}
            if memory_types:
                filter_dict["memory_type"] = {"$in": [mt.value for mt in memory_types]}
            
            # Query Pinecone
            namespace = self.pinecone.get_namespace(user_id)
            results = self.pinecone.query_vectors(
                vector=query_embedding.embedding,
                namespace=namespace,
                top_k=limit * 2,  # Fetch more to filter by score
                filter_dict=filter_dict,
                include_metadata=True
            )
            
            # Convert to RetrievedMemory objects
            memories = []
            for result in results:
                if result["score"] >= min_score:
                    memory = MemoryChunk.from_pinecone_record(result)
                    memories.append(RetrievedMemory(memory=memory, score=result["score"]))
            
            # Sort by score and limit
            memories.sort(key=lambda x: x.score, reverse=True)
            memories = memories[:limit]
            
            logger.info(f"Retrieved {len(memories)} relevant memories for user: {user_id}")
            
            return memories
            
        except Exception as e:
            logger.error(f"Failed to retrieve memories: {e}")
            raise
    
    async def retrieve_with_context(
        self,
        user_id: str,
        query: str,
        limit: int = 5,
        include_profile: bool = True
    ) -> Dict[str, Any]:
        """
        Retrieve memories with user profile context for LLM prompting.
        
        Args:
            user_id: User identifier
            query: Search query
            limit: Number of memories to retrieve
            include_profile: Whether to include user profile
            
        Returns:
            Dictionary with memories and profile context
        """
        # Retrieve relevant memories
        memories = await self.retrieve_relevant_memories(user_id, query, limit)
        
        result = {
            "memories": [m.to_dict() for m in memories],
            "query": query,
            "user_id": user_id
        }
        
        # Include profile if requested
        if include_profile:
            profile = await self.get_user_profile_summary(user_id)
            if profile:
                result["user_profile"] = profile.to_dict()
        
        return result
    
    # ========================================================================
    # 3. CONSOLIDATE MEMORIES (Nightly Job)
    # ========================================================================
    
    async def consolidate_memories(
        self,
        user_id: str,
        days: Optional[int] = None,
        min_memories: Optional[int] = None
    ) -> ConsolidationResult:
        """
        Consolidate old memories into a summary (nightly summarization job).
        
        Groups old session memories, generates a summary, and archives
        the original memories.
        
        Args:
            user_id: User identifier
            days: Days back to consolidate (default from config)
            min_memories: Minimum memories required for consolidation
            
        Returns:
            Consolidation result with summary and stats
        """
        logger.info(f"Consolidating memories for user: {user_id}")
        
        days = days or self.cfg.consolidation_days
        min_memories = min_memories or self.cfg.min_memories_for_consolidation
        
        try:
            # Calculate cutoff date
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Get all active memories for user
            namespace = self.pinecone.get_namespace(user_id)
            
            # Query for session memories older than cutoff
            filter_dict = {
                "status": {"$eq": MemoryStatus.ACTIVE.value},
                "memory_type": {"$eq": MemoryType.SESSION.value},
                "created_at": {"$lt": cutoff_date.isoformat()}
            }
            
            # Use dummy vector to list all matching memories
            # This is a simplified approach - in production, use pagination
            dummy_vector = [0.0] * config.pinecone.dimension
            results = self.pinecone.query_vectors(
                vector=dummy_vector,
                namespace=namespace,
                top_k=1000,
                filter_dict=filter_dict,
                include_metadata=True
            )
            
            if len(results) < min_memories:
                logger.info(f"Not enough memories to consolidate for user: {user_id} ({len(results)} < {min_memories})")
                return ConsolidationResult(
                    user_id=user_id,
                    consolidated_count=0,
                    archived_count=0,
                    summary="",
                    key_topics=[]
                )
            
            # Extract memory contents
            memories = [MemoryChunk.from_pinecone_record(r) for r in results]
            contents = [m.content for m in memories]
            
            # Generate summary (in production, use LLM for this)
            summary = self._generate_consolidation_summary(contents)
            key_topics = self._extract_key_topics(contents)
            
            # Create consolidated memory
            consolidated = MemoryChunk.create(
                user_id=user_id,
                session_id=f"consolidated_{datetime.utcnow().strftime('%Y%m%d')}",
                content=summary,
                memory_type=MemoryType.CONSOLIDATED,
                metadata={
                    "original_count": len(memories),
                    "date_range_start": min(m.created_at for m in memories).isoformat(),
                    "date_range_end": max(m.created_at for m in memories).isoformat(),
                    "key_topics": key_topics
                }
            )
            
            # Embed and store consolidated memory
            embedding_result = await self.embedding.embed_text(summary)
            consolidated.embedding = embedding_result.embedding
            
            self.pinecone.upsert_vectors(
                vectors=[consolidated.to_pinecone_record()],
                namespace=namespace
            )
            
            # Mark original memories as consolidated
            for memory in memories:
                memory.status = MemoryStatus.CONSOLIDATED
                memory.updated_at = datetime.utcnow()
            
            # Update original memories in Pinecone
            self.pinecone.upsert_vectors(
                vectors=[m.to_pinecone_record() for m in memories],
                namespace=namespace
            )
            
            logger.info(f"Consolidated {len(memories)} memories for user: {user_id}")
            
            return ConsolidationResult(
                user_id=user_id,
                consolidated_count=1,
                archived_count=len(memories),
                summary=summary,
                key_topics=key_topics
            )
            
        except Exception as e:
            logger.error(f"Failed to consolidate memories: {e}")
            raise
    
    def _generate_consolidation_summary(self, contents: List[str]) -> str:
        """Generate a summary from memory contents."""
        # In production, use an LLM to generate a proper summary
        # This is a simple placeholder implementation
        combined = " ".join(contents)
        
        # Truncate if too long
        max_len = self.cfg.max_summary_length
        if len(combined) > max_len:
            combined = combined[:max_len] + "..."
        
        return f"Consolidated memory summary covering {len(contents)} sessions: {combined}"
    
    def _extract_key_topics(self, contents: List[str]) -> List[str]:
        """Extract key topics from memory contents."""
        # In production, use NLP/LLM for topic extraction
        # This is a simple placeholder
        all_text = " ".join(contents).lower()
        
        # Simple keyword extraction (placeholder)
        common_words = ["the", "and", "is", "to", "of", "a", "in", "that", "have", "it"]
        words = [w for w in all_text.split() if len(w) > 4 and w not in common_words]
        
        # Return top unique words as topics
        from collections import Counter
        top_words = Counter(words).most_common(10)
        return [word for word, count in top_words]
    
    # ========================================================================
    # 4. DELETE USER MEMORIES (GDPR)
    # ========================================================================
    
    async def delete_user_memories(
        self,
        user_id: str,
        hard_delete: bool = False,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Delete all memories for a user (GDPR compliance).
        
        Supports soft delete (mark for deletion) or hard delete.
        
        Args:
            user_id: User identifier
            hard_delete: If True, permanently delete immediately
            session_id: Optional specific session to delete
            
        Returns:
            Deletion result with stats
        """
        logger.info(f"Deleting memories for user: {user_id} (hard_delete={hard_delete})")
        
        try:
            namespace = self.pinecone.get_namespace(user_id)
            
            if hard_delete:
                # Hard delete - remove all vectors immediately
                if session_id:
                    # Delete specific session
                    filter_dict = {"session_id": {"$eq": session_id}}
                    self.pinecone.delete_vectors(
                        namespace=namespace,
                        filter_dict=filter_dict
                    )
                    logger.info(f"Hard deleted session {session_id} for user: {user_id}")
                else:
                    # Delete all user data
                    self.pinecone.delete_vectors(
                        namespace=namespace,
                        delete_all=True
                    )
                    logger.info(f"Hard deleted all memories for user: {user_id}")
                
                return {
                    "deleted": True,
                    "user_id": user_id,
                    "session_id": session_id,
                    "hard_delete": True
                }
            
            else:
                # Soft delete - mark for later deletion
                filter_dict = {"status": {"$ne": MemoryStatus.PENDING_DELETE.value}}
                if session_id:
                    filter_dict["session_id"] = {"$eq": session_id}
                
                # Query all matching memories
                dummy_vector = [0.0] * config.pinecone.dimension
                results = self.pinecone.query_vectors(
                    vector=dummy_vector,
                    namespace=namespace,
                    top_k=10000,
                    filter_dict=filter_dict,
                    include_metadata=True
                )
                
                # Mark as pending delete
                memories = [MemoryChunk.from_pinecone_record(r) for r in results]
                for memory in memories:
                    memory.status = MemoryStatus.PENDING_DELETE
                    memory.updated_at = datetime.utcnow()
                    memory.metadata["pending_delete_at"] = datetime.utcnow().isoformat()
                    memory.metadata["delete_after"] = (
                        datetime.utcnow() + timedelta(days=self.cfg.soft_delete_ttl_days)
                    ).isoformat()
                
                # Update in Pinecone
                if memories:
                    self.pinecone.upsert_vectors(
                        vectors=[m.to_pinecone_record() for m in memories],
                        namespace=namespace
                    )
                
                logger.info(f"Soft deleted {len(memories)} memories for user: {user_id}")
                
                return {
                    "deleted": False,
                    "marked_for_deletion": True,
                    "user_id": user_id,
                    "session_id": session_id,
                    "count": len(memories),
                    "delete_after_days": self.cfg.soft_delete_ttl_days
                }
                
        except Exception as e:
            logger.error(f"Failed to delete memories: {e}")
            raise
    
    async def purge_deleted_memories(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Purge memories marked for deletion (GDPR cleanup job).
        
        Args:
            user_id: Optional user to purge (purges all if None)
            
        Returns:
            Purge result with stats
        """
        logger.info(f"Purging deleted memories for user: {user_id or 'ALL'}")
        
        try:
            now = datetime.utcnow().isoformat()
            filter_dict = {
                "status": {"$eq": MemoryStatus.PENDING_DELETE.value},
                "delete_after": {"$lt": now}
            }
            
            if user_id:
                namespace = self.pinecone.get_namespace(user_id)
                self.pinecone.delete_vectors(
                    namespace=namespace,
                    filter_dict=filter_dict
                )
                return {"purged": True, "user_id": user_id}
            else:
                # Would need to iterate all namespaces in production
                # This is a simplified version
                logger.info("Global purge would iterate all namespaces")
                return {"purged": True, "scope": "global"}
                
        except Exception as e:
            logger.error(f"Failed to purge memories: {e}")
            raise
    
    # ========================================================================
    # 5. GET USER PROFILE SUMMARY
    # ========================================================================
    
    async def get_user_profile_summary(
        self,
        user_id: str,
        refresh: bool = False
    ) -> Optional[UserProfile]:
        """
        Get high-level user profile summary.
        
        Aggregates user data from memories to build a profile.
        
        Args:
            user_id: User identifier
            refresh: Force refresh the profile
            
        Returns:
            User profile or None if not found
        """
        logger.info(f"Getting user profile for: {user_id}")
        
        try:
            namespace = self.pinecone.get_namespace(user_id)
            
            # Check for existing profile
            if not refresh:
                filter_dict = {"memory_type": {"$eq": MemoryType.PROFILE.value}}
                dummy_vector = [0.0] * config.pinecone.dimension
                results = self.pinecone.query_vectors(
                    vector=dummy_vector,
                    namespace=namespace,
                    top_k=1,
                    filter_dict=filter_dict,
                    include_metadata=True
                )
                
                if results:
                    profile_memory = MemoryChunk.from_pinecone_record(results[0])
                    # Parse profile from memory content
                    try:
                        import json
                        profile_data = json.loads(profile_memory.content)
                        return UserProfile.from_dict(profile_data)
                    except:
                        pass
            
            # Generate new profile from memories
            return await self._generate_user_profile(user_id)
            
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            return None
    
    async def _generate_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Generate user profile from memories."""
        try:
            namespace = self.pinecone.get_namespace(user_id)
            
            # Get all memories for user
            filter_dict = {"status": {"$eq": MemoryStatus.ACTIVE.value}}
            dummy_vector = [0.0] * config.pinecone.dimension
            results = self.pinecone.query_vectors(
                vector=dummy_vector,
                namespace=namespace,
                top_k=1000,
                filter_dict=filter_dict,
                include_metadata=True
            )
            
            if not results:
                return None
            
            memories = [MemoryChunk.from_pinecone_record(r) for r in results]
            
            # Aggregate data
            all_contents = [m.content for m in memories]
            all_topics = []
            first_interaction = min(m.created_at for m in memories)
            last_interaction = max(m.created_at for m in memories)
            
            for m in memories:
                if "key_topics" in m.metadata:
                    all_topics.extend(m.metadata["key_topics"])
            
            # Get unique topics
            unique_topics = list(set(all_topics))[:20]  # Top 20 topics
            
            # Generate summary
            summary = self._generate_profile_summary(all_contents, unique_topics)
            
            profile = UserProfile(
                user_id=user_id,
                summary=summary,
                key_topics=unique_topics,
                interaction_count=len(memories),
                first_interaction=first_interaction,
                last_interaction=last_interaction
            )
            
            # Store profile as memory
            await self._store_user_profile(profile)
            
            return profile
            
        except Exception as e:
            logger.error(f"Failed to generate user profile: {e}")
            return None
    
    def _generate_profile_summary(self, contents: List[str], topics: List[str]) -> str:
        """Generate a summary for user profile."""
        # In production, use LLM for proper summarization
        combined = " ".join(contents)[:2000]
        topic_str = ", ".join(topics[:10])
        return f"User with interests in: {topic_str}. Recent interactions: {combined}"
    
    async def _store_user_profile(self, profile: UserProfile) -> None:
        """Store user profile as a memory."""
        import json
        
        profile_memory = MemoryChunk.create(
            user_id=profile.user_id,
            session_id="profile",
            content=json.dumps(profile.to_dict()),
            memory_type=MemoryType.PROFILE,
            metadata={"profile_version": "1.0"}
        )
        
        # Embed and store
        embedding_result = await self.embedding.embed_text(profile_memory.content)
        profile_memory.embedding = embedding_result.embedding
        
        namespace = self.pinecone.get_namespace(profile.user_id)
        self.pinecone.upsert_vectors(
            vectors=[profile_memory.to_pinecone_record()],
            namespace=namespace
        )
    
    async def update_user_profile(
        self,
        user_id: str,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Optional[UserProfile]:
        """
        Update user profile with new preferences.
        
        Args:
            user_id: User identifier
            preferences: New preferences to add/update
            
        Returns:
            Updated user profile
        """
        profile = await self.get_user_profile_summary(user_id, refresh=True)
        
        if profile and preferences:
            profile.preferences.update(preferences)
            profile.updated_at = datetime.utcnow()
            await self._store_user_profile(profile)
        
        return profile
    
    # ========================================================================
    # UTILITY METHODS
    # ========================================================================
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on memory service."""
        pinecone_health = self.pinecone.health_check()
        embedding_health = await self.embedding.health_check()
        
        return {
            "status": "healthy" if pinecone_health["status"] == "healthy" and embedding_health["status"] == "healthy" else "unhealthy",
            "pinecone": pinecone_health,
            "embedding": embedding_health,
            "config": {
                "chunk_size": self.cfg.chunk_size,
                "default_top_k": self.cfg.default_top_k,
                "consolidation_days": self.cfg.consolidation_days
            }
        }


# Global service instance
def get_memory_service() -> MemoryService:
    """Get the global memory service instance."""
    return MemoryService()


# Convenience functions for direct use
async def store_session(
    session_id: str,
    user_id: str,
    messages: List[Dict[str, Any]],
    started_at: Optional[datetime] = None
) -> Dict[str, Any]:
    """Quick store function for session transcript."""
    service = get_memory_service()
    transcript = SessionTranscript(
        session_id=session_id,
        user_id=user_id,
        messages=messages,
        started_at=started_at or datetime.utcnow()
    )
    return await service.store_session_memory(session_id, transcript)


async def retrieve_memories(
    user_id: str,
    query: str,
    limit: int = 5
) -> List[RetrievedMemory]:
    """Quick retrieve function."""
    service = get_memory_service()
    return await service.retrieve_relevant_memories(user_id, query, limit)
