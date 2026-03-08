"""
Tests for Prompt Assembler
"""

import pytest
from datetime import datetime

from src.prompt_assembler import (
    SystemPromptBuilder,
    PromptAssembler,
    AssembledPrompt
)
from src.models import (
    EmotionContext,
    EmotionType,
    EmotionData,
    RetrievedMemory,
    Memory,
    CrisisLevel
)


class TestSystemPromptBuilder:
    """Test SystemPromptBuilder functionality."""
    
    def test_build_basic_prompt(self):
        builder = SystemPromptBuilder()
        prompt = builder.build_system_prompt()
        
        assert "MindMate AI" in prompt
        assert "mental health companion" in prompt.lower()
    
    def test_build_prompt_with_user_name(self):
        builder = SystemPromptBuilder()
        prompt = builder.build_system_prompt(user_name="Alice")
        
        assert "Alice" in prompt
    
    def test_build_prompt_with_emotion_context(self):
        builder = SystemPromptBuilder()
        emotion_context = EmotionContext(
            primary_emotion=EmotionType.SADNESS,
            secondary_emotions=[],
            overall_valence=-0.6,
            overall_arousal=0.3,
            dominant_emotions=[]
        )
        
        prompt = builder.build_system_prompt(emotion_context=emotion_context)
        
        assert "sad" in prompt.lower() or "sadness" in prompt.lower()
        assert "valence" in prompt.lower() or "negative" in prompt.lower()
    
    def test_build_prompt_with_crisis(self):
        builder = SystemPromptBuilder()
        prompt = builder.build_system_prompt(crisis_level=CrisisLevel.HIGH)
        
        assert "CRISIS PROTOCOL" in prompt
        assert "988" in prompt
    
    def test_build_prompt_with_memories(self):
        builder = SystemPromptBuilder()
        
        memory = Memory(
            user_id="user123",
            content="User mentioned they love hiking on weekends",
            memory_type="preference"
        )
        retrieved = RetrievedMemory(
            memory=memory,
            relevance_score=0.85
        )
        
        prompt = builder.build_system_prompt(memories=[retrieved])
        
        assert "hiking" in prompt
        assert "Memories" in prompt


class TestPromptAssembler:
    """Test PromptAssembler functionality."""
    
    def test_assemble_chat_prompt_basic(self):
        assembler = PromptAssembler()
        
        result = assembler.assemble_chat_prompt(
            user_message="Hello",
            user_id="user123"
        )
        
        assert isinstance(result, AssembledPrompt)
        assert "MindMate AI" in result.system_prompt
        assert len(result.messages) == 1
        assert result.messages[0]["role"] == "user"
        assert result.context_info["user_id"] == "user123"
    
    def test_assemble_chat_prompt_with_history(self):
        assembler = PromptAssembler()
        
        from src.models import ConversationMessage
        history = [
            ConversationMessage(role="user", content="Hi"),
            ConversationMessage(role="assistant", content="Hello!"),
        ]
        
        result = assembler.assemble_chat_prompt(
            user_message="How are you?",
            user_id="user123",
            conversation_history=history
        )
        
        assert len(result.messages) == 3
        assert result.context_info["history_length"] == 2
    
    def test_assemble_memory_summary_prompt(self):
        assembler = PromptAssembler()
        
        conversation = "User: I'm feeling stressed. AI: I understand. User: Work is hard."
        prompt = assembler.assemble_memory_summary_prompt(
            conversation_text=conversation,
            user_id="user123"
        )
        
        assert "conversation" in prompt.lower()
        assert "stress" in prompt.lower()
        assert "summarize" in prompt.lower()


class TestEmotionGuidance:
    """Test emotion guidance generation."""
    
    def test_joy_emotion_guidance(self):
        builder = SystemPromptBuilder()
        emotion_context = EmotionContext(
            primary_emotion=EmotionType.JOY,
            secondary_emotions=[],
            overall_valence=0.8,
            overall_arousal=0.7,
            dominant_emotions=[]
        )
        
        guidance = builder._get_emotion_guidance(emotion_context)
        
        assert "happy" in guidance.lower() or "joy" in guidance.lower()
    
    def test_anxiety_emotion_guidance(self):
        builder = SystemPromptBuilder()
        emotion_context = EmotionContext(
            primary_emotion=EmotionType.ANXIETY,
            secondary_emotions=[],
            overall_valence=-0.5,
            overall_arousal=0.8,
            dominant_emotions=[]
        )
        
        guidance = builder._get_emotion_guidance(emotion_context)
        
        assert "anxious" in guidance.lower() or "anxiety" in guidance.lower()
