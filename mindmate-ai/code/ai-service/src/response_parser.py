"""
MindMate AI - Response Parser
Parse AI responses to extract task assignments, crisis signals, and other structured data.
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

from config.settings import settings
from config.logging_config import logger
from src.models import (
    TaskAssignment,
    TaskType,
    CrisisSignal,
    CrisisLevel,
    EmotionType
)


@dataclass
class ParsedResponse:
    """Parsed AI response with extracted structured data."""
    clean_message: str
    tasks: List[TaskAssignment]
    crisis_signal: CrisisSignal
    metadata: Dict[str, Any]


class TaskExtractor:
    """Extract task assignments from AI responses."""
    
    # Task type mapping from markers to enum
    TASK_TYPE_MAP = {
        "mood_tracking": TaskType.MOOD_TRACKING,
        "journaling": TaskType.JOURNALING,
        "breathing_exercise": TaskType.BREATHING_EXERCISE,
        "meditation": TaskType.MEDITATION,
        "gratitude_practice": TaskType.GRATITUDE_PRACTICE,
        "cognitive_reframing": TaskType.COGNITIVE_REFRAMING,
        "behavioral_activation": TaskType.BEHAVIORAL_ACTIVATION,
        "sleep_hygiene": TaskType.SLEEP_HYGIENE,
        "social_connection": TaskType.SOCIAL_CONNECTION,
        "professional_help": TaskType.PROFESSIONAL_HELP,
    }
    
    # Task descriptions for auto-generation
    TASK_DESCRIPTIONS = {
        TaskType.MOOD_TRACKING: "Track your mood throughout the day to identify patterns.",
        TaskType.JOURNALING: "Write about your thoughts and feelings in a journal.",
        TaskType.BREATHING_EXERCISE: "Practice deep breathing to calm your mind and body.",
        TaskType.MEDITATION: "Take time for mindful meditation and present-moment awareness.",
        TaskType.GRATITUDE_PRACTICE: "Reflect on things you're grateful for today.",
        TaskType.COGNITIVE_REFRAMING: "Practice identifying and challenging negative thought patterns.",
        TaskType.BEHAVIORAL_ACTIVATION: "Engage in an activity that brings you joy or fulfillment.",
        TaskType.SLEEP_HYGIENE: "Practice good sleep habits for better rest.",
        TaskType.SOCIAL_CONNECTION: "Reach out to someone you care about.",
        TaskType.PROFESSIONAL_HELP: "Consider speaking with a mental health professional.",
    }
    
    TASK_TITLES = {
        TaskType.MOOD_TRACKING: "Daily Mood Check-in",
        TaskType.JOURNALING: "Reflective Journaling",
        TaskType.BREATHING_EXERCISE: "Calming Breath Work",
        TaskType.MEDITATION: "Mindful Meditation",
        TaskType.GRATITUDE_PRACTICE: "Gratitude Reflection",
        TaskType.COGNITIVE_REFRAMING: "Thought Reframing Practice",
        TaskType.BEHAVIORAL_ACTIVATION: "Joyful Activity",
        TaskType.SLEEP_HYGIENE: "Sleep Wellness",
        TaskType.SOCIAL_CONNECTION: "Meaningful Connection",
        TaskType.PROFESSIONAL_HELP: "Professional Support",
    }
    
    # Regex patterns for task markers
    TASK_PATTERN = re.compile(
        r'\[TASK:\s*([a-z_]+)\s*\]',
        re.IGNORECASE
    )
    
    def extract_tasks(self, message: str) -> Tuple[str, List[TaskAssignment]]:
        """
        Extract task markers from message.
        
        Args:
            message: AI response message
            
        Returns:
            Tuple of (clean_message, list of tasks)
        """
        tasks = []
        clean_message = message
        
        # Find all task markers
        matches = list(self.TASK_PATTERN.finditer(message))
        
        for match in matches:
            task_type_str = match.group(1).lower()
            task_type = self.TASK_TYPE_MAP.get(task_type_str)
            
            if task_type:
                task = TaskAssignment(
                    task_type=task_type,
                    title=self.TASK_TITLES.get(task_type, "Suggested Activity"),
                    description=self.TASK_DESCRIPTIONS.get(task_type, ""),
                    rationale="Suggested based on our conversation",
                    difficulty="medium"
                )
                tasks.append(task)
                
                logger.info(
                    f"Extracted task: {task_type.value}",
                    extra={"task_type": task_type.value}
                )
        
        # Remove task markers from message
        clean_message = self.TASK_PATTERN.sub('', message).strip()
        
        return clean_message, tasks
    
    def detect_implicit_tasks(
        self, 
        message: str, 
        emotion_context: Optional[Dict[str, Any]] = None
    ) -> List[TaskAssignment]:
        """
        Detect implicit task suggestions in the message.
        
        Args:
            message: AI response message
            emotion_context: Optional emotion context for smarter detection
            
        Returns:
            List of detected implicit tasks
        """
        tasks = []
        message_lower = message.lower()
        
        # Keywords that suggest tasks
        task_keywords = {
            TaskType.BREATHING_EXERCISE: [
                "take a deep breath", "breathe in", "breathing exercise",
                "try breathing", "deep breathing"
            ],
            TaskType.MEDITATION: [
                "meditate", "mindfulness", "sit quietly", "clear your mind"
            ],
            TaskType.JOURNALING: [
                "write about", "journal", "put your thoughts on paper"
            ],
            TaskType.GRATITUDE_PRACTICE: [
                "grateful for", "gratitude", "appreciate what you have"
            ],
            TaskType.MOOD_TRACKING: [
                "track your mood", "notice how you feel", "pay attention to your emotions"
            ],
            TaskType.SOCIAL_CONNECTION: [
                "reach out to", "call a friend", "talk to someone"
            ],
        }
        
        for task_type, keywords in task_keywords.items():
            for keyword in keywords:
                if keyword in message_lower:
                    # Check if not already explicitly marked
                    if not any(t.task_type == task_type for t in tasks):
                        task = TaskAssignment(
                            task_type=task_type,
                            title=self.TASK_TITLES.get(task_type, "Suggested Activity"),
                            description=self.TASK_DESCRIPTIONS.get(task_type, ""),
                            rationale="Detected from conversation context",
                            difficulty="medium"
                        )
                        tasks.append(task)
                        break
        
        return tasks


class CrisisDetector:
    """Detect crisis signals in user messages and AI responses."""
    
    # Crisis keywords with severity weights
    CRISIS_KEYWORDS = {
        # Critical - immediate attention required
        "suicide": 1.0,
        "kill myself": 1.0,
        "end my life": 1.0,
        "want to die": 0.95,
        "better off dead": 0.95,
        "no reason to live": 0.9,
        "can't go on": 0.9,
        
        # High - serious concern
        "hurt myself": 0.85,
        "self-harm": 0.85,
        "cutting myself": 0.85,
        "overdose": 0.85,
        "end it all": 0.8,
        "don't want to exist": 0.8,
        
        # Medium - monitor closely
        "hopeless": 0.6,
        "worthless": 0.6,
        "can't take it": 0.55,
        "giving up": 0.55,
        "no point": 0.5,
        "empty inside": 0.5,
        
        # Low - general concern
        "depressed": 0.3,
        "anxious": 0.2,
        "stressed": 0.15,
        "overwhelmed": 0.2,
    }
    
    # Crisis marker pattern in AI responses
    CRISIS_PATTERN = re.compile(
        r'\[CRISIS:\s*(low|medium|high|critical)\s*\]',
        re.IGNORECASE
    )
    
    # Crisis resources
    CRISIS_RESOURCES = [
        {
            "name": "988 Suicide & Crisis Lifeline",
            "contact": "Call or Text 988",
            "url": "https://988lifeline.org"
        },
        {
            "name": "Crisis Text Line",
            "contact": "Text HOME to 741741",
            "url": "https://www.crisistextline.org"
        },
        {
            "name": "International Association for Suicide Prevention",
            "contact": "Find crisis centers worldwide",
            "url": "https://www.iasp.info/resources/Crisis_Centres/"
        },
        {
            "name": "Emergency Services",
            "contact": "Call 911 (US) or your local emergency number",
            "url": ""
        }
    ]
    
    def detect_crisis_in_message(self, message: str) -> CrisisSignal:
        """
        Detect crisis signals in a user message.
        
        Args:
            message: User message to analyze
            
        Returns:
            CrisisSignal with detection results
        """
        message_lower = message.lower()
        detected_keywords = []
        max_score = 0.0
        
        for keyword, weight in self.CRISIS_KEYWORDS.items():
            if keyword in message_lower:
                detected_keywords.append(keyword)
                max_score = max(max_score, weight)
        
        # Determine crisis level
        if max_score >= 0.9:
            level = CrisisLevel.CRITICAL
        elif max_score >= 0.7:
            level = CrisisLevel.HIGH
        elif max_score >= 0.5:
            level = CrisisLevel.MEDIUM
        elif max_score >= 0.3:
            level = CrisisLevel.LOW
        else:
            level = CrisisLevel.NONE
        
        requires_immediate = level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]
        
        return CrisisSignal(
            detected=len(detected_keywords) > 0,
            level=level,
            confidence=max_score,
            keywords_detected=detected_keywords,
            recommended_action=self._get_recommended_action(level),
            resources=self.CRISIS_RESOURCES if level in [CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL] else [],
            requires_immediate_attention=requires_immediate
        )
    
    def extract_crisis_marker(self, message: str) -> Tuple[str, Optional[CrisisSignal]]:
        """
        Extract crisis marker from AI response.
        
        Args:
            message: AI response message
            
        Returns:
            Tuple of (clean_message, crisis_signal or None)
        """
        match = self.CRISIS_PATTERN.search(message)
        
        if match:
            level_str = match.group(1).lower()
            level = CrisisLevel(level_str)
            
            crisis_signal = CrisisSignal(
                detected=True,
                level=level,
                confidence=0.8 if level == CrisisLevel.LOW else 0.9,
                keywords_detected=[],
                recommended_action=self._get_recommended_action(level),
                resources=self.CRISIS_RESOURCES if level in [CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL] else [],
                requires_immediate_attention=level in [CrisisLevel.HIGH, CrisisLevel.CRITICAL]
            )
            
            # Remove marker from message
            clean_message = self.CRISIS_PATTERN.sub('', message).strip()
            
            return clean_message, crisis_signal
        
        return message, None
    
    def _get_recommended_action(self, level: CrisisLevel) -> Optional[str]:
        """Get recommended action based on crisis level."""
        actions = {
            CrisisLevel.CRITICAL: (
                "This appears to be a mental health emergency. "
                "Please contact emergency services (911) or go to the nearest emergency room. "
                "You can also call or text 988 for immediate support."
            ),
            CrisisLevel.HIGH: (
                "Please reach out to a mental health professional or crisis counselor immediately. "
                "Call or text 988, or text HOME to 741741. "
                "You don't have to go through this alone."
            ),
            CrisisLevel.MEDIUM: (
                "Consider speaking with a mental health professional. "
                "You can call 988 or text HOME to 741741 for support. "
                "Talking to someone you trust can also help."
            ),
            CrisisLevel.LOW: (
                "It might be helpful to talk to someone about how you're feeling. "
                "Consider reaching out to a friend, family member, or counselor."
            ),
            CrisisLevel.NONE: None
        }
        return actions.get(level)


class ResponseParser:
    """Main response parser that coordinates all extraction."""
    
    def __init__(self):
        self.task_extractor = TaskExtractor()
        self.crisis_detector = CrisisDetector()
    
    def parse_response(
        self, 
        ai_response: str,
        user_message: Optional[str] = None,
        detect_implicit_tasks: bool = True
    ) -> ParsedResponse:
        """
        Parse AI response and extract all structured data.
        
        Args:
            ai_response: Raw AI response
            user_message: Original user message (for context)
            detect_implicit_tasks: Whether to detect implicit tasks
            
        Returns:
            ParsedResponse with all extracted data
        """
        message = ai_response
        all_tasks = []
        
        # Extract explicit tasks
        message, explicit_tasks = self.task_extractor.extract_tasks(message)
        all_tasks.extend(explicit_tasks)
        
        # Detect implicit tasks if enabled
        if detect_implicit_tasks and len(all_tasks) == 0:
            implicit_tasks = self.task_extractor.detect_implicit_tasks(message)
            all_tasks.extend(implicit_tasks)
        
        # Extract crisis marker from AI response
        message, ai_crisis = self.crisis_detector.extract_crisis_marker(message)
        
        # Also check user message for crisis signals
        user_crisis = None
        if user_message:
            user_crisis = self.crisis_detector.detect_crisis_in_message(user_message)
        
        # Use the higher severity crisis signal
        crisis_signal = self._merge_crisis_signals(ai_crisis, user_crisis)
        
        # Clean up message (remove extra whitespace)
        clean_message = ' '.join(message.split())
        
        # Compile metadata
        metadata = {
            "original_length": len(ai_response),
            "clean_length": len(clean_message),
            "tasks_extracted": len(all_tasks),
            "crisis_detected": crisis_signal.detected,
            "crisis_level": crisis_signal.level.value if crisis_signal.detected else None,
            "processing_timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(
            "Response parsed",
            extra={
                "tasks_count": len(all_tasks),
                "crisis_detected": crisis_signal.detected,
                "crisis_level": crisis_signal.level.value
            }
        )
        
        return ParsedResponse(
            clean_message=clean_message,
            tasks=all_tasks,
            crisis_signal=crisis_signal,
            metadata=metadata
        )
    
    def _merge_crisis_signals(
        self, 
        ai_crisis: Optional[CrisisSignal], 
        user_crisis: Optional[CrisisSignal]
    ) -> CrisisSignal:
        """Merge two crisis signals, keeping the more severe one."""
        if ai_crisis is None and user_crisis is None:
            return CrisisSignal(detected=False, level=CrisisLevel.NONE)
        
        if ai_crisis is None:
            return user_crisis
        
        if user_crisis is None:
            return ai_crisis
        
        # Compare severity levels
        severity_order = [
            CrisisLevel.NONE,
            CrisisLevel.LOW,
            CrisisLevel.MEDIUM,
            CrisisLevel.HIGH,
            CrisisLevel.CRITICAL
        ]
        
        ai_severity = severity_order.index(ai_crisis.level)
        user_severity = severity_order.index(user_crisis.level)
        
        if user_severity >= ai_severity:
            return user_crisis
        return ai_crisis
    
    def quick_crisis_check(self, message: str) -> bool:
        """Quick check if message contains potential crisis indicators."""
        crisis = self.crisis_detector.detect_crisis_in_message(message)
        return crisis.detected and crisis.level in [CrisisLevel.MEDIUM, CrisisLevel.HIGH, CrisisLevel.CRITICAL]


# Singleton instance
_response_parser: Optional[ResponseParser] = None


def get_response_parser() -> ResponseParser:
    """Get singleton response parser."""
    global _response_parser
    if _response_parser is None:
        _response_parser = ResponseParser()
    return _response_parser
