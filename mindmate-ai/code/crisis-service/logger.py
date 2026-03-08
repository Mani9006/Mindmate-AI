"""
Crisis Event Logger Module
===========================
CRITICAL SAFETY CODE for MindMate AI

This module implements comprehensive audit logging for all crisis
detection events, responses, and outcomes. This creates an immutable
record for clinical review, compliance, and safety analysis.

WARNING: This is life-safety critical code. All crisis events must be
logged accurately and retained according to regulatory requirements.
"""

import json
import hashlib
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from pathlib import Path
import asyncio
from collections import deque

from config import CrisisLevel, CrisisType, LOGGING_CONFIG
from classifier import CrisisClassification, CrisisIndicator


class EventType(Enum):
    """Types of crisis events that can be logged."""
    DETECTION = "detection"
    CLASSIFICATION = "classification"
    RESPONSE_INITIATED = "response_initiated"
    RESPONSE_COMPLETED = "response_completed"
    NOTIFICATION_SENT = "notification_sent"
    NOTIFICATION_FAILED = "notification_failed"
    HUMAN_REVIEW_REQUESTED = "human_review_requested"
    HUMAN_REVIEW_COMPLETED = "human_review_completed"
    USER_CONTACT_ATTEMPTED = "user_contact_attempted"
    USER_CONTACT_SUCCESSFUL = "user_contact_successful"
    USER_CONTACT_FAILED = "user_contact_failed"
    RESOURCES_PROVIDED = "resources_provided"
    CHECK_IN_SCHEDULED = "check_in_scheduled"
    CHECK_IN_COMPLETED = "check_in_completed"
    ESCALATION = "escalation"
    DE_ESCALATION = "de_escalation"
    RESOLUTION = "resolution"
    FALSE_POSITIVE = "false_positive"
    SYSTEM_ERROR = "system_error"


class EventOutcome(Enum):
    """Possible outcomes for crisis events."""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILURE = "failure"
    PENDING = "pending"
    CANCELLED = "cancelled"
    ERROR = "error"


@dataclass
class CrisisEvent:
    """
    A single crisis event log entry.
    
    This is the primary data structure for the audit trail.
    """
    # Identification
    event_id: str
    event_type: EventType
    timestamp: datetime
    
    # User context
    user_id: str
    session_id: Optional[str] = None
    
    # Crisis context
    crisis_level: Optional[CrisisLevel] = None
    crisis_type: Optional[CrisisType] = None
    
    # Event details
    description: str = ""
    details: Dict[str, Any] = field(default_factory=dict)
    
    # Detection context
    detected_keywords: List[str] = field(default_factory=list)
    emotion_triggers: List[str] = field(default_factory=list)
    behavioral_triggers: List[str] = field(default_factory=list)
    
    # Response context
    response_actions: List[str] = field(default_factory=list)
    notifications_sent: List[str] = field(default_factory=list)
    
    # Outcome
    outcome: EventOutcome = EventOutcome.PENDING
    outcome_details: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    
    # Audit trail
    previous_event_id: Optional[str] = None
    related_event_ids: List[str] = field(default_factory=list)
    
    # Integrity
    checksum: Optional[str] = None
    
    def compute_checksum(self) -> str:
        """Compute a checksum for event integrity verification."""
        # Create a deterministic string representation
        data = {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "crisis_level": self.crisis_level.value if self.crisis_level else None,
            "crisis_type": self.crisis_type.value if self.crisis_type else None,
            "description": self.description,
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def verify_integrity(self) -> bool:
        """Verify the event's integrity using checksum."""
        if not self.checksum:
            return True  # No checksum to verify
        return self.checksum == self.compute_checksum()


@dataclass
class CrisisSession:
    """
    Tracks a complete crisis session from detection to resolution.
    """
    session_id: str
    user_id: str
    started_at: datetime
    
    initial_classification: Optional[CrisisClassification] = None
    current_level: Optional[CrisisLevel] = None
    
    events: List[CrisisEvent] = field(default_factory=list)
    
    ended_at: Optional[datetime] = None
    resolution: Optional[str] = None
    resolved_by: Optional[str] = None
    
    @property
    def duration_minutes(self) -> Optional[float]:
        """Get the duration of the crisis session in minutes."""
        if not self.ended_at:
            return None
        return (self.ended_at - self.started_at).total_seconds() / 60
    
    @property
    def is_active(self) -> bool:
        """Check if the crisis session is still active."""
        return self.ended_at is None
    
    @property
    def event_count(self) -> int:
        """Get the number of events in this session."""
        return len(self.events)


class CrisisEventLogger:
    """
    Comprehensive audit logger for crisis events.
    
    This class provides:
    - Immutable event logging
    - Session tracking
    - Integrity verification
    - Compliance reporting
    - Data export
    """
    
    def __init__(self, log_directory: Optional[str] = None):
        """Initialize the crisis event logger."""
        self.config = LOGGING_CONFIG
        
        # Set up log directory
        if log_directory:
            self.log_directory = Path(log_directory)
        else:
            # Default to local logs directory
            self.log_directory = Path(__file__).parent / "logs" / "crisis"
        
        self.log_directory.mkdir(parents=True, exist_ok=True)
        
        # In-memory event cache (for recent events)
        self.event_cache: deque = deque(maxlen=10000)
        
        # Active crisis sessions
        self.active_sessions: Dict[str, CrisisSession] = {}
        
        # Event counter for ID generation
        self._event_counter = 0
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
    
    def _generate_event_id(self) -> str:
        """Generate a unique event ID."""
        self._event_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"EVT-{timestamp}-{self._event_counter:06d}"
    
    def _generate_session_id(self) -> str:
        """Generate a unique session ID."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        random_suffix = hashlib.sha256(
            str(datetime.utcnow().timestamp()).encode()
        ).hexdigest()[:8]
        return f"SES-{timestamp}-{random_suffix}"
    
    async def log_detection(
        self,
        user_id: str,
        detection_source: str,
        detected_items: List[str],
        raw_data: Optional[Dict[str, Any]] = None
    ) -> CrisisEvent:
        """
        Log a crisis detection event.
        
        Args:
            user_id: The user identifier
            detection_source: Source of detection (keyword, emotion, behavioral)
            detected_items: List of detected indicators
            raw_data: Raw detection data
            
        Returns:
            The logged crisis event
        """
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.DETECTION,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            description=f"Crisis indicators detected via {detection_source}",
            details={
                "detection_source": detection_source,
                "detected_items": detected_items,
                "raw_data": raw_data
            }
        )
        
        # Set checksum
        event.checksum = event.compute_checksum()
        
        await self._persist_event(event)
        return event
    
    async def log_classification(
        self,
        user_id: str,
        classification: CrisisClassification,
        session_id: Optional[str] = None
    ) -> CrisisEvent:
        """
        Log a crisis classification event.
        
        Args:
            user_id: The user identifier
            classification: The crisis classification
            session_id: Optional session ID
            
        Returns:
            The logged crisis event
        """
        # Get or create session
        if not session_id:
            session_id = self._get_or_create_session(user_id)
        
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.CLASSIFICATION,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            crisis_level=classification.level,
            crisis_type=classification.crisis_type,
            description=classification.classification_reason,
            details={
                "total_score": classification.total_score,
                "confidence": classification.confidence,
                "recommended_response": classification.recommended_response,
                "primary_triggers": classification.primary_triggers
            },
            detected_keywords=[
                i.details.get("keyword", "") 
                for i in classification.indicators 
                if i.source == "keyword"
            ],
            emotion_triggers=[
                i.indicator_type 
                for i in classification.indicators 
                if i.source == "emotion"
            ],
            behavioral_triggers=[
                i.indicator_type 
                for i in classification.indicators 
                if i.source == "behavioral"
            ]
        )
        
        event.checksum = event.compute_checksum()
        
        # Update session
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.current_level = classification.level
            if not session.initial_classification:
                session.initial_classification = classification
            session.events.append(event)
        
        await self._persist_event(event)
        return event
    
    async def log_response(
        self,
        user_id: str,
        response_type: str,
        actions_taken: List[str],
        outcome: EventOutcome,
        outcome_details: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> CrisisEvent:
        """
        Log a crisis response event.
        
        Args:
            user_id: The user identifier
            response_type: Type of response
            actions_taken: List of actions taken
            outcome: Outcome of the response
            outcome_details: Additional outcome details
            session_id: Optional session ID
            
        Returns:
            The logged crisis event
        """
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.RESPONSE_COMPLETED,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            description=f"Crisis response executed: {response_type}",
            details={
                "response_type": response_type,
                "actions_taken": actions_taken
            },
            response_actions=actions_taken,
            outcome=outcome,
            outcome_details=outcome_details
        )
        
        event.checksum = event.compute_checksum()
        
        await self._persist_event(event)
        return event
    
    async def log_notification(
        self,
        user_id: str,
        recipient_type: str,
        recipient_contact: str,
        channel: str,
        success: bool,
        message: str,
        session_id: Optional[str] = None
    ) -> CrisisEvent:
        """
        Log a notification event.
        
        Args:
            user_id: The user identifier
            recipient_type: Type of recipient
            recipient_contact: Contact information
            channel: Notification channel used
            success: Whether notification was successful
            message: Notification message or result
            session_id: Optional session ID
            
        Returns:
            The logged crisis event
        """
        event_type = EventType.NOTIFICATION_SENT if success else EventType.NOTIFICATION_FAILED
        
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=event_type,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            description=f"Notification to {recipient_type} via {channel}: {'success' if success else 'failed'}",
            details={
                "recipient_type": recipient_type,
                "recipient_contact": recipient_contact,
                "channel": channel,
                "result": message
            },
            notifications_sent=[recipient_contact] if success else [],
            outcome=EventOutcome.SUCCESS if success else EventOutcome.FAILURE
        )
        
        event.checksum = event.compute_checksum()
        
        await self._persist_event(event)
        return event
    
    async def log_resolution(
        self,
        user_id: str,
        session_id: str,
        resolution_type: str,
        resolved_by: str,
        notes: Optional[str] = None
    ) -> CrisisEvent:
        """
        Log a crisis resolution event.
        
        Args:
            user_id: The user identifier
            session_id: The crisis session ID
            resolution_type: Type of resolution
            resolved_by: Who resolved the crisis
            notes: Additional notes
            
        Returns:
            The logged crisis event
        """
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.RESOLUTION,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            description=f"Crisis resolved: {resolution_type}",
            details={
                "resolution_type": resolution_type,
                "notes": notes
            },
            outcome=EventOutcome.SUCCESS,
            resolved_at=datetime.utcnow(),
            resolved_by=resolved_by
        )
        
        event.checksum = event.compute_checksum()
        
        # Close the session
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.ended_at = datetime.utcnow()
            session.resolution = resolution_type
            session.resolved_by = resolved_by
            session.events.append(event)
        
        await self._persist_event(event)
        return event
    
    async def log_escalation(
        self,
        user_id: str,
        from_level: CrisisLevel,
        to_level: CrisisLevel,
        reason: str,
        session_id: Optional[str] = None
    ) -> CrisisEvent:
        """
        Log a crisis escalation event.
        
        Args:
            user_id: The user identifier
            from_level: Previous crisis level
            to_level: New crisis level
            reason: Reason for escalation
            session_id: Optional session ID
            
        Returns:
            The logged crisis event
        """
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.ESCALATION,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            crisis_level=to_level,
            description=f"Crisis escalated from {from_level.value} to {to_level.value}",
            details={
                "from_level": from_level.value,
                "to_level": to_level.value,
                "reason": reason
            }
        )
        
        event.checksum = event.compute_checksum()
        
        await self._persist_event(event)
        return event
    
    async def log_error(
        self,
        user_id: str,
        error_type: str,
        error_message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> CrisisEvent:
        """
        Log a system error during crisis handling.
        
        Args:
            user_id: The user identifier
            error_type: Type of error
            error_message: Error message
            context: Additional context
            
        Returns:
            The logged crisis event
        """
        event = CrisisEvent(
            event_id=self._generate_event_id(),
            event_type=EventType.SYSTEM_ERROR,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            description=f"System error: {error_type}",
            details={
                "error_type": error_type,
                "error_message": error_message,
                "context": context
            },
            outcome=EventOutcome.ERROR
        )
        
        event.checksum = event.compute_checksum()
        
        await self._persist_event(event)
        return event
    
    async def _persist_event(self, event: CrisisEvent):
        """Persist an event to storage."""
        async with self._lock:
            # Add to in-memory cache
            self.event_cache.append(event)
            
            # Write to file
            await self._write_event_to_file(event)
    
    async def _write_event_to_file(self, event: CrisisEvent):
        """Write an event to the log file."""
        # Determine log file based on date
        date_str = event.timestamp.strftime("%Y-%m-%d")
        log_file = self.log_directory / f"crisis-events-{date_str}.jsonl"
        
        # Convert event to JSON
        event_dict = self._event_to_dict(event)
        event_json = json.dumps(event_dict, default=str)
        
        # Append to file
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self._append_to_file,
            log_file,
            event_json
        )
    
    def _append_to_file(self, filepath: Path, content: str):
        """Append content to a file (synchronous)."""
        with open(filepath, "a") as f:
            f.write(content + "\n")
    
    def _event_to_dict(self, event: CrisisEvent) -> Dict[str, Any]:
        """Convert a CrisisEvent to a dictionary."""
        return {
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "user_id": event.user_id,
            "session_id": event.session_id,
            "crisis_level": event.crisis_level.value if event.crisis_level else None,
            "crisis_type": event.crisis_type.value if event.crisis_type else None,
            "description": event.description,
            "details": event.details,
            "detected_keywords": event.detected_keywords,
            "emotion_triggers": event.emotion_triggers,
            "behavioral_triggers": event.behavioral_triggers,
            "response_actions": event.response_actions,
            "notifications_sent": event.notifications_sent,
            "outcome": event.outcome.value,
            "outcome_details": event.outcome_details,
            "resolved_at": event.resolved_at.isoformat() if event.resolved_at else None,
            "resolved_by": event.resolved_by,
            "previous_event_id": event.previous_event_id,
            "related_event_ids": event.related_event_ids,
            "checksum": event.checksum
        }
    
    def _get_or_create_session(self, user_id: str) -> str:
        """Get an active session for a user or create a new one."""
        # Check for existing active session
        for session_id, session in self.active_sessions.items():
            if session.user_id == user_id and session.is_active:
                return session_id
        
        # Create new session
        session_id = self._generate_session_id()
        self.active_sessions[session_id] = CrisisSession(
            session_id=session_id,
            user_id=user_id,
            started_at=datetime.utcnow()
        )
        
        return session_id
    
    # =========================================================================
    # QUERY AND RETRIEVAL
    # =========================================================================
    
    def get_user_events(
        self, 
        user_id: str, 
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_types: Optional[List[EventType]] = None
    ) -> List[CrisisEvent]:
        """
        Get events for a specific user.
        
        Args:
            user_id: The user identifier
            start_time: Optional start time filter
            end_time: Optional end time filter
            event_types: Optional event type filter
            
        Returns:
            List of matching events
        """
        events = [e for e in self.event_cache if e.user_id == user_id]
        
        if start_time:
            events = [e for e in events if e.timestamp >= start_time]
        
        if end_time:
            events = [e for e in events if e.timestamp <= end_time]
        
        if event_types:
            events = [e for e in events if e.event_type in event_types]
        
        return sorted(events, key=lambda e: e.timestamp)
    
    def get_active_sessions(self) -> List[CrisisSession]:
        """Get all active crisis sessions."""
        return [s for s in self.active_sessions.values() if s.is_active]
    
    def get_session_events(self, session_id: str) -> List[CrisisEvent]:
        """Get all events for a specific session."""
        if session_id in self.active_sessions:
            return self.active_sessions[session_id].events
        
        # Search in cache
        return [e for e in self.event_cache if e.session_id == session_id]
    
    def get_user_crisis_history(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive crisis history for a user."""
        events = self.get_user_events(user_id)
        
        if not events:
            return {"user_id": user_id, "crisis_count": 0}
        
        # Count by level
        level_counts = {}
        for event in events:
            if event.crisis_level:
                level = event.crisis_level.value
                level_counts[level] = level_counts.get(level, 0) + 1
        
        # Get sessions
        sessions = [
            s for s in self.active_sessions.values() 
            if s.user_id == user_id
        ]
        
        return {
            "user_id": user_id,
            "crisis_count": len(events),
            "level_breakdown": level_counts,
            "first_crisis": events[0].timestamp.isoformat(),
            "most_recent_crisis": events[-1].timestamp.isoformat(),
            "active_sessions": len([s for s in sessions if s.is_active]),
            "total_sessions": len(sessions)
        }
    
    # =========================================================================
    # EXPORT AND REPORTING
    # =========================================================================
    
    async def export_events(
        self,
        start_time: datetime,
        end_time: datetime,
        output_file: str
    ) -> int:
        """
        Export events to a file for compliance reporting.
        
        Args:
            start_time: Start of export range
            end_time: End of export range
            output_file: Output file path
            
        Returns:
            Number of events exported
        """
        events = [
            e for e in self.event_cache 
            if start_time <= e.timestamp <= end_time
        ]
        
        # Also scan log files
        log_files = self.log_directory.glob("crisis-events-*.jsonl")
        
        for log_file in log_files:
            file_date = datetime.strptime(
                log_file.stem.replace("crisis-events-", ""),
                "%Y-%m-%d"
            )
            
            if start_time.date() <= file_date.date() <= end_time.date():
                # Read and parse events from file
                with open(log_file, "r") as f:
                    for line in f:
                        try:
                            event_dict = json.loads(line.strip())
                            event_time = datetime.fromisoformat(event_dict["timestamp"])
                            if start_time <= event_time <= end_time:
                                # Convert back to CrisisEvent
                                event = self._dict_to_event(event_dict)
                                if event not in events:
                                    events.append(event)
                        except (json.JSONDecodeError, KeyError):
                            continue
        
        # Sort by timestamp
        events.sort(key=lambda e: e.timestamp)
        
        # Write to output file
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w") as f:
            for event in events:
                f.write(json.dumps(self._event_to_dict(event), default=str) + "\n")
        
        return len(events)
    
    def _dict_to_event(self, data: Dict[str, Any]) -> CrisisEvent:
        """Convert a dictionary to a CrisisEvent."""
        return CrisisEvent(
            event_id=data["event_id"],
            event_type=EventType(data["event_type"]),
            timestamp=datetime.fromisoformat(data["timestamp"]),
            user_id=data["user_id"],
            session_id=data.get("session_id"),
            crisis_level=CrisisLevel(data["crisis_level"]) if data.get("crisis_level") else None,
            crisis_type=CrisisType(data["crisis_type"]) if data.get("crisis_type") else None,
            description=data.get("description", ""),
            details=data.get("details", {}),
            detected_keywords=data.get("detected_keywords", []),
            emotion_triggers=data.get("emotion_triggers", []),
            behavioral_triggers=data.get("behavioral_triggers", []),
            response_actions=data.get("response_actions", []),
            notifications_sent=data.get("notifications_sent", []),
            outcome=EventOutcome(data.get("outcome", "pending")),
            outcome_details=data.get("outcome_details"),
            resolved_at=datetime.fromisoformat(data["resolved_at"]) if data.get("resolved_at") else None,
            resolved_by=data.get("resolved_by"),
            previous_event_id=data.get("previous_event_id"),
            related_event_ids=data.get("related_event_ids", []),
            checksum=data.get("checksum")
        )
    
    def generate_summary_report(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, Any]:
        """Generate a summary report for a time period."""
        events = [
            e for e in self.event_cache 
            if start_time <= e.timestamp <= end_time
        ]
        
        if not events:
            return {
                "period": f"{start_time.isoformat()} to {end_time.isoformat()}",
                "total_events": 0
            }
        
        # Count by type
        type_counts = {}
        level_counts = {}
        user_crisis_counts = {}
        
        for event in events:
            # Event types
            et = event.event_type.value
            type_counts[et] = type_counts.get(et, 0) + 1
            
            # Crisis levels
            if event.crisis_level:
                cl = event.crisis_level.value
                level_counts[cl] = level_counts.get(cl, 0) + 1
            
            # User crisis counts
            user_crisis_counts[event.user_id] = user_crisis_counts.get(event.user_id, 0) + 1
        
        return {
            "period": f"{start_time.isoformat()} to {end_time.isoformat()}",
            "total_events": len(events),
            "unique_users": len(user_crisis_counts),
            "event_type_breakdown": type_counts,
            "crisis_level_breakdown": level_counts,
            "users_with_multiple_crisis": sum(1 for c in user_crisis_counts.values() if c > 1),
            "immediate_crisis_count": level_counts.get("immediate", 0),
            "high_crisis_count": level_counts.get("high", 0)
        }


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

crisis_logger = CrisisEventLogger()
