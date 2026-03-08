"""
Crisis Response Orchestrator Module
====================================
CRITICAL SAFETY CODE for MindMate AI

This module orchestrates the appropriate response actions based on
the classified crisis level. It coordinates notifications, resource
provision, human escalation, and safety measures.

WARNING: This is life-safety critical code. Response actions must be
thoroughly tested and reviewed by mental health professionals.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Awaitable
from enum import Enum
import json

from config import (
    CrisisLevel, 
    CrisisType, 
    RESPONSE_CONFIG, 
    CRISIS_RESOURCES,
    NOTIFICATION_CONFIG
)
from classifier import CrisisClassification, CrisisIndicator


class ResponseActionType(Enum):
    """Types of response actions."""
    NOTIFY_EMERGENCY_SERVICES = "notify_emergency_services"
    NOTIFY_CAREGIVER = "notify_caregiver"
    NOTIFY_CRISIS_COUNSELOR = "notify_crisis_counselor"
    HUMAN_REVIEW = "human_review"
    PROVIDE_RESOURCES = "provide_resources"
    RESTRICT_CHAT = "restrict_chat"
    SHOW_SAFETY_MESSAGE = "show_safety_message"
    SCHEDULE_CHECK_IN = "schedule_check_in"
    LOG_EVENT = "log_event"
    ACTIVATE_SAFETY_PROTOCOL = "activate_safety_protocol"


@dataclass
class ResponseAction:
    """A single response action to be executed."""
    action_type: ResponseActionType
    priority: int  # Lower = higher priority
    execute_immediately: bool
    parameters: Dict[str, Any] = field(default_factory=dict)
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class ResponseResult:
    """Result of executing a response action."""
    action_type: ResponseActionType
    success: bool
    message: str
    timestamp: datetime
    details: Dict[str, Any] = field(default_factory=dict)


class CrisisResponseOrchestrator:
    """
    Orchestrates crisis response actions based on classification.
    
    This class determines which actions to take for each crisis level
    and coordinates their execution.
    """
    
    def __init__(self):
        """Initialize the crisis response orchestrator."""
        self.response_config = RESPONSE_CONFIG
        self.notification_config = NOTIFICATION_CONFIG
        
        # Action handlers (to be registered)
        self.action_handlers: Dict[ResponseActionType, Callable] = {}
        
        # Track active responses
        self.active_responses: Dict[str, List[ResponseResult]] = {}
        
        # Track notification cooldowns
        self.notification_cooldowns: Dict[str, datetime] = {}
        
        # Register default handlers
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """Register default action handlers."""
        self.action_handlers[ResponseActionType.SHOW_SAFETY_MESSAGE] = self._handle_safety_message
        self.action_handlers[ResponseActionType.PROVIDE_RESOURCES] = self._handle_provide_resources
        self.action_handlers[ResponseActionType.SCHEDULE_CHECK_IN] = self._handle_schedule_check_in
        self.action_handlers[ResponseActionType.LOG_EVENT] = self._handle_log_event
    
    def register_handler(
        self, 
        action_type: ResponseActionType, 
        handler: Callable[[Dict[str, Any]], Awaitable[ResponseResult]]
    ):
        """Register a custom handler for an action type."""
        self.action_handlers[action_type] = handler
    
    async def orchestrate_response(
        self,
        user_id: str,
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[ResponseResult]:
        """
        Orchestrate the complete crisis response.
        
        Args:
            user_id: The user identifier
            classification: The crisis classification
            user_context: Additional user context (location, contacts, etc.)
            
        Returns:
            List of response results
        """
        # Determine response actions
        actions = self._determine_actions(classification, user_context)
        
        # Sort by priority
        actions.sort(key=lambda a: a.priority)
        
        # Execute actions
        results = []
        
        for action in actions:
            try:
                result = await self._execute_action(user_id, action, classification, user_context)
                results.append(result)
                
                # For immediate actions, stop on failure
                if action.execute_immediately and not result.success:
                    break
                    
            except Exception as e:
                results.append(ResponseResult(
                    action_type=action.action_type,
                    success=False,
                    message=f"Exception executing action: {str(e)}",
                    timestamp=datetime.utcnow()
                ))
        
        # Store results
        if user_id not in self.active_responses:
            self.active_responses[user_id] = []
        self.active_responses[user_id].extend(results)
        
        return results
    
    def _determine_actions(
        self, 
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> List[ResponseAction]:
        """Determine which actions to take based on crisis level."""
        actions = []
        
        if classification.level == CrisisLevel.IMMEDIATE:
            actions = self._get_immediate_actions(classification, user_context)
        elif classification.level == CrisisLevel.HIGH:
            actions = self._get_high_actions(classification, user_context)
        elif classification.level == CrisisLevel.MODERATE:
            actions = self._get_moderate_actions(classification, user_context)
        else:  # LOW_CONCERN
            actions = self._get_low_actions(classification, user_context)
        
        return actions
    
    def _get_immediate_actions(
        self, 
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> List[ResponseAction]:
        """Get actions for IMMEDIATE crisis level."""
        actions = []
        
        # Priority 1: Log the event (always first)
        actions.append(ResponseAction(
            action_type=ResponseActionType.LOG_EVENT,
            priority=1,
            execute_immediately=True,
            parameters={"level": "IMMEDIATE", "classification": classification}
        ))
        
        # Priority 2: Show safety message to user
        actions.append(ResponseAction(
            action_type=ResponseActionType.SHOW_SAFETY_MESSAGE,
            priority=2,
            execute_immediately=True,
            parameters={
                "message_type": "immediate",
                "include_resources": True,
                "restrict_chat": True
            }
        ))
        
        # Priority 3: Provide crisis resources
        actions.append(ResponseAction(
            action_type=ResponseActionType.PROVIDE_RESOURCES,
            priority=3,
            execute_immediately=True,
            parameters={"urgency": "immediate", "auto_display": True}
        ))
        
        # Priority 4: Notify crisis counselor
        actions.append(ResponseAction(
            action_type=ResponseActionType.NOTIFY_CRISIS_COUNSELOR,
            priority=4,
            execute_immediately=True,
            parameters={
                "escalation_level": "immediate",
                "requires_immediate_response": True
            }
        ))
        
        # Priority 5: Notify caregiver (if available)
        if user_context and user_context.get("caregiver_contact"):
            actions.append(ResponseAction(
                action_type=ResponseActionType.NOTIFY_CAREGIVER,
                priority=5,
                execute_immediately=False,
                parameters={
                    "contact": user_context.get("caregiver_contact"),
                    "message_type": "immediate_crisis"
                }
            ))
        
        # Priority 6: Human review
        actions.append(ResponseAction(
            action_type=ResponseActionType.HUMAN_REVIEW,
            priority=6,
            execute_immediately=False,
            parameters={"review_type": "immediate_intervention"}
        ))
        
        # Priority 7: Restrict chat (safety measure)
        actions.append(ResponseAction(
            action_type=ResponseActionType.RESTRICT_CHAT,
            priority=7,
            execute_immediately=True,
            parameters={
                "restriction": "crisis_mode",
                "allow_only_resources": True
            }
        ))
        
        # Priority 8: Emergency services (for active self-harm/suicide)
        if classification.crisis_type in [CrisisType.SUICIDAL_IDEATION, CrisisType.SELF_HARM]:
            actions.append(ResponseAction(
                action_type=ResponseActionType.NOTIFY_EMERGENCY_SERVICES,
                priority=8,
                execute_immediately=False,
                parameters={
                    "location": user_context.get("location") if user_context else None,
                    "crisis_type": classification.crisis_type.value
                }
            ))
        
        return actions
    
    def _get_high_actions(
        self, 
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> List[ResponseAction]:
        """Get actions for HIGH crisis level."""
        actions = []
        
        # Priority 1: Log the event
        actions.append(ResponseAction(
            action_type=ResponseActionType.LOG_EVENT,
            priority=1,
            execute_immediately=True,
            parameters={"level": "HIGH", "classification": classification}
        ))
        
        # Priority 2: Show safety message
        actions.append(ResponseAction(
            action_type=ResponseActionType.SHOW_SAFETY_MESSAGE,
            priority=2,
            execute_immediately=True,
            parameters={
                "message_type": "high",
                "include_resources": True,
                "restrict_chat": False
            }
        ))
        
        # Priority 3: Provide resources
        actions.append(ResponseAction(
            action_type=ResponseActionType.PROVIDE_RESOURCES,
            priority=3,
            execute_immediately=True,
            parameters={"urgency": "high", "auto_display": True}
        ))
        
        # Priority 4: Notify crisis counselor
        actions.append(ResponseAction(
            action_type=ResponseActionType.NOTIFY_CRISIS_COUNSELOR,
            priority=4,
            execute_immediately=False,
            parameters={
                "escalation_level": "high",
                "response_time_minutes": 15
            }
        ))
        
        # Priority 5: Notify caregiver
        if user_context and user_context.get("caregiver_contact"):
            actions.append(ResponseAction(
                action_type=ResponseActionType.NOTIFY_CAREGIVER,
                priority=5,
                execute_immediately=False,
                parameters={
                    "contact": user_context.get("caregiver_contact"),
                    "message_type": "high_concern"
                }
            ))
        
        # Priority 6: Human review
        actions.append(ResponseAction(
            action_type=ResponseActionType.HUMAN_REVIEW,
            priority=6,
            execute_immediately=False,
            parameters={"review_type": "priority_review"}
        ))
        
        # Priority 7: Schedule check-in
        actions.append(ResponseAction(
            action_type=ResponseActionType.SCHEDULE_CHECK_IN,
            priority=7,
            execute_immediately=False,
            parameters={"check_in_hours": 4}
        ))
        
        return actions
    
    def _get_moderate_actions(
        self, 
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> List[ResponseAction]:
        """Get actions for MODERATE crisis level."""
        actions = []
        
        # Priority 1: Log the event
        actions.append(ResponseAction(
            action_type=ResponseActionType.LOG_EVENT,
            priority=1,
            execute_immediately=True,
            parameters={"level": "MODERATE", "classification": classification}
        ))
        
        # Priority 2: Provide resources
        actions.append(ResponseAction(
            action_type=ResponseActionType.PROVIDE_RESOURCES,
            priority=2,
            execute_immediately=False,
            parameters={"urgency": "moderate", "auto_display": False}
        ))
        
        # Priority 3: Show supportive message
        actions.append(ResponseAction(
            action_type=ResponseActionType.SHOW_SAFETY_MESSAGE,
            priority=3,
            execute_immediately=False,
            parameters={
                "message_type": "supportive",
                "include_resources": False
            }
        ))
        
        # Priority 4: Schedule check-in
        actions.append(ResponseAction(
            action_type=ResponseActionType.SCHEDULE_CHECK_IN,
            priority=4,
            execute_immediately=False,
            parameters={"check_in_hours": 24}
        ))
        
        # Priority 5: Notify caregiver (if configured)
        if user_context and user_context.get("notify_caregiver_on_moderate"):
            actions.append(ResponseAction(
                action_type=ResponseActionType.NOTIFY_CAREGIVER,
                priority=5,
                execute_immediately=False,
                parameters={
                    "contact": user_context.get("caregiver_contact"),
                    "message_type": "moderate_concern"
                }
            ))
        
        return actions
    
    def _get_low_actions(
        self, 
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> List[ResponseAction]:
        """Get actions for LOW_CONCERN crisis level."""
        actions = []
        
        # Priority 1: Log the event
        actions.append(ResponseAction(
            action_type=ResponseActionType.LOG_EVENT,
            priority=1,
            execute_immediately=True,
            parameters={"level": "LOW", "classification": classification}
        ))
        
        # Priority 2: Subtle mood tracking
        actions.append(ResponseAction(
            action_type=ResponseActionType.SCHEDULE_CHECK_IN,
            priority=2,
            execute_immediately=False,
            parameters={"check_in_days": 7, "subtle": True}
        ))
        
        return actions
    
    async def _execute_action(
        self,
        user_id: str,
        action: ResponseAction,
        classification: CrisisClassification,
        user_context: Optional[Dict[str, Any]]
    ) -> ResponseResult:
        """Execute a single response action."""
        handler = self.action_handlers.get(action.action_type)
        
        if not handler:
            return ResponseResult(
                action_type=action.action_type,
                success=False,
                message=f"No handler registered for {action.action_type.value}",
                timestamp=datetime.utcnow()
            )
        
        # Add context to parameters
        params = {
            **action.parameters,
            "user_id": user_id,
            "classification": classification,
            "user_context": user_context
        }
        
        return await handler(params)
    
    # =========================================================================
    # DEFAULT ACTION HANDLERS
    # =========================================================================
    
    async def _handle_safety_message(self, params: Dict[str, Any]) -> ResponseResult:
        """Handle showing a safety message to the user."""
        message_type = params.get("message_type", "supportive")
        include_resources = params.get("include_resources", False)
        restrict_chat = params.get("restrict_chat", False)
        
        messages = {
            "immediate": {
                "title": "We're Here to Help",
                "body": "It sounds like you're going through a really difficult time right now. "
                        "Your safety is important to us. We've connected you with crisis resources "
                        "and a counselor will be reaching out to you shortly.",
                "cta": "View Crisis Resources"
            },
            "high": {
                "title": "Support is Available",
                "body": "We can see you're experiencing some difficult emotions. "
                        "Please know that support is available, and we've provided some "
                        "resources that might help.",
                "cta": "View Support Resources"
            },
            "supportive": {
                "title": "We're Here For You",
                "body": "Thank you for sharing how you're feeling. Remember, it's okay to "
                        "ask for help when you need it.",
                "cta": "View Resources"
            }
        }
        
        message = messages.get(message_type, messages["supportive"])
        
        return ResponseResult(
            action_type=ResponseActionType.SHOW_SAFETY_MESSAGE,
            success=True,
            message=f"Displayed {message_type} safety message",
            timestamp=datetime.utcnow(),
            details={
                "message": message,
                "include_resources": include_resources,
                "restrict_chat": restrict_chat
            }
        )
    
    async def _handle_provide_resources(self, params: Dict[str, Any]) -> ResponseResult:
        """Handle providing crisis resources to the user."""
        urgency = params.get("urgency", "moderate")
        auto_display = params.get("auto_display", False)
        user_context = params.get("user_context", {})
        
        # Get location-specific resources
        location = user_context.get("location", "us")
        resources = CRISIS_RESOURCES.get(location, CRISIS_RESOURCES["us"])
        
        # Format resources based on urgency
        if urgency == "immediate":
            priority_resources = ["988_suicide_crisis_lifeline", "emergency_services"]
        elif urgency == "high":
            priority_resources = ["988_suicide_crisis_lifeline", "crisis_text_line"]
        else:
            priority_resources = list(resources.keys())[:2]
        
        selected_resources = {
            k: resources[k] for k in priority_resources if k in resources
        }
        
        return ResponseResult(
            action_type=ResponseActionType.PROVIDE_RESOURCES,
            success=True,
            message=f"Provided {len(selected_resources)} crisis resources",
            timestamp=datetime.utcnow(),
            details={
                "resources": selected_resources,
                "auto_display": auto_display,
                "urgency": urgency
            }
        )
    
    async def _handle_schedule_check_in(self, params: Dict[str, Any]) -> ResponseResult:
        """Handle scheduling a follow-up check-in."""
        check_in_hours = params.get("check_in_hours")
        check_in_days = params.get("check_in_days")
        subtle = params.get("subtle", False)
        
        if check_in_hours:
            scheduled_time = datetime.utcnow() + timedelta(hours=check_in_hours)
        elif check_in_days:
            scheduled_time = datetime.utcnow() + timedelta(days=check_in_days)
        else:
            scheduled_time = datetime.utcnow() + timedelta(days=1)
        
        return ResponseResult(
            action_type=ResponseActionType.SCHEDULE_CHECK_IN,
            success=True,
            message=f"Scheduled check-in for {scheduled_time.isoformat()}",
            timestamp=datetime.utcnow(),
            details={
                "scheduled_time": scheduled_time.isoformat(),
                "subtle": subtle
            }
        )
    
    async def _handle_log_event(self, params: Dict[str, Any]) -> ResponseResult:
        """Handle logging the crisis event."""
        level = params.get("level", "UNKNOWN")
        classification = params.get("classification")
        
        # This will be handled by the crisis logger
        return ResponseResult(
            action_type=ResponseActionType.LOG_EVENT,
            success=True,
            message=f"Crisis event logged at {level} level",
            timestamp=datetime.utcnow(),
            details={
                "level": level,
                "classification_id": id(classification) if classification else None
            }
        )
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def is_notification_on_cooldown(
        self, 
        user_id: str, 
        level: CrisisLevel
    ) -> bool:
        """Check if notifications are on cooldown for this user and level."""
        cooldown_key = f"{user_id}:{level.value}"
        last_notification = self.notification_cooldowns.get(cooldown_key)
        
        if not last_notification:
            return False
        
        cooldown_minutes = self.notification_config.NOTIFICATION_COOLDOWN_MINUTES.get(
            level, 60
        )
        cooldown_end = last_notification + timedelta(minutes=cooldown_minutes)
        
        return datetime.utcnow() < cooldown_end
    
    def record_notification(self, user_id: str, level: CrisisLevel):
        """Record that a notification was sent."""
        cooldown_key = f"{user_id}:{level.value}"
        self.notification_cooldowns[cooldown_key] = datetime.utcnow()
    
    def get_response_history(self, user_id: str) -> List[ResponseResult]:
        """Get the response history for a user."""
        return self.active_responses.get(user_id, [])
    
    def clear_response_history(self, user_id: str):
        """Clear the response history for a user."""
        if user_id in self.active_responses:
            del self.active_responses[user_id]


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

response_orchestrator = CrisisResponseOrchestrator()
