import { faker } from '@faker-js/faker';
import { v5 as uuidv5 } from 'uuid';
import QdrantService from '../../qdrant/service';
import { ticketCollectionConfig, QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';
import { analyzeSentiment } from '../nlp';
import { getSBERTEmbedding } from '../call-python';
import { OrganizationModel } from '../../schemas/organization.schema';
import { CustomerModel } from '../../schemas/customer.schema';
import { CustomerActivityModel } from '../../schemas/customerActivity.schema';

interface GenerateTicketsParams {
  organizationId: string;
  customerId: string;
  numTickets: number;
}

interface TicketTemplate {
  subject: string;
  description: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed';
  intent: string;
}

/**
 * Generates realistic support tickets for a specific customer based on their activities and organization's products
 * and inserts them into Qdrant collection.
 * 
 * @param organizationId - The organization ID
 * @param customerId - The customer ID  
 * @param numTickets - Number of tickets to generate
 * @returns Promise with generation results
 */
export async function generateQdrantTickets({
  organizationId,
  customerId,
  numTickets
}: GenerateTicketsParams): Promise<{
  success: boolean;
  ticketsCreated: number;
  errors: string[];
}> {
  const result = {
    success: false,
    ticketsCreated: 0,
    errors: [] as string[]
  };

  console.log(`🚀 Starting ticket generation for customer ${customerId}...`);
  console.log(`📊 Will create ${numTickets} tickets`);

  try {
    // Fetch organization and customer data
    const [organization, customer, customerActivities] = await Promise.all([
      OrganizationModel.findById(organizationId).lean(),
      CustomerModel.findById(customerId).lean(),
      CustomerActivityModel.find({ 
        organizationId, 
        customerId 
      }).lean()
    ]);

    if (!organization) {
      throw new Error(`Organization with ID ${organizationId} not found`);
    }

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    console.log(`📋 Found organization: ${organization.name}`);
    console.log(`👤 Found customer: ${customer.name}`);
    console.log(`📈 Found ${customerActivities.length} customer activities`);

    // Initialize Qdrant service
    const qdrantService = new QdrantService();

    // Check if collection exists
    const collections = await qdrantService.client.getCollections();
    const collection = collections.collections.find(
      col => col.name === ticketCollectionConfig.name
    );
    
    if (!collection) {
      console.log(`⚠️  Collection "${ticketCollectionConfig.name}" does not exist. Creating it...`);
      await qdrantService.createCollection({
        collectionName: ticketCollectionConfig.name,
        vectorSize: ticketCollectionConfig.vectorConfig.size,
        distance: ticketCollectionConfig.vectorConfig.distance
      });
    }

    // Generate ticket templates based on customer activities
    const ticketTemplates = generateTicketTemplates(customer, customerActivities, organization);
    
    // Process tickets in batches
    const batchSize = 10;
    let totalInserted = 0;
    
    for (let i = 0; i < numTickets; i += batchSize) {
      const batchCount = Math.min(batchSize, numTickets - i);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(numTickets / batchSize)} (${batchCount} tickets)`);
      
      const insertedCount = await processTicketBatch(
        ticketTemplates, 
        batchCount, 
        qdrantService, 
        organizationId, 
        customerId
      );
      totalInserted += insertedCount;
    }
    
    result.ticketsCreated = totalInserted;
    result.success = true;
    console.log(`✅ Successfully created ${totalInserted} tickets for ${customer.name}`);
    
  } catch (error: any) {
    console.error(`❌ Ticket generation failed:`, error);
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Generates ticket templates based on customer activities and organization products
 */
function generateTicketTemplates(
  customer: any, 
  activities: any[], 
  organization: any
): TicketTemplate[] {
  const templates: TicketTemplate[] = [];
  
  // Extract unique solution names from activities
  const solutionNames = [...new Set(activities.map(activity => activity.solutionName))];
  
  // Generate templates for each solution
  solutionNames.forEach(solutionName => {
    const solutionActivities = activities.filter(activity => activity.solutionName === solutionName);
    
    // Generate different types of tickets for each solution
    templates.push(...generateSolutionTickets(solutionName, solutionActivities, customer, organization));
  });

  // Add some general support tickets
  templates.push(...generateGeneralTickets(customer, organization));

  return templates;
}

/**
 * Generates tickets specific to a solution based on customer activities
 */
function generateSolutionTickets(
  solutionName: string, 
  activities: any[], 
  customer: any, 
  organization: any
): TicketTemplate[] {
  const tickets: TicketTemplate[] = [];
  
  // Analyze activity patterns
  const totalUsage = activities.reduce((sum, activity) => sum + activity.metricValue, 0);
  const avgUsage = totalUsage / activities.length;
  const hasHighUsage = avgUsage > 100; // Threshold for high usage
  
  // Generate tickets based on usage patterns
  if (hasHighUsage) {
    // High usage customers - more technical issues
    tickets.push({
      subject: `${solutionName} - Performance degradation during peak usage`,
      description: `We are experiencing significant performance issues with ${solutionName} during our peak usage hours. Response times have increased from ${Math.floor(avgUsage * 0.8)}ms to ${Math.floor(avgUsage * 1.5)}ms. This is affecting our ${customer.industry || 'business'} operations.`,
      tags: [solutionName.toLowerCase().replace(/\s+/g, '-'), 'performance', 'peak-usage', 'urgent'],
      priority: 'high',
      status: 'open',
      intent: 'performance-issue'
    });

    tickets.push({
      subject: `${solutionName} - Scaling requirements for increased load`,
      description: `Our usage of ${solutionName} has grown significantly (currently ${Math.floor(totalUsage)} ${activities[0]?.unit || 'units'} per month). We need to discuss scaling options and capacity planning for the next quarter.`,
      tags: [solutionName.toLowerCase().replace(/\s+/g, '-'), 'scaling', 'capacity', 'planning'],
      priority: 'medium',
      status: 'pending',
      intent: 'scaling-request'
    });
  } else {
    // Lower usage customers - more support/onboarding issues
    tickets.push({
      subject: `${solutionName} - Need help with advanced features`,
      description: `We've been using ${solutionName} for a few months now and would like to explore more advanced features. Currently using ${Math.floor(avgUsage)} ${activities[0]?.unit || 'units'} per month. Can we schedule a demo?`,
      tags: [solutionName.toLowerCase().replace(/\s+/g, '-'), 'advanced-features', 'demo', 'onboarding'],
      priority: 'low',
      status: 'new',
      intent: 'feature-request'
    });
  }

  // Common tickets for all usage levels
  tickets.push({
    subject: `${solutionName} - Billing inquiry for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    description: `We have a question about our ${solutionName} billing for this month. We were charged for ${Math.floor(totalUsage)} ${activities[0]?.unit || 'units'} but our internal tracking shows ${Math.floor(totalUsage * 0.9)}. Can you help clarify?`,
    tags: [solutionName.toLowerCase().replace(/\s+/g, '-'), 'billing', 'discrepancy', 'clarification'],
    priority: 'medium',
    status: 'pending',
    intent: 'billing-inquiry'
  });

  tickets.push({
    subject: `${solutionName} - Integration with ${faker.company.name()}`,
    description: `We need to integrate ${solutionName} with our ${faker.company.name()} system. We're using ${Math.floor(avgUsage)} ${activities[0]?.unit || 'units'} per month and need seamless data flow between systems.`,
    tags: [solutionName.toLowerCase().replace(/\s+/g, '-'), 'integration', 'api', 'data-flow'],
    priority: 'medium',
    status: 'open',
    intent: 'integration-request'
  });

  return tickets;
}

/**
 * Generates general support tickets not tied to specific solutions
 */
function generateGeneralTickets(customer: any, organization: any): TicketTemplate[] {
  const tickets: TicketTemplate[] = [];

  // Industry-specific tickets
  if (customer.industry) {
    tickets.push({
      subject: `${customer.industry} compliance requirements`,
      description: `As a ${customer.industry} company, we need to ensure our ${organization.name} services meet industry compliance standards. Can you provide documentation on compliance features?`,
      tags: ['compliance', customer.industry.toLowerCase(), 'documentation'],
      priority: 'medium',
      status: 'open',
      intent: 'compliance-inquiry'
    });
  }

  // Company size specific tickets
  if (customer.companySize === '500+') {
    tickets.push({
      subject: 'Enterprise support and SLA requirements',
      description: `As an enterprise customer with ${customer.companySize} employees, we need to discuss enterprise support options and SLA requirements for our ${organization.name} services.`,
      tags: ['enterprise', 'support', 'sla', 'requirements'],
      priority: 'high',
      status: 'pending',
      intent: 'enterprise-support'
    });
  }

  // General support tickets
  tickets.push({
    subject: 'Account management and user permissions',
    description: `We need help managing user permissions and account settings for our ${organization.name} account. We have multiple team members who need different access levels.`,
    tags: ['account-management', 'permissions', 'user-access'],
    priority: 'medium',
    status: 'open',
    intent: 'account-management'
  });

  tickets.push({
    subject: 'Training and documentation request',
    description: `Our team needs updated training materials and documentation for ${organization.name} services. We have new team members joining and need comprehensive resources.`,
    tags: ['training', 'documentation', 'onboarding', 'resources'],
    priority: 'low',
    status: 'new',
    intent: 'training-request'
  });

  return tickets;
}

/**
 * Processes a batch of tickets and inserts them into Qdrant
 */
async function processTicketBatch(
  templates: TicketTemplate[],
  batchSize: number,
  qdrantService: QdrantService,
  organizationId: string,
  customerId: string
): Promise<number> {
  const qdrantPoints: QdrantTicketPoint[] = [];
  let processedCount = 0;
  
  for (let i = 0; i < batchSize; i++) {
    try {
      // Select a random template
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      // Generate unique ticket ID
      const ticketId = `${customerId.slice(-8)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      // Create ticket payload for analysis
      const ticketPayload = {
        subject: template.subject,
        description: template.description,
      };

      // Analyze sentiment
      const sentimentResult = analyzeSentiment(ticketPayload.subject + ' ' + ticketPayload.description);

      // Generate SBERT embedding
      const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);

      // Generate Qdrant point ID
      const qdrantPointId = uuidv5(ticketId, QDRANT_POINT_NAMESPACE);

      // Create Qdrant point
      const qdrantPoint: QdrantTicketPoint = {
        id: qdrantPointId,
        vector: sbertEmbedding,
        payload: {
          ticket_id: ticketId,
          organization: organizationId,
          customer_id: customerId,
          sentiment_score: sentimentResult.score,
          sentiment: sentimentResult.sentiment,
          created_at: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random time within last 30 days
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          tags: template.tags,
          intent: template.intent,
          user_agent: getRandomUserAgent(),
          resolution_time_ms: generateResolutionTime(template.priority),
          resolved_at: template.status === 'closed' || template.status === 'solved' 
            ? Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 
            : undefined,
          long_resolution_predicted: Math.random() > 0.7, // 30% chance of long resolution
          prediction_confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
          prediction_added_at: Date.now() - Math.random() * 24 * 60 * 60 * 1000 // Within last 24 hours
        }
      };

      qdrantPoints.push(qdrantPoint);
      processedCount++;
    } catch (error) {
      console.error(`Error processing ticket ${i + 1}:`, error);
    }
  }

  // Insert batch into Qdrant
  if (qdrantPoints.length > 0) {
    try {
      await qdrantService.client.upsert(ticketCollectionConfig.name, {
        wait: true,
        points: qdrantPoints
      });
      console.log(`✅ Inserted ${qdrantPoints.length} tickets into Qdrant`);
    } catch (error) {
      console.error(`Error inserting batch:`, error);
      throw error;
    }
  }
  
  return qdrantPoints.length;
}

/**
 * Generates a random user agent string
 */
function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.120 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Generates resolution time based on priority
 */
function generateResolutionTime(priority: string): number {
  const baseTime = {
    'urgent': 2 * 60 * 60 * 1000, // 2 hours
    'high': 8 * 60 * 60 * 1000,   // 8 hours
    'medium': 24 * 60 * 60 * 1000, // 24 hours
    'low': 72 * 60 * 60 * 1000    // 72 hours
  };
  
  const base = baseTime[priority as keyof typeof baseTime] || baseTime.medium;
  return base + Math.random() * base; // Add some variance
}

// Export for use in other scripts or API endpoints
export default generateQdrantTickets;
