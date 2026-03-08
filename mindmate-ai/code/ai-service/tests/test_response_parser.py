"""
Tests for Response Parser
"""

import pytest
from src.response_parser import (
    TaskExtractor,
    CrisisDetector,
    ResponseParser,
    ParsedResponse
)
from src.models import TaskType, CrisisLevel, CrisisSignal


class TestTaskExtractor:
    """Test TaskExtractor functionality."""
    
    def test_extract_single_task(self):
        extractor = TaskExtractor()
        message = "Let's practice breathing. [TASK:breathing_exercise]"
        
        clean, tasks = extractor.extract_tasks(message)
        
        assert len(tasks) == 1
        assert tasks[0].task_type == TaskType.BREATHING_EXERCISE
        assert "[TASK:" not in clean
    
    def test_extract_multiple_tasks(self):
        extractor = TaskExtractor()
        message = "Try these: [TASK:journaling] and [TASK:meditation]"
        
        clean, tasks = extractor.extract_tasks(message)
        
        assert len(tasks) == 2
        task_types = [t.task_type for t in tasks]
        assert TaskType.JOURNALING in task_types
        assert TaskType.MEDITATION in task_types
    
    def test_extract_unknown_task(self):
        extractor = TaskExtractor()
        message = "Try this: [TASK:unknown_task]"
        
        clean, tasks = extractor.extract_tasks(message)
        
        assert len(tasks) == 0
    
    def test_no_tasks(self):
        extractor = TaskExtractor()
        message = "Just a regular message"
        
        clean, tasks = extractor.extract_tasks(message)
        
        assert len(tasks) == 0
        assert clean == message
    
    def test_detect_implicit_breathing_task(self):
        extractor = TaskExtractor()
        message = "Take a deep breath and relax"
        
        tasks = extractor.detect_implicit_tasks(message)
        
        assert len(tasks) == 1
        assert tasks[0].task_type == TaskType.BREATHING_EXERCISE


class TestCrisisDetector:
    """Test CrisisDetector functionality."""
    
    def test_detect_critical_crisis(self):
        detector = CrisisDetector()
        message = "I want to kill myself"
        
        signal = detector.detect_crisis_in_message(message)
        
        assert signal.detected is True
        assert signal.level == CrisisLevel.CRITICAL
        assert len(signal.keywords_detected) > 0
        assert signal.requires_immediate_attention is True
    
    def test_detect_high_crisis(self):
        detector = CrisisDetector()
        message = "I'm thinking about hurting myself"
        
        signal = detector.detect_crisis_in_message(message)
        
        assert signal.detected is True
        assert signal.level == CrisisLevel.HIGH
    
    def test_detect_medium_crisis(self):
        detector = CrisisDetector()
        message = "I feel hopeless and worthless"
        
        signal = detector.detect_crisis_in_message(message)
        
        assert signal.detected is True
        assert signal.level == CrisisLevel.MEDIUM
    
    def test_no_crisis(self):
        detector = CrisisDetector()
        message = "I'm having a good day today"
        
        signal = detector.detect_crisis_in_message(message)
        
        assert signal.detected is False
        assert signal.level == CrisisLevel.NONE
    
    def test_extract_crisis_marker(self):
        detector = CrisisDetector()
        message = "I understand. [CRISIS:high] Please reach out for help."
        
        clean, signal = detector.extract_crisis_marker(message)
        
        assert signal is not None
        assert signal.level == CrisisLevel.HIGH
        assert "[CRISIS:" not in clean
    
    def test_no_crisis_marker(self):
        detector = CrisisDetector()
        message = "Just a regular response"
        
        clean, signal = detector.extract_crisis_marker(message)
        
        assert signal is None
        assert clean == message


class TestResponseParser:
    """Test ResponseParser functionality."""
    
    def test_parse_full_response(self):
        parser = ResponseParser()
        ai_response = (
            "I understand you're feeling stressed. "
            "Let's try some breathing exercises. [TASK:breathing_exercise] "
            "[CRISIS:medium] Please consider talking to someone."
        )
        
        parsed = parser.parse_response(ai_response)
        
        assert "[TASK:" not in parsed.clean_message
        assert "[CRISIS:" not in parsed.clean_message
        assert len(parsed.tasks) == 1
        assert parsed.crisis_signal.detected is True
        assert parsed.crisis_signal.level == CrisisLevel.MEDIUM
    
    def test_merge_crisis_signals_ai_higher(self):
        parser = ResponseParser()
        ai_crisis = CrisisSignal(
            detected=True,
            level=CrisisLevel.HIGH,
            confidence=0.9,
            keywords_detected=[],
            requires_immediate_attention=True
        )
        user_crisis = CrisisSignal(
            detected=True,
            level=CrisisLevel.LOW,
            confidence=0.5,
            keywords_detected=[],
            requires_immediate_attention=False
        )
        
        merged = parser._merge_crisis_signals(ai_crisis, user_crisis)
        
        assert merged.level == CrisisLevel.HIGH
    
    def test_merge_crisis_signals_user_higher(self):
        parser = ResponseParser()
        ai_crisis = CrisisSignal(
            detected=True,
            level=CrisisLevel.LOW,
            confidence=0.5,
            keywords_detected=[],
            requires_immediate_attention=False
        )
        user_crisis = CrisisSignal(
            detected=True,
            level=CrisisLevel.CRITICAL,
            confidence=0.95,
            keywords_detected=["suicide"],
            requires_immediate_attention=True
        )
        
        merged = parser._merge_crisis_signals(ai_crisis, user_crisis)
        
        assert merged.level == CrisisLevel.CRITICAL
    
    def test_quick_crisis_check_positive(self):
        parser = ResponseParser()
        message = "I can't go on anymore"
        
        assert parser.quick_crisis_check(message) is True
    
    def test_quick_crisis_check_negative(self):
        parser = ResponseParser()
        message = "I'm feeling a bit stressed"
        
        assert parser.quick_crisis_check(message) is False
