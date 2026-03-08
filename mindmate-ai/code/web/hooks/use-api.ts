"use client"

import { useState, useCallback } from "react"
import axios, { AxiosError, AxiosRequestConfig } from "axios"

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: ApiError) => void
}

interface ApiError {
  message: string
  code?: string
  status?: number
}

interface UseApiReturn<T, P = unknown> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  execute: (params?: P) => Promise<void>
  reset: () => void
}

// Create axios instance
const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("next-auth.session-token="))
      ?.split("=")[1]

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: "An error occurred",
      status: error.response?.status,
    }

    if (error.response?.data) {
      const data = error.response.data as { message?: string; error?: string }
      apiError.message = data.message || data.error || apiError.message
    }

    return Promise.reject(apiError)
  }
)

export function useApi<T, P = unknown>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (params?: P) => {
      setIsLoading(true)
      setError(null)

      try {
        const config: AxiosRequestConfig = {
          method,
          url,
        }

        if (method === "GET" && params) {
          config.params = params
        } else if (params) {
          config.data = params
        }

        const response = await apiClient.request<T>(config)
        setData(response.data)
        options.onSuccess?.(response.data)
      } catch (err) {
        const apiError = err as ApiError
        setError(apiError)
        options.onError?.(apiError)
      } finally {
        setIsLoading(false)
      }
    },
    [url, method, options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { data, error, isLoading, execute, reset }
}

// Hook for GET requests
export function useGet<T, P = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  return useApi<T, P>(url, "GET", options)
}

// Hook for POST requests
export function usePost<T, P = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  return useApi<T, P>(url, "POST", options)
}

// Hook for PUT requests
export function usePut<T, P = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  return useApi<T, P>(url, "PUT", options)
}

// Hook for DELETE requests
export function useDelete<T, P = unknown>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  return useApi<T, P>(url, "DELETE", options)
}

export { apiClient }
