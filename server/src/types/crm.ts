import { ObjectId } from 'mongoose';

export interface ICRM {
  _id?: string;
  name: string;
  type: string; // e.g., 'zendesk', 'salesforce', 'hubspot'
  displayName: string;
  description?: string;
  isActive: boolean;
  configSchema: Record<string, any>; // Configuration schema for the CRM
  webhookConfig: {
    supportedEvents: string[];
    payloadSchema: Record<string, any>;
    headersSchema: Record<string, any>;
  };
  apiConfig: {
    baseUrl: string;
    authenticationType: 'basic' | 'bearer' | 'oauth2' | 'api_key';
    requiredHeaders: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICRMWebhookPayload {
  crmType: string;
  eventType: string;
  ticketId: string;
  subject: string;
  status: string;
  description: string;
  priority?: string;
  tags?: string | string[];
  created_at?: string;
  external_id: string;
  requester?: {
    name?: string;
    email?: string;
  };
  custom_fields?: Record<string, any>;
  via?: string;
  [key: string]: any; // Allow additional fields from different CRMs
}
