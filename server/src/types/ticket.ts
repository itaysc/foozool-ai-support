import { ObjectId } from "mongoose";

export interface IBotProcessingStep {
    step: string;
    completedAt: Date;
    success: boolean;
    processingTime: number;
    errorMessage?: string;
}

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
    
    // Bot Performance Tracking Fields
    botProcessed?: boolean;              // Was this ticket processed by AI?
    botResponseGenerated?: boolean;      // Did bot generate a response?
    botResponseTime?: number;           // Time in ms to generate response
    botConfidenceScore?: number;        // AI confidence in its response (0-1)
    botActions?: string[];              // List of actions bot performed
    escalatedToHuman?: boolean;         // Did bot escalate to human?
    escalationReason?: string;          // Why was it escalated?
    resolutionSource?: 'bot' | 'human' | 'hybrid';  // Who resolved it?
    customerFeedbackOnBot?: number;     // Customer rating of bot response (1-5)
    similarTicketsUsed?: number;        // Count of similar tickets found
    processingSteps?: IBotProcessingStep[];  // Track bot processing pipeline
    
    // Additional bot metadata
    botModelVersion?: string;           // Which AI model version was used
    botPromptTemplate?: string;         // Which prompt template was used
    botResponseContent?: string;        // The actual bot response (if any)
    humanTakeoverAt?: Date;            // When human took over (if applicable)
    botAccuracyScore?: number;         // Post-resolution accuracy assessment (0-1)
}
