import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { PermissionStatus } from '@types';

// Check all permissions
export const checkAllPermissions = async (): Promise<PermissionStatus> => {
  const [cameraStatus, microphoneStatus, photosStatus, notificationsStatus] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    Audio.getPermissionsAsync(),
    ImagePicker.getMediaLibraryPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);

  return {
    camera: cameraStatus.status as PermissionStatus['camera'],
    microphone: microphoneStatus.status as PermissionStatus['microphone'],
    photos: photosStatus.status as PermissionStatus['photos'],
    notifications: notificationsStatus.status as PermissionStatus['notifications'],
  };
};

// Request camera permission
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

// Request microphone permission
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

// Request photos permission
export const requestPhotosPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting photos permission:', error);
    return false;
  }
};

// Request notifications permission
export const requestNotificationsPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notifications permission:', error);
    return false;
  }
};

// Check camera permission
export const checkCameraPermission = async (): Promise<PermissionStatus['camera']> => {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status as PermissionStatus['camera'];
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return 'denied';
  }
};

// Check microphone permission
export const checkMicrophonePermission = async (): Promise<PermissionStatus['microphone']> => {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status as PermissionStatus['microphone'];
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return 'denied';
  }
};

// Check photos permission
export const checkPhotosPermission = async (): Promise<PermissionStatus['photos']> => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status as PermissionStatus['photos'];
  } catch (error) {
    console.error('Error checking photos permission:', error);
    return 'denied';
  }
};

// Check notifications permission
export const checkNotificationsPermission = async (): Promise<PermissionStatus['notifications']> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status as PermissionStatus['notifications'];
  } catch (error) {
    console.error('Error checking notifications permission:', error);
    return 'denied';
  }
};

// Request all permissions at once
export const requestAllPermissions = async (): Promise<PermissionStatus> => {
  const [camera, microphone, photos, notifications] = await Promise.all([
    requestCameraPermission(),
    requestMicrophonePermission(),
    requestPhotosPermission(),
    requestNotificationsPermission(),
  ]);

  return {
    camera: camera ? 'granted' : 'denied',
    microphone: microphone ? 'granted' : 'denied',
    photos: photos ? 'granted' : 'denied',
    notifications: notifications ? 'granted' : 'denied',
  };
};

// Permission helper hooks data
export const getPermissionStatus = async (type: keyof PermissionStatus): Promise<PermissionStatus[typeof type]> => {
  switch (type) {
    case 'camera':
      return checkCameraPermission();
    case 'microphone':
      return checkMicrophonePermission();
    case 'photos':
      return checkPhotosPermission();
    case 'notifications':
      return checkNotificationsPermission();
    default:
      return 'denied';
  }
};

// Request permission by type
export const requestPermission = async (type: keyof PermissionStatus): Promise<boolean> => {
  switch (type) {
    case 'camera':
      return requestCameraPermission();
    case 'microphone':
      return requestMicrophonePermission();
    case 'photos':
      return requestPhotosPermission();
    case 'notifications':
      return requestNotificationsPermission();
    default:
      return false;
  }
};

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<keyof PermissionStatus, { title: string; description: string }> = {
  camera: {
    title: 'Camera Access',
    description: 'MindMate AI needs camera access for video therapy sessions and profile photos.',
  },
  microphone: {
    title: 'Microphone Access',
    description: 'MindMate AI needs microphone access for voice therapy sessions and audio messages.',
  },
  photos: {
    title: 'Photo Library Access',
    description: 'MindMate AI needs photo library access to set profile pictures.',
  },
  notifications: {
    title: 'Push Notifications',
    description: 'MindMate AI uses notifications to remind you of sessions and check-ins.',
  },
};

// Check if permission is granted
export const isPermissionGranted = (status: PermissionStatus[ keyof PermissionStatus]): boolean => {
  return status === 'granted';
};

// Check if any permission is denied
export const hasDeniedPermissions = (status: PermissionStatus): boolean => {
  return Object.values(status).some((s) => s === 'denied');
};

// Check if all permissions are granted
export const hasAllPermissions = (status: PermissionStatus): boolean => {
  return Object.values(status).every((s) => s === 'granted');
};
