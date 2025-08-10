import { LLMProvider, LLMRequest, LLMResponse, LLMProviderInterface } from './types';
import Together from 'together-ai';
import config from '../../config';
import { LLMUsageModel } from '../../schemas';
import { ILLMUsage } from 'src/types';

export class TogetherAIProvider implements LLMProviderInterface {
  private together: Together;
  private config: {
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    topP: number;
  };

  constructor(providerConfig?: Partial<{
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    topP: number;
  }>) {
    console.log(`🔧 Together AI Provider: Initializing with API key length: ${config.TOGETHER_API_KEY?.length || 0}`);
    this.together = new Together({ apiKey: config.TOGETHER_API_KEY });
    this.config = {
      defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      maxTokens: 300,
      temperature: 0.2,
      topP: 0.8,
      ...providerConfig
    };
    console.log(`🔧 Together AI Provider: Initialized successfully`);
  }

  private async getRemainingTokens(userId: string): Promise<{ remainingTokens: number, record: ILLMUsage | null }> {
    console.log(`🔧 Together AI Provider: Checking tokens for user ${userId}`);
    
    const usage: ILLMUsage | null = await LLMUsageModel.findOne({ user: userId });
    console.log(`🔧 Together AI Provider: Found usage record: ${!!usage}`);
    
    if (!usage) {
      console.log(`🔧 Together AI Provider: No usage record found for user ${userId}, creating default record`);
      // Create a default usage record if none exists
      const defaultUsage = new LLMUsageModel({
        user: userId,
        tokensPerCycle: 10000, // Default token limit
        currentCycle: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCachedTokens: 0,
      });
      
      try {
        await defaultUsage.save();
        console.log(`🔧 Together AI Provider: Created default usage record for user ${userId}`);
        return { remainingTokens: 10000, record: defaultUsage };
      } catch (error) {
        console.error(`🔧 Together AI Provider: Failed to create usage record:`, error);
        // If we can't create a record, still allow the call but with limited tokens
        return { remainingTokens: 1000, record: null };
      }
    }
    
    const { tokensPerCycle, totalPromptTokens, totalCompletionTokens, totalTokens, totalCachedTokens } = usage;
    const remainingTokens = tokensPerCycle - (totalPromptTokens + totalCompletionTokens);
    console.log(`🔧 Together AI Provider: User ${userId} has ${remainingTokens} tokens remaining`);
    
    return { remainingTokens, record: usage };
  }

  private async recordUsage(record: ILLMUsage, userId: string, usage: any) {
    await LLMUsageModel.updateOne({ user: userId }, 
      {
        $set: {
          currentCycle: {
            promptTokens: record.currentCycle.promptTokens + usage.usage.promptTokens,
            completionTokens: record.currentCycle.completionTokens + usage.usage.completionTokens,
            totalTokens: record.currentCycle.totalTokens + usage.usage.totalTokens,
          },
          totalPromptTokens: record.totalPromptTokens + usage.usage.promptTokens,
          totalCompletionTokens: record.totalCompletionTokens + usage.usage.completionTokens,
          totalTokens: record.totalTokens + usage.usage.totalTokens,
        },
      }
    );
  }

  private getEmptyResponse(isOutOfTokens: boolean): LLMResponse {
    return {
      data: null,
      model: '',
      isOutOfTokens,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      provider: LLMProvider.TOGETHER_AI
    };
  }

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    try {
      console.log(`🔧 Together AI Provider: Starting callLLM for user ${request.userId}`);
      
      const { remainingTokens, record: usageRecord } = await this.getRemainingTokens(request.userId);
      console.log(`🔧 Together AI Provider: Remaining tokens: ${remainingTokens}, has record: ${!!usageRecord}`);
      
      if (remainingTokens <= 0) {
        console.log(`🔧 Together AI Provider: No tokens remaining, returning empty response`);
        return this.getEmptyResponse(true);
      }
      
      if (!usageRecord) {
        console.log(`🔧 Together AI Provider: No usage record, but proceeding with limited tokens`);
      }

      const model = request.model || this.config.defaultModel;
      const maxTokens = request.maxTokens || this.config.maxTokens;
      const temperature = request.temperature || this.config.temperature;
      const topP = request.topP || this.config.topP;
      const stop = request.stop || ['\n\n'];

      let response: any;

      if (request.isChat) {
        // Chat completion
        const messages: any[] = [];
        if (request.systemMsg) {
          messages.push({ role: 'system' as const, content: request.systemMsg });
        }
        messages.push({ role: 'user' as const, content: request.prompt });
        
        response = await this.together.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop,
        });

        const llmResponse: LLMResponse = {
          data: response.choices[0]?.message?.content?.trim() ?? null,
          model: response.model,
          isOutOfTokens: false,
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
          provider: LLMProvider.TOGETHER_AI
        };

        // Record usage if we have a record
        if (usageRecord) {
          this.recordUsage(usageRecord, request.userId, llmResponse);
        }
        
        return llmResponse;
      } else {
        // Text completion
        response = await this.together.completions.create({
          model,
          prompt: request.prompt,
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop,
        });

        const llmResponse: LLMResponse = {
          data: response.choices[0]?.text?.trim() ?? null,
          model: response.model,
          isOutOfTokens: false,
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
          provider: LLMProvider.TOGETHER_AI
        };

        // Record usage if we have a record
        if (usageRecord) {
          this.recordUsage(usageRecord, request.userId, llmResponse);
        }
        
        return llmResponse;
      }
    } catch (error) {
      console.error('Together AI provider error:', error);
      throw error;
    }
  }

  getProviderName(): LLMProvider {
    return LLMProvider.TOGETHER_AI;
  }
} 