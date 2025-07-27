export interface IWebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  organizationId: string;
  ticketId?: string;
  actionType?: string;
  confidenceScore?: number;
  thresholdName?: string;
  result?: any;
}

export interface ICreateWebhookRequest {
  organizationId: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  isActive?: boolean;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface IUpdateWebhookRequest {
  name?: string;
  description?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface IWebhookTestResult {
  success: boolean;
  message: string;
} 