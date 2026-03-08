# MindMate AI - Complete AI Processing Pipeline Architecture

## Executive Summary

This document defines the complete AI processing pipeline for MindMate AI therapy sessions. The pipeline processes real-time video, audio, and speech inputs to generate empathetic AI therapist responses with synchronized avatar output. Target end-to-end latency: **< 2.5 seconds** for initial response, **< 500ms** for streaming chunks.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MINDMATE AI PIPELINE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                       │
│   │ Video Frame  │    │    Audio     │    │   Speech     │                       │
│   │   Capture    │    │   Capture    │    │   Capture    │                       │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                       │
│          │                   │                   │                               │
│          ▼                   ▼                   ▼                               │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                       │
│   │ Hume AI      │    │ Voice Tone   │    │ Deepgram     │                       │
│   │ Emotion      │    │ Analysis     │    │ Transcription│                       │
│   │ Detection    │    │ (Hume AI)    │    │              │                       │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                       │
│          │                   │                   │                               │
│          └───────────┬───────┴───────────┬───────┘                               │
│                      │                   │                                       │
│                      ▼                   ▼                                       │
│              ┌──────────────────────────────────┐                                │
│              │   Context Fusion & Aggregation   │                                │
│              │   (Emotion + Text + Tone)        │                                │
│              └────────────────┬─────────────────┘                                │
│                               │                                                  │
│                               ▼                                                  │
│              ┌──────────────────────────────────┐                                │
│              │   Claude API - Therapy Response  │                                │
│              │   Generation                     │                                │
│              └────────────────┬─────────────────┘                                │
│                               │                                                  │
│                               ▼                                                  │
│              ┌──────────────────────────────────┐                                │
│              │   ElevenLabs Voice Synthesis     │                                │
│              └────────────────┬─────────────────┘                                │
│                               │                                                  │
│                               ▼                                                  │
│              ┌──────────────────────────────────┐                                │
│              │   HeyGen Avatar - Lip Sync +     │                                │
│              │   Expression Animation           │                                │
│              └────────────────┬─────────────────┘                                │
│                               │                                                  │
│                               ▼                                                  │
│              ┌──────────────────────────────────┐                                │
│              │   User Screen Output             │                                │
│              └──────────────────────────────────┘                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Video Frame → Emotion Detection (Hume AI)

### Purpose
Extract emotional state from user's facial expressions in real-time video frames.

### Technical Implementation

```python
class HumeEmotionDetector:
    """
    Hume AI Emotion Detection Service
    """
    
    CONFIG = {
        "api_endpoint": "https://api.hume.ai/v0/batch/jobs",
        "websocket_endpoint": "wss://api.hume.ai/v0/stream/models",
        "frame_rate": 5,  # Process 5 fps for emotion detection
        "batch_size": 3,  # Process 3 frames per batch
        "timeout_ms": 800,
        "retry_attempts": 3,
        "models": ["face"],
        "emotion_dimensions": [
            "joy", "sadness", "anger", "fear", "surprise", 
            "disgust", "contempt", "confusion", "anxiety"
        ]
    }
    
    async def detect_emotions(self, video_frame: bytes) -> EmotionResult:
        """
        Detect emotions from video frame
        
        Args:
            video_frame: JPEG/PNG encoded frame bytes
            
        Returns:
            EmotionResult with scores and confidence
        """
        try:
            # Use WebSocket for real-time streaming
            async with self.ws_connection as ws:
                await ws.send(video_frame)
                response = await asyncio.wait_for(
                    ws.recv(), 
                    timeout=self.CONFIG["timeout_ms"] / 1000
                )
                return self._parse_emotion_response(response)
        except TimeoutError:
            return self._get_fallback_emotion()
        except Exception as e:
            logger.error(f"Emotion detection failed: {e}")
            return self._get_fallback_emotion()
    
    def _parse_emotion_response(self, response: dict) -> EmotionResult:
        """Parse Hume AI response into structured emotion scores"""
        face_predictions = response.get("face", {}).get("predictions", [])
        
        if not face_predictions:
            return self._get_fallback_emotion()
        
        emotions = face_predictions[0].get("emotions", {})
        
        return EmotionResult(
            primary_emotion=self._get_primary_emotion(emotions),
            emotion_scores=emotions,
            confidence=face_predictions[0].get("confidence", 0.0),
            timestamp=time.time()
        )
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| API Response | 300ms | 500ms |
| Processing Time | 100ms | 200ms |
| **Total Stage Latency** | **400ms** | **700ms** |

### Output Format
```json
{
  "primary_emotion": "anxiety",
  "emotion_scores": {
    "anxiety": 0.72,
    "sadness": 0.45,
    "confusion": 0.38,
    "joy": 0.12
  },
  "confidence": 0.89,
  "timestamp": 1699123456.789
}
```

---

## Stage 2: Audio → Voice Tone Analysis (Hume AI)

### Purpose
Analyze vocal prosody, tone, and speech patterns to detect emotional state independent of content.

### Technical Implementation

```python
class VoiceToneAnalyzer:
    """
    Hume AI Voice Tone Analysis Service
    """
    
    CONFIG = {
        "api_endpoint": "wss://api.hume.ai/v0/stream/models",
        "audio_format": "pcm_16bit",
        "sample_rate": 16000,
        "chunk_duration_ms": 500,  # 500ms audio chunks
        "timeout_ms": 600,
        "models": ["prosody", "burst"],
        "features": [
            "pitch_mean", "pitch_std", "intensity_mean",
            "jitter", "shimmer", "speaking_rate"
        ]
    }
    
    async def analyze_tone(self, audio_chunk: bytes) -> ToneResult:
        """
        Analyze voice tone from audio chunk
        
        Args:
            audio_chunk: PCM 16-bit audio bytes
            
        Returns:
            ToneResult with emotional tone analysis
        """
        try:
            async with self.ws_connection as ws:
                await ws.send(audio_chunk)
                response = await asyncio.wait_for(
                    ws.recv(),
                    timeout=self.CONFIG["timeout_ms"] / 1000
                )
                return self._parse_tone_response(response)
        except Exception as e:
            logger.error(f"Tone analysis failed: {e}")
            return self._get_fallback_tone()
    
    def _parse_tone_response(self, response: dict) -> ToneResult:
        """Parse prosody and burst predictions"""
        prosody = response.get("prosody", {}).get("predictions", [{}])[0]
        burst = response.get("burst", {}).get("predictions", [])
        
        return ToneResult(
            emotional_tone=prosody.get("emotions", {}),
            acoustic_features={
                "pitch_mean": prosody.get("pitch_mean", 0),
                "intensity": prosody.get("intensity_mean", 0),
                "speaking_rate": prosody.get("speaking_rate", 0)
            },
            vocal_burst_emotions=[
                b.get("emotions", {}) for b in burst
            ],
            confidence=prosody.get("confidence", 0.0)
        )
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| Chunk Processing | 200ms | 400ms |
| Feature Extraction | 100ms | 150ms |
| **Total Stage Latency** | **300ms** | **550ms** |

### Output Format
```json
{
  "emotional_tone": {
    "distress": 0.68,
    "calm": 0.22,
    "agitation": 0.45
  },
  "acoustic_features": {
    "pitch_mean": 185.5,
    "intensity": 72.3,
    "speaking_rate": 4.2
  },
  "vocal_burst_emotions": [
    {"sigh": 0.82, "confidence": 0.91}
  ],
  "confidence": 0.87
}
```

---

## Stage 3: Speech → Text Transcription (Deepgram)

### Purpose
Convert user speech to text with high accuracy and low latency for therapy context.

### Technical Implementation

```python
class DeepgramTranscriber:
    """
    Deepgram Speech-to-Text Service
    """
    
    CONFIG = {
        "api_key": "${DEEPGRAM_API_KEY}",
        "endpoint": "wss://api.deepgram.com/v1/listen",
        "model": "nova-2-medical",  # Optimized for medical/therapy context
        "language": "en-US",
        "sample_rate": 16000,
        "encoding": "linear16",
        "features": {
            "punctuate": True,
            "diarize": False,
            "smart_format": True,
            "interim_results": True,
            "utterance_end_ms": 1000,
            "vad_events": True
        },
        "timeout_ms": 500,
        "keywords": [
            "therapy", "anxiety", "depression", "stress",
            "trauma", "coping", "mindfulness", "meditation"
        ]
    }
    
    async def transcribe_stream(self, audio_stream: AsyncIterator[bytes]) -> TranscriptionResult:
        """
        Real-time speech transcription with interim and final results
        
        Args:
            audio_stream: Async iterator of audio chunks
            
        Returns:
            TranscriptionResult with text and metadata
        """
        headers = {"Authorization": f"Token {self.api_key}"}
        params = self._build_query_params()
        
        async with websockets.connect(
            f"{self.CONFIG['endpoint']}?{params}",
            extra_headers=headers
        ) as ws:
            # Start transcription tasks
            send_task = asyncio.create_task(self._send_audio(ws, audio_stream))
            receive_task = asyncio.create_task(self._receive_transcriptions(ws))
            
            try:
                await asyncio.gather(send_task, receive_task)
            except Exception as e:
                logger.error(f"Transcription error: {e}")
                return self._get_fallback_transcription()
    
    async def _receive_transcriptions(self, ws) -> TranscriptionResult:
        """Receive and process transcription results"""
        full_transcript = []
        confidence_scores = []
        
        async for message in ws:
            data = json.loads(message)
            
            if data.get("type") == "Results":
                channel = data["channel"]
                alternatives = channel["alternatives"]
                
                if alternatives:
                    transcript = alternatives[0]["transcript"]
                    confidence = alternatives[0].get("confidence", 0)
                    is_final = data.get("is_final", False)
                    
                    if is_final:
                        full_transcript.append(transcript)
                        confidence_scores.append(confidence)
                        
                        return TranscriptionResult(
                            text=" ".join(full_transcript),
                            confidence=statistics.mean(confidence_scores),
                            words=alternatives[0].get("words", []),
                            is_final=True
                        )
                    else:
                        # Emit interim result for UI feedback
                        self._emit_interim_result(transcript)
    
    def _build_query_params(self) -> str:
        """Build Deepgram query parameters"""
        params = {
            "model": self.CONFIG["model"],
            "language": self.CONFIG["language"],
            "sample_rate": self.CONFIG["sample_rate"],
            "encoding": self.CONFIG["encoding"],
            "punctuate": str(self.CONFIG["features"]["punctuate"]).lower(),
            "smart_format": str(self.CONFIG["features"]["smart_format"]).lower(),
            "interim_results": str(self.CONFIG["features"]["interim_results"]).lower(),
            "utterance_end_ms": self.CONFIG["features"]["utterance_end_ms"],
            "keywords": "&keywords=".join(self.CONFIG["keywords"])
        }
        return urllib.parse.urlencode(params)
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| First Word Latency | 300ms | 500ms |
| Interim Result | 200ms | 300ms |
| Final Result | 400ms | 700ms |
| **Total Stage Latency** | **400ms** | **700ms** |

### Output Format
```json
{
  "text": "I've been feeling really anxious lately about work",
  "confidence": 0.94,
  "words": [
    {"word": "I've", "start": 0.0, "end": 0.2, "confidence": 0.96},
    {"word": "been", "start": 0.2, "end": 0.35, "confidence": 0.98}
  ],
  "is_final": true,
  "language": "en-US"
}
```

---

## Stage 4: Context Fusion → Claude API (Therapy Response Generation)

### Purpose
Generate empathetic, contextually appropriate therapy responses using multimodal emotional context.

### Technical Implementation

```python
class TherapyResponseGenerator:
    """
    Claude API Therapy Response Generation Service
    """
    
    CONFIG = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 500,
        "temperature": 0.7,  # Balanced creativity and consistency
        "system_prompt": """You are MindMate AI, an empathetic AI therapy assistant. 
        
Guidelines:
- Respond with genuine empathy and validation
- Use evidence-based therapeutic techniques (CBT, DBT, mindfulness)
- Never diagnose or prescribe medication
- Encourage professional help for serious concerns
- Maintain appropriate therapeutic boundaries
- Keep responses concise (2-4 sentences typically)
- Adapt tone based on user's emotional state

Current user emotional context:
- Facial emotion: {facial_emotion}
- Voice tone: {voice_tone}
- Emotional intensity: {emotion_intensity}
- Previous context: {session_context}""",
        "timeout_ms": 2000,
        "retry_attempts": 2,
        "streaming": True
    }
    
    def __init__(self):
        self.client = anthropic.AsyncAnthropic()
        self.session_context = SessionContextManager()
    
    async def generate_response(
        self,
        transcription: TranscriptionResult,
        emotion_data: EmotionResult,
        tone_data: ToneResult,
        session_id: str
    ) -> TherapyResponse:
        """
        Generate therapy response with full emotional context
        
        Args:
            transcription: User's transcribed speech
            emotion_data: Facial emotion detection results
            tone_data: Voice tone analysis results
            session_id: Current session identifier
            
        Returns:
            TherapyResponse with generated text and metadata
        """
        # Build context from all modalities
        context = self._build_multimodal_context(
            transcription, emotion_data, tone_data, session_id
        )
        
        # Get conversation history
        history = await self.session_context.get_history(session_id)
        
        # Build messages
        messages = self._build_messages(history, transcription.text)
        
        try:
            response = await self.client.messages.create(
                model=self.CONFIG["model"],
                max_tokens=self.CONFIG["max_tokens"],
                temperature=self.CONFIG["temperature"],
                system=context,
                messages=messages,
                stream=self.CONFIG["streaming"]
            )
            
            if self.CONFIG["streaming"]:
                return await self._handle_streaming_response(response)
            else:
                return self._parse_response(response)
                
        except anthropic.RateLimitError:
            logger.warning("Claude rate limit hit, using fallback")
            return self._get_fallback_response(emotion_data)
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return self._get_fallback_response(emotion_data)
    
    def _build_multimodal_context(
        self,
        transcription: TranscriptionResult,
        emotion_data: EmotionResult,
        tone_data: ToneResult,
        session_id: str
    ) -> str:
        """Build system prompt with multimodal emotional context"""
        
        # Determine dominant emotion across modalities
        dominant_emotion = self._fuse_emotions(emotion_data, tone_data)
        emotion_intensity = self._calculate_intensity(emotion_data, tone_data)
        
        # Get session context
        session_summary = self.session_context.get_summary(session_id)
        
        return self.CONFIG["system_prompt"].format(
            facial_emotion=emotion_data.primary_emotion,
            voice_tone=self._get_dominant_tone(tone_data),
            emotion_intensity=emotion_intensity,
            session_context=session_summary
        )
    
    def _fuse_emotions(
        self,
        emotion_data: EmotionResult,
        tone_data: ToneResult
    ) -> str:
        """Fuse facial and vocal emotions with confidence weighting"""
        facial_conf = emotion_data.confidence
        tone_conf = tone_data.confidence
        
        # Weight by confidence
        if facial_conf > tone_conf:
            return emotion_data.primary_emotion
        else:
            return self._get_dominant_tone(tone_data)
    
    async def _handle_streaming_response(
        self,
        response_stream
    ) -> AsyncIterator[TherapyResponse]:
        """Handle streaming response for real-time output"""
        accumulated_text = []
        
        async for chunk in response_stream:
            if chunk.type == "content_block_delta":
                text = chunk.delta.text
                accumulated_text.append(text)
                
                # Yield partial response for immediate TTS processing
                yield TherapyResponse(
                    text="".join(accumulated_text),
                    is_complete=False,
                    word_count=len(accumulated_text),
                    emotional_tone=self._analyze_response_tone(accumulated_text)
                )
        
        # Final complete response
        final_text = "".join(accumulated_text)
        yield TherapyResponse(
            text=final_text,
            is_complete=True,
            word_count=len(final_text.split()),
            emotional_tone=self._analyze_response_tone(final_text),
            suggested_expression=self._map_to_avatar_expression(final_text)
        )
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| First Token (TTFT) | 500ms | 800ms |
| Time to Complete | 1500ms | 2500ms |
| Streaming Chunk | 50ms | 100ms |
| **Total Stage Latency** | **1500ms** | **2500ms** |

### Output Format
```json
{
  "text": "I hear that work has been causing you significant anxiety. It's completely understandable to feel overwhelmed when facing pressure. Would you like to explore some coping strategies together?",
  "is_complete": true,
  "word_count": 28,
  "emotional_tone": "empathetic",
  "suggested_expression": "concerned_caring",
  "therapeutic_technique": "validation",
  "safety_flags": [],
  "confidence": 0.92
}
```

---

## Stage 5: Response Text → ElevenLabs (Voice Synthesis)

### Purpose
Convert therapy response text to natural, empathetic speech with appropriate emotional tone.

### Technical Implementation

```python
class ElevenLabsSynthesizer:
    """
    ElevenLabs Text-to-Speech Service
    """
    
    CONFIG = {
        "api_key": "${ELEVENLABS_API_KEY}",
        "base_url": "https://api.elevenlabs.io/v1",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam - warm, empathetic
        "model": "eleven_turbo_v2_5",
        "output_format": "mp3_44100_128",
        "streaming": True,
        "latency_optimization": 3,  # Max optimization
        "timeout_ms": 1500,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,  # Slight expressiveness
            "use_speaker_boost": True
        },
        "emotion_mapping": {
            "empathetic": {"stability": 0.4, "style": 0.4},
            "calm": {"stability": 0.7, "style": 0.1},
            "encouraging": {"stability": 0.5, "style": 0.5},
            "concerned": {"stability": 0.4, "style": 0.3}
        }
    }
    
    def __init__(self):
        self.client = AsyncElevenLabs(api_key=self.CONFIG["api_key"])
    
    async def synthesize_speech(
        self,
        text: str,
        emotional_tone: str,
        streaming: bool = True
    ) -> AudioResult:
        """
        Synthesize speech with emotional tone adaptation
        
        Args:
            text: Response text to synthesize
            emotional_tone: Target emotional tone
            streaming: Enable streaming output
            
        Returns:
            AudioResult with audio data and metadata
        """
        # Adjust voice settings based on emotion
        voice_settings = self._get_emotion_settings(emotional_tone)
        
        try:
            if streaming:
                return await self._stream_synthesis(text, voice_settings)
            else:
                return await self._batch_synthesis(text, voice_settings)
                
        except Exception as e:
            logger.error(f"Speech synthesis failed: {e}")
            return self._get_fallback_audio()
    
    async def _stream_synthesis(
        self,
        text: str,
        voice_settings: dict
    ) -> AsyncIterator[AudioChunk]:
        """Stream audio chunks for real-time playback"""
        
        audio_stream = await self.client.generate(
            text=text,
            voice=Voice(
                voice_id=self.CONFIG["voice_id"],
                settings=VoiceSettings(**voice_settings)
            ),
            model=self.CONFIG["model"],
            output_format=self.CONFIG["output_format"],
            stream=True,
            optimize_streaming_latency=self.CONFIG["latency_optimization"]
        )
        
        chunk_number = 0
        async for audio_chunk in audio_stream:
            yield AudioChunk(
                data=audio_chunk,
                sequence_number=chunk_number,
                timestamp=time.time(),
                is_final=False
            )
            chunk_number += 1
        
        # Signal completion
        yield AudioChunk(
            data=b"",
            sequence_number=chunk_number,
            timestamp=time.time(),
            is_final=True
        )
    
    def _get_emotion_settings(self, emotional_tone: str) -> dict:
        """Get voice settings for emotional tone"""
        base_settings = self.CONFIG["voice_settings"].copy()
        emotion_override = self.CONFIG["emotion_mapping"].get(
            emotional_tone, {}
        )
        base_settings.update(emotion_override)
        return base_settings
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| First Audio Chunk | 300ms | 500ms |
| Full Audio | 1000ms | 1500ms |
| Streaming Latency | 50ms | 100ms |
| **Total Stage Latency** | **1000ms** | **1500ms** |

### Output Format
```json
{
  "audio_format": "mp3",
  "sample_rate": 44100,
  "bitrate": 128000,
  "duration_ms": 8500,
  "chunks": 42,
  "streaming": true
}
```

---

## Stage 6: Voice → HeyGen Avatar (Lip Sync + Expression)

### Purpose
Animate AI therapist avatar with synchronized lip movements and appropriate facial expressions.

### Technical Implementation

```python
class HeyGenAvatarAnimator:
    """
    HeyGen Avatar Animation Service
    """
    
    CONFIG = {
        "api_key": "${HEYGEN_API_KEY}",
        "base_url": "https://api.heygen.com",
        "avatar_id": " therapist_avatar_001",
        "voice_id": "elevenlabs_adam",  # Matched with ElevenLabs
        "video_format": "mp4",
        "resolution": "720p",
        "fps": 30,
        "timeout_ms": 3000,
        "streaming": True,
        "expression_mapping": {
            "empathetic": "gentle_smile",
            "concerned": "worried_brow",
            "encouraging": "warm_smile",
            "calm": "neutral_peaceful",
            "listening": "attentive_nod"
        }
    }
    
    def __init__(self):
        self.session = aiohttp.ClientSession()
        self.active_streams = {}
    
    async def animate_avatar(
        self,
        audio_stream: AsyncIterator[AudioChunk],
        expression: str,
        streaming: bool = True
    ) -> VideoResult:
        """
        Generate avatar video with lip sync and expression
        
        Args:
            audio_stream: Audio data stream from TTS
            expression: Target facial expression
            streaming: Enable real-time streaming
            
        Returns:
            VideoResult with video stream/data
        """
        # Collect audio for processing
        audio_buffer = await self._collect_audio(audio_stream)
        
        # Map expression to HeyGen expression ID
        heygen_expression = self.CONFIG["expression_mapping"].get(
            expression, "neutral"
        )
        
        try:
            if streaming:
                return await self._streaming_generation(
                    audio_buffer, heygen_expression
                )
            else:
                return await self._batch_generation(
                    audio_buffer, heygen_expression
                )
                
        except Exception as e:
            logger.error(f"Avatar animation failed: {e}")
            return self._get_fallback_video()
    
    async def _streaming_generation(
        self,
        audio_buffer: bytes,
        expression: str
    ) -> AsyncIterator[VideoFrame]:
        """Stream avatar video frames in real-time"""
        
        # Start HeyGen streaming session
        session_id = await self._create_streaming_session()
        
        # Send audio for processing
        await self._send_audio_to_stream(session_id, audio_buffer)
        
        # Receive and yield video frames
        frame_number = 0
        async for frame in self._receive_video_frames(session_id):
            yield VideoFrame(
                data=frame,
                sequence_number=frame_number,
                timestamp=time.time(),
                fps=self.CONFIG["fps"],
                is_final=False
            )
            frame_number += 1
        
        # Cleanup
        await self._close_streaming_session(session_id)
    
    async def _create_streaming_session(self) -> str:
        """Create new HeyGen streaming session"""
        url = f"{self.CONFIG['base_url']}/v1/streaming.new"
        
        payload = {
            "avatar_id": self.CONFIG["avatar_id"],
            "voice": {
                "voice_id": self.CONFIG["voice_id"],
                "rate": 1.0
            },
            "quality": self.CONFIG["resolution"],
            "version": "v2"
        }
        
        async with self.session.post(url, json=payload) as response:
            data = await response.json()
            return data["data"]["session_id"]
    
    async def _send_audio_to_stream(
        self,
        session_id: str,
        audio_data: bytes
    ):
        """Send audio data to active streaming session"""
        url = f"{self.CONFIG['base_url']}/v1/streaming.task"
        
        # Convert audio to base64
        audio_b64 = base64.b64encode(audio_data).decode()
        
        payload = {
            "session_id": session_id,
            "audio": audio_b64,
            "format": "mp3"
        }
        
        async with self.session.post(url, json=payload) as response:
            return await response.json()
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| Session Creation | 500ms | 800ms |
| First Video Frame | 800ms | 1200ms |
| Lip Sync Accuracy | < 80ms | < 150ms |
| **Total Stage Latency** | **1200ms** | **1800ms** |

### Output Format
```json
{
  "video_format": "mp4",
  "resolution": "1280x720",
  "fps": 30,
  "duration_ms": 8500,
  "lip_sync_offset_ms": 45,
  "expression": "gentle_smile",
  "streaming_url": "wss://stream.heygen.com/..."
}
```

---

## Stage 7: Output → User Screen

### Purpose
Deliver synchronized audio and video to user's screen with minimal latency.

### Technical Implementation

```python
class UserOutputRenderer:
    """
    Client-side output rendering service
    """
    
    CONFIG = {
        "video_buffer_ms": 200,  # Buffer for smooth playback
        "audio_buffer_ms": 100,
        "sync_tolerance_ms": 50,
        "adaptive_bitrate": True,
        "fallback_quality": "480p"
    }
    
    def __init__(self):
        self.video_element = None
        self.audio_element = None
        self.sync_controller = A/VSyncController()
        self.metrics = RenderingMetrics()
    
    async def render_output(
        self,
        video_stream: AsyncIterator[VideoFrame],
        audio_stream: AsyncIterator[AudioChunk]
    ):
        """
        Render synchronized audio/video to user screen
        
        Args:
            video_stream: Avatar video frames
            audio_stream: Synthesized speech audio
        """
        # Initialize media elements
        await self._initialize_media_elements()
        
        # Start synchronized playback
        await self.sync_controller.start_synced_playback(
            video_stream,
            audio_stream,
            buffer_config=self.CONFIG
        )
        
        # Monitor and adjust sync in real-time
        asyncio.create_task(self._monitor_sync())
    
    async def _monitor_sync(self):
        """Monitor and correct A/V sync drift"""
        while self.is_playing:
            drift = self.sync_controller.get_sync_drift()
            
            if abs(drift) > self.CONFIG["sync_tolerance_ms"]:
                await self._correct_sync(drift)
            
            # Report metrics
            self.metrics.record_sync_drift(drift)
            
            await asyncio.sleep(0.1)  # Check every 100ms
    
    async def _correct_sync(self, drift_ms: float):
        """Correct A/V sync drift"""
        if drift_ms > 0:
            # Video ahead, delay video
            await self.sync_controller.delay_video(drift_ms)
        else:
            # Audio ahead, delay audio
            await self.sync_controller.delay_audio(abs(drift_ms))
```

### Latency Target
| Metric | Target | Maximum |
|--------|--------|---------|
| Buffering | 100ms | 200ms |
| Render Delay | 16ms | 33ms |
| A/V Sync | < 50ms | < 100ms |
| **Total Stage Latency** | **150ms** | **300ms** |

---

## Parallel Execution Strategy

### Pipeline Parallelization Diagram

```
Time →

INPUT CAPTURE (Parallel)
├─ Video Frame ──────────────────────────────────────────────┐
│    [Capture] → [Preprocess]                                  │
└──────────────────────────────────────────────────────────────┘
├─ Audio Stream ─────────────────────────────────────────────┐
│    [Capture] → [Buffer] → [Split] ──┬──→ [Tone Analysis]     │
│                                     └──→ [Transcription]     │
└──────────────────────────────────────────────────────────────┘

PARALLEL PROCESSING
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Hume Emotion│  │ Hume Tone   │  │ Deepgram Transcribe │  │
│  │ Detection   │  │ Analysis    │  │                     │  │
│  │ [400ms]     │  │ [300ms]     │  │ [400ms]             │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │ Context Fusion      │                         │
│              │ [100ms]             │                         │
│              └──────────┬──────────┘                         │
└─────────────────────────┼────────────────────────────────────┘
                          ▼
SEQUENTIAL PROCESSING (Critical Path)
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐                                         │
│  │ Claude Response │                                         │
│  │ Generation      │                                         │
│  │ [1500ms]        │                                         │
│  └────────┬────────┘                                         │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ ElevenLabs TTS  │───→│ HeyGen Avatar   │                 │
│  │ [1000ms]        │    │ [1200ms]        │                 │
│  │                 │    │ (Overlaps TTS)  │                 │
│  └─────────────────┘    └────────┬────────┘                 │
│                                  │                           │
│                                  ▼                           │
│  ┌─────────────────────────────────────────┐                │
│  │ User Screen Output                      │                │
│  │ [150ms]                                 │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

### Parallel Execution Implementation

```python
class ParallelPipelineOrchestrator:
    """
    Orchestrates parallel execution of pipeline stages
    """
    
    async def process_user_input(
        self,
        video_frame: bytes,
        audio_stream: AsyncIterator[bytes]
    ) -> TherapySessionOutput:
        """
        Process user input through parallel pipeline
        """
        
        # === STAGE 1-3: PARALLEL INPUT PROCESSING ===
        
        # Create tasks for parallel execution
        emotion_task = asyncio.create_task(
            self.hume_detector.detect_emotions(video_frame)
        )
        
        # Split audio for parallel tone + transcription
        tone_audio, transcript_audio = self._split_audio_stream(audio_stream)
        
        tone_task = asyncio.create_task(
            self.tone_analyzer.analyze_tone_stream(tone_audio)
        )
        
        transcript_task = asyncio.create_task(
            self.transcriber.transcribe_stream(transcript_audio)
        )
        
        # Wait for all parallel tasks with timeout
        try:
            emotion_result, tone_result, transcript_result = await asyncio.wait_for(
                asyncio.gather(emotion_task, tone_task, transcript_task),
                timeout=0.8  # 800ms max for parallel stage
            )
        except asyncio.TimeoutError:
            # Use available results, fallbacks for others
            emotion_result = await self._get_or_fallback(emotion_task)
            tone_result = await self._get_or_fallback(tone_task)
            transcript_result = await self._get_or_fallback(transcript_task)
        
        # === CONTEXT FUSION ===
        fused_context = self._fuse_contexts(
            emotion_result, tone_result, transcript_result
        )
        
        # === STAGE 4: RESPONSE GENERATION ===
        response_stream = self.response_generator.generate_response_stream(
            fused_context
        )
        
        # === STAGE 5-6: PIPELINED TTS + AVATAR ===
        # Start TTS and avatar generation in pipeline
        tts_stream = self._pipeline_tts_avatar(response_stream)
        
        # === STAGE 7: OUTPUT ===
        await self.output_renderer.render_stream(tts_stream)
    
    async def _pipeline_tts_avatar(
        self,
        response_stream: AsyncIterator[str]
    ) -> AsyncIterator[AVFrame]:
        """
        Pipeline TTS and Avatar generation for streaming output
        """
        tts_buffer = TextBuffer(max_size=50)  # 50 words buffer
        
        async for text_chunk in response_stream:
            await tts_buffer.add(text_chunk)
            
            # Start TTS when buffer has enough text
            if tts_buffer.word_count >= 10:
                text = await tts_buffer.flush()
                
                # Start TTS
                audio_stream = self.tts.synthesize_stream(text)
                
                # Start avatar as soon as first audio available
                async for audio_chunk in audio_stream:
                    if audio_chunk.is_first:
                        video_stream = self.avatar.animate_stream(
                            audio_stream, expression=text_chunk.emotion
                        )
                        
                        # Yield synchronized A/V frames
                        async for av_frame in self._sync_av_streams(
                            audio_stream, video_stream
                        ):
                            yield av_frame
```

---

## End-to-End Latency Analysis

### Latency Budget Breakdown

| Stage | Parallel | Target Latency | Max Latency | Notes |
|-------|----------|----------------|-------------|-------|
| 1. Video Capture | Yes | 50ms | 100ms | Local processing |
| 2. Emotion Detection | Yes | 400ms | 700ms | Hume AI API |
| 3. Tone Analysis | Yes | 300ms | 550ms | Hume AI API |
| 4. Transcription | Yes | 400ms | 700ms | Deepgram API |
| 5. Context Fusion | No | 100ms | 150ms | Local processing |
| 6. Response Gen | No | 1500ms | 2500ms | Claude API (critical path) |
| 7. TTS | No | 1000ms | 1500ms | ElevenLabs API |
| 8. Avatar | Partial | 1200ms | 1800ms | HeyGen API (overlaps TTS) |
| 9. Output | No | 150ms | 300ms | Client rendering |

### Critical Path Analysis

```
Critical Path (Sequential Stages):
┌─────────────────────────────────────────────────────────────┐
│  Context Fusion → Claude → TTS → Avatar → Output            │
│  [100ms]        [1500ms] [1000ms] [400ms*] [150ms]          │
│                                                             │
│  * Avatar starts after TTS first chunk (800ms)              │
│                                                             │
│  TOTAL CRITICAL PATH: ~2.15 seconds (target < 2.5s)         │
└─────────────────────────────────────────────────────────────┘

With Parallel Optimization:
┌─────────────────────────────────────────────────────────────┐
│  Parallel Input (800ms max)                                 │
│         │                                                   │
│         ▼                                                   │
│  Context Fusion (100ms)                                     │
│         │                                                   │
│         ▼                                                   │
│  Claude Response (1500ms) ──→ [TTS starts at first token]   │
│         │                                    │              │
│         │                                    ▼              │
│         │                         TTS Streaming (1000ms)    │
│         │                                    │              │
│         │                                    ▼              │
│         │                         Avatar (400ms overlap)    │
│         │                                                   │
│         └────────────────────────────────────┬──────────────┘
│                                              ▼              │
│                                    Output (150ms)           │
│                                                             │
│  OPTIMIZED TOTAL: ~1.8 seconds (with streaming)             │
└─────────────────────────────────────────────────────────────┘
```

### Streaming Optimization

```python
class StreamingOptimizer:
    """
    Optimizes pipeline for streaming response delivery
    """
    
    STREAMING_CONFIG = {
        "claude_streaming": True,
        "tts_streaming": True,
        "avatar_streaming": True,
        "sentence_buffer_size": 2,  # Buffer 2 sentences before TTS
        "min_tts_text_length": 50,  # Min chars before starting TTS
        "adaptive_buffer": True
    }
    
    async def optimized_streaming_pipeline(
        self,
        user_input: UserInput
    ) -> AsyncIterator[AVFrame]:
        """
        Optimized streaming pipeline with minimal latency
        """
        
        # 1. Parallel input processing
        context = await self._parallel_input_processing(user_input)
        
        # 2. Start Claude streaming
        sentence_buffer = SentenceBuffer()
        tts_queue = asyncio.Queue()
        
        # Task 1: Generate and buffer sentences
        generation_task = asyncio.create_task(
            self._generate_and_buffer(context, sentence_buffer, tts_queue)
        )
        
        # Task 2: Stream TTS and Avatar
        rendering_task = asyncio.create_task(
            self._stream_tts_avatar(tts_queue)
        )
        
        # Yield frames as they're ready
        async for frame in self._yield_frames(rendering_task):
            yield frame
    
    async def _generate_and_buffer(
        self,
        context: FusedContext,
        buffer: SentenceBuffer,
        tts_queue: asyncio.Queue
    ):
        """Generate response and buffer sentences for TTS"""
        
        async for token in self.claude.generate_stream(context):
            buffer.add(token)
            
            # Check if we have complete sentences
            if buffer.has_complete_sentences(min_count=2):
                sentences = buffer.flush_sentences()
                await tts_queue.put(sentences)
        
        # Flush remaining
        if buffer.remaining:
            await tts_queue.put(buffer.flush_all())
        
        await tts_queue.put(None)  # Signal completion
    
    async def _stream_tts_avatar(
        self,
        tts_queue: asyncio.Queue
    ) -> AsyncIterator[AVFrame]:
        """Stream TTS and avatar generation"""
        
        while True:
            text = await tts_queue.get()
            
            if text is None:
                break
            
            # Start TTS
            audio_stream = self.tts.synthesize_stream(text)
            
            # Start avatar with audio
            video_stream = self.avatar.animate_with_audio(audio_stream)
            
            # Yield synchronized frames
            async for frame in self._synchronize_av(audio_stream, video_stream):
                yield frame
```

---

## Failure Handling Strategy

### Failure Modes and Mitigation

```python
class FailureResilienceManager:
    """
    Manages failure handling and fallback strategies
    """
    
    FALLBACK_STRATEGIES = {
        "emotion_detection": {
            "retries": 3,
            "timeout_ms": 1000,
            "fallback": "neutral_emotion",
            "degraded_mode": "reduce_frame_rate"
        },
        "tone_analysis": {
            "retries": 2,
            "timeout_ms": 800,
            "fallback": "neutral_tone",
            "degraded_mode": "skip_analysis"
        },
        "transcription": {
            "retries": 3,
            "timeout_ms": 1500,
            "fallback": "request_repeat",
            "degraded_mode": "local_stt"
        },
        "response_generation": {
            "retries": 2,
            "timeout_ms": 5000,
            "fallback": "generic_response",
            "degraded_mode": "cached_responses"
        },
        "tts": {
            "retries": 2,
            "timeout_ms": 2000,
            "fallback": "browser_tts",
            "degraded_mode": "text_only"
        },
        "avatar": {
            "retries": 1,
            "timeout_ms": 3000,
            "fallback": "static_avatar",
            "degraded_mode": "audio_only"
        }
    }
    
    async def execute_with_resilience(
        self,
        stage_name: str,
        operation: Callable,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute pipeline stage with failure resilience
        """
        config = self.FALLBACK_STRATEGIES[stage_name]
        
        # Attempt with retries
        for attempt in range(config["retries"]):
            try:
                return await asyncio.wait_for(
                    operation(*args, **kwargs),
                    timeout=config["timeout_ms"] / 1000
                )
            except asyncio.TimeoutError:
                logger.warning(f"{stage_name} timeout (attempt {attempt + 1})")
                if attempt < config["retries"] - 1:
                    await asyncio.sleep(0.1 * (attempt + 1))  # Exponential backoff
            except Exception as e:
                logger.error(f"{stage_name} error: {e}")
                break
        
        # Return fallback
        return await self._get_fallback(stage_name, config["fallback"])
    
    async def _get_fallback(self, stage_name: str, fallback_type: str) -> Any:
        """Get fallback result for failed stage"""
        
        fallbacks = {
            "neutral_emotion": EmotionResult(
                primary_emotion="neutral",
                emotion_scores={"neutral": 0.8},
                confidence=0.5
            ),
            "neutral_tone": ToneResult(
                emotional_tone={"neutral": 0.8},
                confidence=0.5
            ),
            "request_repeat": TranscriptionResult(
                text="",
                confidence=0.0,
                error="Please repeat that"
            ),
            "generic_response": TherapyResponse(
                text="I want to make sure I understand you correctly. Could you share more about what you're experiencing?",
                is_complete=True,
                is_fallback=True
            ),
            "browser_tts": BrowserTTSResult(
                use_browser_tts=True
            ),
            "static_avatar": AvatarResult(
                use_static_image=True,
                image_url="/avatars/therapist_neutral.png"
            ),
            "text_only": OutputMode.TEXT_ONLY
        }
        
        return fallbacks.get(fallback_type)
```

### Circuit Breaker Pattern

```python
class CircuitBreaker:
    """
    Circuit breaker for external API calls
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self.failures = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        self.half_open_calls = 0
    
    async def call(self, operation: Callable, *args, **kwargs) -> Any:
        """Execute operation with circuit breaker protection"""
        
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0
            else:
                raise CircuitBreakerOpen("Service temporarily unavailable")
        
        try:
            result = await operation(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        """Handle successful call"""
        if self.state == CircuitState.HALF_OPEN:
            self.half_open_calls += 1
            if self.half_open_calls >= self.half_open_max_calls:
                self.state = CircuitState.CLOSED
                self.failures = 0
        else:
            self.failures = max(0, self.failures - 1)
    
    def _on_failure(self):
        """Handle failed call"""
        self.failures += 1
        self.last_failure_time = time.time()
        
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        return (time.time() - self.last_failure_time) > self.recovery_timeout
```

### Graceful Degradation Matrix

| Component | Full Function | Degraded Mode | Minimal Mode |
|-----------|---------------|---------------|--------------|
| Emotion Detection | 5fps facial analysis | 1fps analysis | Disabled |
| Tone Analysis | Full prosody | Basic pitch only | Disabled |
| Transcription | Deepgram Nova-2 | Browser Web Speech | Text input |
| Response Gen | Claude Sonnet | Claude Haiku | Cached responses |
| TTS | ElevenLabs Turbo | Browser TTS | Text display |
| Avatar | HeyGen streaming | Static image | Audio only |

---

## Monitoring and Observability

### Pipeline Metrics

```python
class PipelineMetrics:
    """
    Collect and report pipeline performance metrics
    """
    
    METRICS = {
        # Latency metrics
        "stage_latency": Histogram(
            "pipeline_stage_latency_seconds",
            "Latency per pipeline stage",
            ["stage_name"]
        ),
        "e2e_latency": Histogram(
            "pipeline_e2e_latency_seconds",
            "End-to-end pipeline latency"
        ),
        "ttft": Histogram(
            "time_to_first_token_seconds",
            "Time to first response token"
        ),
        
        # Quality metrics
        "emotion_confidence": Gauge(
            "emotion_detection_confidence",
            "Confidence in emotion detection"
        ),
        "transcription_accuracy": Gauge(
            "transcription_word_accuracy",
            "Word-level transcription accuracy"
        ),
        "sync_drift": Gauge(
            "av_sync_drift_ms",
            "Audio/video sync drift in milliseconds"
        ),
        
        # Reliability metrics
        "failure_rate": Counter(
            "pipeline_failures_total",
            "Total pipeline failures",
            ["stage_name", "error_type"]
        ),
        "fallback_activations": Counter(
            "fallback_activations_total",
            "Total fallback activations",
            ["stage_name", "fallback_type"]
        ),
        "circuit_breaker_state": Gauge(
            "circuit_breaker_state",
            "Circuit breaker state (0=closed, 1=half-open, 2=open)",
            ["service_name"]
        )
    }
```

### Health Check Endpoints

```python
class HealthCheckService:
    """
    Health check endpoints for pipeline components
    """
    
    async def check_health(self) -> HealthStatus:
        """Check health of all pipeline components"""
        
        checks = await asyncio.gather(
            self._check_hume_health(),
            self._check_deepgram_health(),
            self._check_claude_health(),
            self._check_elevenlabs_health(),
            self._check_heygen_health()
        )
        
        return HealthStatus(
            overall=all(c.healthy for c in checks),
            components={c.name: c for c in checks},
            timestamp=time.time()
        )
    
    async def _check_hume_health(self) -> ComponentHealth:
        """Check Hume AI API health"""
        try:
            start = time.time()
            response = await self.hume_client.health_check()
            latency = time.time() - start
            
            return ComponentHealth(
                name="hume_ai",
                healthy=response.status == "ok",
                latency_ms=latency * 1000,
                details={"version": response.version}
            )
        except Exception as e:
            return ComponentHealth(
                name="hume_ai",
                healthy=False,
                error=str(e)
            )
```

---

## Deployment Architecture

### Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATION                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Video Capture   │  │ Audio Capture   │  │ Output Renderer │             │
│  │ (WebRTC)        │  │ (WebRTC)        │  │ (WebGL/Canvas)  │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                        │
│           └────────────────────┴────────────────────┘                        │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │ WebSocket / WebRTC
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Kong/AWS)                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Rate Limiting │ Auth │ Load Balancing │ Request Routing                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Pipeline       │  │  Pipeline       │  │  Pipeline       │
│  Service 1      │  │  Service 2      │  │  Service N      │
│  (Kubernetes)   │  │  (Kubernetes)   │  │  (Kubernetes)   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Hume AI       │  │   Deepgram      │  │   Claude API    │
│   (External)    │  │   (External)    │  │   (External)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│  ElevenLabs     │  │   HeyGen        │
│  (External)     │  │   (External)    │
└─────────────────┘  └─────────────────┘
```

### Scaling Configuration

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mindmate-pipeline
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: pipeline
        image: mindmate/pipeline:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: HUME_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: hume
        - name: DEEPGRAM_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: deepgram
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: anthropic
        - name: ELEVENLABS_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: elevenlabs
        - name: HEYGEN_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: heygen
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mindmate-pipeline-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mindmate-pipeline
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: pipeline_active_sessions
      target:
        type: AverageValue
        averageValue: "10"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

---

## Summary

### Key Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| End-to-End Latency (First Response) | < 2.0s | < 2.5s |
| End-to-End Latency (Full Response) | < 3.5s | < 5.0s |
| Streaming Chunk Latency | < 100ms | < 200ms |
| A/V Sync Accuracy | < 50ms | < 100ms |
| Availability | 99.9% | 99.5% |
| Error Rate | < 0.1% | < 1% |

### Pipeline Strengths

1. **Parallel Processing**: Stages 1-3 run in parallel for 40% latency reduction
2. **Streaming Architecture**: Response generation and TTS are streamed
3. **Graceful Degradation**: Multiple fallback levels for each component
4. **Circuit Breakers**: Prevents cascade failures
5. **Comprehensive Monitoring**: Full observability at each stage

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API Rate Limits | Implement caching, request batching, circuit breakers |
| Network Latency | Use edge deployment, connection pooling, WebSockets |
| Service Outage | Graceful degradation to lower-quality alternatives |
| Cost Overruns | Usage quotas, auto-scaling limits, caching strategies |
| Privacy Concerns | End-to-end encryption, data minimization, HIPAA compliance |

---

## Appendix: API Configuration Quick Reference

### Environment Variables

```bash
# Hume AI
HUME_API_KEY=your_hume_api_key
HUME_API_URL=https://api.hume.ai

# Deepgram
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2-medical

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB

# HeyGen
HEYGEN_API_KEY=your_heygen_api_key
HEYGEN_AVATAR_ID=therapist_avatar_001
```

### Rate Limits

| Service | Rate Limit | Burst |
|---------|------------|-------|
| Hume AI | 100 req/min | 150 |
| Deepgram | 1000 req/min | 1500 |
| Claude | 4000 TPM | 5000 |
| ElevenLabs | 100 req/min | 150 |
| HeyGen | 50 req/min | 75 |

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: Agent 30 - AI Pipeline Architect*
