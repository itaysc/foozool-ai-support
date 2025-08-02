import { useEffect } from 'react';
import authStore from '@/stores/auth.store';

export const useAuthInitialization = () => {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Check if auth is already initialized
        if (authStore.user) {
          return;
        }
        
        await authStore.initializeAuth();
      } catch (error) {
        // Silent error handling
      }
    };

    initializeAuth();
  }, []);

  return {
    isAuthenticated: !!authStore.user,
    user: authStore.user
  };
}; 