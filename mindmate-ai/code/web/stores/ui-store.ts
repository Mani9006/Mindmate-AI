import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Modal states
  activeModal: string | null
  modalData: Record<string, unknown> | null

  // Toast notifications
  toasts: Toast[]

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  openModal: (modalId: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      toasts: [],

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (value) => set({ sidebarOpen: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      openModal: (modalId, data) =>
        set({ activeModal: modalId, modalData: data || null }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }))
        // Auto-remove toast after duration
        const duration = toast.duration || 5000
        setTimeout(() => {
          get().removeToast(id)
        }, duration)
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
