import { useState, useRef, useCallback } from 'react';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermission, requestPhotosPermission } from '@services/permissions';

interface UseCameraReturn {
  cameraRef: React.RefObject<Camera>;
  type: CameraType;
  flashMode: FlashMode;
  isReady: boolean;
  isCapturing: boolean;
  error: string | null;
  toggleCameraType: () => void;
  toggleFlashMode: () => void;
  setIsReady: (ready: boolean) => void;
  takePicture: () => Promise<string | null>;
  pickImage: () => Promise<string | null>;
  requestPermission: () => Promise<boolean>;
}

export const useCamera = (): UseCameraReturn => {
  const cameraRef = useRef<Camera>(null);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [flashMode, setFlashMode] = useState<FlashMode>(FlashMode.off);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle camera type (front/back)
  const toggleCameraType = useCallback(() => {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }, []);

  // Toggle flash mode
  const toggleFlashMode = useCallback(() => {
    setFlashMode((current) => {
      switch (current) {
        case FlashMode.off:
          return FlashMode.on;
        case FlashMode.on:
          return FlashMode.auto;
        case FlashMode.auto:
          return FlashMode.off;
        default:
          return FlashMode.off;
      }
    });
  }, []);

  // Take picture
  const takePicture = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || !isReady) return null;

    try {
      setIsCapturing(true);
      setError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      return photo.uri;
    } catch (err) {
      setError('Failed to take picture');
      console.error('Take picture error:', err);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isReady]);

  // Pick image from gallery
  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);

      // Request permission if needed
      const hasPermission = await requestPhotosPermission();
      if (!hasPermission) {
        setError('Photo library permission denied');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        return result.assets[0].uri;
      }

      return null;
    } catch (err) {
      setError('Failed to pick image');
      console.error('Pick image error:', err);
      return null;
    }
  }, []);

  // Request camera permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestCameraPermission();
      if (!granted) {
        setError('Camera permission denied');
      }
      return granted;
    } catch (err) {
      setError('Failed to request camera permission');
      console.error('Request camera permission error:', err);
      return false;
    }
  }, []);

  return {
    cameraRef,
    type,
    flashMode,
    isReady,
    isCapturing,
    error,
    toggleCameraType,
    toggleFlashMode,
    setIsReady,
    takePicture,
    pickImage,
    requestPermission,
  };
};
