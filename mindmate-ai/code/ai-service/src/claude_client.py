"""
MindMate AI - Claude API Client
Production-ready Anthropic Claude client with retry logic, token counting, and context management.
"""

import asyncio
import time
from typing import List, Dict, Any, Optional, AsyncGenerator, Callable
from dataclasses import dataclass
from functools import wraps
import anthropic
from anthropic import AsyncAnthropic, RateLimitError, APIError, APITimeoutError
import tiktoken

from config.settings import settings
from config.logging_config import logger
from src.models import (
    ConversationMessage, 
    TokenUsage, 
    AIResponseMetadata,
    EmotionContext
)


@dataclass
class ClaudeResponse:
    """Structured response from Claude API."""
    content: str
    metadata: AIResponseMetadata
    emotion_context: Optional[EmotionContext] = None


class TokenCounter:
    """Token counting utility for context management."""
    
    def __init__(self, model: str = "claude-3-5-sonnet-20241022"):
        self.model = model
        # Claude uses roughly 4 characters per token on average
        self.chars_per_token = 4
        # Reserve tokens for system overhead
        self.overhead_tokens = 100
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count for text."""
        if not text:
            return 0
        # Simple estimation: characters / 4
        return len(text) // self.chars_per_token + self.overhead_tokens
    
    def count_message_tokens(self, messages: List[Dict[str, str]]) -> int:
        """Count tokens in message list."""
        total = 0
        for msg in messages:
            total += self.count_tokens(msg.get("content", ""))
            total += self.overhead_tokens  # Role overhead
        return total
    
    def truncate_to_fit(
        self, 
        messages: List[Dict[str, str]], 
        max_tokens: int,
        preserve_recent: int = 4
    ) -> List[Dict[str, str]]:
        """Truncate messages to fit within token limit while preserving recent context."""
        if not messages:
            return messages
        
        # Always keep system message and recent messages
        system_msg = [m for m in messages if m.get("role") == "system"]
        non_system = [m for m in messages if m.get("role") != "system"]
        
        # Split into to-preserve and can-truncate
        recent = non_system[-preserve_recent:] if len(non_system) > preserve_recent else non_system
        older = non_system[:-preserve_recent] if len(non_system) > preserve_recent else []
        
        current_tokens = (
            self.count_message_tokens(system_msg) + 
            self.count_message_tokens(recent)
        )
        
        # Add older messages until we hit the limit
        result = system_msg.copy()
        
        # Add older messages from oldest to newest (will be truncated from middle)
        for msg in older:
            msg_tokens = self.count_tokens(msg.get("content", ""))
            if current_tokens + msg_tokens < max_tokens * 0.7:  # Leave 30% buffer
                result.append(msg)
                current_tokens += msg_tokens
            else:
                # Add truncation indicator
                result.append({
                    "role": "system",
                    "content": "[Earlier conversation context truncated to fit token limit]"
                })
                break
        
        # Add recent messages
        result.extend(recent)
        
        return result


def retry_with_exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: tuple = (RateLimitError, APITimeoutError, APIError)
):
    """Decorator for retry logic with exponential backoff."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        logger.error(
                            f"Max retries ({max_retries}) exceeded for {func.__name__}",
                            extra={"error": str(e), "attempt": attempt}
                        )
                        raise
                    
                    # Calculate delay with exponential backoff and jitter
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    jitter = delay * 0.1 * (asyncio.get_event_loop().time() % 1)
                    total_delay = delay + jitter
                    
                    logger.warning(
                        f"Retry attempt {attempt + 1}/{max_retries} for {func.__name__} "
                        f"after {total_delay:.2f}s",
                        extra={"error": str(e), "delay": total_delay}
                    )
                    
                    await asyncio.sleep(total_delay)
            
            raise last_exception
        return wrapper
    return decorator


class ClaudeClient:
    """Production-ready Claude API client."""
    
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.CLAUDE_MODEL
        self.max_tokens = settings.CLAUDE_MAX_TOKENS
        self.temperature = settings.CLAUDE_TEMPERATURE
        self.timeout = settings.CLAUDE_TIMEOUT_SECONDS
        self.max_retries = settings.CLAUDE_MAX_RETRIES
        self.retry_delay = settings.CLAUDE_RETRY_DELAY_SECONDS
        self.token_counter = TokenCounter(self.model)
        
        # Request tracking
        self._request_count = 0
        self._token_usage_total = {"input": 0, "output": 0}
    
    @retry_with_exponential_backoff(
        max_retries=settings.CLAUDE_MAX_RETRIES,
        base_delay=settings.CLAUDE_RETRY_DELAY_SECONDS
    )
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        stream: bool = False
    ) -> ClaudeResponse:
        """
        Generate a response from Claude with retry logic.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            tools: Optional tools for function calling
            stream: Whether to stream the response
            
        Returns:
            ClaudeResponse with content and metadata
        """
        start_time = time.time()
        
        # Prepare parameters
        params = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens or self.max_tokens,
            "temperature": temperature or self.temperature,
            "timeout": self.timeout,
        }
        
        if system_prompt:
            params["system"] = system_prompt
        
        if tools:
            params["tools"] = tools
        
        try:
            self._request_count += 1
            request_id = self._request_count
            
            logger.info(
                f"Claude API request #{request_id}",
                extra={
                    "model": self.model,
                    "message_count": len(messages),
                    "has_system_prompt": bool(system_prompt),
                    "has_tools": bool(tools)
                }
            )
            
            if stream:
                return await self._stream_response(params, start_time)
            
            # Make API call
            response = await self.client.messages.create(**params)
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Extract content
            content = ""
            if response.content:
                for block in response.content:
                    if block.type == "text":
                        content += block.text
            
            # Calculate token usage
            input_tokens = response.usage.input_tokens if response.usage else 0
            output_tokens = response.usage.output_tokens if response.usage else 0
            
            self._token_usage_total["input"] += input_tokens
            self._token_usage_total["output"] += output_tokens
            
            # Estimate cost (Claude 3.5 Sonnet: $3/M input, $15/M output)
            estimated_cost = (input_tokens * 3 + output_tokens * 15) / 1_000_000
            
            token_usage = TokenUsage(
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                estimated_cost_usd=estimated_cost
            )
            
            metadata = AIResponseMetadata(
                model=self.model,
                token_usage=token_usage,
                latency_ms=latency_ms,
                finish_reason=response.stop_reason or "unknown",
                system_fingerprint=getattr(response, 'system_fingerprint', None)
            )
            
            logger.info(
                f"Claude API response #{request_id} completed",
                extra={
                    "latency_ms": latency_ms,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "finish_reason": response.stop_reason
                }
            )
            
            return ClaudeResponse(content=content, metadata=metadata)
            
        except RateLimitError as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise
        except APITimeoutError as e:
            logger.error(f"Claude API timeout: {e}")
            raise
        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in Claude client: {e}")
            raise
    
    async def _stream_response(
        self, 
        params: Dict[str, Any], 
        start_time: float
    ) -> ClaudeResponse:
        """Handle streaming response from Claude."""
        content_parts = []
        input_tokens = 0
        output_tokens = 0
        
        async with self.client.messages.stream(**params) as stream:
            async for text in stream.text_stream:
                content_parts.append(text)
            
            # Get final message
            final_message = await stream.get_final_message()
            
            if final_message.usage:
                input_tokens = final_message.usage.input_tokens
                output_tokens = final_message.usage.output_tokens
        
        content = "".join(content_parts)
        latency_ms = (time.time() - start_time) * 1000
        
        token_usage = TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            estimated_cost_usd=(input_tokens * 3 + output_tokens * 15) / 1_000_000
        )
        
        metadata = AIResponseMetadata(
            model=self.model,
            token_usage=token_usage,
            latency_ms=latency_ms,
            finish_reason="stop",
            system_fingerprint=None
        )
        
        return ClaudeResponse(content=content, metadata=metadata)
    
    def prepare_messages(
        self,
        conversation_history: List[ConversationMessage],
        user_message: str,
        system_prompt: Optional[str] = None,
        max_context_tokens: int = 150000
    ) -> List[Dict[str, str]]:
        """
        Prepare messages for Claude API with context management.
        
        Args:
            conversation_history: Previous conversation messages
            user_message: Current user message
            system_prompt: Optional system prompt to include
            max_context_tokens: Maximum tokens for context
            
        Returns:
            List of formatted messages ready for API
        """
        messages = []
        
        # Convert conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Truncate if needed
        total_tokens = self.token_counter.count_message_tokens(messages)
        if total_tokens > max_context_tokens:
            logger.warning(
                f"Context exceeds token limit ({total_tokens} > {max_context_tokens}), truncating",
                extra={"original_tokens": total_tokens}
            )
            messages = self.token_counter.truncate_to_fit(
                messages, 
                max_context_tokens,
                preserve_recent=4
            )
        
        return messages
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get cumulative token usage statistics."""
        return {
            "total_requests": self._request_count,
            "total_input_tokens": self._token_usage_total["input"],
            "total_output_tokens": self._token_usage_total["output"],
            "total_tokens": self._token_usage_total["input"] + self._token_usage_total["output"],
            "estimated_total_cost_usd": (
                self._token_usage_total["input"] * 3 + 
                self._token_usage_total["output"] * 15
            ) / 1_000_000
        }
    
    async def close(self):
        """Close the client connection."""
        await self.client.close()


# Singleton instance
_claude_client: Optional[ClaudeClient] = None


def get_claude_client() -> ClaudeClient:
    """Get or create singleton Claude client instance."""
    global _claude_client
    if _claude_client is None:
        _claude_client = ClaudeClient()
    return _claude_client


async def close_claude_client():
    """Close the singleton Claude client."""
    global _claude_client
    if _claude_client:
        await _claude_client.close()
        _claude_client = None
