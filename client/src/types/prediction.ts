export interface Prediction {
  ticketId: string;
  organizationId: string;
  predictedEscalation: {
    risk: 'Low' | 'Medium' | 'High';
    confidence: number;
  };
  predictedCSAT: {
    risk: 'Low' | 'Medium' | 'High';
    confidence: number;
  };
  longResolutionPredicted?: boolean; // Flag indicating if long resolution was predicted
  predictionConfidence?: number; // Confidence score for the long resolution prediction
  actualOutcome?: {
    finalStatus: string;
    isEscalated: boolean;
    csatScore?: number;
    resolvedAt: string;
    resolutionTimeMs?: number; // Time to resolution in milliseconds
    accuracyEscalation?: boolean;
    accuracyCSAT?: boolean;
    checkedAt: string;
  };
  createdAt: string;
}

export interface PredictionSummary {
  totalPredictions: number;
  highEscalationRisk: number;
  highCSATRisk: number;
  escalationRiskPercentage: number;
  csatRiskPercentage: number;
  avgEscalationConfidence: number;
  avgCSATConfidence: number;
  longResolutionPredictions: number;
  longResolutionPercentage: number;
}

export interface PredictionsResponse {
  success: boolean;
  data: Prediction[];
  count: number;
}

export interface PredictionSummaryResponse {
  success: boolean;
  data: PredictionSummary;
}

export interface AccuracyAnalysis {
  totalChecked: number;
  escalationAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  csatAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  overallAccuracy: number;
  confidenceBreakdown: {
    high: { correct: number; total: number; percentage: number };
    medium: { correct: number; total: number; percentage: number };
    low: { correct: number; total: number; percentage: number };
  };
  resolutionTimeAccuracy: {
    correct: number;
    total: number;
    percentage: number;
  };
  avgResolutionTime: number;
  avgPredictedLongResolutionTime: number;
}

export interface AccuracyAnalysisResponse {
  success: boolean;
  data: AccuracyAnalysis;
}