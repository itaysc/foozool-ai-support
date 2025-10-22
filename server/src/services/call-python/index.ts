import axios from 'axios';
import { ITicket } from '../../types';
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
            
            // Validate and clean ticket data before sending
            const _tickets = tickets.map((t, index) => {
                const subject = t.subject || '';
                const description = t.description || '';
                
                // Log any unexpected fields for debugging
                const unexpectedFields = Object.keys(t).filter(key => !['subject', 'description'].includes(key));
                if (unexpectedFields.length > 0) {
                    console.warn(`Ticket ${index} has unexpected fields:`, unexpectedFields);
                }
                
                return { 
                    subject, 
                    description 
                };
            });
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/sbert-embed`);
            console.log(`Request payload sample:`, _tickets[0]);
            
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
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
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

// Document Analysis Functions

export interface DocumentAnalysisRequest {
    title: string;
    content: string;
    documentType: string;
    mimeType?: string;
}

export interface DocumentAnalysisResult {
    category: string;
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    businessRelevance: number; // 0-1 score
    keyEntities: {
        people: string[];
        companies: string[];
        products: string[];
        locations: string[];
    };
    summary: string;
    confidence: number; // 0-1 score
}

export async function analyzeDocument(document: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Analyzing document "${document.title}"`);
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/analyze-document`);
            console.log(`Document type: ${document.documentType}, Content length: ${document.content?.length || 0}`);
            
            const res = await api.post('/api/v1/analyze-document', document, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status < 500,
            });

            console.log(`Document analysis request successful on attempt ${attempt}`);
            return res.data as DocumentAnalysisResult;

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });

            if (attempt === maxRetries) {
                console.error('All retry attempts failed for document analysis');
                // Return default result as fallback
                return {
                    category: 'unknown',
                    topics: [],
                    sentiment: 'neutral',
                    businessRelevance: 0.5,
                    keyEntities: {
                        people: [],
                        companies: [],
                        products: [],
                        locations: []
                    },
                    summary: 'Analysis failed - unable to process document',
                    confidence: 0.0
                };
            }

            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError;
}

export async function classifyDocumentCategory(documents: DocumentAnalysisRequest[]): Promise<string[]> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Classifying ${documents.length} documents`);
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/classify-documents`);
            
            const res = await api.post('/api/v1/classify-documents', { documents }, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status < 500,
            });

            console.log(`Document classification request successful on attempt ${attempt}`);
            return res.data as string[];

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });

            if (attempt === maxRetries) {
                console.error('All retry attempts failed for document classification');
                return documents.map(() => 'unknown');
            }

            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError;
}

export async function extractDocumentTopics(documents: DocumentAnalysisRequest[]): Promise<string[][]> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Extracting topics from ${documents.length} documents`);
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/extract-document-topics`);
            
            const res = await api.post('/api/v1/extract-document-topics', { documents }, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status < 500,
            });

            console.log(`Document topic extraction request successful on attempt ${attempt}`);
            return res.data as string[][];

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });

            if (attempt === maxRetries) {
                console.error('All retry attempts failed for document topic extraction');
                return documents.map(() => []);
            }

            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

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
        console.log(`Summarizing ${tickets.length} tickets`);
        console.log(`ML Service URL: ${Config.PYTHON_ML_SERVICE_URL}`);
        
        // Only pass subject and description fields, explicitly filter out chatHistory and other fields
        const _tickets = tickets.map((t, index) => {
            const subject = t.subject || '';
            const description = t.description || '';
            
            // Log any unexpected fields for debugging
            const unexpectedFields = Object.keys(t).filter(key => !['subject', 'description'].includes(key));
            if (unexpectedFields.length > 0) {
                console.warn(`Ticket ${index} has unexpected fields:`, unexpectedFields);
            }
            
            return { 
                subject, 
                description 
            };
        });
        
        console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/summarize`);
        console.log(`Request payload sample:`, _tickets[0]);
        console.log(`Total tickets to summarize:`, _tickets.length);
        
        const res = await api.post('/api/v1/summarize', _tickets, {
            timeout: 300000, // 5 minutes
            maxContentLength: 50 * 1024 * 1024, // 50MB
            maxBodyLength: 50 * 1024 * 1024, // 50MB
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log(`Summarization request successful`);
        console.log(`Response data type:`, typeof res.data);
        console.log(`Response data length:`, Array.isArray(res.data) ? res.data.length : 'not an array');
        
        if (Array.isArray(res.data)) {
            console.log(`First summary:`, res.data[0]);
        }
        
        return res.data;
    } catch (err: any) {
        console.error('Error in summarizeTickets:', {
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            ticketsCount: tickets.length,
            config: {
                url: err.config?.url,
                method: err.config?.method,
                headers: err.config?.headers
            }
        });
        
        // Return empty array as fallback
        console.log('Returning empty array as fallback');
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

export async function getSBERTEmbeddingForText(texts: string[]) : Promise<number[][]> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries}: Getting SBERT embeddings for ${texts.length} text chunks`);
            
            // Prepare the data in the format expected by the Python service
            const textData = texts.map((text, index) => ({
                subject: '', // Empty for text chunks
                description: text // Use the text as description
            }));
            
            console.log(`Making request to: ${Config.PYTHON_ML_SERVICE_URL}/api/v1/sbert-embed`);
            console.log(`Request payload sample:`, textData[0]);
            
            const res = await api.post('/api/v1/sbert-embed', textData, {
                timeout: 300000, // 5 minutes
                maxContentLength: 50 * 1024 * 1024, // 50MB
                maxBodyLength: 50 * 1024 * 1024, // 50MB
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status < 500,
            });

            console.log(`SBERT embedding request successful on attempt ${attempt}`);
            return res.data as number[][];

        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                }
            });

            if (attempt === maxRetries) {
                console.error('All retry attempts failed for SBERT embedding');
                throw error;
            }

            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError;
}