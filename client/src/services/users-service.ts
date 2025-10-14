import axios from '@/services/axios';
import config from '@/config';
import { IUser } from '@/types/user';

const getRoute = (endpoint: string) => `${config.apiUrl}/${endpoint}`;

export const usersService = {
  async getUsersList(): Promise<IUser[]> {
    const res = await axios.get(getRoute('users'));
    // The server returns the users array directly, not wrapped in payload
    return res.data as IUser[];
  },
};

export default usersService;

