import axios from 'axios';
import Config from "../../config";
import { z } from 'zod';
import bluebird from 'bluebird';

const zendeskClient = axios.create({
    baseURL: Config.ZENDESK_URL,
    headers: { Authorization: `Basic ${Config.ZENDESK_TOKEN}` },
});

// Rate limiting utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff for rate limiting
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = Config.ZENDESK_MAX_RETRIES,
  baseDelay: number = Config.ZENDESK_RETRY_BASE_DELAY_MS
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        // Rate limited - wait with exponential backoff
        const waitTime = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Rate limited (429). Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
};

// Rate-limited API call with delay between requests
const rateLimitedApiCall = async <T>(
  apiCall: () => Promise<T>,
  delayMs: number = Config.ZENDESK_RATE_LIMIT_DELAY_MS // Use configurable delay
): Promise<T> => {
  const result = await retryWithBackoff(apiCall);
  // Add delay after successful call to respect rate limits
  await delay(delayMs);
  return result;
};

export const service = {
    fetch_ticket_by_id: async ({ id }: { id: string }) => {
        const ticket = await rateLimitedApiCall(async () => 
            zendeskClient.get(`/tickets/${id}.json`)
        );
        return ticket;
    },
    fetch_multiple_tickets_by_id: async ({ ids }: { ids: string[] }) => {
        const tickets: any[] = [];
        // Process IDs sequentially with rate limiting instead of parallel execution
        for (const id of ids) {
            try {
                const ticket = await rateLimitedApiCall(async () => 
                    zendeskClient.get(`/tickets/${id}.json`)
                );
                tickets.push(ticket);
            } catch (error) {
                console.error(`Error fetching ticket ${id}:`, error);
                // Continue with next ID instead of failing completely
            }
        }
        return tickets;
    },
    get_ticket_comments: async ({ id }: { id: string }) => {
        const comments = await rateLimitedApiCall(async () => 
            zendeskClient.get(`/tickets/${id}/comments.json`)
        );
        return comments;
    },
    comment_on_ticket: async ({ id, comment }: { id: string, comment: string }) => {
        const response = await rateLimitedApiCall(async () => 
            zendeskClient.put(`/tickets/${id}`, { comment })
        );
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