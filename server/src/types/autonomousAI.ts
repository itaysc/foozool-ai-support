import { ObjectId } from "mongoose";

// Action Types
export type ActionType = 'refund' | 'coupon' | 'auto_resolve' | 'escalate' | 'priority_change' | 'auto_reply';

// Condition Operators
export type ConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';

// Action Status
export type ActionStatus = 'pending' | 'executed' | 'failed' | 'reverted';

// Trigger Sources
export type TriggerSource = 'ai_analysis' | 'manual_trigger' | 'scheduled';

// Customer Tier Names
export type CustomerTierName = 'bronze' | 'silver' | 'gold' | 'platinum';

// AI Analysis Result
export interface IAIAnalysisResult {
  ticketId: ObjectId | string;
  confidenceScore: number;
  recommendedActions: IRecommendedAction[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  customerSatisfaction: number; // 1-5
  issueComplexity: 'simple' | 'moderate' | 'complex';
  estimatedResolutionTime: number; // in hours
  keywords: string[];
  intent: string;
  suggestedTags: string[];
}

// Recommended Action
export interface IRecommendedAction {
  actionType: ActionType;
  confidenceScore: number;
  threshold: ObjectId | string;
  priority: number;
  reasoning: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  parameters: {
    refundAmount?: number;
    couponCode?: string;
    couponDiscount?: number;
    autoReplyTemplate?: string;
    escalationLevel?: string;
    newPriority?: string;
  };
}

// Action Threshold Interface
export interface IActionThreshold {
  _id: ObjectId | string;
  organization: ObjectId | string;
  name: string;
  description: string;
  actionType: ActionType;
  conditions: ICondition[];
  threshold: number; // Confidence score threshold (0-1)
  isActive: boolean;
  priority: number;
  maxDailyActions?: number;
  actionConfig: IActionConfig;
  createdAt: Date;
  updatedAt: Date;
}

// Action Threshold Input Interface (for creating new thresholds)
export interface IActionThresholdInput {
  organization: ObjectId | string;
  name: string;
  description: string;
  actionType: ActionType;
  conditions: ICondition[];
  threshold: number; // Confidence score threshold (0-1)
  isActive: boolean;
  priority: number;
  maxDailyActions?: number;
  actionConfig: IActionConfig;
}

// Condition Interface
export interface ICondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

// Action Config Interface
export interface IActionConfig {
  refundAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  autoReplyTemplate?: string;
  escalationLevel?: string;
  newPriority?: string;
}

// Action Log Interface
export interface IActionLog {
  _id: ObjectId | string;
  organization: ObjectId | string;
  ticketId: ObjectId | string;
  actionThresholdId: ObjectId | string;
  actionType: ActionType;
  confidenceScore: number;
  executedAt: Date;
  status: ActionStatus;
  details: IActionDetails;
  metadata: IActionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Action Log Input Interface (for creating new logs)
export interface IActionLogInput {
  organization: ObjectId | string;
  ticketId: ObjectId | string;
  actionThresholdId: ObjectId | string;
  actionType: ActionType;
  confidenceScore: number;
  executedAt: Date;
  status: ActionStatus;
  details: IActionDetails;
  metadata: IActionMetadata;
}

// Action Details Interface
export interface IActionDetails {
  refundAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  autoReplyContent?: string;
  escalationLevel?: string;
  newPriority?: string;
  originalValue?: any;
  newValue?: any;
}

// Action Metadata Interface
export interface IActionMetadata {
  triggeredBy: TriggerSource;
  processingTimeMs: number;
  errorMessage?: string;
  externalSystemResponse?: any;
}

// Customer Tier Interface
export interface ICustomerTier {
  _id: ObjectId | string;
  organization: ObjectId | string;
  name: CustomerTierName;
  description: string;
  priority: number;
  autoActionPermissions: IAutoActionPermissions;
  satisfactionThresholds: ISatisfactionThresholds;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Tier Input Interface (for creating new tiers)
export interface ICustomerTierInput {
  organization: ObjectId | string;
  name: CustomerTierName;
  description: string;
  priority: number;
  autoActionPermissions: IAutoActionPermissions;
  satisfactionThresholds: ISatisfactionThresholds;
}

// Auto Action Permissions Interface
export interface IAutoActionPermissions {
  refund: IRefundPermissions;
  coupon: ICouponPermissions;
  autoResolve: IAutoResolvePermissions;
  escalation: IEscalationPermissions;
  priorityChange: IPriorityChangePermissions;
  autoReply: IAutoReplyPermissions;
}

// Individual Permission Interfaces
export interface IRefundPermissions {
  enabled: boolean;
  maxAmount: number;
  maxDailyCount: number;
}

export interface ICouponPermissions {
  enabled: boolean;
  maxDiscount: number;
  maxDailyCount: number;
}

export interface IAutoResolvePermissions {
  enabled: boolean;
  maxTicketAgeHours: number;
}

export interface IEscalationPermissions {
  enabled: boolean;
  maxEscalationLevel: string;
}

export interface IPriorityChangePermissions {
  enabled: boolean;
  allowedPriorities: string[];
}

export interface IAutoReplyPermissions {
  enabled: boolean;
  maxDailyCount: number;
}

// Satisfaction Thresholds Interface
export interface ISatisfactionThresholds {
  lowSatisfactionThreshold: number;
  highSatisfactionThreshold: number;
}

// AI Analysis Request Interface
export interface IAIAnalysisRequest {
  ticketId: ObjectId | string;
  organizationId: ObjectId | string;
  customerTier?: CustomerTierName;
  includeHistoricalData?: boolean;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
}

// Action Execution Request Interface
export interface IActionExecutionRequest {
  ticketId: ObjectId | string;
  organizationId: ObjectId | string;
  actionType: ActionType;
  thresholdId: ObjectId | string;
  confidenceScore: number;
  parameters?: IActionConfig;
  userId?: ObjectId | string; // For manual triggers
}

// Daily Action Count Interface
export interface IDailyActionCount {
  organization: ObjectId | string;
  actionType: ActionType;
  date: string; // YYYY-MM-DD format
  count: number;
  lastReset: Date;
}

// Autonomous AI Configuration Interface
export interface IAutonomousAIConfig {
  organization: ObjectId | string;
  isEnabled: boolean;
  maxActionsPerTicket: number;
  maxActionsPerDay: number;
  requireHumanApproval: boolean;
  approvalThreshold: number; // Actions above this confidence require approval
  blacklistedActions: ActionType[];
  whitelistedActions: ActionType[];
  emergencyStop: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Ticket Context for AI Analysis
export interface ITicketContext {
  ticket: {
    _id: ObjectId | string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    tags: string[];
    satisfactionRating?: number;
    createdAt: Date;
    updatedAt: Date;
  };
  customer: {
    tier?: CustomerTierName;
    satisfactionHistory: number[];
    previousTickets: number;
    averageResolutionTime: number;
  };
  organization: {
    _id: ObjectId | string;
    name: string;
    autoActionSettings: IAutonomousAIConfig;
  };
  historicalActions: IActionLog[];
} 