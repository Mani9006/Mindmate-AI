/**
 * MindMate AI - Video Session Types
 * TypeScript type definitions for browser-based therapy sessions
 */

// WebRTC Types
export interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

export interface MediaStreamState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export interface RTCConnectionState {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
  isConnected: boolean;
}

// Emotion Capture Types
export interface EmotionFrame {
  timestamp: number;
  frameData: string; // Base64 encoded image
  width: number;
  height: number;
}

export interface HumeEmotionPrediction {
  emotions: {
    name: string;
    score: number;
  }[];
  faceId?: string;
  bbox?: [number, number, number, number];
}

export interface HumeEmotionResponse {
  predictions: HumeEmotionPrediction[];
  error?: string;
}

export interface EmotionAnalysis {
  timestamp: number;
  dominantEmotion: string;
  emotionScores: Record<string, number>;
  engagementScore: number;
  stressLevel: number;
}

// Avatar Types (HeyGen)
export interface HeyGenConfig {
  apiKey: string;
  avatarId: string;
  voiceId: string;
  language?: string;
}

export interface AvatarState {
  isReady: boolean;
  isSpeaking: boolean;
  currentText: string;
  error: string | null;
}

export interface AvatarMessage {
  text: string;
  emotion?: string;
  pauseDuration?: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: SessionMessageType;
  payload: unknown;
  timestamp: number;
  sessionId: string;
}

export enum SessionMessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  
  // Signaling
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',
  
  // Session
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  SESSION_PAUSE = 'session_pause',
  SESSION_RESUME = 'session_resume',
  
  // Media
  MEDIA_STATE_CHANGE = 'media_state_change',
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_STOP = 'screen_share_stop',
  
  // Emotion
  EMOTION_DATA = 'emotion_data',
  EMOTION_SUMMARY = 'emotion_summary',
  
  // Chat
  USER_MESSAGE = 'user_message',
  AI_MESSAGE = 'ai_message',
  TYPING_INDICATOR = 'typing_indicator',
  
  // Avatar
  AVATAR_SPEAK = 'avatar_speak',
  AVATAR_STOP = 'avatar_stop',
  
  // Error
  ERROR = 'error',
}

export interface SessionConfig {
  sessionId: string;
  userId: string;
  therapistId?: string;
  websocketUrl: string;
  humeApiKey: string;
  heygenConfig?: HeyGenConfig;
  rtcConfig?: PeerConnectionConfig;
}

// UI Types
export interface TherapyRoomState {
  isFullscreen: boolean;
  layout: RoomLayout;
  showChat: boolean;
  showEmotions: boolean;
  showControls: boolean;
  isLoading: boolean;
  error: string | null;
}

export enum RoomLayout {
  SPLIT = 'split',
  USER_FOCUS = 'user_focus',
  AVATAR_FOCUS = 'avatar_focus',
  FULLSCREEN_AVATAR = 'fullscreen_avatar',
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  emotion?: string;
}

// Error Types
export interface SessionError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

export enum SessionErrorCode {
  WEBSOCKET_CONNECTION_FAILED = 'WS_CONNECTION_FAILED',
  WEBRTC_CONNECTION_FAILED = 'RTC_CONNECTION_FAILED',
  MEDIA_ACCESS_DENIED = 'MEDIA_ACCESS_DENIED',
  MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
  HUME_API_ERROR = 'HUME_API_ERROR',
  HEYGEN_API_ERROR = 'HEYGEN_API_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
