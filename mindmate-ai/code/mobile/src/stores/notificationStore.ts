import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { PushNotification } from '@types';
import { apiClient } from '@services/api';

interface NotificationState {
  // State
  notifications: PushNotification[];
  unreadCount: number;
  pushToken: string | null;
  isLoading: boolean;
  error: string | null;
  isEnabled: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  registerPushToken: () => Promise<string | null>;
  unregisterPushToken: () => Promise<void>;
  scheduleLocalNotification: (title: string, body: string, trigger?: Notifications.NotificationTriggerInput) => Promise<string>;
  cancelLocalNotification: (identifier: string) => Promise<void>;
  cancelAllLocalNotifications: () => Promise<void>;
  addNotification: (notification: PushNotification) => void;
  clearError: () => void;
  setEnabled: (enabled: boolean) => void;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial State
      notifications: [],
      unreadCount: 0,
      pushToken: null,
      isLoading: false,
      error: null,
      isEnabled: true,

      // Initialize notifications
      initialize: async () => {
        try {
          // Request permissions
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          set({ isEnabled: finalStatus === 'granted' });

          // Register for push notifications if granted
          if (finalStatus === 'granted') {
            await get().registerPushToken();
          }

          // Set up notification listeners
          const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
              const pushNotification: PushNotification = {
                id: notification.request.identifier,
                title: notification.request.content.title || '',
                body: notification.request.content.body || '',
                data: notification.request.content.data as Record<string, unknown>,
                timestamp: new Date().toISOString(),
                read: false,
                type: (notification.request.content.data?.type as any) || 'system',
              };
              get().addNotification(pushNotification);
            }
          );

          const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
              // Handle notification tap
              const data = response.notification.request.content.data;
              console.log('Notification tapped:', data);
              // Navigate based on notification type
            }
          );

          // Fetch existing notifications
          await get().fetchNotifications();

          // Cleanup subscriptions on app unmount
          return () => {
            notificationReceivedSubscription.remove();
            notificationResponseSubscription.remove();
          };
        } catch (error) {
          console.error('Notification initialization error:', error);
        }
      },

      // Fetch notifications from server
      fetchNotifications: async (page = 1, limit = 20) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
          const notifications = response.data.data;
          
          const unreadCount = notifications.filter((n: PushNotification) => !n.read).length;
          
          set({
            notifications,
            unreadCount,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Fetch notifications error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch notifications',
          });
        }
      },

      // Mark notification as read
      markAsRead: async (notificationId: string) => {
        try {
          await apiClient.patch(`/notifications/${notificationId}/read`);
          
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (error: any) {
          console.error('Mark as read error:', error);
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        try {
          await apiClient.patch('/notifications/read-all');
          
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        } catch (error: any) {
          console.error('Mark all as read error:', error);
        }
      },

      // Delete notification
      deleteNotification: async (notificationId: string) => {
        try {
          await apiClient.delete(`/notifications/${notificationId}`);
          
          set((state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            return {
              notifications: state.notifications.filter((n) => n.id !== notificationId),
              unreadCount: notification && !notification.read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
            };
          });
        } catch (error: any) {
          console.error('Delete notification error:', error);
        }
      },

      // Register push token
      registerPushToken: async () => {
        try {
          const token = (await Notifications.getExpoPushTokenAsync({
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
          })).data;

          set({ pushToken: token });

          // Send token to server
          await apiClient.post('/notifications/register-token', {
            token,
            platform: 'expo',
          });

          return token;
        } catch (error) {
          console.error('Register push token error:', error);
          return null;
        }
      },

      // Unregister push token
      unregisterPushToken: async () => {
        try {
          const { pushToken } = get();
          if (pushToken) {
            await apiClient.post('/notifications/unregister-token', {
              token: pushToken,
            });
          }
          set({ pushToken: null });
        } catch (error) {
          console.error('Unregister push token error:', error);
        }
      },

      // Schedule local notification
      scheduleLocalNotification: async (
        title: string,
        body: string,
        trigger?: Notifications.NotificationTriggerInput
      ) => {
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
            priority: Notifications.AndroidImportance.HIGH,
          },
          trigger: trigger || null,
        });
        return identifier;
      },

      // Cancel local notification
      cancelLocalNotification: async (identifier: string) => {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      },

      // Cancel all local notifications
      cancelAllLocalNotifications: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
      },

      // Add notification (for received push notifications)
      addNotification: (notification: PushNotification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set enabled state
      setEnabled: (enabled: boolean) => set({ isEnabled: enabled }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        pushToken: state.pushToken,
      }),
    }
  )
);
