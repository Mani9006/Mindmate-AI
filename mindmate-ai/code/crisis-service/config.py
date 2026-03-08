"""
Crisis Detection Service Configuration
======================================
CRITICAL SAFETY CONFIGURATION for MindMate AI

This module contains all configuration constants for the crisis detection system.
ALL thresholds and settings are based on clinical best practices for
mental health crisis intervention.

WARNING: Modifying these values may impact user safety. Changes should only
be made by qualified mental health professionals in consultation with engineering.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional


class CrisisLevel(Enum):
    """
    Crisis severity levels.
    
    Levels are ordered from lowest to highest severity.
    """
    LOW_CONCERN = "low_concern"
    MODERATE = "moderate"
    HIGH = "high"
    IMMEDIATE = "immediate"


class CrisisType(Enum):
    """Types of crisis that can be detected."""
    SUICIDAL_IDEATION = "suicidal_ideation"
    SELF_HARM = "self_harm"
    HOPELESSNESS = "hopelessness"
    EMOTIONAL_DISTRESS = "emotional_distress"
    BEHAVIORAL_WITHDRAWAL = "behavioral_withdrawal"
    COMBINED_RISK = "combined_risk"


# =============================================================================
# EMOTION THRESHOLD CONFIGURATION (Hume AI Integration)
# =============================================================================

@dataclass
class EmotionThresholds:
    """Thresholds for Hume AI emotion detection."""
    
    # Individual emotion thresholds (0.0 - 1.0 scale)
    SADNESS_HIGH: float = 0.75
    SADNESS_CRITICAL: float = 0.90
    
    FEAR_HIGH: float = 0.70
    FEAR_CRITICAL: float = 0.85
    
    ANGER_HIGH: float = 0.75
    ANGER_CRITICAL: float = 0.90
    
    DISTRESS_HIGH: float = 0.75
    DISTRESS_CRITICAL: float = 0.90
    
    # Combined emotion thresholds
    SUSTAINED_SADNESS_FEAR_THRESHOLD: float = 0.70  # Both sadness AND fear above this
    SUSTAINED_DURATION_MINUTES: int = 10  # Minimum duration for "sustained"
    
    # Hopelessness detection
    HOPELESSNESS_COMBINATION: Dict[str, float] = None
    
    def __post_init__(self):
        self.HOPELESSNESS_COMBINATION = {
            "sadness": 0.65,
            "fear": 0.55,
            "distress": 0.60
        }


# =============================================================================
# BEHAVIORAL PATTERN CONFIGURATION
# =============================================================================

@dataclass
class BehavioralThresholds:
    """Thresholds for behavioral pattern detection."""
    
    # Withdrawal detection
    MISSED_DAYS_CRITICAL: int = 5  # 5+ consecutive days missed
    MISSED_DAYS_WARNING: int = 3   # 3+ consecutive days missed
    
    # Message pattern changes
    MESSAGE_LENGTH_DROP_PERCENT: float = 0.70  # 70% reduction in message length
    MESSAGE_FREQUENCY_DROP_PERCENT: float = 0.60  # 60% reduction in frequency
    
    # Response time changes (in hours)
    RESPONSE_TIME_INCREASE_HOURS: float = 24.0  # 24+ hour increase in response time
    
    # Sentiment trend detection
    SENTIMENT_DROP_WINDOW_DAYS: int = 7  # Look at 7-day window
    SENTIMENT_DROP_THRESHOLD: float = -0.5  # 0.5 point drop in sentiment score
    
    # Activity pattern changes
    ACTIVITY_REDUCTION_DAYS: int = 5
    ACTIVITY_REDUCTION_PERCENT: float = 0.50  # 50% reduction in activity


# =============================================================================
# CLASSIFICATION SCORING CONFIGURATION
# =============================================================================

@dataclass
class ClassificationThresholds:
    """Scoring thresholds for crisis level classification."""
    
    # Base scores for different indicators
    KEYWORD_CRITICAL_SCORE: int = 50
    KEYWORD_HIGH_SCORE: int = 30
    KEYWORD_MODERATE_SCORE: int = 15
    KEYWORD_LOW_SCORE: int = 5
    
    EMOTION_CRITICAL_SCORE: int = 40
    EMOTION_HIGH_SCORE: int = 25
    EMOTION_MODERATE_SCORE: int = 10
    
    BEHAVIORAL_CRITICAL_SCORE: int = 35
    BEHAVIORAL_HIGH_SCORE: int = 20
    BEHAVIORAL_MODERATE_SCORE: int = 10
    
    # Level thresholds (cumulative score)
    IMMEDIATE_THRESHOLD: int = 80
    HIGH_THRESHOLD: int = 50
    MODERATE_THRESHOLD: int = 25
    
    # Multipliers for combined risk
    COMBINED_RISK_MULTIPLIER: float = 1.5
    REPEATED_INDICATOR_MULTIPLIER: float = 1.3


# =============================================================================
# RESPONSE ORCHESTRATION CONFIGURATION
# =============================================================================

@dataclass
class ResponseConfig:
    """Configuration for crisis response actions."""
    
    # Immediate level response
    IMMEDIATE_CONTACT_EMERGENCY: bool = True
    IMMEDIATE_CONTACT_CAREGIVER: bool = True
    IMMEDIATE_HUMAN_REVIEW: bool = True
    IMMEDIATE_RESOURCES_SHOWN: bool = True
    IMMEDIATE_CHAT_RESTRICTED: bool = True
    
    # High level response
    HIGH_CONTACT_CAREGIVER: bool = True
    HIGH_HUMAN_REVIEW: bool = True
    HIGH_RESOURCES_SHOWN: bool = True
    HIGH_CHAT_WARNING: bool = True
    
    # Moderate level response
    MODERATE_RESOURCES_SHOWN: bool = True
    MODERATE_CHECK_IN_PROMPT: bool = True
    MODERATE_CAREGIVER_NOTIFY: bool = False  # Configurable per user
    
    # Low concern response
    LOW_SUBTLE_CHECK_IN: bool = True
    LOW_MOOD_TRACKING: bool = True


# =============================================================================
# NOTIFICATION CONFIGURATION
# =============================================================================

@dataclass
class NotificationConfig:
    """Configuration for emergency notifications."""
    
    # SMS Configuration
    SMS_ENABLED: bool = True
    SMS_FROM_NUMBER: str = "+1-800-MINDMATE"  # Placeholder
    
    # Email Configuration
    EMAIL_ENABLED: bool = True
    EMAIL_FROM: str = "crisis-alert@mindmate.ai"
    
    # Push Notification
    PUSH_ENABLED: bool = True
    
    # Retry configuration
    MAX_RETRY_ATTEMPTS: int = 3
    RETRY_DELAY_SECONDS: int = 30
    
    # Rate limiting
    MAX_NOTIFICATIONS_PER_HOUR: int = 5
    NOTIFICATION_COOLDOWN_MINUTES: Dict[CrisisLevel, int] = None
    
    def __post_init__(self):
        self.NOTIFICATION_COOLDOWN_MINUTES = {
            CrisisLevel.IMMEDIATE: 0,    # No cooldown for immediate
            CrisisLevel.HIGH: 30,        # 30 min cooldown for high
            CrisisLevel.MODERATE: 120,   # 2 hour cooldown for moderate
            CrisisLevel.LOW_CONCERN: 1440  # 24 hour cooldown for low
        }


# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

@dataclass
class LoggingConfig:
    """Configuration for crisis event logging."""
    
    # Log retention (days)
    AUDIT_LOG_RETENTION_DAYS: int = 2555  # 7 years for compliance
    EVENT_LOG_RETENTION_DAYS: int = 365   # 1 year for events
    
    # Log levels
    LOG_ALL_DETECTIONS: bool = True
    LOG_EMOTION_DATA: bool = True
    LOG_BEHAVIORAL_PATTERNS: bool = True
    
    # Privacy settings
    ANONYMIZE_AFTER_DAYS: int = 2555  # 7 years
    PII_MASKING_ENABLED: bool = True
    
    # Export settings
    EXPORT_FORMAT: str = "json"
    COMPRESS_OLD_LOGS: bool = True


# =============================================================================
# RESOURCE LINKS CONFIGURATION
# =============================================================================

CRISIS_RESOURCES = {
    "us": {
        "988_suicide_crisis_lifeline": {
            "name": "988 Suicide & Crisis Lifeline",
            "phone": "988",
            "text": "988",
            "chat": "https://988lifeline.org/chat",
            "description": "24/7, free and confidential support for people in distress"
        },
        "crisis_text_line": {
            "name": "Crisis Text Line",
            "text": "HOME to 741741",
            "description": "Free, 24/7 crisis counseling via text message"
        },
        "emergency_services": {
            "name": "Emergency Services",
            "phone": "911",
            "description": "For immediate life-threatening emergencies"
        }
    },
    "uk": {
        "samaritans": {
            "name": "Samaritans",
            "phone": "116 123",
            "email": "jo@samaritans.org",
            "description": "24/7 helpline for anyone in emotional distress"
        },
        "nhs_111": {
            "name": "NHS 111",
            "phone": "111",
            "description": "Non-emergency medical advice"
        },
        "emergency_services": {
            "name": "Emergency Services",
            "phone": "999",
            "description": "For immediate life-threatening emergencies"
        }
    },
    "ca": {
        "talk_suicide_canada": {
            "name": "Talk Suicide Canada",
            "phone": "1-833-456-4566",
            "text": "45645",
            "description": "24/7 suicide prevention and support"
        },
        "emergency_services": {
            "name": "Emergency Services",
            "phone": "911",
            "description": "For immediate life-threatening emergencies"
        }
    },
    "au": {
        "lifeline": {
            "name": "Lifeline Australia",
            "phone": "13 11 14",
            "chat": "https://www.lifeline.org.au/crisis-chat",
            "description": "24/7 crisis support and suicide prevention"
        },
        "emergency_services": {
            "name": "Emergency Services",
            "phone": "000",
            "description": "For immediate life-threatening emergencies"
        }
    }
}


# =============================================================================
# INSTANTIATE CONFIGURATION OBJECTS
# =============================================================================

EMOTION_THRESHOLDS = EmotionThresholds()
BEHAVIORAL_THRESHOLDS = BehavioralThresholds()
CLASSIFICATION_THRESHOLDS = ClassificationThresholds()
RESPONSE_CONFIG = ResponseConfig()
NOTIFICATION_CONFIG = NotificationConfig()
LOGGING_CONFIG = LoggingConfig()
