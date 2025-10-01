// Data Intelligence Types

export interface HealthScoreFactors {
  supportHealth: {
    score: number;
    factors: {
      ticketVolume: number;
      avgSentiment: number;
      escalationRate: number;
      resolutionTime: number;
      csatRisk: number;
    };
  };
  engagementHealth: {
    score: number;
    factors: {
      stakeholderEngagement: number;
      meetingFrequency: number;
      featureAdoption: number;
      responseTime: number;
    };
  };
  businessHealth: {
    score: number;
    factors: {
      contractValue: number;
      usageGrowth: number;
      renewalRisk: number;
      expansionOpportunity: number;
    };
  };
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface DataIntelligenceMetrics {
  portfolio: {
    totalCustomers: number;
    healthyCustomers: number;
    atRiskCustomers: number;
    criticalCustomers: number;
    averageHealthScore: number;
  };
  supportIntelligence: {
    totalTickets: number;
    avgResolutionTime: number;
    escalationRate: number;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    topIssues: Array<{
      issue: string;
      frequency: number;
      impact: 'high' | 'medium' | 'low';
    }>;
  };
  predictiveInsights: {
    churnRisk: {
      high: number;
      medium: number;
      low: number;
    };
    expansionOpportunities: number;
    upcomingRenewals: number;
    supportLoadForecast: {
      nextWeek: number;
      nextMonth: number;
    };
  };
  businessImpact: {
    totalContractValue: number;
    atRiskRevenue: number;
    expansionPotential: number;
    customerLifetimeValue: number;
  };
}

export interface CustomerHealthScore {
  customerId: string;
  customerName: string;
  segment: string;
  contractValue: number;
  healthScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface HealthScoresResponse {
  customers: CustomerHealthScore[];
  summary: {
    total: number;
    healthy: number;
    atRisk: number;
    critical: number;
    averageScore: number;
  };
}

export interface PredictiveInsights {
  totalPredictions: number;
  escalationRisk: {
    high: number;
    percentage: number;
  };
  csatRisk: {
    high: number;
    percentage: number;
  };
  resolutionTime: {
    longResolution: number;
    percentage: number;
  };
  recentPredictions: Array<{
    ticketId: string;
    escalationRisk: string;
    csatRisk: string;
    longResolution: boolean;
    confidence: number;
    createdAt: string;
  }>;
}

export interface CustomerDataIntelligence {
  healthScore: HealthScoreFactors;
  ticketAnalytics: any;
  predictiveInsights: any[];
  recommendations: string[];
}
