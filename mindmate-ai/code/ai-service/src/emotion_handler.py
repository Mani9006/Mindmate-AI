"""
MindMate AI - Hume AI Emotion Webhook Handler
Process emotion detection results from Hume AI and integrate into conversation context.
"""

import hmac
import hashlib
import json
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from fastapi import Request, HTTPException, Header

from config.settings import settings
from config.logging_config import logger
from src.models import (
    EmotionData, 
    EmotionContext, 
    EmotionType,
    HumeWebhookPayload
)


class EmotionSource(str, Enum):
    """Source of emotion data."""
    TEXT = "text"
    SPEECH = "speech"
    FACIAL = "facial"
    MULTIMODAL = "multimodal"


@dataclass
class ProcessedEmotion:
    """Processed emotion data with confidence scores."""
    emotion: EmotionType
    confidence: float
    intensity: float
    source: EmotionSource
    timestamp: datetime


class HumeEmotionMapper:
    """Map Hume AI emotion names to internal EmotionType enum."""
    
    EMOTION_MAPPING = {
        # Hume AI emotion names -> Internal EmotionType
        "Admiration": EmotionType.JOY,
        "Adoration": EmotionType.JOY,
        "Aesthetic Appreciation": EmotionType.JOY,
        "Amusement": EmotionType.JOY,
        "Anger": EmotionType.ANGER,
        "Anxiety": EmotionType.ANXIETY,
        "Awe": EmotionType.SURPRISE,
        "Awkwardness": EmotionType.CONFUSION,
        "Boredom": EmotionType.NEUTRAL,
        "Calmness": EmotionType.NEUTRAL,
        "Concentration": EmotionType.NEUTRAL,
        "Confusion": EmotionType.CONFUSION,
        "Contemplation": EmotionType.NEUTRAL,
        "Contempt": EmotionType.DISGUST,
        "Contentment": EmotionType.JOY,
        "Craving": EmotionType.EXCITEMENT,
        "Desire": EmotionType.EXCITEMENT,
        "Determination": EmotionType.NEUTRAL,
        "Disappointment": EmotionType.SADNESS,
        "Disgust": EmotionType.DISGUST,
        "Distress": EmotionType.SADNESS,
        "Doubt": EmotionType.CONFUSION,
        "Ecstasy": EmotionType.JOY,
        "Embarrassment": EmotionType.CONFUSION,
        "Empathic Pain": EmotionType.SADNESS,
        "Entrancement": EmotionType.JOY,
        "Envy": EmotionType.ANGER,
        "Excitement": EmotionType.EXCITEMENT,
        "Fear": EmotionType.FEAR,
        "Guilt": EmotionType.SADNESS,
        "Horror": EmotionType.FEAR,
        "Interest": EmotionType.EXCITEMENT,
        "Joy": EmotionType.JOY,
        "Love": EmotionType.JOY,
        "Nostalgia": EmotionType.SADNESS,
        "Pain": EmotionType.SADNESS,
        "Pride": EmotionType.JOY,
        "Realization": EmotionType.SURPRISE,
        "Relief": EmotionType.JOY,
        "Romance": EmotionType.JOY,
        "Sadness": EmotionType.SADNESS,
        "Satisfaction": EmotionType.JOY,
        "Shame": EmotionType.SADNESS,
        "Surprise (negative)": EmotionType.SURPRISE,
        "Surprise (positive)": EmotionType.SURPRISE,
        "Sympathy": EmotionType.SADNESS,
        "Tiredness": EmotionType.NEUTRAL,
        "Triumph": EmotionType.JOY,
    }
    
    @classmethod
    def map_emotion(cls, hume_emotion: str) -> EmotionType:
        """Map Hume emotion name to internal EmotionType."""
        return cls.EMOTION_MAPPING.get(hume_emotion, EmotionType.NEUTRAL)
    
    @classmethod
    def get_all_mapped_emotions(cls) -> List[str]:
        """Get all Hume emotion names that can be mapped."""
        return list(cls.EMOTION_MAPPING.keys())


class EmotionAggregator:
    """Aggregate multiple emotion detections into a coherent context."""
    
    def __init__(self):
        self.emotion_weights: Dict[EmotionType, List[float]] = {}
        self.source_weights = {
            EmotionSource.FACIAL: 0.4,
            EmotionSource.SPEECH: 0.35,
            EmotionSource.TEXT: 0.25
        }
    
    def add_emotion(
        self, 
        emotion: EmotionType, 
        confidence: float,
        source: EmotionSource
    ):
        """Add an emotion detection with source weighting."""
        weighted_confidence = confidence * self.source_weights.get(source, 0.25)
        
        if emotion not in self.emotion_weights:
            self.emotion_weights[emotion] = []
        
        self.emotion_weights[emotion].append(weighted_confidence)
    
    def aggregate(self) -> EmotionContext:
        """Aggregate all emotions into a context object."""
        if not self.emotion_weights:
            return EmotionContext(
                primary_emotion=EmotionType.NEUTRAL,
                secondary_emotions=[],
                overall_valence=0.0,
                overall_arousal=0.5,
                dominant_emotions=[]
            )
        
        # Calculate average confidence for each emotion
        emotion_scores = {
            emotion: sum(scores) / len(scores)
            for emotion, scores in self.emotion_weights.items()
        }
        
        # Sort by score
        sorted_emotions = sorted(
            emotion_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Primary emotion
        primary_emotion = sorted_emotions[0][0]
        
        # Secondary emotions (above threshold)
        threshold = 0.3
        secondary_emotions = [
            EmotionData(
                emotion=emotion,
                confidence=score,
                intensity=min(score * 1.5, 1.0),
                source="multimodal"
            )
            for emotion, score in sorted_emotions[1:4]
            if score >= threshold
        ]
        
        # Calculate valence (-1 to 1)
        positive_emotions = [EmotionType.JOY, EmotionType.EXCITEMENT]
        negative_emotions = [EmotionType.SADNESS, EmotionType.ANGER, EmotionType.FEAR, EmotionType.ANXIETY]
        
        valence = 0.0
        for emotion, score in sorted_emotions:
            if emotion in positive_emotions:
                valence += score
            elif emotion in negative_emotions:
                valence -= score
        
        valence = max(-1.0, min(1.0, valence))
        
        # Calculate arousal (0 to 1)
        high_arousal = [EmotionType.ANGER, EmotionType.EXCITEMENT, EmotionType.FEAR, EmotionType.SURPRISE]
        arousal = sum(
            score for emotion, score in sorted_emotions
            if emotion in high_arousal
        )
        arousal = min(1.0, arousal)
        
        # Dominant emotions (top 3)
        dominant_emotions = [
            EmotionData(
                emotion=emotion,
                confidence=score,
                intensity=min(score * 1.5, 1.0),
                source="multimodal"
            )
            for emotion, score in sorted_emotions[:3]
        ]
        
        return EmotionContext(
            primary_emotion=primary_emotion,
            secondary_emotions=secondary_emotions,
            overall_valence=valence,
            overall_arousal=arousal,
            dominant_emotions=dominant_emotions
        )


class HumeWebhookHandler:
    """Handle incoming webhooks from Hume AI."""
    
    def __init__(self):
        self.webhook_secret = settings.HUME_WEBHOOK_SECRET
        self.callbacks: List[Callable[[EmotionContext, str], None]] = []
    
    def register_callback(self, callback: Callable[[EmotionContext, str], None]):
        """Register a callback for emotion updates."""
        self.callbacks.append(callback)
    
    async def verify_signature(
        self, 
        request: Request, 
        signature: Optional[str] = Header(None, alias="X-Hume-Signature")
    ) -> bool:
        """Verify Hume webhook signature."""
        if not self.webhook_secret:
            logger.warning("HUME_WEBHOOK_SECRET not set, skipping signature verification")
            return True
        
        if not signature:
            raise HTTPException(status_code=401, detail="Missing signature header")
        
        body = await request.body()
        
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(f"sha256={expected_signature}", signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        return True
    
    async def process_webhook(
        self, 
        payload: HumeWebhookPayload
    ) -> EmotionContext:
        """
        Process Hume AI webhook payload and extract emotion context.
        
        Args:
            payload: Hume webhook payload
            
        Returns:
            Aggregated emotion context
        """
        try:
            logger.info(
                f"Processing Hume webhook for job {payload.job_id}",
                extra={
                    "job_id": payload.job_id,
                    "user_id": payload.user_id,
                    "status": payload.status
                }
            )
            
            if payload.status != "completed":
                logger.warning(f"Hume job {payload.job_id} status: {payload.status}")
                return EmotionContext(
                    primary_emotion=EmotionType.NEUTRAL,
                    secondary_emotions=[],
                    overall_valence=0.0,
                    overall_arousal=0.5,
                    dominant_emotions=[]
                )
            
            # Process predictions
            aggregator = EmotionAggregator()
            
            for prediction in payload.predictions:
                await self._process_prediction(prediction, aggregator)
            
            # Aggregate emotions
            emotion_context = aggregator.aggregate()
            
            # Notify callbacks
            user_id = payload.user_id or "unknown"
            for callback in self.callbacks:
                try:
                    callback(emotion_context, user_id)
                except Exception as e:
                    logger.error(f"Error in emotion callback: {e}")
            
            logger.info(
                f"Emotion context extracted for user {user_id}",
                extra={
                    "primary_emotion": emotion_context.primary_emotion.value,
                    "valence": emotion_context.overall_valence,
                    "arousal": emotion_context.overall_arousal
                }
            )
            
            return emotion_context
            
        except Exception as e:
            logger.error(f"Error processing Hume webhook: {e}")
            raise
    
    async def _process_prediction(
        self, 
        prediction: Dict[str, Any], 
        aggregator: EmotionAggregator
    ):
        """Process a single prediction from Hume."""
        # Determine source
        source_type = prediction.get("type", "unknown")
        source = EmotionSource.TEXT
        
        if source_type == "face":
            source = EmotionSource.FACIAL
        elif source_type == "prosody":
            source = EmotionSource.SPEECH
        elif source_type == "multimodal":
            source = EmotionSource.MULTIMODAL
        
        # Extract emotions
        emotions = prediction.get("emotions", [])
        
        for emotion_data in emotions:
            hume_name = emotion_data.get("name", "")
            score = emotion_data.get("score", 0.0)
            
            if score > 0.1:  # Only consider significant emotions
                mapped_emotion = HumeEmotionMapper.map_emotion(hume_name)
                aggregator.add_emotion(mapped_emotion, score, source)
    
    def process_text_emotions(
        self, 
        text: str, 
        emotion_scores: Dict[str, float]
    ) -> EmotionContext:
        """
        Process emotion scores from text analysis.
        
        Args:
            text: Source text
            emotion_scores: Dictionary of emotion names to scores
            
        Returns:
            Emotion context from text
        """
        aggregator = EmotionAggregator()
        
        for emotion_name, score in emotion_scores.items():
            if score > 0.1:
                mapped_emotion = HumeEmotionMapper.map_emotion(emotion_name)
                aggregator.add_emotion(mapped_emotion, score, EmotionSource.TEXT)
        
        return aggregator.aggregate()


class EmotionContextManager:
    """Manage emotion context across a conversation session."""
    
    def __init__(self):
        self.session_emotions: Dict[str, List[EmotionContext]] = {}
        self.max_history = 10
    
    def add_emotion_context(self, session_id: str, context: EmotionContext):
        """Add emotion context to session history."""
        if session_id not in self.session_emotions:
            self.session_emotions[session_id] = []
        
        self.session_emotions[session_id].append(context)
        
        # Keep only recent history
        if len(self.session_emotions[session_id]) > self.max_history:
            self.session_emotions[session_id] = self.session_emotions[session_id][-self.max_history:]
    
    def get_session_emotion_summary(self, session_id: str) -> Optional[EmotionContext]:
        """Get aggregated emotion summary for a session."""
        if session_id not in self.session_emotions or not self.session_emotions[session_id]:
            return None
        
        contexts = self.session_emotions[session_id]
        
        # Average valence and arousal
        avg_valence = sum(c.overall_valence for c in contexts) / len(contexts)
        avg_arousal = sum(c.overall_arousal for c in contexts) / len(contexts)
        
        # Most common primary emotion
        emotion_counts = {}
        for c in contexts:
            emotion_counts[c.primary_emotion] = emotion_counts.get(c.primary_emotion, 0) + 1
        
        primary_emotion = max(emotion_counts.keys(), key=lambda e: emotion_counts[e])
        
        return EmotionContext(
            primary_emotion=primary_emotion,
            secondary_emotions=[],  # Could aggregate these too
            overall_valence=avg_valence,
            overall_arousal=avg_arousal,
            dominant_emotions=[]
        )
    
    def clear_session(self, session_id: str):
        """Clear emotion history for a session."""
        if session_id in self.session_emotions:
            del self.session_emotions[session_id]


# Singleton instances
_webhook_handler: Optional[HumeWebhookHandler] = None
_emotion_manager: Optional[EmotionContextManager] = None


def get_webhook_handler() -> HumeWebhookHandler:
    """Get singleton webhook handler."""
    global _webhook_handler
    if _webhook_handler is None:
        _webhook_handler = HumeWebhookHandler()
    return _webhook_handler


def get_emotion_manager() -> EmotionContextManager:
    """Get singleton emotion manager."""
    global _emotion_manager
    if _emotion_manager is None:
        _emotion_manager = EmotionContextManager()
    return _emotion_manager
