import { SeedTrackModel, LLMUsageModel } from "src/schemas";
import { IUser } from "@common/types";

export async function seedLLMUsage(users: IUser[]): Promise<void> {
    try {
      const llmUsageSeeded = await SeedTrackModel.findOne({ name: 'llmUsage', status: 'completed' });
      if (llmUsageSeeded) {
        return;
      }
      await LLMUsageModel.insertMany(users.map(user => ({
        user: user._id,
        tokensPerCycle: 2000000,
        currentCycle: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cachedTokens: 0,
        },
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCachedTokens: 0,
      })));
      console.log(`Inserted ${users.length} LLM usages`);
      await SeedTrackModel.create({ name: 'llmUsage', date: new Date(), status: 'completed' });
    } catch (error) {
      console.error('Error seeding LLM usage:', error);
    } 
  }