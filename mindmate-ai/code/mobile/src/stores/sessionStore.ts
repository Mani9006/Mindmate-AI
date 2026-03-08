import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, Message, MoodEntry } from '@types';
import { apiClient } from '@services/api';

interface SessionState {
  // State
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  unreadCount: number;

  // Actions
  fetchSessions: (page?: number, limit?: number) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  createSession: (type: 'chat' | 'voice' | 'video', initialMood?: MoodEntry) => Promise<Session>;
  sendMessage: (content: string, type?: 'text' | 'image' | 'audio') => Promise<void>;
  endSession: (summary?: string) => Promise<void>;
  addMoodToSession: (mood: MoodEntry, timing: 'before' | 'after') => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearCurrentSession: () => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial State
      sessions: [],
      currentSession: null,
      isLoading: false,
      isSending: false,
      error: null,
      unreadCount: 0,

      // Fetch all sessions
      fetchSessions: async (page = 1, limit = 20) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get(`/sessions?page=${page}&limit=${limit}`);
          set({
            sessions: response.data.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Fetch sessions error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch sessions',
          });
        }
      },

      // Fetch single session
      fetchSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.get(`/sessions/${sessionId}`);
          set({
            currentSession: response.data,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Fetch session error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to fetch session',
          });
        }
      },

      // Create new session
      createSession: async (type: 'chat' | 'voice' | 'video', initialMood?: MoodEntry) => {
        try {
          set({ isLoading: true, error: null });
          
          const payload: any = { type };
          if (initialMood) {
            payload.moodBefore = initialMood;
          }
          
          const response = await apiClient.post('/sessions', payload);
          const newSession = response.data;
          
          set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSession: newSession,
            isLoading: false,
          }));

          return newSession;
        } catch (error: any) {
          console.error('Create session error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to create session',
          });
          throw error;
        }
      },

      // Send message in current session
      sendMessage: async (content: string, type: 'text' | 'image' | 'audio' = 'text') => {
        const { currentSession } = get();
        if (!currentSession) {
          set({ error: 'No active session' });
          return;
        }

        try {
          set({ isSending: true, error: null });

          // Optimistically add user message
          const userMessage: Message = {
            id: `temp-${Date.now()}`,
            sessionId: currentSession.id,
            sender: 'user',
            content,
            timestamp: new Date().toISOString(),
            type,
          };

          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: [...state.currentSession.messages, userMessage],
                }
              : null,
          }));

          // Send to API
          const response = await apiClient.post(`/sessions/${currentSession.id}/messages`, {
            content,
            type,
          });

          const { userMessage: savedUserMessage, aiMessage } = response.data;

          // Update with actual messages from server
          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: [
                    ...state.currentSession.messages.filter((m) => m.id !== userMessage.id),
                    savedUserMessage,
                    aiMessage,
                  ],
                }
              : null,
            isSending: false,
          }));
        } catch (error: any) {
          console.error('Send message error:', error);
          set({
            isSending: false,
            error: error.response?.data?.message || 'Failed to send message',
          });
          throw error;
        }
      },

      // End current session
      endSession: async (summary?: string) => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          set({ isLoading: true });
          
          const response = await apiClient.patch(`/sessions/${currentSession.id}/end`, {
            summary,
          });

          const endedSession = response.data;

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === endedSession.id ? endedSession : s
            ),
            currentSession: endedSession,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('End session error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to end session',
          });
        }
      },

      // Add mood to session
      addMoodToSession: async (mood: MoodEntry, timing: 'before' | 'after') => {
        const { currentSession } = get();
        if (!currentSession) return;

        try {
          const response = await apiClient.patch(`/sessions/${currentSession.id}/mood`, {
            mood,
            timing,
          });

          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  [timing === 'before' ? 'moodBefore' : 'moodAfter']: mood,
                }
              : null,
          }));
        } catch (error: any) {
          console.error('Add mood to session error:', error);
          set({
            error: error.response?.data?.message || 'Failed to add mood',
          });
        }
      },

      // Delete session
      deleteSession: async (sessionId: string) => {
        try {
          set({ isLoading: true });
          await apiClient.delete(`/sessions/${sessionId}`);
          
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            currentSession: state.currentSession?.id === sessionId 
              ? null 
              : state.currentSession,
            isLoading: false,
          }));
        } catch (error: any) {
          console.error('Delete session error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to delete session',
          });
          throw error;
        }
      },

      // Clear current session
      clearCurrentSession: () => set({ currentSession: null }),

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 10), // Only persist recent sessions
      }),
    }
  )
);
