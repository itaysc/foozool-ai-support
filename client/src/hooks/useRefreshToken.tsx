import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/auth-service';
import config from '../config';
import { getStoredToken } from '../services/local-storage';
import authStore from '../stores/auth.store';

export const useRefreshToken = () => {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    // Initialize based on whether we have a stored token and auth store state
    const storedToken = getStoredToken();
    const authStoreToken = authStore.token;
    return !!(storedToken || authStoreToken);
  });
  useEffect(() => {
    // Only set up the interval if we have a token
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsAuthorized(false);
      return;
    }

    // Don't run immediately, wait for the first interval
    const interval = setInterval(async () => {
      const currentToken = getStoredToken();
      if (currentToken) {
        try {
          const decodedToken = jwtDecode(currentToken);
          const currentTime = Date.now() / 1000;
          const timeUntilExpiry = decodedToken.exp - currentTime;
          
          console.log(`🔍 Token expires in ${Math.round(timeUntilExpiry / 60)} minutes`);
          
          // Only refresh if token will expire in the next 5 minutes
          if (timeUntilExpiry < (5 * 60)) {
            console.log('🔄 Attempting to refresh token...');
            const { token: newToken } = await authService.refreshToken();
            setIsAuthorized(!!newToken);
          }
        } catch (error) {
          console.error('❌ Error checking token expiration:', error);
          setIsAuthorized(false);
        }
      } else {
        // No token found, user is not authenticated
        setIsAuthorized(false);
      }
    }, Number(config.refreshTokenInterval)); 
  
    return () => clearInterval(interval);
  }, []);

  // Update isAuthorized when auth store changes
  useEffect(() => {
    const storedToken = getStoredToken();
    const authStoreToken = authStore.token;
    const hasToken = !!(storedToken || authStoreToken);
    setIsAuthorized(hasToken);
  }, [authStore.token]);

  return { isAuthorized };
}