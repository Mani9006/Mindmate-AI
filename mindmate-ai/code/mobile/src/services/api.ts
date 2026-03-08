import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '@constants';
import { useAuthStore } from '@stores/authStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request queue for handling token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get access token from secure storage
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

        // Store new tokens
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Update auth store
        const authStore = useAuthStore.getState();
        if (authStore.tokens) {
          authStore.tokens.accessToken = accessToken;
          authStore.tokens.refreshToken = newRefreshToken;
        }

        // Notify subscribers
        onTokenRefreshed(accessToken);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Token refresh failed, logout user
        const authStore = useAuthStore.getState();
        await authStore.logout();
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(handleApiError(error));
  }
);

// Error handler
const handleApiError = (error: AxiosError): Error => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 400:
        return new Error(data.message || ERROR_MESSAGES.VALIDATION_ERROR);
      case 401:
        return new Error(data.message || ERROR_MESSAGES.UNAUTHORIZED);
      case 403:
        return new Error(data.message || ERROR_MESSAGES.FORBIDDEN);
      case 404:
        return new Error(data.message || ERROR_MESSAGES.NOT_FOUND);
      case 422:
        return new Error(data.message || ERROR_MESSAGES.VALIDATION_ERROR);
      case 429:
        return new Error('Too many requests. Please try again later.');
      case 500:
      case 502:
      case 503:
      case 504:
        return new Error(ERROR_MESSAGES.SERVER_ERROR);
      default:
        return new Error(data.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  } else if (error.request) {
    // Request made but no response received
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }
    return new Error(ERROR_MESSAGES.NETWORK_ERROR);
  } else {
    // Error in setting up request
    return new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
  }
};

// Retry wrapper for requests
export const withRetry = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof AxiosError && error.response?.status) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error;
        }
      }

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
};

// API helper methods
export const api = {
  get: <T>(url: string, config?: any) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: any) => apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: any) => apiClient.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: any) => apiClient.patch<T>(url, data, config),
  delete: <T>(url: string, config?: any) => apiClient.delete<T>(url, config),
};

export default apiClient;
export { apiClient };
