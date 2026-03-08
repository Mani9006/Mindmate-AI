/**
 * Video Session Screen for MindMate AI
 * Main screen for video therapy sessions with AI avatar
 * 
 * Features:
 * - WebRTC video/audio communication
 * - AI avatar video streaming (HeyGen)
 * - Real-time emotion detection
 * - Live transcript overlay
 * - Session controls (mute, end, emergency)
 * - Session timer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Services
import { 
  webRTCService, 
  WebRTCState,
  EmotionData as WebRTCEmotionData 
} from './services/webrtc.service';
import { 
  emotionService, 
  EmotionDetectionResult,
  EmotionType 
} from './services/emotion.service';
import { 
  HeyGenService, 
  TranscriptEvent,
  createHeyGenService,
  HeyGenStreamState 
} from './services/heygen.service';

// Hooks
import { useSessionTimer, formatTime } from './hooks/useSessionTimer';

// Components
import { SessionControls } from './components/SessionControls';
import { TranscriptOverlay, TranscriptMessage } from './components/TranscriptOverlay';
import { EmotionIndicator, EmotionData as IndicatorEmotionData } from './components/EmotionIndicator';

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Navigation types
type RootStackParamList = {
  VideoSession: {
    sessionId: string;
    token: string;
    avatarId?: string;
    voiceId?: string;
  };
  SessionSummary: {
    sessionId: string;
    duration: number;
  };
  Home: undefined;
};

type VideoSessionNavigationProp = StackNavigationProp<RootStackParamList, 'VideoSession'>;
type VideoSessionRouteProp = RouteProp<RootStackParamList, 'VideoSession'>;

// Connection states
 type ConnectionState = 
  | 'initializing'
  | 'requesting_permissions'
  | 'connecting_signaling'
  | 'connecting_webrtc'
  | 'connecting_avatar'
  | 'connected'
  | 'error'
  | 'ended';

// Session stats
interface SessionStats {
  startTime: number;
  emotionChanges: number;
  dominantEmotions: Record<EmotionType, number>;
  messagesExchanged: number;
}

export const VideoSessionScreen: React.FC = () => {
  const navigation = useNavigation<VideoSessionNavigationProp>();
  const route = useRoute<VideoSessionRouteProp>();
  const { sessionId, token, avatarId, voiceId } = route.params;

  // Refs
  const heyGenServiceRef = useRef<HeyGenService | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('initializing');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Media streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // UI states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showEmotionDetails, setShowEmotionDetails] = useState(false);

  // Emotion state
  const [currentEmotion, setCurrentEmotion] = useState<IndicatorEmotionData | null>(null);

  // Transcript state
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // Session timer
  const { 
    state: timerState, 
    start: startTimer, 
    reset: resetTimer 
  } = useSessionTimer({
    maxDuration: 50,
    warningThreshold: 5,
    autoEnd: false,
  });

  // Session stats
  const sessionStatsRef = useRef<SessionStats>({
    startTime: Date.now(),
    emotionChanges: 0,
    dominantEmotions: {
      neutral: 0, happy: 0, sad: 0, angry: 0,
      fearful: 0, disgusted: 0, surprised: 0,
    },
    messagesExchanged: 0,
  });

  // Initialize session
  useEffect(() => {
    initializeSession();

    return () => {
      cleanupSession();
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Handle timer warnings
  useEffect(() => {
    if (timerState.isWarning) {
      Alert.alert(
        'Session Time',
        `You have ${timerState.formattedRemaining} remaining in this session.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
    if (timerState.isCritical) {
      Alert.alert(
        'Session Ending Soon',
        'Your session will end in less than a minute. Please wrap up your thoughts.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [timerState.isWarning, timerState.isCritical]);

  // Initialize the entire session
  const initializeSession = async () => {
    try {
      setConnectionState('requesting_permissions');

      // Step 1: Initialize local media stream
      const stream = await webRTCService.initializeLocalStream(true, true);
      setLocalStream(stream);

      // Step 2: Setup WebRTC event listeners
      setupWebRTCListeners();

      // Step 3: Connect to signaling server
      setConnectionState('connecting_signaling');
      await webRTCService.connectSignaling(sessionId, token);

      // Step 4: Create peer connection
      setConnectionState('connecting_webrtc');
      webRTCService.createPeerConnection();
      const offer = await webRTCService.createOffer();
      webRTCService.sendSignalingMessage({
        type: 'offer',
        offer,
        sessionId,
      });

      // Step 5: Initialize HeyGen avatar
      setConnectionState('connecting_avatar');
      await initializeHeyGenAvatar();

      // Step 6: Start emotion detection
      setupEmotionDetection();

      // Step 7: Start session timer
      startTimer();
      setConnectionState('connected');

    } catch (error) {
      console.error('Session initialization error:', error);
      setConnectionState('error');
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Setup WebRTC event listeners
  const setupWebRTCListeners = () => {
    webRTCService.on('remoteStream', (stream: MediaStream) => {
      setRemoteStream(stream);
    });

    webRTCService.on('connected', () => {
      console.log('WebRTC connected');
    });

    webRTCService.on('disconnected', () => {
      console.log('WebRTC disconnected');
      // Handle reconnection if needed
    });

    webRTCService.on('signalingAnswer', async (answer: RTCSessionDescriptionInit) => {
      await webRTCService.handleAnswer(answer);
    });

    webRTCService.on('signalingIceCandidate', async (candidate: RTCIceCandidateInit) => {
      await webRTCService.handleIceCandidate(candidate);
    });

    webRTCService.on('signalingError', (error: any) => {
      console.error('Signaling error:', error);
      setConnectionError('Signaling connection failed');
    });
  };

  // Initialize HeyGen avatar service
  const initializeHeyGenAvatar = async () => {
    heyGenServiceRef.current = createHeyGenService(
      {
        avatarId: avatarId || 'default_avatar',
        voiceId: voiceId || 'default_voice',
        language: 'en',
        quality: 'high',
      },
      {
        autoReconnect: true,
        reconnectAttempts: 3,
      }
    );

    const heyGen = heyGenServiceRef.current;

    // Setup HeyGen event listeners
    heyGen.on('connected', () => {
      console.log('HeyGen connected');
    });

    heyGen.on('streamReady', () => {
      console.log('HeyGen stream ready');
    });

    heyGen.on('transcript', (event: TranscriptEvent) => {
      setCurrentTranscript(event.text);
    });

    heyGen.on('transcriptFinal', (event: TranscriptEvent) => {
      setTranscriptMessages(prev => [
        ...prev,
        {
          id: event.id,
          text: event.text,
          speaker: event.speaker,
          timestamp: event.timestamp,
          isFinal: true,
        }
      ]);
      setCurrentTranscript('');
      sessionStatsRef.current.messagesExchanged++;
    });

    heyGen.on('error', (error: any) => {
      console.error('HeyGen error:', error);
    });

    // Connect to HeyGen
    await heyGen.connect();
  };

  // Setup emotion detection
  const setupEmotionDetection = () => {
    // Listen for emotion detection events
    emotionService.on('emotionDetected', (result: EmotionDetectionResult) => {
      const emotionData: IndicatorEmotionData = {
        emotions: result.emotions,
        dominantEmotion: result.dominantEmotion,
        confidence: result.confidence,
        faceDetected: result.faceDetected,
      };
      setCurrentEmotion(emotionData);

      // Update stats
      if (result.faceDetected) {
        sessionStatsRef.current.dominantEmotions[result.dominantEmotion]++;
      }
    });

    emotionService.on('emotionChanged', ({ from, to }: { from: EmotionType; to: EmotionType }) => {
      sessionStatsRef.current.emotionChanges++;
    });

    // Start emotion detection
    emotionService.start();
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground - resume if needed
      console.log('App came to foreground');
    } else if (
      nextAppState.match(/inactive|background/)
    ) {
      // App went to background
      console.log('App went to background');
    }
    appStateRef.current = nextAppState;
  };

  // Cleanup session
  const cleanupSession = () => {
    // Stop emotion detection
    emotionService.stop();
    emotionService.removeAllListeners();

    // Disconnect HeyGen
    heyGenServiceRef.current?.destroy();
    heyGenServiceRef.current = null;

    // End WebRTC session
    webRTCService.endSession();
    webRTCService.removeAllListeners();

    // Reset timer
    resetTimer();
  };

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    const newState = webRTCService.toggleAudio();
    setIsMuted(!newState);
  }, []);

  // Toggle video
  const handleToggleVideo = useCallback(() => {
    const newState = webRTCService.toggleVideo();
    setIsVideoEnabled(newState);
  }, []);

  // Switch camera
  const handleSwitchCamera = useCallback(async () => {
    await webRTCService.switchCamera();
  }, []);

  // End session
  const handleEndSession = useCallback(() => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Session', 
          style: 'destructive',
          onPress: () => {
            cleanupSession();
            setConnectionState('ended');
            
            // Navigate to session summary
            navigation.navigate('SessionSummary', {
              sessionId,
              duration: timerState.elapsedSeconds,
            });
          }
        },
      ]
    );
  }, [navigation, sessionId, timerState.elapsedSeconds]);

  // Emergency handler
  const handleEmergency = useCallback(() => {
    Alert.alert(
      'Emergency Support',
      'This will connect you with crisis resources. Are you in immediate danger?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Get Help Now', 
          style: 'destructive',
          onPress: () => {
            // Open crisis resources or dial emergency number
            // In production, this would connect to crisis hotline
            Alert.alert(
              'Crisis Resources',
              'National Suicide Prevention Lifeline: 988\nCrisis Text Line: Text HOME to 741741',
              [
                { text: 'Call 988', onPress: () => {/* Launch phone dialer */} },
                { text: 'Close', style: 'cancel' },
              ]
            );
          }
        },
      ]
    );
  }, []);

  // Toggle transcript visibility
  const handleToggleTranscript = useCallback(() => {
    setShowTranscript(prev => !prev);
  }, []);

  // Toggle emotion details
  const handleToggleEmotionDetails = useCallback(() => {
    setShowEmotionDetails(prev => !prev);
  }, []);

  // Render loading state
  const renderLoadingState = () => {
    const getLoadingText = () => {
      switch (connectionState) {
        case 'initializing':
          return 'Initializing session...';
        case 'requesting_permissions':
          return 'Requesting camera and microphone access...';
        case 'connecting_signaling':
          return 'Connecting to signaling server...';
        case 'connecting_webrtc':
          return 'Establishing peer connection...';
        case 'connecting_avatar':
          return 'Loading AI avatar...';
        default:
          return 'Connecting...';
      }
    };

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{getLoadingText()}</Text>
        {connectionError && (
          <Text style={styles.errorText}>{connectionError}</Text>
        )}
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Connection Failed</Text>
      <Text style={styles.errorMessage}>
        {connectionError || 'Unable to establish connection. Please try again.'}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={initializeSession}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render connected state
  const renderConnectedState = () => (
    <>
      {/* AI Avatar Video (Remote Stream) */}
      <View style={styles.avatarContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.avatarVideo}
            objectFit="cover"
            zOrder={0}
          />
        ) : heyGenServiceRef.current?.getStreamUrl() ? (
          <RTCView
            streamURL={heyGenServiceRef.current.getStreamUrl()!}
            style={styles.avatarVideo}
            objectFit="cover"
            zOrder={0}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.placeholderText}>Loading AI Avatar...</Text>
          </View>
        )}
      </View>

      {/* Local Video (Picture-in-Picture) */}
      <View style={styles.localVideoContainer}>
        {localStream && isVideoEnabled ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        ) : (
          <View style={styles.localVideoPlaceholder}>
            <Icon name="account" size={40} color="#8E8E93" />
          </View>
        )}
        
        {/* Mute indicator on local video */}
        {isMuted && (
          <View style={styles.muteIndicator}>
            <Icon name="microphone-off" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Session Timer */}
      <View style={styles.timerContainer}>
        <View style={[
          styles.timerBadge,
          timerState.isWarning && styles.timerWarning,
          timerState.isCritical && styles.timerCritical,
        ]}>
          <Icon 
            name="clock-outline" 
            size={14} 
            color={timerState.isCritical ? '#FF3B30' : '#FFFFFF'} 
          />
          <Text style={[
            styles.timerText,
            timerState.isCritical && styles.timerTextCritical,
          ]}>
            {timerState.formattedTime}
          </Text>
        </View>
      </View>

      {/* Emotion Indicator */}
      <EmotionIndicator
        emotionData={currentEmotion}
        isVisible={showEmotionDetails}
        onToggleVisibility={handleToggleEmotionDetails}
        showDetails={true}
        position="topRight"
      />

      {/* Transcript Overlay */}
      <TranscriptOverlay
        messages={transcriptMessages}
        currentTranscript={currentTranscript}
        isVisible={showTranscript}
        onToggleVisibility={handleToggleTranscript}
        position="bottom"
        maxHeight={180}
        showTimestamps={false}
      />

      {/* Session Controls */}
      <View style={styles.controlsContainer}>
        <SessionControls
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onEndSession={handleEndSession}
          onEmergency={handleEmergency}
          onSwitchCamera={handleSwitchCamera}
          showEmergency={true}
          disabled={false}
        />
      </View>
    </>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {connectionState === 'connected' && renderConnectedState()}
      {connectionState === 'error' && renderErrorState()}
      {(connectionState !== 'connected' && connectionState !== 'error') && renderLoadingState()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 32,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  // Avatar video
  avatarContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  avatarVideo: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
  },
  // Local video (PiP)
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Timer
  timerContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
  },
  timerCritical: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  timerTextCritical: {
    color: '#FFFFFF',
  },
  // Controls
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
  },
});

export default VideoSessionScreen;
