// Re-export all services from the modular structure
export * from './services';

// Legacy exports for backward compatibility
import { QdrantClient } from '@qdrant/js-client-rest';
import Config from '../config';
import { QdrantService } from './services';
import { ticketCollectionConfig } from './schemas/ticket';

// Legacy QdrantClient instance for backward compatibility
const client = new QdrantClient({
    url: Config.QDRANT_API_URL,
    apiKey: Config.QDRANT_API_KEY,
});

export const qdrantClient = client;

// Default export for backward compatibility
export default QdrantService;

// Legacy function exports for backward compatibility
import { 
    documentQdrantService, 
    googleFileQdrantService, 
    ticketQdrantService 
} from './services';

// Document collection functions
export const createDocumentCollection = () => documentQdrantService.createDocumentCollection();
export const addDocumentToQdrant = (document: any) => documentQdrantService.addDocument(document);
export const removeDocumentFromQdrant = (documentId: string) => documentQdrantService.removeDocument(documentId);
export const searchDocumentsForInsights = (
    organizationId: string,
    customerId?: string,
    query?: string,
    limit?: number,
    minRelevanceScore?: number
) => documentQdrantService.searchForInsights(organizationId, customerId, query, limit, minRelevanceScore);
export const searchDocumentsForUserInsights = (
    organizationId: string,
    userId: string,
    query?: string,
    limit?: number,
    minRelevanceScore?: number
) => documentQdrantService.searchForUserInsights(organizationId, userId, query, limit, minRelevanceScore);

// Google file functions
export const createGoogleFileCollection = () => googleFileQdrantService.createGoogleFileCollection();
export const addGoogleFileToQdrant = (fileId: string, organizationId: string) => 
    googleFileQdrantService.addGoogleFile(fileId, organizationId);
export const removeGoogleFileFromQdrant = (fileId: string) => 
    googleFileQdrantService.removeGoogleFile(fileId);
export const searchGoogleFiles = (params: any) => googleFileQdrantService.searchGoogleFiles(params);
export const searchGoogleDriveFiles = (params: any) => googleFileQdrantService.searchGoogleFiles(params); // Legacy alias
export const getProcessedGoogleFileIds = (organizationId: string) => 
    googleFileQdrantService.getProcessedFileIds(organizationId);
export const processGoogleDriveFiles = async (organizationId: string, fileIds: string[]) => {
    const results: { fileId: string; success: boolean }[] = [];
    for (const fileId of fileIds) {
        const result = await googleFileQdrantService.addGoogleFile(fileId, organizationId);
        results.push({ fileId, success: result });
    }
    return results;
};

// Ticket functions
export const createTicketCollection = () => ticketQdrantService.createTicketCollection();
export const addTicketToQdrant = (ticket: any) => ticketQdrantService.addTicket(ticket);
export const removeTicketFromQdrant = (ticketId: string) => ticketQdrantService.removeTicket(ticketId);
export const searchTickets = (params: any) => ticketQdrantService.searchTickets(params);
export const getRecentVectors = (params: any) => ticketQdrantService.getRecentVectors(params);
export const getCustomerTicketStats = (customerId: string) => ticketQdrantService.getCustomerTicketStats(customerId);
export const searchTicketsByCustomer = (customerId: string, limit: number) => ticketQdrantService.searchTicketsByCustomer(customerId, limit);
export const updateTicketPoint = (pointId: string, payload: any) => ticketQdrantService.updateTicketPoint(pointId, payload);
export const addSingleTicket = (point: any) => ticketQdrantService.addSingleTicket(point);
export const retrieveTicketPoints = (pointIds: string[], withPayload?: boolean) => ticketQdrantService.retrieveTicketPoints(pointIds, withPayload);
export const bulkInsert = (params: { collectionName: string; points: any[] }) => {
    if (params.collectionName === ticketCollectionConfig.name) {
        return ticketQdrantService.bulkInsertTickets(params.points);
    }
    // For other collections, use the base service
    return ticketQdrantService.bulkInsert(params.collectionName, params.points);
};