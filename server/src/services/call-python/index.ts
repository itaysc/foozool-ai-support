import axios from 'axios';
import { ITicket } from 'src/types';
import Config from '../../config';

const api = axios.create({
    baseURL: Config.PYTHON_ML_SERVICE_URL,
    // baseURL: `http://localhost:${Config.PYTHON_ML_SERVICE_PORT}`,
    timeout: 300000, // 5 minutes timeout for ML operations
    maxContentLength: 50 * 1024 * 1024, // 50MB max content length
    maxBodyLength: 50 * 1024 * 1024, // 50MB max body length
    headers: {
        'Content-Type': 'application/json',
    },
});

export async function getSBERTEmbedding(tickets: Partial<ITicket>[]) : Promise<number[][]> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Getting SBERT embeddings for ${tickets.length} tickets`);
            
            const _tickets = tickets.map(t => ({ 
                subject: t.subject || '', 
                description: t.description || '' 
            }));
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/sbert-embed`);
            
            // Add more robust error handling and timeout
            const res = await api.post('/api/v1/sbert-embed', _tickets, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add retry configuration
                validateStatus: (status) => status < 500, // Don't throw on 5xx errors
            });

            console.log(`SBERT embedding request successful on attempt ${attempt}`);
            return res.data as number[][];

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });

            // If it's the last attempt, throw the error
            if (attempt === maxRetries) {
                console.error('All retry attempts failed for SBERT embedding');
                throw error;
            }

            // Wait before retrying (exponential backoff)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    // This should never be reached, but just in case
    throw lastError;
}

export async function getDistilBERTEmbedding(tickets: Partial<ITicket>[]) : Promise<number[][]> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Getting DistilBERT embeddings for ${tickets.length} tickets`);
            
            const _tickets = tickets.map(t => ({ 
                subject: t.subject || '', 
                description: t.description || '' 
            }));
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/distilbert-embed`);
            
            const res = await api.post('/api/v1/distilbert-embed', _tickets, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status < 500,
            });

            console.log(`DistilBERT embedding request successful on attempt ${attempt}`);
            return res.data as number[][];

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });

            // If it's the last attempt, return empty array as fallback
            if (attempt === maxRetries) {
                console.error('All retry attempts failed for DistilBERT embedding, returning empty array');
                return [[]];
            }

            // Wait before retrying (exponential backoff)
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    // This should never be reached, but just in case
    return [[]];
}

export async function extractKeywordsFromTicket(ticket: Partial<ITicket> & { embedding: number[] }) : Promise<string[]> {
    const _ticket = { subject: ticket.subject, description: ticket.description, embedding: ticket.embedding };
    const res = await api.post('/api/v1/extract-keywords', _ticket);
    return res.data;
}

export async function summarizeTickets(tickets: Partial<ITicket>[]) : Promise<string[]> {
    try {
    const _tickets = tickets.map(t => ({ subject: t.subject, description: t.description }))
        const res = await api.post('/api/v1/summarize', _tickets);
        return res.data;
    } catch (err) {
        console.log(err);
        return [];
    }
}

export async function answerTicket({ question, tickets } : {question: string, tickets: Partial<ITicket>[]}) : Promise<string> {
    const _tickets = tickets.map(t => ({ subject: t.subject, description: t.description }))
    const res = await api.post('/api/v1/answer', { tickets: _tickets, question });
    return res.data;
}

export async function classifyIntent(ticket: Partial<ITicket>) : Promise<string[]> {
    const _ticket = { subject: ticket.subject, description: ticket.description }
    const res = await api.post('/api/v1/classify-intent', _ticket);
    return res.data;
}