"""
MindMate AI - Pydantic Models
Data models for requests, responses, and internal data structures.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from uuid import UUID, uuid4


class EmotionType(str, Enum):
    """Emotion types detected by Hume AI."""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    NEUTRAL = "neutral"
    ANXIETY = "anxiety"
    CONFUSION = "confusion"
    EXCITEMENT = "excitement"


class CrisisLevel(str, Enum):
    """Crisis severity levels."""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskType(str, Enum):
    """Types of tasks that can be assigned."""
    MOOD_TRACKING = "mood_tracking"
    JOURNALING = "journaling"
    BREATHING_EXERCISE = "breathing_exercise"
    MEDITATION = "meditation"
    GRATITUDE_PRACTICE = "gratitude_practice"
    COGNITIVE_REFRAMING = "cognitive_reframing"
    BEHAVIORAL_ACTIVATION = "behavioral_activation"
    SLEEP_HYGIENE = "sleep_hygiene"
    SOCIAL_CONNECTION = "social_connection"
    PROFESSIONAL_HELP = "professional_help"


class EmotionData(BaseModel):
    """Emotion detection result from Hume AI."""
    emotion: EmotionType
    confidence: float = Field(..., ge=0.0, le=1.0)
    intensity: float = Field(..., ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = Field(default="text")  # text, voice, facial
    
    @validator('confidence', 'intensity')
    def validate_scores(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Score must be between 0 and 1')
        return round(v, 4)


class EmotionContext(BaseModel):
    """Aggregated emotion context for a session."""
    primary_emotion: EmotionType
    secondary_emotions: List[EmotionData] = Field(default_factory=list)
    overall_valence: float = Field(..., ge=-1.0, le=1.0)  # -1 negative to +1 positive
    overall_arousal: float = Field(..., ge=0.0, le=1.0)  # 0 calm to 1 excited
    dominant_emotions: List[EmotionData] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Memory(BaseModel):
    """User memory stored in vector database."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    content: str
    memory_type: str = Field(default="conversation")  # conversation, insight, event, preference
    emotion_tags: List[EmotionType] = Field(default_factory=list)
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = None
    access_count: int = Field(default=0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None


class RetrievedMemory(BaseModel):
    """Memory retrieved from vector search with relevance score."""
    memory: Memory
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    retrieval_context: Optional[str] = None


class TaskAssignment(BaseModel):
    """Task assigned to user by AI."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    task_type: TaskType
    title: str
    description: str
    rationale: str  # Why this task was assigned
    estimated_duration_minutes: Optional[int] = None
    difficulty: str = Field(default="medium")  # easy, medium, hard
    scheduled_for: Optional[datetime] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CrisisSignal(BaseModel):
    """Detected crisis signal from user message."""
    detected: bool = False
    level: CrisisLevel = CrisisLevel.NONE
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    keywords_detected: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = None
    resources: List[Dict[str, str]] = Field(default_factory=list)
    requires_immediate_attention: bool = False


class ConversationMessage(BaseModel):
    """Single message in conversation history."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    role: str = Field(..., regex="^(user|assistant|system)$")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    emotion_context: Optional[EmotionContext] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ConversationHistory(BaseModel):
    """Conversation history for a session."""
    session_id: str
    user_id: str
    messages: List[ConversationMessage] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    def add_message(self, role: str, content: str, **kwargs) -> ConversationMessage:
        """Add a new message to the history."""
        message = ConversationMessage(role=role, content=content, **kwargs)
        self.messages.append(message)
        self.last_activity = datetime.utcnow()
        return message
    
    def get_recent_messages(self, count: int = 10) -> List[ConversationMessage]:
        """Get the most recent messages."""
        return self.messages[-count:] if len(self.messages) > count else self.messages


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[str] = None
    user_id: str
    emotion_context: Optional[EmotionContext] = None
    include_voice_response: bool = Field(default=False)
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response_id: str = Field(default_factory=lambda: str(uuid4()))
    message: str
    emotion_detected: Optional[EmotionContext] = None
    tasks_assigned: List[TaskAssignment] = Field(default_factory=list)
    crisis_signal: Optional[CrisisSignal] = None
    memories_used: List[RetrievedMemory] = Field(default_factory=list)
    voice_url: Optional[str] = None
    processing_time_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HumeWebhookPayload(BaseModel):
    """Payload from Hume AI webhook."""
    job_id: str
    status: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    predictions: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TTSRequest(BaseModel):
    """Request for text-to-speech conversion."""
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: Optional[str] = None
    model: Optional[str] = None
    stability: float = Field(default=0.5, ge=0.0, le=1.0)
    similarity_boost: float = Field(default=0.75, ge=0.0, le=1.0)
    
    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('Text cannot be empty')
        return v.strip()


class TTSResponse(BaseModel):
    """Response from text-to-speech conversion."""
    audio_url: str
    duration_seconds: float
    character_count: int
    voice_id: str


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime
    services: Dict[str, str]
    uptime_seconds: float


class TokenUsage(BaseModel):
    """Token usage statistics."""
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class AIResponseMetadata(BaseModel):
    """Metadata for AI response."""
    model: str
    token_usage: TokenUsage
    latency_ms: float
    finish_reason: str
    system_fingerprint: Optional[str] = None
