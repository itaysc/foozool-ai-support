
export interface OrganizationContact {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface IOrganization {
  _id?: string;
  name: string;
  signature: string;
  details?: string;
  externalId?: string;
  groupId?: string;
  notes?: string[];
  tags?: string[];
  url?: string;
  contact?: OrganizationContact;
  domains?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}