/**
 * Utility functions for handling cookies on the client side
 * Note: We're now using httpOnly cookies for JWT authentication (set by server)
 */

/**
 * Clear a specific cookie by setting its expiration to the past
 */
export const clearCookie = (name: string, path: string = '/'): void => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

/**
 * Clear all authentication-related cookies
 * Note: This is mainly for client-side cleanup, server handles most cookie management
 */
export const clearAuthCookies = (): void => {
  
  // Clear any auth cookies that might exist with different paths and domains
  const cookieNames = ['accessToken', 'refreshToken', 'foozool-jwt', 'jwt'];
  const paths = ['/', '/auth', '/api'];
  
  cookieNames.forEach(name => {
    paths.forEach(path => {
      clearCookie(name, path);
    });
    
    // Also try to clear without specifying path (uses current path)
    clearCookie(name);
  });
  
  // Force clear by setting empty value with immediate expiration
  cookieNames.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/auth;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api;`;
  });
  
  console.log('🧹 Finished clearing auth cookies...');
}; 