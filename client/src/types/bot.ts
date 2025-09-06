export interface BotDto {
  _id: string;
  organizationId: string;
  name: string;
  type: 'customer_success' | 'issue_insights' | 'predictions' | 'nps';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBotRequestDto {
  name: string;
  type: 'customer_success' | 'issue_insights' | 'predictions' | 'nps';
}


