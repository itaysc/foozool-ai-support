import { AxiosResponse } from 'axios';
import axios from '@/services/axios';
import config from '@/config';
import { IOrganizationConfig } from '@common/types';

const getRoute = (method: string) => {
  return `${config.apiUrl}/config/${method}`;
}

class ConfigService{
  get = async(vendorId?: string): Promise<IOrganizationConfig> => {
    const response: AxiosResponse<IOrganizationConfig> = await axios.get(getRoute(''), { params: { vendorId } });
    return response.data;
  }

  getAll = async(): Promise<IOrganizationConfig[]> => {
    const response: AxiosResponse<IOrganizationConfig[]> = await axios.get(getRoute(''));
    return response.data;
  }
}
const configService = new ConfigService();
export default configService;