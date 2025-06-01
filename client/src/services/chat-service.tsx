import { AxiosResponse } from 'axios';
import axios from '@/services/axios';
import config from '@/config';
import { IChatResponse, ILLMPrices } from '@common/types';
import { getDataFromLocalStorage } from '@/services/local-storage';
const getRoute = (method: string) => {
  return `${config.apiUrl}/chat/${method}`;
}

class ChatService{
  sendMessage = async(message: string): Promise<IChatResponse> => {
    const model = getDataFromLocalStorage('selectedModel');
    const response: AxiosResponse<IChatResponse> = await axios.post(getRoute(''), { message, model });
    return response.data;
  }

  getSupportedModels = async(): Promise<ILLMPrices[]> => {
    const response: AxiosResponse<ILLMPrices[]> = await axios.get(getRoute('supported-models'));
    return response.data;
  }
}
const chatService = new ChatService();
export default chatService;