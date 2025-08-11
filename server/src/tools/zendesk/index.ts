import axios from 'axios';
import Config from "../../config";
import { z } from 'zod';
import bluebird from 'bluebird';

const zendeskClient = axios.create({
    baseURL: Config.ZENDESK_URL,
    headers: { Authorization: `Basic ${Config.ZENDESK_TOKEN}` },
});

export const service = {
    fetch_ticket_by_id: async ({ id }: { id: string }) => {
        const ticket = await zendeskClient.get(`/tickets/${id}.json`);
        return ticket;
    },
    fetch_multiple_tickets_by_id: async ({ ids }: { ids: string[] }) => {
        const tickets = await bluebird.map(ids, async (id) => {
            const ticket = await zendeskClient.get(`/tickets/${id}.json`);
            return ticket;
        });
        return tickets;
    },
    get_ticket_comments: async ({ id }: { id: string }) => {
        const comments = await zendeskClient.get(`/tickets/${id}/comments.json`);
        return comments;
    },
    comment_on_ticket: async ({ id, comment }: { id: string, comment: string }) => {
        const response = await zendeskClient.put(`/tickets/${id}`, { comment });
        return response;
    },
}

export const zendeskTools = [{
    name: 'fetch_ticket_by_id',
    description: 'Fetch a ticket by its ID',
    parameters: z.object({
        id: z.string(),
    }),
    execute: service.fetch_ticket_by_id,
},
{
    name: 'fetch_multiple_tickets_by_id',
    description: 'Fetch multiple tickets by their IDs',
    parameters: z.object({
        ids: z.array(z.string()),
    }),
    execute: service.fetch_multiple_tickets_by_id,
},
{
    name: 'get_ticket_comments',
    description: 'Fetch a ticket comments by its ID',
    parameters: z.object({
        id: z.string(),
    }),
    execute: service.get_ticket_comments,
},
{
    name: 'comment_on_ticket',
    description: 'Comment on a ticket',
    parameters: z.object({
        id: z.string(),
        comment: z.string(),
    }),
    execute: service.comment_on_ticket,
}
];