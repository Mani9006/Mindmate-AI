/**
 * HeyGen Stream Service for MindMate AI Video Session
 * Handles AI avatar video streaming from HeyGen API
 */

import { EventEmitter } from 'events';
import { MediaStream } from 'react-native-webrtc';

// HeyGen API configuration
const HEYGEN_CONFIG = {
  apiKey: process.env.HEYGEN_API_KEY || '',
  apiEndpoint: 'https://api.heygen.com/v1',
  websocketEndpoint: 'wss://streaming.heygen.com',
  avatarId: process.env.HEYGEN_AVATAR_ID || 'default_avatar',
  voiceId: process.env.HEYGEN_VOICE_ID || 'default_voice',
};

// Stream states
export type HeyGenStreamState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'paused'
  | 'error'
  | 'disconnected';

// HeyGen session info
export interface HeyGenSession {
  sessionId: string;
  streamUrl: string;
  websocketUrl: string;
  token: string;
  expiresAt: number;
}

// Avatar configuration
export interface AvatarConfig {
  avatarId: string;
  voiceId: string;
  language: string;
  quality: 'low' | 'medium' | 'high';
  backgroundColor?: string;
}

// Stream options
export interface StreamOptions {
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  bufferSize: number;
}

const DEFAULT_OPTIONS: StreamOptions = {
  autoReconnect: true,
  reconnectAttempts: 3,
  reconnectDelay: 2000,
  bufferSize: 3,
};

// Event types for transcript
export interface TranscriptEvent {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
  speaker: 'user' | 'ai';
}

export class HeyGenService extends EventEmitter {
  private session: HeyGenSession | null = null;
  private websocket: WebSocket | null = null;
  private streamState: HeyGenStreamState = 'idle';
  private mediaStream: MediaStream | null = null;
  private options: StreamOptions;
  private reconnectCount: number = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private transcriptHistory: TranscriptEvent[] = [];
  private currentTranscript: string = '';
  private avatarConfig: AvatarConfig;

  constructor(
    avatarConfig: Partial<AvatarConfig> = {},
    options: Partial<StreamOptions> = {}
  ) {
    super();
    
    this.avatarConfig = {
      avatarId: HEYGEN_CONFIG.avatarId,
      voiceId: HEYGEN_CONFIG.voiceId,
      language: 'en',
      quality: 'high',
      ...avatarConfig,
    };
    
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize HeyGen session
   */
  async initializeSession(): Promise<HeyGenSession> {
    try {
      this.setStreamState('connecting');

      const response = await fetch(`${HEYGEN_CONFIG.apiEndpoint}/streaming.create_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': HEYGEN_CONFIG.apiKey,
        },
        body: JSON.stringify({
          avatar_id: this.avatarConfig.avatarId,
          voice_id: this.avatarConfig.voiceId,
          language: this.avatarConfig.language,
          quality: this.avatarConfig.quality,
          background: this.avatarConfig.backgroundColor || 'transparent',
        }),
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.session = {
        sessionId: data.data.session_id,
        streamUrl: data.data.url,
        websocketUrl: data.data.websocket_url,
        token: data.data.token,
        expiresAt: Date.now() + (data.data.expires_in * 1000),
      };

      this.emit('sessionCreated', this.session);
      return this.session;
    } catch (error) {
      this.setStreamState('error');
      console.error('Failed to initialize HeyGen session:', error);
      throw error;
    }
  }

  /**
   * Connect to HeyGen streaming WebSocket
   */
  async connect(): Promise<void> {
    if (!this.session) {
      await this.initializeSession();
    }

    return new Promise((resolve, reject) => {
      if (!this.session) {
        reject(new Error('Session not initialized'));
        return;
      }

      this.websocket = new WebSocket(this.session.websocketUrl);

      this.websocket.onopen = () => {
        console.log('HeyGen WebSocket connected');
        this.setStreamState('connected');
        this.reconnectCount = 0;
        this.startPingInterval();
        this.emit('connected');
        resolve();
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.websocket.onerror = (error) => {
        console.error('HeyGen WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      };

      this.websocket.onclose = () => {
        console.log('HeyGen WebSocket closed');
        this.stopPingInterval();
        this.handleDisconnect();
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'stream_ready':
          this.setStreamState('streaming');
          this.emit('streamReady', message);
          break;

        case 'stream_start':
          this.emit('streamStart', message);
          break;

        case 'stream_end':
          this.emit('streamEnd', message);
          break;

        case 'transcript':
          this.handleTranscript(message);
          break;

        case 'transcript_final':
          this.handleFinalTranscript(message);
          break;

        case 'ping':
          this.sendMessage({ type: 'pong' });
          break;

        case 'error':
          console.error('HeyGen error:', message.error);
          this.emit('streamError', message.error);
          break;

        case 'media':
          // Handle media stream data
          this.emit('mediaData', message);
          break;

        default:
          console.log('Unknown HeyGen message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse HeyGen message:', error);
    }
  }

  /**
   * Handle partial transcript
   */
  private handleTranscript(message: any): void {
    this.currentTranscript = message.text;
    
    const transcriptEvent: TranscriptEvent = {
      id: message.id || `transcript_${Date.now()}`,
      text: message.text,
      isFinal: false,
      timestamp: Date.now(),
      speaker: message.speaker || 'ai',
    };

    this.emit('transcript', transcriptEvent);
  }

  /**
   * Handle final transcript
   */
  private handleFinalTranscript(message: any): void {
    const transcriptEvent: TranscriptEvent = {
      id: message.id || `transcript_${Date.now()}`,
      text: message.text,
      isFinal: true,
      timestamp: Date.now(),
      speaker: message.speaker || 'ai',
    };

    this.transcriptHistory.push(transcriptEvent);
    this.currentTranscript = '';

    this.emit('transcriptFinal', transcriptEvent);
  }

  /**
   * Send text for AI avatar to speak
   */
  speak(text: string, options: {
    emotion?: string;
    speed?: number;
    pause?: number;
  } = {}): void {
    this.sendMessage({
      type: 'speak',
      text,
      emotion: options.emotion || 'neutral',
      speed: options.speed || 1.0,
      pause: options.pause || 0,
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    this.sendMessage({
      type: 'stop_speaking',
    });
  }

  /**
   * Pause the stream
   */
  pause(): void {
    this.sendMessage({ type: 'pause' });
    this.setStreamState('paused');
  }

  /**
   * Resume the stream
   */
  resume(): void {
    this.sendMessage({ type: 'resume' });
    this.setStreamState('streaming');
  }

  /**
   * Send message through WebSocket
   */
  private sendMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: 'ping' });
    }, 30000); // 30 seconds
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
   * Handle disconnection and attempt reconnection
   */
  private handleDisconnect(): void {
    this.setStreamState('disconnected');
    this.emit('disconnected');

    if (this.options.autoReconnect && 
        this.reconnectCount < this.options.reconnectAttempts) {
      this.reconnectCount++;
      console.log(`Attempting to reconnect (${this.reconnectCount}/${this.options.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.options.reconnectDelay);
    }
  }

  /**
   * Set stream state and emit event
   */
  private setStreamState(state: HeyGenStreamState): void {
    this.streamState = state;
    this.emit('stateChange', state);
  }

  /**
   * Get current stream state
   */
  getStreamState(): HeyGenStreamState {
    return this.streamState;
  }

  /**
   * Get current session
   */
  getSession(): HeyGenSession | null {
    return this.session;
  }

  /**
   * Get media stream URL for video player
   */
  getStreamUrl(): string | null {
    return this.session?.streamUrl || null;
  }

  /**
   * Get transcript history
   */
  getTranscriptHistory(): TranscriptEvent[] {
    return [...this.transcriptHistory];
  }

  /**
   * Get current (non-final) transcript
   */
  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Clear transcript history
   */
  clearTranscriptHistory(): void {
    this.transcriptHistory = [];
    this.currentTranscript = '';
  }

  /**
   * Check if stream is ready
   */
  isReady(): boolean {
    return this.streamState === 'streaming' || this.streamState === 'connected';
  }

  /**
   * Check if stream is active
   */
  isStreaming(): boolean {
    return this.streamState === 'streaming';
  }

  /**
   * Update avatar configuration
   */
  updateAvatarConfig(config: Partial<AvatarConfig>): void {
    this.avatarConfig = { ...this.avatarConfig, ...config };
  }

  /**
   * Get avatar configuration
   */
  getAvatarConfig(): AvatarConfig {
    return { ...this.avatarConfig };
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.stopPingInterval();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.session = null;
    this.mediaStream = null;
    this.setStreamState('idle');
    this.emit('disconnected');
  }

  /**
   * Destroy service and cleanup all resources
   */
  destroy(): void {
    this.disconnect();
    this.clearTranscriptHistory();
    this.removeAllListeners();
  }
}

// Export singleton instance factory
export const createHeyGenService = (
  avatarConfig?: Partial<AvatarConfig>,
  options?: Partial<StreamOptions>
) => new HeyGenService(avatarConfig, options);

export default HeyGenService;
