import { create } from "zustand"
import { persist } from "zustand/middleware"
import { User, UserSettings } from "@/types"

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  settings: UserSettings

  // Actions
  setUser: (user: User | null) => void
  setAuthenticated: (value: boolean) => void
  setLoading: (value: boolean) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  logout: () => void
}

const defaultSettings: UserSettings = {
  theme: "system",
  language: "en",
  notifications: true,
  autoSave: true,
  defaultModel: "gpt-4",
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      settings: defaultSettings,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
