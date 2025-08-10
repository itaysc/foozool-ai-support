import { LLMProvider, LLMRequest, LLMResponse, LLMProviderInterface } from './types';
import OpenAI from 'openai';
import config from '../../config';

export class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;
  private config: {
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    topP: number;
  };

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || config.OPENAI_API_KEY,
    });

    this.config = {
      defaultModel: 'gpt-4o-mini',
      maxTokens: 300,
      temperature: 0.2,
      topP: 0.8
    };
  }

  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    try {
      const model = request.model || this.config.defaultModel;
      const maxTokens = request.maxTokens || this.config.maxTokens;
      const temperature = request.temperature || this.config.temperature;
      const topP = request.topP || this.config.topP;

      let response: any;

      if (request.isChat) {
        // Chat completion
        const messages: any[] = [];
        
        if (request.systemMsg) {
          messages.push({ role: 'system', content: request.systemMsg });
        }
        
        messages.push({ role: 'user', content: request.prompt });

        response = await this.client.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop: request.stop
        });

        return {
          data: response.choices[0]?.message?.content?.trim() || null,
          model: response.model,
          isOutOfTokens: false, // OpenAI handles this differently
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          provider: LLMProvider.OPENAI
        };
      } else {
        // Text completion (deprecated but still supported)
        response = await this.client.completions.create({
          model,
          prompt: request.prompt,
          max_tokens: maxTokens,
          temperature,
          top_p: topP,
          stop: request.stop
        });

        return {
          data: response.choices[0]?.text?.trim() || null,
          model: response.model,
          isOutOfTokens: false,
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          },
          provider: LLMProvider.OPENAI
        };
      }
    } catch (error) {
      console.error('OpenAI provider error:', error);
      throw error;
    }
  }

  getProviderName(): LLMProvider {
    return LLMProvider.OPENAI;
  }
} 