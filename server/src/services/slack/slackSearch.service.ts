import { WebClient } from '@slack/web-api';
import { OrganizationModel } from '../../schemas';

type SlackSort = 'score' | 'timestamp';
type SlackSortDir = 'asc' | 'desc';

interface SlackSearchMeta {
  mode: 'searchApi' | 'channelScan';
  scannedChannels?: number;
  scannedMessages?: number;
  truncated?: boolean;
  daysLimit?: number;
}

export interface SlackMessageSearchParams {
  organizationId: string;
  q: string;
  limit: number;
  page: number;
  sort: SlackSort;
  sortDir: SlackSortDir;
}

export interface SlackMessageMatch {
  channel: { id: string; name?: string };
  user?: string;
  ts: string;
  text?: string;
  permalink?: string;
}

export type SlackMessageSearchResult =
  | {
      success: true;
      query: string;
      paging: { page: number; perPage: number; total: number };
      matches: SlackMessageMatch[];
      meta?: SlackSearchMeta;
    }
  | { success: false; error: string; statusCode?: number };

/**
 * Slack search service (messages).
 *
 * Notes:
 * - Searches are limited to content accessible to the bot token.
 * - Slack search is case-insensitive by default.
 */
export class SlackSearchService {
  static async searchMessages(params: SlackMessageSearchParams): Promise<SlackMessageSearchResult> {
    try {
      const organization = await OrganizationModel.findById(params.organizationId).lean();
      if (!organization) {
        return { success: false, statusCode: 400, error: 'Organization not found' };
      }

      const botToken = organization.slackConfig?.insights?.botToken;
      if (!botToken) {
        return {
          success: false,
          statusCode: 400,
          error: 'Slack configuration not found. Please configure botToken in organization.slackConfig.insights'
        };
      }

      const client = new WebClient(botToken);

      // Default to exact-phrase search to reduce false positives.
      // Escape any quotes in user input.
      const escaped = params.q.replace(/"/g, '\\"');
      const query = `"${escaped}"`;

      let resp: any;
      try {
        resp = await client.search.messages({
          query,
          count: params.limit,
          page: params.page,
          sort: params.sort,
          sort_dir: params.sortDir
        });
      } catch (error: any) {
        const slackErr = error?.data?.error;
        // Slack often rejects search.* methods for bot tokens (xoxb) with not_allowed_token_type.
        // In that case, fall back to scanning channels via conversations.history (works with channels:read + channels:history).
        // Some workspaces/tokens may return missing_scope (needed: search:read) for search.messages as well.
        if (slackErr === 'not_allowed_token_type' || slackErr === 'missing_scope') {
          return await SlackSearchService.searchByScanningPublicChannels({
            client,
            q: params.q,
            page: params.page,
            perPage: params.limit
          });
        }
        throw error;
      }

      if (!resp?.ok) {
        return {
          success: false,
          statusCode: 502,
          error: `Slack API error: ${resp?.error || 'Unknown error'}`
        };
      }

      const matchesRaw: any[] = resp?.messages?.matches || [];
      const total = typeof resp?.messages?.total === 'number' ? resp.messages.total : 0;

      const matches: SlackMessageMatch[] = matchesRaw
        .map((m: any) => {
          const channelId = m?.channel?.id || m?.channel?.ID || m?.channel;
          const channelName = m?.channel?.name;
          const ts = m?.ts || m?.timestamp;
          if (!channelId || !ts) return null;
          return {
            channel: { id: String(channelId), name: channelName ? String(channelName) : undefined },
            user: m?.user ? String(m.user) : undefined,
            ts: String(ts),
            text: m?.text ? String(m.text) : undefined,
            permalink: m?.permalink ? String(m.permalink) : undefined
          };
        })
        .filter(Boolean) as SlackMessageMatch[];

      // Fallback: if Slack didn't provide permalinks, resolve via chat.getPermalink.
      // This is rare, but it makes the API more robust for clients.
      const needsPermalink = matches.filter(m => !m.permalink);
      if (needsPermalink.length > 0) {
        const resolved = await Promise.all(
          needsPermalink.map(async (m) => {
            try {
              const pr: any = await client.chat.getPermalink({ channel: m.channel.id, message_ts: m.ts });
              if (pr?.ok && pr?.permalink) {
                m.permalink = String(pr.permalink);
              }
            } catch {
              // Ignore permalink failures; keep result without permalink.
            }
            return m;
          })
        );
        // `resolved` mutates in place; return value is not used.
        void resolved;
      }

      return {
        success: true,
        query,
        paging: { page: params.page, perPage: params.limit, total },
        matches,
        meta: { mode: 'searchApi' }
      };
    } catch (error: any) {
      // Avoid leaking sensitive details; return a safe message.
      return {
        success: false,
        statusCode: 502,
        error: error?.data?.error ? `Slack API error: ${error.data.error}` : 'Failed to search Slack messages'
      };
    }
  }

  private static async searchByScanningPublicChannels(opts: {
    client: WebClient;
    q: string;
    page: number;
    perPage: number;
  }): Promise<SlackMessageSearchResult> {
    const q = (opts.q || '').trim();
    if (!q) {
      return { success: false, statusCode: 400, error: 'Missing required query param: q' };
    }

    // Safety defaults to avoid huge scans. Adjust later if you want query params for these.
    const DAYS_LIMIT = 30;
    const MAX_CHANNELS = 250;
    const MESSAGES_PER_CHANNEL = 200;
    const MAX_MATCHES = 1000;

    const qLower = q.toLowerCase();
    const oldest = Math.floor(Date.now() / 1000) - DAYS_LIMIT * 24 * 60 * 60;

    let scannedChannels = 0; // channels where we successfully read at least one history page
    let scannedMessages = 0;
    let truncated = false;
    let skippedChannels = 0;
    const skippedByReason: Record<string, number> = {};

    // Log channel scan progress, but cap the list to avoid overly large logs.
    const scannedChannelRefs: string[] = []; // channels successfully scanned (examples)
    const MAX_LOGGED_CHANNELS = 50;
    const skippedChannelRefs: string[] = []; // channels skipped (examples)

    const allMatches: SlackMessageMatch[] = [];

    // List public channels (the bot token can see them; reading history may still fail if not a member).
    let cursor: string | undefined;
    const channels: Array<{ id: string; name?: string }> = [];
    while (channels.length < MAX_CHANNELS) {
      let resp: any;
      try {
        resp = await opts.client.conversations.list({
          types: 'public_channel',
          exclude_archived: true,
          limit: 200,
          cursor
        });
      } catch (e: any) {
        const err = e?.data?.error;
        if (err === 'missing_scope') {
          const needed = e?.data?.needed;
          const provided = e?.data?.provided;
          return {
            success: false,
            statusCode: 502,
            error: `Slack API error: missing_scope${needed ? ` (needed: ${needed})` : ''}${provided ? ` (provided: ${provided})` : ''}`
          };
        }
        return {
          success: false,
          statusCode: 502,
          error: err ? `Slack API error: ${err}` : 'Failed to list Slack channels'
        };
      }

      if (!resp?.ok) {
        return {
          success: false,
          statusCode: 502,
          error: `Slack API error: ${resp?.error || 'Unknown error'}`
        };
      }

      const chs: any[] = resp?.channels || [];
      for (const ch of chs) {
        if (channels.length >= MAX_CHANNELS) break;
        if (ch?.id) channels.push({ id: String(ch.id), name: ch?.name ? String(ch.name) : undefined });
      }

      cursor = resp?.response_metadata?.next_cursor || undefined;
      if (!cursor) break;
    }

    // Scan each channel's recent history.
    for (const ch of channels) {
      if (allMatches.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }

      let histCursor: string | undefined;
      let remaining = MESSAGES_PER_CHANNEL;
      let readAnyHistory = false;

      while (remaining > 0) {
        const batchSize = Math.min(remaining, 200);
        let hist: any;
        try {
          hist = await opts.client.conversations.history({
            channel: ch.id,
            limit: batchSize,
            oldest: String(oldest),
            cursor: histCursor
          });
        } catch (e: any) {
          const err = e?.data?.error;
          if (err === 'missing_scope') {
            const needed = e?.data?.needed;
            const provided = e?.data?.provided;
            return {
              success: false,
              statusCode: 502,
              error: `Slack API error: missing_scope${needed ? ` (needed: ${needed})` : ''}${provided ? ` (provided: ${provided})` : ''}`
            };
          }
          // Common: not_in_channel; just skip this channel.
          skippedChannels += 1;
          const reason = err ? String(err) : 'unknown_error';
          skippedByReason[reason] = (skippedByReason[reason] || 0) + 1;
          if (skippedChannelRefs.length < MAX_LOGGED_CHANNELS) {
            skippedChannelRefs.push(ch.name ? `${ch.name} (${ch.id})` : ch.id);
          }
          break;
        }

        if (!hist?.ok) {
          // not_in_channel is common; ignore and move on.
          skippedChannels += 1;
          const reason = hist?.error ? String(hist.error) : 'unknown_error';
          skippedByReason[reason] = (skippedByReason[reason] || 0) + 1;
          if (skippedChannelRefs.length < MAX_LOGGED_CHANNELS) {
            skippedChannelRefs.push(ch.name ? `${ch.name} (${ch.id})` : ch.id);
          }
          break;
        }

        const messages: any[] = hist?.messages || [];
        readAnyHistory = true;
        scannedMessages += messages.length;
        remaining -= messages.length;

        for (const m of messages) {
          if (allMatches.length >= MAX_MATCHES) {
            truncated = true;
            break;
          }
          const text = typeof m?.text === 'string' ? m.text : '';
          const ts = m?.ts ? String(m.ts) : '';
          if (!ts) continue;
          if (!text) continue;
          if (!text.toLowerCase().includes(qLower)) continue;

          const match: SlackMessageMatch = {
            channel: { id: ch.id, name: ch.name },
            user: m?.user ? String(m.user) : undefined,
            ts,
            text
          };

          // Resolve permalink for each match (best effort).
          try {
            const pr: any = await opts.client.chat.getPermalink({ channel: ch.id, message_ts: ts });
            if (pr?.ok && pr?.permalink) match.permalink = String(pr.permalink);
          } catch {
            // Ignore permalink failures (including missing_scope).
          }

          allMatches.push(match);
        }

        if (truncated) break;

        histCursor = hist?.response_metadata?.next_cursor || undefined;
        // Stop if Slack indicates no more pages OR if we didn't receive any messages in this page.
        if (!histCursor || messages.length === 0) break;
      }

      if (readAnyHistory) {
        scannedChannels += 1;
        if (scannedChannelRefs.length < MAX_LOGGED_CHANNELS) {
          scannedChannelRefs.push(ch.name ? `${ch.name} (${ch.id})` : ch.id);
        }
      }
    }

    console.log('SlackSearchService channel scan complete', {
      query: q,
      scannedChannels,
      skippedChannels,
      skippedByReason,
      scannedMessages,
      truncated,
      daysLimit: DAYS_LIMIT,
      scannedChannelExamples: scannedChannelRefs,
      scannedChannelExamplesTruncated: channels.length > scannedChannelRefs.length
      ,
      skippedChannelExamples: skippedChannelRefs,
      skippedChannelExamplesTruncated: channels.length > skippedChannelRefs.length
    });

    // Sort by newest first to be more useful.
    allMatches.sort((a, b) => Number(b.ts) - Number(a.ts));

    const start = (Math.max(opts.page, 1) - 1) * opts.perPage;
    const end = start + opts.perPage;
    const pageMatches = allMatches.slice(start, end);

    return {
      success: true,
      query: q,
      paging: { page: Math.max(opts.page, 1), perPage: opts.perPage, total: allMatches.length },
      matches: pageMatches,
      meta: {
        mode: 'channelScan',
        scannedChannels,
        scannedMessages,
        truncated,
        daysLimit: DAYS_LIMIT
      }
    };
  }
}


