import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AudioMode } from 'expo-av';
import { Recording } from 'expo-av/build/Audio';
import { requestMicrophonePermission } from '@services/permissions';

interface UseAudioReturn {
  isRecording: boolean;
  isPlaying: boolean;
  recordingDuration: number;
  playbackPosition: number;
  playbackDuration: number;
  recordingUri: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  playRecording: (uri?: string) => Promise<void>;
  pausePlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  deleteRecording: () => void;
  requestPermission: () => Promise<boolean>;
}

export const useAudio = (): UseAudioReturn => {
  const recordingRef = useRef<Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.error('Setup audio error:', err);
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setError('Microphone permission denied');
        return;
      }

      // Stop any playing audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Start recording error:', err);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) return null;

      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);

      // Stop and unload recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      recordingRef.current = null;

      if (uri) {
        setRecordingUri(uri);
        return uri;
      }

      return null;
    } catch (err) {
      setError('Failed to stop recording');
      console.error('Stop recording error:', err);
      return null;
    }
  }, []);

  // Play recording
  const playRecording = useCallback(async (uri?: string) => {
    try {
      const audioUri = uri || recordingUri;
      if (!audioUri) {
        setError('No recording to play');
        return;
      }

      setError(null);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Get duration
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setPlaybackDuration(status.durationMillis || 0);
      }
    } catch (err) {
      setError('Failed to play recording');
      console.error('Play recording error:', err);
    }
  }, [recordingUri]);

  // Playback status update callback
  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  }, []);

  // Pause playback
  const pausePlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Pause playback error:', err);
    }
  }, []);

  // Stop playback
  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    } catch (err) {
      console.error('Stop playback error:', err);
    }
  }, []);

  // Delete recording
  const deleteRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    recordingRef.current = null;
    soundRef.current = null;
    setRecordingUri(null);
    setRecordingDuration(0);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setIsRecording(false);
    setIsPlaying(false);
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setError('Microphone permission denied');
      }
      return granted;
    } catch (err) {
      setError('Failed to request microphone permission');
      console.error('Request microphone permission error:', err);
      return false;
    }
  }, []);

  return {
    isRecording,
    isPlaying,
    recordingDuration,
    playbackPosition,
    playbackDuration,
    recordingUri,
    error,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    stopPlayback,
    deleteRecording,
    requestPermission,
  };
};
