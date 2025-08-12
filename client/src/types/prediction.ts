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