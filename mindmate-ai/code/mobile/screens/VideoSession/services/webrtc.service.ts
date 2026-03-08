/**
 * WebRTC Service for MindMate AI Video Session
 * Handles peer connection, media stream capture, and signaling
 */

import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import { Platform } from 'react-native';
import { EventEmitter } from 'events';

// WebRTC configuration
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:turn.mindmate.ai:3478',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Media constraints
const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
  },
  video: {
    frameRate: 30,
    facingMode: 'user',
    width: 1280,
    height: 720,
  },
};

export interface WebRTCState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
}

export interface EmotionData {
  timestamp: number;
  emotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  dominantEmotion: string;
  confidence: number;
}

export class WebRTCService extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: any = null;
  private emotionInterval: NodeJS.Timeout | null = null;
  private sessionId: string = '';
  private signalingSocket: WebSocket | null = null;

  // State
  private state: WebRTCState = {
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
    connectionState: 'new',
    iceConnectionState: 'new',
    signalingState: 'stable',
  };

  constructor() {
    super();
  }

  /**
   * Get current WebRTC state
   */
  getState(): WebRTCState {
    return { ...this.state };
  }

  /**
   * Initialize local media stream (camera and microphone)
   */
  async initializeLocalStream(
    enableVideo: boolean = true,
    enableAudio: boolean = true
  ): Promise<MediaStream> {
    try {
      // Request permissions
      const constraints: any = {};
      if (enableAudio) constraints.audio = MEDIA_CONSTRAINTS.audio;
      if (enableVideo) constraints.video = MEDIA_CONSTRAINTS.video;

      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.state.localStream = stream;
      
      this.emit('localStream', stream);
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw new Error(`Failed to access camera/microphone: ${error}`);
    }
  }

  /**
   * Create and configure peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.state.connectionState = this.peerConnection?.connectionState || 'new';
      this.emit('connectionStateChange', this.state.connectionState);
      
      if (this.state.connectionState === 'connected') {
        this.state.isConnected = true;
        this.state.isConnecting = false;
        this.emit('connected');
      } else if (this.state.connectionState === 'failed' || 
                 this.state.connectionState === 'closed') {
        this.state.isConnected = false;
        this.emit('disconnected');
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      this.state.iceConnectionState = this.peerConnection?.iceConnectionState || 'new';
      this.emit('iceConnectionStateChange', this.state.iceConnectionState);
    };

    // Handle signaling state
    this.peerConnection.onsignalingstatechange = () => {
      this.state.signalingState = this.peerConnection?.signalingState || 'stable';
      this.emit('signalingStateChange', this.state.signalingState);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', event.candidate);
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.state.remoteStream = event.streams[0];
        this.emit('remoteStream', event.streams[0]);
      }
    };

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Create data channel for emotion data
    this.setupDataChannel();

    return this.peerConnection;
  }

  /**
   * Setup data channel for emotion data transmission
   */
  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel('emotionData', {
      ordered: true,
      maxRetransmits: 3,
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.emit('dataChannelOpen');
      this.startEmotionDataSending();
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.emit('dataChannelClose');
      this.stopEmotionDataSending();
    };

    this.dataChannel.onerror = (error: any) => {
      console.error('Data channel error:', error);
      this.emit('dataChannelError', error);
    };

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);
          this.emit('dataChannelMessage', data);
        } catch (e) {
          console.warn('Received non-JSON data on data channel');
        }
      };
    };
  }

  /**
   * Start sending emotion data periodically
   */
  private startEmotionDataSending(): void {
    // Emotion data will be sent from the emotion detection service
    // This just ensures the channel is ready
    this.emit('emotionChannelReady');
  }

  /**
   * Stop sending emotion data
   */
  private stopEmotionDataSending(): void {
    if (this.emotionInterval) {
      clearInterval(this.emotionInterval);
      this.emotionInterval = null;
    }
  }

  /**
   * Send emotion data through data channel
   */
  sendEmotionData(emotionData: EmotionData): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify({
          type: 'emotion',
          data: emotionData,
          timestamp: Date.now(),
        }));
        return true;
      } catch (error) {
        console.error('Failed to send emotion data:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Create offer for initiating connection
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Create answer for responding to offer
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  /**
   * Handle received answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Handle received ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Connect to signaling server
   */
  connectSignaling(sessionId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId;
      
      const wsUrl = `${process.env.SIGNALING_SERVER_URL || 'wss://signaling.mindmate.ai'}/ws?sessionId=${sessionId}&token=${token}`;
      
      this.signalingSocket = new WebSocket(wsUrl);

      this.signalingSocket.onopen = () => {
        console.log('Signaling connection established');
        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleSignalingMessage(message);
        } catch (error) {
          console.error('Failed to parse signaling message:', error);
        }
      };

      this.signalingSocket.onerror = (error) => {
        console.error('Signaling connection error:', error);
        reject(error);
      };

      this.signalingSocket.onclose = () => {
        console.log('Signaling connection closed');
        this.emit('signalingDisconnected');
      };
    });
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'offer':
        this.emit('signalingOffer', message.offer);
        break;
      case 'answer':
        this.emit('signalingAnswer', message.answer);
        break;
      case 'ice-candidate':
        this.emit('signalingIceCandidate', message.candidate);
        break;
      case 'session-ready':
        this.emit('sessionReady', message.data);
        break;
      case 'error':
        this.emit('signalingError', message.error);
        break;
      default:
        console.warn('Unknown signaling message type:', message.type);
    }
  }

  /**
   * Send signaling message
   */
  sendSignalingMessage(message: any): void {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }

  /**
   * Toggle audio mute state
   */
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      const isEnabled = audioTracks.some(track => track.enabled);
      
      audioTracks.forEach(track => {
        track.enabled = !isEnabled;
      });
      
      return !isEnabled;
    }
    return false;
  }

  /**
   * Toggle video enabled state
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      const isEnabled = videoTracks.some(track => track.enabled);
      
      videoTracks.forEach(track => {
        track.enabled = !isEnabled;
      });
      
      return !isEnabled;
    }
    return false;
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    if (this.localStream) {
      return this.localStream.getAudioTracks().some(track => track.enabled);
    }
    return false;
  }

  /**
   * Check if video is enabled
   */
  isVideoEnabled(): boolean {
    if (this.localStream) {
      return this.localStream.getVideoTracks().some(track => track.enabled);
    }
    return false;
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTracks = this.localStream.getVideoTracks();
    
    for (const track of videoTracks) {
      if (track._switchCamera) {
        track._switchCamera();
      }
    }
  }

  /**
   * End the session and cleanup
   */
  endSession(): void {
    // Stop emotion data sending
    this.stopEmotionDataSending();

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

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close signaling socket
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    // Reset state
    this.state = {
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      connectionState: 'new',
      iceConnectionState: 'new',
      signalingState: 'stable',
    };

    this.emit('sessionEnded');
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
