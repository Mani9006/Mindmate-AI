# MindMate AI - Claude API Integration Guide

## Overview

This document provides the complete technical specification for integrating Claude API as the therapy brain for MindMate AI. It covers system architecture, prompt engineering, session management, memory injection, emotion-aware responses, crisis detection, and token optimization strategies.

---

## 1. System Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MindMate AI System                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   User App   │  │  Hume AI     │  │   Claude API         │  │
│  │   (Mobile)   │  │  (Emotion)   │  │   (Therapy Brain)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                     │              │
│         └─────────────────┴─────────────────────┘              │
│                           │                                    │
│                    ┌──────▼──────┐                            │
│                    │  Backend    │                            │
│                    │  API Layer  │                            │
│                    └──────┬──────┘                            │
│                           │                                    │
│         ┌─────────────────┼─────────────────┐                 │
│         ▼                 ▼                 ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Session DB  │  │  Memory DB   │  │  Crisis DB   │        │
│  │  (Redis)     │  │  (Vector)    │  │  (PostgreSQL)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Claude API Configuration

```python
# claude_config.py
from anthropic import AsyncAnthropic
import os

class ClaudeConfig:
    """Configuration for Claude API integration"""
    
    # API Settings
    API_KEY = os.getenv("ANTHROPIC_API_KEY")
    MODEL = "claude-3-5-sonnet-20241022"  # Primary model
    FALLBACK_MODEL = "claude-3-haiku-20240307"  # Fallback for cost optimization
    
    # Context Window Management
    MAX_CONTEXT_TOKENS = 200_000  # Claude 3.5 Sonnet context limit
    RESERVED_SYSTEM_TOKENS = 8_000  # Reserved for system prompt
    RESERVED_MEMORY_TOKENS = 4_000  # Reserved for memory injection
    RESERVED_EMOTION_TOKENS = 1_000  # Reserved for emotion context
    AVAILABLE_CHAT_TOKENS = MAX_CONTEXT_TOKENS - RESERVED_SYSTEM_TOKENS - RESERVED_MEMORY_TOKENS - RESERVED_EMOTION_TOKENS
    
    # Response Settings
    MAX_RESPONSE_TOKENS = 4_096
    TEMPERATURE = 0.7  # Balanced creativity and consistency
    TOP_P = 0.9
    
    # Retry Configuration
    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # seconds
    
    # Timeout Settings
    REQUEST_TIMEOUT = 60  # seconds
    STREAM_TIMEOUT = 120  # seconds

# Initialize client
claude_client = AsyncAnthropic(api_key=ClaudeConfig.API_KEY)
```

---

## 2. System Prompt Architecture

### 2.1 Prompt Structure

The system prompt is composed of multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT STRUCTURE                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Base Identity & Role (800 tokens)                 │
│  Layer 2: Therapy Guidelines (1,500 tokens)                 │
│  Layer 3: Safety & Crisis Protocols (1,200 tokens)          │
│  Layer 4: Task & Challenge Framework (800 tokens)           │
│  Layer 5: Response Formatting (500 tokens)                  │
│  Layer 6: Memory Context (Injected dynamically)             │
│  Layer 7: Emotion Context (Injected dynamically)            │
│  Layer 8: Session History (Managed dynamically)             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Prompt Injection Points

```python
# prompt_builder.py
class PromptBuilder:
    """Builds complete prompts with all injection points"""
    
    def __init__(self):
        self.base_prompt_path = "/prompts/therapist_system_prompt.md"
        self.base_prompt = self._load_base_prompt()
    
    def build_system_prompt(
        self,
        user_id: str,
        memory_context: str = "",
        emotion_context: str = "",
        session_context: str = ""
    ) -> str:
        """Build complete system prompt with all contexts"""
        
        prompt_parts = [
            self.base_prompt,
            "\n\n---\n\n",
            "## ACTIVE CONTEXT\n\n",
        ]
        
        # Inject memory context
        if memory_context:
            prompt_parts.extend([
                "### Relevant Memories\n",
                memory_context,
                "\n\n"
            ])
        
        # Inject emotion context
        if emotion_context:
            prompt_parts.extend([
                "### Current Emotional State\n",
                emotion_context,
                "\n\n"
            ])
        
        # Inject session context
        if session_context:
            prompt_parts.extend([
                "### Session Progress\n",
                session_context,
                "\n\n"
            ])
        
        return "".join(prompt_parts)
```

---

## 3. Session History Management

### 3.1 Context Window Strategy

```python
# session_manager.py
from dataclasses import dataclass
from typing import List, Dict, Optional
import tiktoken

@dataclass
class Message:
    role: str  # "user" or "assistant"
    content: str
    timestamp: float
    emotion_data: Optional[Dict] = None
    token_count: int = 0

class SessionHistoryManager:
    """Manages conversation history within context window limits"""
    
    def __init__(self, max_tokens: int = 180_000):
        self.max_tokens = max_tokens
        self.encoding = tiktoken.encoding_for_model("claude-3-5-sonnet")
        self.messages: List[Message] = []
        self.summary: Optional[str] = None
        self.summary_token_count = 0
    
    def add_message(self, role: str, content: str, emotion_data: Optional[Dict] = None) -> Message:
        """Add a message to the session history"""
        token_count = self._count_tokens(content)
        
        message = Message(
            role=role,
            content=content,
            timestamp=time.time(),
            emotion_data=emotion_data,
            token_count=token_count
        )
        
        self.messages.append(message)
        self._manage_context_window()
        
        return message
    
    def _count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def _manage_context_window(self):
        """Ensure context window stays within limits"""
        total_tokens = self._calculate_total_tokens()
        
        while total_tokens > self.max_tokens and len(self.messages) > 2:
            # Remove oldest non-system message
            removed = self.messages.pop(0)
            total_tokens -= removed.token_count
            
            # If we've removed significant history, generate/update summary
            if len(self.messages) > 0 and len(self.messages) % 10 == 0:
                self._update_summary()
    
    def _calculate_total_tokens(self) -> int:
        """Calculate total tokens in current history"""
        return sum(msg.token_count for msg in self.messages) + self.summary_token_count
    
    def _update_summary(self):
        """Generate summary of older conversation"""
        # This would call Claude to generate a summary
        # For now, placeholder
        older_messages = self.messages[:len(self.messages)//2]
        self.summary = self._generate_conversation_summary(older_messages)
        self.summary_token_count = self._count_tokens(self.summary)
    
    def get_messages_for_api(self) -> List[Dict[str, str]]:
        """Get messages formatted for Claude API"""
        api_messages = []
        
        # Add summary as context if exists
        if self.summary:
            api_messages.append({
                "role": "assistant",
                "content": f"[Previous conversation summary: {self.summary}]"
            })
        
        # Add remaining messages
        for msg in self.messages:
            api_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        return api_messages
    
    def get_recent_context(self, n_messages: int = 5) -> str:
        """Get recent conversation context as string"""
        recent = self.messages[-n_messages:] if len(self.messages) >= n_messages else self.messages
        
        context_parts = []
        for msg in recent:
            prefix = "User" if msg.role == "user" else "Assistant"
            context_parts.append(f"{prefix}: {msg.content[:200]}...")
        
        return "\n".join(context_parts)
```

### 3.2 Conversation Summarization

```python
# summarization.py
class ConversationSummarizer:
    """Summarizes conversation history to preserve context"""
    
    SUMMARY_PROMPT = """Summarize the following therapy conversation concisely. 
Focus on:
1. Key topics discussed
2. User's expressed emotions and concerns
3. Any insights or breakthroughs
4. Assigned tasks or homework
5. Overall session progress

Keep the summary under 300 words."""
    
    async def generate_summary(self, messages: List[Message]) -> str:
        """Generate summary of conversation messages"""
        conversation_text = self._format_messages(messages)
        
        response = await claude_client.messages.create(
            model=ClaudeConfig.FALLBACK_MODEL,  # Use cheaper model for summarization
            max_tokens=500,
            temperature=0.3,
            system=self.SUMMARY_PROMPT,
            messages=[{"role": "user", "content": conversation_text}]
        )
        
        return response.content[0].text
    
    def _format_messages(self, messages: List[Message]) -> str:
        """Format messages for summarization"""
        parts = []
        for msg in messages:
            role_label = "User" if msg.role == "user" else "Therapist"
            parts.append(f"{role_label}: {msg.content}")
        return "\n\n".join(parts)
```

---

## 4. Memory Injection System

### 4.1 Memory Architecture

```python
# memory_system.py
from typing import List, Dict, Optional
import numpy as np
from datetime import datetime, timedelta

@dataclass
class Memory:
    id: str
    user_id: str
    content: str
    category: str  # "fact", "insight", "preference", "goal", "trigger", "coping_strategy"
    importance: float  # 0.0 to 1.0
    emotional_valence: float  # -1.0 (negative) to 1.0 (positive)
    created_at: datetime
    last_accessed: datetime
    access_count: int
    embedding: Optional[List[float]] = None
    source_session_id: Optional[str] = None

class MemoryRetriever:
    """Retrieves and formats memories for prompt injection"""
    
    # Memory categories and their priority weights
    CATEGORY_PRIORITIES = {
        "crisis_indicator": 1.0,      # Highest priority - safety critical
        "goal": 0.9,                   # User's stated goals
        "coping_strategy": 0.85,       # What works for the user
        "trigger": 0.8,                # Things to be aware of
        "insight": 0.75,               # Therapeutic insights
        "preference": 0.6,             # User preferences
        "fact": 0.5,                   # General information
    }
    
    def __init__(self, vector_db_client):
        self.vector_db = vector_db_client
        self.max_memories = 10
        self.max_tokens = 4000
    
    async def get_relevant_memories(
        self,
        user_id: str,
        current_message: str,
        emotion_context: Optional[Dict] = None
    ) -> str:
        """Retrieve and format relevant memories for injection"""
        
        # Get query embedding
        query_embedding = await self._get_embedding(current_message)
        
        # Retrieve candidate memories
        candidates = await self._query_vector_db(user_id, query_embedding, top_k=20)
        
        # Score and rank memories
        scored_memories = self._score_memories(
            candidates, 
            query_embedding,
            emotion_context
        )
        
        # Select top memories within token budget
        selected_memories = self._select_memories(scored_memories)
        
        # Format for prompt injection
        return self._format_memories(selected_memories)
    
    def _score_memories(
        self,
        memories: List[Memory],
        query_embedding: List[float],
        emotion_context: Optional[Dict]
    ) -> List[tuple]:
        """Score memories based on multiple factors"""
        scored = []
        
        for memory in memories:
            score = 0.0
            
            # Semantic similarity (0-1)
            similarity = self._cosine_similarity(query_embedding, memory.embedding or [])
            score += similarity * 0.3
            
            # Category priority (0-1)
            score += self.CATEGORY_PRIORITIES.get(memory.category, 0.5) * 0.25
            
            # Importance (0-1)
            score += memory.importance * 0.2
            
            # Recency decay (0-1, higher for recent memories)
            days_old = (datetime.now() - memory.created_at).days
            recency = max(0, 1 - (days_old / 30))  # Decay over 30 days
            score += recency * 0.15
            
            # Access frequency (0-1)
            access_score = min(1.0, memory.access_count / 10)
            score += access_score * 0.1
            
            scored.append((memory, score))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored
    
    def _select_memories(self, scored_memories: List[tuple]) -> List[Memory]:
        """Select memories within token budget"""
        selected = []
        total_tokens = 0
        
        for memory, score in scored_memories:
            memory_tokens = len(memory.content.split()) * 1.3  # Rough estimate
            
            if total_tokens + memory_tokens > self.max_tokens:
                break
            
            if len(selected) >= self.max_memories:
                break
            
            selected.append(memory)
            total_tokens += memory_tokens
        
        return selected
    
    def _format_memories(self, memories: List[Memory]) -> str:
        """Format memories for prompt injection"""
        if not memories:
            return ""
        
        sections = {
            "crisis_indicator": [],
            "goal": [],
            "coping_strategy": [],
            "trigger": [],
            "insight": [],
            "preference": [],
            "fact": [],
        }
        
        for memory in memories:
            sections[memory.category].append(memory.content)
        
        formatted_parts = []
        
        category_labels = {
            "crisis_indicator": "⚠️ Important Safety Information",
            "goal": "User's Goals",
            "coping_strategy": "Effective Coping Strategies",
            "trigger": "Known Triggers",
            "insight": "Key Insights",
            "preference": "User Preferences",
            "fact": "Relevant Information",
        }
        
        for category, items in sections.items():
            if items:
                formatted_parts.append(f"**{category_labels[category]}:**")
                for item in items:
                    formatted_parts.append(f"- {item}")
                formatted_parts.append("")
        
        return "\n".join(formatted_parts)
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not a or not b:
            return 0.0
        
        a_np = np.array(a)
        b_np = np.array(b)
        
        return np.dot(a_np, b_np) / (np.linalg.norm(a_np) * np.linalg.norm(b_np))
```

### 4.2 Memory Extraction from Conversations

```python
# memory_extraction.py
class MemoryExtractor:
    """Extracts memories from conversation for long-term storage"""
    
    EXTRACTION_PROMPT = """Analyze this therapy conversation and extract important information about the user that should be remembered for future sessions.

Extract information in these categories:
1. FACTS: Objective information about the user's life, situation, relationships
2. INSIGHTS: Therapeutic insights, realizations, or breakthroughs
3. GOALS: Stated goals, aspirations, or things they want to work on
4. TRIGGERS: Things that cause distress, anxiety, or negative emotions
5. COPING_STRATEGIES: Techniques or approaches that have helped
6. PREFERENCES: Communication preferences, topics to avoid/embrace

For each item, provide:
- Category
- Content (concise, factual statement)
- Importance (1-10)
- Emotional valence (-1 to +1)

Format as JSON array."""
    
    async def extract_memories(
        self,
        session_messages: List[Message],
        user_id: str
    ) -> List[Memory]:
        """Extract memories from a session"""
        
        conversation = self._format_for_extraction(session_messages)
        
        response = await claude_client.messages.create(
            model=ClaudeConfig.FALLBACK_MODEL,
            max_tokens=2000,
            temperature=0.3,
            system=self.EXTRACTION_PROMPT,
            messages=[{"role": "user", "content": conversation}]
        )
        
        # Parse JSON response
        try:
            extracted = json.loads(response.content[0].text)
            memories = []
            
            for item in extracted:
                memory = Memory(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    content=item["content"],
                    category=item["category"].lower(),
                    importance=item["importance"] / 10,
                    emotional_valence=item["emotional_valence"],
                    created_at=datetime.now(),
                    last_accessed=datetime.now(),
                    access_count=0
                )
                memories.append(memory)
            
            return memories
            
        except json.JSONDecodeError:
            # Log error and return empty list
            logger.error("Failed to parse memory extraction response")
            return []
```

---

## 5. Emotion-Aware Prompt Modification

### 5.1 Hume AI Integration

```python
# emotion_integration.py
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class EmotionalState(Enum):
    CALM = "calm"
    ANXIOUS = "anxious"
    SAD = "sad"
    ANGRY = "angry"
    HOPEFUL = "hopeful"
    DISTRESSED = "distressed"
    CONFUSED = "confused"
    GRATEFUL = "grateful"

@dataclass
class EmotionData:
    primary_emotion: str
    secondary_emotions: List[str]
    intensity: float  # 0.0 to 1.0
    valence: float  # -1.0 (negative) to 1.0 (positive)
    arousal: float  # 0.0 (low energy) to 1.0 (high energy)
    confidence: float
    timestamp: float
    prosody_features: Optional[Dict] = None

class EmotionContextBuilder:
    """Builds emotion context for prompt modification"""
    
    # Emotion-specific response modifiers
    EMOTION_MODIFIERS = {
        "distressed": {
            "tone": "gentle, grounding, and stabilizing",
            "technique": "Use grounding techniques, validate feelings, offer immediate support",
            "pace": "slower, more deliberate",
            "validation": "strong and immediate",
        },
        "anxious": {
            "tone": "calming, reassuring, and structured",
            "technique": "Use breathing prompts, break down concerns, provide structure",
            "pace": "measured and steady",
            "validation": "acknowledge worry without reinforcing it",
        },
        "sad": {
            "tone": "warm, compassionate, and patient",
            "technique": "Allow space for sadness, gentle encouragement, normalize feelings",
            "pace": "unhurried, giving time",
            "validation": "deep empathy and understanding",
        },
        "angry": {
            "tone": "neutral, non-defensive, and accepting",
            "technique": "Acknowledge anger, explore underlying needs, offer perspective",
            "pace": "steady, not rushed",
            "validation": "accept anger as valid without escalating",
        },
        "hopeful": {
            "tone": "encouraging and supportive",
            "technique": "Reinforce positive momentum, build on strengths",
            "pace": "energetic but grounded",
            "validation": "celebrate progress",
        },
        "calm": {
            "tone": "warm and conversational",
            "technique": "Normal therapeutic dialogue, deeper exploration",
            "pace": "natural flow",
            "validation": "steady and consistent",
        },
    }
    
    def build_emotion_context(self, emotion_data: EmotionData) -> str:
        """Build emotion context string for prompt injection"""
        
        primary = emotion_data.primary_emotion.lower()
        modifiers = self.EMOTION_MODIFIERS.get(primary, self.EMOTION_MODIFIERS["calm"])
        
        context_parts = [
            f"**Current Emotional State:** {emotion_data.primary_emotion}",
            f"**Intensity:** {self._format_intensity(emotion_data.intensity)}",
            f"**Energy Level:** {self._format_arousal(emotion_data.arousal)}",
            "",
            "**Response Guidelines:**",
            f"- Tone: {modifiers['tone']}",
            f"- Technique: {modifiers['technique']}",
            f"- Pace: {modifiers['pace']}",
            f"- Validation approach: {modifiers['validation']}",
        ]
        
        # Add secondary emotions if significant
        if emotion_data.secondary_emotions:
            context_parts.extend([
                "",
                f"**Also present:** {', '.join(emotion_data.secondary_emotions[:3])}"
            ])
        
        # Add intensity-specific guidance
        if emotion_data.intensity > 0.8:
            context_parts.append("\n⚠️ **High emotional intensity detected** - Prioritize stabilization")
        
        return "\n".join(context_parts)
    
    def _format_intensity(self, intensity: float) -> str:
        """Format intensity for human reading"""
        if intensity > 0.8:
            return "Very High"
        elif intensity > 0.6:
            return "High"
        elif intensity > 0.4:
            return "Moderate"
        elif intensity > 0.2:
            return "Low"
        return "Minimal"
    
    def _format_arousal(self, arousal: float) -> str:
        """Format arousal for human reading"""
        if arousal > 0.7:
            return "High (energized/agitated)"
        elif arousal > 0.4:
            return "Moderate"
        return "Low (calm/tired)"
    
    def get_response_modification(self, emotion_data: EmotionData) -> Dict[str, str]:
        """Get specific modifications for response generation"""
        primary = emotion_data.primary_emotion.lower()
        return self.EMOTION_MODIFIERS.get(primary, self.EMOTION_MODIFIERS["calm"])
```

### 5.2 Real-time Emotion Processing

```python
# emotion_processor.py
class EmotionProcessor:
    """Processes real-time emotion data from Hume AI"""
    
    def __init__(self):
        self.emotion_history: List[EmotionData] = []
        self.max_history = 10
        self.trend_threshold = 0.2
    
    async def process_hume_data(self, hume_response: Dict) -> EmotionData:
        """Process raw Hume AI response into structured emotion data"""
        
        # Extract top emotions
        emotions = hume_response.get("emotions", [])
        
        if not emotions:
            return EmotionData(
                primary_emotion="unknown",
                secondary_emotions=[],
                intensity=0.5,
                valence=0.0,
                arousal=0.5,
                confidence=0.0,
                timestamp=time.time()
            )
        
        # Sort by confidence
        emotions.sort(key=lambda x: x["score"], reverse=True)
        
        # Map Hume emotions to our categories
        primary = self._map_hume_emotion(emotions[0]["name"])
        secondary = [self._map_hume_emotion(e["name"]) for e in emotions[1:4]]
        
        # Calculate derived metrics
        valence = self._calculate_valence(emotions)
        arousal = self._calculate_arousal(emotions)
        
        emotion_data = EmotionData(
            primary_emotion=primary,
            secondary_emotions=secondary,
            intensity=emotions[0]["score"],
            valence=valence,
            arousal=arousal,
            confidence=emotions[0]["score"],
            timestamp=time.time(),
            prosody_features=hume_response.get("prosody")
        )
        
        # Update history
        self.emotion_history.append(emotion_data)
        if len(self.emotion_history) > self.max_history:
            self.emotion_history.pop(0)
        
        return emotion_data
    
    def detect_emotion_shift(self) -> Optional[str]:
        """Detect significant emotion changes"""
        if len(self.emotion_history) < 3:
            return None
        
        recent = self.emotion_history[-3:]
        older = self.emotion_history[-6:-3] if len(self.emotion_history) >= 6 else self.emotion_history[:3]
        
        # Check for primary emotion change
        recent_primary = [e.primary_emotion for e in recent]
        older_primary = [e.primary_emotion for e in older]
        
        if recent_primary[-1] != older_primary[-1]:
            return f"Emotion shifted from {older_primary[-1]} to {recent_primary[-1]}"
        
        # Check for intensity change
        recent_intensity = sum(e.intensity for e in recent) / len(recent)
        older_intensity = sum(e.intensity for e in older) / len(older)
        
        if abs(recent_intensity - older_intensity) > self.trend_threshold:
            direction = "increased" if recent_intensity > older_intensity else "decreased"
            return f"Emotional intensity has {direction}"
        
        return None
    
    def _map_hume_emotion(self, hume_emotion: str) -> str:
        """Map Hume emotion names to our categories"""
        mapping = {
            "anxiety": "anxious",
            "fear": "anxious",
            "worry": "anxious",
            "sadness": "sad",
            "grief": "sad",
            "melancholy": "sad",
            "anger": "angry",
            "frustration": "angry",
            "irritation": "angry",
            "joy": "hopeful",
            "hope": "hopeful",
            "optimism": "hopeful",
            "calm": "calm",
            "peace": "calm",
            "contentment": "calm",
            "confusion": "confused",
            "gratitude": "grateful",
            "distress": "distressed",
            "overwhelm": "distressed",
        }
        return mapping.get(hume_emotion.lower(), "calm")
    
    def _calculate_valence(self, emotions: List[Dict]) -> float:
        """Calculate overall emotional valence"""
        positive = ["joy", "hope", "gratitude", "contentment", "optimism", "calm"]
        negative = ["sadness", "anger", "fear", "anxiety", "distress", "frustration"]
        
        valence = 0.0
        for emotion in emotions:
            name = emotion["name"].lower()
            score = emotion["score"]
            if name in positive:
                valence += score
            elif name in negative:
                valence -= score
        
        return max(-1.0, min(1.0, valence))
    
    def _calculate_arousal(self, emotions: List[Dict]) -> float:
        """Calculate overall arousal level"""
        high_arousal = ["anger", "anxiety", "fear", "excitement", "joy"]
        low_arousal = ["sadness", "calm", "fatigue", "boredom"]
        
        arousal = 0.5  # Default neutral
        for emotion in emotions:
            name = emotion["name"].lower()
            score = emotion["score"]
            if name in high_arousal:
                arousal += score * 0.5
            elif name in low_arousal:
                arousal -= score * 0.5
        
        return max(0.0, min(1.0, arousal))
```

---

## 6. Crisis Detection System

### 6.1 Crisis Detection from AI Responses

```python
# crisis_detection.py
from typing import Dict, List, Optional
from enum import Enum
import re

class CrisisLevel(Enum):
    NONE = "none"
    LOW = "low"           # Concerning but not immediate
    MODERATE = "moderate"  # Needs attention
    HIGH = "high"         # Immediate intervention needed
    CRITICAL = "critical"  # Emergency situation

class CrisisDetector:
    """Detects crisis indicators from user messages and AI responses"""
    
    # Crisis indicator patterns
    SUICIDE_KEYWORDS = [
        r"\bkill\s+(myself|me)\b",
        r"\bsuicid\w*\b",
        r"\bwant\s+to\s+die\b",
        r"\bend\s+(my\s+)?life\b",
        r"\bnot\s+worth\s+living\b",
        r"\bbetter\s+off\s+dead\b",
        r"\bhurt\s+myself\b",
        r"\bself[-\s]?harm\b",
        r"\bcut\s+myself\b",
        r"\boverdose\b",
    ]
    
    CRISIS_KEYWORDS = [
        r"\bcan\'t\s+go\s+on\b",
        r"\bno\s+point\s+in\s+living\b",
        r"\bwant\s+to\s+disappear\b",
        r"\bfeel\s+hopeless\b",
        r"\bnothing\s+matters\b",
        r"\bcan\'t\s+take\s+it\s+anymore\b",
        r"\bgiving\s+up\b",
        r"\bdone\s+with\s+everything\b",
    ]
    
    VIOLENCE_KEYWORDS = [
        r"\bwant\s+to\s+hurt\s+someone\b",
        r"\bgoing\s+to\s+kill\b",
        r"\bviolent\s+thoughts\b",
        r"\blose\s+control\s+and\s+hurt\b",
    ]
    
    def __init__(self):
        self.suicide_patterns = [re.compile(p, re.IGNORECASE) for p in self.SUICIDE_KEYWORDS]
        self.crisis_patterns = [re.compile(p, re.IGNORECASE) for p in self.CRISIS_KEYWORDS]
        self.violence_patterns = [re.compile(p, re.IGNORECASE) for p in self.VIOLENCE_KEYWORDS]
    
    def analyze_message(self, message: str, emotion_data: Optional[EmotionData] = None) -> Dict:
        """Analyze a user message for crisis indicators"""
        
        crisis_indicators = []
        crisis_level = CrisisLevel.NONE
        
        # Check for suicide indicators
        for pattern in self.suicide_patterns:
            if pattern.search(message):
                crisis_indicators.append({
                    "type": "suicide_ideation",
                    "pattern": pattern.pattern,
                    "severity": "critical"
                })
                crisis_level = CrisisLevel.CRITICAL
        
        # Check for general crisis indicators
        for pattern in self.crisis_patterns:
            if pattern.search(message):
                crisis_indicators.append({
                    "type": "crisis_language",
                    "pattern": pattern.pattern,
                    "severity": "high"
                })
                if crisis_level.value < CrisisLevel.HIGH.value:
                    crisis_level = CrisisLevel.HIGH
        
        # Check for violence indicators
        for pattern in self.violence_patterns:
            if pattern.search(message):
                crisis_indicators.append({
                    "type": "violence_risk",
                    "pattern": pattern.pattern,
                    "severity": "critical"
                })
                crisis_level = CrisisLevel.CRITICAL
        
        # Factor in emotion data
        if emotion_data:
            emotion_crisis = self._assess_emotion_crisis(emotion_data)
            if emotion_crisis:
                crisis_indicators.append(emotion_crisis)
                if crisis_level.value < CrisisLevel.MODERATE.value:
                    crisis_level = CrisisLevel.MODERATE
        
        return {
            "crisis_level": crisis_level.value,
            "indicators": crisis_indicators,
            "requires_intervention": crisis_level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL],
            "requires_escalation": crisis_level == CrisisLevel.CRITICAL,
        }
    
    def _assess_emotion_crisis(self, emotion_data: EmotionData) -> Optional[Dict]:
        """Assess if emotional state indicates crisis"""
        
        # High distress with high intensity
        if emotion_data.primary_emotion == "distressed" and emotion_data.intensity > 0.8:
            return {
                "type": "emotional_distress",
                "details": f"High distress detected (intensity: {emotion_data.intensity:.2f})",
                "severity": "high"
            }
        
        # Very low valence with high arousal (agitated despair)
        if emotion_data.valence < -0.7 and emotion_data.arousal > 0.7:
            return {
                "type": "agitated_despair",
                "details": f"Agitated despair pattern (valence: {emotion_data.valence:.2f}, arousal: {emotion_data.arousal:.2f})",
                "severity": "high"
            }
        
        return None
    
    def get_crisis_response_prompt(self, crisis_level: CrisisLevel) -> str:
        """Get crisis-specific prompt addition"""
        
        prompts = {
            CrisisLevel.CRITICAL: """
⚠️ CRITICAL SAFETY ALERT ⚠️

The user may be in immediate danger. Your response MUST:
1. Express immediate concern and care
2. Ask directly about safety ("Are you safe right now?")
3. Provide crisis resources (988 Suicide & Crisis Lifeline)
4. Encourage reaching out to someone immediately
5. Stay with them and keep the conversation going
6. DO NOT end the conversation abruptly

Crisis Resources to provide:
- 988 Suicide & Crisis Lifeline (call or text 988)
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 911 (if immediate danger)
""",
            CrisisLevel.HIGH: """
⚠️ ELEVATED CONCERN

The user is expressing significant distress. Your response should:
1. Validate their pain and struggles
2. Ask about their safety gently
3. Explore what support they have available
4. Offer to help them connect with professional help
5. Provide appropriate resources
6. Check in about immediate safety
""",
            CrisisLevel.MODERATE: """
Note: User showing signs of distress.

Your response should:
1. Acknowledge their difficult feelings
2. Explore coping strategies that have helped before
3. Gently assess if they need additional support
4. Offer to discuss professional resources if appropriate
""",
        }
        
        return prompts.get(crisis_level, "")
```

### 6.2 Crisis Response Protocol

```python
# crisis_protocol.py
class CrisisResponseProtocol:
    """Handles crisis response workflow"""
    
    CRISIS_RESOURCES = {
        "suicide_lifeline": {
            "name": "988 Suicide & Crisis Lifeline",
            "phone": "988",
            "text": "988",
            "chat": "988lifeline.org",
            "available": "24/7, free and confidential"
        },
        "crisis_text_line": {
            "name": "Crisis Text Line",
            "text": "HOME to 741741",
            "available": "24/7, free"
        },
        "emergency": {
            "name": "Emergency Services",
            "phone": "911",
            "when": "If you or someone else is in immediate danger"
        },
        "samhsa": {
            "name": "SAMHSA National Helpline",
            "phone": "1-800-662-4357",
            "available": "24/7, free, confidential treatment referral"
        }
    }
    
    async def handle_crisis(
        self,
        user_id: str,
        crisis_analysis: Dict,
        session_id: str
    ) -> Dict:
        """Execute crisis response protocol"""
        
        crisis_level = CrisisLevel(crisis_analysis["crisis_level"])
        
        response_actions = {
            "crisis_level": crisis_level.value,
            "actions_taken": [],
            "notifications_sent": [],
            "resources_provided": [],
        }
        
        # Log crisis event
        await self._log_crisis_event(user_id, crisis_analysis, session_id)
        
        if crisis_level == CrisisLevel.CRITICAL:
            # Immediate actions for critical crisis
            response_actions["actions_taken"].append("critical_protocol_activated")
            
            # Notify crisis team
            await self._notify_crisis_team(user_id, crisis_analysis)
            response_actions["notifications_sent"].append("crisis_team")
            
            # Flag user account for monitoring
            await self._flag_user_for_monitoring(user_id)
            response_actions["actions_taken"].append("user_flagged_for_monitoring")
            
            # Provide all crisis resources
            response_actions["resources_provided"] = list(self.CRISIS_RESOURCES.keys())
            
        elif crisis_level == CrisisLevel.HIGH:
            # Actions for high concern
            response_actions["actions_taken"].append("high_concern_protocol")
            
            # Notify supervisor
            await self._notify_supervisor(user_id, crisis_analysis)
            response_actions["notifications_sent"].append("supervisor")
            
            # Provide primary resources
            response_actions["resources_provided"] = [
                "suicide_lifeline",
                "crisis_text_line"
            ]
            
        elif crisis_level == CrisisLevel.MODERATE:
            # Actions for moderate concern
            response_actions["actions_taken"].append("moderate_concern_noted")
            
            # Log for review
            await self._schedule_wellness_check(user_id)
            response_actions["actions_taken"].append("wellness_check_scheduled")
        
        return response_actions
    
    def format_crisis_resources(self, resource_keys: List[str]) -> str:
        """Format crisis resources for user display"""
        
        parts = ["\n\n**Crisis Support Resources:**\n"]
        
        for key in resource_keys:
            resource = self.CRISIS_RESOURCES.get(key)
            if resource:
                parts.append(f"\n**{resource['name']}**")
                if "phone" in resource:
                    parts.append(f"Call: {resource['phone']}")
                if "text" in resource:
                    parts.append(f"Text: {resource['text']}")
                if "chat" in resource:
                    parts.append(f"Chat: {resource['chat']}")
                if "available" in resource:
                    parts.append(f"Available: {resource['available']}")
        
        return "\n".join(parts)
```

---

## 7. Task & Challenge Assignment

### 7.1 Task Framework

```python
# task_assignment.py
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum

class TaskType(Enum):
    JOURNALING = "journaling"
    BREATHING_EXERCISE = "breathing_exercise"
    MEDITATION = "meditation"
    GRATITUDE_PRACTICE = "gratitude_practice"
    COGNITIVE_REFRAMING = "cognitive_reframing"
    BEHAVIORAL_ACTIVATION = "behavioral_activation"
    EXPOSURE = "exposure"
    SLEEP_HYGIENE = "sleep_hygiene"
    SOCIAL_CONNECTION = "social_connection"
    SELF_CARE = "self_care"
    MINDFULNESS = "mindfulness"

class TaskDifficulty(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

@dataclass
class Task:
    id: str
    user_id: str
    type: TaskType
    title: str
    description: str
    instructions: List[str]
    difficulty: TaskDifficulty
    estimated_duration: int  # minutes
    frequency: str  # "daily", "as_needed", "weekly"
    rationale: str  # Why this task is being assigned
    success_criteria: List[str]
    created_at: datetime
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    related_session_id: Optional[str] = None

class TaskAssignmentSystem:
    """Manages therapeutic task and challenge assignments"""
    
    TASK_TEMPLATES = {
        TaskType.JOURNALING: {
            "title_template": "Journal About {topic}",
            "description_template": "Take 10-15 minutes to write about your thoughts and feelings regarding {topic}.",
            "instructions": [
                "Find a quiet, comfortable space",
                "Set a timer for 10-15 minutes",
                "Write freely without editing yourself",
                "Focus on your emotions and thoughts",
                "Review what you wrote and note any insights"
            ],
            "difficulty": TaskDifficulty.BEGINNER,
            "duration": 15,
        },
        TaskType.BREATHING_EXERCISE: {
            "title_template": "{technique} Breathing Practice",
            "description_template": "Practice {technique} breathing to help manage {benefit}.",
            "instructions": [
                "Find a comfortable seated position",
                "Close your eyes or soften your gaze",
                "Follow the breathing pattern: {pattern}",
                "Continue for {duration} minutes",
                "Notice how you feel afterward"
            ],
            "difficulty": TaskDifficulty.BEGINNER,
            "duration": 5,
        },
        TaskType.GRATITUDE_PRACTICE: {
            "title_template": "Daily Gratitude Reflection",
            "description_template": "Cultivate positive focus by identifying things you're grateful for.",
            "instructions": [
                "Set aside 5 minutes in the morning or evening",
                "Write down 3 things you're grateful for",
                "Include why each thing matters to you",
                "Notice how this practice affects your mood"
            ],
            "difficulty": TaskDifficulty.BEGINNER,
            "duration": 5,
        },
        TaskType.COGNITIVE_REFRAMING: {
            "title_template": "Challenge Negative Thoughts",
            "description_template": "Practice identifying and reframing unhelpful thought patterns.",
            "instructions": [
                "Notice when you have a negative thought",
                "Write down the thought",
                "Ask: Is this thought accurate? Helpful?",
                "Consider alternative perspectives",
                "Write a more balanced thought"
            ],
            "difficulty": TaskDifficulty.INTERMEDIATE,
            "duration": 10,
        },
        TaskType.BEHAVIORAL_ACTIVATION: {
            "title_template": "Engage in {activity}",
            "description_template": "Schedule and complete a pleasurable or meaningful activity.",
            "instructions": [
                "Choose an activity you used to enjoy or want to try",
                "Schedule a specific time for it",
                "Complete the activity",
                "Rate your mood before and after",
                "Note what you noticed"
            ],
            "difficulty": TaskDifficulty.INTERMEDIATE,
            "duration": 30,
        },
    }
    
    def __init__(self):
        self.active_tasks: Dict[str, List[Task]] = {}
    
    async def assign_task(
        self,
        user_id: str,
        task_type: TaskType,
        context: Dict,
        session_id: str
    ) -> Task:
        """Assign a new therapeutic task"""
        
        template = self.TASK_TEMPLATES.get(task_type)
        if not template:
            raise ValueError(f"Unknown task type: {task_type}")
        
        # Personalize task based on context
        task = self._personalize_task(template, context, user_id, task_type, session_id)
        
        # Store task
        if user_id not in self.active_tasks:
            self.active_tasks[user_id] = []
        self.active_tasks[user_id].append(task)
        
        return task
    
    def _personalize_task(
        self,
        template: Dict,
        context: Dict,
        user_id: str,
        task_type: TaskType,
        session_id: str
    ) -> Task:
        """Personalize a task template for the user"""
        
        # Format title and description with context
        title = template["title_template"].format(**context)
        description = template["description_template"].format(**context)
        
        # Personalize instructions
        instructions = [
            instr.format(**context) for instr in template["instructions"]
        ]
        
        # Generate rationale based on context
        rationale = self._generate_rationale(task_type, context)
        
        return Task(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=task_type,
            title=title,
            description=description,
            instructions=instructions,
            difficulty=template["difficulty"],
            estimated_duration=template["duration"],
            frequency=context.get("frequency", "as_needed"),
            rationale=rationale,
            success_criteria=context.get("success_criteria", ["Complete the task"]),
            created_at=datetime.now(),
            due_date=datetime.now() + timedelta(days=context.get("due_days", 7)),
            related_session_id=session_id
        )
    
    def _generate_rationale(self, task_type: TaskType, context: Dict) -> str:
        """Generate rationale for why this task is being assigned"""
        
        rationales = {
            TaskType.JOURNALING: "Journaling helps process emotions and gain clarity about your experiences.",
            TaskType.BREATHING_EXERCISE: "Breathing exercises activate your parasympathetic nervous system, promoting calm.",
            TaskType.GRATITUDE_PRACTICE: "Gratitude practice shifts focus toward positive aspects of life, improving mood over time.",
            TaskType.COGNITIVE_REFRAMING: "Challenging negative thoughts helps develop more balanced thinking patterns.",
            TaskType.BEHAVIORAL_ACTIVATION: "Engaging in activities counteracts the withdrawal common in depression and anxiety.",
            TaskType.MEDITATION: "Meditation builds awareness and helps you respond to stress more skillfully.",
            TaskType.MINDFULNESS: "Mindfulness helps you stay present and reduces rumination about past or future.",
        }
        
        base_rationale = rationales.get(task_type, "This task supports your therapeutic goals.")
        
        # Add personalized context if available
        if "user_goal" in context:
            base_rationale += f" This directly supports your goal of {context['user_goal']}."
        
        return base_rationale
    
    def format_task_for_prompt(self, task: Task) -> str:
        """Format a task for inclusion in system prompt"""
        
        return f"""
**Assigned Task: {task.title}**

{task.description}

**Instructions:**
{chr(10).join(f"{i+1}. {instr}" for i, instr in enumerate(task.instructions))}

**Why this helps:** {task.rationale}

**Estimated time:** {task.estimated_duration} minutes
**Due:** {task.due_date.strftime('%Y-%m-%d') if task.due_date else 'When ready'}
"""
    
    async def get_active_tasks_prompt_section(self, user_id: str) -> str:
        """Get formatted section of active tasks for prompt"""
        
        tasks = self.active_tasks.get(user_id, [])
        if not tasks:
            return ""
        
        incomplete = [t for t in tasks if not t.completed_at]
        if not incomplete:
            return ""
        
        parts = ["\n## Active Tasks\n"]
        for task in incomplete[:3]:  # Limit to 3 most recent
            parts.append(self.format_task_for_prompt(task))
        
        return "\n".join(parts)
```

### 7.2 AI Task Assignment Instructions

```python
# task_assignment_prompt.py
TASK_ASSIGNMENT_INSTRUCTIONS = """
## TASK ASSIGNMENT GUIDELINES

You have the ability to assign therapeutic tasks and challenges to users. Use this feature thoughtfully and appropriately.

### When to Assign Tasks:

1. **At the end of a meaningful session** - When the user has gained an insight or identified an area to work on
2. **When practicing a skill** - To reinforce a technique discussed in session
3. **When building habits** - To establish supportive routines
4. **When addressing specific goals** - Tasks that directly advance stated objectives
5. **When the user requests homework** - If they explicitly ask for something to work on

### Task Assignment Process:

1. **Discuss First** - Always discuss the task with the user before assigning it
2. **Explain Rationale** - Clearly explain why this task would be helpful
3. **Get Agreement** - Ensure the user is willing to try it
4. **Set Expectations** - Clarify frequency, duration, and what success looks like
5. **Assign Appropriately** - Match difficulty to user's current capacity

### Task Types Available:

- **Journaling** - Writing exercises to process emotions and thoughts
- **Breathing Exercises** - Techniques for immediate calm and regulation
- **Meditation** - Mindfulness and focused attention practices
- **Gratitude Practice** - Daily reflection on positive aspects
- **Cognitive Reframing** - Challenging and changing negative thoughts
- **Behavioral Activation** - Scheduling and engaging in meaningful activities
- **Exposure** - Gradual facing of fears or avoided situations
- **Sleep Hygiene** - Practices to improve sleep quality
- **Social Connection** - Activities to build or maintain relationships
- **Self-Care** - Nurturing activities for wellbeing
- **Mindfulness** - Present-moment awareness practices

### Task Assignment Format:

When assigning a task, include this structured information:

```
[TASK_ASSIGNMENT]
Type: <task_type>
Title: <task_title>
Description: <brief description>
Instructions:
1. <step 1>
2. <step 2>
...
Rationale: <why this helps>
Duration: <estimated time>
Frequency: <how often>
[/TASK_ASSIGNMENT]
```

### Follow-up:

- Check in about assigned tasks in subsequent sessions
- Celebrate completion and effort
- Troubleshoot obstacles without judgment
- Adjust tasks based on feedback
- Never make users feel guilty for incomplete tasks

### Important Notes:

- Tasks should feel supportive, not burdensome
- Start small and build gradually
- Respect if a user declines a task
- Be flexible with timing and approach
- Focus on learning, not perfection
"""
```

---

## 8. Token Optimization Strategy

### 8.1 Token Budget Management

```python
# token_optimizer.py
import tiktoken
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class TokenBudget:
    total_budget: int
    system_prompt: int
    memory_context: int
    emotion_context: int
    session_history: int
    response_buffer: int

class TokenOptimizer:
    """Optimizes token usage within Claude's context window"""
    
    # Claude 3.5 Sonnet limits
    MAX_CONTEXT_TOKENS = 200_000
    MAX_RESPONSE_TOKENS = 4096
    
    # Recommended budget allocation (percentages)
    BUDGET_ALLOCATION = {
        "system_prompt": 0.04,      # 4% - ~8k tokens
        "memory_context": 0.02,      # 2% - ~4k tokens
        "emotion_context": 0.005,    # 0.5% - ~1k tokens
        "session_history": 0.80,     # 80% - ~160k tokens
        "response_buffer": 0.135,    # 13.5% - ~27k tokens
    }
    
    def __init__(self):
        self.encoding = tiktoken.encoding_for_model("claude-3-5-sonnet")
        self.budget = self._calculate_budget()
    
    def _calculate_budget(self) -> TokenBudget:
        """Calculate token budget allocation"""
        return TokenBudget(
            total_budget=self.MAX_CONTEXT_TOKENS,
            system_prompt=int(self.MAX_CONTEXT_TOKENS * self.BUDGET_ALLOCATION["system_prompt"]),
            memory_context=int(self.MAX_CONTEXT_TOKENS * self.BUDGET_ALLOCATION["memory_context"]),
            emotion_context=int(self.MAX_CONTEXT_TOKENS * self.BUDGET_ALLOCATION["emotion_context"]),
            session_history=int(self.MAX_CONTEXT_TOKENS * self.BUDGET_ALLOCATION["session_history"]),
            response_buffer=int(self.MAX_CONTEXT_TOKENS * self.BUDGET_ALLOCATION["response_buffer"]),
        )
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def optimize_memory_context(
        self,
        memories: List[str],
        max_tokens: int
    ) -> str:
        """Optimize memory context to fit within budget"""
        
        if not memories:
            return ""
        
        # Sort by importance/relevance (assumed pre-sorted)
        selected_memories = []
        current_tokens = 0
        
        for memory in memories:
            memory_tokens = self.count_tokens(memory)
            
            if current_tokens + memory_tokens > max_tokens:
                # Try to truncate if it's the first memory
                if not selected_memories:
                    truncated = self._truncate_to_tokens(memory, max_tokens)
                    if truncated:
                        selected_memories.append(truncated)
                break
            
            selected_memories.append(memory)
            current_tokens += memory_tokens
        
        return "\n".join(selected_memories)
    
    def optimize_session_history(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int
    ) -> List[Dict[str, str]]:
        """Optimize session history to fit within budget"""
        
        if not messages:
            return []
        
        # Calculate tokens for each message
        message_tokens = []
        for msg in messages:
            token_count = self.count_tokens(msg["content"])
            message_tokens.append((msg, token_count))
        
        # Keep recent messages, summarize older ones
        total_tokens = sum(t for _, t in message_tokens)
        
        if total_tokens <= max_tokens:
            return messages
        
        # Need to compress - keep most recent messages intact
        optimized = []
        tokens_used = 0
        
        # Work backwards from most recent
        for msg, tokens in reversed(message_tokens):
            if tokens_used + tokens <= max_tokens * 0.7:  # Keep 70% for recent
                optimized.insert(0, msg)
                tokens_used += tokens
            else:
                break
        
        # Summarize older messages if any remain
        older_messages = messages[:len(messages) - len(optimized)]
        if older_messages:
            summary = self._generate_summary(older_messages)
            summary_tokens = self.count_tokens(summary)
            
            if tokens_used + summary_tokens <= max_tokens:
                optimized.insert(0, {
                    "role": "assistant",
                    "content": f"[Previous conversation: {summary}]"
                })
        
        return optimized
    
    def _truncate_to_tokens(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit"""
        tokens = self.encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text
        
        truncated_tokens = tokens[:max_tokens - 3]  # Leave room for "..."
        return self.encoding.decode(truncated_tokens) + "..."
    
    def _generate_summary(self, messages: List[Dict[str, str]]) -> str:
        """Generate a brief summary of older messages"""
        # This would typically call a cheaper model
        # For now, return a placeholder
        topics = set()
        for msg in messages:
            content = msg["content"].lower()
            if "anxious" in content or "worry" in content:
                topics.add("anxiety")
            if "sad" in content or "depress" in content:
                topics.add("low mood")
            if "stress" in content:
                topics.add("stress")
        
        if topics:
            return f"Discussed: {', '.join(topics)}"
        return "Various topics"
    
    def estimate_request_tokens(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]]
    ) -> int:
        """Estimate total tokens for a request"""
        total = self.count_tokens(system_prompt)
        
        for msg in messages:
            # Add overhead per message
            total += self.count_tokens(msg["content"]) + 4
        
        return total
    
    def get_optimization_recommendations(
        self,
        current_usage: int
    ) -> List[str]:
        """Get recommendations for token optimization"""
        
        usage_ratio = current_usage / self.MAX_CONTEXT_TOKENS
        recommendations = []
        
        if usage_ratio > 0.9:
            recommendations.extend([
                "URGENT: Context window nearly full",
                "Consider aggressive summarization",
                "Reduce memory context to essential items only",
                "Truncate older session messages"
            ])
        elif usage_ratio > 0.7:
            recommendations.extend([
                "Consider summarizing older conversation",
                "Review memory context for relevance",
                "Monitor token usage closely"
            ])
        elif usage_ratio > 0.5:
            recommendations.extend([
                "Token usage healthy",
                "Continue monitoring"
            ])
        else:
            recommendations.append("Token usage optimal")
        
        return recommendations
```

### 8.2 Dynamic Context Compression

```python
# context_compression.py
class ContextCompressor:
    """Compresses context dynamically based on token pressure"""
    
    COMPRESSION_LEVELS = {
        "none": {
            "memory_items": 10,
            "session_messages": "all",
            "emotion_detail": "full",
        },
        "light": {
            "memory_items": 7,
            "session_messages": 50,
            "emotion_detail": "full",
        },
        "medium": {
            "memory_items": 5,
            "session_messages": 30,
            "emotion_detail": "summary",
        },
        "heavy": {
            "memory_items": 3,
            "session_messages": 15,
            "emotion_detail": "basic",
        },
        "critical": {
            "memory_items": 2,
            "session_messages": 5,
            "emotion_detail": "minimal",
        },
    }
    
    def __init__(self, token_optimizer: TokenOptimizer):
        self.optimizer = token_optimizer
        self.current_level = "none"
    
    def determine_compression_level(
        self,
        estimated_tokens: int,
        max_tokens: int
    ) -> str:
        """Determine appropriate compression level"""
        
        ratio = estimated_tokens / max_tokens
        
        if ratio > 0.95:
            return "critical"
        elif ratio > 0.85:
            return "heavy"
        elif ratio > 0.75:
            return "medium"
        elif ratio > 0.65:
            return "light"
        return "none"
    
    def apply_compression(
        self,
        context: Dict,
        level: str
    ) -> Dict:
        """Apply compression to context"""
        
        settings = self.COMPRESSION_LEVELS[level]
        compressed = context.copy()
        
        # Compress memories
        if "memories" in compressed:
            compressed["memories"] = compressed["memories"][:settings["memory_items"]]
        
        # Compress session history
        if "session_messages" in compressed:
            if settings["session_messages"] != "all":
                messages = compressed["session_messages"]
                compressed["session_messages"] = messages[-settings["session_messages"]:]
        
        # Compress emotion data
        if "emotion_context" in compressed and settings["emotion_detail"] != "full":
            compressed["emotion_context"] = self._compress_emotion_data(
                compressed["emotion_context"],
                settings["emotion_detail"]
            )
        
        return compressed
    
    def _compress_emotion_data(
        self,
        emotion_data: str,
        detail_level: str
    ) -> str:
        """Compress emotion data based on detail level"""
        
        if detail_level == "summary":
            # Extract just primary emotion and intensity
            lines = emotion_data.split("\n")
            summary_lines = [l for l in lines if "Current Emotional State" in l or "Intensity" in l]
            return "\n".join(summary_lines)
        
        elif detail_level == "basic":
            # Just primary emotion
            lines = emotion_data.split("\n")
            for line in lines:
                if "Current Emotional State" in line:
                    return line
            return emotion_data
        
        elif detail_level == "minimal":
            return "Emotion data available but compressed for token efficiency."
        
        return emotion_data
```

---

## 9. Complete Integration Flow

### 9.1 Request Processing Pipeline

```python
# integration_pipeline.py
class TherapySessionPipeline:
    """Complete pipeline for processing therapy session requests"""
    
    def __init__(
        self,
        claude_client,
        memory_retriever: MemoryRetriever,
        emotion_processor: EmotionProcessor,
        crisis_detector: CrisisDetector,
        crisis_protocol: CrisisResponseProtocol,
        task_system: TaskAssignmentSystem,
        token_optimizer: TokenOptimizer,
        session_manager: SessionHistoryManager,
        prompt_builder: PromptBuilder
    ):
        self.claude = claude_client
        self.memory = memory_retriever
        self.emotion = emotion_processor
        self.crisis = crisis_detector
        self.crisis_protocol = crisis_protocol
        self.tasks = task_system
        self.tokens = token_optimizer
        self.session = session_manager
        self.prompt_builder = prompt_builder
    
    async def process_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
        hume_data: Optional[Dict] = None
    ) -> Dict:
        """Process a user message through the complete pipeline"""
        
        # Step 1: Process emotion data
        emotion_context = ""
        if hume_data:
            emotion_data = await self.emotion.process_hume_data(hume_data)
            emotion_context = EmotionContextBuilder().build_emotion_context(emotion_data)
        
        # Step 2: Crisis detection
        crisis_analysis = self.crisis.analyze_message(message, emotion_data if hume_data else None)
        crisis_prompt_addition = ""
        
        if crisis_analysis["requires_intervention"]:
            crisis_level = CrisisLevel(crisis_analysis["crisis_level"])
            crisis_prompt_addition = self.crisis.get_crisis_response_prompt(crisis_level)
            
            # Execute crisis protocol
            crisis_actions = await self.crisis_protocol.handle_crisis(
                user_id, crisis_analysis, session_id
            )
        
        # Step 3: Retrieve relevant memories
        memory_context = await self.memory.get_relevant_memories(
            user_id, message, 
            emotion_data if hume_data else None
        )
        
        # Step 4: Get active tasks
        tasks_context = await self.tasks.get_active_tasks_prompt_section(user_id)
        
        # Step 5: Build complete system prompt
        system_prompt = self.prompt_builder.build_system_prompt(
            user_id=user_id,
            memory_context=memory_context,
            emotion_context=emotion_context,
            session_context=tasks_context
        )
        
        # Add crisis prompt if needed
        if crisis_prompt_addition:
            system_prompt += f"\n\n{crisis_prompt_addition}"
        
        # Step 6: Optimize token usage
        current_history = self.session.get_messages_for_api()
        optimized_history = self.tokens.optimize_session_history(
            current_history,
            self.tokens.budget.session_history
        )
        
        # Step 7: Estimate and validate tokens
        estimated_tokens = self.tokens.estimate_request_tokens(
            system_prompt, optimized_history
        )
        
        # Apply compression if needed
        if estimated_tokens > self.tokens.MAX_CONTEXT_TOKENS * 0.8:
            compression_level = self.tokens.determine_compression_level(
                estimated_tokens, self.tokens.MAX_CONTEXT_TOKENS
            )
            # Apply compression logic...
        
        # Step 8: Call Claude API
        response = await self.claude.messages.create(
            model=ClaudeConfig.MODEL,
            max_tokens=ClaudeConfig.MAX_RESPONSE_TOKENS,
            temperature=ClaudeConfig.TEMPERATURE,
            system=system_prompt,
            messages=optimized_history + [{"role": "user", "content": message}]
        )
        
        assistant_response = response.content[0].text
        
        # Step 9: Update session history
        self.session.add_message("user", message, emotion_data if hume_data else None)
        self.session.add_message("assistant", assistant_response)
        
        # Step 10: Extract memories from conversation
        # (Run asynchronously after response)
        asyncio.create_task(self._extract_and_store_memories(
            user_id, session_id, message, assistant_response
        ))
        
        # Step 11: Build response
        return {
            "response": assistant_response,
            "crisis_analysis": crisis_analysis,
            "crisis_actions": crisis_actions if crisis_analysis["requires_intervention"] else None,
            "emotion_data": emotion_data if hume_data else None,
            "tokens_used": {
                "input": estimated_tokens,
                "output": response.usage.output_tokens if hasattr(response, 'usage') else 0
            }
        }
    
    async def _extract_and_store_memories(
        self,
        user_id: str,
        session_id: str,
        user_message: str,
        assistant_response: str
    ):
        """Extract and store memories from conversation"""
        
        extractor = MemoryExtractor()
        messages = [
            Message(role="user", content=user_message, timestamp=time.time()),
            Message(role="assistant", content=assistant_response, timestamp=time.time())
        ]
        
        memories = await extractor.extract_memories(messages, user_id)
        
        # Store in vector database
        for memory in memories:
            await self._store_memory(memory)
    
    async def _store_memory(self, memory: Memory):
        """Store memory in vector database"""
        # Implementation depends on vector DB choice (Pinecone, Weaviate, etc.)
        pass
```

---

## 10. API Response Format

### 10.1 Structured Response Format

```python
# response_format.py
THERAPIST_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "response_text": {
            "type": "string",
            "description": "The main therapeutic response to the user"
        },
        "emotion_acknowledgment": {
            "type": "string",
            "description": "How the response acknowledges user's emotions"
        },
        "techniques_used": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Therapeutic techniques employed in the response"
        },
        "task_assignment": {
            "type": "object",
            "properties": {
                "assigned": {"type": "boolean"},
                "task_type": {"type": "string"},
                "task_details": {"type": "string"}
            }
        },
        "crisis_flags": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Any crisis indicators detected"
        },
        "suggested_follow_up": {
            "type": "string",
            "description": "Suggested topic or question for follow-up"
        }
    },
    "required": ["response_text"]
}
```

---

## 11. Error Handling & Fallbacks

### 11.1 Error Handling Strategy

```python
# error_handling.py
class ClaudeErrorHandler:
    """Handles errors and provides fallback responses"""
    
    FALLBACK_RESPONSES = {
        "rate_limit": "I'm experiencing high demand right now. Please give me a moment and try again.",
        "context_length": "Our conversation has become quite long. Let me summarize and we can continue from there.",
        "api_error": "I'm having trouble processing that. Could you rephrase or try again in a moment?",
        "timeout": "I apologize for the delay. I'm here and ready to help when you are.",
        "content_filter": "I want to make sure I provide the most helpful response. Could you share more about what you're experiencing?",
    }
    
    async def handle_error(self, error: Exception, context: Dict) -> Dict:
        """Handle API errors gracefully"""
        
        error_type = self._classify_error(error)
        
        if error_type == "rate_limit":
            await asyncio.sleep(2)  # Brief backoff
            return {"action": "retry", "delay": 2}
        
        elif error_type == "context_length":
            # Trigger summarization
            return {
                "action": "summarize_and_retry",
                "fallback_message": self.FALLBACK_RESPONSES["context_length"]
            }
        
        elif error_type == "api_error":
            return {
                "action": "fallback_response",
                "message": self.FALLBACK_RESPONSES["api_error"]
            }
        
        else:
            return {
                "action": "fallback_response",
                "message": self.FALLBACK_RESPONSES["api_error"]
            }
    
    def _classify_error(self, error: Exception) -> str:
        """Classify the type of error"""
        error_str = str(error).lower()
        
        if "rate limit" in error_str or "429" in error_str:
            return "rate_limit"
        elif "context length" in error_str or "too long" in error_str:
            return "context_length"
        elif "timeout" in error_str:
            return "timeout"
        elif "content filter" in error_str:
            return "content_filter"
        else:
            return "api_error"
```

---

## 12. Monitoring & Analytics

### 12.1 Usage Tracking

```python
# monitoring.py
class UsageMonitor:
    """Monitors Claude API usage and performance"""
    
    def __init__(self):
        self.metrics = {
            "total_requests": 0,
            "total_tokens_input": 0,
            "total_tokens_output": 0,
            "average_response_time": 0,
            "error_count": 0,
            "crisis_interventions": 0,
            "tasks_assigned": 0,
        }
    
    def log_request(
        self,
        user_id: str,
        session_id: str,
        tokens_input: int,
        tokens_output: int,
        response_time: float,
        crisis_detected: bool = False
    ):
        """Log API request metrics"""
        
        self.metrics["total_requests"] += 1
        self.metrics["total_tokens_input"] += tokens_input
        self.metrics["total_tokens_output"] += tokens_output
        
        # Update rolling average
        n = self.metrics["total_requests"]
        self.metrics["average_response_time"] = (
            (self.metrics["average_response_time"] * (n - 1) + response_time) / n
        )
        
        if crisis_detected:
            self.metrics["crisis_interventions"] += 1
    
    def get_usage_report(self) -> Dict:
        """Generate usage report"""
        
        return {
            "total_requests": self.metrics["total_requests"],
            "total_tokens": self.metrics["total_tokens_input"] + self.metrics["total_tokens_output"],
            "average_tokens_per_request": (
                (self.metrics["total_tokens_input"] + self.metrics["total_tokens_output"]) /
                max(1, self.metrics["total_requests"])
            ),
            "average_response_time": self.metrics["average_response_time"],
            "error_rate": self.metrics["error_count"] / max(1, self.metrics["total_requests"]),
            "crisis_intervention_rate": (
                self.metrics["crisis_interventions"] / max(1, self.metrics["total_requests"])
            ),
        }
```

---

## Appendix A: Environment Variables

```bash
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_FALLBACK_MODEL=claude-3-haiku-20240307

# Context Window Settings
MAX_CONTEXT_TOKENS=200000
MAX_RESPONSE_TOKENS=4096

# Hume AI Configuration
HUME_API_KEY=...
HUME_MODEL=prosody

# Database Configuration
REDIS_URL=redis://localhost:6379
VECTOR_DB_URL=...
POSTGRES_URL=postgresql://...

# Monitoring
ENABLE_USAGE_TRACKING=true
LOG_LEVEL=INFO
```

---

## Appendix B: Quick Reference

| Component | Token Budget | Priority |
|-----------|-------------|----------|
| System Prompt | ~8,000 | Critical |
| Memory Context | ~4,000 | High |
| Emotion Context | ~1,000 | High |
| Session History | ~160,000 | Medium |
| Response Buffer | ~27,000 | Medium |

---

*Document Version: 1.0*
*Last Updated: 2024*
*MindMate AI - Technical Documentation*
