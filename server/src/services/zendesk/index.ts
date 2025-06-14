/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import bluebird from 'bluebird';
import { faker } from '@faker-js/faker';
import Config from '../../config';
import sanitizeText from '../../utils/text-sanitize';
import { IOrganization, IResponse, ITicket } from '@common/types';
import { getDemoOrganization } from '../../dal/organization.dal';

const authString = Buffer.from(`${Config.ZENDESK_USERNAME}/token:${Config.ZENDESK_TOKEN}`).toString('base64');

const headers = { Authorization: `Basic ${authString}` };

const api = axios.create({
  baseURL: Config.ZENDESK_URL,
  headers,
});

type channel = 'email' | 'facebook' | 'web' | 'native_messaging' | 'api' | 'whatsapp';
type stringOrUndefined = 'string' | undefined;
type status = 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';

export async function handleZendeskWebhook(organization: IOrganization, data: any) {
  console.log('Handling zendesk webhook', data);
}


export async function fetchAvailableTags() : Promise<string[]> {
  const possibleTags = await api.get(`/tags`);
  return possibleTags.data.tags.map((d) => d.name);
}

export async function addCommentToTicket(ticketId: string, comment: string) {
  const res = await api.put(`/tickets/${ticketId}.json`, { 
    ticket: {
      comment: {
        body: comment,
        public: true,
      },
    },
  }, { headers });
  return res.data;
}

const waitForJob = async (url: string) => {
  while (true) {
    const jobResponse = await api.get(url);

    const { status, results } = jobResponse.data.job_status;
    if (status === 'completed') return results;
    if (status === 'failed') throw new Error('Ticket creation job failed');

    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 sec
  }
};

export async function createDemoZendeskTickets(tickets: ITicket[]) {
  const CHUNK_SIZE = 100;
  const externalIdToTicketMap = new Map<string, ITicket>();

  const ticketChunks: any[] = [];
  const ticketsData = tickets.map((ticket, index) => {
    const name = faker.person.fullName();
    const email = faker.internet.email();
    const fakeExternalId = faker.string.uuid();
    externalIdToTicketMap.set(index.toString(), ticket);


    return {
      subject: ticket.subject,
      comment: {
        body: ticket.description,
        public: true,
        via: {
          channel: faker.helpers.arrayElement(['email', 'web', 'api', 'whatsapp']),
          source: {
            from: { name, email },
          },
        },
      },
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      requester: {
        name,
        email,
      },
      tags: ticket.tags,
      status: ticket.status || faker.helpers.arrayElement(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
      assignee_email: faker.internet.email(),
      external_id: ticket.externalId || fakeExternalId,
    };
  });

  // Split into chunks of 100
  for (let i = 0; i < ticketsData.length; i += CHUNK_SIZE) {
    ticketChunks.push(ticketsData.slice(i, i + CHUNK_SIZE));
  }

  const results: any[] = [];

  for (const chunk of ticketChunks) {
    const res = await api.post(`/tickets/create_many.json`, { tickets: chunk });
    results.push(res.data);
    // Optional: Add delay between chunks if needed
    // await sleep(1000);d
  }
  // Add comments after tickets are created
   bluebird.map(results, async (result) => {
    const jobStatusUrl = result.job_status.url;
    const createdTickets = await waitForJob(jobStatusUrl);

     bluebird.map(createdTickets, async (created: any) => {
      const ticketId = created.id;
      const index = created.index;
      const originalTicket = externalIdToTicketMap.get(index.toString());
      if (!originalTicket || !originalTicket.comments?.length) return;

      const firstComment = originalTicket.comments[0];
      await addCommentToTicket(ticketId, firstComment);
    }, { concurrency: 2 });
  }, { concurrency: 1 });

  return results;
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
      const response = await api.get(nextPageUrl);
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