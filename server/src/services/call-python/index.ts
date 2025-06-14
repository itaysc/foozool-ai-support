import axios from 'axios';
import { ITicket } from '@common/types';
import Config from '../../config';

const api = axios.create({
    baseURL: Config.PYTHON_ML_SERVICE_URL,
    // baseURL: `http://localhost:${Config.PYTHON_ML_SERVICE_PORT}`,
});

export async function getSBERTEmbedding(tickets: Partial<ITicket>[]) : Promise<[number[]]> {
    try {
        const _tickets = tickets.map(t => ({ subject: t.subject, description: t.description }))
        const res = await api.post('/api/v1/sbert-embed', _tickets);   
        return res.data;
    } catch (err) {
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
    const _tickets = tickets.map(t => ({ subject: t.subject, description: t.description }))
    const res = await api.post('/api/v1/summarize', _tickets);
    return res.data;
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