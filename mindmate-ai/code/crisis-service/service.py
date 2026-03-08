"""
Crisis Detection Service - Main Entry Point
============================================
CRITICAL SAFETY CODE for MindMate AI

This is the main service entry point for the crisis detection system.
It coordinates all detection modules, classification, and response
orchestration.

WARNING: This is life-safety critical code. All components must be
thoroughly tested and reviewed by mental health professionals.

Usage:
    from crisis_service import CrisisDetectionService
    
    service = CrisisDetectionService()
    result = await service.process_user_message(
        user_id="user123",
        message="I'm feeling really hopeless today",
        session_id="session456"
    )
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable, Awaitable
from enum import Enum

# Import all crisis detection modules
from config import CrisisLevel, CrisisType, CrisisType
from keywords import CrisisKeywords, KeywordMatch, crisis_keywords, KeywordSeverity
from emotion_triggers import (
    EmotionTriggerDetector, 
    EmotionTrigger, 
    EmotionReading,
    emotion_detector
)
from behavioral_triggers import (
    BehavioralTriggerDetector,
    BehavioralTrigger,
    UserActivity,
    behavioral_detector
)
from classifier import (
    CrisisClassifier,
    CrisisClassification,
    CrisisIndicator,
    crisis_classifier
)
from orchestrator import (
    CrisisResponseOrchestrator,
    ResponseActionType,
    ResponseResult,
    response_orchestrator
)
from notifications import (
    NotificationSender,
    NotificationRecipient,
    NotificationRecipientType,
    notification_sender
)
from logger import (
    CrisisEventLogger,
    CrisisEvent,
    EventType,
    EventOutcome,
    crisis_logger
)


@dataclass
class CrisisDetectionResult:
    """Complete result of crisis detection processing."""
    user_id: str
    timestamp: datetime
    
    # Detection results
    keyword_matches: List[KeywordMatch] = field(default_factory=list)
    emotion_triggers: List[EmotionTrigger] = field(default_factory=list)
    behavioral_triggers: List[BehavioralTrigger] = field(default_factory=list)
    
    # Classification
    classification: Optional[CrisisClassification] = None
    
    # Response
    response_results: List[ResponseResult] = field(default_factory=list)
    
    # Status
    crisis_detected: bool = False
    requires_immediate_action: bool = False
    
    # Metadata
    processing_time_ms: float = 0.0
    session_id: Optional[str] = None


class CrisisDetectionService:
    """
    Main crisis detection service that coordinates all components.
    
    This service provides a unified interface for:
    - Processing user messages for crisis indicators
    - Analyzing emotional state
    - Tracking behavioral patterns
    - Classifying crisis level
    - Orchestrating appropriate responses
    - Logging all events
    
    Example:
        service = CrisisDetectionService()
        
        # Process a user message
        result = await service.process_user_message(
            user_id="user123",
            message="I'm having thoughts of hurting myself",
            session_id="session456"
        )
        
        if result.crisis_detected:
            print(f"Crisis level: {result.classification.level.value}")
            print(f"Response: {result.classification.recommended_response}")
    """
    
    def __init__(
        self,
        keyword_detector: Optional[CrisisKeywords] = None,
        emotion_detector_instance: Optional[EmotionTriggerDetector] = None,
        behavioral_detector_instance: Optional[BehavioralTriggerDetector] = None,
        classifier: Optional[CrisisClassifier] = None,
        orchestrator: Optional[CrisisResponseOrchestrator] = None,
        notifier: Optional[NotificationSender] = None,
        logger: Optional[CrisisEventLogger] = None
    ):
        """
        Initialize the crisis detection service.
        
        Args:
            keyword_detector: Keyword detection module
            emotion_detector_instance: Emotion trigger detection module
            behavioral_detector_instance: Behavioral pattern detection module
            classifier: Crisis level classifier
            orchestrator: Response orchestrator
            notifier: Notification sender
            logger: Event logger
        """
        # Use provided instances or defaults
        self.keyword_detector = keyword_detector or crisis_keywords
        self.emotion_detector = emotion_detector_instance or emotion_detector
        self.behavioral_detector = behavioral_detector_instance or behavioral_detector
        self.classifier = classifier or crisis_classifier
        self.orchestrator = orchestrator or response_orchestrator
        self.notifier = notifier or notification_sender
        self.logger = logger or crisis_logger
        
        # Configuration
        self.enable_keyword_detection = True
        self.enable_emotion_detection = True
        self.enable_behavioral_detection = True
        self.auto_respond = True
        
        # Callbacks
        self.on_crisis_detected: Optional[Callable[[CrisisDetectionResult], Awaitable[None]]] = None
        self.on_immediate_crisis: Optional[Callable[[CrisisDetectionResult], Awaitable[None]]] = None
    
    async def process_user_message(
        self,
        user_id: str,
        message: str,
        session_id: Optional[str] = None,
        sentiment_score: Optional[float] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> CrisisDetectionResult:
        """
        Process a user message for crisis detection.
        
        This is the primary entry point for crisis detection. It analyzes
        the message text, updates behavioral tracking, and triggers
        appropriate responses if a crisis is detected.
        
        Args:
            user_id: The user identifier
            message: The user's message text
            session_id: Optional session identifier
            sentiment_score: Optional sentiment analysis score (-1 to 1)
            user_context: Additional user context
            
        Returns:
            CrisisDetectionResult with all detection and response information
        """
        start_time = datetime.utcnow()
        
        result = CrisisDetectionResult(
            user_id=user_id,
            timestamp=start_time,
            session_id=session_id
        )
        
        try:
            # Step 1: Keyword Detection
            if self.enable_keyword_detection:
                result.keyword_matches = self.keyword_detector.detect_keywords(message)
                
                if result.keyword_matches:
                    await self.logger.log_detection(
                        user_id=user_id,
                        detection_source="keyword",
                        detected_items=[m.keyword for m in result.keyword_matches],
                        raw_data={
                            "matches": [
                                {
                                    "keyword": m.keyword,
                                    "severity": m.severity.value,
                                    "category": m.category
                                }
                                for m in result.keyword_matches
                            ]
                        }
                    )
            
            # Step 2: Behavioral Pattern Update
            if self.enable_behavioral_detection:
                # Record the message
                behavioral_triggers = self.behavioral_detector.record_message(
                    user_id=user_id,
                    timestamp=start_time,
                    message_length=len(message),
                    sentiment_score=sentiment_score or 0.0,
                    response_time_hours=user_context.get("response_time_hours") if user_context else None
                )
                result.behavioral_triggers = behavioral_triggers
                
                for trigger in behavioral_triggers:
                    await self.logger.log_detection(
                        user_id=user_id,
                        detection_source="behavioral",
                        detected_items=[trigger.trigger_type.value],
                        raw_data={
                            "trigger": trigger.trigger_type.value,
                            "severity": trigger.severity.value,
                            "metrics": trigger.metrics
                        }
                    )
            
            # Step 3: Classification
            if (result.keyword_matches or 
                result.emotion_triggers or 
                result.behavioral_triggers):
                
                result.classification = self.classifier.classify(
                    user_id=user_id,
                    keyword_matches=result.keyword_matches,
                    emotion_triggers=result.emotion_triggers,
                    behavioral_triggers=result.behavioral_triggers,
                    context=user_context
                )
                
                result.crisis_detected = True
                result.requires_immediate_action = result.classification.requires_immediate_action
                
                # Log classification
                await self.logger.log_classification(
                    user_id=user_id,
                    classification=result.classification,
                    session_id=session_id
                )
            
            # Step 4: Response Orchestration
            if result.crisis_detected and self.auto_respond:
                result.response_results = await self.orchestrator.orchestrate_response(
                    user_id=user_id,
                    classification=result.classification,
                    user_context=user_context
                )
                
                # Log response
                await self.logger.log_response(
                    user_id=user_id,
                    response_type=result.classification.recommended_response,
                    actions_taken=[r.action_type.value for r in result.response_results],
                    outcome=EventOutcome.SUCCESS if all(r.success for r in result.response_results) else EventOutcome.PARTIAL,
                    session_id=session_id
                )
                
                # Send notifications if needed
                if result.classification.level in [CrisisLevel.IMMEDIATE, CrisisLevel.HIGH]:
                    await self._send_notifications(
                        user_id=user_id,
                        classification=result.classification,
                        user_context=user_context
                    )
            
            # Step 5: Callbacks
            if result.crisis_detected and self.on_crisis_detected:
                await self.on_crisis_detected(result)
            
            if result.requires_immediate_action and self.on_immediate_crisis:
                await self.on_immediate_crisis(result)
            
        except Exception as e:
            # Log the error
            await self.logger.log_error(
                user_id=user_id,
                error_type="processing_error",
                error_message=str(e),
                context={
                    "message_length": len(message),
                    "session_id": session_id
                }
            )
            raise
        
        finally:
            # Calculate processing time
            end_time = datetime.utcnow()
            result.processing_time_ms = (end_time - start_time).total_seconds() * 1000
        
        return result
    
    async def process_emotion_reading(
        self,
        user_id: str,
        emotion_reading: EmotionReading,
        user_context: Optional[Dict[str, Any]] = None
    ) -> CrisisDetectionResult:
        """
        Process an emotion reading from Hume AI.
        
        Args:
            user_id: The user identifier
            emotion_reading: The emotion reading from Hume AI
            user_context: Additional user context
            
        Returns:
            CrisisDetectionResult with detection and response information
        """
        start_time = datetime.utcnow()
        
        result = CrisisDetectionResult(
            user_id=user_id,
            timestamp=start_time
        )
        
        try:
            # Process emotion reading
            emotion_triggers = self.emotion_detector.process_emotion_reading(
                user_id=user_id,
                reading=emotion_reading
            )
            result.emotion_triggers = emotion_triggers
            
            for trigger in emotion_triggers:
                await self.logger.log_detection(
                    user_id=user_id,
                    detection_source="emotion",
                    detected_items=[trigger.trigger_type.value],
                    raw_data={
                        "trigger": trigger.trigger_type.value,
                        "severity": trigger.severity.value,
                        "emotion_scores": trigger.emotion_scores,
                        "duration_minutes": trigger.duration_minutes
                    }
                )
            
            # Classify if triggers detected
            if emotion_triggers:
                result.classification = self.classifier.classify(
                    user_id=user_id,
                    keyword_matches=[],
                    emotion_triggers=emotion_triggers,
                    behavioral_triggers=[],
                    context=user_context
                )
                
                result.crisis_detected = True
                result.requires_immediate_action = result.classification.requires_immediate_action
                
                # Log classification
                await self.logger.log_classification(
                    user_id=user_id,
                    classification=result.classification
                )
                
                # Orchestrate response
                if self.auto_respond:
                    result.response_results = await self.orchestrator.orchestrate_response(
                        user_id=user_id,
                        classification=result.classification,
                        user_context=user_context
                    )
                    
                    # Send notifications if needed
                    if result.classification.level in [CrisisLevel.IMMEDIATE, CrisisLevel.HIGH]:
                        await self._send_notifications(
                            user_id=user_id,
                            classification=result.classification,
                            user_context=user_context
                        )
            
        except Exception as e:
            await self.logger.log_error(
                user_id=user_id,
                error_type="emotion_processing_error",
                error_message=str(e)
            )
            raise
        
        finally:
            end_time = datetime.utcnow()
            result.processing_time_ms = (end_time - start_time).total_seconds() * 1000
        
        return result
    
    async def record_session_end(
        self,
        user_id: str,
        session_id: str,
        start_time: datetime,
        end_time: datetime,
        message_count: int
    ) -> List[BehavioralTrigger]:
        """
        Record the end of a chat session.
        
        Args:
            user_id: The user identifier
            session_id: The session identifier
            start_time: Session start time
            end_time: Session end time
            message_count: Number of messages in session
            
        Returns:
            List of any behavioral triggers detected
        """
        triggers = self.behavioral_detector.record_session(
            user_id=user_id,
            start_time=start_time,
            end_time=end_time,
            message_count=message_count
        )
        
        for trigger in triggers:
            await self.logger.log_detection(
                user_id=user_id,
                detection_source="behavioral",
                detected_items=[trigger.trigger_type.value],
                raw_data={"trigger": trigger.trigger_type.value}
            )
        
        return triggers
    
    async def _send_notifications(
        self,
        user_id: str,
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ):
        """Send notifications for high-severity crises."""
        recipients = []
        
        # Add caregiver if available
        if user_context and user_context.get("caregiver_contact"):
            contact = user_context.get("caregiver_contact")
            recipients.append(NotificationRecipient(
                recipient_type=NotificationRecipientType.CAREGIVER,
                name=contact.get("name", "Caregiver"),
                phone=contact.get("phone"),
                email=contact.get("email"),
                is_primary=True
            ))
        
        # Add crisis counselor
        recipients.append(NotificationRecipient(
            recipient_type=NotificationRecipientType.CRISIS_COUNSELOR,
            name="Crisis Counselor",
            phone=user_context.get("crisis_hotline") if user_context else None,
            webhook_url=user_context.get("counselor_webhook") if user_context else None
        ))
        
        # Send notifications
        for recipient in recipients:
            try:
                results = await self.notifier.send_crisis_notification(
                    user_id=user_id,
                    recipient=recipient,
                    crisis_level=classification.level,
                    crisis_type=classification.crisis_type,
                    details={
                        "indicators": classification.indicators,
                        "classification_reason": classification.classification_reason
                    },
                    user_context=user_context
                )
                
                # Log notification results
                for result in results:
                    await self.logger.log_notification(
                        user_id=user_id,
                        recipient_type=recipient.recipient_type.value,
                        recipient_contact=getattr(recipient, result.channel.value, "unknown"),
                        channel=result.channel.value,
                        success=result.success,
                        message=result.message
                    )
                    
            except Exception as e:
                await self.logger.log_error(
                    user_id=user_id,
                    error_type="notification_error",
                    error_message=str(e),
                    context={"recipient": recipient.name}
                )
    
    def quick_screen_text(self, text: str) -> Dict[str, Any]:
        """
        Quick screening of text for crisis indicators.
        
        This is a lightweight synchronous method for rapid screening
        without full processing.
        
        Args:
            text: The text to screen
            
        Returns:
            Dictionary with screening results
        """
        matches = self.keyword_detector.detect_keywords(text)
        
        if not matches:
            return {
                "crisis_detected": False,
                "level": None,
                "keywords_found": []
            }
        
        highest_severity = self.keyword_detector.get_highest_severity(matches)
        
        level_map = {
            KeywordSeverity.CRITICAL: CrisisLevel.IMMEDIATE,
            KeywordSeverity.HIGH: CrisisLevel.HIGH,
            KeywordSeverity.MODERATE: CrisisLevel.MODERATE,
            KeywordSeverity.LOW: CrisisLevel.LOW_CONCERN
        }
        
        return {
            "crisis_detected": True,
            "level": level_map.get(highest_severity, CrisisLevel.LOW_CONCERN).value,
            "keywords_found": [
                {
                    "keyword": m.keyword,
                    "severity": m.severity.value,
                    "category": m.category
                }
                for m in matches[:5]  # Top 5 matches
            ]
        }
    
    def get_user_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get the current crisis detection status for a user.
        
        Args:
            user_id: The user identifier
            
        Returns:
            Dictionary with user status information
        """
        # Get behavioral summary
        behavioral_summary = self.behavioral_detector.get_behavioral_summary(user_id)
        
        # Get emotion summary
        emotion_summary = self.emotion_detector.get_emotion_summary(user_id)
        
        # Get crisis history
        crisis_history = self.logger.get_user_crisis_history(user_id)
        
        # Get recent classifications
        recent_classifications = self.classifier.get_classification_history(user_id)
        
        return {
            "user_id": user_id,
            "behavioral": behavioral_summary,
            "emotional": emotion_summary,
            "crisis_history": crisis_history,
            "recent_classifications": [
                {
                    "level": c.level.value,
                    "type": c.crisis_type.value,
                    "timestamp": c.timestamp.isoformat(),
                    "score": c.total_score
                }
                for c in recent_classifications[-5:]  # Last 5
            ],
            "active_crisis_sessions": len(self.logger.get_active_sessions())
        }
    
    async def establish_user_baseline(self, user_id: str) -> bool:
        """
        Establish behavioral baseline for a user.
        
        Args:
            user_id: The user identifier
            
        Returns:
            True if baseline was established
        """
        return self.behavioral_detector.establish_baseline(user_id)
    
    def reset_user_data(self, user_id: str):
        """
        Reset all crisis detection data for a user.
        
        This should be called when a user account is deleted or
        when explicitly requested by the user.
        
        Args:
            user_id: The user identifier
        """
        self.emotion_detector.reset_user_data(user_id)
        self.behavioral_detector.reset_user_data(user_id)
        self.orchestrator.clear_response_history(user_id)


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

crisis_service = CrisisDetectionService()
