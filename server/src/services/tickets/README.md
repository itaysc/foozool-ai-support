# Tickets Service

This service handles ticket processing, search, and webhook operations. The code has been organized into specialized modules for better maintainability and separation of concerns.

## Structure

```
tickets/
├── index.ts          # Main entry point with re-exports
├── utils.ts          # Utility functions (cosine similarity, etc.)
├── search.ts         # Ticket search functionality (KNN, similar tickets)
├── product.ts        # Product-related operations
├── webhook.ts        # Webhook processing logic
├── prompts.ts        # Prompt building functions
└── README.md         # This documentation
```

## Modules

### `utils.ts`
Contains utility functions used across the service:
- `cosineSimilarity()` - Calculate cosine similarity between vectors

### `search.ts`
Handles all ticket search operations:
- `knnSearch()` - Performs KNN search using Elasticsearch
- `findZendeskSimilarTickets()` - Finds similar tickets using SBERT embeddings and BM25
- `SimilarTicket` type - Type definition for tickets with similarity scores

### `product.ts`
Manages product-related functionality:
- `generateMockProduct()` - Creates mock product data for testing
- `extractProductFromTicket()` - Extract product info from tickets using LLM (currently disabled)

### `webhook.ts`
Main webhook processing logic:
- `handleWebhook()` - Main entry point for processing Zendesk webhooks
- Internal helper functions for intent processing, response generation, and ticket saving

### `prompts.ts`
Contains prompt building functions for LLM interactions (existing file)

## Usage

```typescript
import { handleWebhook, findZendeskSimilarTickets, cosineSimilarity } from './services/tickets';

// Process a webhook
const result = await handleWebhook(userId, zendeskTicket);

// Find similar tickets
const similar = await findZendeskSimilarTickets({
  ticket: { subject: "...", description: "..." },
  k: 5,
  useBM25: false
});

// Calculate similarity
const similarity = cosineSimilarity(vectorA, vectorB);
```

## Benefits of this structure

1. **Separation of Concerns**: Each module has a single responsibility
2. **Maintainability**: Easier to locate and modify specific functionality
3. **Testability**: Each module can be tested independently
4. **Reusability**: Functions can be imported individually as needed
5. **Readability**: Smaller, focused files are easier to understand
6. **Backward Compatibility**: Main functionality is still available through index.ts exports

## Migration Notes

- All existing imports from the main index.ts will continue to work
- New code should import from specific modules when possible
- Commented-out functionality has been preserved and can be re-enabled as needed
- Database save operations are currently commented out (same as original) 