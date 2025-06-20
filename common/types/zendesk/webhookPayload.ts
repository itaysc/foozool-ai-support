export interface ZendeskTicketWebhookPayload {
    ticket_id: string;
    subject: string;
    status: string;
    description: string;
    priority: string;
    tags: string; // Will be a comma-separated string like "tag1, tag2"
    created_at: string;
    external_id: string;
    requester: {
      name: string;
      email: string;
    };
    custom_field_example: string; // Adjust the type based on actual custom field type
    via: string; // Could be "web", "email", etc.
  }
  