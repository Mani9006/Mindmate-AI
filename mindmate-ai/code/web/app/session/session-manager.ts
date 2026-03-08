/**
 * MindMate AI - Session Manager
 * Main session orchestrator that coordinates WebRTC, Media, Emotion Capture, Avatar, and WebSocket
 */

import {
  SessionConfig,
  SessionMessageType,
  TherapyRoomState,
  RoomLayout,
  ChatMessage,
  EmotionAnalysis,
  SessionError,
  MediaStreamState,
  RTCConnectionState,
  AvatarState,
} from './types';

import { WebRTCService } from './webrtc-service';
import { MediaService } from './media-service';
import { EmotionCaptureService, EmotionSummary } from './emotion-capture';
import { AvatarService } from './avatar-service';
import { SessionWebSocketClient } from './websocket-client';

// Session state
export interface SessionState {
  isInitialized: boolean;
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  duration: number;
  error: SessionError | null;
}

// Event callbacks for UI
interface SessionManagerCallbacks {
  onStateChange?: (state: SessionState) => void;
  onRoomStateChange?: (state: TherapyRoomState) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onEmotionUpdate?: (analysis: EmotionAnalysis) => void;
  onEmotionSummary?: (summary: EmotionSummary) => void;
  onError?: (error: SessionError) => void;
  onMediaStateChange?: (state: MediaStreamState) => void;
  onRTCStateChange?: (state: RTCConnectionState) => void;
  onAvatarStateChange?: (state: AvatarState) => void;
}

export class SessionManager {
  private config: SessionConfig;
  private callbacks: SessionManagerCallbacks;
  
  // Services
  private webRTC: WebRTCService | null = null;
  private media: MediaService | null = null;
  private emotionCapture: EmotionCaptureService | null = null;
  private avatar: AvatarService | null = null;
  private webSocket: SessionWebSocketClient | null = null;
  
  // State
  private sessionState: SessionState;
  private roomState: TherapyRoomState;
  private chatHistory: ChatMessage[] = [];
  private userVideoElement: HTMLVideoElement | null = null;
  private durationInterval: number | null = null;

  constructor(config: SessionConfig, callbacks: SessionManagerCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    
    this.sessionState = {
      isInitialized: false,
      isActive: false,
      isPaused: false,
      startTime: null,
      duration: 0,
      error: null,
    };
    
    this.roomState = {
      isFullscreen: false,
      layout: RoomLayout.SPLIT,
      showChat: true,
      showEmotions: true,
      showControls: true,
      isLoading: false,
      error: null,
    };

    console.log('[SessionManager] Initialized');
  }

  /**
   * Initialize the session
   */
  public async initialize(userVideoElement: HTMLVideoElement): Promise<boolean> {
    try {
      console.log('[SessionManager] Initializing session...');
      this.updateRoomState({ isLoading: true });
      this.userVideoElement = userVideoElement;

      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Browser does not support required features');
      }

      // Initialize WebSocket
      await this.initializeWebSocket();

      // Initialize Media
      await this.initializeMedia();

      // Initialize WebRTC
      this.initializeWebRTC();

      // Initialize Emotion Capture
      this.initializeEmotionCapture();

      // Initialize Avatar (if HeyGen config provided)
      if (this.config.heygenConfig) {
        await this.initializeAvatar();
      }

      this.updateSessionState({ isInitialized: true });
      this.updateRoomState({ isLoading: false });

      console.log('[SessionManager] Session initialized successfully');
      return true;
    } catch (error) {
      this.handleError('Failed to initialize session', error);
      this.updateRoomState({ isLoading: false });
      return false;
    }
  }

  /**
   * Check browser support
   */
  private checkBrowserSupport(): boolean {
    const isSupported = 
      WebRTCService.isSupported() &&
      MediaService.isSupported() &&
      SessionWebSocketClient.isSupported();

    if (!isSupported) {
      console.error('[SessionManager] Browser not supported');
    }

    return isSupported;
  }

  /**
   * Initialize WebSocket client
   */
  private async initializeWebSocket(): Promise<void> {
    this.webSocket = new SessionWebSocketClient(this.config, {
      onConnect: () => {
        console.log('[SessionManager] WebSocket connected');
      },
      onDisconnect: (code, reason) => {
        console.log('[SessionManager] WebSocket disconnected:', code, reason);
        if (this.sessionState.isActive) {
          this.updateSessionState({ isActive: false });
        }
      },
      onMessage: (message) => {
        this.handleWebSocketMessage(message);
      },
      onAIResponse: (response) => {
        this.handleAIResponse(response);
      },
      onEmotionUpdate: (emotionData) => {
        // Handle server-side emotion updates
      },
      onRTCSignal: (signal) => {
        this.handleRTCSignal(signal);
      },
      onSessionStart: (data) => {
        console.log('[SessionManager] Session started:', data.sessionId);
      },
      onSessionEnd: (data) => {
        console.log('[SessionManager] Session ended:', data.sessionId);
        this.stop();
      },
      onError: (error) => {
        this.handleError('WebSocket error', error);
      },
    });

    this.webSocket.connect();
  }

  /**
   * Initialize Media service
   */
  private async initializeMedia(): Promise<void> {
    this.media = new MediaService({
      onStreamReady: (stream) => {
        if (this.userVideoElement) {
          this.userVideoElement.srcObject = stream;
        }
        this.webRTC?.addLocalStream(stream);
        this.callbacks.onMediaStateChange?.(this.media!.getMediaState());
      },
      onStreamEnded: () => {
        console.log('[SessionManager] Media stream ended');
      },
      onAudioLevelChange: (level) => {
        // Handle audio level changes
      },
      onError: (error) => {
        this.handleError('Media error', error);
      },
    });

    // Request media access
    await this.media.requestMediaAccess({
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: 'user',
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  }

  /**
   * Initialize WebRTC service
   */
  private initializeWebRTC(): void {
    this.webRTC = new WebRTCService(this.config.rtcConfig, {
      onLocalStream: (stream) => {
        // Local stream already set in media service
      },
      onRemoteStream: (stream) => {
        // Handle remote stream (if any)
      },
      onConnectionStateChange: (state) => {
        this.callbacks.onRTCStateChange?.(state);
      },
      onIceCandidate: (candidate) => {
        this.webSocket?.sendRTCSignal('ice_candidate', candidate);
      },
      onError: (error) => {
        this.handleError('WebRTC error', error);
      },
    });

    this.webRTC.initialize(true); // As initiator
  }

  /**
   * Initialize Emotion Capture service
   */
  private initializeEmotionCapture(): void {
    this.emotionCapture = new EmotionCaptureService(
      {
        humeApiKey: this.config.humeApiKey,
        frameInterval: 2000, // 2 seconds
        enableContinuousAnalysis: true,
      },
      {
        onFrameCaptured: (frame) => {
          // Frame captured
        },
        onEmotionAnalyzed: (analysis) => {
          this.callbacks.onEmotionUpdate?.(analysis);
          this.webSocket?.sendEmotionData(analysis);
        },
        onEmotionSummary: (summary) => {
          this.callbacks.onEmotionSummary?.(summary);
        },
        onError: (error) => {
          this.handleError('Emotion capture error', error);
        },
      }
    );

    if (this.userVideoElement) {
      this.emotionCapture.setVideoElement(this.userVideoElement);
    }
  }

  /**
   * Initialize Avatar service
   */
  private async initializeAvatar(): Promise<void> {
    if (!this.config.heygenConfig) return;

    this.avatar = new AvatarService(
      {
        ...this.config.heygenConfig,
        containerId: 'avatar-container',
      },
      {
        onReady: () => {
          console.log('[SessionManager] Avatar ready');
          this.callbacks.onAvatarStateChange?.(this.avatar!.getState());
        },
        onSpeakingStart: () => {
          this.callbacks.onAvatarStateChange?.(this.avatar!.getState());
        },
        onSpeakingEnd: () => {
          this.callbacks.onAvatarStateChange?.(this.avatar!.getState());
        },
        onAvatarLoaded: () => {
          console.log('[SessionManager] Avatar loaded');
        },
        onStreamReady: (stream) => {
          // Avatar stream ready
        },
        onError: (error) => {
          this.handleError('Avatar error', error);
        },
      }
    );

    await this.avatar.initialize();
  }

  /**
   * Start the therapy session
   */
  public async start(): Promise<boolean> {
    if (!this.sessionState.isInitialized) {
      console.error('[SessionManager] Session not initialized');
      return false;
    }

    if (this.sessionState.isActive) {
      console.warn('[SessionManager] Session already active');
      return true;
    }

    try {
      console.log('[SessionManager] Starting session...');

      // Start emotion capture
      this.emotionCapture?.start();

      // Notify server
      this.webSocket?.startSession();

      // Update state
      this.updateSessionState({
        isActive: true,
        startTime: Date.now(),
      });

      // Start duration timer
      this.startDurationTimer();

      // Welcome message
      this.addChatMessage({
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: "Hello! I'm here to support you today. How are you feeling?",
        timestamp: Date.now(),
      });

      // Speak welcome message if avatar available
      this.avatar?.speak(
        "Hello! I'm here to support you today. How are you feeling?",
        'empathetic'
      );

      console.log('[SessionManager] Session started');
      return true;
    } catch (error) {
      this.handleError('Failed to start session', error);
      return false;
    }
  }

  /**
   * Stop the therapy session
   */
  public stop(): void {
    if (!this.sessionState.isActive) return;

    console.log('[SessionManager] Stopping session...');

    // Stop duration timer
    this.stopDurationTimer();

    // Stop emotion capture
    this.emotionCapture?.stop();

    // Stop avatar
    this.avatar?.stopSpeaking();

    // Notify server
    this.webSocket?.endSession();

    // Update state
    this.updateSessionState({
      isActive: false,
      isPaused: false,
    });

    console.log('[SessionManager] Session stopped');
  }

  /**
   * Pause the session
   */
  public pause(): void {
    if (!this.sessionState.isActive || this.sessionState.isPaused) return;

    this.emotionCapture?.stop();
    this.avatar?.pause();
    this.webSocket?.pauseSession();

    this.updateSessionState({ isPaused: true });
    this.stopDurationTimer();

    console.log('[SessionManager] Session paused');
  }

  /**
   * Resume the session
   */
  public resume(): void {
    if (!this.sessionState.isActive || !this.sessionState.isPaused) return;

    this.emotionCapture?.start();
    this.avatar?.resume();
    this.webSocket?.resumeSession();

    this.updateSessionState({ isPaused: false });
    this.startDurationTimer();

    console.log('[SessionManager] Session resumed');
  }

  /**
   * Send user message
   */
  public sendMessage(text: string): void {
    if (!this.sessionState.isActive) {
      console.warn('[SessionManager] Cannot send message - session not active');
      return;
    }

    // Add to chat
    this.addChatMessage({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    });

    // Send to server
    this.webSocket?.sendUserMessage(text);

    // Show typing indicator
    this.webSocket?.send({
      type: SessionMessageType.TYPING_INDICATOR,
      payload: true,
      timestamp: Date.now(),
      sessionId: this.config.sessionId,
    });
  }

  /**
   * Handle AI response
   */
  private handleAIResponse(response: { messageId: string; text: string; emotion?: string }): void {
    // Add to chat
    this.addChatMessage({
      id: response.messageId,
      sender: 'ai',
      text: response.text,
      timestamp: Date.now(),
      emotion: response.emotion,
    });

    // Make avatar speak
    this.avatar?.speak(response.text, response.emotion);
  }

  /**
   * Add chat message
   */
  private addChatMessage(message: ChatMessage): void {
    this.chatHistory.push(message);
    this.callbacks.onChatMessage?.(message);
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: { type: SessionMessageType; payload: unknown }): void {
    // Handle additional message types if needed
  }

  /**
   * Handle RTC signals
   */
  private handleRTCSignal(signal: { type: string; payload: unknown }): void {
    switch (signal.type) {
      case 'offer':
        this.webRTC?.handleOffer(signal.payload as RTCSessionDescriptionInit);
        break;
      case 'answer':
        this.webRTC?.handleAnswer(signal.payload as RTCSessionDescriptionInit);
        break;
      case 'ice_candidate':
        this.webRTC?.handleIceCandidate(signal.payload as RTCIceCandidateInit);
        break;
    }
  }

  /**
   * Toggle audio
   */
  public toggleAudio(): boolean {
    const result = this.media?.toggleAudio() ?? false;
    this.webSocket?.sendMediaStateChange(
      this.media?.isAudioEnabled() ?? false,
      this.media?.isVideoEnabled() ?? false
    );
    this.callbacks.onMediaStateChange?.(this.media!.getMediaState());
    return result;
  }

  /**
   * Toggle video
   */
  public toggleVideo(): boolean {
    const result = this.media?.toggleVideo() ?? false;
    this.webSocket?.sendMediaStateChange(
      this.media?.isAudioEnabled() ?? false,
      this.media?.isVideoEnabled() ?? false
    );
    this.callbacks.onMediaStateChange?.(this.media!.getMediaState());
    return result;
  }

  /**
   * Toggle screen share
   */
  public async toggleScreenShare(): Promise<boolean> {
    if (this.media?.getScreenStream()) {
      this.media.stopScreenShare();
      this.webSocket?.sendScreenShareState(false);
      return false;
    } else {
      const stream = await this.media?.requestScreenShare();
      if (stream) {
        this.webSocket?.sendScreenShareState(true);
        return true;
      }
      return false;
    }
  }

  /**
   * Toggle fullscreen
   */
  public toggleFullscreen(): void {
    const newState = !this.roomState.isFullscreen;
    this.updateRoomState({ isFullscreen: newState });

    if (newState) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.error('[SessionManager] Failed to enter fullscreen:', err);
        this.updateRoomState({ isFullscreen: false });
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.error('[SessionManager] Failed to exit fullscreen:', err);
      });
    }
  }

  /**
   * Set room layout
   */
  public setLayout(layout: RoomLayout): void {
    this.updateRoomState({ layout });
  }

  /**
   * Toggle chat visibility
   */
  public toggleChat(): void {
    this.updateRoomState({ showChat: !this.roomState.showChat });
  }

  /**
   * Toggle emotions panel
   */
  public toggleEmotions(): void {
    this.updateRoomState({ showEmotions: !this.roomState.showEmotions });
  }

  /**
   * Toggle controls visibility
   */
  public toggleControls(): void {
    this.updateRoomState({ showControls: !this.roomState.showControls });
  }

  /**
   * Start duration timer
   */
  private startDurationTimer(): void {
    this.durationInterval = window.setInterval(() => {
      if (this.sessionState.startTime) {
        const duration = Date.now() - this.sessionState.startTime;
        this.updateSessionState({ duration });
      }
    }, 1000);
  }

  /**
   * Stop duration timer
   */
  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
  }

  /**
   * Update session state
   */
  private updateSessionState(newState: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...newState };
    this.callbacks.onStateChange?.(this.sessionState);
  }

  /**
   * Update room state
   */
  private updateRoomState(newState: Partial<TherapyRoomState>): void {
    this.roomState = { ...this.roomState, ...newState };
    this.callbacks.onRoomStateChange?.(this.roomState);
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error?: unknown): void {
    console.error('[SessionManager]', message, error);

    const sessionError: SessionError = {
      code: 'SESSION_ERROR',
      message,
      details: error,
      timestamp: Date.now(),
    };

    this.updateSessionState({ error: sessionError });
    this.callbacks.onError?.(sessionError);
  }

  /**
   * Get session state
   */
  public getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  /**
   * Get room state
   */
  public getRoomState(): TherapyRoomState {
    return { ...this.roomState };
  }

  /**
   * Get chat history
   */
  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Get emotion summary
   */
  public getEmotionSummary(): EmotionSummary | null {
    return this.emotionCapture?.generateSummary() || null;
  }

  /**
   * Get therapy insights
   */
  public getTherapyInsights(): ReturnType<EmotionCaptureService['getTherapyInsights']> | null {
    return this.emotionCapture?.getTherapyInsights() || null;
  }

  /**
   * Cleanup and dispose
   */
  public dispose(): void {
    console.log('[SessionManager] Disposing...');

    this.stop();
    this.webSocket?.disconnect();
    this.media?.stop();
    this.webRTC?.close();
    this.avatar?.close();
    this.emotionCapture?.dispose();

    this.updateSessionState({ isInitialized: false });
    console.log('[SessionManager] Disposed');
  }
}

export default SessionManager;
