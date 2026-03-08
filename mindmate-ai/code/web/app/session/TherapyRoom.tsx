/**
 * MindMate AI - Therapy Room Component
 * Fullscreen therapy room UI for video sessions
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
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
import './TherapyRoom.css';

// Icons (using simple SVG components)
const Icons = {
  Mic: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Video: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  VideoOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16 16v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M23 7v10l-6-6" />
    </svg>
  ),
  ScreenShare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Fullscreen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Emotion: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  Layout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  EndCall: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

// Props interface
interface TherapyRoomProps {
  config: SessionConfig;
  onSessionEnd?: (summary: SessionSummary) => void;
  onError?: (error: SessionError) => void;
}

// Session summary
interface SessionSummary {
  sessionId: string;
  duration: number;
  emotionSummary: EmotionSummary | null;
  chatHistory: ChatMessage[];
}

export const TherapyRoom: React.FC<TherapyRoomProps> = ({
  config,
  onSessionEnd,
  onError,
}) => {
  // Refs
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

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
    isLoading: true,
    error: null,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionAnalysis[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);

  // Initialize session manager
  useEffect(() => {
    const initSession = async () => {
      if (!userVideoRef.current) return;

      const manager = new SessionManager(config, {
        onStateChange: setSessionState,
        onRoomStateChange: setRoomState,
        onChatMessage: (message) => {
          setChatMessages((prev) => [...prev, message]);
          setIsTyping(false);
        },
        onEmotionUpdate: (analysis) => {
          setCurrentEmotion(analysis);
          setEmotionHistory((prev) => [...prev, analysis]);
        },
        onEmotionSummary: (summary) => {
          // Handle emotion summary
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

      const initialized = await manager.initialize(userVideoRef.current);
      if (initialized) {
        await manager.start();
      }
    };

    initSession();

    return () => {
      sessionManagerRef.current?.dispose();
    };
  }, [config, onError]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle session end
  const handleEndSession = useCallback(() => {
    const manager = sessionManagerRef.current;
    if (manager) {
      const summary: SessionSummary = {
        sessionId: config.sessionId,
        duration: sessionState.duration,
        emotionSummary: manager.getEmotionSummary(),
        chatHistory: manager.getChatHistory(),
      };
      onSessionEnd?.(summary);
      manager.stop();
    }
  }, [config.sessionId, sessionState.duration, onSessionEnd]);

  // Handle send message
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim()) {
      sessionManagerRef.current?.sendMessage(messageInput.trim());
      setMessageInput('');
      messageInputRef.current?.focus();
    }
  }, [messageInput]);

  // Handle key press in input
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Toggle handlers
  const handleToggleAudio = useCallback(() => {
    sessionManagerRef.current?.toggleAudio();
  }, []);

  const handleToggleVideo = useCallback(() => {
    sessionManagerRef.current?.toggleVideo();
  }, []);

  const handleToggleScreenShare = useCallback(async () => {
    const result = await sessionManagerRef.current?.toggleScreenShare();
    setIsScreenSharing(result || false);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    sessionManagerRef.current?.toggleFullscreen();
  }, []);

  const handleToggleChat = useCallback(() => {
    sessionManagerRef.current?.toggleChat();
  }, []);

  const handleToggleEmotions = useCallback(() => {
    sessionManagerRef.current?.toggleEmotions();
  }, []);

  const handleTogglePause = useCallback(() => {
    if (sessionState.isPaused) {
      sessionManagerRef.current?.resume();
    } else {
      sessionManagerRef.current?.pause();
    }
  }, [sessionState.isPaused]);

  // Format duration
  const formattedDuration = useMemo(() => {
    const seconds = Math.floor(sessionState.duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [sessionState.duration]);

  // Get dominant emotion display
  const dominantEmotionDisplay = useMemo(() => {
    if (!currentEmotion) return null;
    
    const emotionEmojis: Record<string, string> = {
      happiness: '😊',
      sadness: '😢',
      anxiety: '😰',
      calmness: '😌',
      excitement: '😃',
      anger: '😠',
      fear: '😨',
      surprise: '😮',
      neutral: '😐',
      confusion: '😕',
      contentment: '🙂',
      distress: '😫',
      frustration: '😤',
    };

    return {
      name: currentEmotion.dominantEmotion,
      emoji: emotionEmojis[currentEmotion.dominantEmotion] || '😐',
      score: currentEmotion.emotionScores[currentEmotion.dominantEmotion] || 0,
    };
  }, [currentEmotion]);

  // Render layout based on current layout state
  const renderLayout = () => {
    switch (roomState.layout) {
      case RoomLayout.USER_FOCUS:
        return (
          <div className="therapy-room-layout user-focus">
            <div className="video-container main">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`user-video ${!isVideoEnabled ? 'disabled' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="video-placeholder">
                  <span>Camera Off</span>
                </div>
              )}
            </div>
            <div className="video-container pip">
              <div id="avatar-container" className="avatar-container">
                {!config.heygenConfig && (
                  <div className="avatar-placeholder">
                    <Icons.Emotion />
                    <span>AI Therapist</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case RoomLayout.AVATAR_FOCUS:
        return (
          <div className="therapy-room-layout avatar-focus">
            <div className="video-container main">
              <div id="avatar-container" className="avatar-container">
                {!config.heygenConfig && (
                  <div className="avatar-placeholder">
                    <Icons.Emotion />
                    <span>AI Therapist</span>
                  </div>
                )}
              </div>
            </div>
            <div className="video-container pip">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`user-video ${!isVideoEnabled ? 'disabled' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="video-placeholder">
                  <span>Camera Off</span>
                </div>
              )}
            </div>
          </div>
        );

      case RoomLayout.FULLSCREEN_AVATAR:
        return (
          <div className="therapy-room-layout fullscreen-avatar">
            <div id="avatar-container" className="avatar-container fullscreen">
              {!config.heygenConfig && (
                <div className="avatar-placeholder">
                  <Icons.Emotion />
                  <span>AI Therapist</span>
                </div>
              )}
            </div>
          </div>
        );

      case RoomLayout.SPLIT:
      default:
        return (
          <div className="therapy-room-layout split">
            <div className="video-container">
              <div id="avatar-container" className="avatar-container">
                {!config.heygenConfig && (
                  <div className="avatar-placeholder">
                    <Icons.Emotion />
                    <span>AI Therapist</span>
                  </div>
                )}
              </div>
            </div>
            <div className="video-container">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className={`user-video ${!isVideoEnabled ? 'disabled' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="video-placeholder">
                  <span>Camera Off</span>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  // Loading state
  if (roomState.isLoading) {
    return (
      <div className="therapy-room loading">
        <div className="loading-spinner" />
        <p>Initializing your therapy session...</p>
      </div>
    );
  }

  // Error state
  if (roomState.error) {
    return (
      <div className="therapy-room error">
        <div className="error-icon">⚠️</div>
        <h2>Session Error</h2>
        <p>{roomState.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div
      className={`therapy-room ${roomState.isFullscreen ? 'fullscreen' : ''} ${
        roomState.layout
      }`}
    >
      {/* Header */}
      <div className="therapy-room-header">
        <div className="session-info">
          <h1>Therapy Session</h1>
          <span className="duration">{formattedDuration}</span>
        </div>
        <div className="session-status">
          {sessionState.isPaused && <span className="paused-badge">Paused</span>}
          {dominantEmotionDisplay && (
            <span className="emotion-badge">
              {dominantEmotionDisplay.emoji} {dominantEmotionDisplay.name}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="therapy-room-content">
        {/* Video Area */}
        <div className="video-area">{renderLayout()}</div>

        {/* Chat Panel */}
        {roomState.showChat && (
          <div className="chat-panel">
            <div className="chat-header">
              <h3>Conversation</h3>
              <button
                className="icon-button"
                onClick={handleToggleChat}
                aria-label="Close chat"
              >
                <Icons.Close />
              </button>
            </div>
            <div className="chat-messages" ref={chatContainerRef}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender}`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    {msg.emotion && (
                      <span className="message-emotion">{msg.emotion}</span>
                    )}
                  </div>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message ai typing">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input-area">
              <input
                ref={messageInputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={!sessionState.isActive || sessionState.isPaused}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !sessionState.isActive}
                aria-label="Send message"
              >
                <Icons.Send />
              </button>
            </div>
          </div>
        )}

        {/* Emotions Panel */}
        {roomState.showEmotions && (
          <div className="emotions-panel">
            <div className="panel-header">
              <h3>Emotion Insights</h3>
              <button
                className="icon-button"
                onClick={handleToggleEmotions}
                aria-label="Close emotions panel"
              >
                <Icons.Close />
              </button>
            </div>
            <div className="emotions-content">
              {currentEmotion ? (
                <>
                  <div className="current-emotion">
                    <span className="emotion-emoji">
                      {dominantEmotionDisplay?.emoji}
                    </span>
                    <span className="emotion-name">
                      {currentEmotion.dominantEmotion}
                    </span>
                    <span className="emotion-score">
                      {Math.round((dominantEmotionDisplay?.score || 0) * 100)}%
                    </span>
                  </div>
                  <div className="emotion-metrics">
                    <div className="metric">
                      <label>Engagement</label>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${currentEmotion.engagementScore * 100}%`,
                          }}
                        />
                      </div>
                      <span>{Math.round(currentEmotion.engagementScore * 100)}%</span>
                    </div>
                    <div className="metric">
                      <label>Stress Level</label>
                      <div className="progress-bar">
                        <div
                          className="progress-fill stress"
                          style={{
                            width: `${currentEmotion.stressLevel * 100}%`,
                          }}
                        />
                      </div>
                      <span>{Math.round(currentEmotion.stressLevel * 100)}%</span>
                    </div>
                  </div>
                  <div className="emotion-history">
                    <h4>Recent Emotions</h4>
                    <div className="emotion-timeline">
                      {emotionHistory.slice(-10).map((emotion, idx) => (
                        <div
                          key={idx}
                          className={`timeline-item ${emotion.dominantEmotion}`}
                          title={emotion.dominantEmotion}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-emotion-data">
                  <p>Analyzing emotions...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {roomState.showControls && (
        <div className="therapy-room-controls">
          <div className="control-group main">
            <button
              className={`control-button ${!isAudioEnabled ? 'disabled' : ''}`}
              onClick={handleToggleAudio}
              aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? <Icons.Mic /> : <Icons.MicOff />}
            </button>
            <button
              className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
              onClick={handleToggleVideo}
              aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Icons.Video /> : <Icons.VideoOff />}
            </button>
            <button
              className={`control-button ${isScreenSharing ? 'active' : ''}`}
              onClick={handleToggleScreenShare}
              aria-label="Share screen"
            >
              <Icons.ScreenShare />
            </button>
          </div>

          <div className="control-group session">
            <button
              className="control-button pause"
              onClick={handleTogglePause}
              aria-label={sessionState.isPaused ? 'Resume session' : 'Pause session'}
            >
              {sessionState.isPaused ? <Icons.Play /> : <Icons.Pause />}
            </button>
            <button
              className="control-button end-call"
              onClick={handleEndSession}
              aria-label="End session"
            >
              <Icons.EndCall />
            </button>
          </div>

          <div className="control-group layout">
            <button
              className={`control-button ${roomState.showChat ? 'active' : ''}`}
              onClick={handleToggleChat}
              aria-label="Toggle chat"
            >
              <Icons.Chat />
            </button>
            <button
              className={`control-button ${roomState.showEmotions ? 'active' : ''}`}
              onClick={handleToggleEmotions}
              aria-label="Toggle emotions panel"
            >
              <Icons.Emotion />
            </button>
            <button
              className="control-button"
              onClick={handleToggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              <Icons.Fullscreen />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapyRoom;
