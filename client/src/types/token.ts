import { ObjectId } from './index';

export interface IToken {
    organizationId: string | ObjectId;
    token: string;
    refreshToken?: string;
    type: string;
    description?: string;
}