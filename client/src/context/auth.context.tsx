import React, { createContext, useContext, useEffect, useState } from 'react';
import authStore from '@/stores/auth.store';
import { clearAuthCookies } from '@/utils/cookies';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  login: (payload: any) => Promise<any>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);



  const checkAuth = async (): Promise<boolean> => {
    try {
      // Check if we have a valid user in the store
      if (authStore.user) {
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      // Try to initialize auth from cookies
      const isInitialized = await authStore.initializeAuth();
      
      if (isInitialized && authStore.user) {
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      // If still no valid auth, try server check
      const { isAuthorized } = await authStore.checkAuthorization();
      
      if (isAuthorized) {
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (payload: any) => {
    try {
      console.log('🔄 Starting login process...');
      const result = await authStore.login(payload);
      
      if (result.isAuthorized) {
        console.log('✅ Login successful, setting auth state...');
        setIsAuthenticated(true);
        setUser(authStore.user);
        console.log('✅ User data set in context:', authStore.user);
        console.log('✅ Organization data:', authStore.user?.organization);
      }
      return result;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Starting sign out process...');
      
      // Call server signout endpoint to clear server-side cookies
      await authStore.signOut();
      console.log('✅ Server signout completed');
      
      // Clear client-side cookies as backup
      clearAuthCookies();
      console.log('✅ Client-side cookies cleared');
      
      // Clear local state
      setIsAuthenticated(false);
      setUser(null);
      console.log('✅ Local auth state cleared');
      
      // Force a page reload to ensure all cookies are cleared
      // This is a fallback to handle any edge cases
      console.log('🔄 Scheduling page reload in 100ms...');
      setTimeout(() => {
        console.log('🔄 Reloading page...');
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      
      // Still clear local state and cookies even if server call fails
      clearAuthCookies();
      setIsAuthenticated(false);
      setUser(null);
      console.log('✅ Fallback cleanup completed');
      
      // Force reload even on error
      console.log('🔄 Scheduling page reload on error in 100ms...');
      setTimeout(() => {
        console.log('🔄 Reloading page due to error...');
        window.location.reload();
      }, 100);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    signOut,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 