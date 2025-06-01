/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import Config from '../../config';
import sanitizeText from '../../utils/text-sanitize';
import { IOrganization, IResponse, ITicket } from '@common/types';
import { getDemoOrganization } from '../../dal/organization.dal';
const headers = { Authorization: `Basic ${Config.ZENDESK_TOKEN}` };

type channel = 'email' | 'facebook' | 'web' | 'native_messaging' | 'api' | 'whatsapp';
type stringOrUndefined = 'string' | undefined;
type status = 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';

export async function handleZendeskWebhook(organization: IOrganization, data: any) {
  console.log('Handling zendesk webhook', data);
}


export async function fetchAvailableTags() : Promise<string[]> {
  const headers = { Authorization: `Basic ${Config.ZENDESK_TOKEN}` };
  const possibleTags = await axios.get(`${Config.ZENDESK_URL}/tags`, { headers });
  return possibleTags.data.tags.map((d) => d.name);
}

async function fetchTickets({ maxPages = 5, perPage = 100, fromPage = 1 }: { maxPages?: number, perPage?: number, fromPage?: number } = {}): Promise<IResponse<ITicket[]>> {
  try {
    let pagesFetched = 0;
    let nextPageUrl = `${Config.ZENDESK_URL}/tickets.json?page[size]=${perPage}&sort_by=created_at&sort_order=desc`; // per_page max 100
    const org = await getDemoOrganization();
    let allTickets: ITicket[] = [];
    let hasMore = true;
    while (hasMore && pagesFetched < maxPages) {
      console.log('Fetching zendesk tickets page ', pagesFetched + 1, ' of ', maxPages, ' at ', nextPageUrl);
      const response = await axios.get(nextPageUrl, { headers });
      pagesFetched++;
      const { tickets, links: {next}, meta } = response.data;
      if (pagesFetched < fromPage) {
        nextPageUrl = next;
        continue;
      }
      hasMore = meta.has_more;
      nextPageUrl = next;

      const ticketsData: ITicket[] = tickets.map((ticket: any) => {
        const { id, tags, via, created_at, raw_subject, description, requester_id } = ticket;
        const status: status = ticket.status;
        const channel: channel = via?.channel;
        const createdAt: stringOrUndefined = created_at;

        const t: ITicket = {
          _id: id,
          subject: sanitizeText(raw_subject),
          description: sanitizeText(description),
          status,
          createdAt: createdAt || '',
          tags,
          channel,
          priority: ticket.priority,
          customerId: requester_id || '',
          satisfactionRating: 0,
          organization: org!._id!,
          externalId: id,
          updatedAt: createdAt || '',
          comments: [],
          chatHistory: [],
        };
        return t;
      });

      allTickets = allTickets.concat(ticketsData);
      nextPageUrl = next; // use cursor pagination link directly
    }

    return {
      status: 200,
      payload: allTickets,
    };
  } catch (error) {
    console.error('Error fetching zendesk tickets:', error);
    return {
      status: 500,
      payload: [],
    };
  }
}


export default fetchTickets;