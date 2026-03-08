"""
Crisis Level Classifier Module
==============================
CRITICAL SAFETY CODE for MindMate AI

This module implements the crisis level classification system that
combines all detection inputs (keywords, emotions, behavior) to
determine the appropriate crisis response level.

WARNING: This is life-safety critical code. Classification thresholds
are based on clinical research and should only be modified by
mental health professionals.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from enum import Enum

from config import (
    CrisisLevel, 
    CrisisType, 
    CLASSIFICATION_THRESHOLDS
)
from keywords import KeywordMatch, crisis_keywords, KeywordSeverity
from emotion_triggers import EmotionTrigger, EmotionTriggerType
from behavioral_triggers import BehavioralTrigger, BehavioralTriggerType


@dataclass
class CrisisIndicator:
    """A single crisis indicator from any detection source."""
    source: str  # 'keyword', 'emotion', 'behavioral'
    indicator_type: str
    severity_score: int
    confidence: float
    details: Dict[str, Any]
    timestamp: datetime


@dataclass
class CrisisClassification:
    """Result of crisis level classification."""
    level: CrisisLevel
    crisis_type: CrisisType
    total_score: int
    confidence: float
    indicators: List[CrisisIndicator]
    primary_triggers: List[str]
    recommended_response: str
    requires_immediate_action: bool
    timestamp: datetime
    classification_reason: str


class CrisisClassifier:
    """
    Classifies crisis level based on multiple detection inputs.
    
    This class combines keyword detection, emotion analysis, and
    behavioral pattern detection to determine the appropriate
    crisis response level.
    """
    
    def __init__(self):
        """Initialize the crisis classifier."""
        self.thresholds = CLASSIFICATION_THRESHOLDS
        
        # Track recent classifications for escalation detection
        self.recent_classifications: Dict[str, List[CrisisClassification]] = {}
        
        # Configuration
        self.ESCALATION_WINDOW_HOURS = 24
        self.MAX_RECENT_CLASSIFICATIONS = 10
    
    def classify(
        self,
        user_id: str,
        keyword_matches: List[KeywordMatch],
        emotion_triggers: List[EmotionTrigger],
        behavioral_triggers: List[BehavioralTrigger],
        context: Optional[Dict[str, Any]] = None
    ) -> CrisisClassification:
        """
        Classify the crisis level based on all detection inputs.
        
        Args:
            user_id: The user identifier
            keyword_matches: List of keyword matches
            emotion_triggers: List of emotion triggers
            behavioral_triggers: List of behavioral triggers
            context: Additional context (e.g., user history, previous crises)
            
        Returns:
            CrisisClassification with level and recommended response
        """
        indicators = []
        
        # Process keyword matches
        keyword_indicators = self._process_keywords(keyword_matches)
        indicators.extend(keyword_indicators)
        
        # Process emotion triggers
        emotion_indicators = self._process_emotions(emotion_triggers)
        indicators.extend(emotion_indicators)
        
        # Process behavioral triggers
        behavioral_indicators = self._process_behavioral(behavioral_triggers)
        indicators.extend(behavioral_indicators)
        
        # Calculate total score
        total_score = sum(i.severity_score for i in indicators)
        
        # Apply multipliers for combined risk
        if self._has_combined_risk(indicators):
            total_score = int(total_score * self.thresholds.COMBINED_RISK_MULTIPLIER)
        
        # Check for repeated indicators (escalation)
        if self._is_escalating_pattern(user_id, indicators):
            total_score = int(total_score * self.thresholds.REPEATED_INDICATOR_MULTIPLIER)
        
        # Determine crisis level
        level = self._determine_level(total_score)
        
        # Determine crisis type
        crisis_type = self._determine_crisis_type(indicators)
        
        # Calculate confidence
        confidence = self._calculate_confidence(indicators)
        
        # Get primary triggers
        primary_triggers = self._get_primary_triggers(indicators)
        
        # Generate classification reason
        reason = self._generate_classification_reason(level, indicators, total_score)
        
        # Determine recommended response
        recommended_response = self._get_recommended_response(level, crisis_type)
        
        classification = CrisisClassification(
            level=level,
            crisis_type=crisis_type,
            total_score=total_score,
            confidence=confidence,
            indicators=indicators,
            primary_triggers=primary_triggers,
            recommended_response=recommended_response,
            requires_immediate_action=level in [CrisisLevel.IMMEDIATE, CrisisLevel.HIGH],
            timestamp=datetime.utcnow(),
            classification_reason=reason
        )
        
        # Store classification for escalation tracking
        self._store_classification(user_id, classification)
        
        return classification
    
    def _process_keywords(self, matches: List[KeywordMatch]) -> List[CrisisIndicator]:
        """Convert keyword matches to crisis indicators."""
        indicators = []
        
        # Track unique keywords to avoid duplicate scoring
        seen_keywords: Set[str] = set()
        
        for match in matches:
            # Skip duplicates
            if match.keyword in seen_keywords:
                continue
            seen_keywords.add(match.keyword)
            
            # Map keyword severity to score
            if match.severity == KeywordSeverity.CRITICAL:
                score = self.thresholds.KEYWORD_CRITICAL_SCORE
            elif match.severity == KeywordSeverity.HIGH:
                score = self.thresholds.KEYWORD_HIGH_SCORE
            elif match.severity == KeywordSeverity.MODERATE:
                score = self.thresholds.KEYWORD_MODERATE_SCORE
            else:
                score = self.thresholds.KEYWORD_LOW_SCORE
            
            indicators.append(CrisisIndicator(
                source="keyword",
                indicator_type=match.category,
                severity_score=score,
                confidence=0.9 if match.severity == KeywordSeverity.CRITICAL else 0.8,
                details={
                    "keyword": match.keyword,
                    "context": match.context,
                    "position": match.position
                },
                timestamp=datetime.utcnow()
            ))
        
        return indicators
    
    def _process_emotions(self, triggers: List[EmotionTrigger]) -> List[CrisisIndicator]:
        """Convert emotion triggers to crisis indicators."""
        indicators = []
        
        for trigger in triggers:
            # Map trigger severity to score
            if trigger.severity == CrisisLevel.IMMEDIATE:
                score = self.thresholds.EMOTION_CRITICAL_SCORE + 10
            elif trigger.severity == CrisisLevel.HIGH:
                score = self.thresholds.EMOTION_HIGH_SCORE
            elif trigger.severity == CrisisLevel.MODERATE:
                score = self.thresholds.EMOTION_MODERATE_SCORE
            else:
                score = 5
            
            # Boost score for combined emotions (hopelessness indicator)
            if trigger.trigger_type == EmotionTriggerType.COMBINED_NEGATIVE_EMOTIONS:
                score += 15
            
            indicators.append(CrisisIndicator(
                source="emotion",
                indicator_type=trigger.trigger_type.value,
                severity_score=score,
                confidence=trigger.confidence,
                details={
                    "description": trigger.description,
                    "emotion_scores": trigger.emotion_scores,
                    "duration_minutes": trigger.duration_minutes
                },
                timestamp=trigger.timestamp
            ))
        
        return indicators
    
    def _process_behavioral(self, triggers: List[BehavioralTrigger]) -> List[CrisisIndicator]:
        """Convert behavioral triggers to crisis indicators."""
        indicators = []
        
        for trigger in triggers:
            # Map trigger severity to score
            if trigger.severity == CrisisLevel.IMMEDIATE:
                score = self.thresholds.BEHAVIORAL_CRITICAL_SCORE
            elif trigger.severity == CrisisLevel.HIGH:
                score = self.thresholds.BEHAVIORAL_HIGH_SCORE
            elif trigger.severity == CrisisLevel.MODERATE:
                score = self.thresholds.BEHAVIORAL_MODERATE_SCORE
            else:
                score = 5
            
            # Boost score for extended absence
            if trigger.trigger_type == BehavioralTriggerType.EXTENDED_ABSENCE:
                days = trigger.metrics.get('days_absent', 0)
                if days >= 7:
                    score += 10
            
            indicators.append(CrisisIndicator(
                source="behavioral",
                indicator_type=trigger.trigger_type.value,
                severity_score=score,
                confidence=trigger.confidence,
                details={
                    "description": trigger.description,
                    "metrics": trigger.metrics,
                    "recommended_action": trigger.recommended_action
                },
                timestamp=trigger.timestamp
            ))
        
        return indicators
    
    def _has_combined_risk(self, indicators: List[CrisisIndicator]) -> bool:
        """Check if there are indicators from multiple sources (combined risk)."""
        sources = set(i.source for i in indicators)
        return len(sources) >= 2
    
    def _is_escalating_pattern(
        self, 
        user_id: str, 
        current_indicators: List[CrisisIndicator]
    ) -> bool:
        """Check if there's an escalating pattern of crisis indicators."""
        recent = self.recent_classifications.get(user_id, [])
        
        if len(recent) < 2:
            return False
        
        # Check for repeated similar indicators within escalation window
        indicator_types = set(i.indicator_type for i in current_indicators)
        
        for classification in recent:
            time_diff = (datetime.utcnow() - classification.timestamp).total_seconds() / 3600
            if time_diff > self.ESCALATION_WINDOW_HOURS:
                continue
            
            recent_types = set(i.indicator_type for i in classification.indicators)
            if indicator_types & recent_types:  # Overlapping indicator types
                return True
        
        return False
    
    def _determine_level(self, total_score: int) -> CrisisLevel:
        """Determine crisis level based on total score."""
        if total_score >= self.thresholds.IMMEDIATE_THRESHOLD:
            return CrisisLevel.IMMEDIATE
        elif total_score >= self.thresholds.HIGH_THRESHOLD:
            return CrisisLevel.HIGH
        elif total_score >= self.thresholds.MODERATE_THRESHOLD:
            return CrisisLevel.MODERATE
        else:
            return CrisisLevel.LOW_CONCERN
    
    def _determine_crisis_type(self, indicators: List[CrisisIndicator]) -> CrisisType:
        """Determine the primary crisis type based on indicators."""
        # Count indicators by type
        type_counts: Dict[str, int] = {}
        
        for indicator in indicators:
            if indicator.source == "keyword":
                category = indicator.details.get("keyword", "")
                if "suicidal" in indicator.indicator_type or any(kw in category for kw in ["kill", "suicide", "end my life"]):
                    type_counts["suicidal"] = type_counts.get("suicidal", 0) + indicator.severity_score
                elif "self_harm" in indicator.indicator_type or any(kw in category for kw in ["cut", "hurt myself", "burn"]):
                    type_counts["self_harm"] = type_counts.get("self_harm", 0) + indicator.severity_score
                elif "hopelessness" in indicator.indicator_type:
                    type_counts["hopelessness"] = type_counts.get("hopelessness", 0) + indicator.severity_score
            
            elif indicator.source == "emotion":
                if indicator.indicator_type == "combined_negative_emotions":
                    type_counts["combined"] = type_counts.get("combined", 0) + indicator.severity_score
                elif indicator.indicator_type in ["sustained_sadness", "sustained_fear", "sustained_distress"]:
                    type_counts["emotional_distress"] = type_counts.get("emotional_distress", 0) + indicator.severity_score
            
            elif indicator.source == "behavioral":
                if indicator.indicator_type in ["sudden_withdrawal", "extended_absence"]:
                    type_counts["withdrawal"] = type_counts.get("withdrawal", 0) + indicator.severity_score
        
        # Determine primary type
        if not type_counts:
            return CrisisType.EMOTIONAL_DISTRESS
        
        primary = max(type_counts, key=type_counts.get)
        
        type_mapping = {
            "suicidal": CrisisType.SUICIDAL_IDEATION,
            "self_harm": CrisisType.SELF_HARM,
            "hopelessness": CrisisType.HOPELESSNESS,
            "combined": CrisisType.COMBINED_RISK,
            "emotional_distress": CrisisType.EMOTIONAL_DISTRESS,
            "withdrawal": CrisisType.BEHAVIORAL_WITHDRAWAL
        }
        
        return type_mapping.get(primary, CrisisType.EMOTIONAL_DISTRESS)
    
    def _calculate_confidence(self, indicators: List[CrisisIndicator]) -> float:
        """Calculate overall confidence in the classification."""
        if not indicators:
            return 0.0
        
        # Weight by severity and confidence
        total_weight = sum(i.severity_score * i.confidence for i in indicators)
        total_score = sum(i.severity_score for i in indicators)
        
        if total_score == 0:
            return 0.0
        
        base_confidence = total_weight / total_score
        
        # Boost confidence with more indicators
        indicator_boost = min(len(indicators) * 0.05, 0.2)
        
        return min(base_confidence + indicator_boost, 1.0)
    
    def _get_primary_triggers(self, indicators: List[CrisisIndicator]) -> List[str]:
        """Get the primary triggers that contributed to classification."""
        # Sort by severity score and get top triggers
        sorted_indicators = sorted(
            indicators, 
            key=lambda i: i.severity_score * i.confidence, 
            reverse=True
        )
        
        primary = []
        for indicator in sorted_indicators[:3]:  # Top 3
            if indicator.source == "keyword":
                primary.append(f"keyword: {indicator.details.get('keyword', 'unknown')}")
            elif indicator.source == "emotion":
                primary.append(f"emotion: {indicator.indicator_type}")
            elif indicator.source == "behavioral":
                primary.append(f"behavioral: {indicator.indicator_type}")
        
        return primary
    
    def _generate_classification_reason(
        self, 
        level: CrisisLevel, 
        indicators: List[CrisisIndicator],
        total_score: int
    ) -> str:
        """Generate a human-readable reason for the classification."""
        if not indicators:
            return "No crisis indicators detected"
        
        # Count by source
        keyword_count = sum(1 for i in indicators if i.source == "keyword")
        emotion_count = sum(1 for i in indicators if i.source == "emotion")
        behavioral_count = sum(1 for i in indicators if i.source == "behavioral")
        
        parts = [f"Crisis level {level.value.upper()} (score: {total_score})"]
        
        if keyword_count > 0:
            critical_keywords = [
                i.details.get("keyword", "") 
                for i in indicators 
                if i.source == "keyword" and i.severity_score >= self.thresholds.KEYWORD_HIGH_SCORE
            ]
            if critical_keywords:
                parts.append(f"Critical keywords detected: {', '.join(critical_keywords[:3])}")
            else:
                parts.append(f"{keyword_count} keyword indicators")
        
        if emotion_count > 0:
            emotion_types = set(i.indicator_type for i in indicators if i.source == "emotion")
            parts.append(f"Emotion triggers: {', '.join(emotion_types)}")
        
        if behavioral_count > 0:
            behavioral_types = set(i.indicator_type for i in indicators if i.source == "behavioral")
            parts.append(f"Behavioral changes: {', '.join(behavioral_types)}")
        
        return "; ".join(parts)
    
    def _get_recommended_response(self, level: CrisisLevel, crisis_type: CrisisType) -> str:
        """Get the recommended response action for the crisis level."""
        responses = {
            CrisisLevel.IMMEDIATE: {
                CrisisType.SUICIDAL_IDEATION: "IMMEDIATE: Contact emergency services and crisis counselor simultaneously",
                CrisisType.SELF_HARM: "IMMEDIATE: Contact emergency services if active harm, crisis counselor immediately",
                CrisisType.HOPELESSNESS: "IMMEDIATE: Human crisis counselor intervention required immediately",
                CrisisType.COMBINED_RISK: "IMMEDIATE: Full crisis protocol - emergency services, counselor, caregiver",
                CrisisType.EMOTIONAL_DISTRESS: "IMMEDIATE: Human crisis counselor intervention required",
                CrisisType.BEHAVIORAL_WITHDRAWAL: "IMMEDIATE: Welfare check and crisis counselor contact",
            },
            CrisisLevel.HIGH: {
                CrisisType.SUICIDAL_IDEATION: "HIGH: Human crisis counselor review within 15 minutes",
                CrisisType.SELF_HARM: "HIGH: Human crisis counselor review within 15 minutes",
                CrisisType.HOPELESSNESS: "HIGH: Human crisis counselor review within 30 minutes",
                CrisisType.COMBINED_RISK: "HIGH: Human crisis counselor review within 15 minutes",
                CrisisType.EMOTIONAL_DISTRESS: "HIGH: Human review within 1 hour",
                CrisisType.BEHAVIORAL_WITHDRAWAL: "HIGH: Caregiver notification and check-in",
            },
            CrisisLevel.MODERATE: {
                CrisisType.SUICIDAL_IDEATION: "MODERATE: Enhanced monitoring, resources provided, check-in scheduled",
                CrisisType.SELF_HARM: "MODERATE: Enhanced monitoring, resources provided, check-in scheduled",
                CrisisType.HOPELESSNESS: "MODERATE: Proactive outreach, coping resources provided",
                CrisisType.COMBINED_RISK: "MODERATE: Enhanced monitoring and proactive support",
                CrisisType.EMOTIONAL_DISTRESS: "MODERATE: Supportive response, resources offered",
                CrisisType.BEHAVIORAL_WITHDRAWAL: "MODERATE: Gentle re-engagement attempt",
            },
            CrisisLevel.LOW_CONCERN: {
                CrisisType.SUICIDAL_IDEATION: "LOW: Monitor and document",
                CrisisType.SELF_HARM: "LOW: Monitor and document",
                CrisisType.HOPELESSNESS: "LOW: Subtle mood check-in",
                CrisisType.COMBINED_RISK: "LOW: Monitor and document",
                CrisisType.EMOTIONAL_DISTRESS: "LOW: Normal supportive response",
                CrisisType.BEHAVIORAL_WITHDRAWAL: "LOW: Monitor activity patterns",
            }
        }
        
        level_responses = responses.get(level, responses[CrisisLevel.LOW_CONCERN])
        return level_responses.get(crisis_type, level_responses[CrisisType.EMOTIONAL_DISTRESS])
    
    def _store_classification(self, user_id: str, classification: CrisisClassification):
        """Store classification for escalation tracking."""
        if user_id not in self.recent_classifications:
            self.recent_classifications[user_id] = []
        
        self.recent_classifications[user_id].append(classification)
        
        # Trim to max size
        if len(self.recent_classifications[user_id]) > self.MAX_RECENT_CLASSIFICATIONS:
            self.recent_classifications[user_id] = self.recent_classifications[user_id][-self.MAX_RECENT_CLASSIFICATIONS:]
    
    def get_classification_history(self, user_id: str) -> List[CrisisClassification]:
        """Get recent classification history for a user."""
        return self.recent_classifications.get(user_id, [])
    
    def quick_classify_text(self, text: str) -> CrisisClassification:
        """
        Quick classification based on text alone (for immediate screening).
        
        This is a simplified classification that only uses keyword detection
        for rapid initial assessment.
        """
        keyword_matches = crisis_keywords.detect_keywords(text)
        
        return self.classify(
            user_id="quick_screen",
            keyword_matches=keyword_matches,
            emotion_triggers=[],
            behavioral_triggers=[]
        )


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

crisis_classifier = CrisisClassifier()
