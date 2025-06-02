import { IProduct, IResponse, ZendeskTicket } from '@common/types';

// Re-export main functionality from specialized modules
export { cosineSimilarity } from './utils';
export { knnSearch, findZendeskSimilarTickets, type SimilarTicket } from './search';
export { generateMockProduct, extractProductFromTicket } from './product';
export { handleWebhook } from './webhook';

// Legacy exports for backward compatibility (if needed)
// These can be removed once all consumers are updated to use the new modular imports