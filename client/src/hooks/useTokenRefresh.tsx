import { useEffect, useRef } from 'react';
import { refreshToken } from '@/services/axios';
import { useAuth } from '@/context/auth.context';

export const useTokenRefresh = () => {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only set up refresh if user is authenticated
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Refresh token every 10 minutes (access token expires in 15 minutes)
    intervalRef.current = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        // Silent error handling - if refresh fails, user will be redirected on next 401
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated]);
}; 