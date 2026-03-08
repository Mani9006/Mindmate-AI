import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@types';
import { apiClient } from '@services/api';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@constants';

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Initialize auth state from storage
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

          if (accessToken && refreshToken && userData) {
            const user = JSON.parse(userData);
            const tokens: AuthTokens = {
              accessToken,
              refreshToken,
              expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
            };
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({
              isInitialized: true,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            isInitialized: true,
            isLoading: false,
            error: 'Failed to initialize authentication',
          });
        }
      },

      // Login
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post('/auth/login', credentials);
          const { user, tokens } = response.data;

          // Store tokens securely
          await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Login failed. Please try again.',
          });
          throw error;
        }
      },

      // Register
      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post('/auth/register', data);
          const { user, tokens } = response.data;

          // Store tokens securely
          await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
          await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Register error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Registration failed. Please try again.',
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          set({ isLoading: true });
          
          // Call logout endpoint if needed
          const { tokens } = get();
          if (tokens?.refreshToken) {
            try {
              await apiClient.post('/auth/logout', { refreshToken: tokens.refreshToken });
            } catch (error) {
              console.error('Logout API error:', error);
            }
          }

          // Clear stored data
          await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
          await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      // Refresh tokens
      refreshTokens: async () => {
        try {
          const { tokens } = get();
          if (!tokens?.refreshToken) {
            return false;
          }

          const response = await apiClient.post('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });

          const newTokens: AuthTokens = response.data.tokens;

          await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, newTokens.accessToken);
          await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newTokens.refreshToken);

          set({ tokens: newTokens });
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          // If refresh fails, logout user
          await get().logout();
          return false;
        }
      },

      // Update user data
      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
          AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set authenticated state
      setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
