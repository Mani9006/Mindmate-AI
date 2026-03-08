import { useState, useEffect, useCallback } from 'react';
import { PermissionStatus } from '@types';
import {
  checkAllPermissions,
  requestPermission,
  isPermissionGranted,
  PERMISSION_DESCRIPTIONS,
} from '@services/permissions';

interface UsePermissionsReturn {
  permissions: PermissionStatus | null;
  isLoading: boolean;
  error: string | null;
  checkPermissions: () => Promise<void>;
  requestSinglePermission: (type: keyof PermissionStatus) => Promise<boolean>;
  requestAllPermissions: () => Promise<PermissionStatus>;
  hasPermission: (type: keyof PermissionStatus) => boolean;
  hasAllPermissions: () => boolean;
  getMissingPermissions: () => (keyof PermissionStatus)[];
  getPermissionDescription: (type: keyof PermissionStatus) => { title: string; description: string };
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check all permissions
  const checkPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await checkAllPermissions();
      setPermissions(status);
    } catch (err) {
      setError('Failed to check permissions');
      console.error('Check permissions error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request a single permission
  const requestSinglePermission = useCallback(
    async (type: keyof PermissionStatus): Promise<boolean> => {
      try {
        const granted = await requestPermission(type);
        await checkPermissions(); // Refresh permissions
        return granted;
      } catch (err) {
        console.error(`Request ${type} permission error:`, err);
        return false;
      }
    },
    [checkPermissions]
  );

  // Request all permissions
  const requestAllPermissions = useCallback(async (): Promise<PermissionStatus> => {
    try {
      setIsLoading(true);
      const results = await Promise.all([
        requestPermission('camera'),
        requestPermission('microphone'),
        requestPermission('photos'),
        requestPermission('notifications'),
      ]);

      const status: PermissionStatus = {
        camera: results[0] ? 'granted' : 'denied',
        microphone: results[1] ? 'granted' : 'denied',
        photos: results[2] ? 'granted' : 'denied',
        notifications: results[3] ? 'granted' : 'denied',
      };

      setPermissions(status);
      return status;
    } catch (err) {
      setError('Failed to request permissions');
      console.error('Request all permissions error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if specific permission is granted
  const hasPermission = useCallback(
    (type: keyof PermissionStatus): boolean => {
      if (!permissions) return false;
      return isPermissionGranted(permissions[type]);
    },
    [permissions]
  );

  // Check if all permissions are granted
  const hasAllPermissions = useCallback((): boolean => {
    if (!permissions) return false;
    return Object.values(permissions).every((status) => isPermissionGranted(status));
  }, [permissions]);

  // Get list of missing permissions
  const getMissingPermissions = useCallback((): (keyof PermissionStatus)[] => {
    if (!permissions) return [];
    return (Object.keys(permissions) as (keyof PermissionStatus)[]).filter(
      (key) => !isPermissionGranted(permissions[key])
    );
  }, [permissions]);

  // Get permission description
  const getPermissionDescription = useCallback(
    (type: keyof PermissionStatus): { title: string; description: string } => {
      return PERMISSION_DESCRIPTIONS[type];
    },
    []
  );

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    isLoading,
    error,
    checkPermissions,
    requestSinglePermission,
    requestAllPermissions,
    hasPermission,
    hasAllPermissions,
    getMissingPermissions,
    getPermissionDescription,
  };
};
