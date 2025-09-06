import axios from '@/services/axios';
import config from '@/config';
import { BotDto, CreateBotRequestDto } from '@/types/bot';

const getRoute = (endpoint: string) => `${config.apiUrl}/${endpoint}`;

export const botsService = {
  async list(): Promise<BotDto[]> {
    const res = await axios.get(getRoute('bots'));
    return res.data.payload as BotDto[];
  },
  async create(payload: CreateBotRequestDto): Promise<BotDto> {
    const res = await axios.post(getRoute('bots'), payload);
    return res.data.payload as BotDto;
  },
};

export default botsService;


