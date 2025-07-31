export interface ZendeskTicketWebhookPayload {
    ticket_id: string;
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
    custom_field_example?: string;
    via?: string;
  }
  