import { useEffect, useState } from 'react';
import authService from '../services/auth-service';
import config from '../config';

export const useRefreshToken = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authorization status on mount
    checkAuthStatus();

    // Set up interval to check auth status periodically
    const interval = setInterval(checkAuthStatus, Number(config.refreshTokenInterval));
    
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { isAuthorized: authStatus } = await authService.checkAuthorization();
      setIsAuthorized(authStatus);
    } catch (error) {
      console.error('❌ Error checking authorization status:', error);
      setIsAuthorized(false);
    }
  };

  return { isAuthorized };
}