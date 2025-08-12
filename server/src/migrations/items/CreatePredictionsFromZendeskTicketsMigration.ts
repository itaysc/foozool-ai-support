import { BaseMigration } from '../BaseMigration';
import { MigrationResult } from '../types';
import fetchTickets from '../../services/zendesk';
import { getSBERTEmbedding, classifyIntent } from '../../services/call-python';
import { analyzeSentiment } from '../../services/nlp';
import { findZendeskSimilarTickets } from '../../services/tickets/search';
import { PredictionModel } from '../../schemas/prediction.schema';
import { getDemoOrganization } from '../../dal/organization.dal';
import { extractCustomerMessage } from '../../utils/text-sanitize';

export class CreatePredictionsFromZendeskTicketsMigration extends BaseMigration {
  name = 'create-predictions-from-zendesk-tickets';
  description = 'Fetch existing Zendesk tickets and create risk predictions using KNN analysis';
  version = '1.0.0';
  databaseType = 'mongo' as const;

  protected async execute(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      processedRecords: 0,
      errors: []
    };

    console.log(`🚀 Starting ${this.name} migration...`);

    try {
      // Get demo organization for context
      const organization = await getDemoOrganization();
      if (!organization) {
        throw new Error('No demo organization found');
      }

      console.log(`📊 Using organization: ${organization.name} (${organization._id})`);

      // Process tickets in chunks from Zendesk to optimize memory usage
      const maxPages = 100;
      const perPage = 100;
      const bulkSize = 50; // Process in smaller bulks for efficiency
      let totalProcessedCount = 0;
      let totalTicketCount = 0;

      console.log(`🎫 Processing ${maxPages} pages of tickets from Zendesk (${perPage} tickets per page)...`);

      // Process pages in chunks to avoid loading all tickets into memory
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Fetching page ${page}/${maxPages} from Zendesk...`);
        
        try {
          const pageResponse = await fetchTickets({ 
            maxPages: 1, 
            perPage,
            fromPage: page 
          });

          if (!pageResponse || !pageResponse.payload || pageResponse.payload.length === 0) {
            console.log(`📭 No more tickets found on page ${page}, stopping...`);
            break;
          }

          const pageTickets = pageResponse.payload;
          totalTicketCount += pageTickets.length;
          console.log(`📋 Page ${page}: Found ${pageTickets.length} tickets`);

          // Process this page's tickets in bulks
          for (let i = 0; i < pageTickets.length; i += bulkSize) {
            const bulk = pageTickets.slice(i, i + bulkSize);
            const bulkNumber = Math.floor(totalProcessedCount / bulkSize) + 1;
            
            console.log(`📦 Processing bulk ${bulkNumber} - Page ${page} (${bulk.length} tickets)`);

            try {
              const bulkProcessedCount = await this.processBulkTickets(bulk, organization._id!.toString());
              totalProcessedCount += bulkProcessedCount;
              
              console.log(`✅ Bulk ${bulkNumber} completed: ${bulkProcessedCount}/${bulk.length} tickets processed. Total: ${totalProcessedCount}`);
            } catch (error) {
              const errorMsg = `Failed to process bulk ${bulkNumber} from page ${page}: ${(error as Error).message}`;
              console.error(`❌ ${errorMsg}`);
              result.errors.push(errorMsg);
            }
            
            // Small delay between bulks
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // Clear page tickets from memory and force garbage collection
          pageTickets.length = 0;
          if (global.gc) {
            global.gc();
          }

        } catch (error) {
          const errorMsg = `Failed to fetch page ${page}: ${(error as Error).message}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
          // Continue with next page
        }

        // Delay between pages to be nice to Zendesk API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      result.totalRecords = totalTicketCount;
      result.processedRecords = totalProcessedCount;
      result.success = result.errors.length < (totalTicketCount * 0.5); // Success if less than 50% errors
      result.metadata = {
        organizationId: organization._id!.toString(),
        organizationName: organization.name,
        totalPages: maxPages,
        successRate: totalTicketCount > 0 ? `${Math.round((totalProcessedCount / totalTicketCount) * 100)}%` : '0%'
      };

      console.log(`🎉 Migration completed: ${totalProcessedCount}/${totalTicketCount} tickets processed across ${maxPages} pages`);
      console.log(`📊 Success rate: ${result.metadata.successRate}`);

    } catch (error) {
      console.error(`💥 Migration failed:`, error);
      result.errors.push((error as Error).message);
      result.success = false;
    }

    return result;
  }

  /**
   * Process a bulk of tickets with optimized batch SBERT calls
   */
  private async processBulkTickets(tickets: any[], organizationId: string): Promise<number> {
    console.log(`🔄 Processing bulk of ${tickets.length} tickets...`);
    
    // Step 1: Filter out tickets that already have predictions and prepare ticket payloads
    const ticketsToProcess: Array<{
      ticket: any;
      ticketPayload: { subject: string; description: string };
      index: number;
    }> = [];

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      // Check if prediction already exists
      const existingPrediction = await PredictionModel.findOne({ ticketId: ticket.externalId });
      if (existingPrediction) {
        console.log(`⏭️  Prediction already exists for ticket ${ticket.externalId}, skipping`);
        continue;
      }

      // Extract and clean ticket content
      const ticketPayload = {
        subject: ticket.subject || '',
        description: extractCustomerMessage(ticket.description || ''),
      };

      // Skip tickets with empty content
      if (!ticketPayload.subject && !ticketPayload.description) {
        console.log(`⚠️  Skipping ticket ${ticket.externalId} - no content`);
        continue;
      }

      ticketsToProcess.push({ ticket, ticketPayload, index: i });
    }

    if (ticketsToProcess.length === 0) {
      console.log(`📭 No tickets to process in this bulk`);
      return 0;
    }

    console.log(`🎯 Processing ${ticketsToProcess.length} tickets (skipped ${tickets.length - ticketsToProcess.length})`);

    // Step 2: Batch SBERT embedding generation
    const ticketPayloads = ticketsToProcess.map(item => item.ticketPayload);
    console.log(`🧠 Generating SBERT embeddings for ${ticketPayloads.length} tickets...`);
    
    const sbertEmbeddings = await getSBERTEmbedding(ticketPayloads);
    console.log(`✅ Generated ${sbertEmbeddings.length} embeddings`);

    // Step 3: Process each ticket with its corresponding embedding
    let successCount = 0;
    
    for (let i = 0; i < ticketsToProcess.length; i++) {
      const { ticket, ticketPayload } = ticketsToProcess[i];
      const embedding = sbertEmbeddings[i];

      try {
        await this.generatePredictionWithEmbedding({
          ticket,
          ticketPayload,
          embedding,
          organizationId
        });
        
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to process ticket ${ticket.externalId}:`, error);
        // Continue with next ticket
      }
    }

    console.log(`📊 Bulk processing completed: ${successCount}/${ticketsToProcess.length} successful`);
    return successCount;
  }

  /**
   * Generate prediction for a single ticket with pre-computed embedding
   */
  private async generatePredictionWithEmbedding({
    ticket,
    ticketPayload,
    embedding,
    organizationId
  }: {
    ticket: any;
    ticketPayload: { subject: string; description: string };
    embedding: number[];
    organizationId: string;
  }): Promise<void> {
    try {
      // 1. Analyze sentiment
      const sentimentResult = analyzeSentiment(ticketPayload.description);

      // 2. Find similar tickets using KNN search (with pre-computed embedding)
      const similarTicketsResponse = await findZendeskSimilarTickets({
        ticket: ticketPayload,
        k: 5,
        embedding: embedding,
        fetchComments: false, // Skip comments for performance
      });

      const similarTickets = similarTicketsResponse.payload || [];

      // 3. Generate predictions based on similar tickets
      await this.generateTicketPredictions({
        ticketId: ticket.externalId,
        organizationId,
        similarTickets,
        sentimentScore: sentimentResult.score,
        ticketData: ticket,
      });

    } catch (error) {
      console.error(`Error processing ticket ${ticket.externalId}:`, error);
      throw error;
    }
  }

  /**
   * Legacy method for individual ticket processing (kept for compatibility)
   */
  private async generatePredictionForTicket(ticket: any, organizationId: string): Promise<void> {
    // Check if prediction already exists
    const existingPrediction = await PredictionModel.findOne({ ticketId: ticket.externalId });
    if (existingPrediction) {
      console.log(`⏭️  Prediction already exists for ticket ${ticket.externalId}, skipping`);
      return;
    }

    // Extract and clean ticket content
    const ticketPayload = {
      subject: ticket.subject || '',
      description: extractCustomerMessage(ticket.description || ''),
    };

    // Skip tickets with empty content
    if (!ticketPayload.subject && !ticketPayload.description) {
      console.log(`⚠️  Skipping ticket ${ticket.externalId} - no content`);
      return;
    }

    try {
      // 1. Analyze sentiment
      const sentimentResult = analyzeSentiment(ticketPayload.description);

      // 2. Get SBERT embedding
      const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);

      // 3. Find similar tickets using KNN search
      const similarTicketsResponse = await findZendeskSimilarTickets({
        ticket: ticketPayload,
        k: 5,
        embedding: sbertEmbedding,
        fetchComments: false, // Skip comments for performance
      });

      const similarTickets = similarTicketsResponse.payload || [];

      // 4. Generate predictions based on similar tickets (mimic webhook logic)
      await this.generateTicketPredictions({
        ticketId: ticket.externalId,
        organizationId,
        similarTickets,
        sentimentScore: sentimentResult.score,
        ticketData: ticket, // Pass original ticket for priority/status/tags
      });

    } catch (error) {
      console.error(`Error processing ticket ${ticket.externalId}:`, error);
      throw error;
    }
  }

  private async generateTicketPredictions({
    ticketId,
    organizationId,
    similarTickets,
    sentimentScore,
    ticketData,
  }: {
    ticketId: string;
    organizationId: string;
    similarTickets: any[];
    sentimentScore: number;
    ticketData: any;
  }): Promise<void> {
    console.log(`🔮 Generating prediction for ticket ${ticketId} based on ${similarTickets.length} similar tickets`);

    // Analyze similar tickets for prediction patterns
    let escalatedCount = 0;
    let lowCsatCount = 0;
    let highPriorityCount = 0;

    for (const similarTicket of similarTickets) {
      // Predict escalation based on priority, status, and historical patterns
      const hasEscalationSignals = 
        similarTicket.priority === 'urgent' || 
        similarTicket.priority === 'high' ||
        similarTicket.status === 'open' ||
        (similarTicket.tags && similarTicket.tags.some((tag: string) => 
          ['escalated', 'urgent', 'complaint', 'angry'].includes(tag.toLowerCase())
        ));
      
      if (hasEscalationSignals) {
        escalatedCount++;
      }

      // Predict CSAT risk based on sentiment, priority, and ticket characteristics
      const hasLowCsatSignals = 
        (similarTicket.priority === 'urgent' || similarTicket.priority === 'high') ||
        (similarTicket.tags && similarTicket.tags.some((tag: string) => 
          ['complaint', 'bug', 'error', 'frustrated', 'angry', 'disappointed'].includes(tag.toLowerCase())
        )) ||
        similarTicket.similarity < 0.3; // Low similarity might indicate unique/complex issues

      if (hasLowCsatSignals) {
        lowCsatCount++;
      }

      if (similarTicket.priority === 'urgent' || similarTicket.priority === 'high') {
        highPriorityCount++;
      }
    }

    const totalTickets = Math.max(similarTickets.length, 1);
    
    // Calculate confidence scores
    let escalationRiskConfidence = escalatedCount / totalTickets;
    let csatRiskConfidence = lowCsatCount / totalTickets;

    // Boost confidence based on current ticket sentiment
    if (sentimentScore < -0.3) {
      escalationRiskConfidence = Math.min(1, escalationRiskConfidence + 0.2);
      csatRiskConfidence = Math.min(1, csatRiskConfidence + 0.3);
    }

    // Boost confidence based on current ticket characteristics
    if (ticketData.priority === 'urgent' || ticketData.priority === 'high') {
      escalationRiskConfidence = Math.min(1, escalationRiskConfidence + 0.1);
      csatRiskConfidence = Math.min(1, csatRiskConfidence + 0.1);
    }

    // Boost confidence if high priority patterns detected
    if (highPriorityCount / totalTickets > 0.5) {
      escalationRiskConfidence = Math.min(1, escalationRiskConfidence + 0.1);
      csatRiskConfidence = Math.min(1, csatRiskConfidence + 0.1);
    }

    // Determine risk levels
    const escalationRisk = escalationRiskConfidence > 0.7 ? 'High' : 
                          (escalationRiskConfidence > 0.4 ? 'Medium' : 'Low');
    
    const csatRisk = csatRiskConfidence > 0.5 ? 'High' : 
                    (csatRiskConfidence > 0.2 ? 'Medium' : 'Low');

    // Create prediction object
    const newPrediction = {
      ticketId,
      organizationId,
      predictedEscalation: {
        risk: escalationRisk,
        confidence: Math.round(escalationRiskConfidence * 100) / 100,
      },
      predictedCSAT: {
        risk: csatRisk,
        confidence: Math.round(csatRiskConfidence * 100) / 100,
      },
      createdAt: new Date(),
    };

    // Save prediction to MongoDB
    await PredictionModel.create(newPrediction);

    console.log(`💾 Prediction saved for ticket ${ticketId}: Escalation=${escalationRisk}(${escalationRiskConfidence.toFixed(2)}), CSAT=${csatRisk}(${csatRiskConfidence.toFixed(2)})`);
  }
}