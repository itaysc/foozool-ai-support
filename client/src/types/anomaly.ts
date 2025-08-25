export interface AnomalyMetadata {
  confidence: number;
  timeWindow: string;
  affectedMetrics: string[];
  currentValue?: number;
  expectedValue?: number;
  zScore?: number;
  currentSentiment?: number;
  baselineSentiment?: number;
  shiftMagnitude?: number;
}

export interface Anomaly {
  _id: string;
  type: 'volume' | 'sentiment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  timestamp: string;
  description: string;
  metadata: AnomalyMetadata;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  ageInHours?: number;
  timeSinceAcknowledgment?: number;
  timeSinceResolution?: number;
}

export interface AnomalyFilter {
  organizationId?: string;
  status?: string;
  type?: string;
  severity?: string;
  hours?: number | string;
}

export interface AnomalyPagination {
  limit?: number;
  offset?: number;
}

export interface AnomalyStats {
  totalActive: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: number;
}

// API Response Types
export interface AnomaliesResponse {
  anomalies: Anomaly[];
  totalCount: number;
  pagination: AnomalyPagination;
}

export interface AnomalyResponse {
  anomaly: Anomaly;
}

export interface AnomalyAction {
  action: 'acknowledge' | 'resolve' | 'false_positive';
  notes?: string;
}

// Anomaly Detection Settings Types
export interface AnomalyDetectionSettings {
  volumeThreshold: number;
  sentimentThreshold: number;
  timeWindows: {
    short: number; // milliseconds
    medium: number; // milliseconds
    long: number; // milliseconds
  };
  minDataPoints: number;
  enabled: boolean;
}

export interface AnomalySettingsResponse {
  settings: AnomalyDetectionSettings;
}

export interface UpdateAnomalySettingsRequest {
  volumeThreshold?: number;
  sentimentThreshold?: number;
  timeWindows?: {
    short?: number;
    medium?: number;
    long?: number;
  };
  minDataPoints?: number;
  enabled?: boolean;
}
