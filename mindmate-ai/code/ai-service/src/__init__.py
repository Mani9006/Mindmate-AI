"""
MindMate AI - Source Package
AI pipeline service components for mental health companion.
"""

from src.claude_client import (
    ClaudeClient,
    ClaudeResponse,
    TokenCounter,
    get_claude_client,
    close_claude_client
)
from src.memory_store import (
    MemoryStore,
    EmbeddingGenerator,
    get_memory_store
)
from src.emotion_handler import (
    HumeWebhookHandler,
    EmotionContextManager,
    EmotionAggregator,
    HumeEmotionMapper,
    get_webhook_handler,
    get_emotion_manager
)
from src.prompt_assembler import (
    PromptAssembler,
    SystemPromptBuilder,
    AssembledPrompt,
    get_prompt_assembler
)
from src.response_parser import (
    ResponseParser,
    TaskExtractor,
    CrisisDetector,
    ParsedResponse,
    get_response_parser
)
from src.tts_service import (
    ElevenLabsClient,
    TTSService,
    get_elevenlabs_client,
    get_tts_service
)
from src.chat_service import (
    ChatService,
    get_chat_service
)

__all__ = [
    # Claude Client
    "ClaudeClient",
    "ClaudeResponse",
    "TokenCounter",
    "get_claude_client",
    "close_claude_client",
    
    # Memory Store
    "MemoryStore",
    "EmbeddingGenerator",
    "get_memory_store",
    
    # Emotion Handler
    "HumeWebhookHandler",
    "EmotionContextManager",
    "EmotionAggregator",
    "HumeEmotionMapper",
    "get_webhook_handler",
    "get_emotion_manager",
    
    # Prompt Assembler
    "PromptAssembler",
    "SystemPromptBuilder",
    "AssembledPrompt",
    "get_prompt_assembler",
    
    # Response Parser
    "ResponseParser",
    "TaskExtractor",
    "CrisisDetector",
    "ParsedResponse",
    "get_response_parser",
    
    # TTS Service
    "ElevenLabsClient",
    "TTSService",
    "get_elevenlabs_client",
    "get_tts_service",
    
    # Chat Service
    "ChatService",
    "get_chat_service",
]
