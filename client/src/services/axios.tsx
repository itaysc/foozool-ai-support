import axios from 'axios';
import { getStoredToken, setStoredToken } from './local-storage';
import config from '../config';

const instance = axios.create({
  withCredentials: true,
  // baseURL: BASE_URL
});

export async function refreshToken(){
  try {
    const response = await instance.post(`${config.apiUrl}/auth/refresh-token`, {});
    const { refreshToken } = response.data;
    console.log(`received full refresh-token ${refreshToken}`);
    setStoredToken(refreshToken);
    return { refreshToken };
  } catch (err) {
    console.log(err);
    return { refreshToken: null };
  }
}

instance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to refresh token on 401 response
instance.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    const refreshRes = await refreshToken();
    if (!refreshRes) {
      return Promise.reject(error);
    }
    const { refreshToken: token } = await refreshRes;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return instance(originalRequest);
  }
  return Promise.reject(error);
});

export default instance;