"""
Tests for Claude API Client
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import anthropic

from src.claude_client import (
    ClaudeClient,
    TokenCounter,
    retry_with_exponential_backoff,
    get_claude_client
)
from src.models import ConversationMessage


class TestTokenCounter:
    """Test TokenCounter functionality."""
    
    def test_count_tokens_basic(self):
        counter = TokenCounter()
        text = "Hello world"
        tokens = counter.count_tokens(text)
        assert tokens > 0
    
    def test_count_tokens_empty(self):
        counter = TokenCounter()
        assert counter.count_tokens("") == 0
    
    def test_count_message_tokens(self):
        counter = TokenCounter()
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
        tokens = counter.count_message_tokens(messages)
        assert tokens > 0
    
    def test_truncate_to_fit(self):
        counter = TokenCounter()
        messages = [
            {"role": "system", "content": "System prompt"},
            {"role": "user", "content": "Message 1"},
            {"role": "assistant", "content": "Response 1"},
            {"role": "user", "content": "Message 2"},
            {"role": "assistant", "content": "Response 2"},
        ]
        
        truncated = counter.truncate_to_fit(messages, max_tokens=100)
        assert len(truncated) <= len(messages)
        # System message should be preserved
        assert any(m["role"] == "system" for m in truncated)


class TestRetryDecorator:
    """Test retry decorator functionality."""
    
    @pytest.mark.asyncio
    async def test_retry_success(self):
        call_count = 0
        
        @retry_with_exponential_backoff(max_retries=2, base_delay=0.1)
        async def success_func():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await success_func()
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_retry_failure(self):
        call_count = 0
        
        @retry_with_exponential_backoff(max_retries=2, base_delay=0.1)
        async def fail_func():
            nonlocal call_count
            call_count += 1
            raise Exception("Test error")
        
        with pytest.raises(Exception):
            await fail_func()
        
        assert call_count == 3  # Initial + 2 retries


class TestClaudeClient:
    """Test ClaudeClient functionality."""
    
    @pytest.fixture
    def mock_anthropic(self):
        with patch('src.claude_client.AsyncAnthropic') as mock:
            yield mock
    
    @pytest.mark.asyncio
    async def test_generate_response(self, mock_anthropic):
        # Mock response
        mock_response = Mock()
        mock_response.content = [Mock(type="text", text="Hello!")]
        mock_response.usage = Mock(input_tokens=10, output_tokens=5)
        mock_response.stop_reason = "end_turn"
        
        mock_client = Mock()
        mock_client.messages = Mock()
        mock_client.messages.create = AsyncMock(return_value=mock_response)
        mock_anthropic.return_value = mock_client
        
        client = ClaudeClient()
        
        messages = [{"role": "user", "content": "Hi"}]
        response = await client.generate_response(messages)
        
        assert response.content == "Hello!"
        assert response.metadata.token_usage.input_tokens == 10
        assert response.metadata.token_usage.output_tokens == 5
    
    def test_prepare_messages(self):
        client = ClaudeClient()
        
        history = [
            ConversationMessage(role="user", content="Hello"),
            ConversationMessage(role="assistant", content="Hi!"),
        ]
        
        messages = client.prepare_messages(history, "How are you?")
        
        assert len(messages) == 3
        assert messages[-1]["role"] == "user"
        assert messages[-1]["content"] == "How are you?"
    
    def test_get_usage_stats(self):
        client = ClaudeClient()
        client._request_count = 5
        client._token_usage_total = {"input": 1000, "output": 500}
        
        stats = client.get_usage_stats()
        
        assert stats["total_requests"] == 5
        assert stats["total_input_tokens"] == 1000
        assert stats["total_output_tokens"] == 500
        assert "estimated_total_cost_usd" in stats


class TestGetClaudeClient:
    """Test singleton client getter."""
    
    def test_singleton(self):
        client1 = get_claude_client()
        client2 = get_claude_client()
        assert client1 is client2
