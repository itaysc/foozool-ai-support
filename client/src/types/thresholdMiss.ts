export interface IThresholdMiss {
  _id: string;
  organization: string;
  ticketId: string;
  actionType: 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';
  thresholdId: string;
  thresholdName: string;
  thresholdValue: number;
  confidenceScore: number;
  missedBy: number;
  ticketSubject?: string;
  ticketStatus?: string;
  ticketPriority?: string;
  customerTier?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IThresholdMissStats {
  actionType: string;
  thresholdName: string;
  missCount: number;
  averageMissBy: number;
  totalThresholds: number;
  missRate: number;
}

export interface IThresholdMissSummary {
  totalMisses: number;
  actionTypeBreakdown: {
    [actionType: string]: number;
  };
  thresholdBreakdown: {
    [thresholdName: string]: number;
  };
  timeRangeStats: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

export interface IThresholdMissDetails {
  misses: IThresholdMiss[];
  total: number;
  hasMore: boolean;
}
