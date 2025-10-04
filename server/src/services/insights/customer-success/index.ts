// Customer Success Insights - Main Entry Point
export { generateCustomerSuccessInsights, generateCustomerSuccessInsightsForOrganization, getSavedStakeholderInsights, getAllSavedCustomerSuccessInsights } from './main.service';

// Individual Insight Generators
export { generateFinancialRiskAlerts } from './financial-risk.service';
export { generateUserEngagementInsights } from './user-engagement.service';
export { generateRiskAlerts } from './risk-alerts.service';
export { generateUpsellOpportunities } from './upsell-opportunities.service';
export { generateCustomerSuccessPrep } from './success-prep.service';
export { generateStrategicInsights } from './strategic-insights.service';

// Utility Functions
export { groupActivitiesBySolution, getExpectedPaymentDays } from './utils';
