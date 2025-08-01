import axios from 'axios';
import { getStoredToken, setStoredToken } from './local-storage';
import config from '../config';
import { isTokenExpired } from '../utils';

const instance = axios.create({
  withCredentials: true,
  baseURL: config.apiUrl
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

export async function refreshToken() {
  try {
    console.log('🔄 Attempting to refresh token...');
    // Use a separate axios instance for refresh token to avoid interceptor conflicts
    const refreshInstance = axios.create({
      withCredentials: true,
      baseURL: import.meta.env.VITE_API_URL
    });
    
    const response = await refreshInstance.post('/auth/refresh-token', {});
    const { token } = response.data;
    
    if (token) {
      console.log('✅ Token refreshed successfully');
      setStoredToken(token);
      return { token };
    } else {
      console.error('❌ No token received in refresh response');
      return { token: null };
    }
  } catch (err) {
    console.error('❌ Token refresh failed:', err);
    return { token: null };
  }
}

instance.interceptors.request.use(
  async (config) => {
    // Skip token refresh for auth-related requests to prevent infinite loops
    if (config.url?.includes('/auth/')) {
      return config;
    }

    const token = getStoredToken();
    console.log('🔍 Request interceptor - URL:', config.url, 'Token exists:', !!token);
    
    if (token) {
      // Check if token is expired and refresh if needed
      if (isTokenExpired(token)) {
        console.log('🔄 Token expired, attempting to refresh...');
        try {
          const { token: newToken } = await refreshToken();
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            return config;
          }
        } catch (error) {
          console.error('❌ Failed to refresh token in request interceptor:', error);
          // Continue with expired token, let response interceptor handle 401
        }
      }
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 Request interceptor - Authorization header set');
    } else {
      console.log('🔍 Request interceptor - No token found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to refresh token on 401 response
instance.interceptors.response.use(
  (response) => {
    return response;
  }, 
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { token } = await refreshToken();
        
        if (token) {
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Process queued requests
          processQueue(null, token);
          
          // Retry the original request
          return instance(originalRequest);
        } else {
          // Refresh failed, redirect to login
          processQueue(error, null);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;