/**
 * MindMate AI - Session Module
 * Browser-based video session implementation exports
 */

// Types
export * from './types';

// Services
export { WebRTCService } from './webrtc-service';
export { MediaService } from './media-service';
export { EmotionCaptureService, type EmotionSummary } from './emotion-capture';
export { AvatarService } from './avatar-service';
export { SessionWebSocketClient } from './websocket-client';
export { SessionManager, type SessionState } from './session-manager';

// React Components
export { TherapyRoom } from './TherapyRoom';

// React Hooks
export { useSession } from './useSession';

// Default export
export { SessionManager as default } from './session-manager';
