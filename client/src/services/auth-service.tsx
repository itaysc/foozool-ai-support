import { AxiosResponse } from 'axios';
import axios from 'axios';
import { runInAction } from 'mobx';
import { refreshToken as _refreshToken } from '@/services/axios';
import configuredAxios from '@/services/axios';
import config from '@/config';
import { getStoredToken } from '@/services/local-storage';
import { decodeToken } from '@/utils';
import { IUser } from '@/types';
import authStore from '@/stores/auth.store';

const getRoute = (method: string) => {
  return `${config.apiUrl}/auth/${method}`;
}
export interface AuthRequestPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  user: IUser,
  token: string,
  intuitAuthUri: string
  status: number,
}
class AuthService{
  login = async(payload: AuthRequestPayload): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await axios.post(getRoute('token'), {
      email: payload.email,
      password: payload.password,
    });
    return {
      user: response.data.user,
      token: response.data.token,
      intuitAuthUri: response.data.intuitAuthUri,
      status: response.status,
    };
  }
  signout = async() => {
    const response: AxiosResponse= await axios.get(getRoute('signout'), {});
    return response.data;
  }
  refreshToken = async() => {
    try {
      const result = await _refreshToken();
      if (result.token) {
        // Update the auth store directly without calling its refreshToken method
        const decodedToken = decodeToken(result.token);
        runInAction(() => {
          authStore.token = result.token;
          authStore.user = decodedToken?.user;
        });
        console.log('✅ Token refreshed and auth store updated');
      }
      return result;
    } catch (error) {
      console.error('❌ Error in auth service refresh token:', error);
      return { token: null };
    }
  }
  checkAuthorization = async () => {
    const payload = getStoredToken();
    console.log('🔍 Checking authorization with token:', payload ? 'present' : 'missing');
    
    // Use the configured axios instance that includes Authorization header
    const response = await configuredAxios.get(getRoute('isAuthorized'));
    console.log('🔍 Authorization response:', response.data);
    
    return {
      isAuthorized: response.data.isAuthorized,
      token: payload,
      user: decodeToken(payload)?.user,
    };
  }
}
const authService = new AuthService();
export default authService;