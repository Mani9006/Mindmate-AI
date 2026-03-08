# MindMate AI - ElevenLabs Voice Integration Architecture

## Table of Contents

1. [Overview](#overview)
2. [Voice Persona Architecture](#voice-persona-architecture)
3. [Streaming Audio Generation](#streaming-audio-generation)
4. [Latency Optimization](#latency-optimization)
5. [Fallback Voice System](#fallback-voice-system)
6. [Emotional Tone Modulation](#emotional-tone-modulation)
7. [Implementation Code](#implementation-code)
8. [Configuration Reference](#configuration-reference)
9. [Error Handling](#error-handling)
10. [Performance Monitoring](#performance-monitoring)

---

## Overview

This document defines the complete ElevenLabs integration architecture for MindMate AI's voice output system. The integration provides:

- **Multiple avatar personas** with distinct voice characteristics
- **Real-time streaming audio** for natural conversation flow
- **Sub-500ms latency** from text to first audio byte
- **Robust fallback mechanisms** for high availability
- **Dynamic emotional tone modulation** based on user emotional state

### Architecture Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MindMate AI Voice System                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Persona    │  │   Emotion    │  │   Stream     │  │   Fallback   │    │
│  │  Selector    │→ │  Processor   │→ │  Generator   │→ │   Manager    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ↓                 ↓                 ↓                 ↓            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ElevenLabs API Integration                        │   │
│  │         (Streaming TTS with Voice Settings & Latency Opt)            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Voice Persona Architecture

### Persona Definitions

MindMate AI supports four distinct therapist personas, each with unique voice characteristics optimized for different user needs and preferences.

#### 1. Dr. Serene (Default Therapist)

| Attribute | Value |
|-----------|-------|
| **Voice ID** | `Q63G7WZ5riIGbK8KmqO9` |
| **Personality** | Calm, professional, empathetic |
| **Use Case** | General therapy sessions, first-time users |
| **Target Demographic** | All ages, professional setting preference |

**Voice Characteristics:**
- Gender: Male
- Age Range: 30-40
- Tone: Warm, reassuring, authoritative yet approachable
- Speaking Pace: Moderate (150-160 WPM)
- Pitch: Medium-low, stable

```python
DR_SERENE_CONFIG = {
    "voice_id": "Q63G7WZ5riIGbK8KmqO9",
    "name": "Dr. Serene",
    "description": "Professional male therapist with calming presence",
    "settings": {
        "stability": 0.75,        # Consistent, professional tone
        "similarity_boost": 0.65,  # Natural variation
        "style": 0.35,            # Slight expressiveness
        "use_speaker_boost": True
    },
    "default_emotion_profile": "neutral_supportive"
}
```

#### 2. Maya (Compassionate Counselor)

| Attribute | Value |
|-----------|-------|
| **Voice ID** | `NLl76XZRVj1RVeXptX3h` |
| **Personality** | Nurturing, gentle, deeply empathetic |
| **Use Case** | Emotional support, grief counseling, anxiety |
| **Target Demographic** | Users seeking maternal warmth |

**Voice Characteristics:**
- Gender: Female
- Age Range: 28-35
- Tone: Soft, nurturing, patient
- Speaking Pace: Slower (130-140 WPM)
- Pitch: Medium, warm

```python
MAYA_CONFIG = {
    "voice_id": "NLl76XZRVj1RVeXptX3h",
    "name": "Maya",
    "description": "Compassionate female counselor with nurturing warmth",
    "settings": {
        "stability": 0.60,        # More emotional variation
        "similarity_boost": 0.70,  # Closer to natural voice
        "style": 0.45,            # Expressive for empathy
        "use_speaker_boost": True
    },
    "default_emotion_profile": "warm_empathetic"
}
```

#### 3. Alex (Youth-Friendly Guide)

| Attribute | Value |
|-----------|-------|
| **Voice ID** | `At6gj9vUVdJhTriBsuxE` |
| **Personality** | Energetic, approachable, non-judgmental |
| **Use Case** | Teen counseling, casual conversations, motivation |
| **Target Demographic** | Ages 13-25 |

**Voice Characteristics:**
- Gender: Female
- Age Range: 22-28
- Tone: Friendly, upbeat, relatable
- Speaking Pace: Moderate-fast (160-170 WPM)
- Pitch: Medium-high, dynamic

```python
ALEX_CONFIG = {
    "voice_id": "At6gj9vUVdJhTriBsuxE",
    "name": "Alex",
    "description": "Youth-friendly guide with approachable energy",
    "settings": {
        "stability": 0.65,        # Balanced consistency
        "similarity_boost": 0.60,  # Natural feel
        "style": 0.55,            # More dynamic expression
        "use_speaker_boost": True
    },
    "default_emotion_profile": "energetic_supportive"
}
```

#### 4. Dr. Wisdom (Senior Mentor)

| Attribute | Value |
|-----------|-------|
| **Voice ID** | `05Cdh2gw2NMzDvykn1nm` |
| **Personality** | Wise, patient, deeply experienced |
| **Use Case** | Life guidance, wisdom sharing, elder users |
| **Target Demographic** | Ages 50+, seeking mentorship |

**Voice Characteristics:**
- Gender: Male
- Age Range: 50-65
- Tone: Deep, measured, contemplative
- Speaking Pace: Slow-moderate (120-135 WPM)
- Pitch: Low, resonant

```python
DR_WISDOM_CONFIG = {
    "voice_id": "05Cdh2gw2NMzDvykn1nm",
    "name": "Dr. Wisdom",
    "description": "Senior mentor with deep wisdom and patience",
    "settings": {
        "stability": 0.80,        # Very consistent, measured
        "similarity_boost": 0.75,  # Close to natural
        "style": 0.25,            # Subtle expressiveness
        "use_speaker_boost": True
    },
    "default_emotion_profile": "wise_contemplative"
}
```

### Persona Selection Logic

```python
class PersonaSelector:
    """Selects appropriate voice persona based on user context."""
    
    PERSONAS = {
        "dr_serene": DR_SERENE_CONFIG,
        "maya": MAYA_CONFIG,
        "alex": ALEX_CONFIG,
        "dr_wisdom": DR_WISDOM_CONFIG
    }
    
    @staticmethod
    def select_persona(user_context: dict) -> dict:
        """
        Select optimal persona based on user preferences and session context.
        
        Selection criteria:
        1. Explicit user preference (highest priority)
        2. User age demographic
        3. Session emotional context
        4. Time of day (energy levels)
        """
        # Check explicit preference
        if "preferred_persona" in user_context:
            return PersonaSelector.PERSONAS.get(
                user_context["preferred_persona"], 
                DR_SERENE_CONFIG
            )
        
        # Age-based selection
        age = user_context.get("age", 30)
        if age < 20:
            return ALEX_CONFIG
        elif age > 55:
            return DR_WISDOM_CONFIG
        
        # Emotional context selection
        emotion = user_context.get("dominant_emotion", "neutral")
        if emotion in ["sadness", "grief", "vulnerable"]:
            return MAYA_CONFIG
        elif emotion in ["anxiety", "stress"]:
            return DR_SERENE_CONFIG
        
        # Default
        return DR_SERENE_CONFIG
```

---

## Streaming Audio Generation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Streaming Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input → LLM Response → Text Chunker → ElevenLabs → Client │
│                    ↓                                           │
│              Emotion Analysis → Voice Settings                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```python
import asyncio
from typing import AsyncIterator, Optional, Callable
import aiohttp
from dataclasses import dataclass

@dataclass
class AudioChunk:
    """Represents a chunk of audio data with metadata."""
    data: bytes
    sequence_number: int
    is_first_chunk: bool
    is_last_chunk: bool
    latency_ms: float
    
class StreamingVoiceGenerator:
    """
    Real-time streaming TTS generator using ElevenLabs API.
    Provides sub-500ms first-chunk latency.
    """
    
    ELEVENLABS_STREAM_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    
    def __init__(
        self, 
        api_key: str,
        persona_config: dict,
        emotion_engine: 'EmotionEngine'
    ):
        self.api_key = api_key
        self.persona_config = persona_config
        self.emotion_engine = emotion_engine
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def generate_stream(
        self,
        text_stream: AsyncIterator[str],
        user_emotion_state: dict,
        on_first_chunk: Optional[Callable[[float], None]] = None
    ) -> AsyncIterator[AudioChunk]:
        """
        Generate streaming audio from text stream.
        
        Args:
            text_stream: Async iterator yielding text chunks from LLM
            user_emotion_state: Current emotional state of user
            on_first_chunk: Callback when first audio chunk is ready
            
        Yields:
            AudioChunk objects containing audio data
        """
        # Build voice settings based on emotion
        voice_settings = self.emotion_engine.compute_voice_settings(
            base_settings=self.persona_config["settings"],
            user_emotion=user_emotion_state
        )
        
        # Buffer for text accumulation (for better TTS quality)
        text_buffer = ""
        min_buffer_size = 50  # characters
        sequence_number = 0
        first_chunk_sent = False
        chunk_start_time = asyncio.get_event_loop().time()
        
        async for text_chunk in text_stream:
            text_buffer += text_chunk
            
            # Send when buffer is full or text ends with punctuation
            if (len(text_buffer) >= min_buffer_size or 
                text_buffer.rstrip().endswith(('.', '!', '?', ','))):
                
                async for audio_chunk in self._stream_tts(
                    text_buffer,
                    voice_settings,
                    sequence_number,
                    is_first=not first_chunk_sent
                ):
                    if not first_chunk_sent:
                        first_chunk_sent = True
                        latency = (asyncio.get_event_loop().time() - chunk_start_time) * 1000
                        if on_first_chunk:
                            on_first_chunk(latency)
                    
                    yield audio_chunk
                    sequence_number += 1
                
                text_buffer = ""
        
        # Process any remaining text
        if text_buffer.strip():
            async for audio_chunk in self._stream_tts(
                text_buffer,
                voice_settings,
                sequence_number,
                is_first=not first_chunk_sent,
                is_last=True
            ):
                yield audio_chunk
    
    async def _stream_tts(
        self,
        text: str,
        voice_settings: dict,
        sequence_number: int,
        is_first: bool = False,
        is_last: bool = False
    ) -> AsyncIterator[AudioChunk]:
        """Make streaming request to ElevenLabs API."""
        
        url = self.ELEVENLABS_STREAM_URL.format(
            voice_id=self.persona_config["voice_id"]
        )
        
        payload = {
            "text": text,
            "model_id": "eleven_turbo_v2_5",  # Fastest model
            "voice_settings": voice_settings,
            "optimize_streaming_latency": 3,  # Maximum optimization
            "output_format": "mp3_22050_32"   # Balanced quality/speed
        }
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        chunk_start = asyncio.get_event_loop().time()
        
        async with self.session.post(
            url, 
            json=payload, 
            headers=headers
        ) as response:
            response.raise_for_status()
            
            chunk_index = 0
            async for audio_data in response.content.iter_chunked(8192):
                latency = (asyncio.get_event_loop().time() - chunk_start) * 1000
                
                yield AudioChunk(
                    data=audio_data,
                    sequence_number=sequence_number + chunk_index,
                    is_first_chunk=is_first and chunk_index == 0,
                    is_last_chunk=is_last,
                    latency_ms=latency
                )
                chunk_index += 1
                chunk_start = asyncio.get_event_loop().time()
```

### Client-Side Audio Playback

```typescript
// Web Audio API implementation for seamless playback
interface AudioChunk {
    data: Uint8Array;
    sequenceNumber: number;
    isFirstChunk: boolean;
    isLastChunk: boolean;
}

class StreamingAudioPlayer {
    private audioContext: AudioContext;
    private audioQueue: AudioBuffer[] = [];
    private isPlaying: boolean = false;
    private nextPlayTime: number = 0;
    private readonly SCHEDULE_AHEAD_TIME = 0.1; // 100ms
    
    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    async playStream(chunkStream: ReadableStream<AudioChunk>): Promise<void> {
        const reader = chunkStream.getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            await this.enqueueChunk(value);
        }
    }
    
    private async enqueueChunk(chunk: AudioChunk): Promise<void> {
        // Decode MP3 data to AudioBuffer
        const audioBuffer = await this.audioContext.decodeAudioData(
            chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength)
        );
        
        this.audioQueue.push(audioBuffer);
        
        if (!this.isPlaying) {
            this.startPlayback();
        }
    }
    
    private startPlayback(): void {
        this.isPlaying = true;
        this.nextPlayTime = this.audioContext.currentTime + 0.05; // Small buffer
        this.schedulePlayback();
    }
    
    private schedulePlayback(): void {
        while (this.audioQueue.length > 0) {
            const buffer = this.audioQueue.shift()!;
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            
            // Schedule precise playback
            source.start(this.nextPlayTime);
            this.nextPlayTime += buffer.duration;
        }
        
        // Continue scheduling if more chunks expected
        if (this.audioQueue.length === 0) {
            setTimeout(() => this.schedulePlayback(), 50);
        }
    }
}
```

---

## Latency Optimization

### Target Metrics

| Metric | Target | Maximum Acceptable |
|--------|--------|-------------------|
| First Chunk Latency | < 300ms | 500ms |
| Inter-Chunk Gap | < 50ms | 100ms |
| End-to-End Response | < 2s | 3s |

### Optimization Strategies

#### 1. Model Selection

```python
# ElevenLabs model selection for latency optimization
MODEL_LATENCY_PROFILES = {
    "eleven_turbo_v2_5": {
        "avg_latency_ms": 180,
        "quality_score": 0.92,
        "use_for": ["realtime_conversation", "streaming"]
    },
    "eleven_multilingual_v2": {
        "avg_latency_ms": 350,
        "quality_score": 0.98,
        "use_for": ["high_quality_narration", "offline_processing"]
    },
    "eleven_flash_v2_5": {
        "avg_latency_ms": 120,
        "quality_score": 0.85,
        "use_for": ["ultra_low_latency", "simple_responses"]
    }
}

def select_model_for_context(context: dict) -> str:
    """Select optimal model based on context."""
    if context.get("priority") == "speed":
        return "eleven_flash_v2_5"
    elif context.get("streaming", True):
        return "eleven_turbo_v2_5"
    else:
        return "eleven_multilingual_v2"
```

#### 2. Connection Pooling & Keep-Alive

```python
import aiohttp
from aiohttp import TCPConnector

class OptimizedHttpClient:
    """HTTP client optimized for low-latency ElevenLabs API calls."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Optimized connection settings
        connector = TCPConnector(
            limit=20,                    # Max concurrent connections
            limit_per_host=10,           # Per ElevenLabs API host
            enable_cleanup_closed=True,
            force_close=False,           # Keep connections alive
            ttl_dns_cache=300,           # DNS cache 5 minutes
            use_dns_cache=True,
        )
        
        timeout = aiohttp.ClientTimeout(
            total=30,
            connect=2,                   # Fast connection establishment
            sock_read=10
        )
        
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                "xi-api-key": api_key,
                "Accept": "audio/mpeg",
                "Connection": "keep-alive"
            }
        )
```

#### 3. Predictive Audio Prefetching

```python
class PredictivePrefetcher:
    """
    Prefetch likely next responses based on conversation context.
    Reduces perceived latency for common responses.
    """
    
    COMMON_RESPONSES = {
        "acknowledgment": [
            "I understand.",
            "I hear you.",
            "That makes sense.",
            "I see what you mean."
        ],
        "encouragement": [
            "You're doing great.",
            "That's a positive step.",
            "I'm proud of you for sharing that."
        ],
        "transition": [
            "Let's explore that further.",
            "Tell me more about that.",
            "How did that make you feel?"
        ]
    }
    
    def __init__(self, voice_generator: StreamingVoiceGenerator):
        self.voice_generator = voice_generator
        self.prefetch_cache: dict[str, bytes] = {}
        self.max_cache_size = 50  # Max cached responses
        
    async def prefetch_likely_responses(self, context: dict):
        """Prefetch audio for likely responses based on context."""
        category = self._predict_response_category(context)
        
        for response in self.COMMON_RESPONSES.get(category, []):
            if response not in self.prefetch_cache:
                audio = await self._generate_audio(response)
                self.prefetch_cache[response] = audio
                
        # Cleanup old cache entries
        self._cleanup_cache()
    
    def get_prefetched(self, text: str) -> Optional[bytes]:
        """Retrieve prefetched audio if available."""
        return self.prefetch_cache.get(text)
```

#### 4. Text Chunking Optimization

```python
class TextChunkOptimizer:
    """
    Optimizes text chunking for streaming TTS to minimize latency
    while maintaining natural speech flow.
    """
    
    # Optimal chunk sizes for different contexts
    CHUNK_CONFIGS = {
        "fast_response": {
            "min_chars": 20,
            "max_chars": 80,
            "break_on": [",", ";"],
            "priority": "speed"
        },
        "natural_flow": {
            "min_chars": 50,
            "max_chars": 150,
            "break_on": [".", "!", "?", "\n"],
            "priority": "quality"
        },
        "long_form": {
            "min_chars": 100,
            "max_chars": 300,
            "break_on": [". ", "! ", "? "],
            "priority": "coherence"
        }
    }
    
    @staticmethod
    def chunk_text(text: str, mode: str = "natural_flow") -> list[str]:
        """Split text into optimal chunks for streaming."""
        config = TextChunkOptimizer.CHUNK_CONFIGS[mode]
        chunks = []
        current_chunk = ""
        
        words = text.split()
        
        for word in words:
            test_chunk = current_chunk + " " + word if current_chunk else word
            
            # Check if we should break here
            should_break = (
                len(test_chunk) >= config["max_chars"] or
                any(test_chunk.rstrip().endswith(b) for b in config["break_on"])
            )
            
            if should_break and len(current_chunk) >= config["min_chars"]:
                chunks.append(current_chunk.strip())
                current_chunk = word
            else:
                current_chunk = test_chunk
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
```

#### 5. Edge Caching Strategy

```python
import hashlib
from functools import lru_cache

class VoiceCache:
    """
    Local cache for frequently used voice segments.
    Implements LRU eviction and content-based addressing.
    """
    
    def __init__(self, max_size_mb: int = 100):
        self.max_size = max_size_mb * 1024 * 1024
        self.current_size = 0
        self.cache = {}
        self.access_order = []
        
    def _generate_key(self, text: str, voice_id: str, settings: dict) -> str:
        """Generate unique cache key from content."""
        content = f"{text}:{voice_id}:{json.dumps(settings, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    @lru_cache(maxsize=1000)
    def get_cached_audio(self, key: str) -> Optional[bytes]:
        """Retrieve cached audio if available."""
        if key in self.cache:
            # Move to end (most recently used)
            self.access_order.remove(key)
            self.access_order.append(key)
            return self.cache[key]
        return None
    
    def cache_audio(self, text: str, voice_id: str, settings: dict, audio: bytes):
        """Cache generated audio."""
        key = self._generate_key(text, voice_id, settings)
        
        # Check size limit
        audio_size = len(audio)
        while self.current_size + audio_size > self.max_size and self.access_order:
            oldest_key = self.access_order.pop(0)
            self.current_size -= len(self.cache[oldest_key])
            del self.cache[oldest_key]
        
        self.cache[key] = audio
        self.access_order.append(key)
        self.current_size += audio_size
```

---

## Fallback Voice System

### Fallback Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fallback Voice Hierarchy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Primary Voice (User Selected Persona)                          │
│           ↓ (if fails)                                          │
│  Secondary Voice (Same gender, similar age)                     │
│           ↓ (if fails)                                          │
│  Tertiary Voice (Default - Dr. Serene)                          │
│           ↓ (if fails)                                          │
│  System TTS (Browser/Platform Native)                           │
│           ↓ (if fails)                                          │
│  Text Display Only (with visual indicator)                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```python
from enum import Enum
from typing import Union
import logging

logger = logging.getLogger(__name__)

class FallbackLevel(Enum):
    PRIMARY = 1
    SECONDARY = 2
    TERTIARY = 3
    SYSTEM_TTS = 4
    TEXT_ONLY = 5

class FallbackVoiceManager:
    """
    Manages voice fallback chain for high availability.
    Ensures user always receives output even if primary voice fails.
    """
    
    # Fallback mappings for each persona
    FALLBACK_MAP = {
        "dr_serene": {
            FallbackLevel.PRIMARY: "Q63G7WZ5riIGbK8KmqO9",
            FallbackLevel.SECONDARY: "05Cdh2gw2NMzDvykn1nm",  # Dr. Wisdom
            FallbackLevel.TERTIARY: "NLl76XZRVj1RVeXptX3h"     # Maya
        },
        "maya": {
            FallbackLevel.PRIMARY: "NLl76XZRVj1RVeXptX3h",
            FallbackLevel.SECONDARY: "At6gj9vUVdJhTriBsuxE",   # Alex
            FallbackLevel.TERTIARY: "Q63G7WZ5riIGbK8KmqO9"      # Dr. Serene
        },
        "alex": {
            FallbackLevel.PRIMARY: "At6gj9vUVdJhTriBsuxE",
            FallbackLevel.SECONDARY: "NLl76XZRVj1RVeXptX3h",   # Maya
            FallbackLevel.TERTIARY: "Q63G7WZ5riIGbK8KmqO9"      # Dr. Serene
        },
        "dr_wisdom": {
            FallbackLevel.PRIMARY: "05Cdh2gw2NMzDvykn1nm",
            FallbackLevel.SECONDARY: "Q63G7WZ5riIGbK8KmqO9",    # Dr. Serene
            FallbackLevel.TERTIARY: "NLl76XZRVj1RVeXptX3h"       # Maya
        }
    }
    
    def __init__(
        self, 
        primary_generator: StreamingVoiceGenerator,
        system_tts_client: Optional['SystemTTS'] = None
    ):
        self.primary_generator = primary_generator
        self.system_tts_client = system_tts_client
        self.fallback_stats = {level: 0 for level in FallbackLevel}
        
    async def generate_with_fallback(
        self,
        text: str,
        persona: str,
        emotion_state: dict,
        max_retries: int = 2
    ) -> Union[AsyncIterator[AudioChunk], str]:
        """
        Generate audio with automatic fallback on failure.
        
        Returns:
            Audio iterator on success, or text string for text-only fallback
        """
        fallback_chain = self.FALLBACK_MAP.get(persona, self.FALLBACK_MAP["dr_serene"])
        
        # Try primary voice
        try:
            result = await self._try_generate(
                text, 
                fallback_chain[FallbackLevel.PRIMARY],
                emotion_state,
                max_retries
            )
            if result:
                self.fallback_stats[FallbackLevel.PRIMARY] += 1
                return result
        except Exception as e:
            logger.warning(f"Primary voice failed: {e}")
        
        # Try secondary voice
        try:
            result = await self._try_generate(
                text,
                fallback_chain[FallbackLevel.SECONDARY],
                emotion_state,
                max_retries
            )
            if result:
                self.fallback_stats[FallbackLevel.SECONDARY] += 1
                logger.info(f"Fell back to secondary voice for persona: {persona}")
                return result
        except Exception as e:
            logger.warning(f"Secondary voice failed: {e}")
        
        # Try tertiary voice
        try:
            result = await self._try_generate(
                text,
                fallback_chain[FallbackLevel.TERTIARY],
                emotion_state,
                max_retries
            )
            if result:
                self.fallback_stats[FallbackLevel.TERTIARY] += 1
                logger.info(f"Fell back to tertiary voice for persona: {persona}")
                return result
        except Exception as e:
            logger.warning(f"Tertiary voice failed: {e}")
        
        # Try system TTS
        if self.system_tts_client:
            try:
                result = await self.system_tts_client.synthesize(text)
                self.fallback_stats[FallbackLevel.SYSTEM_TTS] += 1
                logger.info("Fell back to system TTS")
                return result
            except Exception as e:
                logger.warning(f"System TTS failed: {e}")
        
        # Final fallback: text only
        self.fallback_stats[FallbackLevel.TEXT_ONLY] += 1
        logger.error("All voice fallbacks failed, returning text only")
        return text
    
    async def _try_generate(
        self,
        text: str,
        voice_id: str,
        emotion_state: dict,
        max_retries: int
    ) -> Optional[AsyncIterator[AudioChunk]]:
        """Attempt generation with retries."""
        for attempt in range(max_retries):
            try:
                # Update generator with new voice
                self.primary_generator.persona_config["voice_id"] = voice_id
                
                # Test with a small chunk first
                test_stream = self._create_single_chunk_stream(text[:50])
                chunks = []
                async for chunk in self.primary_generator.generate_stream(
                    test_stream, emotion_state
                ):
                    chunks.append(chunk)
                
                if chunks:
                    # Success - return full generation
                    full_stream = self._create_single_chunk_stream(text)
                    return self.primary_generator.generate_stream(
                        full_stream, emotion_state
                    )
                    
            except Exception as e:
                logger.debug(f"Attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
        
        return None
    
    def get_fallback_stats(self) -> dict:
        """Get statistics on fallback usage."""
        total = sum(self.fallback_stats.values())
        if total == 0:
            return {"total": 0, "percentages": {}}
        
        return {
            "total": total,
            "counts": self.fallback_stats,
            "percentages": {
                level.name: (count / total) * 100 
                for level, count in self.fallback_stats.items()
            }
        }
```

### System TTS Fallback (Browser)

```typescript
// Browser-native TTS fallback
class SystemTTSFallback {
    private synthesis: SpeechSynthesis;
    
    constructor() {
        this.synthesis = window.speechSynthesis;
    }
    
    async synthesize(text: string, options: TTSOptions = {}): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Configure voice
            utterance.rate = options.rate || 1.0;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 1.0;
            
            // Select best available voice
            const voices = this.synthesis.getVoices();
            const preferredVoice = this.selectBestVoice(voices, options.gender);
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            // Capture audio (if supported)
            const audioChunks: Blob[] = [];
            
            utterance.onend = () => {
                // Note: Web Speech API doesn't directly return audio
                // This would need MediaRecorder for actual audio capture
                resolve(new Blob(audioChunks, { type: 'audio/wav' }));
            };
            
            utterance.onerror = (event) => {
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };
            
            this.synthesis.speak(utterance);
        });
    }
    
    private selectBestVoice(
        voices: SpeechSynthesisVoice[], 
        preferredGender?: 'male' | 'female'
    ): SpeechSynthesisVoice | null {
        // Prefer high-quality voices
        const qualityVoices = voices.filter(v => 
            v.name.includes('Google') || 
            v.name.includes('Apple') ||
            v.name.includes('Premium')
        );
        
        const candidates = qualityVoices.length > 0 ? qualityVoices : voices;
        
        if (preferredGender) {
            const genderMatch = candidates.find(v =>
                preferredGender === 'female' 
                    ? v.name.toLowerCase().includes('female')
                    : v.name.toLowerCase().includes('male')
            );
            if (genderMatch) return genderMatch;
        }
        
        return candidates[0] || null;
    }
}
```

---

## Emotional Tone Modulation

### Emotion-to-Voice Mapping

The voice modulation system dynamically adjusts voice characteristics based on detected user emotional states.

```
┌─────────────────────────────────────────────────────────────────┐
│                  Emotion Detection Pipeline                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input → Text Analysis → Emotion Classifier → Voice Params │
│       ↓                                                            │
│  (Optional: Voice Analysis) → Emotional State Score              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Emotion Profiles

```python
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class EmotionProfile:
    """Defines voice modulation parameters for an emotional state."""
    name: str
    stability_adjustment: float      # -1.0 to 1.0
    style_adjustment: float          # -1.0 to 1.0
    rate_adjustment: float           # -0.5 to 0.5 (WPM multiplier)
    pitch_shift: float               # -0.3 to 0.3 (semitones)
    volume_adjustment: float         # -0.3 to 0.3
    pause_multiplier: float          # 0.5 to 2.0
    description: str

# Predefined emotion profiles
EMOTION_PROFILES = {
    # Distress States - Softer, Slower, More Stable
    "crying": EmotionProfile(
        name="crying",
        stability_adjustment=0.25,      # More stable, reassuring
        style_adjustment=-0.30,         # Less expressive, calmer
        rate_adjustment=-0.20,          # Slower (20% reduction)
        pitch_shift=-0.15,              # Slightly lower pitch
        volume_adjustment=-0.15,        # Quieter, intimate
        pause_multiplier=1.5,           # Longer pauses
        description="Ultra-soft, slow, comforting presence for user in tears"
    ),
    
    "deep_sadness": EmotionProfile(
        name="deep_sadness",
        stability_adjustment=0.20,
        style_adjustment=-0.25,
        rate_adjustment=-0.15,
        pitch_shift=-0.10,
        volume_adjustment=-0.10,
        pause_multiplier=1.4,
        description="Gentle, patient, holding space for grief"
    ),
    
    "vulnerable": EmotionProfile(
        name="vulnerable",
        stability_adjustment=0.15,
        style_adjustment=-0.20,
        rate_adjustment=-0.10,
        pitch_shift=-0.05,
        volume_adjustment=-0.10,
        pause_multiplier=1.3,
        description="Safe, non-threatening, protective tone"
    ),
    
    # Anxiety States - Calming, Grounding
    "anxious": EmotionProfile(
        name="anxious",
        stability_adjustment=0.30,      # Very stable anchor
        style_adjustment=-0.20,
        rate_adjustment=-0.15,
        pitch_shift=-0.10,
        volume_adjustment=-0.05,
        pause_multiplier=1.4,
        description="Grounding, steady, anxiety-reducing pace"
    ),
    
    "panicked": EmotionProfile(
        name="panicked",
        stability_adjustment=0.35,
        style_adjustment=-0.35,
        rate_adjustment=-0.25,
        pitch_shift=-0.15,
        volume_adjustment=-0.10,
        pause_multiplier=1.6,
        description="Emergency calm - very slow, very stable"
    ),
    
    # Positive States - Warmer, More Expressive
    "happy": EmotionProfile(
        name="happy",
        stability_adjustment=-0.10,     # Allow more variation
        style_adjustment=0.25,          # More expressive
        rate_adjustment=0.05,           # Slightly faster
        pitch_shift=0.05,               # Slightly higher
        volume_adjustment=0.05,
        pause_multiplier=0.9,
        description="Warm, celebratory, sharing joy"
    ),
    
    "grateful": EmotionProfile(
        name="grateful",
        stability_adjustment=-0.05,
        style_adjustment=0.20,
        rate_adjustment=0.0,
        pitch_shift=0.0,
        volume_adjustment=0.0,
        pause_multiplier=1.0,
        description="Warm, appreciative, heartfelt"
    ),
    
    # Motivation States - Energetic, Encouraging
    "discouraged": EmotionProfile(
        name="discouraged",
        stability_adjustment=0.10,
        style_adjustment=0.30,          # More encouraging expression
        rate_adjustment=0.10,           # Slightly more energy
        pitch_shift=0.05,
        volume_adjustment=0.05,
        pause_multiplier=0.9,
        description="Energetic encouragement, lifting spirits"
    ),
    
    "motivated": EmotionProfile(
        name="motivated",
        stability_adjustment=-0.15,
        style_adjustment=0.40,          # Very expressive
        rate_adjustment=0.15,           # More energy
        pitch_shift=0.10,
        volume_adjustment=0.10,
        pause_multiplier=0.8,
        description="High energy, enthusiastic support"
    ),
    
    # Neutral/Supportive States - Balanced
    "neutral": EmotionProfile(
        name="neutral",
        stability_adjustment=0.0,
        style_adjustment=0.0,
        rate_adjustment=0.0,
        pitch_shift=0.0,
        volume_adjustment=0.0,
        pause_multiplier=1.0,
        description="Baseline persona voice"
    ),
    
    "reflective": EmotionProfile(
        name="reflective",
        stability_adjustment=0.10,
        style_adjustment=-0.10,
        rate_adjustment=-0.10,
        pitch_shift=-0.05,
        volume_adjustment=-0.05,
        pause_multiplier=1.3,
        description="Contemplative, thoughtful, spacious"
    ),
    
    # Crisis States - Immediate Support
    "crisis": EmotionProfile(
        name="crisis",
        stability_adjustment=0.40,      # Maximum stability
        style_adjustment=-0.40,         # Minimal variation
        rate_adjustment=-0.20,
        pitch_shift=-0.20,
        volume_adjustment=0.0,
        pause_multiplier=1.5,
        description="Crisis intervention - calm authority"
    ),
    
    "suicidal_ideation": EmotionProfile(
        name="suicidal_ideation",
        stability_adjustment=0.45,
        style_adjustment=-0.45,
        rate_adjustment=-0.25,
        pitch_shift=-0.20,
        volume_adjustment=-0.05,
        pause_multiplier=1.7,
        description="Maximum calm, life-affirming presence"
    )
}
```

### Emotion Engine Implementation

```python
class EmotionEngine:
    """
    Core engine for emotional tone modulation.
    Converts user emotional state into voice parameters.
    """
    
    def __init__(self):
        self.current_profile: Optional[EmotionProfile] = None
        self.profile_transition_time: float = 0.5  # seconds
        self.emotion_history: list[tuple[str, float]] = []  # (emotion, confidence)
        self.max_history = 10
        
    def detect_emotion(self, user_input: str, context: dict) -> dict:
        """
        Detect user emotion from text and optional voice analysis.
        
        Returns:
            Dict with primary_emotion, confidence, intensity
        """
        # Text-based emotion detection
        text_emotion = self._analyze_text_emotion(user_input)
        
        # Context-based emotion inference
        context_emotion = self._infer_from_context(context)
        
        # Combine signals
        combined = self._combine_emotion_signals(text_emotion, context_emotion)
        
        # Update history
        self.emotion_history.append((combined["primary"], combined["confidence"]))
        if len(self.emotion_history) > self.max_history:
            self.emotion_history.pop(0)
        
        # Smooth emotion transitions
        smoothed = self._smooth_emotion_transitions(combined)
        
        return smoothed
    
    def _analyze_text_emotion(self, text: str) -> dict:
        """Analyze text for emotional indicators."""
        text_lower = text.lower()
        
        # Keyword-based detection (simplified - use ML model in production)
        emotion_keywords = {
            "crying": ["crying", "tears", "sobbing", "weeping", "can't stop crying"],
            "deep_sadness": ["depressed", "hopeless", "empty", "numb", "devastated"],
            "anxious": ["anxious", "worried", "nervous", "stressed", "overwhelmed"],
            "panicked": ["panic", "can't breathe", "heart racing", "terrified"],
            "happy": ["happy", "joy", "excited", "great", "wonderful"],
            "grateful": ["grateful", "thankful", "appreciate", "blessed"],
            "discouraged": ["discouraged", "giving up", "what's the point", "failed"],
            "motivated": ["motivated", "ready", "let's do this", "determined"],
            "crisis": ["emergency", "urgent", "can't handle", "breaking down"],
            "suicidal_ideation": ["suicide", "kill myself", "end it all", "don't want to live"]
        }
        
        scores = {}
        for emotion, keywords in emotion_keywords.items():
            score = sum(2 if kw in text_lower else 0 for kw in keywords)
            if score > 0:
                scores[emotion] = score
        
        if not scores:
            return {"primary": "neutral", "confidence": 0.5, "intensity": 0.3}
        
        primary = max(scores, key=scores.get)
        total_score = sum(scores.values())
        confidence = scores[primary] / total_score if total_score > 0 else 0.5
        intensity = min(scores[primary] / 4, 1.0)  # Normalize to 0-1
        
        return {"primary": primary, "confidence": confidence, "intensity": intensity}
    
    def compute_voice_settings(
        self,
        base_settings: dict,
        user_emotion: dict
    ) -> dict:
        """
        Compute final voice settings by applying emotion modulation.
        
        Args:
            base_settings: Persona's default voice settings
            user_emotion: Detected user emotional state
            
        Returns:
            Modulated voice settings for ElevenLabs API
        """
        emotion_name = user_emotion.get("primary", "neutral")
        intensity = user_emotion.get("intensity", 0.5)
        
        profile = EMOTION_PROFILES.get(emotion_name, EMOTION_PROFILES["neutral"])
        
        # Apply emotion adjustments scaled by intensity
        settings = base_settings.copy()
        
        # Stability: Higher = more consistent, Lower = more variable
        settings["stability"] = self._clamp(
            settings["stability"] + (profile.stability_adjustment * intensity),
            0.0, 1.0
        )
        
        # Style: Higher = more expressive, Lower = more monotone
        settings["style"] = self._clamp(
            settings.get("style", 0.35) + (profile.style_adjustment * intensity),
            0.0, 1.0
        )
        
        # Similarity boost: Maintain voice identity
        settings["similarity_boost"] = settings.get("similarity_boost", 0.65)
        
        # Store additional parameters for client-side processing
        settings["_emotion_modulation"] = {
            "rate_adjustment": profile.rate_adjustment * intensity,
            "pitch_shift": profile.pitch_shift * intensity,
            "volume_adjustment": profile.volume_adjustment * intensity,
            "pause_multiplier": 1.0 + ((profile.pause_multiplier - 1.0) * intensity),
            "detected_emotion": emotion_name,
            "intensity": intensity
        }
        
        return settings
    
    def _clamp(self, value: float, min_val: float, max_val: float) -> float:
        """Clamp value to range."""
        return max(min_val, min(max_val, value))
    
    def _smooth_emotion_transitions(self, current: dict) -> dict:
        """Smooth rapid emotion changes using history."""
        if len(self.emotion_history) < 3:
            return current
        
        # Check for rapid fluctuations
        recent_emotions = [e[0] for e in self.emotion_history[-3:]]
        
        if len(set(recent_emotions)) > 2:
            # Rapid fluctuation detected - stabilize
            return {
                "primary": "neutral",
                "confidence": 0.6,
                "intensity": 0.4,
                "note": "smoothed_from_fluctuation"
            }
        
        return current
```

### Text-Level Modulation

```python
class TextEmotionModulator:
    """
    Modulates text content itself to match emotional tone.
    Adds pauses, adjusts punctuation, emphasizes key words.
    """
    
    def __init__(self, emotion_engine: EmotionEngine):
        self.emotion_engine = emotion_engine
        
    def modulate_text(self, text: str, emotion: dict) -> str:
        """Apply emotional modulation to text."""
        emotion_name = emotion.get("primary", "neutral")
        profile = EMOTION_PROFILES.get(emotion_name, EMOTION_PROFILES["neutral"])
        
        modulated = text
        
        # Add pauses based on emotion
        if profile.pause_multiplier > 1.2:
            modulated = self._add_pauses(modulated, profile.pause_multiplier)
        
        # Adjust punctuation for softer emotions
        if emotion_name in ["crying", "deep_sadness", "vulnerable"]:
            modulated = self._soften_punctuation(modulated)
        
        # Add emphasis for encouragement
        if emotion_name in ["discouraged", "motivated"]:
            modulated = self._add_encouragement_emphasis(modulated)
        
        return modulated
    
    def _add_pauses(self, text: str, multiplier: float) -> str:
        """Add strategic pauses to text."""
        # Convert periods to longer pauses
        text = text.replace(". ", "... ")
        
        # Add pauses after key phrases
        pause_phrases = ["I understand", "I'm here", "It's okay"]
        for phrase in pause_phrases:
            text = text.replace(phrase, f"{phrase}...")
        
        return text
    
    def _soften_punctuation(self, text: str) -> str:
        """Soften harsh punctuation for vulnerable states."""
        # Replace exclamation marks with periods
        text = text.replace("! ", ". ")
        text = text.replace("!", ".")
        
        # Reduce multiple periods
        text = text.replace("...", "..")
        
        return text
    
    def _add_encouragement_emphasis(self, text: str) -> str:
        """Add emphasis markers for encouragement."""
        # Wrap encouraging words in emphasis markers
        encouraging = ["great", "wonderful", "proud", "amazing", "fantastic"]
        for word in encouraging:
            text = text.replace(
                f" {word} ", 
                f' <emphasis level="strong">{word}</emphasis> '
            )
        
        return text
```

---

## Implementation Code

### Complete Service Integration

```python
# mindmate/voice/elevenlabs_service.py

import asyncio
import logging
from typing import AsyncIterator, Optional, Callable
from dataclasses import dataclass
import aiohttp

logger = logging.getLogger(__name__)

@dataclass
class VoiceRequest:
    """Request for voice generation."""
    text: str
    persona: str = "dr_serene"
    user_id: str = ""
    emotion_context: dict = None
    priority: str = "normal"  # "speed", "quality", "normal"
    streaming: bool = True

@dataclass
class VoiceResponse:
    """Response from voice generation."""
    audio_stream: Optional[AsyncIterator[AudioChunk]]
    text_fallback: Optional[str]
    latency_ms: float
    voice_used: str
    emotion_applied: str
    success: bool

class ElevenLabsVoiceService:
    """
    Production-ready ElevenLabs voice service for MindMate AI.
    Integrates all components: personas, streaming, latency optimization,
    fallback, and emotional modulation.
    """
    
    def __init__(
        self,
        api_key: str,
        redis_client: Optional['Redis'] = None,
        metrics_client: Optional['MetricsClient'] = None
    ):
        self.api_key = api_key
        self.redis = redis_client
        self.metrics = metrics_client
        
        # Initialize components
        self.emotion_engine = EmotionEngine()
        self.cache = VoiceCache(max_size_mb=100)
        self.prefetcher = None  # Initialized after generator
        self.fallback_manager = None  # Initialized after generator
        
        # HTTP session (initialized on first use)
        self._session: Optional[aiohttp.ClientSession] = None
        
        # Performance tracking
        self.request_count = 0
        self.total_latency = 0.0
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(
                limit=20,
                limit_per_host=10,
                enable_cleanup_closed=True,
                force_close=False,
                ttl_dns_cache=300,
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=2, sock_read=10)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout
            )
        return self._session
    
    async def generate_voice(
        self,
        request: VoiceRequest,
        on_first_chunk: Optional[Callable[[float], None]] = None
    ) -> VoiceResponse:
        """
        Main entry point for voice generation.
        
        Args:
            request: Voice generation request
            on_first_chunk: Callback for first audio chunk latency
            
        Returns:
            VoiceResponse with audio stream or fallback
        """
        start_time = asyncio.get_event_loop().time()
        
        try:
            # 1. Select persona
            persona_config = self._get_persona_config(request.persona)
            
            # 2. Detect emotion
            emotion_state = self.emotion_engine.detect_emotion(
                request.text,
                request.emotion_context or {}
            )
            
            # 3. Check cache
            cache_key = self._generate_cache_key(
                request.text, 
                persona_config["voice_id"],
                emotion_state
            )
            cached_audio = self.cache.get_cached_audio(cache_key)
            
            if cached_audio:
                logger.debug("Cache hit for voice request")
                return VoiceResponse(
                    audio_stream=self._create_stream_from_cache(cached_audio),
                    text_fallback=None,
                    latency_ms=50,  # Cache retrieval
                    voice_used=persona_config["voice_id"],
                    emotion_applied=emotion_state["primary"],
                    success=True
                )
            
            # 4. Generate voice with fallback
            audio_stream = await self._generate_with_full_fallback(
                request, 
                persona_config,
                emotion_state,
                on_first_chunk
            )
            
            # 5. Track metrics
            latency = (asyncio.get_event_loop().time() - start_time) * 1000
            self._track_metrics(latency, request.persona, emotion_state["primary"])
            
            return VoiceResponse(
                audio_stream=audio_stream,
                text_fallback=None,
                latency_ms=latency,
                voice_used=persona_config["voice_id"],
                emotion_applied=emotion_state["primary"],
                success=True
            )
            
        except Exception as e:
            logger.error(f"Voice generation failed: {e}")
            
            # Final fallback to text
            return VoiceResponse(
                audio_stream=None,
                text_fallback=request.text,
                latency_ms=(asyncio.get_event_loop().time() - start_time) * 1000,
                voice_used="none",
                emotion_applied="none",
                success=False
            )
    
    def _get_persona_config(self, persona: str) -> dict:
        """Get configuration for specified persona."""
        configs = {
            "dr_serene": DR_SERENE_CONFIG,
            "maya": MAYA_CONFIG,
            "alex": ALEX_CONFIG,
            "dr_wisdom": DR_WISDOM_CONFIG
        }
        return configs.get(persona, DR_SERENE_CONFIG)
    
    async def _generate_with_full_fallback(
        self,
        request: VoiceRequest,
        persona_config: dict,
        emotion_state: dict,
        on_first_chunk: Optional[Callable[[float], None]]
    ) -> AsyncIterator[AudioChunk]:
        """Generate with complete fallback chain."""
        
        # Build voice settings
        voice_settings = self.emotion_engine.compute_voice_settings(
            base_settings=persona_config["settings"],
            user_emotion=emotion_state
        )
        
        # Select model based on priority
        model_id = self._select_model(request.priority)
        
        # Attempt generation
        try:
            return await self._stream_generate(
                request.text,
                persona_config["voice_id"],
                voice_settings,
                model_id,
                on_first_chunk
            )
        except Exception as e:
            logger.warning(f"Primary generation failed: {e}")
            
            # Try fallback voices
            fallback_chain = FallbackVoiceManager.FALLBACK_MAP.get(
                request.persona,
                FallbackVoiceManager.FALLBACK_MAP["dr_serene"]
            )
            
            for level in [FallbackLevel.SECONDARY, FallbackLevel.TERTIARY]:
                try:
                    voice_id = fallback_chain[level]
                    return await self._stream_generate(
                        request.text,
                        voice_id,
                        voice_settings,
                        model_id,
                        on_first_chunk
                    )
                except Exception as e2:
                    logger.warning(f"Fallback {level.name} failed: {e2}")
            
            # All fallbacks exhausted
            raise RuntimeError("All voice generation attempts failed")
    
    async def _stream_generate(
        self,
        text: str,
        voice_id: str,
        voice_settings: dict,
        model_id: str,
        on_first_chunk: Optional[Callable[[float], None]]
    ) -> AsyncIterator[AudioChunk]:
        """Make streaming request to ElevenLabs."""
        
        session = await self._get_session()
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": voice_settings["stability"],
                "similarity_boost": voice_settings["similarity_boost"],
                "style": voice_settings.get("style", 0.35),
                "use_speaker_boost": voice_settings.get("use_speaker_boost", True)
            },
            "optimize_streaming_latency": 3,
            "output_format": "mp3_22050_32"
        }
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        chunk_start = asyncio.get_event_loop().time()
        first_chunk = True
        sequence = 0
        
        async with session.post(url, json=payload, headers=headers) as response:
            response.raise_for_status()
            
            async for data in response.content.iter_chunked(8192):
                latency = (asyncio.get_event_loop().time() - chunk_start) * 1000
                
                if first_chunk and on_first_chunk:
                    on_first_chunk(latency)
                    first_chunk = False
                
                yield AudioChunk(
                    data=data,
                    sequence_number=sequence,
                    is_first_chunk=sequence == 0,
                    is_last_chunk=False,
                    latency_ms=latency
                )
                sequence += 1
                chunk_start = asyncio.get_event_loop().time()
    
    def _select_model(self, priority: str) -> str:
        """Select TTS model based on priority."""
        models = {
            "speed": "eleven_flash_v2_5",
            "quality": "eleven_multilingual_v2",
            "normal": "eleven_turbo_v2_5"
        }
        return models.get(priority, "eleven_turbo_v2_5")
    
    def _generate_cache_key(
        self, 
        text: str, 
        voice_id: str, 
        emotion_state: dict
    ) -> str:
        """Generate cache key for voice request."""
        import hashlib
        content = f"{text}:{voice_id}:{emotion_state.get('primary', 'neutral')}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _create_stream_from_cache(
        self, 
        audio_data: bytes
    ) -> AsyncIterator[AudioChunk]:
        """Create async iterator from cached audio."""
        async def stream():
            yield AudioChunk(
                data=audio_data,
                sequence_number=0,
                is_first_chunk=True,
                is_last_chunk=True,
                latency_ms=0
            )
        return stream()
    
    def _track_metrics(self, latency: float, persona: str, emotion: str):
        """Track performance metrics."""
        self.request_count += 1
        self.total_latency += latency
        
        if self.metrics:
            self.metrics.histogram("voice.latency_ms", latency)
            self.metrics.counter("voice.requests", 1, tags={"persona": persona})
            self.metrics.counter("voice.emotion", 1, tags={"emotion": emotion})
    
    async def close(self):
        """Clean up resources."""
        if self._session and not self._session.closed:
            await self._session.close()
```

---

## Configuration Reference

### Environment Variables

```bash
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_API_URL=https://api.elevenlabs.io/v1

# Voice Configuration
DEFAULT_PERSONA=dr_serene
ENABLE_EMOTION_MODULATION=true
ENABLE_VOICE_CACHING=true
VOICE_CACHE_SIZE_MB=100

# Performance Tuning
STREAMING_LATENCY_OPTIMIZATION=3  # 0-4, higher = more optimization
DEFAULT_OUTPUT_FORMAT=mp3_22050_32
CONNECTION_POOL_SIZE=20
CONNECTION_POOL_PER_HOST=10

# Fallback Configuration
ENABLE_VOICE_FALLBACK=true
ENABLE_SYSTEM_TTS_FALLBACK=true
FALLBACK_RETRY_ATTEMPTS=2
FALLBACK_RETRY_DELAY_MS=500

# Monitoring
ENABLE_VOICE_METRICS=true
VOICE_METRICS_SAMPLE_RATE=1.0
```

### Voice Settings Reference

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `stability` | 0.0 - 1.0 | 0.75 | Voice consistency (higher = more stable) |
| `similarity_boost` | 0.0 - 1.0 | 0.65 | Clarity vs naturalness tradeoff |
| `style` | 0.0 - 1.0 | 0.35 | Expressiveness level |
| `use_speaker_boost` | true/false | true | Enhance speaker similarity |

### Model Selection Guide

| Model | Latency | Quality | Use Case |
|-------|---------|---------|----------|
| `eleven_flash_v2_5` | ~120ms | Good | Ultra-low latency, simple responses |
| `eleven_turbo_v2_5` | ~180ms | Very Good | Real-time conversation (recommended) |
| `eleven_multilingual_v2` | ~350ms | Excellent | High-quality, non-streaming |

---

## Error Handling

### Error Categories

```python
class VoiceError(Exception):
    """Base class for voice generation errors."""
    pass

class VoiceAPIError(VoiceError):
    """ElevenLabs API error."""
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code

class VoiceTimeoutError(VoiceError):
    """Voice generation timeout."""
    pass

class VoiceQuotaError(VoiceError):
    """API quota exceeded."""
    pass

class VoiceContentError(VoiceError):
    """Content policy violation."""
    pass

# Error handling mapping
ERROR_HANDLERS = {
    401: lambda e: VoiceAPIError("Invalid API key", 401),
    429: lambda e: VoiceQuotaError("Rate limit exceeded"),
    500: lambda e: VoiceAPIError("ElevenLabs server error", 500),
    503: lambda e: VoiceAPIError("Service unavailable", 503),
}

def handle_api_error(response: aiohttp.ClientResponse) -> None:
    """Handle API error responses."""
    if response.status in ERROR_HANDLERS:
        raise ERROR_HANDLERS[response.status](None)
    elif response.status >= 400:
        raise VoiceAPIError(f"API error: {response.status}", response.status)
```

---

## Performance Monitoring

### Key Metrics

```python
VOICE_METRICS = {
    # Latency Metrics
    "voice.first_chunk_latency_ms": "Time to first audio chunk",
    "voice.total_generation_time_ms": "Total time for full generation",
    "voice.inter_chunk_gap_ms": "Gap between consecutive chunks",
    
    # Quality Metrics
    "voice.stream_continuity": "Percentage of uninterrupted streams",
    "voice.fallback_rate": "Percentage of requests using fallback",
    "voice.cache_hit_rate": "Percentage of cache hits",
    
    # Usage Metrics
    "voice.requests_per_minute": "Request volume",
    "voice.characters_generated": "Total characters processed",
    "voice.active_sessions": "Concurrent voice sessions",
    
    # Error Metrics
    "voice.error_rate": "Percentage of failed requests",
    "voice.timeout_rate": "Percentage of timeout errors",
    "voice.fallback_success_rate": "Fallback success percentage"
}
```

### Health Check Endpoint

```python
async def voice_health_check() -> dict:
    """Health check for voice service."""
    checks = {
        "elevenlabs_api": await check_elevenlabs_connectivity(),
        "cache_status": check_cache_health(),
        "fallback_readiness": check_fallback_voices(),
    }
    
    all_healthy = all(checks.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Integration Example

```python
# Complete usage example

async def main():
    # Initialize service
    voice_service = ElevenLabsVoiceService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        redis_client=redis_client,
        metrics_client=metrics_client
    )
    
    # Create voice request
    request = VoiceRequest(
        text="I understand this is a difficult time for you. I'm here to listen.",
        persona="maya",
        user_id="user_123",
        emotion_context={"previous_emotion": "sadness"},
        priority="normal",
        streaming=True
    )
    
    # Generate voice with latency callback
    def on_first_chunk(latency_ms: float):
        print(f"First audio chunk ready in {latency_ms:.0f}ms")
    
    response = await voice_service.generate_voice(
        request,
        on_first_chunk=on_first_chunk
    )
    
    if response.success:
        # Stream audio to client
        async for chunk in response.audio_stream:
            await send_to_client(chunk.data)
    else:
        # Use text fallback
        await send_text_to_client(response.text_fallback)
    
    # Cleanup
    await voice_service.close()

# Run
asyncio.run(main())
```

---

## Appendix: Voice ID Reference

| Voice ID | Name | Gender | Age | Best For |
|----------|------|--------|-----|----------|
| `Q63G7WZ5riIGbK8KmqO9` | Dr. Serene | Male | 30-40 | General therapy |
| `NLl76XZRVj1RVeXptX3h` | Maya | Female | 28-35 | Emotional support |
| `At6gj9vUVdJhTriBsuxE` | Alex | Female | 22-28 | Youth counseling |
| `05Cdh2gw2NMzDvykn1nm` | Dr. Wisdom | Male | 50-65 | Life guidance |

---

*Document Version: 1.0*
*Last Updated: 2024*
*For: MindMate AI Production Integration*
