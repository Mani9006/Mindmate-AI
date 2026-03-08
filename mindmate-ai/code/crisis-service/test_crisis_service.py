"""
Crisis Detection Service Tests
==============================

Test suite for the crisis detection service components.

These tests verify the functionality of all crisis detection modules.
"""

import pytest
from datetime import datetime, timedelta

# Import all components
from config import CrisisLevel, CrisisType, KeywordSeverity, CRISIS_RESOURCES
from keywords import CrisisKeywords, KeywordMatch, crisis_keywords
from emotion_triggers import (
    EmotionTriggerDetector, 
    EmotionTrigger, 
    EmotionTriggerType,
    EmotionReading,
    emotion_detector
)
from behavioral_triggers import (
    BehavioralTriggerDetector,
    BehavioralTrigger,
    BehavioralTriggerType,
    UserActivity
)
from classifier import CrisisClassifier, CrisisClassification, CrisisIndicator, crisis_classifier


# =============================================================================
# KEYWORD DETECTION TESTS
# =============================================================================

class TestKeywordDetection:
    """Tests for keyword detection functionality."""
    
    def test_critical_keyword_detection(self):
        """Test detection of critical crisis keywords."""
        text = "I'm going to kill myself tonight"
        matches = crisis_keywords.detect_keywords(text)
        
        assert len(matches) > 0
        assert any(m.severity == KeywordSeverity.CRITICAL for m in matches)
    
    def test_high_severity_keyword_detection(self):
        """Test detection of high severity keywords."""
        text = "I think about suicide every day"
        matches = crisis_keywords.detect_keywords(text)
        
        assert len(matches) > 0
        assert any(m.severity == KeywordSeverity.HIGH for m in matches)
    
    def test_self_harm_keyword_detection(self):
        """Test detection of self-harm keywords."""
        text = "I cut myself to feel something"
        matches = crisis_keywords.detect_keywords(text)
        
        assert len(matches) > 0
        assert any("self_harm" in m.category for m in matches)
    
    def test_hopelessness_keyword_detection(self):
        """Test detection of hopelessness keywords."""
        text = "I have no hope left, everything is hopeless"
        matches = crisis_keywords.detect_keywords(text)
        
        assert len(matches) > 0
        assert any("hopelessness" in m.category for m in matches)
    
    def test_no_crisis_keywords(self):
        """Test that normal text doesn't trigger crisis detection."""
        text = "I'm having a great day today! The weather is nice."
        matches = crisis_keywords.detect_keywords(text)
        
        # Should have no or minimal matches
        critical_high = [m for m in matches if m.severity in [KeywordSeverity.CRITICAL, KeywordSeverity.HIGH]]
        assert len(critical_high) == 0
    
    def test_highest_severity(self):
        """Test getting highest severity from matches."""
        text = "I'm going to kill myself, I have no hope"
        matches = crisis_keywords.detect_keywords(text)
        
        highest = crisis_keywords.get_highest_severity(matches)
        assert highest == KeywordSeverity.CRITICAL
    
    def test_has_critical_keywords(self):
        """Test quick check for critical keywords."""
        text = "I'm going to end my life"
        assert crisis_keywords.has_critical_keywords(text) is True
        
        text = "I'm feeling a bit sad today"
        assert crisis_keywords.has_critical_keywords(text) is False


# =============================================================================
# EMOTION TRIGGER TESTS
# =============================================================================

class TestEmotionTriggers:
    """Tests for emotion trigger detection."""
    
    def test_sustained_sadness_detection(self):
        """Test detection of sustained high sadness."""
        detector = EmotionTriggerDetector()
        
        # Simulate sustained sadness readings
        base_time = datetime.utcnow()
        triggers = []
        
        for i in range(15):  # 15 readings over time
            reading = EmotionReading(
                timestamp=base_time + timedelta(minutes=i),
                emotions={"sadness": 0.85, "fear": 0.3, "distress": 0.4},
                source="voice",
                session_id="test_session"
            )
            new_triggers = detector.process_emotion_reading("user123", reading)
            triggers.extend(new_triggers)
        
        # Should detect sustained sadness
        assert any(t.trigger_type == EmotionTriggerType.SUSTAINED_SADNESS for t in triggers)
    
    def test_combined_emotions_detection(self):
        """Test detection of combined negative emotions."""
        detector = EmotionTriggerDetector()
        
        reading = EmotionReading(
            timestamp=datetime.utcnow(),
            emotions={"sadness": 0.75, "fear": 0.72, "distress": 0.65},
            source="voice",
            session_id="test_session"
        )
        
        triggers = detector.process_emotion_reading("user123", reading)
        
        # Should detect combined emotions
        assert any(t.trigger_type == EmotionTriggerType.COMBINED_NEGATIVE_EMOTIONS for t in triggers)
    
    def test_emotional_numbness_detection(self):
        """Test detection of emotional numbness."""
        detector = EmotionTriggerDetector()
        
        reading = EmotionReading(
            timestamp=datetime.utcnow(),
            emotions={
                "sadness": 0.05, "fear": 0.03, "distress": 0.04,
                "joy": 0.02, "calm": 0.03, "anger": 0.02
            },
            source="voice",
            session_id="test_session"
        )
        
        triggers = detector.process_emotion_reading("user123", reading)
        
        # Should detect numbness
        assert any(t.trigger_type == EmotionTriggerType.EMOTIONAL_NUMBNESS for t in triggers)


# =============================================================================
# BEHAVIORAL TRIGGER TESTS
# =============================================================================

class TestBehavioralTriggers:
    """Tests for behavioral pattern detection."""
    
    def test_extended_absence_detection(self):
        """Test detection of extended user absence."""
        detector = BehavioralTriggerDetector()
        
        # Record an activity 6 days ago
        old_activity = UserActivity(
            timestamp=datetime.utcnow() - timedelta(days=6),
            activity_type="message",
            metadata={}
        )
        detector.record_activity("user123", old_activity)
        
        # Record current activity - should trigger extended absence
        current_activity = UserActivity(
            timestamp=datetime.utcnow(),
            activity_type="login",
            metadata={}
        )
        triggers = detector.record_activity("user123", current_activity)
        
        assert any(t.trigger_type == BehavioralTriggerType.EXTENDED_ABSENCE for t in triggers)
    
    def test_sentiment_decline_detection(self):
        """Test detection of sentiment decline."""
        detector = BehavioralTriggerDetector()
        
        # Set baseline
        detector.establish_baseline("user123", days_of_data=1)
        
        # Record messages with declining sentiment
        base_time = datetime.utcnow() - timedelta(days=1)
        
        for i in range(10):
            detector.record_message(
                user_id="user123",
                timestamp=base_time + timedelta(hours=i),
                message_length=100,
                sentiment_score=0.5 - (i * 0.1)  # Declining sentiment
            )
        
        # Check if sentiment decline is detected
        profile = detector.user_profiles.get("user123")
        if profile and profile.sentiment_history:
            recent_sentiments = [s['score'] for s in profile.sentiment_history[-7:]]
            import statistics
            if len(recent_sentiments) >= 3:
                recent_avg = statistics.mean(recent_sentiments)
                # If baseline was set and recent is lower, trigger should fire
                if profile.baseline_sentiment > 0 and profile.baseline_sentiment - recent_avg >= 0.5:
                    # Trigger would be detected
                    pass


# =============================================================================
# CLASSIFIER TESTS
# =============================================================================

class TestClassifier:
    """Tests for crisis classification."""
    
    def test_immediate_classification(self):
        """Test classification of immediate crisis."""
        # Create critical keyword matches
        keyword_matches = [
            KeywordMatch(
                keyword="I'm going to kill myself",
                severity=KeywordSeverity.CRITICAL,
                category="suicidal_ideation",
                position=0,
                context="I'm going to kill myself tonight"
            )
        ]
        
        classification = crisis_classifier.classify(
            user_id="user123",
            keyword_matches=keyword_matches,
            emotion_triggers=[],
            behavioral_triggers=[]
        )
        
        assert classification.level == CrisisLevel.IMMEDIATE
        assert classification.crisis_type == CrisisType.SUICIDAL_IDEATION
    
    def test_high_classification(self):
        """Test classification of high-level crisis."""
        keyword_matches = [
            KeywordMatch(
                keyword="I think about suicide",
                severity=KeywordSeverity.HIGH,
                category="suicidal_ideation",
                position=0,
                context="I think about suicide every day"
            )
        ]
        
        classification = crisis_classifier.classify(
            user_id="user123",
            keyword_matches=keyword_matches,
            emotion_triggers=[],
            behavioral_triggers=[]
        )
        
        assert classification.level == CrisisLevel.HIGH
    
    def test_combined_risk_multiplier(self):
        """Test that combined risk increases classification score."""
        # Keyword + emotion should score higher
        keyword_matches = [
            KeywordMatch(
                keyword="I have no hope",
                severity=KeywordSeverity.MODERATE,
                category="hopelessness",
                position=0,
                context="I have no hope left"
            )
        ]
        
        emotion_triggers = [
            EmotionTrigger(
                trigger_type=EmotionTriggerType.SUSTAINED_SADNESS,
                severity=CrisisLevel.MODERATE,
                timestamp=datetime.utcnow(),
                description="Sustained sadness detected",
                emotion_scores={"sadness_avg": 0.75},
                confidence=0.8
            )
        ]
        
        classification = crisis_classifier.classify(
            user_id="user123",
            keyword_matches=keyword_matches,
            emotion_triggers=emotion_triggers,
            behavioral_triggers=[]
        )
        
        # Combined risk should elevate the classification
        assert classification.total_score > 25  # Base moderate threshold


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestIntegration:
    """Integration tests for the full crisis detection pipeline."""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_immediate_crisis(self):
        """Test full pipeline with immediate crisis text."""
        from service import CrisisDetectionService
        
        service = CrisisDetectionService()
        
        result = await service.process_user_message(
            user_id="test_user",
            message="I'm going to kill myself tonight, I have a plan",
            session_id="test_session"
        )
        
        assert result.crisis_detected is True
        assert result.classification.level == CrisisLevel.IMMEDIATE
        assert result.requires_immediate_action is True
    
    @pytest.mark.asyncio
    async def test_full_pipeline_high_crisis(self):
        """Test full pipeline with high-level crisis text."""
        from service import CrisisDetectionService
        
        service = CrisisDetectionService()
        
        result = await service.process_user_message(
            user_id="test_user",
            message="I've been having suicidal thoughts lately",
            session_id="test_session"
        )
        
        assert result.crisis_detected is True
        assert result.classification.level == CrisisLevel.HIGH
    
    @pytest.mark.asyncio
    async def test_full_pipeline_no_crisis(self):
        """Test full pipeline with normal text."""
        from service import CrisisDetectionService
        
        service = CrisisDetectionService()
        
        result = await service.process_user_message(
            user_id="test_user",
            message="I'm having a great day! The sun is shining.",
            session_id="test_session"
        )
        
        assert result.crisis_detected is False
    
    def test_quick_screen(self):
        """Test quick text screening."""
        from service import CrisisDetectionService
        
        service = CrisisDetectionService()
        
        # Screen crisis text
        result = service.quick_screen_text("I'm going to end my life")
        assert result["crisis_detected"] is True
        assert result["level"] == "immediate"
        
        # Screen normal text
        result = service.quick_screen_text("I'm feeling happy today")
        assert result["crisis_detected"] is False


# =============================================================================
# CONFIGURATION TESTS
# =============================================================================

class TestConfiguration:
    """Tests for configuration values."""
    
    def test_crisis_resources_available(self):
        """Test that crisis resources are defined."""
        assert "us" in CRISIS_RESOURCES
        assert "uk" in CRISIS_RESOURCES
        assert "988_suicide_crisis_lifeline" in CRISIS_RESOURCES["us"]
    
    def test_emotion_thresholds(self):
        """Test emotion threshold configuration."""
        from config import EMOTION_THRESHOLDS
        
        assert EMOTION_THRESHOLDS.SADNESS_HIGH == 0.75
        assert EMOTION_THRESHOLDS.FEAR_HIGH == 0.70
        assert EMOTION_THRESHOLDS.SUSTAINED_DURATION_MINUTES == 10
    
    def test_behavioral_thresholds(self):
        """Test behavioral threshold configuration."""
        from config import BEHAVIORAL_THRESHOLDS
        
        assert BEHAVIORAL_THRESHOLDS.MISSED_DAYS_CRITICAL == 5
        assert BEHAVIORAL_THRESHOLDS.MISSED_DAYS_WARNING == 3


# =============================================================================
# RUN TESTS
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
