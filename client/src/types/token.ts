import { ObjectId } from './index';

export type TokenType = 'zendesk-webhook' | 'salesforce-webhook' | 'hubspot-webhook' | 'generic-webhook';

export interface IToken {
    organizationId: string;
    token: string;
    refreshToken?: string;
    type: string;
    description?: string;
}