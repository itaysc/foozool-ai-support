// Enhanced Recurring Problems Service - Main Export
export { generateEnhancedRecurringProblemsInsights } from './enhancedRecurringProblems.service';

// Export types for use in other services
export type {
  EnhancedRecurringProblem,
  ProblemCluster,
  ProblemTheme,
  EvidenceLink,
} from './types';

// Export constants
export { ENHANCED_THRESHOLDS } from './types';
