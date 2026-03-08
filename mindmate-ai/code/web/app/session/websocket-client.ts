/**
 * MindMate AI - WebSocket Client
 * Session WebSocket client for real-time communication with therapy session backend
 */

import {
  WebSocketMessage,
  SessionMessageType,
  SessionConfig,
  SessionError,
  SessionErrorCode,
  RTCConnectionState,
  EmotionAnalysis,
} from './types';

// Reconnection configuration
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Event callbacks
interface WebSocketEventCallbacks {
  onConnect?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: SessionError) => void;
  onSessionStart?: (sessionData: SessionStartData) => void;
  onSessionEnd?: (sessionData: SessionEndData) => void;
  onAIResponse?: (response: AIResponseData) => void;
  onEmotionUpdate?: (emotionData: EmotionData) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
  onRTCSignal?: (signal: RTCSignalData) => void;
}

// Session data types
interface SessionStartData {
  sessionId: string;
  therapistId: string;
  startTime: number;
  sessionConfig: Record<string, unknown>;
}

interface SessionEndData {
  sessionId: string;
  endTime: number;
  duration: number;
  summary: Record<string, unknown>;
}

interface AIResponseData {
  messageId: string;
  text: string;
  emotion?: string;
  timestamp: number;
  suggestions?: string[];
}

interface EmotionData {
  timestamp: number;
  dominantEmotion: string;
  emotionScores: Record<string, number>;
  engagementScore: number;
  stressLevel: number;
}

interface RTCSignalData {
  type: 'offer' | 'answer' | 'ice_candidate';
  payload: unknown;
  from: string;
}

// Connection state
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  CLOSED = 'closed',
}

export class SessionWebSocketClient {
  private ws: WebSocket | null = null;
  private config: SessionConfig;
  private callbacks: WebSocketEventCallbacks;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private connectionTimeout: number | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private sessionId: string;
  private userId: string;

  constructor(config: SessionConfig, callbacks: WebSocketEventCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.sessionId = config.sessionId;
    this.userId = config.userId;

    console.log('[WebSocket] Client initialized');
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.connectionState === ConnectionState.CONNECTED ||
        this.connectionState === ConnectionState.CONNECTING) {
      console.warn('[WebSocket] Already connected or connecting');
      return;
    }

    this.updateConnectionState(ConnectionState.CONNECTING);

    try {
      // Build connection URL with query params
      const url = new URL(this.config.websocketUrl);
      url.searchParams.append('sessionId', this.sessionId);
      url.searchParams.append('userId', this.userId);

      console.log(`[WebSocket] Connecting to ${url.toString()}`);

      this.ws = new WebSocket(url.toString());

      // Setup connection timeout
      this.connectionTimeout = window.setTimeout(() => {
        if (this.connectionState !== ConnectionState.CONNECTED) {
          this.handleError('Connection timeout', SessionErrorCode.WEBSOCKET_CONNECTION_FAILED);
          this.ws?.close();
        }
      }, CONNECTION_TIMEOUT);

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      this.handleError('Failed to create WebSocket connection', SessionErrorCode.WEBSOCKET_CONNECTION_FAILED, error);
      this.scheduleReconnect();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[WebSocket] Connection established');
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.updateConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;

      // Start ping interval
      this.startPingInterval();

      // Send any queued messages
      this.flushMessageQueue();

      // Send connect message
      this.send({
        type: SessionMessageType.CONNECT,
        payload: {
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        sessionId: this.sessionId,
      });

      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = (event) => {
      console.log(`[WebSocket] Connection closed: ${event.code} - ${event.reason}`);
      
      this.stopPingInterval();
      this.callbacks.onDisconnect?.(event.code, event.reason);

      if (this.connectionState !== ConnectionState.CLOSED) {
        this.updateConnectionState(ConnectionState.DISCONNECTED);
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.handleError('WebSocket error', SessionErrorCode.WEBSOCKET_CONNECTION_FAILED, error);
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log(`[WebSocket] Received message: ${message.type}`);

      // Validate message
      if (!message.type || !message.sessionId) {
        console.warn('[WebSocket] Invalid message format');
        return;
      }

      // Handle specific message types
      switch (message.type) {
        case SessionMessageType.PONG:
          // Pong received, connection is alive
          break;

        case SessionMessageType.SESSION_START:
          this.callbacks.onSessionStart?.(message.payload as SessionStartData);
          break;

        case SessionMessageType.SESSION_END:
          this.callbacks.onSessionEnd?.(message.payload as SessionEndData);
          break;

        case SessionMessageType.AI_MESSAGE:
          this.callbacks.onAIResponse?.(message.payload as AIResponseData);
          break;

        case SessionMessageType.EMOTION_DATA:
          this.callbacks.onEmotionUpdate?.(message.payload as EmotionData);
          break;

        case SessionMessageType.TYPING_INDICATOR:
          this.callbacks.onTypingIndicator?.(message.payload as boolean);
          break;

        case SessionMessageType.OFFER:
        case SessionMessageType.ANSWER:
        case SessionMessageType.ICE_CANDIDATE:
          this.callbacks.onRTCSignal?.({
            type: message.type.toLowerCase() as 'offer' | 'answer' | 'ice_candidate',
            payload: message.payload,
            from: 'server',
          });
          break;

        case SessionMessageType.ERROR:
          console.error('[WebSocket] Server error:', message.payload);
          this.handleError(
            (message.payload as { message: string }).message || 'Server error',
            SessionErrorCode.UNKNOWN_ERROR,
            message.payload
          );
          break;

        default:
          // Pass to general message handler
          this.callbacks.onMessage?.(message);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Send message to server
   */
  public send(message: WebSocketMessage): boolean {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.ws) {
      console.warn('[WebSocket] Not connected, queueing message');
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Send user message
   */
  public sendUserMessage(text: string, metadata?: Record<string, unknown>): void {
    this.send({
      type: SessionMessageType.USER_MESSAGE,
      payload: {
        text,
        metadata,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send emotion data
   */
  public sendEmotionData(emotionAnalysis: EmotionAnalysis): void {
    this.send({
      type: SessionMessageType.EMOTION_DATA,
      payload: {
        timestamp: emotionAnalysis.timestamp,
        dominantEmotion: emotionAnalysis.dominantEmotion,
        emotionScores: emotionAnalysis.emotionScores,
        engagementScore: emotionAnalysis.engagementScore,
        stressLevel: emotionAnalysis.stressLevel,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send RTC signaling message
   */
  public sendRTCSignal(type: 'offer' | 'answer' | 'ice_candidate', payload: unknown): void {
    const messageType = type === 'offer' 
      ? SessionMessageType.OFFER 
      : type === 'answer' 
        ? SessionMessageType.ANSWER 
        : SessionMessageType.ICE_CANDIDATE;

    this.send({
      type: messageType,
      payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send media state change
   */
  public sendMediaStateChange(isAudioEnabled: boolean, isVideoEnabled: boolean): void {
    this.send({
      type: SessionMessageType.MEDIA_STATE_CHANGE,
      payload: {
        isAudioEnabled,
        isVideoEnabled,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send screen share state
   */
  public sendScreenShareState(isSharing: boolean): void {
    this.send({
      type: isSharing ? SessionMessageType.SCREEN_SHARE_START : SessionMessageType.SCREEN_SHARE_STOP,
      payload: {
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send avatar speak command
   */
  public sendAvatarSpeak(text: string, emotion?: string): void {
    this.send({
      type: SessionMessageType.AVATAR_SPEAK,
      payload: {
        text,
        emotion,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send avatar stop command
   */
  public sendAvatarStop(): void {
    this.send({
      type: SessionMessageType.AVATAR_STOP,
      payload: {
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Start session
   */
  public startSession(): void {
    this.send({
      type: SessionMessageType.SESSION_START,
      payload: {
        sessionId: this.sessionId,
        userId: this.userId,
        startTime: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * End session
   */
  public endSession(): void {
    this.send({
      type: SessionMessageType.SESSION_END,
      payload: {
        sessionId: this.sessionId,
        endTime: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Pause session
   */
  public pauseSession(): void {
    this.send({
      type: SessionMessageType.SESSION_PAUSE,
      payload: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Resume session
   */
  public resumeSession(): void {
    this.send({
      type: SessionMessageType.SESSION_RESUME,
      payload: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Start ping interval
   */
  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      this.send({
        type: SessionMessageType.PING,
        payload: { timestamp: Date.now() },
        timestamp: Date.now(),
        sessionId: this.sessionId,
      });
    }, PING_INTERVAL);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.handleError(
        'Failed to reconnect after maximum attempts',
        SessionErrorCode.WEBSOCKET_CONNECTION_FAILED
      );
      return;
    }

    this.reconnectAttempts++;
    this.updateConnectionState(ConnectionState.RECONNECTING);

    console.log(`[WebSocket] Reconnecting in ${RECONNECT_INTERVAL}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  /**
   * Cancel reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Update connection state
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    console.log(`[WebSocket] Connection state: ${state}`);
  }

  /**
   * Handle errors
   */
  private handleError(
    message: string,
    code: SessionErrorCode = SessionErrorCode.UNKNOWN_ERROR,
    details?: unknown
  ): void {
    console.error('[WebSocket]', message, details);

    const sessionError: SessionError = {
      code,
      message,
      details,
      timestamp: Date.now(),
    };

    this.callbacks.onError?.(sessionError);
  }

  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    console.log('[WebSocket] Disconnecting...');

    this.cancelReconnect();
    this.stopPingInterval();
    this.updateConnectionState(ConnectionState.CLOSED);

    if (this.ws) {
      // Send disconnect message
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: SessionMessageType.DISCONNECT,
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          sessionId: this.sessionId,
        });
      }

      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    console.log('[WebSocket] Disconnected');
  }

  /**
   * Check if WebSocket is supported
   */
  public static isSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }
}

export default SessionWebSocketClient;
