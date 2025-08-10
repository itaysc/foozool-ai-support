import { LLMService, LLMProvider, callLLM } from './index';

// Example 1: Using the main callLLM function (backward compatible)
async function example1() {
  const response = await callLLM({
    userId: 'user123',
    prompt: 'What is the capital of France?',
    provider: LLMProvider.TOGETHER_AI // Optional: specify provider
  });
  
  console.log('Response:', response.data);
  console.log('Provider used:', response.provider);
  console.log('Tokens used:', response.usage.totalTokens);
}

// Example 2: Using the LLMService class for more control
async function example2() {
  const llmService = new LLMService(LLMProvider.OPENAI); // Set default provider
  
  const response = await llmService.callLLM({
    userId: 'user123',
    prompt: 'Explain quantum computing in simple terms',
    isChat: true,
    systemMsg: 'You are a helpful science teacher.',
    maxTokens: 500
  });
  
  console.log('Response:', response.data);
  console.log('Provider used:', response.provider);
}

// Example 3: Using convenience methods
async function example3() {
  const llmService = new LLMService();
  
  // Use Together AI specifically
  const togetherResponse = await llmService.callTogetherAI({
    userId: 'user123',
    prompt: 'Write a short poem about coding',
    maxTokens: 200
  });
  
  // Use OpenAI specifically
  const openaiResponse = await llmService.callOpenAI({
    userId: 'user123',
    prompt: 'Translate "Hello world" to Spanish',
    isChat: true
  });
  
  console.log('Together AI response:', togetherResponse.data);
  console.log('OpenAI response:', openaiResponse.data);
}

// Example 4: Provider management
async function example4() {
  const llmService = new LLMService();
  
  // Check available providers
  const availableProviders = llmService.getAvailableProviders();
  console.log('Available providers:', availableProviders);
  
  // Change default provider
  llmService.setDefaultProvider(LLMProvider.OPENAI);
  
  // Check if a provider is available
  const isOpenAIAvailable = llmService.isProviderAvailable(LLMProvider.OPENAI);
  console.log('OpenAI available:', isOpenAIAvailable);
}

// Example 5: Error handling with fallback
async function example5() {
  const llmService = new LLMService();
  
  try {
    // This will try OpenAI first, then fallback to Together AI if OpenAI fails
    const response = await llmService.callLLM({
      userId: 'user123',
      prompt: 'What is machine learning?',
      provider: LLMProvider.OPENAI
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('All providers failed:', error);
  }
}

export {
  example1,
  example2,
  example3,
  example4,
  example5
}; 