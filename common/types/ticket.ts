import { ObjectId } from "mongoose";

export interface ITicket {
    _id?: ObjectId | string;
    organization: ObjectId | string;
    externalId: string;
    createdAt: string;
    updatedAt: string;
    subject: string;
    description: string;
    status: "new" | "open" | "pending" | "hold" | "solved" | "closed";
    priority: string;
    tags: string[];
    channel: string;
    customerId: string;
    satisfactionRating: number;
    comments: string[];
    chatHistory: string[];
}
