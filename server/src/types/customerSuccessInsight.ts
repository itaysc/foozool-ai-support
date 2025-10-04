// Customer Success Insight types
export interface CustomerSuccessInsight {
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
        'activity_trend_decline' | 'feature_discovery' | 'usage_pattern_anomaly';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic' | 'financial_risk' | 'opportunity';
  meta?: Record<string, any>;
}
