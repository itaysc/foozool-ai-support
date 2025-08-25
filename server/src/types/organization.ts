import { Region } from "./region";

export interface OrganizationContact {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface AnomalyDetectionSettings {
  volumeThreshold: number; // Standard deviations for volume anomalies
  sentimentThreshold: number; // Threshold for sentiment shifts
  timeWindows: {
    short: number; // 1 hour in milliseconds
    medium: number; // 6 hours in milliseconds
    long: number; // 24 hours in milliseconds
  };
  minDataPoints: number; // Minimum data points required for analysis
  enabled: boolean; // Whether anomaly detection is enabled for this organization
}

// Dashboard settings removed with insights functionality

export interface IOrganization {
  _id?: string;
  name: string;
  country?: string;
  regions?: Region[];
  signature: string;
  details?: string;
  externalId?: string;
  groupId?: string;
  notes?: string[];
  tags?: string[];
  url?: string;
  contact?: OrganizationContact;
  domains?: string[];
  crmType?: string; // The CRM type this organization uses
  crmConfig?: Record<string, any>; // CRM-specific configuration
  anomalySettings?: AnomalyDetectionSettings; // Anomaly detection configuration
  // dashboardSettings removed with insights functionality
  createdAt?: Date;
  updatedAt?: Date;
}