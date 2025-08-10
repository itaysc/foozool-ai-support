# LLM Service

A robust, provider-agnostic LLM service that allows easy switching between different AI providers.

## Features

- **Multi-Provider Support**: Support for Together AI and OpenAI (easily extensible)
- **Automatic Fallback**: If one provider fails, automatically falls back to another
- **Backward Compatibility**: Existing `callLLM` function continues to work
- **Configuration Management**: Centralized configuration for all providers
- **Token Tracking**: Maintains existing token usage tracking
- **Error Handling**: Robust error handling with retry logic

## Architecture

```
services/llm/
├── index.ts              # Main service and exports
├── types.ts              # TypeScript interfaces and enums
├── config.ts             # Configuration management
├── together-ai.provider.ts # Together AI implementation
├── openai.provider.ts    # OpenAI implementation
├── example-usage.ts      # Usage examples
└── README.md            # This file
```

## Quick Start

### Basic Usage (Backward Compatible)

```typescript
import { callLLM } from '../services/llm';

const response = await callLLM({
  userId: 'user123',
  prompt: 'What is the capital of France?',
  // provider: LLMProvider.OPENAI // Optional: specify provider
});
```

### Advanced Usage

```typescript
import { LLMService, LLMProvider } from '../services/llm';

const llmService = new LLMService(LLMProvider.OPENAI);

const response = await llmService.callLLM({
  userId: 'user123',
  prompt: 'Explain quantum computing',
  isChat: true,
  systemMsg: 'You are a helpful teacher.',
  maxTokens: 500,
  provider: LLMProvider.TOGETHER_AI // Override default
});
```

## Configuration

### Environment Variables

```env
TOGETHER_API_KEY=your_together_ai_key
OPENAI_API_KEY=your_openai_key
```

### Provider Configuration

```typescript
import { llmConfig, setDefaultProvider } from '../services/llm/config';

// Set default provider
setDefaultProvider(LLMProvider.OPENAI);

// Check if provider is enabled
const isOpenAIAvailable = llmConfig.providers[LLMProvider.OPENAI].enabled;
```

## Available Providers

### Together AI
- **Default Model**: `meta-llama/Llama-3.3-70B-Instruct-Turbo`
- **Features**: Chat and completion modes
- **Token Tracking**: Full integration with existing token system

### OpenAI
- **Default Model**: `gpt-4o-mini`
- **Features**: Chat and completion modes
- **Token Tracking**: Basic token usage reporting

## Adding New Providers

1. Create a new provider file (e.g., `anthropic.provider.ts`)
2. Implement the `LLMProviderInterface`
3. Add provider configuration to `config.ts`
4. Register the provider in the `LLMService` constructor

Example:

```typescript
// anthropic.provider.ts
export class AnthropicProvider implements LLMProviderInterface {
  async callLLM(request: LLMRequest): Promise<LLMResponse> {
    // Implementation here
  }
  
  getProviderName(): LLMProvider {
    return LLMProvider.ANTHROPIC;
  }
}
```

## Error Handling

The service includes automatic fallback:

1. If a specific provider fails, it falls back to the default provider
2. If fallback is disabled, errors are thrown immediately
3. All errors are logged with provider information

## Token Usage

The service maintains compatibility with the existing token tracking system:

- Token usage is recorded for each request
- Usage limits are enforced
- Token counts are reported in responses

## Migration Guide

### From Old `callLLM`

**Before:**
```typescript
import { callLLM } from '../services/llm';

const response = await callLLM({
  userId: 'user123',
  prompt: 'Hello world',
  model: 'mistralai/Mistral-7B-Instruct-v0.1'
});
```

**After:**
```typescript
import { callLLM } from '../services/llm';

const response = await callLLM({
  userId: 'user123',
  prompt: 'Hello world'
  // model is now optional and defaults to the provider's default
});
```

### Adding Provider Selection

```typescript
import { callLLM, LLMProvider } from '../services/llm';

// Use OpenAI
const openaiResponse = await callLLM({
  userId: 'user123',
  prompt: 'Hello world',
  provider: LLMProvider.OPENAI
});

// Use Together AI (default)
const togetherResponse = await callLLM({
  userId: 'user123',
  prompt: 'Hello world',
  provider: LLMProvider.TOGETHER_AI
});
```

## Best Practices

1. **Use the default provider** unless you need specific features
2. **Enable fallback** for production environments
3. **Monitor token usage** across providers
4. **Handle errors gracefully** with fallback logic
5. **Use appropriate models** for your use case

## Troubleshooting

### Provider Not Available
- Check if the provider is enabled in configuration
- Verify API keys are set correctly
- Check provider-specific error messages

### Token Limits
- Monitor token usage across all providers
- Consider using smaller models for high-volume requests
- Implement caching for repeated requests

### Performance Issues
- Use appropriate models for your use case
- Consider provider-specific optimizations
- Monitor response times and adjust accordingly 