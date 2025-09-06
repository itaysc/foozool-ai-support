import { BotModel } from '../../schemas/bot.schema';
import { CreateBotRequest, IBot } from '../../types/bot';

export async function createBot(organizationId: string, createdByUserId: string, data: CreateBotRequest): Promise<IBot> {
  const bot = await BotModel.create({
    organizationId,
    name: data.name,
    type: data.type,
    createdByUserId,
  });
  return bot.toObject();
}

export async function getBots(organizationId: string): Promise<IBot[]> {
  const bots = await BotModel.find({ organizationId }).sort({ createdAt: -1 }).lean();
  return bots as IBot[];
}


