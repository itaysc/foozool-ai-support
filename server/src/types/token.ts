import { ObjectId } from "mongoose";

export interface IToken {
    organizationId: string | ObjectId;
    token: string;
    type: string;
    description?: string;
}