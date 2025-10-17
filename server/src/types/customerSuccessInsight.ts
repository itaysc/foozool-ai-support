// Customer Success Insight types
export interface CustomerSuccessInsight {
  id?: string; // Database ID of the insight
  type: 'declining_activity' | 'inactive_customer' | 'low_utilization' | 'one_solution_dependency' | 
        'high_utilization' | 'solution_gap' | 'increasing_usage' | 'top_solution' | 'adoption_milestones' | 
        'seasonality' | 'correlation_to_value' | 'renewal_warning' |
        'high_ticket_volume' | 'escalating_issues' | 'sentiment_decline' | 'recurring_problems' | 
        'resolution_delays' | 'support_patterns' | 'urgent_trends' | 'positive_feedback' | 
        'technical_debt' | 'user_experience_issues' | 'integration_problems' | 'performance_concerns' |
        // Stakeholder-specific insight types
        'stakeholder_disengagement' | 'key_stakeholder_risk' | 'influence_concentration' | 
        'engagement_trends' | 'decision_maker_activity' | 'technical_adoption_barriers' |
        'stakeholder_influence_opportunity' | 'cross_departmental_engagement' | 'stakeholder_churn_risk' |
        'influencer_expansion_opportunity' | 'stakeholder_health_decline' | 'new_stakeholder_momentum' |
        'stakeholder_training_opportunity' | 'decision_power_shift' | 'stakeholder_engagement_gap' |
        // Contact frequency analysis
        'contact_frequency_gap' | 'over_contact_risk' | 'under_contact_risk' |
        // Engagement velocity tracking
        'engagement_velocity_decline' | 'engagement_velocity_increase' | 'engagement_momentum_shift' |
        // Departmental health analysis
        'department_engagement_health' | 'department_adoption_gaps' | 'cross_department_silos' |
        // Role-based insights
        'role_engagement_patterns' | 'role_adoption_barriers' | 'role_influence_distribution' |
        // Financial risk insights
        'outstanding_balance' | 'payment_reliability' | 'contract_renewal' | 'credit_score' | 
        'payment_delay' | 'revenue_growth' |
        // User engagement insights
        'user_adoption' | 'power_users' | 'solution_adoption' | 'role_engagement' | 'session_engagement' |
        'activity_trend_decline' | 'feature_discovery' | 'usage_pattern_anomaly' |
        // Health score risk insights
        'health_score_at_risk' |
        // Success criteria insights
        'critical_metric_underperformance' | 'high_metric_underperformance' | 'metric_exceeding_target' |
        'kpi_underperformance' | 'nps_below_target' | 'csat_below_target' | 'custom_satisfaction_metric_below_target' |
        // Capacity growth insights
        'storage_capacity_critical' | 'storage_capacity_warning' | 'user_capacity_critical' | 'user_growth_planning' |
        'transaction_capacity_warning' | 'api_capacity_growth_planning' | 'upgrade_approaching' | 'upgrade_overdue' |
        'significant_growth_projection' | 'constraint_resolution_approaching' | 'ongoing_high_impact_constraint';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic' | 'financial_risk' | 'opportunity' | 'success_criteria' | 'capacity_planning' | 'capacity_risk' | 'resource_management';
  meta?: Record<string, any>;
  assignee?: string; // Optional user ID assigned to handle this insight
  status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened'; // Jira-like status
  createdAt?: string; // Creation date in ISO string format
  customerId?: string; // Customer ID this insight belongs to
  customerName?: string; // Customer name for display
  guidance?: EnhancedInsightGuidance; // Enhanced guidance for actionable insights
  evidence?: {
    supportingData?: Record<string, any>;
    relatedLinks?: Array<{ title: string; url: string }>;
  }; // Evidence and supporting data
}

// Enhanced guidance interface for better insight actionability
export interface EnhancedInsightGuidance {
  summary: string;
  whyItMatters: string;
  signals?: string[];
  recommendedActions: string[];
  investigationPath?: string[];
  considerations?: string[];
  owner: string;
  sla: {
    name: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
  };
}
