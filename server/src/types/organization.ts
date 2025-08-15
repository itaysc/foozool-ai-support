import { Region } from "./region";

export interface OrganizationContact {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
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
  // dashboardSettings removed with insights functionality
  createdAt?: Date;
  updatedAt?: Date;
}