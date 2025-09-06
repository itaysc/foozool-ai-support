export interface IBot {
  _id?: string;
  organizationId: string;
  name: string;
  type: 'customer_success' | 'issue_insights' | 'predictions' | 'nps';
  createdByUserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateBotRequest {
  name: string;
  type: 'customer_success' | 'issue_insights' | 'predictions' | 'nps';
}


