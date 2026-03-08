"""
MindMate AI - Chat Service
Main chat orchestration service that coordinates all components.
"""

import time
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime

from config.settings import settings
from config.logging_config import logger
from src.models import (
    ChatRequest,
    ChatResponse,
    ConversationMessage,
    ConversationHistory,
    EmotionContext,
    CrisisLevel,
    RetrievedMemory,
    TaskAssignment,
    CrisisSignal
)
from src.claude_client import get_claude_client, ClaudeResponse
from src.memory_store import get_memory_store
from src.prompt_assembler import get_prompt_assembler, AssembledPrompt
from src.response_parser import get_response_parser, ParsedResponse
from src.emotion_handler import get_emotion_manager
from src.tts_service import get_tts_service


class ChatService:
    """
    Main chat service that orchestrates the AI pipeline.
    Coordinates: memory retrieval, prompt assembly, AI generation, response parsing, TTS.
    """
    
    def __init__(self):
        self.claude_client = get_claude_client()
        self.memory_store = get_memory_store()
        self.prompt_assembler = get_prompt_assembler()
        self.response_parser = get_response_parser()
        self.emotion_manager = get_emotion_manager()
        self.tts_service = get_tts_service()
        
        # In-memory session storage (use Redis in production)
        self._sessions: Dict[str, ConversationHistory] = {}
        self._session_metadata: Dict[str, Dict[str, Any]] = {}
    
    async def process_chat(
        self, 
        request: ChatRequest
    ) -> ChatResponse:
        """
        Process a chat request through the complete AI pipeline.
        
        Args:
            request: Chat request with message and context
            
        Returns:
            ChatResponse with AI response and metadata
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        user_id = request.user_id
        
        logger.info(
            f"Processing chat request {request_id}",
            extra={
                "request_id": request_id,
                "session_id": session_id,
                "user_id": user_id,
                "message_length": len(request.message)
            }
        )
        
        try:
            # Step 1: Get or create conversation history
            conversation_history = self._get_conversation_history(session_id, user_id)
            
            # Step 2: Retrieve relevant memories
            retrieved_memories = await self._retrieve_memories(user_id, request.message)
            
            # Step 3: Process emotion context
            emotion_context = await self._process_emotion_context(
                request.emotion_context, 
                request.message,
                session_id
            )
            
            # Step 4: Check for crisis signals in user message
            crisis_check = self.response_parser.crisis_detector.detect_crisis_in_message(
                request.message
            )
            crisis_level = crisis_check.level if crisis_check.detected else CrisisLevel.NONE
            
            # Step 5: Assemble prompt
            assembled_prompt = self.prompt_assembler.assemble_chat_prompt(
                user_message=request.message,
                user_id=user_id,
                conversation_history=conversation_history.messages,
                retrieved_memories=retrieved_memories,
                emotion_context=emotion_context,
                crisis_level=crisis_level,
                session_context=self._get_session_context(session_id)
            )
            
            # Step 6: Generate AI response
            claude_response = await self.claude_client.generate_response(
                messages=assembled_prompt.messages,
                system_prompt=assembled_prompt.system_prompt
            )
            
            # Step 7: Parse response
            parsed_response = self.response_parser.parse_response(
                ai_response=claude_response.content,
                user_message=request.message
            )
            
            # Step 8: Generate voice if requested
            voice_url = None
            if request.include_voice_response:
                voice_url = await self.tts_service.synthesize_chat_response(
                    parsed_response.clean_message
                )
            
            # Step 9: Update conversation history
            conversation_history.add_message("user", request.message)
            conversation_history.add_message(
                "assistant", 
                parsed_response.clean_message,
                emotion_context=emotion_context
            )
            
            # Step 10: Store new memory if significant
            await self._store_memory_if_significant(
                user_id, 
                request.message, 
                emotion_context
            )
            
            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Build response
            response = ChatResponse(
                response_id=request_id,
                message=parsed_response.clean_message,
                emotion_detected=emotion_context,
                tasks_assigned=parsed_response.tasks,
                crisis_signal=parsed_response.crisis_signal,
                memories_used=retrieved_memories,
                voice_url=voice_url,
                processing_time_ms=processing_time_ms
            )
            
            logger.info(
                f"Chat request {request_id} completed",
                extra={
                    "request_id": request_id,
                    "processing_time_ms": processing_time_ms,
                    "response_length": len(response.message),
                    "tasks_count": len(response.tasks_assigned),
                    "crisis_detected": response.crisis_signal.detected
                }
            )
            
            return response
            
        except Exception as e:
            logger.error(
                f"Error processing chat request {request_id}: {e}",
                extra={"request_id": request_id, "error": str(e)},
                exc_info=True
            )
            raise
    
    def _get_conversation_history(
        self, 
        session_id: str, 
        user_id: str
    ) -> ConversationHistory:
        """Get or create conversation history for a session."""
        if session_id not in self._sessions:
            self._sessions[session_id] = ConversationHistory(
                session_id=session_id,
                user_id=user_id
            )
            self._session_metadata[session_id] = {
                "started_at": datetime.utcnow(),
                "message_count": 0,
                "topics_discussed": set()
            }
        
        return self._sessions[session_id]
    
    async def _retrieve_memories(
        self, 
        user_id: str, 
        query: str
    ) -> List[RetrievedMemory]:
        """Retrieve relevant memories for the query."""
        try:
            memories = await self.memory_store.retrieve_memories(
                user_id=user_id,
                query=query,
                top_k=settings.PINECONE_TOP_K
            )
            
            logger.debug(
                f"Retrieved {len(memories)} memories for user {user_id}",
                extra={"user_id": user_id, "memories_count": len(memories)}
            )
            
            return memories
            
        except Exception as e:
            logger.error(f"Error retrieving memories: {e}")
            return []
    
    async def _process_emotion_context(
        self,
        provided_context: Optional[EmotionContext],
        message: str,
        session_id: str
    ) -> Optional[EmotionContext]:
        """Process and update emotion context."""
        # Use provided context if available
        if provided_context:
            self.emotion_manager.add_emotion_context(session_id, provided_context)
            return provided_context
        
        # Otherwise, get session summary
        return self.emotion_manager.get_session_emotion_summary(session_id)
    
    def _get_session_context(self, session_id: str) -> Dict[str, Any]:
        """Get session context metadata."""
        metadata = self._session_metadata.get(session_id, {})
        
        if metadata:
            duration = (datetime.utcnow() - metadata.get("started_at", datetime.utcnow()))
            return {
                "session_duration_minutes": duration.total_seconds() / 60,
                "message_count": metadata.get("message_count", 0),
                "topics_discussed": list(metadata.get("topics_discussed", set()))
            }
        
        return {}
    
    async def _store_memory_if_significant(
        self,
        user_id: str,
        message: str,
        emotion_context: Optional[EmotionContext]
    ):
        """Store message as memory if it contains significant information."""
        # Simple heuristic: store if message is substantial and contains personal info
        if len(message) < 20:
            return
        
        # Keywords that indicate significant information
        significant_keywords = [
            "feel", "think", "believe", "want", "need", "love", "hate",
            "worried", "excited", "scared", "happy", "sad", "angry",
            "family", "friend", "work", "job", "school", "relationship",
            "dream", "goal", "plan", "problem", "challenge"
        ]
        
        message_lower = message.lower()
        is_significant = any(kw in message_lower for kw in significant_keywords)
        
        if is_significant:
            from src.models import Memory
            
            memory = Memory(
                user_id=user_id,
                content=message[:500],  # Truncate if too long
                memory_type="conversation",
                emotion_tags=[emotion_context.primary_emotion] if emotion_context else [],
                importance_score=0.6 if emotion_context else 0.4
            )
            
            try:
                await self.memory_store.store_memory(memory)
                logger.debug(f"Stored memory for user {user_id}")
            except Exception as e:
                logger.warning(f"Failed to store memory: {e}")
    
    def get_session_history(self, session_id: str) -> Optional[ConversationHistory]:
        """Get conversation history for a session."""
        return self._sessions.get(session_id)
    
    def clear_session(self, session_id: str):
        """Clear a session's data."""
        if session_id in self._sessions:
            del self._sessions[session_id]
        if session_id in self._session_metadata:
            del self._session_metadata[session_id]
        self.emotion_manager.clear_session(session_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get service statistics."""
        return {
            "active_sessions": len(self._sessions),
            "claude_usage": self.claude_client.get_usage_stats(),
            "tts_usage": self.tts_service.client.get_usage_stats()
        }


# Singleton instance
_chat_service: Optional[ChatService] = None


def get_chat_service() -> ChatService:
    """Get singleton chat service."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
