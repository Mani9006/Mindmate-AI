import { Session } from "next-auth"

// User Types
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserSession extends Session {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Chat Types
export interface Chat {
  id: string
  title: string
  userId: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
}

export interface Message {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  chatId: string
  createdAt: Date
}

// AI Types
export interface AIRequest {
  message: string
  chatId?: string
  model?: string
  temperature?: number
}

export interface AIResponse {
  content: string
  model: string
  tokensUsed?: number
}

// Settings Types
export interface UserSettings {
  theme: "light" | "dark" | "system"
  language: string
  notifications: boolean
  autoSave: boolean
  defaultModel: string
}

// Navigation Types
export interface NavItem {
  title: string
  href: string
  icon?: string
  disabled?: boolean
  external?: boolean
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
}
