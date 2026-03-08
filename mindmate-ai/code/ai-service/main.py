"""
MindMate AI - FastAPI Server
Production-ready FastAPI server for the AI pipeline service.
"""

import time
import uuid
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Request, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn

from config.settings import settings
from config.logging_config import logger, log_request, log_response, log_error
from src.models import (
    ChatRequest,
    ChatResponse,
    TTSRequest,
    TTSResponse,
    HumeWebhookPayload,
    HealthCheckResponse,
    EmotionContext
)
from src.chat_service import get_chat_service
from src.emotion_handler import get_webhook_handler, get_emotion_manager
from src.tts_service import get_tts_service
from src.claude_client import close_claude_client
from src.memory_store import get_memory_store


# Security
security = HTTPBearer(auto_error=False)


# Request timing middleware
class TimingMiddleware:
    """Middleware to track request timing."""
    
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        request.state.start_time = start_time
        
        response = await call_next(request)
        
        duration = (time.time() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.2f}ms"
        
        return response


# API Key validation
def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key from Authorization header."""
    if not settings.API_KEY:
        return True  # Skip validation if no API key configured
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    if token != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True


# Application lifespan handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    # Startup
    logger.info(
        f"Starting {settings.APP_NAME} v{settings.APP_VERSION}",
        extra={
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG
        }
    )
    
    # Initialize services
    try:
        # Test connections
        memory_store = get_memory_store()
        logger.info("Memory store initialized")
        
        chat_service = get_chat_service()
        logger.info("Chat service initialized")
        
    except Exception as e:
        logger.error(f"Error initializing services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down services...")
    
    try:
        await close_claude_client()
        await get_tts_service().close()
        logger.info("Services shut down successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered mental health companion with emotion-aware responses",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["https://mindmate.ai"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TimingMiddleware)


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    log_error(
        request_id=request_id,
        user_id='unknown',
        error=exc
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": request_id,
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Health check endpoint
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint for monitoring."""
    services_status = {
        "api": "healthy",
        "claude": "unknown",
        "pinecone": "unknown",
        "elevenlabs": "unknown"
    }
    
    # Check Pinecone
    try:
        memory_store = get_memory_store()
        stats = await memory_store.get_memory_stats("health_check")
        services_status["pinecone"] = "healthy" if "error" not in stats else "degraded"
    except Exception as e:
        services_status["pinecone"] = f"error: {str(e)}"
    
    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        services=services_status,
        uptime_seconds=0  # Would track actual uptime in production
    )


# Main chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    authorized: bool = Depends(verify_api_key)
):
    """
    Process a chat message and return an AI response.
    
    This endpoint orchestrates the full AI pipeline:
    - Memory retrieval from Pinecone
    - Emotion context processing
    - Prompt assembly with context
    - Claude API generation
    - Response parsing for tasks and crisis signals
    - Optional TTS generation
    """
    chat_service = get_chat_service()
    
    try:
        response = await chat_service.process_chat(request)
        return response
        
    except Exception as e:
        logger.error(f"Chat processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


# TTS endpoint
@app.post("/tts", response_model=TTSResponse)
async def text_to_speech(
    request: TTSRequest,
    authorized: bool = Depends(verify_api_key)
):
    """Convert text to speech using ElevenLabs."""
    tts_service = get_tts_service()
    
    try:
        audio_url = await tts_service.synthesize(
            text=request.text,
            voice_id=request.voice_id,
            use_cache=True
        )
        
        # Estimate duration
        duration = tts_service.client.estimate_duration(request.text)
        
        return TTSResponse(
            audio_url=audio_url,
            duration_seconds=duration,
            character_count=len(request.text),
            voice_id=request.voice_id or settings.ELEVENLABS_VOICE_ID
        )
        
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


# Hume AI webhook endpoint
@app.post("/webhooks/hume")
async def hume_webhook(
    request: Request,
    payload: HumeWebhookPayload,
    x_hume_signature: Optional[str] = Header(None)
):
    """
    Receive emotion analysis results from Hume AI.
    
    This webhook processes emotion detection results and updates
    the user's emotion context for their active session.
    """
    webhook_handler = get_webhook_handler()
    
    try:
        # Verify signature if configured
        if settings.HUME_WEBHOOK_SECRET:
            await webhook_handler.verify_signature(request, x_hume_signature)
        
        # Process the webhook
        emotion_context = await webhook_handler.process_webhook(payload)
        
        # Update session emotion context if session ID is provided
        if payload.session_id:
            emotion_manager = get_emotion_manager()
            emotion_manager.add_emotion_context(payload.session_id, emotion_context)
        
        return {"status": "processed", "emotion": emotion_context.primary_emotion.value}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hume webhook error: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")


# Session management endpoints
@app.get("/sessions/{session_id}/history")
async def get_session_history(
    session_id: str,
    authorized: bool = Depends(verify_api_key)
):
    """Get conversation history for a session."""
    chat_service = get_chat_service()
    history = chat_service.get_session_history(session_id)
    
    if not history:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "user_id": history.user_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp
            }
            for msg in history.messages
        ],
        "started_at": history.started_at,
        "last_activity": history.last_activity
    }


@app.delete("/sessions/{session_id}")
async def clear_session(
    session_id: str,
    authorized: bool = Depends(verify_api_key)
):
    """Clear a session and its conversation history."""
    chat_service = get_chat_service()
    chat_service.clear_session(session_id)
    
    return {"status": "cleared", "session_id": session_id}


# Statistics endpoint
@app.get("/stats")
async def get_stats(authorized: bool = Depends(verify_api_key)):
    """Get service statistics and usage metrics."""
    chat_service = get_chat_service()
    
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        **chat_service.get_stats()
    }


# Memory management endpoints
@app.get("/users/{user_id}/memories/stats")
async def get_user_memory_stats(
    user_id: str,
    authorized: bool = Depends(verify_api_key)
):
    """Get memory statistics for a user."""
    memory_store = get_memory_store()
    stats = await memory_store.get_memory_stats(user_id)
    
    return {
        "user_id": user_id,
        **stats
    }


@app.post("/users/{user_id}/memories/search")
async def search_memories(
    user_id: str,
    query: str,
    top_k: int = 5,
    authorized: bool = Depends(verify_api_key)
):
    """Search user memories by query."""
    memory_store = get_memory_store()
    
    memories = await memory_store.retrieve_memories(
        user_id=user_id,
        query=query,
        top_k=top_k
    )
    
    return {
        "user_id": user_id,
        "query": query,
        "results": [
            {
                "id": rm.memory.id,
                "content": rm.memory.content,
                "relevance_score": rm.relevance_score,
                "memory_type": rm.memory.memory_type,
                "created_at": rm.memory.created_at
            }
            for rm in memories
        ]
    }


# Voice management endpoints
@app.get("/voices")
async def list_voices(authorized: bool = Depends(verify_api_key)):
    """List available TTS voices."""
    tts_client = get_tts_service().client
    
    try:
        voices = await tts_client.get_voices()
        
        return {
            "voices": [
                {
                    "voice_id": v.get("voice_id"),
                    "name": v.get("name"),
                    "category": v.get("category"),
                    "description": v.get("description"),
                    "preview_url": v.get("preview_url")
                }
                for v in voices
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching voices: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")


# Main entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS if not settings.DEBUG else 1,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
