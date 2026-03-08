"""
Hume AI Emotion Threshold Triggers Module
==========================================
CRITICAL SAFETY CODE for MindMate AI

This module implements emotion-based crisis detection using Hume AI's
emotion recognition API. It monitors for sustained high levels of
negative emotions that indicate potential crisis states.

WARNING: This is life-safety critical code. Thresholds are based on
clinical research and should only be modified by mental health professionals.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import statistics
from collections import deque

from config import EMOTION_THRESHOLDS, CrisisLevel, CrisisType


class EmotionTriggerType(Enum):
    """Types of emotion-based triggers."""
    SUSTAINED_SADNESS = "sustained_sadness"
    SUSTAINED_FEAR = "sustained_fear"
    SUSTAINED_DISTRESS = "sustained_distress"
    COMBINED_NEGATIVE_EMOTIONS = "combined_negative_emotions"
    EMOTIONAL_VOLATILITY = "emotional_volatility"
    EMOTIONAL_NUMBNESS = "emotional_numbness"
    SUDDEN_EMOTIONAL_SHIFT = "sudden_emotional_shift"


@dataclass
class EmotionReading:
    """A single emotion reading from Hume AI."""
    timestamp: datetime
    emotions: Dict[str, float]  # emotion_name -> score (0.0 - 1.0)
    source: str  # 'voice', 'facial', 'text', or 'multimodal'
    session_id: str
    
    # Primary emotions of concern for crisis detection
    SADNESS_KEY = "sadness"
    FEAR_KEY = "fear"
    DISTRESS_KEY = "distress"
    ANGER_KEY = "anger"
    ANXIETY_KEY = "anxiety"
    HOPELESSNESS_KEY = "hopelessness"
    CONFUSION_KEY = "confusion"
    FATIGUE_KEY = "fatigue"
    PAIN_KEY = "pain"
    
    def get_emotion(self, emotion_name: str) -> float:
        """Get the score for a specific emotion."""
        return self.emotions.get(emotion_name, 0.0)
    
    @property
    def sadness(self) -> float:
        return self.get_emotion(self.SADNESS_KEY)
    
    @property
    def fear(self) -> float:
        return self.get_emotion(self.FEAR_KEY)
    
    @property
    def distress(self) -> float:
        return self.get_emotion(self.DISTRESS_KEY)
    
    @property
    def anger(self) -> float:
        return self.get_emotion(self.ANGER_KEY)
    
    @property
    def anxiety(self) -> float:
        return self.get_emotion(self.ANXIETY_KEY)


@dataclass
class EmotionTrigger:
    """An emotion-based trigger that has been detected."""
    trigger_type: EmotionTriggerType
    severity: CrisisLevel
    timestamp: datetime
    description: str
    emotion_scores: Dict[str, float]
    duration_minutes: Optional[float] = None
    confidence: float = 0.0


@dataclass
class SustainedEmotionWindow:
    """Tracks emotions over a time window for sustained detection."""
    window_start: datetime
    window_end: datetime
    readings: deque = field(default_factory=lambda: deque(maxlen=100))
    
    def add_reading(self, reading: EmotionReading):
        """Add a new emotion reading to the window."""
        self.readings.append(reading)
        self.window_end = reading.timestamp
    
    def get_average_emotion(self, emotion_name: str) -> float:
        """Get the average score for an emotion in this window."""
        if not self.readings:
            return 0.0
        scores = [r.get_emotion(emotion_name) for r in self.readings]
        return statistics.mean(scores)
    
    def get_max_emotion(self, emotion_name: str) -> float:
        """Get the maximum score for an emotion in this window."""
        if not self.readings:
            return 0.0
        return max(r.get_emotion(emotion_name) for r in self.readings)
    
    def get_duration_minutes(self) -> float:
        """Get the duration of the window in minutes."""
        if not self.readings:
            return 0.0
        return (self.window_end - self.window_start).total_seconds() / 60
    
    def is_sustained_above_threshold(
        self, 
        emotion_name: str, 
        threshold: float, 
        min_duration_minutes: float
    ) -> bool:
        """Check if an emotion has been sustained above threshold."""
        if self.get_duration_minutes() < min_duration_minutes:
            return False
        
        # At least 70% of readings must be above threshold
        scores = [r.get_emotion(emotion_name) for r in self.readings]
        above_threshold = sum(1 for s in scores if s >= threshold)
        return (above_threshold / len(scores)) >= 0.7 if scores else False


class EmotionTriggerDetector:
    """
    Detects crisis triggers based on Hume AI emotion data.
    
    This class monitors emotion streams and identifies patterns
    that indicate potential mental health crises.
    """
    
    def __init__(self):
        """Initialize the emotion trigger detector."""
        self.thresholds = EMOTION_THRESHOLDS
        
        # Track sustained emotion windows per user
        self.user_emotion_windows: Dict[str, SustainedEmotionWindow] = {}
        
        # Track emotional history for pattern detection
        self.user_emotion_history: Dict[str, deque] = {}
        
        # Configuration
        self.SUSTAINED_WINDOW_MINUTES = 10
        self.HISTORY_WINDOW_HOURS = 24
        self.MAX_HISTORY_READINGS = 1000
        
    def process_emotion_reading(
        self, 
        user_id: str, 
        reading: EmotionReading
    ) -> List[EmotionTrigger]:
        """
        Process a new emotion reading and detect any triggers.
        
        Args:
            user_id: The user identifier
            reading: The emotion reading from Hume AI
            
        Returns:
            List of detected emotion triggers
        """
        triggers = []
        
        # Update user's emotion window
        window = self._get_or_create_window(user_id, reading.timestamp)
        window.add_reading(reading)
        
        # Update emotion history
        self._update_emotion_history(user_id, reading)
        
        # Check for sustained emotion triggers
        sustained_triggers = self._check_sustained_emotions(user_id, window)
        triggers.extend(sustained_triggers)
        
        # Check for combined emotion triggers
        combined_triggers = self._check_combined_emotions(user_id, reading)
        triggers.extend(combined_triggers)
        
        # Check for emotional volatility
        volatility_trigger = self._check_emotional_volatility(user_id)
        if volatility_trigger:
            triggers.append(volatility_trigger)
        
        # Check for emotional numbness
        numbness_trigger = self._check_emotional_numbness(user_id, reading)
        if numbness_trigger:
            triggers.append(numbness_trigger)
        
        # Check for sudden emotional shifts
        shift_trigger = self._check_sudden_shift(user_id, reading)
        if shift_trigger:
            triggers.append(shift_trigger)
        
        return triggers
    
    def _get_or_create_window(
        self, 
        user_id: str, 
        timestamp: datetime
    ) -> SustainedEmotionWindow:
        """Get or create a sustained emotion window for a user."""
        if user_id not in self.user_emotion_windows:
            self.user_emotion_windows[user_id] = SustainedEmotionWindow(
                window_start=timestamp,
                window_end=timestamp
            )
        
        window = self.user_emotion_windows[user_id]
        
        # Reset window if it's been too long since last reading
        if (timestamp - window.window_end) > timedelta(minutes=self.SUSTAINED_WINDOW_MINUTES * 2):
            self.user_emotion_windows[user_id] = SustainedEmotionWindow(
                window_start=timestamp,
                window_end=timestamp
            )
        
        return self.user_emotion_windows[user_id]
    
    def _update_emotion_history(self, user_id: str, reading: EmotionReading):
        """Update the emotion history for a user."""
        if user_id not in self.user_emotion_history:
            self.user_emotion_history[user_id] = deque(maxlen=self.MAX_HISTORY_READINGS)
        
        self.user_emotion_history[user_id].append(reading)
        
        # Clean up old readings
        cutoff = reading.timestamp - timedelta(hours=self.HISTORY_WINDOW_HOURS)
        while (self.user_emotion_history[user_id] and 
               self.user_emotion_history[user_id][0].timestamp < cutoff):
            self.user_emotion_history[user_id].popleft()
    
    def _check_sustained_emotions(
        self, 
        user_id: str, 
        window: SustainedEmotionWindow
    ) -> List[EmotionTrigger]:
        """Check for sustained high levels of negative emotions."""
        triggers = []
        
        # Check sustained sadness
        if window.is_sustained_above_threshold(
            EmotionReading.SADNESS_KEY,
            self.thresholds.SADNESS_HIGH,
            self.SUSTAINED_WINDOW_MINUTES
        ):
            avg_sadness = window.get_average_emotion(EmotionReading.SADNESS_KEY)
            max_sadness = window.get_max_emotion(EmotionReading.SADNESS_KEY)
            
            severity = CrisisLevel.HIGH if max_sadness >= self.thresholds.SADNESS_CRITICAL else CrisisLevel.MODERATE
            
            triggers.append(EmotionTrigger(
                trigger_type=EmotionTriggerType.SUSTAINED_SADNESS,
                severity=severity,
                timestamp=datetime.utcnow(),
                description=f"Sustained high sadness detected (avg: {avg_sadness:.2f}, max: {max_sadness:.2f})",
                emotion_scores={
                    "sadness_avg": avg_sadness,
                    "sadness_max": max_sadness
                },
                duration_minutes=window.get_duration_minutes(),
                confidence=max_sadness
            ))
        
        # Check sustained fear
        if window.is_sustained_above_threshold(
            EmotionReading.FEAR_KEY,
            self.thresholds.FEAR_HIGH,
            self.SUSTAINED_WINDOW_MINUTES
        ):
            avg_fear = window.get_average_emotion(EmotionReading.FEAR_KEY)
            max_fear = window.get_max_emotion(EmotionReading.FEAR_KEY)
            
            severity = CrisisLevel.HIGH if max_fear >= self.thresholds.FEAR_CRITICAL else CrisisLevel.MODERATE
            
            triggers.append(EmotionTrigger(
                trigger_type=EmotionTriggerType.SUSTAINED_FEAR,
                severity=severity,
                timestamp=datetime.utcnow(),
                description=f"Sustained high fear detected (avg: {avg_fear:.2f}, max: {max_fear:.2f})",
                emotion_scores={
                    "fear_avg": avg_fear,
                    "fear_max": max_fear
                },
                duration_minutes=window.get_duration_minutes(),
                confidence=max_fear
            ))
        
        # Check sustained distress
        if window.is_sustained_above_threshold(
            EmotionReading.DISTRESS_KEY,
            self.thresholds.DISTRESS_HIGH,
            self.SUSTAINED_WINDOW_MINUTES
        ):
            avg_distress = window.get_average_emotion(EmotionReading.DISTRESS_KEY)
            max_distress = window.get_max_emotion(EmotionReading.DISTRESS_KEY)
            
            severity = CrisisLevel.HIGH if max_distress >= self.thresholds.DISTRESS_CRITICAL else CrisisLevel.MODERATE
            
            triggers.append(EmotionTrigger(
                trigger_type=EmotionTriggerType.SUSTAINED_DISTRESS,
                severity=severity,
                timestamp=datetime.utcnow(),
                description=f"Sustained high distress detected (avg: {avg_distress:.2f}, max: {max_distress:.2f})",
                emotion_scores={
                    "distress_avg": avg_distress,
                    "distress_max": max_distress
                },
                duration_minutes=window.get_duration_minutes(),
                confidence=max_distress
            ))
        
        return triggers
    
    def _check_combined_emotions(
        self, 
        user_id: str, 
        reading: EmotionReading
    ) -> List[EmotionTrigger]:
        """Check for dangerous combinations of emotions."""
        triggers = []
        
        # Check for sustained sadness + fear combination (hopelessness indicator)
        sadness = reading.sadness
        fear = reading.fear
        distress = reading.distress
        
        # Critical: Both sadness AND fear are high
        if (sadness >= self.thresholds.SUSTAINED_SADNESS_FEAR_THRESHOLD and 
            fear >= self.thresholds.SUSTAINED_SADNESS_FEAR_THRESHOLD):
            
            triggers.append(EmotionTrigger(
                trigger_type=EmotionTriggerType.COMBINED_NEGATIVE_EMOTIONS,
                severity=CrisisLevel.HIGH,
                timestamp=datetime.utcnow(),
                description=f"Combined high sadness ({sadness:.2f}) and fear ({fear:.2f}) - hopelessness indicator",
                emotion_scores={
                    "sadness": sadness,
                    "fear": fear,
                    "distress": distress
                },
                confidence=(sadness + fear) / 2
            ))
        
        # Critical: All three negative emotions are high
        if (sadness >= self.thresholds.HOPELESSNESS_COMBINATION["sadness"] and
            fear >= self.thresholds.HOPELESSNESS_COMBINATION["fear"] and
            distress >= self.thresholds.HOPELESSNESS_COMBINATION["distress"]):
            
            triggers.append(EmotionTrigger(
                trigger_type=EmotionTriggerType.COMBINED_NEGATIVE_EMOTIONS,
                severity=CrisisLevel.IMMEDIATE,
                timestamp=datetime.utcnow(),
                description=f"CRITICAL: Combined sadness ({sadness:.2f}), fear ({fear:.2f}), and distress ({distress:.2f})",
                emotion_scores={
                    "sadness": sadness,
                    "fear": fear,
                    "distress": distress
                },
                confidence=(sadness + fear + distress) / 3
            ))
        
        return triggers
    
    def _check_emotional_volatility(self, user_id: str) -> Optional[EmotionTrigger]:
        """Check for dangerous emotional volatility."""
        history = self.user_emotion_history.get(user_id, deque())
        
        if len(history) < 10:
            return None
        
        # Calculate volatility in recent readings
        recent_readings = list(history)[-20:]  # Last 20 readings
        
        # Check for rapid swings in sadness
        sadness_scores = [r.sadness for r in recent_readings]
        sadness_std = statistics.stdev(sadness_scores) if len(sadness_scores) > 1 else 0
        
        # High volatility in sadness can indicate instability
        if sadness_std > 0.25:  # Significant variation
            return EmotionTrigger(
                trigger_type=EmotionTriggerType.EMOTIONAL_VOLATILITY,
                severity=CrisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"High emotional volatility detected (sadness std: {sadness_std:.2f})",
                emotion_scores={"sadness_volatility": sadness_std},
                confidence=min(sadness_std * 2, 1.0)
            )
        
        return None
    
    def _check_emotional_numbness(
        self, 
        user_id: str, 
        reading: EmotionReading
    ) -> Optional[EmotionTrigger]:
        """Check for emotional numbness (very low emotion scores across the board)."""
        # Numbness: all emotions are very low
        all_emotions = reading.emotions.values()
        
        if len(all_emotions) >= 5:  # Need enough emotion readings
            avg_emotion = statistics.mean(all_emotions)
            max_emotion = max(all_emotions)
            
            # Numbness: average below 0.2 and max below 0.4
            if avg_emotion < 0.2 and max_emotion < 0.4:
                return EmotionTrigger(
                    trigger_type=EmotionTriggerType.EMOTIONAL_NUMBNESS,
                    severity=CrisisLevel.MODERATE,
                    timestamp=datetime.utcnow(),
                    description=f"Emotional numbness detected (avg: {avg_emotion:.2f}, max: {max_emotion:.2f})",
                    emotion_scores={
                        "average_all_emotions": avg_emotion,
                        "max_all_emotions": max_emotion
                    },
                    confidence=1.0 - max_emotion
                )
        
        return None
    
    def _check_sudden_shift(
        self, 
        user_id: str, 
        reading: EmotionReading
    ) -> Optional[EmotionTrigger]:
        """Check for sudden emotional shifts."""
        history = self.user_emotion_history.get(user_id, deque())
        
        if len(history) < 5:
            return None
        
        # Compare current reading to recent average
        recent = list(history)[-5:]
        recent_sadness = statistics.mean([r.sadness for r in recent])
        
        current_sadness = reading.sadness
        
        # Sudden spike in sadness
        if current_sadness - recent_sadness > 0.4:  # 40% jump
            return EmotionTrigger(
                trigger_type=EmotionTriggerType.SUDDEN_EMOTIONAL_SHIFT,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"Sudden sadness spike: {recent_sadness:.2f} -> {current_sadness:.2f}",
                emotion_scores={
                    "previous_sadness_avg": recent_sadness,
                    "current_sadness": current_sadness,
                    "shift": current_sadness - recent_sadness
                },
                confidence=current_sadness - recent_sadness
            )
        
        return None
    
    def get_emotion_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of recent emotions for a user."""
        history = self.user_emotion_history.get(user_id, deque())
        
        if not history:
            return {"status": "no_data"}
        
        recent = list(history)[-50:]  # Last 50 readings
        
        summary = {
            "status": "active",
            "reading_count": len(history),
            "time_span_hours": self.HISTORY_WINDOW_HOURS,
            "emotions": {}
        }
        
        for emotion_key in [EmotionReading.SADNESS_KEY, EmotionReading.FEAR_KEY, 
                           EmotionReading.DISTRESS_KEY, EmotionReading.ANGER_KEY]:
            scores = [r.get_emotion(emotion_key) for r in recent if emotion_key in r.emotions]
            if scores:
                summary["emotions"][emotion_key] = {
                    "average": statistics.mean(scores),
                    "max": max(scores),
                    "min": min(scores),
                    "current": scores[-1] if scores else 0
                }
        
        return summary
    
    def reset_user_data(self, user_id: str):
        """Reset all emotion data for a user (e.g., after crisis resolution)."""
        if user_id in self.user_emotion_windows:
            del self.user_emotion_windows[user_id]
        if user_id in self.user_emotion_history:
            del self.user_emotion_history[user_id]


# =============================================================================
# HUME AI INTEGRATION HELPER
# =============================================================================

class HumeAIClient:
    """
    Client for integrating with Hume AI's emotion recognition API.
    
    This is a placeholder implementation. In production, this would
    make actual API calls to Hume AI's services.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Hume AI client."""
        self.api_key = api_key
        self.base_url = "https://api.hume.ai"
    
    async def analyze_text(self, text: str) -> EmotionReading:
        """
        Analyze text for emotional content.
        
        In production, this would call Hume AI's text emotion API.
        """
        # Placeholder implementation
        # In production, make actual API call
        return EmotionReading(
            timestamp=datetime.utcnow(),
            emotions={
                "sadness": 0.0,
                "fear": 0.0,
                "distress": 0.0,
                "anger": 0.0,
                "anxiety": 0.0,
                "hopelessness": 0.0,
                "joy": 0.0,
                "calm": 0.0
            },
            source="text",
            session_id="placeholder"
        )
    
    async def analyze_voice(self, audio_data: bytes) -> EmotionReading:
        """
        Analyze voice audio for emotional content.
        
        In production, this would call Hume AI's voice emotion API.
        """
        # Placeholder implementation
        return EmotionReading(
            timestamp=datetime.utcnow(),
            emotions={
                "sadness": 0.0,
                "fear": 0.0,
                "distress": 0.0,
                "anger": 0.0,
                "anxiety": 0.0,
                "hopelessness": 0.0,
                "joy": 0.0,
                "calm": 0.0
            },
            source="voice",
            session_id="placeholder"
        )
    
    async def analyze_video(self, video_data: bytes) -> EmotionReading:
        """
        Analyze video for facial emotional expressions.
        
        In production, this would call Hume AI's facial emotion API.
        """
        # Placeholder implementation
        return EmotionReading(
            timestamp=datetime.utcnow(),
            emotions={
                "sadness": 0.0,
                "fear": 0.0,
                "distress": 0.0,
                "anger": 0.0,
                "anxiety": 0.0,
                "hopelessness": 0.0,
                "joy": 0.0,
                "calm": 0.0
            },
            source="facial",
            session_id="placeholder"
        )


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

emotion_detector = EmotionTriggerDetector()
