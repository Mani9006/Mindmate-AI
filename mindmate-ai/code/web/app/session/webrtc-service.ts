/**
 * MindMate AI - WebRTC Service
 * Browser-based WebRTC API integration for peer-to-peer video sessions
 */

import {
  PeerConnectionConfig,
  MediaStreamState,
  RTCConnectionState,
  SessionError,
  SessionErrorCode,
} from './types';

// Default STUN/TURN servers
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

// Default RTC configuration
const DEFAULT_RTC_CONFIG: PeerConnectionConfig = {
  iceServers: DEFAULT_ICE_SERVERS,
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
};

// Event callbacks type
interface WebRTCEventCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onError?: (error: SessionError) => void;
  onDataChannelMessage?: (message: string) => void;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: PeerConnectionConfig;
  private callbacks: WebRTCEventCallbacks;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private iceCandidatesQueue: RTCIceCandidate[] = [];
  private isInitiator: boolean = false;

  constructor(
    config: Partial<PeerConnectionConfig> = {},
    callbacks: WebRTCEventCallbacks = {}
  ) {
    this.config = { ...DEFAULT_RTC_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * Initialize the RTCPeerConnection
   */
  public initialize(isInitiator: boolean = false): void {
    this.isInitiator = isInitiator;
    
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers,
        iceTransportPolicy: this.config.iceTransportPolicy,
        bundlePolicy: this.config.bundlePolicy,
        rtcpMuxPolicy: this.config.rtcpMuxPolicy,
      });

      this.setupPeerConnectionListeners();

      // Create data channel if initiator
      if (isInitiator) {
        this.createDataChannel();
      }

      console.log('[WebRTC] Peer connection initialized');
    } catch (error) {
      this.handleError('Failed to initialize peer connection', error);
    }
  }

  /**
   * Setup peer connection event listeners
   */
  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    // ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated');
        this.callbacks.onIceCandidate?.(event.candidate);
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.notifyConnectionStateChange();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.notifyConnectionStateChange();
    };

    this.peerConnection.onsignalingstatechange = () => {
      this.notifyConnectionStateChange();
    };

    // Remote stream handling
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      this.remoteStream.addTrack(event.track);
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };

    // Data channel handling (for non-initiator)
    this.peerConnection.ondatachannel = (event) => {
      console.log('[WebRTC] Data channel received');
      this.dataChannel = event.channel;
      this.setupDataChannelListeners();
    };
  }

  /**
   * Create data channel for messaging
   */
  private createDataChannel(): void {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true,
    });

    this.setupDataChannelListeners();
    console.log('[WebRTC] Data channel created');
  }

  /**
   * Setup data channel event listeners
   */
  private setupDataChannelListeners(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[WebRTC] Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('[WebRTC] Data channel closed');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('[WebRTC] Data channel message received');
      this.callbacks.onDataChannelMessage?.(event.data);
    };

    this.dataChannel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error);
    };
  }

  /**
   * Add local media stream to peer connection
   */
  public addLocalStream(stream: MediaStream): void {
    if (!this.peerConnection) {
      this.handleError('Peer connection not initialized');
      return;
    }

    this.localStream = stream;

    stream.getTracks().forEach((track) => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
        console.log(`[WebRTC] Added local track: ${track.kind}`);
      }
    });

    this.callbacks.onLocalStream?.(stream);
  }

  /**
   * Create and send offer (for initiator)
   */
  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      this.handleError('Peer connection not initialized');
      return null;
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] Offer created');

      return offer;
    } catch (error) {
      this.handleError('Failed to create offer', error);
      return null;
    }
  }

  /**
   * Handle received offer (for non-initiator)
   */
  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      this.handleError('Peer connection not initialized');
      return null;
    }

    try {
      await this.peerConnection.setRemoteDescription(offer);
      console.log('[WebRTC] Offer received and set');

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Answer created');

      // Process queued ICE candidates
      this.processQueuedIceCandidates();

      return answer;
    } catch (error) {
      this.handleError('Failed to handle offer', error);
      return null;
    }
  }

  /**
   * Handle received answer (for initiator)
   */
  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      this.handleError('Peer connection not initialized');
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('[WebRTC] Answer received and set');

      // Process queued ICE candidates
      this.processQueuedIceCandidates();
    } catch (error) {
      this.handleError('Failed to handle answer', error);
    }
  }

  /**
   * Handle ICE candidate
   */
  public async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      this.iceCandidatesQueue.push(candidate as RTCIceCandidate);
      return;
    }

    // If remote description not set, queue the candidate
    if (!this.peerConnection.remoteDescription) {
      this.iceCandidatesQueue.push(candidate as RTCIceCandidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('[WebRTC] ICE candidate added');
    } catch (error) {
      this.handleError('Failed to add ICE candidate', error);
    }
  }

  /**
   * Process queued ICE candidates
   */
  private async processQueuedIceCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(candidate);
          console.log('[WebRTC] Queued ICE candidate added');
        } catch (error) {
          console.error('[WebRTC] Failed to add queued ICE candidate:', error);
        }
      }
    }
  }

  /**
   * Send message through data channel
   */
  public sendDataChannelMessage(message: string): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[WebRTC] Data channel not open');
      return false;
    }

    try {
      this.dataChannel.send(message);
      return true;
    } catch (error) {
      console.error('[WebRTC] Failed to send data channel message:', error);
      return false;
    }
  }

  /**
   * Replace track (for switching cameras, etc.)
   */
  public async replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) return;

    const sender = this.peerConnection.getSenders().find(
      (s) => s.track === oldTrack
    );

    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log(`[WebRTC] Replaced track: ${oldTrack.kind}`);
    }
  }

  /**
   * Remove track from peer connection
   */
  public removeTrack(track: MediaStreamTrack): void {
    if (!this.peerConnection) return;

    const sender = this.peerConnection.getSenders().find(
      (s) => s.track === track
    );

    if (sender) {
      this.peerConnection.removeTrack(sender);
      console.log(`[WebRTC] Removed track: ${track.kind}`);
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): RTCConnectionState {
    if (!this.peerConnection) {
      return {
        connectionState: 'closed',
        iceConnectionState: 'closed',
        signalingState: 'closed',
        isConnected: false,
      };
    }

    const state: RTCConnectionState = {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
      signalingState: this.peerConnection.signalingState,
      isConnected: this.peerConnection.connectionState === 'connected',
    };

    return state;
  }

  /**
   * Get local stream
   */
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get media stream state
   */
  public getMediaStreamState(): MediaStreamState {
    return {
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      screenStream: null,
      isAudioEnabled: this.localStream?.getAudioTracks().some((t) => t.enabled) ?? false,
      isVideoEnabled: this.localStream?.getVideoTracks().some((t) => t.enabled) ?? false,
      isScreenSharing: false,
    };
  }

  /**
   * Notify connection state change
   */
  private notifyConnectionStateChange(): void {
    const state = this.getConnectionState();
    console.log('[WebRTC] Connection state changed:', state);
    this.callbacks.onConnectionStateChange?.(state);
  }

  /**
   * Handle errors
   */
  private handleError(message: string, error?: unknown): void {
    console.error('[WebRTC]', message, error);
    
    const sessionError: SessionError = {
      code: SessionErrorCode.WEBRTC_CONNECTION_FAILED,
      message,
      details: error,
      timestamp: Date.now(),
    };

    this.callbacks.onError?.(sessionError);
  }

  /**
   * Close and cleanup
   */
  public close(): void {
    console.log('[WebRTC] Closing peer connection');

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Clear remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    this.iceCandidatesQueue = [];
    console.log('[WebRTC] Peer connection closed');
  }

  /**
   * Check if WebRTC is supported
   */
  public static isSupported(): boolean {
    return !!(
      window.RTCPeerConnection &&
      window.RTCSessionDescription &&
      window.RTCIceCandidate
    );
  }

  /**
   * Get supported codecs
   */
  public static async getSupportedCodecs(): Promise<{
    audio: string[];
    video: string[];
  }> {
    const audioCodecs: string[] = [];
    const videoCodecs: string[] = [];

    if (RTCRtpReceiver.getCapabilities) {
      const audioCaps = RTCRtpReceiver.getCapabilities('audio');
      const videoCaps = RTCRtpReceiver.getCapabilities('video');

      if (audioCaps) {
        audioCodecs.push(...audioCaps.codecs.map((c) => c.mimeType));
      }

      if (videoCaps) {
        videoCodecs.push(...videoCaps.codecs.map((c) => c.mimeType));
      }
    }

    return { audio: audioCodecs, video: videoCodecs };
  }
}

export default WebRTCService;
