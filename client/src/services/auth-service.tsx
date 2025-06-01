import { AxiosResponse } from 'axios';
import axios, { refreshToken as _refreshToken } from '@/services/axios';
import config from '@/config';
import { getStoredToken } from '@/services/local-storage';
import { decodeToken } from '@/utils';
import { IUser } from '@common/types';

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
    return _refreshToken();
  }
  checkAuthorization = async () => {
    const payload = getStoredToken();
    const response = await axios.get(getRoute('isAuthorized'));
    return {
      isAuthorized: response.data.isAuthorized,
      token: payload,
      user: decodeToken(payload)?.user,
    };
  }
}
const authService = new AuthService();
export default authService;