// Common types used across the application

// Using string for ObjectId in frontend (since we don't have mongoose in frontend)
export type ObjectId = string;

// Re-export all other types
export * from './user';
export * from './ticket';
export * from './token';
export * from './autonomousAI';
export * from './LLMUsage';
export * from './organization';
export * from './product';
export * from './response';
export * from './webhook';
export * from './insights';
export * from './LLMPrice';
export * from './agentSuggestion';
export * from './esTicket';
export * from './region';