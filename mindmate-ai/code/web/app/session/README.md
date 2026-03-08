# MindMate AI - Video Session Module

Browser-based video session implementation for AI-powered therapy sessions.

## Features

- **WebRTC Browser API Integration** - Peer-to-peer video communication
- **getUserMedia Camera/Microphone** - Access and control media devices
- **Canvas-based Emotion Capture** - Real-time emotion analysis via Hume AI
- **AI Avatar Embed** - HeyGen browser SDK integration for AI therapist avatar
- **Session WebSocket Client** - Real-time communication with backend
- **Fullscreen Therapy Room UI** - Professional therapy session interface

## Installation

```bash
npm install @mindmate-ai/session
```

## Quick Start

### Using the React Component

```tsx
import { TherapyRoom } from '@mindmate-ai/session';

function App() {
  const config = {
    sessionId: 'session-123',
    userId: 'user-456',
    websocketUrl: 'wss://api.mindmate.ai/sessions',
    humeApiKey: 'your-hume-api-key',
    heygenConfig: {
      apiKey: 'your-heygen-api-key',
      avatarId: 'your-avatar-id',
      voiceId: 'your-voice-id',
    },
  };

  return (
    <TherapyRoom
      config={config}
      onSessionEnd={(summary) => console.log('Session ended:', summary)}
      onError={(error) => console.error('Session error:', error)}
    />
  );
}
```

### Using the React Hook

```tsx
import { useSession, RoomLayout } from '@mindmate-ai/session';

function CustomTherapyRoom() {
  const config = {
    sessionId: 'session-123',
    userId: 'user-456',
    websocketUrl: 'wss://api.mindmate.ai/sessions',
    humeApiKey: 'your-hume-api-key',
  };

  const {
    userVideoRef,
    sessionState,
    chatMessages,
    currentEmotion,
    initialize,
    sendMessage,
    toggleAudio,
    toggleVideo,
    stop,
  } = useSession(config, {
    onSessionEnd: (summary) => console.log('Session ended:', summary),
    onError: (error) => console.error('Error:', error),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="therapy-room">
      <video ref={userVideoRef} autoPlay playsInline muted />
      
      <div className="chat">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={msg.sender}>
            {msg.text}
          </div>
        ))}
      </div>
      
      {currentEmotion && (
        <div className="emotion">
          Current: {currentEmotion.dominantEmotion}
        </div>
      )}
      
      <button onClick={toggleAudio}>Toggle Audio</button>
      <button onClick={toggleVideo}>Toggle Video</button>
      <button onClick={stop}>End Session</button>
    </div>
  );
}
```

### Using Services Directly

```typescript
import {
  WebRTCService,
  MediaService,
  EmotionCaptureService,
  AvatarService,
  SessionWebSocketClient,
} from '@mindmate-ai/session';

// Initialize WebRTC
const webRTC = new WebRTCService({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}, {
  onRemoteStream: (stream) => {
    // Handle remote stream
  },
});

// Initialize Media
const media = new MediaService({
  onStreamReady: (stream) => {
    // Handle local stream
  },
});
await media.requestMediaAccess();

// Initialize Emotion Capture
const emotionCapture = new EmotionCaptureService({
  humeApiKey: 'your-hume-api-key',
}, {
  onEmotionAnalyzed: (analysis) => {
    console.log('Emotion:', analysis.dominantEmotion);
  },
});

// Initialize Avatar
const avatar = new AvatarService({
  apiKey: 'your-heygen-api-key',
  avatarId: 'your-avatar-id',
  voiceId: 'your-voice-id',
}, {
  onReady: () => {
    avatar.speak('Hello, how are you feeling today?');
  },
});
await avatar.initialize();

// Initialize WebSocket
const ws = new SessionWebSocketClient({
  sessionId: 'session-123',
  userId: 'user-456',
  websocketUrl: 'wss://api.mindmate.ai/sessions',
  humeApiKey: 'your-hume-api-key',
}, {
  onConnect: () => console.log('Connected'),
  onAIResponse: (response) => console.log('AI:', response.text),
});
ws.connect();
```

## Configuration

### SessionConfig

```typescript
interface SessionConfig {
  sessionId: string;           // Unique session identifier
  userId: string;              // User identifier
  therapistId?: string;        // Optional therapist identifier
  websocketUrl: string;        // WebSocket server URL
  humeApiKey: string;          // Hume AI API key
  heygenConfig?: {             // Optional HeyGen configuration
    apiKey: string;
    avatarId: string;
    voiceId: string;
    language?: string;
  };
  rtcConfig?: {                // Optional WebRTC configuration
    iceServers: RTCIceServer[];
  };
}
```

## API Reference

### WebRTCService

Manages peer-to-peer video connections.

```typescript
const webRTC = new WebRTCService(config, callbacks);
webRTC.initialize(isInitiator);
webRTC.addLocalStream(stream);
const offer = await webRTC.createOffer();
await webRTC.handleAnswer(answer);
webRTC.close();
```

### MediaService

Handles camera and microphone access.

```typescript
const media = new MediaService(callbacks);
await media.requestMediaAccess(constraints);
media.toggleAudio();
media.toggleVideo();
await media.switchCamera(deviceId);
const devices = await MediaService.getDevices();
```

### EmotionCaptureService

Captures and analyzes emotions using Hume AI.

```typescript
const emotionCapture = new EmotionCaptureService(config, callbacks);
emotionCapture.setVideoElement(videoElement);
emotionCapture.start();
emotionCapture.stop();
const analysis = await emotionCapture.analyzeFrame(frame);
const summary = emotionCapture.generateSummary();
const insights = emotionCapture.getTherapyInsights();
```

### AvatarService

Integrates HeyGen AI avatar for the therapist.

```typescript
const avatar = new AvatarService(config, callbacks);
await avatar.initialize();
await avatar.speak(text, emotion);
avatar.stopSpeaking();
const voices = await AvatarService.getAvailableVoices(apiKey);
```

### SessionWebSocketClient

Manages real-time communication with the backend.

```typescript
const ws = new SessionWebSocketClient(config, callbacks);
ws.connect();
ws.sendUserMessage(text);
ws.sendEmotionData(analysis);
ws.sendRTCSignal(type, payload);
ws.disconnect();
```

### SessionManager

Orchestrates all services for a complete session.

```typescript
const manager = new SessionManager(config, callbacks);
await manager.initialize(videoElement);
await manager.start();
manager.sendMessage(text);
manager.toggleAudio();
manager.stop();
```

## Room Layouts

The therapy room supports multiple layouts:

- `RoomLayout.SPLIT` - Side-by-side video and avatar
- `RoomLayout.USER_FOCUS` - User video main, avatar picture-in-picture
- `RoomLayout.AVATAR_FOCUS` - Avatar main, user video picture-in-picture
- `RoomLayout.FULLSCREEN_AVATAR` - Avatar only, fullscreen

## Emotion Analysis

Emotions are analyzed in real-time and include:

- **Dominant Emotion** - Primary detected emotion
- **Emotion Scores** - Confidence scores for all emotions
- **Engagement Score** - User engagement level (0-1)
- **Stress Level** - Estimated stress level (0-1)

### Therapy-Relevant Emotions

- Anxiety, Calmness, Confusion
- Contentment, Distress
- Excitement, Fatigue
- Fear, Frustration
- Happiness, Interest
- Sadness, Stress
- Surprise

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Required APIs:
- WebRTC (RTCPeerConnection)
- getUserMedia
- WebSocket
- Canvas

## License

MIT License - MindMate AI
