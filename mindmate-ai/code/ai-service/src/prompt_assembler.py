"""
MindMate AI - Prompt Assembler
Assemble system prompts with memory context, conversation history, and emotion context.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass

from config.settings import settings
from config.logging_config import logger
from src.models import (
    Memory,
    RetrievedMemory,
    EmotionContext,
    EmotionType,
    ConversationMessage,
    CrisisLevel
)


@dataclass
class AssembledPrompt:
    """Result of prompt assembly."""
    system_prompt: str
    messages: List[Dict[str, str]]
    context_info: Dict[str, Any]


class SystemPromptBuilder:
    """Build dynamic system prompts based on context."""
    
    BASE_PERSONA = """You are MindMate AI, a compassionate and supportive mental health companion. 
Your role is to provide emotional support, active listening, and gentle guidance to help users 
navigate their thoughts and feelings.

Core Principles:
- Be empathetic, non-judgmental, and supportive
- Listen actively and validate the user's feelings
- Ask thoughtful, open-ended questions
- Offer evidence-based coping strategies when appropriate
- Maintain appropriate boundaries - you are a supportive companion, not a replacement for professional therapy
- Never provide medical advice or diagnose conditions
- If someone is in crisis, guide them toward professional help and crisis resources

Communication Style:
- Warm, conversational, and authentic
- Use the user's name when appropriate
- Reference relevant memories to show continuity in your relationship
- Adapt your tone based on the user's emotional state
- Keep responses concise but meaningful (2-4 paragraphs typically)"""

    CRISIS_PERSONA_ADDENDUM = """

CRISIS PROTOCOL ACTIVE:
The user may be experiencing a mental health crisis. Your priorities are:
1. Express immediate concern and empathy
2. Encourage them to reach out to a trusted person (friend, family, counselor)
3. Provide crisis resources (988 Suicide & Crisis Lifeline, crisis text line)
4. Emphasize that help is available and they don't have to face this alone
5. Do NOT leave them without resources or support options

Crisis Resources to Share:
- 988 Suicide & Crisis Lifeline (Call or Text 988)
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"""

    def __init__(self):
        self.base_prompt = self.BASE_PERSONA
    
    def build_system_prompt(
        self,
        user_name: Optional[str] = None,
        emotion_context: Optional[EmotionContext] = None,
        memories: List[RetrievedMemory] = None,
        crisis_level: CrisisLevel = CrisisLevel.NONE,
        session_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Build a contextualized system prompt.
        
        Args:
            user_name: User's preferred name
            emotion_context: Current emotional state
            memories: Relevant retrieved memories
            crisis_level: Detected crisis level
            session_context: Additional session context
            
        Returns:
            Complete system prompt
        """
        prompt_parts = [self.base_prompt]
        
        # Add user personalization
        if user_name:
            prompt_parts.append(f"\n\nThe user's name is {user_name}.")
        
        # Add emotion context
        if emotion_context:
            emotion_guidance = self._get_emotion_guidance(emotion_context)
            prompt_parts.append(f"\n\nCurrent Emotional Context:\n{emotion_guidance}")
        
        # Add relevant memories
        if memories:
            memory_context = self._format_memories(memories)
            prompt_parts.append(f"\n\nRelevant Memories:\n{memory_context}")
        
        # Add session context
        if session_context:
            context_str = self._format_session_context(session_context)
            prompt_parts.append(f"\n\nSession Context:\n{context_str}")
        
        # Add crisis protocol if needed
        if crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]:
            prompt_parts.append(self.CRISIS_PERSONA_ADDENDUM)
        
        # Add response format instructions
        prompt_parts.append(self._get_response_format_instructions())
        
        return "\n".join(prompt_parts)
    
    def _get_emotion_guidance(self, emotion_context: EmotionContext) -> str:
        """Generate guidance based on emotional context."""
        guidance_parts = []
        
        primary = emotion_context.primary_emotion
        valence = emotion_context.overall_valence
        arousal = emotion_context.overall_arousal
        
        # Primary emotion guidance
        emotion_responses = {
            EmotionType.JOY: "The user seems happy. Celebrate with them and explore what's bringing them joy.",
            EmotionType.SADNESS: "The user seems sad. Offer empathy, validation, and gentle support. Don't rush to fix things.",
            EmotionType.ANGER: "The user seems frustrated or angry. Validate their feelings and help them process constructively.",
            EmotionType.FEAR: "The user seems anxious or fearful. Provide reassurance and help them ground in the present.",
            EmotionType.ANXIETY: "The user seems anxious. Help them breathe and focus on what's within their control.",
            EmotionType.SURPRISE: "The user seems surprised. Help them process this unexpected situation.",
            EmotionType.CONFUSION: "The user seems confused. Help clarify and provide gentle guidance.",
            EmotionType.EXCITEMENT: "The user seems excited. Share in their enthusiasm and energy.",
            EmotionType.NEUTRAL: "The user's emotional state is neutral. Be open and receptive to whatever they want to share.",
            EmotionType.DISGUST: "The user seems displeased. Help them process what they're reacting to."
        }
        
        guidance_parts.append(f"- Primary emotion detected: {primary.value}")
        guidance_parts.append(f"- {emotion_responses.get(primary, emotion_responses[EmotionType.NEUTRAL])}")
        
        # Valence guidance
        if valence < -0.5:
            guidance_parts.append("- The user is experiencing significant negative emotions. Prioritize validation and support.")
        elif valence > 0.5:
            guidance_parts.append("- The user is experiencing positive emotions. Reinforce and celebrate this.")
        
        # Arousal guidance
        if arousal > 0.7:
            guidance_parts.append("- High energy detected. Help them channel this energy constructively or calm if needed.")
        elif arousal < 0.3:
            guidance_parts.append("- Low energy detected. Be gentle and don't overwhelm them.")
        
        # Secondary emotions
        if emotion_context.secondary_emotions:
            secondary_names = [e.emotion.value for e in emotion_context.secondary_emotions[:2]]
            guidance_parts.append(f"- Also note: {', '.join(secondary_names)}")
        
        return "\n".join(guidance_parts)
    
    def _format_memories(self, memories: List[RetrievedMemory]) -> str:
        """Format retrieved memories for the prompt."""
        if not memories:
            return "No relevant memories found."
        
        memory_parts = []
        
        for i, rm in enumerate(memories[:5], 1):  # Limit to top 5
            memory = rm.memory
            relevance = rm.relevance_score
            
            memory_text = f"{i}. {memory.content}"
            
            # Add context if available
            if memory.memory_type != "conversation":
                memory_text += f" (Type: {memory.memory_type})"
            
            # Add emotion tags if relevant
            if memory.emotion_tags:
                memory_text += f" [Emotions: {', '.join(e.value for e in memory.emotion_tags)}]"
            
            memory_parts.append(memory_text)
        
        instructions = (
            "Use these memories naturally in your response to show continuity "
            "and demonstrate that you remember your conversations with the user. "
            "Don't force references - only mention memories that are genuinely relevant."
        )
        
        return instructions + "\n" + "\n".join(memory_parts)
    
    def _format_session_context(self, session_context: Dict[str, Any]) -> str:
        """Format session context information."""
        context_parts = []
        
        if "session_duration_minutes" in session_context:
            context_parts.append(f"- Session duration: {session_context['session_duration_minutes']} minutes")
        
        if "message_count" in session_context:
            context_parts.append(f"- Messages exchanged: {session_context['message_count']}")
        
        if "topics_discussed" in session_context:
            topics = session_context['topics_discussed']
            context_parts.append(f"- Topics discussed: {', '.join(topics)}")
        
        if "user_goals" in session_context:
            goals = session_context['user_goals']
            context_parts.append(f"- User's goals: {', '.join(goals)}")
        
        return "\n".join(context_parts) if context_parts else "No additional session context."
    
    def _get_response_format_instructions(self) -> str:
        """Get instructions for response format and special markers."""
        return """

Response Format Instructions:
1. Provide a natural, conversational response
2. You may suggest tasks or exercises using [TASK:type] markers at the end of your response
3. Available task types: mood_tracking, journaling, breathing_exercise, meditation, gratitude_practice, cognitive_reframing, behavioral_activation, sleep_hygiene, social_connection, professional_help
4. Example: [TASK:breathing_exercise] Suggests a breathing exercise
5. If you detect a crisis, include [CRISIS:level] where level is low, medium, high, or critical
6. Keep your response warm, supportive, and focused on the user's wellbeing"""


class PromptAssembler:
    """Assemble complete prompts for AI generation."""
    
    def __init__(self):
        self.system_builder = SystemPromptBuilder()
    
    def assemble_chat_prompt(
        self,
        user_message: str,
        user_id: str,
        conversation_history: List[ConversationMessage] = None,
        retrieved_memories: List[RetrievedMemory] = None,
        emotion_context: Optional[EmotionContext] = None,
        crisis_level: CrisisLevel = CrisisLevel.NONE,
        user_name: Optional[str] = None,
        session_context: Optional[Dict[str, Any]] = None
    ) -> AssembledPrompt:
        """
        Assemble a complete chat prompt with all context.
        
        Args:
            user_message: Current user message
            user_id: User identifier
            conversation_history: Previous conversation messages
            retrieved_memories: Relevant memories from vector search
            emotion_context: Current emotional context
            crisis_level: Detected crisis level
            user_name: User's preferred name
            session_context: Additional session context
            
        Returns:
            AssembledPrompt with system prompt and message list
        """
        # Build system prompt
        system_prompt = self.system_builder.build_system_prompt(
            user_name=user_name,
            emotion_context=emotion_context,
            memories=retrieved_memories,
            crisis_level=crisis_level,
            session_context=session_context
        )
        
        # Build message list
        messages = []
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Compile context info for logging/debugging
        context_info = {
            "user_id": user_id,
            "history_length": len(conversation_history) if conversation_history else 0,
            "memories_included": len(retrieved_memories) if retrieved_memories else 0,
            "primary_emotion": emotion_context.primary_emotion.value if emotion_context else None,
            "crisis_level": crisis_level.value,
            "system_prompt_length": len(system_prompt),
            "total_messages": len(messages)
        }
        
        logger.info(
            f"Assembled prompt for user {user_id}",
            extra=context_info
        )
        
        return AssembledPrompt(
            system_prompt=system_prompt,
            messages=messages,
            context_info=context_info
        )
    
    def assemble_memory_summary_prompt(
        self,
        conversation_text: str,
        user_id: str
    ) -> str:
        """
        Assemble a prompt for generating a memory summary.
        
        Args:
            conversation_text: Text of the conversation to summarize
            user_id: User identifier
            
        Returns:
            Prompt for memory extraction
        """
        return f"""Analyze the following conversation and extract key information to remember about the user.

Conversation:
{conversation_text}

Extract and summarize:
1. Key facts about the user (preferences, experiences, relationships)
2. Important events or situations mentioned
3. Emotional patterns or recurring themes
4. Goals or aspirations expressed
5. Anything that would be valuable to remember for future conversations

Format your response as a concise summary (2-4 sentences) focusing on what would be most helpful to remember."""


# Singleton instance
_prompt_assembler: Optional[PromptAssembler] = None


def get_prompt_assembler() -> PromptAssembler:
    """Get singleton prompt assembler."""
    global _prompt_assembler
    if _prompt_assembler is None:
        _prompt_assembler = PromptAssembler()
    return _prompt_assembler
