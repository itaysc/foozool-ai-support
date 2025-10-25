import { NewsResult } from '../../news/types';

export interface MeetingPrepV2Data {
  customer: any;
  insights: any[];
  healthScore: any;
  ticketStats: any;
  customerNews: NewsResult | null;
  generatedAt: Date;
  generatedBy: string;
}

export interface HealthScoreData {
  overallScore: number;
  supportHealth: { score: number };
  engagementHealth: { score: number };
  businessHealth: { score: number };
  trend: string;
  lastUpdated: Date;
}

export interface InsightTransformation {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  message: string; // Required for CustomerSuccessInsight
  impact: number;
  recommendation: string;
  category: string;
  detectedAt: Date;
  lastUpdated: Date;
  status: string;
  assignee?: string;
  customerId: string;
  customerName: string;
}
