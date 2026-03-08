"""
MindMate AI - Crisis Detection Service
=======================================

This package provides comprehensive crisis detection capabilities for
mental health applications. It combines keyword detection, emotion
analysis, behavioral pattern recognition, and automated response
orchestration.

CRITICAL SAFETY NOTICE:
This is life-safety critical code. All components have been designed
with clinical input and should only be modified by qualified mental
health professionals in consultation with engineering.

Components:
-----------
- keywords: Crisis keyword and phrase detection
- emotion_triggers: Hume AI emotion threshold monitoring
- behavioral_triggers: Behavioral pattern analysis
- classifier: Crisis level classification
- orchestrator: Response action orchestration
- notifications: Emergency contact notification sender
- logger: Comprehensive audit logging
- service: Main service entry point

Usage:
------
    from crisis_service import CrisisDetectionService, CrisisLevel
    
    service = CrisisDetectionService()
    
    # Process a user message
    result = await service.process_user_message(
        user_id="user123",
        message="I'm having a really hard time..."
    )
    
    if result.crisis_detected:
        print(f"Crisis level: {result.classification.level}")
        print(f"Recommended action: {result.classification.recommended_response}")

Configuration:
--------------
All thresholds and settings are defined in config.py and should only
be modified after clinical review.

Emergency Resources:
--------------------
- 988 Suicide & Crisis Lifeline: Call or text 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 911 (US) / 999 (UK) / 112 (EU)
"""

# Version
__version__ = "1.0.0"
__author__ = "MindMate AI"

# Configuration
from config import (
    CrisisLevel,
    CrisisType,
    EMOTION_THRESHOLDS,
    BEHAVIORAL_THRESHOLDS,
    CLASSIFICATION_THRESHOLDS,
    RESPONSE_CONFIG,
    NOTIFICATION_CONFIG,
    LOGGING_CONFIG,
    CRISIS_RESOURCES,
)

# Keywords
from keywords import (
    CrisisKeywords,
    KeywordMatch,
    KeywordSeverity,
    crisis_keywords,
)

# Emotion Triggers
from emotion_triggers import (
    EmotionTriggerDetector,
    EmotionTrigger,
    EmotionTriggerType,
    EmotionReading,
    HumeAIClient,
    emotion_detector,
)

# Behavioral Triggers
from behavioral_triggers import (
    BehavioralTriggerDetector,
    BehavioralTrigger,
    BehavioralTriggerType,
    UserActivity,
    UserBehavioralProfile,
    behavioral_detector,
)

# Classifier
from classifier import (
    CrisisClassifier,
    CrisisClassification,
    CrisisIndicator,
    crisis_classifier,
)

# Orchestrator
from orchestrator import (
    CrisisResponseOrchestrator,
    ResponseActionType,
    ResponseAction,
    ResponseResult,
    response_orchestrator,
)

# Notifications
from notifications import (
    NotificationSender,
    NotificationRecipient,
    NotificationRecipientType,
    NotificationChannel,
    NotificationMessage,
    NotificationResult,
    notification_sender,
)

# Logger
from logger import (
    CrisisEventLogger,
    CrisisEvent,
    CrisisSession,
    EventType,
    EventOutcome,
    crisis_logger,
)

# Main Service
from service import (
    CrisisDetectionService,
    CrisisDetectionResult,
    crisis_service,
)

# Export all public components
__all__ = [
    # Version
    "__version__",
    "__author__",
    
    # Configuration
    "CrisisLevel",
    "CrisisType",
    "EMOTION_THRESHOLDS",
    "BEHAVIORAL_THRESHOLDS",
    "CLASSIFICATION_THRESHOLDS",
    "RESPONSE_CONFIG",
    "NOTIFICATION_CONFIG",
    "LOGGING_CONFIG",
    "CRISIS_RESOURCES",
    
    # Keywords
    "CrisisKeywords",
    "KeywordMatch",
    "KeywordSeverity",
    "crisis_keywords",
    
    # Emotion Triggers
    "EmotionTriggerDetector",
    "EmotionTrigger",
    "EmotionTriggerType",
    "EmotionReading",
    "HumeAIClient",
    "emotion_detector",
    
    # Behavioral Triggers
    "BehavioralTriggerDetector",
    "BehavioralTrigger",
    "BehavioralTriggerType",
    "UserActivity",
    "UserBehavioralProfile",
    "behavioral_detector",
    
    # Classifier
    "CrisisClassifier",
    "CrisisClassification",
    "CrisisIndicator",
    "crisis_classifier",
    
    # Orchestrator
    "CrisisResponseOrchestrator",
    "ResponseActionType",
    "ResponseAction",
    "ResponseResult",
    "response_orchestrator",
    
    # Notifications
    "NotificationSender",
    "NotificationRecipient",
    "NotificationRecipientType",
    "NotificationChannel",
    "NotificationMessage",
    "NotificationResult",
    "notification_sender",
    
    # Logger
    "CrisisEventLogger",
    "CrisisEvent",
    "CrisisSession",
    "EventType",
    "EventOutcome",
    "crisis_logger",
    
    # Main Service
    "CrisisDetectionService",
    "CrisisDetectionResult",
    "crisis_service",
]
