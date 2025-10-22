// Export all Qdrant services
export { QdrantService } from './base.service';
export { DocumentQdrantService } from './document.service';
export { GoogleFileQdrantService } from './googleFile.service';
export { TicketQdrantService } from './ticket.service';

// Create singleton instances for easy access
import { DocumentQdrantService } from './document.service';
import { GoogleFileQdrantService } from './googleFile.service';
import { TicketQdrantService } from './ticket.service';

// Singleton instances
export const documentQdrantService = new DocumentQdrantService();
export const googleFileQdrantService = new GoogleFileQdrantService();
export const ticketQdrantService = new TicketQdrantService();
