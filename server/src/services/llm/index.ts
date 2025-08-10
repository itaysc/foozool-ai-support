import { LLMProvider, LLMRequest, LLMResponse, LLMProviderInterface } from './types';
import { TogetherAIProvider } from './together-ai.provider';
import { OpenAIProvider } from './openai.provider';
import { llmConfig, isProviderEnabled } from './config';

export class LLMService {
  private providers: Map<LLMProvider, LLMProviderInterface>;
  private defaultProvider: LLMProvider;

  constructor(defaultProvider?: LLMProvider) {
    this.providers = new Map();
    
    // Initialize only enabled providers
    if (isProviderEnabled(LLMProvider.TOGETHER_AI)) {
      this.providers.set(LLMProvider.TOGETHER_AI, new TogetherAIProvider());
    }
    
    if (isProviderEnabled(LLMProvider.OPENAI)) {
      this.providers.set(LLMProvider.OPENAI, new OpenAIProvider());
    }
    
    // Set default provider - fallback to OpenAI if Together AI is not available
    const requestedDefault = defaultProvider || llmConfig.defaultProvider;
    if (this.providers.has(requestedDefault)) {
      this.defaultProvider = requestedDefault;
    } else if (this.providers.has(LLMProvider.OPENAI)) {
      this.defaultProvider = LLMProvider.OPENAI;
      console.log(`⚠️ Together AI not available, falling back to OpenAI as default provider`);
    } else {
      throw new Error('No LLM providers are available. Please check your API keys.');
    }
    
    console.log(`🤖 LLM Service initialized with providers: ${Array.from(this.providers.keys()).join(', ')}`);
    console.log(`🤖 Default provider: ${this.defaultProvider}`);
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: LLMProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Get the default provider
   */
  getDefaultProvider(): LLMProvider {
    return this.defaultProvider;
  }

  /**
   * Register a custom provider
   */
  registerProvider(provider: LLMProviderInterface): void {
    this.providers.set(provider.getProviderName(), provider);
  }

  /**
   * Get a specific provider
   */
  getProvider(provider: LLMProvider): LLMProviderInterface | undefined {
    return this.providers.get(provider);
  }

  /**
   * Main callLLM function that routes to the appropriate provider
   */
  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    const providerName = request.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    console.log(`🔍 LLM Service Debug:`);
    console.log(`  - Requested provider: ${request.provider || 'default'}`);
    console.log(`  - Default provider: ${this.defaultProvider}`);
    console.log(`  - Selected provider: ${providerName}`);
    console.log(`  - Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    console.log(`  - Provider found: ${!!provider}`);

    if (!provider) {
      throw new Error(`Provider ${providerName} not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    try {
      console.log(`🤖 Using LLM provider: ${providerName}`);
      const response = await provider.callLLM(request);
      console.log(`✅ LLM response received from ${providerName} (${response.usage.totalTokens} tokens)`);
      return response;
    } catch (error) {
      console.error(`❌ Error with provider ${providerName}:`, error);
      
      // If the requested provider fails and fallback is enabled, try the default provider
      if (llmConfig.fallbackEnabled && request.provider && request.provider !== this.defaultProvider) {
        console.log(`🔄 Falling back to default provider: ${this.defaultProvider}`);
        const fallbackRequest = { ...request, provider: this.defaultProvider };
        return this.callLLM(fallbackRequest);
      }
      
      throw error;
    }
  }

  /**
   * Convenience method for Together AI
   */
  async callTogetherAI(request: Omit<LLMRequest, 'provider'>): Promise<LLMResponse> {
    return this.callLLM({ ...request, provider: LLMProvider.TOGETHER_AI });
  }

  /**
   * Convenience method for OpenAI
   */
  async callOpenAI(request: Omit<LLMRequest, 'provider'>): Promise<LLMResponse> {
    return this.callLLM({ ...request, provider: LLMProvider.OPENAI });
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: LLMProvider): boolean {
    return this.providers.has(provider);
  }
}

// Export the main function that maintains backward compatibility
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const llmService = new LLMService();
  return llmService.callLLM(request);
}

// Export types and providers for direct use
export * from './types';
export { TogetherAIProvider } from './together-ai.provider';
export { OpenAIProvider } from './openai.provider'; 