import { AxiosResponse } from 'axios';
import { runInAction } from 'mobx';
import { refreshToken as _refreshToken } from '@/services/axios';
import configuredAxios from '@/services/axios';
import config from '@/config';
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
  intuitAuthUri: string
  status: number,
}
class AuthService{
  login = async(payload: AuthRequestPayload): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await configuredAxios.post(getRoute('token'), {
      email: payload.email,
      password: payload.password,
    });
    return {
      user: response.data.user,
      intuitAuthUri: response.data.intuitAuthUri || '',
      status: response.status,
    };
  }
  signout = async() => {
    const response: AxiosResponse= await configuredAxios.get(getRoute('signout'), {});
    return response.data;
  }
  refreshToken = async() => {
    try {
      const result = await _refreshToken();
      if (result.success === true) {
        // Get user info from the server since we don't have token in response
        const authCheck = await this.checkAuthorization();
        if (authCheck.isAuthorized && authCheck.user) {
          runInAction(() => {
            authStore.user = authCheck.user;
          });
        }
      }
      return result;
    } catch (error) {
      return { success: false };
    }
  }
  checkAuthorization = async () => {
    // Use the configured axios instance that automatically sends cookies
    const response = await configuredAxios.get(getRoute('isAuthorized'));
    
    return {
      isAuthorized: response.data.isAuthorized,
      user: response.data.user,
    };
  }
}
const authService = new AuthService();
export default authService;