// Customer Success Insight types
export interface CustomerSuccessInsight {
  type: 'declining_activity' | 'inactive_customer' | 'low_utilization' | 'one_solution_dependency' | 
        'high_utilization' | 'solution_gap' | 'increasing_usage' | 'top_solution' | 'adoption_milestones' | 
        'seasonality' | 'correlation_to_value' | 'renewal_warning' |
        'high_ticket_volume' | 'escalating_issues' | 'sentiment_decline' | 'recurring_problems' | 
        'resolution_delays' | 'support_patterns' | 'urgent_trends' | 'positive_feedback' | 
        'technical_debt' | 'user_experience_issues' | 'integration_problems' | 'performance_concerns';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic';
  meta?: Record<string, any>;
}

export interface CustomerSuccessInsightsResponse {
  success: boolean;
  insights: CustomerSuccessInsight[];
  customerId: string;
  customerName?: string;
}
