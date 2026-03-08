"""
MindMate AI - Text-to-Speech Service (ElevenLabs)
Integration with ElevenLabs API for high-quality voice synthesis.
"""

import asyncio
import io
import base64
from typing import Optional, Dict, Any, AsyncGenerator, Union
from dataclasses import dataclass
from pathlib import Path

import aiohttp
from aiohttp import ClientTimeout

from config.settings import settings
from config.logging_config import logger
from src.models import TTSRequest, TTSResponse


@dataclass
class TTSOptions:
    """Options for TTS generation."""
    voice_id: str
    model: str
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True
    output_format: str = "mp3_44100_128"


class ElevenLabsClient:
    """Client for ElevenLabs TTS API."""
    
    BASE_URL = "https://api.elevenlabs.io/v1"
    
    # Available models
    MODELS = {
        "eleven_multilingual_v2": "eleven_multilingual_v2",
        "eleven_turbo_v2_5": "eleven_turbo_v2_5",
        "eleven_monolingual_v1": "eleven_monolingual_v1",
    }
    
    # Default voice IDs (popular voices)
    DEFAULT_VOICES = {
        "rachel": "21m00Tcm4TlvDq8ikWAM",
        "adam": "pNInz6obpgDQGcFmaJgB",
        "bella": "EXAVITQu4vr4xnSDxMaL",
        "antoni": "ErXwobaYiN019PkySvjV",
        "elli": "MF3mGyEYCl7XYWbV9V6O",
        "josh": "TxGEqnHWrfWFTfGW9XjX",
        "arnold": "VR6AewLTigWG4xSOukaG",
        "adam_professional": "pNInz6obpgDQGcFmaJgB",
    }
    
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.default_voice_id = settings.ELEVENLABS_VOICE_ID
        self.default_model = settings.ELEVENLABS_MODEL
        self.timeout = ClientTimeout(total=settings.ELEVENLABS_TIMEOUT_SECONDS)
        
        self._session: Optional[aiohttp.ClientSession] = None
        self._request_count = 0
        self._character_count_total = 0
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self._session
    
    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style: float = 0.0,
        use_speaker_boost: bool = True,
        output_format: str = "mp3_44100_128",
        stream: bool = False
    ) -> Union[bytes, AsyncGenerator[bytes, None]]:
        """
        Generate speech from text.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice ID to use
            model: Model to use
            stability: Voice stability (0-1)
            similarity_boost: Similarity boost (0-1)
            style: Style exaggeration (0-1)
            use_speaker_boost: Use speaker boost
            output_format: Output audio format
            stream: Whether to stream the audio
            
        Returns:
            Audio bytes or async generator of audio chunks
        """
        voice_id = voice_id or self.default_voice_id
        model = model or self.default_model
        
        # Validate text length (ElevenLabs limit is ~5000 chars)
        if len(text) > 5000:
            logger.warning(f"Text too long ({len(text)} chars), truncating to 5000")
            text = text[:5000]
        
        url = f"{self.BASE_URL}/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        payload = {
            "text": text,
            "model_id": model,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style,
                "use_speaker_boost": use_speaker_boost
            }
        }
        
        params = {
            "output_format": output_format
        }
        
        if stream:
            params["optimize_streaming_latency"] = "3"
        
        try:
            self._request_count += 1
            self._character_count_total += len(text)
            
            logger.info(
                f"ElevenLabs TTS request #{self._request_count}",
                extra={
                    "voice_id": voice_id,
                    "model": model,
                    "text_length": len(text),
                    "stream": stream
                }
            )
            
            session = await self._get_session()
            
            if stream:
                return self._stream_audio(session, url, headers, payload, params)
            
            async with session.post(
                url, 
                headers=headers, 
                json=payload, 
                params=params
            ) as response:
                if response.status == 200:
                    audio_data = await response.read()
                    
                    logger.info(
                        f"ElevenLabs TTS completed",
                        extra={
                            "audio_size_bytes": len(audio_data),
                            "voice_id": voice_id
                        }
                    )
                    
                    return audio_data
                else:
                    error_text = await response.text()
                    logger.error(
                        f"ElevenLabs API error: {response.status}",
                        extra={"error": error_text}
                    )
                    raise Exception(f"ElevenLabs API error {response.status}: {error_text}")
                    
        except asyncio.TimeoutError:
            logger.error("ElevenLabs TTS timeout")
            raise
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise
    
    async def _stream_audio(
        self,
        session: aiohttp.ClientSession,
        url: str,
        headers: Dict[str, str],
        payload: Dict[str, Any],
        params: Dict[str, str]
    ) -> AsyncGenerator[bytes, None]:
        """Stream audio chunks from ElevenLabs."""
        async with session.post(
            url,
            headers=headers,
            json=payload,
            params=params
        ) as response:
            if response.status == 200:
                async for chunk in response.content.iter_chunked(8192):
                    yield chunk
            else:
                error_text = await response.text()
                raise Exception(f"Streaming error {response.status}: {error_text}")
    
    async def generate_speech_from_request(
        self, 
        request: TTSRequest
    ) -> TTSResponse:
        """
        Generate speech from a TTSRequest object.
        
        Args:
            request: TTS request with text and options
            
        Returns:
            TTSResponse with audio URL/data
        """
        voice_id = request.voice_id or self.default_voice_id
        model = request.model or self.default_model
        
        audio_data = await self.generate_speech(
            text=request.text,
            voice_id=voice_id,
            model=model,
            stability=request.stability,
            similarity_boost=request.similarity_boost
        )
        
        # Estimate duration (rough approximation: ~13 chars per second)
        estimated_duration = len(request.text) / 13
        
        # In production, you'd upload to S3/CDN and return URL
        # For now, return base64 encoded data
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        data_url = f"data:audio/mpeg;base64,{audio_base64}"
        
        return TTSResponse(
            audio_url=data_url,
            duration_seconds=estimated_duration,
            character_count=len(request.text),
            voice_id=voice_id
        )
    
    async def get_voices(self) -> List[Dict[str, Any]]:
        """Get list of available voices."""
        url = f"{self.BASE_URL}/voices"
        
        headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }
        
        try:
            session = await self._get_session()
            
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("voices", [])
                else:
                    error_text = await response.text()
                    raise Exception(f"API error {response.status}: {error_text}")
                    
        except Exception as e:
            logger.error(f"Error fetching voices: {e}")
            raise
    
    async def get_voice_settings(self, voice_id: str) -> Dict[str, Any]:
        """Get settings for a specific voice."""
        url = f"{self.BASE_URL}/voices/{voice_id}"
        
        headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }
        
        try:
            session = await self._get_session()
            
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"API error {response.status}: {error_text}")
                    
        except Exception as e:
            logger.error(f"Error fetching voice settings: {e}")
            raise
    
    def estimate_duration(self, text: str, wpm: int = 150) -> float:
        """
        Estimate audio duration for text.
        
        Args:
            text: Text to estimate
            wpm: Words per minute (default 150)
            
        Returns:
            Estimated duration in seconds
        """
        word_count = len(text.split())
        return (word_count / wpm) * 60
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get TTS usage statistics."""
        return {
            "total_requests": self._request_count,
            "total_characters": self._character_count_total,
            "estimated_cost_usd": self._character_count_total / 1000 * 0.30  # $0.30 per 1000 chars
        }
    
    async def close(self):
        """Close the client session."""
        if self._session and not self._session.closed:
            await self._session.close()


class TTSService:
    """High-level TTS service with caching and optimization."""
    
    def __init__(self):
        self.client = ElevenLabsClient()
        self._cache: Dict[str, bytes] = {}
        self._cache_enabled = True
        self._max_cache_size = 100
    
    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        use_cache: bool = True,
        return_url: bool = True
    ) -> Union[str, bytes]:
        """
        Synthesize text to speech with caching.
        
        Args:
            text: Text to synthesize
            voice_id: Voice ID to use
            use_cache: Whether to use caching
            return_url: Whether to return URL (vs raw bytes)
            
        Returns:
            Audio URL or raw bytes
        """
        voice_id = voice_id or settings.ELEVENLABS_VOICE_ID
        
        # Check cache
        cache_key = f"{voice_id}:{hash(text)}"
        if use_cache and self._cache_enabled and cache_key in self._cache:
            logger.info("TTS cache hit")
            audio_data = self._cache[cache_key]
        else:
            # Generate new audio
            audio_data = await self.client.generate_speech(
                text=text,
                voice_id=voice_id
            )
            
            # Cache if enabled
            if use_cache and self._cache_enabled:
                if len(self._cache) >= self._max_cache_size:
                    # Remove oldest entry
                    oldest_key = next(iter(self._cache))
                    del self._cache[oldest_key]
                
                self._cache[cache_key] = audio_data
        
        if return_url:
            # Return data URL
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            return f"data:audio/mpeg;base64,{audio_base64}"
        
        return audio_data
    
    async def synthesize_chat_response(
        self, 
        response_text: str,
        voice_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Synthesize a chat response, handling length limits.
        
        Args:
            response_text: Chat response text
            voice_id: Voice ID to use
            
        Returns:
            Audio URL or None if synthesis fails
        """
        # Truncate if too long
        max_chars = 4000  # Leave buffer for ElevenLabs limit
        if len(response_text) > max_chars:
            # Try to break at sentence boundary
            truncated = response_text[:max_chars]
            last_period = truncated.rfind('.')
            if last_period > max_chars * 0.8:
                response_text = truncated[:last_period + 1]
            else:
                response_text = truncated
        
        try:
            audio_url = await self.synthesize(response_text, voice_id)
            return audio_url
        except Exception as e:
            logger.error(f"Failed to synthesize chat response: {e}")
            return None
    
    def clear_cache(self):
        """Clear the TTS cache."""
        self._cache.clear()
        logger.info("TTS cache cleared")
    
    async def close(self):
        """Close the TTS service."""
        await self.client.close()


# Singleton instances
_elevenlabs_client: Optional[ElevenLabsClient] = None
_tts_service: Optional[TTSService] = None


def get_elevenlabs_client() -> ElevenLabsClient:
    """Get singleton ElevenLabs client."""
    global _elevenlabs_client
    if _elevenlabs_client is None:
        _elevenlabs_client = ElevenLabsClient()
    return _elevenlabs_client


def get_tts_service() -> TTSService:
    """Get singleton TTS service."""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
