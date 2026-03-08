"""
Behavioral Pattern Triggers Module
===================================
CRITICAL SAFETY CODE for MindMate AI

This module implements behavioral pattern analysis for detecting
mental health crises through changes in user behavior patterns.

WARNING: This is life-safety critical code. Behavioral thresholds
are based on clinical research and should only be modified by
mental health professionals.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from collections import deque
import statistics

from config import BEHAVIORAL_THRESHOLDS, CrisisLevel, CrisisType


class BehavioralTriggerType(Enum):
    """Types of behavioral pattern triggers."""
    SUDDEN_WITHDRAWAL = "sudden_withdrawal"
    EXTENDED_ABSENCE = "extended_absence"
    MESSAGE_PATTERN_CHANGE = "message_pattern_change"
    SENTIMENT_DECLINE = "sentiment_decline"
    ACTIVITY_REDUCTION = "activity_reduction"
    RESPONSE_TIME_INCREASE = "response_time_increase"
    SESSION_LENGTH_REDUCTION = "session_length_reduction"
    FREQUENCY_DROP = "frequency_drop"
    CIRCADIAN_RHYTHM_DISRUPTION = "circadian_rhythm_disruption"


@dataclass
class UserActivity:
    """Record of a user activity event."""
    timestamp: datetime
    activity_type: str  # 'message', 'session_start', 'session_end', 'login', etc.
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BehavioralTrigger:
    """A behavioral pattern trigger that has been detected."""
    trigger_type: BehavioralTriggerType
    severity: CrisisLevel
    timestamp: datetime
    description: str
    metrics: Dict[str, Any]
    confidence: float = 0.0
    recommended_action: Optional[str] = None


@dataclass
class UserBehavioralProfile:
    """Long-term behavioral profile for a user."""
    user_id: str
    created_at: datetime
    
    # Baseline metrics (established over first 2 weeks)
    baseline_daily_messages: float = 0.0
    baseline_message_length: float = 0.0
    baseline_response_time_hours: float = 0.0
    baseline_session_minutes: float = 0.0
    baseline_sentiment: float = 0.0
    baseline_active_hours: List[int] = field(default_factory=list)
    
    # Recent metrics (rolling 7-day window)
    recent_daily_messages: float = 0.0
    recent_message_length: float = 0.0
    recent_response_time_hours: float = 0.0
    recent_session_minutes: float = 0.0
    recent_sentiment: float = 0.0
    
    # Activity tracking
    last_activity: Optional[datetime] = None
    last_login: Optional[datetime] = None
    consecutive_missed_days: int = 0
    
    # History
    activity_history: deque = field(default_factory=lambda: deque(maxlen=1000))
    sentiment_history: deque = field(default_factory=lambda: deque(maxlen=100))
    session_history: deque = field(default_factory=lambda: deque(maxlen=100))


class BehavioralTriggerDetector:
    """
    Detects crisis triggers based on behavioral pattern changes.
    
    This class monitors user activity patterns and identifies changes
    that may indicate deteriorating mental health.
    """
    
    def __init__(self):
        """Initialize the behavioral trigger detector."""
        self.thresholds = BEHAVIORAL_THRESHOLDS
        
        # Store user behavioral profiles
        self.user_profiles: Dict[str, UserBehavioralProfile] = {}
        
        # Configuration
        self.BASELINE_DAYS = 14  # Days to establish baseline
        self.ROLLING_WINDOW_DAYS = 7  # Days for recent comparison
        self.MAX_HISTORY_EVENTS = 1000
        
    def record_activity(self, user_id: str, activity: UserActivity) -> List[BehavioralTrigger]:
        """
        Record a user activity and check for behavioral triggers.
        
        Args:
            user_id: The user identifier
            activity: The activity event
            
        Returns:
            List of detected behavioral triggers
        """
        triggers = []
        
        # Get or create user profile
        profile = self._get_or_create_profile(user_id)
        
        # Update profile with activity
        profile.activity_history.append(activity)
        profile.last_activity = activity.timestamp
        
        if activity.activity_type == 'login':
            profile.last_login = activity.timestamp
        
        # Check for triggers
        withdrawal_trigger = self._check_withdrawal(user_id, profile, activity)
        if withdrawal_trigger:
            triggers.append(withdrawal_trigger)
        
        absence_trigger = self._check_extended_absence(user_id, profile)
        if absence_trigger:
            triggers.append(absence_trigger)
        
        pattern_trigger = self._check_message_pattern_changes(user_id, profile)
        if pattern_trigger:
            triggers.append(pattern_trigger)
        
        sentiment_trigger = self._check_sentiment_decline(user_id, profile)
        if sentiment_trigger:
            triggers.append(sentiment_trigger)
        
        activity_trigger = self._check_activity_reduction(user_id, profile)
        if activity_trigger:
            triggers.append(activity_trigger)
        
        response_trigger = self._check_response_time_changes(user_id, profile)
        if response_trigger:
            triggers.append(response_trigger)
        
        # Update rolling metrics
        self._update_rolling_metrics(profile)
        
        return triggers
    
    def record_message(
        self, 
        user_id: str, 
        timestamp: datetime,
        message_length: int,
        sentiment_score: float,
        response_time_hours: Optional[float] = None
    ) -> List[BehavioralTrigger]:
        """
        Record a message and check for behavioral triggers.
        
        Args:
            user_id: The user identifier
            timestamp: When the message was sent
            message_length: Length of the message in characters
            sentiment_score: Sentiment analysis score (-1 to 1)
            response_time_hours: Time since last message (if applicable)
            
        Returns:
            List of detected behavioral triggers
        """
        activity = UserActivity(
            timestamp=timestamp,
            activity_type='message',
            metadata={
                'message_length': message_length,
                'sentiment_score': sentiment_score,
                'response_time_hours': response_time_hours
            }
        )
        
        # Also update sentiment history directly
        profile = self._get_or_create_profile(user_id)
        profile.sentiment_history.append({
            'timestamp': timestamp,
            'score': sentiment_score
        })
        
        return self.record_activity(user_id, activity)
    
    def record_session(
        self,
        user_id: str,
        start_time: datetime,
        end_time: datetime,
        message_count: int
    ) -> List[BehavioralTrigger]:
        """
        Record a chat session and check for behavioral triggers.
        
        Args:
            user_id: The user identifier
            start_time: Session start time
            end_time: Session end time
            message_count: Number of messages in session
            
        Returns:
            List of detected behavioral triggers
        """
        duration_minutes = (end_time - start_time).total_seconds() / 60
        
        profile = self._get_or_create_profile(user_id)
        profile.session_history.append({
            'start': start_time,
            'end': end_time,
            'duration_minutes': duration_minutes,
            'message_count': message_count
        })
        
        start_activity = UserActivity(
            timestamp=start_time,
            activity_type='session_start',
            metadata={'message_count': message_count}
        )
        
        end_activity = UserActivity(
            timestamp=end_time,
            activity_type='session_end',
            metadata={
                'duration_minutes': duration_minutes,
                'message_count': message_count
            }
        )
        
        triggers = []
        triggers.extend(self.record_activity(user_id, start_activity))
        triggers.extend(self.record_activity(user_id, end_activity))
        
        # Check for session length changes
        if profile.baseline_session_minutes > 0:
            recent_avg = self._calculate_recent_session_length(profile)
            if recent_avg < profile.baseline_session_minutes * (1 - self.thresholds.MESSAGE_LENGTH_DROP_PERCENT):
                triggers.append(BehavioralTrigger(
                    trigger_type=BehavioralTriggerType.SESSION_LENGTH_REDUCTION,
                    severity=CrisisLevel.MODERATE,
                    timestamp=datetime.utcnow(),
                    description=f"Session length significantly reduced: {profile.baseline_session_minutes:.1f} -> {recent_avg:.1f} minutes",
                    metrics={
                        'baseline_minutes': profile.baseline_session_minutes,
                        'recent_average': recent_avg,
                        'reduction_percent': (1 - recent_avg / profile.baseline_session_minutes) * 100
                    },
                    confidence=0.7
                ))
        
        return triggers
    
    def _get_or_create_profile(self, user_id: str) -> UserBehavioralProfile:
        """Get or create a behavioral profile for a user."""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserBehavioralProfile(
                user_id=user_id,
                created_at=datetime.utcnow()
            )
        return self.user_profiles[user_id]
    
    def _check_withdrawal(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile,
        current_activity: UserActivity
    ) -> Optional[BehavioralTrigger]:
        """Check for sudden withdrawal patterns."""
        if not profile.last_activity:
            return None
        
        # Calculate days since last activity
        days_since = (current_activity.timestamp - profile.last_activity).days
        
        # Check for sudden drop in activity frequency
        if profile.baseline_daily_messages > 0 and days_since <= 1:
            recent_daily = self._calculate_recent_daily_messages(profile)
            
            if recent_daily < profile.baseline_daily_messages * (1 - self.thresholds.MESSAGE_FREQUENCY_DROP_PERCENT):
                # Significant drop in message frequency
                severity = CrisisLevel.MODERATE
                if recent_daily == 0:
                    severity = CrisisLevel.HIGH
                
                return BehavioralTrigger(
                    trigger_type=BehavioralTriggerType.SUDDEN_WITHDRAWAL,
                    severity=severity,
                    timestamp=datetime.utcnow(),
                    description=f"Sudden withdrawal: messages dropped from {profile.baseline_daily_messages:.1f}/day to {recent_daily:.1f}/day",
                    metrics={
                        'baseline_daily': profile.baseline_daily_messages,
                        'recent_daily': recent_daily,
                        'drop_percent': (1 - recent_daily / profile.baseline_daily_messages) * 100 if profile.baseline_daily_messages > 0 else 0
                    },
                    confidence=0.75,
                    recommended_action="Send gentle check-in message"
                )
        
        return None
    
    def _check_extended_absence(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile
    ) -> Optional[BehavioralTrigger]:
        """Check for extended absence from the platform."""
        if not profile.last_activity:
            return None
        
        days_since = (datetime.utcnow() - profile.last_activity).days
        
        if days_since >= self.thresholds.MISSED_DAYS_CRITICAL:
            return BehavioralTrigger(
                trigger_type=BehavioralTriggerType.EXTENDED_ABSENCE,
                severity=CrisisLevel.HIGH,
                timestamp=datetime.utcnow(),
                description=f"Extended absence: {days_since} days since last activity",
                metrics={
                    'days_absent': days_since,
                    'last_activity': profile.last_activity.isoformat()
                },
                confidence=min(days_since / 10, 1.0),
                recommended_action="Notify emergency contact if available"
            )
        elif days_since >= self.thresholds.MISSED_DAYS_WARNING:
            return BehavioralTrigger(
                trigger_type=BehavioralTriggerType.EXTENDED_ABSENCE,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"Warning: {days_since} days since last activity",
                metrics={
                    'days_absent': days_since,
                    'last_activity': profile.last_activity.isoformat()
                },
                confidence=0.6,
                recommended_action="Send gentle re-engagement message"
            )
        
        return None
    
    def _check_message_pattern_changes(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile
    ) -> Optional[BehavioralTrigger]:
        """Check for changes in message patterns."""
        if profile.baseline_message_length <= 0:
            return None
        
        recent_length = self._calculate_recent_message_length(profile)
        
        if recent_length < profile.baseline_message_length * (1 - self.thresholds.MESSAGE_LENGTH_DROP_PERCENT):
            return BehavioralTrigger(
                trigger_type=BehavioralTriggerType.MESSAGE_PATTERN_CHANGE,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"Message length significantly reduced: {profile.baseline_message_length:.0f} -> {recent_length:.0f} characters",
                metrics={
                    'baseline_length': profile.baseline_message_length,
                    'recent_length': recent_length,
                    'reduction_percent': (1 - recent_length / profile.baseline_message_length) * 100
                },
                confidence=0.65
            )
        
        return None
    
    def _check_sentiment_decline(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile
    ) -> Optional[BehavioralTrigger]:
        """Check for declining sentiment trends."""
        if len(profile.sentiment_history) < 7:  # Need at least a week of data
            return None
        
        # Get sentiment scores from the last week
        cutoff = datetime.utcnow() - timedelta(days=self.thresholds.SENTIMENT_DROP_WINDOW_DAYS)
        recent_sentiments = [
            s['score'] for s in profile.sentiment_history 
            if s['timestamp'] >= cutoff
        ]
        
        if len(recent_sentiments) < 3:
            return None
        
        recent_avg = statistics.mean(recent_sentiments)
        
        # Compare to baseline
        if profile.baseline_sentiment > 0:
            drop = profile.baseline_sentiment - recent_avg
            
            if drop >= self.thresholds.SENTIMENT_DROP_THRESHOLD:
                severity = CrisisLevel.MODERATE
                if drop >= self.thresholds.SENTIMENT_DROP_THRESHOLD * 1.5:
                    severity = CrisisLevel.HIGH
                
                return BehavioralTrigger(
                    trigger_type=BehavioralTriggerType.SENTIMENT_DECLINE,
                    severity=severity,
                    timestamp=datetime.utcnow(),
                    description=f"Significant sentiment decline: {profile.baseline_sentiment:.2f} -> {recent_avg:.2f}",
                    metrics={
                        'baseline_sentiment': profile.baseline_sentiment,
                        'recent_sentiment': recent_avg,
                        'drop': drop
                    },
                    confidence=min(abs(drop), 1.0)
                )
        
        return None
    
    def _check_activity_reduction(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile
    ) -> Optional[BehavioralTrigger]:
        """Check for overall activity reduction."""
        if profile.baseline_daily_messages <= 0:
            return None
        
        recent_activity = self._calculate_recent_activity_level(profile)
        
        if recent_activity < self.thresholds.ACTIVITY_REDUCTION_PERCENT:
            return BehavioralTrigger(
                trigger_type=BehavioralTriggerType.ACTIVITY_REDUCTION,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"Overall activity reduced to {recent_activity*100:.0f}% of baseline",
                metrics={
                    'baseline_activity': profile.baseline_daily_messages,
                    'current_activity_percent': recent_activity * 100
                },
                confidence=0.6
            )
        
        return None
    
    def _check_response_time_changes(
        self, 
        user_id: str, 
        profile: UserBehavioralProfile
    ) -> Optional[BehavioralTrigger]:
        """Check for changes in response times."""
        # Get recent response times from message activities
        cutoff = datetime.utcnow() - timedelta(days=self.ROLLING_WINDOW_DAYS)
        response_times = [
            a.metadata.get('response_time_hours')
            for a in profile.activity_history
            if a.activity_type == 'message' 
            and a.timestamp >= cutoff
            and a.metadata.get('response_time_hours') is not None
        ]
        
        if len(response_times) < 3:
            return None
        
        recent_avg = statistics.mean(response_times)
        
        if (profile.baseline_response_time_hours > 0 and 
            recent_avg > profile.baseline_response_time_hours + self.thresholds.RESPONSE_TIME_INCREASE_HOURS):
            return BehavioralTrigger(
                trigger_type=BehavioralTriggerType.RESPONSE_TIME_INCREASE,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description=f"Response time significantly increased: {profile.baseline_response_time_hours:.1f} -> {recent_avg:.1f} hours",
                metrics={
                    'baseline_hours': profile.baseline_response_time_hours,
                    'recent_hours': recent_avg,
                    'increase_hours': recent_avg - profile.baseline_response_time_hours
                },
                confidence=0.55
            )
        
        return None
    
    def _calculate_recent_daily_messages(self, profile: UserBehavioralProfile) -> float:
        """Calculate average daily messages in recent period."""
        cutoff = datetime.utcnow() - timedelta(days=self.ROLLING_WINDOW_DAYS)
        message_count = sum(
            1 for a in profile.activity_history
            if a.activity_type == 'message' and a.timestamp >= cutoff
        )
        return message_count / self.ROLLING_WINDOW_DAYS
    
    def _calculate_recent_message_length(self, profile: UserBehavioralProfile) -> float:
        """Calculate average message length in recent period."""
        cutoff = datetime.utcnow() - timedelta(days=self.ROLLING_WINDOW_DAYS)
        lengths = [
            a.metadata.get('message_length', 0)
            for a in profile.activity_history
            if a.activity_type == 'message' and a.timestamp >= cutoff
        ]
        return statistics.mean(lengths) if lengths else 0
    
    def _calculate_recent_session_length(self, profile: UserBehavioralProfile) -> float:
        """Calculate average session length in recent period."""
        cutoff = datetime.utcnow() - timedelta(days=self.ROLLING_WINDOW_DAYS)
        sessions = [
            s for s in profile.session_history
            if s['start'] >= cutoff
        ]
        return statistics.mean([s['duration_minutes'] for s in sessions]) if sessions else 0
    
    def _calculate_recent_activity_level(self, profile: UserBehavioralProfile) -> float:
        """Calculate recent activity level as percentage of baseline."""
        recent_daily = self._calculate_recent_daily_messages(profile)
        if profile.baseline_daily_messages > 0:
            return recent_daily / profile.baseline_daily_messages
        return 1.0
    
    def _update_rolling_metrics(self, profile: UserBehavioralProfile):
        """Update the rolling metrics for a profile."""
        profile.recent_daily_messages = self._calculate_recent_daily_messages(profile)
        profile.recent_message_length = self._calculate_recent_message_length(profile)
        profile.recent_session_minutes = self._calculate_recent_session_length(profile)
        
        # Update sentiment
        cutoff = datetime.utcnow() - timedelta(days=self.ROLLING_WINDOW_DAYS)
        recent_sentiments = [
            s['score'] for s in profile.sentiment_history
            if s['timestamp'] >= cutoff
        ]
        if recent_sentiments:
            profile.recent_sentiment = statistics.mean(recent_sentiments)
    
    def establish_baseline(self, user_id: str, days_of_data: int = 14) -> bool:
        """
        Establish baseline metrics for a user.
        
        This should be called after collecting sufficient initial data.
        
        Args:
            user_id: The user identifier
            days_of_data: Number of days of data to use for baseline
            
        Returns:
            True if baseline was established, False if insufficient data
        """
        profile = self._get_or_create_profile(user_id)
        
        cutoff = datetime.utcnow() - timedelta(days=days_of_data)
        
        # Calculate baseline metrics
        messages = [
            a for a in profile.activity_history
            if a.activity_type == 'message' and a.timestamp >= cutoff
        ]
        
        if len(messages) < 10:  # Need minimum data
            return False
        
        profile.baseline_daily_messages = len(messages) / days_of_data
        profile.baseline_message_length = statistics.mean([
            a.metadata.get('message_length', 0) for a in messages
        ])
        
        # Baseline sentiment
        sentiments = [s['score'] for s in profile.sentiment_history if s['timestamp'] >= cutoff]
        if sentiments:
            profile.baseline_sentiment = statistics.mean(sentiments)
        
        # Baseline session length
        sessions = [s for s in profile.session_history if s['start'] >= cutoff]
        if sessions:
            profile.baseline_session_minutes = statistics.mean([
                s['duration_minutes'] for s in sessions
            ])
        
        # Baseline response time
        response_times = [
            a.metadata.get('response_time_hours')
            for a in messages
            if a.metadata.get('response_time_hours') is not None
        ]
        if response_times:
            profile.baseline_response_time_hours = statistics.mean(response_times)
        
        return True
    
    def get_behavioral_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of behavioral patterns for a user."""
        profile = self.user_profiles.get(user_id)
        
        if not profile:
            return {"status": "no_profile"}
        
        return {
            "status": "active",
            "user_id": user_id,
            "profile_created": profile.created_at.isoformat(),
            "last_activity": profile.last_activity.isoformat() if profile.last_activity else None,
            "baseline_established": profile.baseline_daily_messages > 0,
            "metrics": {
                "baseline_daily_messages": profile.baseline_daily_messages,
                "recent_daily_messages": profile.recent_daily_messages,
                "baseline_sentiment": profile.baseline_sentiment,
                "recent_sentiment": profile.recent_sentiment,
                "baseline_session_minutes": profile.baseline_session_minutes,
                "recent_session_minutes": profile.recent_session_minutes,
            },
            "activity_count": len(profile.activity_history),
            "sentiment_readings": len(profile.sentiment_history),
            "session_count": len(profile.session_history)
        }
    
    def reset_user_data(self, user_id: str):
        """Reset all behavioral data for a user."""
        if user_id in self.user_profiles:
            del self.user_profiles[user_id]


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

behavioral_detector = BehavioralTriggerDetector()
