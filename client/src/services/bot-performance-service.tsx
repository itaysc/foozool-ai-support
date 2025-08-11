import axios from '@/services/axios';
import config from '@/config';

const getRoute = (endpoint: string) => {
  return `${config.apiUrl}/bot-performance/${endpoint}`;
};

export interface BotKPIResponse {
  ticketsProcessed: {
    value: number;
    label: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
    format: 'number';
  };
  successRate: {
    value: number;
    label: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
    format: 'percentage';
    target?: number;
  };
  avgResponseTime: {
    value: number;
    label: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
    format: 'milliseconds';
    target?: number;
  };
  costSavings: {
    value: number;
    label: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
    format: 'currency';
  };
  customerSatisfaction: {
    value: number;
    label: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    description: string;
    format: 'rating';
    target?: number;
  };
}

export interface DashboardData {
  summary: {
    totalTickets: number;
    avgSuccessRate: number;
    avgResponseTime: number;
    totalCostSavings: number;
    avgCustomerSatisfaction: number;
  };
  chartData: {
    ticketVolume: Array<{
      date: string;
      processed: number;
      autoResolved: number;
      escalated: number;
    }>;
    successRate: Array<{
      date: string;
      rate: number;
    }>;
    responseTime: Array<{
      date: string;
      avgTime: number;
    }>;
    customerSatisfaction: Array<{
      date: string;
      score: number;
    }>;
    costSavings: Array<{
      date: string;
      savings: number;
    }>;
  };
  kpis: BotKPIResponse;
}

export interface Analytics {
  overallPerformance: {
    totalTicketsProcessed: number;
    averageSuccessRate: number;
    averageResponseTime: number;
    totalCostSavings: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  patterns: {
    peakHours: Array<{ hour: number; ticketCount: number }>;
    seasonality: Array<{ dayOfWeek: string; avgTickets: number }>;
    escalationTriggers: Array<{ trigger: string; frequency: number }>;
  };
  recommendations: Array<{
    type: 'threshold_adjustment' | 'training_improvement' | 'process_optimization';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
    actionItems: string[];
  }>;
  predictions: Array<{
    metric: string;
    prediction: number;
    confidence: number;
    timeframe: string;
    reasoning: string;
  }>;
}

export interface BenchmarkComparison {
  successRate: { value: number; benchmark: number; status: string };
  responseTime: { value: number; benchmark: number; status: string };
  escalationRate: { value: number; benchmark: number; status: string };
  customerSatisfaction: { value: number; benchmark: number; status: string };
}

export interface ActionStep {
  step: number;
  action: string;
  description: string;
  estimatedTime: string;
  priority: 'immediate' | 'this_week' | 'this_month';
  expectedOutcome: string;
  measurableGoal?: string;
  toolsRequired?: string[];
}

export interface EnhancedInsight {
  id: string;
  type: 'performance' | 'cost' | 'quality' | 'automation' | 'training';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  currentMetric: string;
  targetMetric: string;
  businessImpact: {
    costImpact?: string;
    timeImpact?: string;
    satisfactionImpact?: string;
    automationImpact?: string;
  };
  actionPlan: ActionStep[];
  timeline: string;
  successCriteria: string[];
  resources: {
    documentation?: string[];
    tools?: string[];
    expertise?: string[];
  };
  riskLevel: 'low' | 'medium' | 'high';
  confidence: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
}

class BotPerformanceService {
  async getDashboardData(days: number = 30, useCache: boolean = true): Promise<DashboardData> {
    const response = await axios.get(getRoute(`dashboard?days=${days}&useCache=${useCache}`));
    return response.data.data;
  }

  async getKPIs(days: number = 7, useCache: boolean = true): Promise<BotKPIResponse> {
    const response = await axios.get(getRoute(`kpis?days=${days}&useCache=${useCache}`));
    return response.data.data;
  }

  async getAnalytics(days: number = 30, useCache: boolean = true): Promise<Analytics> {
    const response = await axios.get(getRoute(`analytics?days=${days}&useCache=${useCache}`));
    return response.data.data;
  }

  async getBenchmarks(useCache: boolean = true): Promise<BenchmarkComparison> {
    const response = await axios.get(getRoute(`benchmarks?useCache=${useCache}`));
    return response.data.data;
  }

  async getInsights(useCache: boolean = true): Promise<{
    recommendations: Analytics['recommendations'];
    predictions: Analytics['predictions'];
  }> {
    const response = await axios.get(getRoute(`insights?useCache=${useCache}`));
    return response.data.data;
  }

  async getEnhancedInsights(days: number = 30, useCache: boolean = true): Promise<EnhancedInsight[]> {
    const response = await axios.get(getRoute(`enhanced-insights?days=${days}&useCache=${useCache}`));
    return response.data.data;
  }

  async getTrends(metric: string = 'successRate', days: number = 30): Promise<{
    metric: string;
    period: string;
    trends: Array<{ date: string; value: number }>;
    summary: {
      average: number;
      change: number;
      direction: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    const response = await axios.get(getRoute(`trends?metric=${metric}&days=${days}`));
    return response.data.data;
  }

  async calculateMetrics(date?: string): Promise<{ message: string; date: string }> {
    const payload = date ? { date } : {};
    const response = await axios.post(getRoute('calculate-metrics'), payload);
    return response.data.data;
  }

  async getPerformanceSummary(startDate?: string, endDate?: string): Promise<{
    totalTickets: number;
    avgSuccessRate: number;
    avgResponseTime: number;
    totalCostSavings: number;
    avgCustomerSatisfaction: number;
    metricsCount: number;
    dailyMetrics: any[];
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(getRoute(`summary?${params.toString()}`));
    return response.data.data;
  }

  // Transform data for charts
  transformChartData(dashboardData: DashboardData) {
    const { chartData } = dashboardData;
    
    // Combine all chart data into a single array for the main chart
    const combinedData = chartData.ticketVolume.map((volume, index) => ({
      date: volume.date,
      processed: volume.processed,
      autoResolved: volume.autoResolved,
      escalated: volume.escalated,
      successRate: chartData.successRate[index]?.rate || 0,
      avgTime: chartData.responseTime[index]?.avgTime || 0,
      satisfaction: chartData.customerSatisfaction[index]?.score || 0,
      savings: chartData.costSavings[index]?.savings || 0
    }));

    return combinedData;
  }

  // Transform KPI data with proper formatting
  transformKPIData(kpis: any): BotKPIResponse {
    return {
      ticketsProcessed: {
        value: kpis.ticketsProcessed?.value || 0,
        label: 'Tickets Processed',
        trend: kpis.ticketsProcessed?.trend || 'stable',
        description: kpis.ticketsProcessed?.description || 'Total tickets processed by the bot',
        format: 'number' as const
      },
      successRate: {
        value: kpis.successRate?.value || 0,
        label: 'Success Rate',
        trend: kpis.successRate?.trend || 'stable',
        description: kpis.successRate?.description || 'Percentage of tickets resolved by bot',
        format: 'percentage' as const,
        target: 75 // 75% target success rate
      },
      avgResponseTime: {
        value: kpis.avgResponseTime?.value || 0,
        label: 'Avg Response Time',
        trend: kpis.avgResponseTime?.trend || 'stable',
        description: kpis.avgResponseTime?.description || 'Average time to generate response',
        format: 'milliseconds' as const,
        target: 3000 // 3 second target
      },
      costSavings: {
        value: kpis.costSavings?.value || 0,
        label: 'Cost Savings',
        trend: kpis.costSavings?.trend || 'stable',
        description: kpis.costSavings?.description || 'Estimated cost savings from automation',
        format: 'currency' as const
      },
      customerSatisfaction: {
        value: kpis.customerSatisfaction?.value || 0,
        label: 'Customer Satisfaction',
        trend: kpis.customerSatisfaction?.trend || 'stable',
        description: kpis.customerSatisfaction?.description || 'Average rating of bot responses',
        format: 'rating' as const,
        target: 4.0 // 4.0/5.0 target
      }
    };
  }
}

const botPerformanceService = new BotPerformanceService();
export default botPerformanceService;