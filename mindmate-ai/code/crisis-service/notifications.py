"""
Emergency Contact Notification Sender Module
=============================================
CRITICAL SAFETY CODE for MindMate AI

This module handles sending notifications to emergency contacts,
caregivers, crisis counselors, and emergency services.

WARNING: This is life-safety critical code. Notification delivery
must be reliable and timely. All notification channels must be
thoroughly tested.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Awaitable
from enum import Enum
import json

from config import CrisisLevel, CrisisType, NOTIFICATION_CONFIG


class NotificationChannel(Enum):
    """Available notification channels."""
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"
    PHONE_CALL = "phone_call"
    WEBHOOK = "webhook"


class NotificationRecipientType(Enum):
    """Types of notification recipients."""
    EMERGENCY_CONTACT = "emergency_contact"
    CAREGIVER = "caregiver"
    CRISIS_COUNSELOR = "crisis_counselor"
    EMERGENCY_SERVICES = "emergency_services"
    USER = "user"


@dataclass
class NotificationRecipient:
    """A notification recipient."""
    recipient_type: NotificationRecipientType
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    push_token: Optional[str] = None
    webhook_url: Optional[str] = None
    relationship: Optional[str] = None
    is_primary: bool = False
    preferences: Dict[str, Any] = field(default_factory=dict)


@dataclass
class NotificationMessage:
    """A notification message."""
    subject: str
    body: str
    urgency: CrisisLevel
    channels: List[NotificationChannel]
    include_details: bool = True
    require_acknowledgment: bool = False
    action_links: Dict[str, str] = field(default_factory=dict)


@dataclass
class NotificationResult:
    """Result of sending a notification."""
    recipient: NotificationRecipient
    channel: NotificationChannel
    success: bool
    message: str
    timestamp: datetime
    delivery_id: Optional[str] = None
    retry_count: int = 0


class NotificationSender:
    """
    Sends notifications to emergency contacts and services.
    
    This class handles the reliable delivery of crisis notifications
    across multiple channels with retry logic.
    """
    
    def __init__(self):
        """Initialize the notification sender."""
        self.config = NOTIFICATION_CONFIG
        
        # Channel handlers (to be registered)
        self.channel_handlers: Dict[NotificationChannel, Callable] = {}
        
        # Track notification history
        self.notification_history: Dict[str, List[NotificationResult]] = {}
        
        # Track pending notifications for retry
        self.pending_notifications: List[tuple] = []
        
        # Register default handlers
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """Register default channel handlers."""
        self.channel_handlers[NotificationChannel.SMS] = self._send_sms
        self.channel_handlers[NotificationChannel.EMAIL] = self._send_email
        self.channel_handlers[NotificationChannel.PUSH] = self._send_push
        self.channel_handlers[NotificationChannel.WEBHOOK] = self._send_webhook
    
    def register_channel_handler(
        self,
        channel: NotificationChannel,
        handler: Callable[[NotificationRecipient, NotificationMessage], Awaitable[NotificationResult]]
    ):
        """Register a custom handler for a notification channel."""
        self.channel_handlers[channel] = handler
    
    async def send_crisis_notification(
        self,
        user_id: str,
        recipient: NotificationRecipient,
        crisis_level: CrisisLevel,
        crisis_type: CrisisType,
        details: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[NotificationResult]:
        """
        Send a crisis notification to a recipient.
        
        Args:
            user_id: The user in crisis
            recipient: Who to notify
            crisis_level: The crisis severity level
            crisis_type: The type of crisis
            details: Additional crisis details
            user_context: User context information
            
        Returns:
            List of notification results (one per channel)
        """
        # Generate message based on recipient type and crisis level
        message = self._generate_message(
            recipient.recipient_type,
            crisis_level,
            crisis_type,
            details,
            user_context
        )
        
        # Determine channels to use
        channels = self._determine_channels(recipient, crisis_level)
        
        # Send via each channel
        results = []
        for channel in channels:
            try:
                result = await self._send_via_channel(recipient, message, channel)
                results.append(result)
                
                # If successful on primary channel, may skip secondary
                if result.success and channel == channels[0] and crisis_level != CrisisLevel.IMMEDIATE:
                    break
                    
            except Exception as e:
                results.append(NotificationResult(
                    recipient=recipient,
                    channel=channel,
                    success=False,
                    message=f"Exception: {str(e)}",
                    timestamp=datetime.utcnow()
                ))
        
        # Store results
        if user_id not in self.notification_history:
            self.notification_history[user_id] = []
        self.notification_history[user_id].extend(results)
        
        # Schedule retries for failures
        for result in results:
            if not result.success and result.retry_count < self.config.MAX_RETRY_ATTEMPTS:
                self.pending_notifications.append((recipient, message, result.channel, result.retry_count + 1))
        
        return results
    
    async def send_bulk_notification(
        self,
        user_id: str,
        recipients: List[NotificationRecipient],
        crisis_level: CrisisLevel,
        crisis_type: CrisisType,
        details: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, List[NotificationResult]]:
        """
        Send notifications to multiple recipients.
        
        Args:
            user_id: The user in crisis
            recipients: List of recipients to notify
            crisis_level: The crisis severity level
            crisis_type: The type of crisis
            details: Additional crisis details
            user_context: User context information
            
        Returns:
            Dictionary mapping recipient IDs to notification results
        """
        results = {}
        
        # Send to primary contact first
        primary_recipients = [r for r in recipients if r.is_primary]
        other_recipients = [r for r in recipients if not r.is_primary]
        
        for recipient in primary_recipients + other_recipients:
            recipient_results = await self.send_crisis_notification(
                user_id=user_id,
                recipient=recipient,
                crisis_level=crisis_level,
                crisis_type=crisis_type,
                details=details,
                user_context=user_context
            )
            results[recipient.name] = recipient_results
        
        return results
    
    def _generate_message(
        self,
        recipient_type: NotificationRecipientType,
        crisis_level: CrisisLevel,
        crisis_type: CrisisType,
        details: Optional[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]]
    ) -> NotificationMessage:
        """Generate an appropriate notification message."""
        user_name = user_context.get("user_name", "A user") if user_context else "A user"
        
        # Message templates by recipient type and crisis level
        templates = {
            NotificationRecipientType.CAREGIVER: {
                CrisisLevel.IMMEDIATE: {
                    "subject": f"URGENT: {user_name} Needs Immediate Help",
                    "body": (
                        f"This is an urgent notification from MindMate AI.\n\n"
                        f"{user_name} has been identified as being in immediate crisis. "
                        f"Our system has detected indicators of {crisis_type.value.replace('_', ' ')}.\n\n"
                        f"IMMEDIATE ACTION RECOMMENDED:\n"
                        f"- Check on {user_name} as soon as possible\n"
                        f"- Crisis resources have been provided to them\n"
                        f"- A crisis counselor has been notified\n\n"
                        f"Time of detection: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
                        f"Crisis level: {crisis_level.value.upper()}\n\n"
                        f"If you believe {user_name} is in immediate danger, please contact emergency services."
                    ),
                    "channels": [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.PHONE_CALL],
                    "require_acknowledgment": True
                },
                CrisisLevel.HIGH: {
                    "subject": f"Important: {user_name} May Need Support",
                    "body": (
                        f"This is a notification from MindMate AI.\n\n"
                        f"{user_name} has been identified as experiencing elevated concern. "
                        f"Our system has detected indicators of {crisis_type.value.replace('_', ' ')}.\n\n"
                        f"RECOMMENDED ACTIONS:\n"
                        f"- Consider reaching out to {user_name}\n"
                        f"- Support resources have been provided to them\n"
                        f"- A mental health professional will be reviewing their case\n\n"
                        f"Time of detection: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
                        f"Crisis level: {crisis_level.value.upper()}"
                    ),
                    "channels": [NotificationChannel.SMS, NotificationChannel.EMAIL],
                    "require_acknowledgment": False
                },
                CrisisLevel.MODERATE: {
                    "subject": f"Update: {user_name} - Wellbeing Check",
                    "body": (
                        f"This is an update from MindMate AI.\n\n"
                        f"{user_name} has been identified as experiencing some difficulty. "
                        f"Our system has detected indicators that may warrant attention.\n\n"
                        f"SUGGESTED ACTIONS:\n"
                        f"- A gentle check-in with {user_name} may be helpful\n"
                        f"- Support resources have been made available to them\n\n"
                        f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
                        f"Level: {crisis_level.value.upper()}"
                    ),
                    "channels": [NotificationChannel.EMAIL],
                    "require_acknowledgment": False
                }
            },
            NotificationRecipientType.CRISIS_COUNSELOR: {
                CrisisLevel.IMMEDIATE: {
                    "subject": f"IMMEDIATE CRISIS: User Requires Intervention",
                    "body": (
                        f"IMMEDIATE CRISIS ALERT\n"
                        f"{'=' * 50}\n\n"
                        f"User ID: {details.get('user_id', 'Unknown') if details else 'Unknown'}\n"
                        f"Crisis Level: {crisis_level.value.upper()}\n"
                        f"Crisis Type: {crisis_type.value.replace('_', ' ').upper()}\n"
                        f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
                        f"DETECTED INDICATORS:\n"
                        f"{self._format_indicators(details.get('indicators', []) if details else [])}\n\n"
                        f"CLASSIFICATION REASON:\n"
                        f"{details.get('classification_reason', 'N/A') if details else 'N/A'}\n\n"
                        f"IMMEDIATE ACTION REQUIRED"
                    ),
                    "channels": [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
                    "require_acknowledgment": True
                },
                CrisisLevel.HIGH: {
                    "subject": f"PRIORITY: User Requires Review",
                    "body": (
                        f"PRIORITY CRISIS ALERT\n"
                        f"{'=' * 50}\n\n"
                        f"User ID: {details.get('user_id', 'Unknown') if details else 'Unknown'}\n"
                        f"Crisis Level: {crisis_level.value.upper()}\n"
                        f"Crisis Type: {crisis_type.value.replace('_', ' ').upper()}\n"
                        f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
                        f"DETECTED INDICATORS:\n"
                        f"{self._format_indicators(details.get('indicators', []) if details else [])}\n\n"
                        f"Please review within 15 minutes."
                    ),
                    "channels": [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
                    "require_acknowledgment": False
                }
            },
            NotificationRecipientType.EMERGENCY_SERVICES: {
                CrisisLevel.IMMEDIATE: {
                    "subject": "Welfare Check Request",
                    "body": (
                        f"Mental Health Crisis Alert\n\n"
                        f"A user of the MindMate AI mental health platform has been identified "
                        f"as being in immediate crisis with indicators of {crisis_type.value.replace('_', ' ')}.\n\n"
                        f"Location: {user_context.get('location', 'Unknown') if user_context else 'Unknown'}\n"
                        f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"
                        f"This is an automated alert. Please assess need for welfare check."
                    ),
                    "channels": [NotificationChannel.PHONE_CALL, NotificationChannel.WEBHOOK],
                    "require_acknowledgment": True
                }
            },
            NotificationRecipientType.USER: {
                CrisisLevel.IMMEDIATE: {
                    "subject": "",
                    "body": (
                        f"We want you to know that you matter. If you're in crisis, "
                        f"please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988. "
                        f"Help is available 24/7."
                    ),
                    "channels": [NotificationChannel.PUSH, NotificationChannel.SMS],
                    "require_acknowledgment": False
                }
            }
        }
        
        # Get template for recipient type and level
        type_templates = templates.get(recipient_type, templates[NotificationRecipientType.CAREGIVER])
        level_templates = type_templates.get(crisis_level, type_templates.get(CrisisLevel.MODERATE))
        
        return NotificationMessage(
            subject=level_templates["subject"],
            body=level_templates["body"],
            urgency=crisis_level,
            channels=level_templates["channels"],
            require_acknowledgment=level_templates.get("require_acknowledgment", False)
        )
    
    def _format_indicators(self, indicators: List[Any]) -> str:
        """Format indicators for notification message."""
        if not indicators:
            return "No specific indicators provided"
        
        formatted = []
        for i, indicator in enumerate(indicators[:5], 1):  # Top 5 indicators
            if hasattr(indicator, 'source'):
                formatted.append(f"{i}. [{indicator.source}] {indicator.indicator_type}")
            else:
                formatted.append(f"{i}. {str(indicator)}")
        
        return "\n".join(formatted)
    
    def _determine_channels(
        self, 
        recipient: NotificationRecipient, 
        crisis_level: CrisisLevel
    ) -> List[NotificationChannel]:
        """Determine which channels to use for notification."""
        channels = []
        
        # Always try primary contact method first
        if recipient.phone and self.config.SMS_ENABLED:
            channels.append(NotificationChannel.SMS)
        
        if recipient.email and self.config.EMAIL_ENABLED:
            channels.append(NotificationChannel.EMAIL)
        
        if recipient.push_token and self.config.PUSH_ENABLED:
            channels.append(NotificationChannel.PUSH)
        
        if recipient.webhook_url:
            channels.append(NotificationChannel.WEBHOOK)
        
        return channels
    
    async def _send_via_channel(
        self,
        recipient: NotificationRecipient,
        message: NotificationMessage,
        channel: NotificationChannel
    ) -> NotificationResult:
        """Send notification via a specific channel."""
        handler = self.channel_handlers.get(channel)
        
        if not handler:
            return NotificationResult(
                recipient=recipient,
                channel=channel,
                success=False,
                message=f"No handler for channel {channel.value}",
                timestamp=datetime.utcnow()
            )
        
        return await handler(recipient, message)
    
    # =========================================================================
    # CHANNEL HANDLERS (Placeholder implementations)
    # =========================================================================
    
    async def _send_sms(
        self, 
        recipient: NotificationRecipient, 
        message: NotificationMessage
    ) -> NotificationResult:
        """Send SMS notification."""
        # Placeholder - integrate with SMS provider (Twilio, etc.)
        if not recipient.phone:
            return NotificationResult(
                recipient=recipient,
                channel=NotificationChannel.SMS,
                success=False,
                message="No phone number provided",
                timestamp=datetime.utcnow()
            )
        
        # In production: integrate with Twilio or similar
        return NotificationResult(
            recipient=recipient,
            channel=NotificationChannel.SMS,
            success=True,
            message=f"SMS sent to {recipient.phone}",
            timestamp=datetime.utcnow(),
            delivery_id=f"sms_{datetime.utcnow().timestamp()}"
        )
    
    async def _send_email(
        self, 
        recipient: NotificationRecipient, 
        message: NotificationMessage
    ) -> NotificationResult:
        """Send email notification."""
        # Placeholder - integrate with email provider
        if not recipient.email:
            return NotificationResult(
                recipient=recipient,
                channel=NotificationChannel.EMAIL,
                success=False,
                message="No email provided",
                timestamp=datetime.utcnow()
            )
        
        # In production: integrate with SendGrid, AWS SES, etc.
        return NotificationResult(
            recipient=recipient,
            channel=NotificationChannel.EMAIL,
            success=True,
            message=f"Email sent to {recipient.email}",
            timestamp=datetime.utcnow(),
            delivery_id=f"email_{datetime.utcnow().timestamp()}"
        )
    
    async def _send_push(
        self, 
        recipient: NotificationRecipient, 
        message: NotificationMessage
    ) -> NotificationResult:
        """Send push notification."""
        # Placeholder - integrate with push notification service
        if not recipient.push_token:
            return NotificationResult(
                recipient=recipient,
                channel=NotificationChannel.PUSH,
                success=False,
                message="No push token provided",
                timestamp=datetime.utcnow()
            )
        
        # In production: integrate with Firebase, OneSignal, etc.
        return NotificationResult(
            recipient=recipient,
            channel=NotificationChannel.PUSH,
            success=True,
            message=f"Push notification sent",
            timestamp=datetime.utcnow(),
            delivery_id=f"push_{datetime.utcnow().timestamp()}"
        )
    
    async def _send_webhook(
        self, 
        recipient: NotificationRecipient, 
        message: NotificationMessage
    ) -> NotificationResult:
        """Send webhook notification."""
        # Placeholder - make HTTP POST to webhook URL
        if not recipient.webhook_url:
            return NotificationResult(
                recipient=recipient,
                channel=NotificationChannel.WEBHOOK,
                success=False,
                message="No webhook URL provided",
                timestamp=datetime.utcnow()
            )
        
        # In production: make actual HTTP request
        return NotificationResult(
            recipient=recipient,
            channel=NotificationChannel.WEBHOOK,
            success=True,
            message=f"Webhook posted to {recipient.webhook_url}",
            timestamp=datetime.utcnow(),
            delivery_id=f"webhook_{datetime.utcnow().timestamp()}"
        )
    
    # =========================================================================
    # RETRY LOGIC
    # =========================================================================
    
    async def process_pending_notifications(self):
        """Process pending notifications that need retry."""
        still_pending = []
        
        for recipient, message, channel, retry_count in self.pending_notifications:
            if retry_count <= self.config.MAX_RETRY_ATTEMPTS:
                try:
                    result = await self._send_via_channel(recipient, message, channel)
                    
                    if not result.success:
                        still_pending.append((recipient, message, channel, retry_count + 1))
                        
                except Exception:
                    still_pending.append((recipient, message, channel, retry_count + 1))
        
        self.pending_notifications = still_pending
    
    # =========================================================================
    # HISTORY AND REPORTING
    # =========================================================================
    
    def get_notification_history(self, user_id: str) -> List[NotificationResult]:
        """Get notification history for a user."""
        return self.notification_history.get(user_id, [])
    
    def get_notification_stats(self, user_id: str) -> Dict[str, Any]:
        """Get notification statistics for a user."""
        history = self.notification_history.get(user_id, [])
        
        if not history:
            return {"total": 0, "successful": 0, "failed": 0}
        
        successful = sum(1 for h in history if h.success)
        
        by_channel = {}
        for h in history:
            channel = h.channel.value
            if channel not in by_channel:
                by_channel[channel] = {"total": 0, "successful": 0}
            by_channel[channel]["total"] += 1
            if h.success:
                by_channel[channel]["successful"] += 1
        
        return {
            "total": len(history),
            "successful": successful,
            "failed": len(history) - successful,
            "by_channel": by_channel
        }


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

notification_sender = NotificationSender()
