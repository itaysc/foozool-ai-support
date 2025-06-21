import axios from 'axios';
import { ITicket } from '@common/types';
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

export async function getSBERTEmbedding(tickets: Partial<ITicket>[]) : Promise<[number[]]> {
    try {
        console.log('Input tickets for SBERT embedding:', JSON.stringify(tickets, null, 2));
        
        const _tickets = tickets.map(t => ({ 
            subject: t.subject || '', 
            description: t.description || '' 
        }));
        
        console.log('Processed tickets for SBERT embedding:', JSON.stringify(_tickets, null, 2));
        console.log(`Getting SBERT embeddings for ${_tickets.length} tickets`);
        console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/sbert-embed`);
        
        const res = await api.post('/api/v1/sbert-embed', _tickets);   
        console.log(`Successfully received SBERT embeddings for ${_tickets.length} tickets`);
        return res.data;
    } catch (err) {
        console.error('SBERT embedding error:', err);
        if (axios.isAxiosError(err)) {
            console.error('Axios error details:', {
                code: err.code,
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
        }
        throw err;
    }
}

export async function getDistilBERTEmbedding(tickets: Partial<ITicket>[]) : Promise<[number[]]> {
    try {
        const _tickets = tickets.map(t => ({ subject: t.subject, description: t.description }))
        const res = await api.post('/api/v1/distilbert-embed', _tickets);
        return res.data;
    } catch (err) {
        console.log(err);
        return [[]];
    }
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