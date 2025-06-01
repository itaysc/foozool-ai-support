
export interface IESTicket {
    ticket_id: string;
    organization: string;
    embedding?: number[];
    sentiment_score: number;
    sentiment: string;
    customer_id: string;
    created_at: string;
}
