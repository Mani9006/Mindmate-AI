/**
 * MindMate AI - Media Service
 * Browser getUserMedia integration for camera and microphone access
 */

import { SessionError, SessionErrorCode } from './types';

// Media constraints types
export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface DisplayMediaConstraints {
  video: DisplayCaptureSurfaceOptions | boolean;
  audio: boolean;
}

// Device info
export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

// Media state
export interface MediaState {
  stream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  audioLevel: number;
  videoResolution: { width: number; height: number } | null;
}

// Event callbacks
interface MediaEventCallbacks {
  onStreamReady?: (stream: MediaStream) => void;
  onStreamEnded?: () => void;
  onAudioLevelChange?: (level: number) => void;
  onError?: (error: SessionError) => void;
}

// Default constraints
const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
  frameRate: { ideal: 30, min: 15 },
  facingMode: 'user',
};

const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

export class MediaService {
  private stream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private callbacks: MediaEventCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: number | null = null;
  private isMonitoringAudio: boolean = false;

  constructor(callbacks: MediaEventCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Request camera and microphone access
   */
  public async requestMediaAccess(
    constraints: Partial<MediaConstraints> = {}
  ): Promise<MediaStream | null> {
    const mergedConstraints: MediaConstraints = {
      video: constraints.video ?? DEFAULT_VIDEO_CONSTRAINTS,
      audio: constraints.audio ?? DEFAULT_AUDIO_CONSTRAINTS,
    };

    try {
      console.log('[Media] Requesting user media access');
      
      this.stream = await navigator.mediaDevices.getUserMedia(mergedConstraints);
      
      console.log('[Media] Media access granted');
      
      // Setup track ended listeners
      this.setupTrackListeners();
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring();
      
      this.callbacks.onStreamReady?.(this.stream);
      
      return this.stream;
    } catch (error) {
      this.handleMediaError(error);
      return null;
    }
  }

  /**
   * Request screen sharing access
   */
  public async requestScreenShare(
    constraints: Partial<DisplayMediaConstraints> = {}
  ): Promise<MediaStream | null> {
    const mergedConstraints: DisplayMediaConstraints = {
      video: constraints.video ?? { displaySurface: 'monitor' },
      audio: constraints.audio ?? false,
    };

    try {
      console.log('[Media] Requesting screen share access');
      
      this.screenStream = await navigator.mediaDevices.getDisplayMedia(
        mergedConstraints as DisplayMediaStreamOptions
      );
      
      console.log('[Media] Screen share access granted');
      
      // Listen for screen share end
      this.screenStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        console.log('[Media] Screen share ended by user');
        this.screenStream = null;
      });
      
      return this.screenStream;
    } catch (error) {
      this.handleMediaError(error);
      return null;
    }
  }

  /**
   * Stop screen sharing
   */
  public stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
      console.log('[Media] Screen share stopped');
    }
  }

  /**
   * Setup track ended listeners
   */
  private setupTrackListeners(): void {
    if (!this.stream) return;

    this.stream.getTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        console.log(`[Media] Track ended: ${track.kind}`);
        
        // Check if all tracks have ended
        if (this.stream?.getTracks().every((t) => t.readyState === 'ended')) {
          this.callbacks.onStreamEnded?.();
        }
      });

      track.addEventListener('mute', () => {
        console.log(`[Media] Track muted: ${track.kind}`);
      });

      track.addEventListener('unmute', () => {
        console.log(`[Media] Track unmuted: ${track.kind}`);
      });
    });
  }

  /**
   * Start audio level monitoring
   */
  private startAudioLevelMonitoring(): void {
    if (!this.stream || this.isMonitoringAudio) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyser);
      
      this.isMonitoringAudio = true;
      
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      const monitorAudio = () => {
        if (!this.analyser || !this.isMonitoringAudio) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255; // Normalize to 0-1
        
        this.callbacks.onAudioLevelChange?.(normalizedLevel);
        
        this.audioLevelInterval = window.setTimeout(monitorAudio, 100);
      };
      
      monitorAudio();
      console.log('[Media] Audio level monitoring started');
    } catch (error) {
      console.warn('[Media] Failed to start audio monitoring:', error);
    }
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioLevelMonitoring(): void {
    this.isMonitoringAudio = false;
    
    if (this.audioLevelInterval) {
      clearTimeout(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    console.log('[Media] Audio level monitoring stopped');
  }

  /**
   * Toggle audio mute/unmute
   */
  public toggleAudio(): boolean {
    if (!this.stream) return false;

    const audioTracks = this.stream.getAudioTracks();
    
    if (audioTracks.length === 0) return false;

    const newState = !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = newState;
    });

    console.log(`[Media] Audio ${newState ? 'unmuted' : 'muted'}`);
    return newState;
  }

  /**
   * Toggle video on/off
   */
  public toggleVideo(): boolean {
    if (!this.stream) return false;

    const videoTracks = this.stream.getVideoTracks();
    
    if (videoTracks.length === 0) return false;

    const newState = !videoTracks[0].enabled;
    videoTracks.forEach((track) => {
      track.enabled = newState;
    });

    console.log(`[Media] Video ${newState ? 'enabled' : 'disabled'}`);
    return newState;
  }

  /**
   * Check if audio is enabled
   */
  public isAudioEnabled(): boolean {
    if (!this.stream) return false;
    return this.stream.getAudioTracks().some((track) => track.enabled);
  }

  /**
   * Check if video is enabled
   */
  public isVideoEnabled(): boolean {
    if (!this.stream) return false;
    return this.stream.getVideoTracks().some((track) => track.enabled);
  }

  /**
   * Get current stream
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get screen share stream
   */
  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  /**
   * Get current media state
   */
  public getMediaState(): MediaState {
    const videoTrack = this.stream?.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();

    return {
      stream: this.stream,
      isAudioEnabled: this.isAudioEnabled(),
      isVideoEnabled: this.isVideoEnabled(),
      audioLevel: 0,
      videoResolution: settings
        ? { width: settings.width ?? 0, height: settings.height ?? 0 }
        : null,
    };
  }

  /**
   * Switch camera
   */
  public async switchCamera(deviceId: string): Promise<MediaStream | null> {
    if (!this.stream) return null;

    // Stop current video tracks
    this.stream.getVideoTracks().forEach((track) => track.stop());

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false, // Keep existing audio
      });

      // Replace video track in existing stream
      const newVideoTrack = newStream.getVideoTracks()[0];
      
      if (newVideoTrack && this.stream) {
        // Remove old video tracks
        this.stream.getVideoTracks().forEach((track) => {
          this.stream?.removeTrack(track);
        });
        
        // Add new video track
        this.stream.addTrack(newVideoTrack);
      }

      console.log('[Media] Camera switched');
      return this.stream;
    } catch (error) {
      this.handleMediaError(error);
      return null;
    }
  }

  /**
   * Switch microphone
   */
  public async switchMicrophone(deviceId: string): Promise<MediaStream | null> {
    if (!this.stream) return null;

    // Stop current audio tracks
    this.stream.getAudioTracks().forEach((track) => track.stop());

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false, // Keep existing video
        audio: { deviceId: { exact: deviceId } },
      });

      // Replace audio track in existing stream
      const newAudioTrack = newStream.getAudioTracks()[0];
      
      if (newAudioTrack && this.stream) {
        // Remove old audio tracks
        this.stream.getAudioTracks().forEach((track) => {
          this.stream?.removeTrack(track);
        });
        
        // Add new audio track
        this.stream.addTrack(newAudioTrack);
      }

      console.log('[Media] Microphone switched');
      return this.stream;
    } catch (error) {
      this.handleMediaError(error);
      return null;
    }
  }

  /**
   * Get available media devices
   */
  public static async getDevices(): Promise<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
  }> {
    try {
      // Request permission first to get labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        cameras: devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
            kind: 'videoinput' as const,
          })),
        microphones: devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
            kind: 'audioinput' as const,
          })),
        speakers: devices
          .filter((d) => d.kind === 'audiooutput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
            kind: 'audiooutput' as const,
          })),
      };
    } catch (error) {
      console.error('[Media] Failed to get devices:', error);
      return { cameras: [], microphones: [], speakers: [] };
    }
  }

  /**
   * Handle media errors
   */
  private handleMediaError(error: unknown): void {
    console.error('[Media] Error:', error);

    let errorCode = SessionErrorCode.UNKNOWN_ERROR;
    let message = 'An unknown media error occurred';

    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorCode = SessionErrorCode.MEDIA_ACCESS_DENIED;
          message = 'Camera/microphone access denied. Please check your permissions.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorCode = SessionErrorCode.MEDIA_NOT_FOUND;
          message = 'No camera or microphone found on this device.';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorCode = SessionErrorCode.MEDIA_ACCESS_DENIED;
          message = 'Camera or microphone is already in use by another application.';
          break;
        case 'OverconstrainedError':
          message = 'The requested video/audio constraints cannot be satisfied.';
          break;
        case 'AbortError':
          message = 'Media request was aborted.';
          break;
        default:
          message = `Media error: ${error.message}`;
      }
    }

    const sessionError: SessionError = {
      code: errorCode,
      message,
      details: error,
      timestamp: Date.now(),
    };

    this.callbacks.onError?.(sessionError);
  }

  /**
   * Stop all media tracks
   */
  public stop(): void {
    console.log('[Media] Stopping all media');

    this.stopAudioLevelMonitoring();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.stopScreenShare();
  }

  /**
   * Check if getUserMedia is supported
   */
  public static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  /**
   * Check if screen sharing is supported
   */
  public static isScreenShareSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    );
  }

  /**
   * Get supported constraints
   */
  public static getSupportedConstraints(): MediaTrackSupportedConstraints {
    return navigator.mediaDevices.getSupportedConstraints();
  }
}

export default MediaService;
