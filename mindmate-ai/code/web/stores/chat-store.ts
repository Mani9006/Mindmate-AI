import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Chat, Message } from "@/types"

interface ChatState {
  // State
  chats: Chat[]
  currentChat: Chat | null
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string

  // Actions
  setChats: (chats: Chat[]) => void
  setCurrentChat: (chat: Chat | null) => void
  addChat: (chat: Chat) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  deleteChat: (chatId: string) => void
  addMessage: (chatId: string, message: Message) => void
  setLoading: (value: boolean) => void
  setStreaming: (value: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  clearStreamingContent: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      chats: [],
      currentChat: null,
      isLoading: false,
      isStreaming: false,
      streamingContent: "",

      // Actions
      setChats: (chats) => set({ chats }),
      setCurrentChat: (chat) => set({ currentChat: chat }),
      addChat: (chat) =>
        set((state) => ({
          chats: [chat, ...state.chats],
          currentChat: chat,
        })),
      updateChat: (chatId, updates) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, ...updates } : chat
          ),
          currentChat:
            state.currentChat?.id === chatId
              ? { ...state.currentChat, ...updates }
              : state.currentChat,
        })),
      deleteChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChat:
            state.currentChat?.id === chatId ? null : state.currentChat,
        })),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: [...chat.messages, message] }
              : chat
          ),
          currentChat:
            state.currentChat?.id === chatId
              ? {
                  ...state.currentChat,
                  messages: [...state.currentChat.messages, message],
                }
              : state.currentChat,
        })),
      setLoading: (value) => set({ isLoading: value }),
      setStreaming: (value) => set({ isStreaming: value }),
      setStreamingContent: (content) => set({ streamingContent: content }),
      appendStreamingContent: (content) =>
        set((state) => ({
          streamingContent: state.streamingContent + content,
        })),
      clearStreamingContent: () => set({ streamingContent: "" }),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ chats: state.chats }),
    }
  )
)
