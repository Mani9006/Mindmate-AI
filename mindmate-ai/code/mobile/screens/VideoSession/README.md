# MindMate AI - Video Session Screen

A comprehensive React Native video session screen for AI-powered therapy sessions.

## Features

### 1. WebRTC Integration (`services/webrtc.service.ts`)
- Peer-to-peer video/audio communication
- ICE server configuration with STUN/TURN
- Data channel for emotion data transmission
- Signaling server integration
- Camera/microphone control
- Connection state management

### 2. Emotion Detection (`services/emotion.service.ts`)
- Real-time emotion detection from video frames
- Support for 7 emotions: neutral, happy, sad, angry, fearful, disgusted, surprised
- Cloud API and local processing options
- Emotion history tracking
- Statistics calculation
- Data transmission via WebRTC data channel

### 3. HeyGen AI Avatar (`services/heygen.service.ts`)
- AI avatar video streaming integration
- Real-time speech synthesis
- Transcript generation
- Auto-reconnection handling
- Session management

### 4. Session Controls (`components/SessionControls.tsx`)
- Mute/unmute audio
- Enable/disable video
- Switch camera (front/back)
- End session with confirmation
- Emergency support button with crisis resources

### 5. Transcript Overlay (`components/TranscriptOverlay.tsx`)
- Real-time conversation transcript
- User and AI message differentiation
- Live typing indicator
- Collapsible/expandable view
- Message history

### 6. Emotion Indicator (`components/EmotionIndicator.tsx`)
- Subtle emotion visualization
- Dominant emotion display
- Confidence level indicator
- Detailed emotion breakdown (optional)
- Face detection status

### 7. Session Timer (`hooks/useSessionTimer.ts`)
- Elapsed time tracking
- Configurable session duration
- Warning notifications (5 min, 1 min remaining)
- Progress indicator
- Pause/resume functionality

## Installation

### Dependencies

```bash
npm install react-native-webrtc
npm install react-native-vector-icons
npm install @react-navigation/native
npm install @react-navigation/stack
```

### iOS Setup

Add to `ios/Podfile`:
```ruby
pod 'react-native-webrtc', :path => '../node_modules/react-native-webrtc'
```

Add camera and microphone permissions to `ios/YourApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is needed for video sessions</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is needed for audio communication</string>
```

### Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />
```

## Usage

### Basic Usage

```tsx
import { VideoSessionScreen } from './screens/VideoSession';

// In your navigation stack
<Stack.Screen 
  name="VideoSession" 
  component={VideoSessionScreen}
  options={{ headerShown: false }}
/>

// Navigate to session
navigation.navigate('VideoSession', {
  sessionId: 'your-session-id',
  token: 'your-auth-token',
  avatarId: 'your-heygen-avatar-id',
  voiceId: 'your-heygen-voice-id',
});
```

### Using Services Directly

```tsx
import { webRTCService, emotionService, createHeyGenService } from './screens/VideoSession';

// Initialize WebRTC
const stream = await webRTCService.initializeLocalStream(true, true);
webRTCService.createPeerConnection();

// Start emotion detection
emotionService.on('emotionDetected', (result) => {
  console.log('Detected emotion:', result.dominantEmotion);
});
emotionService.start();

// Initialize HeyGen avatar
const heyGen = createHeyGenService({
  avatarId: 'your-avatar-id',
  voiceId: 'your-voice-id',
});
await heyGen.connect();
heyGen.speak('Hello! How are you feeling today?');
```

### Using the Timer Hook

```tsx
import { useSessionTimer } from './screens/VideoSession';

function MyComponent() {
  const { state, start, pause, resume, reset } = useSessionTimer({
    maxDuration: 50, // 50 minutes
    warningThreshold: 5, // Warn at 5 minutes remaining
    autoEnd: false,
  });

  return (
    <View>
      <Text>Session Time: {state.formattedTime}</Text>
      <Text>Remaining: {state.formattedRemaining}</Text>
      {state.isWarning && <Text>Session ending soon!</Text>}
    </View>
  );
}
```

## Environment Variables

Create a `.env` file:

```env
# WebRTC
SIGNALING_SERVER_URL=wss://signaling.mindmate.ai
TURN_USERNAME=your-turn-username
TURN_CREDENTIAL=your-turn-credential

# Emotion API
EMOTION_API_ENDPOINT=https://api.mindmate.ai/v1/emotion
EMOTION_API_KEY=your-emotion-api-key

# HeyGen
HEYGEN_API_KEY=your-heygen-api-key
HEYGEN_AVATAR_ID=your-default-avatar-id
HEYGEN_VOICE_ID=your-default-voice-id
```

## Architecture

```
VideoSession/
├── VideoSessionScreen.tsx    # Main screen component
├── index.ts                  # Public exports
├── README.md                 # Documentation
├── services/
│   ├── webrtc.service.ts     # WebRTC peer connection
│   ├── emotion.service.ts    # Emotion detection
│   ├── heygen.service.ts     # AI avatar streaming
│   └── index.ts              # Service exports
├── components/
│   ├── SessionControls.tsx   # Mute, end, emergency buttons
│   ├── TranscriptOverlay.tsx # Live transcript display
│   ├── EmotionIndicator.tsx  # Emotion visualization
│   └── index.ts              # Component exports
└── hooks/
    ├── useSessionTimer.ts    # Session timer hook
    └── index.ts              # Hook exports
```

## API Reference

### WebRTCService

| Method | Description |
|--------|-------------|
| `initializeLocalStream(video, audio)` | Get camera/microphone access |
| `createPeerConnection()` | Create RTCPeerConnection |
| `createOffer()` | Create SDP offer |
| `createAnswer(offer)` | Create SDP answer |
| `toggleAudio()` | Mute/unmute audio |
| `toggleVideo()` | Enable/disable video |
| `switchCamera()` | Switch front/back camera |
| `sendEmotionData(data)` | Send emotion via data channel |
| `endSession()` | Cleanup and end session |

### EmotionService

| Method | Description |
|--------|-------------|
| `start()` | Start emotion detection |
| `stop()` | Stop emotion detection |
| `getCurrentEmotion()` | Get current emotion data |
| `getEmotionHistory()` | Get emotion history array |
| `getEmotionStats()` | Get aggregated statistics |
| `updateConfig(config)` | Update service configuration |

### HeyGenService

| Method | Description |
|--------|-------------|
| `connect()` | Connect to HeyGen streaming |
| `speak(text, options)` | Make avatar speak |
| `stopSpeaking()` | Stop current speech |
| `pause()` | Pause stream |
| `resume()` | Resume stream |
| `getTranscriptHistory()` | Get conversation transcript |
| `disconnect()` | Disconnect from HeyGen |

## Events

### WebRTCService Events
- `localStream` - Local media stream ready
- `remoteStream` - Remote stream received
- `connected` - Peer connection established
- `disconnected` - Connection closed
- `connectionStateChange` - Connection state changed
- `iceCandidate` - New ICE candidate

### EmotionService Events
- `emotionDetected` - New emotion detected
- `emotionChanged` - Dominant emotion changed
- `detectionError` - Detection error occurred

### HeyGenService Events
- `connected` - Connected to HeyGen
- `streamReady` - Stream is ready
- `transcript` - Partial transcript available
- `transcriptFinal` - Final transcript received
- `disconnected` - Connection closed

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check camera permissions
   - Verify no other app is using the camera
   - Restart the app

2. **No audio**
   - Check microphone permissions
   - Verify mute state
   - Check device volume

3. **Connection failed**
   - Check internet connection
   - Verify signaling server is accessible
   - Check TURN server credentials

4. **Avatar not loading**
   - Verify HeyGen API key
   - Check avatar/voice IDs
   - Check network connectivity

## License

MIT License - MindMate AI
