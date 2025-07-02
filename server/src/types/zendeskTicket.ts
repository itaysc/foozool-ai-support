export interface ZendeskTicket {
    ticket: {
      id: number;
      subject: string;
      description: string;
      status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
      priority?: 'low' | 'normal' | 'high' | 'urgent' | null;
      type?: 'question' | 'incident' | 'problem' | 'task' | null;
      created_at: string; // ISO 8601
      updated_at: string; // ISO 8601
      requester_id: number;
      assignee_id?: number | null;
      organization_id?: number | null;
      tags: string[];
      custom_fields?: {
        id: number;
        value: string | number | boolean | null;
      }[];
      via: {
        channel: string;
        source: {
          from: Record<string, unknown>;
          to: Record<string, unknown>;
          rel: string | null;
        };
      };
    };
  
    requester: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
      created_at: string;
    };
  
    assignee?: {
      id: number;
      name: string;
      email?: string;
    };
  
    organization?: {
      id: number;
      name: string;
    };
  
    event_type: 'ticket.created' | 'ticket.updated';
  }
  