/**
 * MindMate AI - Avatar Service
 * HeyGen browser SDK integration for AI avatar in therapy sessions
 */

import { HeyGenConfig, AvatarState, AvatarMessage, SessionError, SessionErrorCode } from './types';

// HeyGen API configuration
const HEYGEN_API_BASE_URL = 'https://api.heygen.com';
const HEYGEN_STREAMING_URL = 'wss://streaming.heygen.com';

// HeyGen Streaming Avatar SDK types
declare global {
  interface Window {
    HeyGenStreamingAvatar?: new (config: { token: string }) => HeyGenStreamingAvatar;
  }
}

interface HeyGenStreamingAvatar {
  init(config: { avatarId: string; voiceId: string }): Promise<void>;
  speak(text: string): Promise<void>;
  stop(): void;
  close(): void;
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;
}

// Event callbacks
interface AvatarEventCallbacks {
  onReady?: () => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onError?: (error: SessionError) => void;
  onAvatarLoaded?: () => void;
  onStreamReady?: (stream: MediaStream) => void;
}

// Avatar configuration
export interface AvatarServiceConfig extends HeyGenConfig {
  containerId?: string;
  width?: number;
  height?: number;
  autoStart?: boolean;
}

export class AvatarService {
  private config: Required<AvatarServiceConfig>;
  private callbacks: AvatarEventCallbacks;
  private state: AvatarState;
  private avatar: HeyGenStreamingAvatar | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  private messageQueue: AvatarMessage[] = [];
  private isProcessingQueue: boolean = false;
  private sessionToken: string | null = null;
  private stream: MediaStream | null = null;

  constructor(
    config: AvatarServiceConfig,
    callbacks: AvatarEventCallbacks = {}
  ) {
    this.config = {
      apiKey: config.apiKey,
      avatarId: config.avatarId,
      voiceId: config.voiceId,
      language: config.language || 'en',
      containerId: config.containerId || 'avatar-container',
      width: config.width || 1280,
      height: config.height || 720,
      autoStart: config.autoStart ?? false,
    };
    this.callbacks = callbacks;
    this.state = {
      isReady: false,
      isSpeaking: false,
      currentText: '',
      error: null,
    };

    console.log('[Avatar] Service initialized');
  }

  /**
   * Initialize the avatar
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log('[Avatar] Initializing avatar...');

      // Get session token from HeyGen
      const token = await this.getSessionToken();
      if (!token) {
        throw new Error('Failed to get HeyGen session token');
      }

      this.sessionToken = token;

      // Load HeyGen SDK if not already loaded
      await this.loadHeyGenSDK();

      // Initialize avatar
      await this.initAvatar();

      // Create video element for avatar stream
      this.createVideoElement();

      // Set ready state
      this.updateState({ isReady: true });
      this.callbacks.onReady?.();

      console.log('[Avatar] Avatar initialized successfully');
      return true;
    } catch (error) {
      this.handleError('Failed to initialize avatar', error);
      return false;
    }
  }

  /**
   * Get session token from HeyGen API
   */
  private async getSessionToken(): Promise<string | null> {
    try {
      const response = await fetch(`${HEYGEN_API_BASE_URL}/v1/streaming.create_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status}`);
      }

      const data = await response.json();
      return data.token || null;
    } catch (error) {
      console.error('[Avatar] Failed to get session token:', error);
      return null;
    }
  }

  /**
   * Load HeyGen Streaming Avatar SDK
   */
  private async loadHeyGenSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.HeyGenStreamingAvatar) {
        console.log('[Avatar] HeyGen SDK already loaded');
        resolve();
        return;
      }

      // Load SDK script
      const script = document.createElement('script');
      script.src = 'https://streaming.heygen.com/heygen-streaming-avatar.js';
      script.async = true;

      script.onload = () => {
        console.log('[Avatar] HeyGen SDK loaded');
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load HeyGen SDK'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize the streaming avatar
   */
  private async initAvatar(): Promise<void> {
    if (!window.HeyGenStreamingAvatar || !this.sessionToken) {
      throw new Error('HeyGen SDK or session token not available');
    }

    this.avatar = new window.HeyGenStreamingAvatar({
      token: this.sessionToken,
    });

    // Setup event listeners
    this.setupAvatarListeners();

    // Initialize with avatar and voice
    await this.avatar.init({
      avatarId: this.config.avatarId,
      voiceId: this.config.voiceId,
    });

    console.log('[Avatar] Streaming avatar initialized');
  }

  /**
   * Setup avatar event listeners
   */
  private setupAvatarListeners(): void {
    if (!this.avatar) return;

    this.avatar.on('connected', () => {
      console.log('[Avatar] Connected to streaming server');
    });

    this.avatar.on('disconnected', () => {
      console.log('[Avatar] Disconnected from streaming server');
      this.updateState({ isReady: false });
    });

    this.avatar.on('speaking_start', () => {
      console.log('[Avatar] Speaking started');
      this.updateState({ isSpeaking: true });
      this.callbacks.onSpeakingStart?.();
    });

    this.avatar.on('speaking_end', () => {
      console.log('[Avatar] Speaking ended');
      this.updateState({ isSpeaking: false });
      this.callbacks.onSpeakingEnd?.();
      
      // Process next message in queue
      this.processMessageQueue();
    });

    this.avatar.on('error', (error) => {
      console.error('[Avatar] Avatar error:', error);
      this.handleError('Avatar streaming error', error);
    });

    this.avatar.on('stream_ready', (stream) => {
      console.log('[Avatar] Stream ready');
      this.stream = stream as MediaStream;
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
      }
      this.callbacks.onStreamReady?.(this.stream);
    });
  }

  /**
   * Create video element for avatar
   */
  private createVideoElement(): void {
    this.container = document.getElementById(this.config.containerId);
    
    if (!this.container) {
      console.warn(`[Avatar] Container #${this.config.containerId} not found, creating one`);
      this.container = document.createElement('div');
      this.container.id = this.config.containerId;
      document.body.appendChild(this.container);
    }

    // Clear container
    this.container.innerHTML = '';

    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.id = 'avatar-video';
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = false;
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.style.borderRadius = '12px';

    this.container.appendChild(this.videoElement);

    this.callbacks.onAvatarLoaded?.();
    console.log('[Avatar] Video element created');
  }

  /**
   * Make the avatar speak
   */
  public async speak(text: string, emotion?: string): Promise<void> {
    if (!this.avatar || !this.state.isReady) {
      console.warn('[Avatar] Avatar not ready, queueing message');
      this.messageQueue.push({ text, emotion });
      return;
    }

    // Add to queue if already speaking
    if (this.state.isSpeaking) {
      this.messageQueue.push({ text, emotion });
      return;
    }

    try {
      // Format text with emotion if provided
      const formattedText = this.formatTextWithEmotion(text, emotion);
      
      this.updateState({ currentText: text });
      await this.avatar.speak(formattedText);
      console.log('[Avatar] Speaking:', text.substring(0, 50) + '...');
    } catch (error) {
      this.handleError('Failed to make avatar speak', error);
    }
  }

  /**
   * Speak with pauses for natural delivery
   */
  public async speakWithPauses(messages: AvatarMessage[]): Promise<void> {
    for (const message of messages) {
      await this.speak(message.text, message.emotion);
      
      if (message.pauseDuration && message.pauseDuration > 0) {
        await this.sleep(message.pauseDuration);
      }
    }
  }

  /**
   * Format text with emotion hints for HeyGen
   */
  private formatTextWithEmotion(text: string, emotion?: string): string {
    if (!emotion) return text;

    // HeyGen supports SSML-like emotion tags
    const emotionTags: Record<string, string> = {
      happy: '<emo emotion="happy">',
      sad: '<emo emotion="sad">',
      excited: '<emo emotion="excited">',
      calm: '<emo emotion="calm">',
      concerned: '<emo emotion="concerned">',
      empathetic: '<emo emotion="empathetic">',
      encouraging: '<emo emotion="encouraging">',
    };

    const tag = emotionTags[emotion.toLowerCase()];
    if (tag) {
      return `${tag}${text}</emo>`;
    }

    return text;
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0 && !this.state.isSpeaking) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.speak(message.text, message.emotion);
        // Wait for speaking to complete
        await this.waitForSpeakingEnd();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Wait for speaking to end
   */
  private async waitForSpeakingEnd(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.state.isSpeaking) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Stop speaking
   */
  public stopSpeaking(): void {
    if (this.avatar) {
      this.avatar.stop();
      this.updateState({ isSpeaking: false });
      this.messageQueue = [];
      console.log('[Avatar] Speaking stopped');
    }
  }

  /**
   * Pause avatar
   */
  public pause(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  /**
   * Resume avatar
   */
  public resume(): void {
    if (this.videoElement) {
      this.videoElement.play();
    }
  }

  /**
   * Get avatar state
   */
  public getState(): AvatarState {
    return { ...this.state };
  }

  /**
   * Get video element
   */
  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Get avatar stream
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Update avatar configuration
   */
  public async updateConfig(config: Partial<AvatarServiceConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Reinitialize if avatarId or voiceId changed
    if (config.avatarId || config.voiceId) {
      await this.reinitialize();
    }
  }

  /**
   * Reinitialize avatar
   */
  public async reinitialize(): Promise<void> {
    this.close();
    await this.initialize();
  }

  /**
   * Update state
   */
  private updateState(newState: Partial<AvatarState>): void {
    this.state = { ...this.state, ...newState };
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error?: unknown): void {
    console.error('[Avatar]', message, error);

    const sessionError: SessionError = {
      code: SessionErrorCode.HEYGEN_API_ERROR,
      message,
      details: error,
      timestamp: Date.now(),
    };

    this.updateState({ error: message });
    this.callbacks.onError?.(sessionError);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close and cleanup
   */
  public close(): void {
    console.log('[Avatar] Closing avatar service');

    this.stopSpeaking();

    if (this.avatar) {
      this.avatar.close();
      this.avatar = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.stream = null;
    this.sessionToken = null;
    this.updateState({ isReady: false, isSpeaking: false });
  }

  /**
   * Check if HeyGen is supported
   */
  public static isSupported(): boolean {
    return !!(
      window.WebSocket &&
      window.RTCPeerConnection &&
      document.createElement('video').canPlayType
    );
  }

  /**
   * Get available avatars from HeyGen
   */
  public static async getAvailableAvatars(apiKey: string): Promise<
    { id: string; name: string; thumbnail: string; gender: string }[]
  > {
    try {
      const response = await fetch(`${HEYGEN_API_BASE_URL}/v1/avatar.list`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status}`);
      }

      const data = await response.json();
      return data.avatars || [];
    } catch (error) {
      console.error('[Avatar] Failed to get avatars:', error);
      return [];
    }
  }

  /**
   * Get available voices from HeyGen
   */
  public static async getAvailableVoices(apiKey: string): Promise<
    { id: string; name: string; language: string; gender: string; preview: string }[]
  > {
    try {
      const response = await fetch(`${HEYGEN_API_BASE_URL}/v1/voice.list`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('[Avatar] Failed to get voices:', error);
      return [];
    }
  }
}

export default AvatarService;
