import React, { createContext, useContext, useEffect, useState } from 'react';
import authStore from '@/stores/auth.store';

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
      console.log('🔍 AuthContext: Checking authentication...');
      
      // Check if we have a valid token in the store
      if (authStore.token && authStore.user) {
        console.log('🔍 AuthContext: Valid token found in store');
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      // Try to initialize auth from stored token
      const isInitialized = await authStore.initializeAuth();
      
      if (isInitialized && authStore.token && authStore.user) {
        console.log('🔍 AuthContext: Auth initialized successfully');
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      // If still no valid auth, try server check
      const { isAuthorized } = await authStore.checkAuthorization();
      
      if (isAuthorized) {
        console.log('🔍 AuthContext: Server authorization successful');
        setIsAuthenticated(true);
        setUser(authStore.user);
        setIsLoading(false);
        return true;
      }
      
      console.log('🔍 AuthContext: No valid authentication found');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('❌ AuthContext: Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const login = async (payload: any) => {
    try {
      const result = await authStore.login(payload);
      if (result.isAuthorized) {
        setIsAuthenticated(true);
        setUser(authStore.user);
      }
      return result;
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authStore.signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('❌ AuthContext: Signout failed:', error);
      // Still clear local state even if server call fails
      setIsAuthenticated(false);
      setUser(null);
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