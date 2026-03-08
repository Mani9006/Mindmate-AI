/**
 * Services Index for MindMate AI Video Session
 */

export { 
  webRTCService, 
  WebRTCService,
  WebRTCState,
  EmotionData,
} from './webrtc.service';

export { 
  emotionService, 
  EmotionService,
  EmotionType,
  EmotionDetectionResult,
} from './emotion.service';

export { 
  HeyGenService,
  createHeyGenService,
  HeyGenStreamState,
  HeyGenSession,
  AvatarConfig,
  StreamOptions,
  TranscriptEvent,
} from './heygen.service';
