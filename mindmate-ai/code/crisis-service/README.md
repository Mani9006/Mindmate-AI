# MindMate AI - Crisis Detection Service

## ⚠️ CRITICAL SAFETY CODE ⚠️

This is **life-safety critical code** for the MindMate AI mental health platform. All components have been designed with clinical input and should only be modified by qualified mental health professionals in consultation with engineering.

## Overview

The Crisis Detection Service provides comprehensive mental health crisis detection capabilities, combining:

1. **Keyword/Phrase Detection** - Identifies suicidal ideation, self-harm, and hopelessness indicators
2. **Hume AI Emotion Analysis** - Monitors sustained negative emotional states
3. **Behavioral Pattern Analysis** - Detects withdrawal and activity changes
4. **Crisis Level Classification** - Determines appropriate response level
5. **Response Orchestration** - Coordinates multi-channel crisis response
6. **Emergency Notifications** - Alerts caregivers and crisis counselors
7. **Audit Logging** - Comprehensive event tracking for compliance

## Crisis Levels

| Level | Description | Response Time | Actions |
|-------|-------------|---------------|---------|
| **IMMEDIATE** | Active crisis requiring emergency intervention | < 1 minute | Emergency services, crisis counselor, caregiver notification, chat restriction |
| **HIGH** | Elevated concern requiring prompt attention | < 15 minutes | Human review, caregiver notification, resources provided |
| **MODERATE** | Concerning patterns warranting monitoring | < 1 hour | Proactive outreach, resources offered, check-in scheduled |
| **LOW_CONCERN** | Minor indicators to track | < 24 hours | Subtle monitoring, mood tracking enabled |

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```python
from crisis_service import CrisisDetectionService, CrisisLevel

# Initialize service
service = CrisisDetectionService()

# Process a user message
result = await service.process_user_message(
    user_id="user123",
    message="I'm having thoughts of hurting myself",
    session_id="session456"
)

# Check results
if result.crisis_detected:
    print(f"Crisis Level: {result.classification.level.value}")
    print(f"Type: {result.classification.crisis_type.value}")
    print(f"Recommended Action: {result.classification.recommended_response}")
    
    # Check if immediate action needed
    if result.requires_immediate_action:
        print("⚠️ IMMEDIATE ACTION REQUIRED")
```

## Components

### 1. Keyword Detection (`keywords.py`)

Detects crisis-related keywords and phrases across four severity levels:

- **CRITICAL**: Direct statements of suicidal intent ("I'm going to kill myself")
- **HIGH**: Strong indicators requiring prompt response
- **MODERATE**: Elevated concern indicators
- **LOW**: General distress markers

```python
from crisis_service import crisis_keywords, KeywordSeverity

# Detect keywords in text
matches = crisis_keywords.detect_keywords("I'm feeling hopeless and want to give up")

for match in matches:
    print(f"Found: {match.keyword} ({match.severity.value})")
```

### 2. Emotion Triggers (`emotion_triggers.py`)

Integrates with Hume AI to monitor emotional states:

- Sustained high sadness (> 75% for 10+ minutes)
- Sustained high fear (> 70% for 10+ minutes)
- Combined negative emotions (sadness + fear + distress)
- Emotional volatility
- Emotional numbness

```python
from crisis_service import EmotionReading, emotion_detector

# Create emotion reading
reading = EmotionReading(
    timestamp=datetime.utcnow(),
    emotions={
        "sadness": 0.85,
        "fear": 0.75,
        "distress": 0.80
    },
    source="voice",
    session_id="session123"
)

# Process reading
triggers = emotion_detector.process_emotion_reading("user123", reading)
```

### 3. Behavioral Triggers (`behavioral_triggers.py`)

Monitors user behavior patterns:

- Sudden withdrawal (message frequency drop > 60%)
- Extended absence (5+ consecutive days)
- Message pattern changes (length reduction > 70%)
- Sentiment decline (7-day window)
- Response time increases

```python
from crisis_service import behavioral_detector, UserActivity

# Record user activity
activity = UserActivity(
    timestamp=datetime.utcnow(),
    activity_type="message",
    metadata={"message_length": 150, "sentiment_score": -0.5}
)

triggers = behavioral_detector.record_activity("user123", activity)
```

### 4. Crisis Classifier (`classifier.py`)

Combines all detection inputs to determine crisis level:

```python
from crisis_service import crisis_classifier

classification = crisis_classifier.classify(
    user_id="user123",
    keyword_matches=keyword_matches,
    emotion_triggers=emotion_triggers,
    behavioral_triggers=behavioral_triggers
)

print(f"Level: {classification.level.value}")
print(f"Score: {classification.total_score}")
print(f"Confidence: {classification.confidence}")
```

### 5. Response Orchestrator (`orchestrator.py`)

Coordinates appropriate response actions based on crisis level:

```python
from crisis_service import response_orchestrator

results = await response_orchestrator.orchestrate_response(
    user_id="user123",
    classification=classification,
    user_context={"caregiver_contact": {"phone": "+1234567890"}}
)
```

### 6. Notification Sender (`notifications.py`)

Sends alerts to emergency contacts:

```python
from crisis_service import NotificationRecipient, NotificationRecipientType

recipient = NotificationRecipient(
    recipient_type=NotificationRecipientType.CAREGIVER,
    name="Parent",
    phone="+1234567890",
    email="parent@example.com",
    is_primary=True
)

results = await notification_sender.send_crisis_notification(
    user_id="user123",
    recipient=recipient,
    crisis_level=CrisisLevel.HIGH,
    crisis_type=CrisisType.SUICIDAL_IDEATION
)
```

### 7. Event Logger (`logger.py`)

Comprehensive audit logging:

```python
from crisis_service import crisis_logger, EventType, EventOutcome

# Log detection
event = await crisis_logger.log_detection(
    user_id="user123",
    detection_source="keyword",
    detected_items=["suicidal ideation"]
)

# Log classification
event = await crisis_logger.log_classification(
    user_id="user123",
    classification=classification
)

# Log resolution
event = await crisis_logger.log_resolution(
    user_id="user123",
    session_id="session456",
    resolution_type="counselor_intervention",
    resolved_by="counselor_789"
)
```

## Configuration

All thresholds and settings are defined in `config.py`:

```python
from config import (
    EMOTION_THRESHOLDS,
    BEHAVIORAL_THRESHOLDS,
    CLASSIFICATION_THRESHOLDS,
    RESPONSE_CONFIG,
    CRISIS_RESOURCES
)

# Emotion thresholds
print(EMOTION_THRESHOLDS.SADNESS_HIGH)  # 0.75
print(EMOTION_THRESHOLDS.SUSTAINED_DURATION_MINUTES)  # 10

# Behavioral thresholds
print(BEHAVIORAL_THRESHOLDS.MISSED_DAYS_CRITICAL)  # 5

# Classification thresholds
print(CLASSIFICATION_THRESHOLDS.IMMEDIATE_THRESHOLD)  # 80
```

**⚠️ WARNING: Only modify configuration values after clinical review.**

## Crisis Resources

Built-in crisis resources by region:

```python
from config import CRISIS_RESOURCES

# US resources
us_resources = CRISIS_RESOURCES["us"]
print(us_resources["988_suicide_crisis_lifeline"]["phone"])  # "988"

# UK resources
uk_resources = CRISIS_RESOURCES["uk"]
print(uk_resources["samaritans"]["phone"])  # "116 123"
```

## Testing

Run the test suite:

```bash
python -m pytest tests/
```

## Safety Considerations

1. **All crisis detections are logged** with checksums for integrity
2. **Multiple detection methods** reduce false negatives
3. **Human review is required** for HIGH and IMMEDIATE levels
4. **Emergency contacts are notified** based on user preferences
5. **Chat restrictions** are applied during active crises
6. **Resource provision** is automatic for all detected crises

## Compliance

This service maintains:

- **7-year audit log retention** for clinical compliance
- **Immutable event records** with integrity verification
- **Export capabilities** for regulatory reporting
- **PII masking** for privacy protection

## Emergency Contacts

- **988 Suicide & Crisis Lifeline**: Call or text 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911 (US) / 999 (UK) / 112 (EU)

## License

Copyright © 2024 MindMate AI. All rights reserved.

## Support

For technical support: engineering@mindmate.ai

For clinical consultation: clinical@mindmate.ai

---

**Remember: This code saves lives. Treat it with the care it deserves.**
