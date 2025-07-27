export interface IZendeskTicketComment {
    comments: IZendeskTicketCommentItem[];
}

export interface IZendeskTicketCommentItem {
    id: number;
    type: string;
    author_id: number;
    body: string;
    public: boolean;
    via: {
        channel: string;
        source: {
            from: {
                name: string;
            };
            to: {
                name: string;
            };
            rel: string;
        },
    };
    created_at: string;
}