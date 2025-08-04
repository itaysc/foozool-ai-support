import axios from 'axios';
import config from '../config';

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
    console.log('🔄 Making refresh token request...');
    // Use a separate axios instance for refresh token to avoid interceptor conflicts
    const refreshInstance = axios.create({
      withCredentials: true,
      baseURL: config.apiUrl // Use the same base URL as the main instance
    });
    
    const response = await refreshInstance.post('/auth/refresh-token', {});
    console.log('🔄 Refresh token response:', response.data);
    
    return response.data; // Return the full response data
  } catch (err: any) {
    console.error('❌ Refresh token error:', err.response?.status, err.response?.data);
    // Check if it's a 401 or 403 error (invalid refresh token)
    if (err.response?.status === 401 || err.response?.status === 403) {
      return { success: false, message: 'Invalid refresh token' };
    }
    // For other errors, return success: false but don't redirect
    return { success: false, message: 'Refresh failed' };
  }
}


// Response interceptor to refresh token on 401 response
instance.interceptors.response.use(
  (response) => {
    return response;
  }, 
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt refresh on 401 errors and avoid auth-related endpoints
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/')) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry the original request (cookies will be sent automatically)
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting to refresh token...');
        const result = await refreshToken();
        console.log('🔄 Refresh token result:', result);
        
        if (result.success) {
          console.log('✅ Token refresh successful, retrying original request...');
          console.log('🍪 Checking if cookies are available...');
          
          // Add a small delay to ensure the cookie is set
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Process queued requests
          processQueue(null, null);
          
          // Retry the original request (cookies will be sent automatically)
          console.log('🔄 Retrying original request:', originalRequest.url);
          return instance(originalRequest);
        } else {
          console.log('❌ Token refresh failed:', result.message);
          // Refresh failed, but only redirect if it's an invalid token error
          processQueue(error, null);
          if (result.message === 'Invalid refresh token') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Don't redirect on network errors, only on auth errors
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;