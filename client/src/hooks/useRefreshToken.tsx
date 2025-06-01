import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/auth-service';
import config from '../config';
import { getStoredToken } from '../services/local-storage';

export const useRefreshToken = () => {
  const [isAuthorized, setIsAuthorized] = useState(true);
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = getStoredToken();
      if (token) {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp - currentTime < (5 * 60)) { // Check if token will expire in next 5 minutes
          const { refreshToken } = await authService.refreshToken();
          setIsAuthorized(!!refreshToken);
        }
      }
    }, Number(config.refreshTokenInterval)); 
  
    return () => clearInterval(interval);
  }, []);

  return { isAuthorized };
}