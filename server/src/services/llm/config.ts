import { LLMProvider } from './types';
import config from '../../config';

export interface LLMConfig {
  defaultProvider: LLMProvider;
  providers: {
    [LLMProvider.TOGETHER_AI]: {
      enabled: boolean;
      apiKey: string;
      defaultModel: string;
      maxTokens: number;
      temperature: number;
      topP: number;
    };
    [LLMProvider.OPENAI]: {
      enabled: boolean;
      apiKey: string;
      defaultModel: string;
      maxTokens: number;
      temperature: number;
      topP: number;
    };
  };
  fallbackEnabled: boolean;
  retryAttempts: number;
}

export const llmConfig: LLMConfig = {
  defaultProvider: LLMProvider.TOGETHER_AI,
  providers: {
    [LLMProvider.TOGETHER_AI]: {
      enabled: !!config.TOGETHER_API_KEY && config.TOGETHER_API_KEY.length > 0,
      apiKey: config.TOGETHER_API_KEY || '',
      defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      maxTokens: 300,
      temperature: 0.2,
      topP: 0.8
    },
    [LLMProvider.OPENAI]: {
      enabled: !!config.OPENAI_API_KEY && config.OPENAI_API_KEY.length > 0,
      apiKey: config.OPENAI_API_KEY || '',
      defaultModel: 'gpt-4o-mini',
      maxTokens: 300,
      temperature: 0.2,
      topP: 0.8
    }
  },
  fallbackEnabled: true,
  retryAttempts: 2
};

export function getProviderConfig(provider: LLMProvider) {
  return llmConfig.providers[provider];
}

export function isProviderEnabled(provider: LLMProvider): boolean {
  const providerConfig = getProviderConfig(provider);
  const isEnabled = providerConfig?.enabled && !!providerConfig.apiKey && providerConfig.apiKey.length > 0;
  console.log(`🔍 Provider ${provider} enabled: ${isEnabled} (enabled: ${providerConfig?.enabled}, hasKey: ${!!providerConfig?.apiKey}, keyLength: ${providerConfig?.apiKey?.length || 0})`);
  return isEnabled;
}

export function getDefaultProvider(): LLMProvider {
  return llmConfig.defaultProvider;
}

export function setDefaultProvider(provider: LLMProvider): void {
  llmConfig.defaultProvider = provider;
} 