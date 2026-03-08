"""
MindMate AI - Memory Service Example Usage
Demonstrates all key functions of the memory service.
"""

import asyncio
import os
from datetime import datetime

# Set environment variables (in production, use .env file)
os.environ["PINECONE_API_KEY"] = "your-pinecone-api-key"
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"
os.environ["PINECONE_INDEX_NAME"] = "mindmate-memories"

from memory_service import (
    MemoryService,
    SessionTranscript,
    MemoryType,
    MemoryStatus
)


async def example_store_session_memory():
    """
    Example 1: Store Session Memory
    
    Embeds a session transcript and stores it in Pinecone.
    The transcript is automatically chunked and each chunk is embedded.
    """
    print("=" * 60)
    print("EXAMPLE 1: Store Session Memory")
    print("=" * 60)
    
    memory = MemoryService()
    
    # Create a session transcript
    session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    user_id = "user_12345"
    
    transcript = SessionTranscript(
        session_id=session_id,
        user_id=user_id,
        messages=[
            {"role": "user", "content": "I've been feeling really stressed about work lately."},
            {"role": "assistant", "content": "I'm sorry to hear that. Can you tell me more about what's been causing the stress?"},
            {"role": "user", "content": "It's mostly the deadlines and my manager's expectations. I feel like I'm constantly behind."},
            {"role": "assistant", "content": "That sounds overwhelming. Have you tried talking to your manager about your workload?"},
            {"role": "user", "content": "Not yet. I'm worried it might make things worse."},
        ],
        started_at=datetime.utcnow(),
        metadata={
            "session_type": "therapy",
            "mood_at_start": "anxious"
        }
    )
    
    # Store the session memory
    result = await memory.store_session_memory(session_id, transcript)
    
    print(f"Stored {result['stored']} memory chunks")
    print(f"Session ID: {result['session_id']}")
    print(f"User ID: {result['user_id']}")
    print(f"Chunk IDs: {result['chunks'][:3]}...")  # Show first 3
    print()
    
    return session_id, user_id


async def example_retrieve_relevant_memories(user_id: str):
    """
    Example 2: Retrieve Relevant Memories (RAG)
    
    Searches for memories relevant to a query using vector similarity.
    """
    print("=" * 60)
    print("EXAMPLE 2: Retrieve Relevant Memories (RAG)")
    print("=" * 60)
    
    memory = MemoryService()
    
    # Retrieve memories about work stress
    query = "work stress and deadlines"
    memories = await memory.retrieve_relevant_memories(
        user_id=user_id,
        query=query,
        limit=5
    )
    
    print(f"Query: '{query}'")
    print(f"Found {len(memories)} relevant memories:\n")
    
    for i, mem in enumerate(memories, 1):
        print(f"  {i}. Score: {mem.score:.4f}")
        print(f"     Content: {mem.memory.content[:100]}...")
        print(f"     Type: {mem.memory.memory_type.value}")
        print(f"     Created: {mem.memory.created_at}")
        print()
    
    # Retrieve with context (includes user profile)
    context = await memory.retrieve_with_context(
        user_id=user_id,
        query="manager and workload",
        limit=3,
        include_profile=True
    )
    
    print("With context (includes user profile):")
    print(f"  Memories: {len(context['memories'])}")
    print(f"  Has profile: {'user_profile' in context}")
    print()


async def example_consolidate_memories(user_id: str):
    """
    Example 3: Consolidate Memories (Nightly Job)
    
    Summarizes old memories and archives them.
    """
    print("=" * 60)
    print("EXAMPLE 3: Consolidate Memories (Nightly Job)")
    print("=" * 60)
    
    memory = MemoryService()
    
    # Consolidate memories older than 7 days
    result = await memory.consolidate_memories(
        user_id=user_id,
        days=7,
        min_memories=5
    )
    
    print(f"Consolidation Result:")
    print(f"  User ID: {result.user_id}")
    print(f"  Consolidated: {result.consolidated_count} summaries")
    print(f"  Archived: {result.archived_count} original memories")
    print(f"  Key Topics: {result.key_topics}")
    print(f"  Summary: {result.summary[:150]}...")
    print()


async def example_delete_user_memories(user_id: str):
    """
    Example 4: Delete User Memories (GDPR)
    
    Demonstrates soft delete and hard delete options.
    """
    print("=" * 60)
    print("EXAMPLE 4: Delete User Memories (GDPR)")
    print("=" * 60)
    
    memory = MemoryService()
    
    # Soft delete - marks for deletion after TTL
    soft_result = await memory.delete_user_memories(
        user_id=user_id,
        hard_delete=False
    )
    
    print("Soft Delete (GDPR compliant):")
    print(f"  Deleted: {soft_result['deleted']}")
    print(f"  Marked for deletion: {soft_result['marked_for_deletion']}")
    print(f"  Count: {soft_result['count']}")
    print(f"  Delete after: {soft_result['delete_after_days']} days")
    print()
    
    # Hard delete - immediate permanent deletion
    hard_result = await memory.delete_user_memories(
        user_id=user_id,
        hard_delete=True
    )
    
    print("Hard Delete (immediate):")
    print(f"  Deleted: {hard_result['deleted']}")
    print(f"  Hard delete: {hard_result['hard_delete']}")
    print()


async def example_get_user_profile(user_id: str):
    """
    Example 5: Get User Profile Summary
    
    Retrieves or generates a high-level user profile.
    """
    print("=" * 60)
    print("EXAMPLE 5: Get User Profile Summary")
    print("=" * 60)
    
    memory = MemoryService()
    
    # Get user profile
    profile = await memory.get_user_profile_summary(user_id)
    
    if profile:
        print(f"User Profile:")
        print(f"  User ID: {profile.user_id}")
        print(f"  Summary: {profile.summary[:200]}...")
        print(f"  Key Topics: {profile.key_topics[:10]}")
        print(f"  Interaction Count: {profile.interaction_count}")
        print(f"  First Interaction: {profile.first_interaction}")
        print(f"  Last Interaction: {profile.last_interaction}")
        print(f"  Preferences: {profile.preferences}")
        print()
        
        # Update profile with new preferences
        updated = await memory.update_user_profile(
            user_id=user_id,
            preferences={
                "communication_style": "empathetic",
                "session_frequency": "weekly"
            }
        )
        
        print("Updated Profile Preferences:")
        print(f"  {updated.preferences}")
    else:
        print("No profile found for user.")
    
    print()


async def example_health_check():
    """
    Example 6: Health Check
    
    Check the health of all memory service components.
    """
    print("=" * 60)
    print("EXAMPLE 6: Health Check")
    print("=" * 60)
    
    memory = MemoryService()
    health = await memory.health_check()
    
    print(f"Memory Service Health:")
    print(f"  Status: {health['status']}")
    print(f"  Pinecone: {health['pinecone']['status']}")
    print(f"  Embedding: {health['embedding']['status']}")
    print(f"  Config: {health['config']}")
    print()


async def main():
    """Run all examples."""
    print("\n" + "=" * 60)
    print("MindMate AI - Memory Service Examples")
    print("=" * 60 + "\n")
    
    # Example 1: Store session
    session_id, user_id = await example_store_session_memory()
    
    # Example 2: Retrieve memories
    await example_retrieve_relevant_memories(user_id)
    
    # Example 3: Consolidate memories
    await example_consolidate_memories(user_id)
    
    # Example 4: Delete memories
    await example_delete_user_memories(user_id)
    
    # Example 5: Get user profile
    await example_get_user_profile(user_id)
    
    # Example 6: Health check
    await example_health_check()
    
    print("=" * 60)
    print("All examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
