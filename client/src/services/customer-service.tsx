import { AxiosResponse } from 'axios';
import axios from '@/services/axios';
import config from '@/config';
import { ICustomer } from '@common/types';

const getRoute = (method: string) => {
  return `${config.apiUrl}/customers/${method}`;
}

class CustomerService{
  getCustomers = async(): Promise<ICustomer[]> => {
    const response: AxiosResponse<ICustomer[]> = await axios.get(getRoute(''));
    return response.data;
  }

  getCustomerById = async(customerId: string): Promise<ICustomer> => {
    const response: AxiosResponse<ICustomer> = await axios.get(getRoute(`${customerId}`));
    return response.data;
  }

  addCustomer = async(customer: ICustomer): Promise<ICustomer> => {
    const response: AxiosResponse<ICustomer> = await axios.post(getRoute(''), customer);
    return response.data;
  }

  updateCustomer = async(customerId: string, customer: ICustomer): Promise<ICustomer> => {
    const response: AxiosResponse<ICustomer> = await axios.put(getRoute(`${customerId}`), customer);
    return response.data;
  }

  deleteCustomer = async(customerId: string): Promise<ICustomer> => {
    const response: AxiosResponse<ICustomer> = await axios.delete(getRoute(`${customerId}`));
    return response.data;
  }
}
const customerService = new CustomerService();
export default customerService;