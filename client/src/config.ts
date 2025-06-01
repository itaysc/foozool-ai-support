const config = {
    apiUrl: import.meta.env.VITE_API_URL,
    refreshTokenInterval: Number(import.meta.env.VITE_REFRESH_TOKEN_INTERVAL_MILLS) || 10 * 60 * 1000,
    useIntuitLogin: import.meta.env.VITE_USE_INTUIT_LOGIN === 'true',
  };
  
  export default config;