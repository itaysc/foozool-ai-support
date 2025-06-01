import { AxiosResponse } from 'axios';
import axios from '@/services/axios';
import config from '@/config';
import { IInvoice } from '@common/types';
const getRoute = (method: string) => {
  return `${config.apiUrl}/invoice/${method}`;
}

class InvoiceService{
  autofill = async(invoice: File): Promise<IInvoice> => {
    const formData = new FormData();
    formData.append('invoice', invoice);
    const response: AxiosResponse<IInvoice> = await axios.post(getRoute('autofill'), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  create = async(invoice: IInvoice): Promise<IInvoice> => {
    const response: AxiosResponse<IInvoice> = await axios.post(getRoute(''), invoice);
    return response.data;
  }

  getTags = async(): Promise<string[]> => {
    const response: AxiosResponse<string[]> = await axios.get(getRoute('tags'));
    return response.data;
  }
}
const invoiceService = new InvoiceService();
export default invoiceService;