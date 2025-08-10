export enum LLMProvider {
  TOGETHER_AI = 'together_ai',
  OPENAI = 'openai'
}

export interface LLMRequest {
  userId: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
  isChat?: boolean;
  systemMsg?: string;
  provider?: LLMProvider;
}

export interface LLMResponse {
  data: string | null;
  model: string;
  isOutOfTokens: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: LLMProvider;
}

export interface LLMProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface LLMProviderInterface {
  callLLM(request: LLMRequest): Promise<LLMResponse>;
  getProviderName(): LLMProvider;
} 