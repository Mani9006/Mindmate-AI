/**
 * MindMate AI - useSession Hook
 * React hook for easy session management integration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SessionConfig,
  SessionState,
  TherapyRoomState,
  RoomLayout,
  ChatMessage,
  EmotionAnalysis,
  EmotionSummary,
  SessionError,
  MediaStreamState,
  RTCConnectionState,
  AvatarState,
} from './types';
import { SessionManager } from './session-manager';

// Hook return type
interface UseSessionReturn {
  // State
  sessionState: SessionState;
  roomState: TherapyRoomState;
  chatMessages: ChatMessage[];
  currentEmotion: EmotionAnalysis | null;
  emotionHistory: EmotionAnalysis[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  avatarState: AvatarState | null;
  
  // Refs
  userVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Actions
  initialize: () => Promise<boolean>;
  start: () => Promise<boolean>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  sendMessage: (text: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<boolean>;
  toggleFullscreen: () => void;
  toggleChat: () => void;
  toggleEmotions: () => void;
  setLayout: (layout: RoomLayout) => void;
  
  // Getters
  getEmotionSummary: () => EmotionSummary | null;
  getTherapyInsights: () => ReturnType<SessionManager['getTherapyInsights']>;
  getChatHistory: () => ChatMessage[];
}

// Hook options
interface UseSessionOptions {
  onSessionEnd?: (summary: {
    sessionId: string;
    duration: number;
    emotionSummary: EmotionSummary | null;
    chatHistory: ChatMessage[];
  }) => void;
  onError?: (error: SessionError) => void;
  onEmotionUpdate?: (analysis: EmotionAnalysis) => void;
  onChatMessage?: (message: ChatMessage) => void;
}

/**
 * React hook for managing therapy sessions
 */
export function useSession(
  config: SessionConfig,
  options: UseSessionOptions = {}
): UseSessionReturn {
  const { onSessionEnd, onError, onEmotionUpdate, onChatMessage } = options;
  
  // Refs
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  
  // State
  const [sessionState, setSessionState] = useState<SessionState>({
    isInitialized: false,
    isActive: false,
    isPaused: false,
    startTime: null,
    duration: 0,
    error: null,
  });
  
  const [roomState, setRoomState] = useState<TherapyRoomState>({
    isFullscreen: false,
    layout: RoomLayout.SPLIT,
    showChat: true,
    showEmotions: true,
    showControls: true,
    isLoading: false,
    error: null,
  });
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionAnalysis[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
  
  // Initialize session manager
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!userVideoRef.current) {
      console.error('[useSession] Video element not available');
      return false;
    }
    
    if (sessionManagerRef.current) {
      console.warn('[useSession] Session manager already initialized');
      return true;
    }
    
    const manager = new SessionManager(config, {
      onStateChange: setSessionState,
      onRoomStateChange: setRoomState,
      onChatMessage: (message) => {
        setChatMessages((prev) => [...prev, message]);
        onChatMessage?.(message);
      },
      onEmotionUpdate: (analysis) => {
        setCurrentEmotion(analysis);
        setEmotionHistory((prev) => [...prev, analysis]);
        onEmotionUpdate?.(analysis);
      },
      onError: (error) => {
        onError?.(error);
      },
      onMediaStateChange: (state) => {
        setIsAudioEnabled(state.isAudioEnabled);
        setIsVideoEnabled(state.isVideoEnabled);
      },
      onAvatarStateChange: setAvatarState,
    });
    
    sessionManagerRef.current = manager;
    
    return await manager.initialize(userVideoRef.current);
  }, [config, onError, onEmotionUpdate, onChatMessage]);
  
  // Start session
  const start = useCallback(async (): Promise<boolean> => {
    return await sessionManagerRef.current?.start() ?? false;
  }, []);
  
  // Stop session
  const stop = useCallback((): void => {
    const manager = sessionManagerRef.current;
    if (manager) {
      const summary = {
        sessionId: config.sessionId,
        duration: sessionState.duration,
        emotionSummary: manager.getEmotionSummary(),
        chatHistory: manager.getChatHistory(),
      };
      onSessionEnd?.(summary);
      manager.stop();
    }
  }, [config.sessionId, sessionState.duration, onSessionEnd]);
  
  // Pause session
  const pause = useCallback((): void => {
    sessionManagerRef.current?.pause();
  }, []);
  
  // Resume session
  const resume = useCallback((): void => {
    sessionManagerRef.current?.resume();
  }, []);
  
  // Send message
  const sendMessage = useCallback((text: string): void => {
    sessionManagerRef.current?.sendMessage(text);
  }, []);
  
  // Toggle audio
  const toggleAudio = useCallback((): void => {
    sessionManagerRef.current?.toggleAudio();
  }, []);
  
  // Toggle video
  const toggleVideo = useCallback((): void => {
    sessionManagerRef.current?.toggleVideo();
  }, []);
  
  // Toggle screen share
  const toggleScreenShare = useCallback(async (): Promise<boolean> => {
    const result = await sessionManagerRef.current?.toggleScreenShare();
    setIsScreenSharing(result || false);
    return result || false;
  }, []);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback((): void => {
    sessionManagerRef.current?.toggleFullscreen();
  }, []);
  
  // Toggle chat
  const toggleChat = useCallback((): void => {
    sessionManagerRef.current?.toggleChat();
  }, []);
  
  // Toggle emotions
  const toggleEmotions = useCallback((): void => {
    sessionManagerRef.current?.toggleEmotions();
  }, []);
  
  // Set layout
  const setLayout = useCallback((layout: RoomLayout): void => {
    sessionManagerRef.current?.setLayout(layout);
  }, []);
  
  // Get emotion summary
  const getEmotionSummary = useCallback((): EmotionSummary | null => {
    return sessionManagerRef.current?.getEmotionSummary() || null;
  }, []);
  
  // Get therapy insights
  const getTherapyInsights = useCallback(() => {
    return sessionManagerRef.current?.getTherapyInsights() || null;
  }, []);
  
  // Get chat history
  const getChatHistory = useCallback((): ChatMessage[] => {
    return sessionManagerRef.current?.getChatHistory() || [];
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionManagerRef.current?.dispose();
    };
  }, []);
  
  return {
    // State
    sessionState,
    roomState,
    chatMessages,
    currentEmotion,
    emotionHistory,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    avatarState,
    
    // Refs
    userVideoRef,
    
    // Actions
    initialize,
    start,
    stop,
    pause,
    resume,
    sendMessage,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleFullscreen,
    toggleChat,
    toggleEmotions,
    setLayout,
    
    // Getters
    getEmotionSummary,
    getTherapyInsights,
    getChatHistory,
  };
}

export default useSession;
