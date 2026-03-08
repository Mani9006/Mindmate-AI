/**
 * MindMate AI - Video Session Screen
 * 
 * Main entry point for the video session feature.
 * Provides a complete video therapy session experience with:
 * - WebRTC video/audio communication
 * - AI avatar streaming (HeyGen integration)
 * - Real-time emotion detection
 * - Live transcript overlay
 * - Session controls and timer
 */

// Main Screen
export { VideoSessionScreen } from './VideoSessionScreen';
export { default } from './VideoSessionScreen';

// Services
export {
  // WebRTC
  webRTCService,
  WebRTCService,
  WebRTCState,
  EmotionData as WebRTCEmotionData,
  
  // Emotion Detection
  emotionService,
  EmotionService,
  EmotionType,
  EmotionDetectionResult,
  
  // HeyGen Avatar
  HeyGenService,
  createHeyGenService,
  HeyGenStreamState,
  HeyGenSession,
  AvatarConfig,
  StreamOptions,
  TranscriptEvent,
} from './services';

// Hooks
export {
  useSessionTimer,
  formatTime,
  formatTimeLong,
  TimerConfig,
  TimerState,
} from './hooks';

// Components
export {
  SessionControls,
  SessionControlsProps,
  ControlButton,
  TranscriptOverlay,
  TranscriptOverlayProps,
  TranscriptMessage,
  EmotionIndicator,
  EmotionIndicatorProps,
  EmotionData,
} from './components';
