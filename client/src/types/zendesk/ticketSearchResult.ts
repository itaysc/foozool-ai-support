export interface ITicketSearchResult {
    url: string;
    id: string | number;
    external_id: string;
    via: {
        channel: string;
        source: {
            from: {
                name: string;
            }
            to: {
                name: string;
            }
            rel: string;
        }
    }
    created_at: string;
    updated_at: string;
    generated_timestamp: string;
    tpye: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    tags: string[];
    custom_fields: {
        id: number;
        value: string;
    }[];
    requester: {
        name: string;
    }
}