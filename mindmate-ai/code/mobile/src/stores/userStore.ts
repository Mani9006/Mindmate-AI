import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserPreferences, UserStats, MoodEntry } from '@types';
import { apiClient } from '@services/api';

interface UserState {
  // State
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  stats: UserStats | null;
  moodHistory: MoodEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMoodHistory: (days?: number) => Promise<void>;
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'userId'>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<string>;
  clearError: () => void;
}

const defaultPreferences: UserPreferences = {
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
};

const defaultStats: UserStats = {
  totalSessions: 0,
  totalMinutes: 0,
  streakDays: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      preferences: null,
      stats: null,
      moodHistory: [],
      isLoading: false,
      error: null,

      // Fetch user profile
      fetchProfile: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get('/user/profile');
          set({
            profile: response.data,
            preferences: response.data.preferences || defaultPreferences,
            stats: response.data.stats || defaultStats,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Fetch profile error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch profile',
          });
        }
      },

      // Update user profile
      updateProfile: async (data: Partial<UserProfile>) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.patch('/user/profile', data);
          set({
            profile: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Update profile error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to update profile',
          });
          throw error;
        }
      },

      // Update user preferences
      updatePreferences: async (prefs: Partial<UserPreferences>) => {
        try {
          const currentPrefs = get().preferences || defaultPreferences;
          const updatedPrefs = { ...currentPrefs, ...prefs };
          
          set({ preferences: updatedPrefs });
          
          const response = await apiClient.patch('/user/preferences', prefs);
          set({ preferences: response.data });
        } catch (error: any) {
          console.error('Update preferences error:', error);
          set({
            error: error.response?.data?.message || 'Failed to update preferences',
          });
          throw error;
        }
      },

      // Fetch user stats
      fetchStats: async () => {
        try {
          const response = await apiClient.get('/user/stats');
          set({ stats: response.data });
        } catch (error: any) {
          console.error('Fetch stats error:', error);
          set({
            error: error.response?.data?.message || 'Failed to fetch stats',
          });
        }
      },

      // Fetch mood history
      fetchMoodHistory: async (days = 30) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get(`/user/mood-history?days=${days}`);
          set({
            moodHistory: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Fetch mood history error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch mood history',
          });
        }
      },

      // Add mood entry
      addMoodEntry: async (entry: Omit<MoodEntry, 'id' | 'userId'>) => {
        try {
          const response = await apiClient.post('/user/mood', entry);
          const newEntry = response.data;
          
          set((state) => ({
            moodHistory: [newEntry, ...state.moodHistory],
          }));
        } catch (error: any) {
          console.error('Add mood entry error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add mood entry',
          });
          throw error;
        }
      },

      // Upload avatar
      uploadAvatar: async (uri: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const formData = new FormData();
          const filename = uri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          formData.append('avatar', {
            uri,
            name: filename,
            type,
          } as any);

          const response = await apiClient.post('/user/avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          const avatarUrl = response.data.avatarUrl;
          
          set((state) => ({
            profile: state.profile ? { ...state.profile, avatar: avatarUrl } : null,
            isLoading: false,
          }));

          return avatarUrl;
        } catch (error: any) {
          console.error('Upload avatar error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to upload avatar',
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        stats: state.stats,
      }),
    }
  )
);
