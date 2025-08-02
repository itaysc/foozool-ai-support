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
  // Clear any auth cookies that might exist
  clearCookie('accessToken');
  clearCookie('accessToken', '/');
  clearCookie('refreshToken');
  clearCookie('refreshToken', '/');
  clearCookie('foozool-jwt');
  clearCookie('foozool-jwt', '/');
  

}; 