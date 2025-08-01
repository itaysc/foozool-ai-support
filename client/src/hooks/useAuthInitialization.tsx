import { useEffect } from 'react';
import authStore from '@/stores/auth.store';

export const useAuthInitialization = () => {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Check if auth is already initialized
        if (authStore.token && authStore.user) {
          console.log('✅ Authentication already initialized');
          return;
        }
        
        const isInitialized = await authStore.initializeAuth();
        
        if (isInitialized) {
          console.log('✅ Authentication initialized successfully');
        } else {
          console.log('ℹ️ No valid stored token found, user needs to login');
        }
      } catch (error) {
        console.error('❌ Error initializing authentication:', error);
      }
    };

    initializeAuth();
  }, []);

  return {
    isAuthenticated: !!(authStore.token && authStore.user),
    user: authStore.user
  };
}; 