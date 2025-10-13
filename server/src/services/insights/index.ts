/**
 * Insights Service - Main Entry Point
 * 
 * This file serves as the main entry point for all insights-related services.
 * The implementation has been refactored into smaller, focused modules for better maintainability.
 */

// Re-export types
export * from './types';

// Re-export ticket cluster services
export { 
  getInsightsByOrganization,
  getInsightsSummary,
  getAllInsights
} from './ticketCluster.service';

// Re-export customer success insights services
export {
  getCustomerSuccessInsights,
  generateAndSaveCustomerSuccessInsights,
  getAllCustomerSuccessInsights
} from './customerSuccessInsights.service';

// Re-export meeting prep service
export {
  generateCustomerMeetingPrep
} from './meetingPrep.service';

// Re-export insight management services
export {
  updateInsightAssignee,
  updateInsightStatus
} from './insightManagement.service';

// Re-export unified insights service
export {
  getAllUnifiedInsights
} from './unifiedInsights.service';

// Re-export customer success generation (from subdirectory)
export { 
  generateCustomerSuccessInsights, 
  getSavedStakeholderInsights, 
  getAllSavedCustomerSuccessInsights 
} from './customer-success';

// Re-export prediction insights services
import { PredictionInsightsService } from './predictions.service';

/**
 * Get prediction insights for an organization
 */
export async function getPredictionInsights(organizationId: string, customerId?: string, limit: number = 20) {
  return await PredictionInsightsService.getPredictionInsightsByOrganization(organizationId, customerId, limit);
}

/**
 * Get prediction summary for an organization
 */
export async function getPredictionSummary(organizationId: string, customerId?: string) {
  return await PredictionInsightsService.getPredictionSummary(organizationId, customerId);
}

/**
 * Get high-risk prediction insights for an organization
 */
export async function getHighRiskPredictionInsights(organizationId: string, customerId?: string, limit: number = 50) {
  return await PredictionInsightsService.getHighRiskPredictionInsights(organizationId, customerId, limit);
}

/**
 * Get accuracy analysis for predictions
 */
export async function getPredictionAccuracyAnalysis(organizationId: string, days: number = 30) {
  return await PredictionInsightsService.getAccuracyAnalysis(organizationId, days);
}

/**
 * Save prediction as insight
 */
export async function savePredictionAsInsight(
  ticketId: string,
  organizationId: string,
  customerId: string | null,
  customerName: string | null,
  prediction: {
    predictedEscalation: { risk: "Low" | "Medium" | "High"; confidence: number };
    predictedCSAT: { risk: "Low" | "Medium" | "High"; confidence: number };
    longResolutionPredicted?: boolean;
    predictionConfidence?: number;
  }
) {
  return await PredictionInsightsService.savePredictionAsInsight(
    ticketId,
    organizationId,
    customerId,
    customerName,
    prediction
  );
}

/**
 * Migrate existing predictions to insights
 */
export async function migratePredictionsToInsights(organizationId: string) {
  return await PredictionInsightsService.migratePredictionsToInsights(organizationId);
}
