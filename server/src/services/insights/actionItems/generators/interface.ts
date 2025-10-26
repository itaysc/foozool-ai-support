import { GeneratedActionItem } from '../types';

// Minimal insight interface for type checking
export interface InsightForGenerator {
  insightType?: string;
  issueDescription?: string;
  ticketVolume?: number;
  growthRate?: number;
  metadata?: {
    type?: string;
    meta?: Record<string, unknown>;
  };
  npsData?: Record<string, unknown>;
  csatData?: Record<string, unknown>;
}

/**
 * Base interface for action item generators
 */
export interface IActionItemGenerator {
  /**
   * Check if this generator can handle the given insight
   */
  canHandle(insight: InsightForGenerator): boolean;
  
  /**
   * Generate action items for the given insight
   */
  generate(insight: InsightForGenerator): GeneratedActionItem[];
  
  /**
   * Get the insight types this generator supports
   */
  getSupportedInsightTypes(): string[];
}
