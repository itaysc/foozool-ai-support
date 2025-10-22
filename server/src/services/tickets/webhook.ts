import { IResponse, IAgentSuggestion, ZendeskTicketWebhookPayload } from '../../types';
import { ICRMWebhookPayload } from '../../types/crm';
import { classifyIntent, getSBERTEmbedding, summarizeTickets } from '../call-python';
import { findZendeskSimilarTickets } from './search';
import { generateMockProduct } from './product';
import { buildAgentSuggestionPrompt, buildPrompt } from './prompts';
import { callLLM } from '../llm';
import { addCommentToTicket } from '../zendesk';
import sanitizeText, { extractCustomerMessage } from '../../utils/text-sanitize';
import { updateTicketPoint, addSingleTicket, retrieveTicketPoints } from '../../qdrant/service';
import { QdrantTicketPoint } from '../../qdrant/schemas/ticket';
import { analyzeSentiment } from '../nlp';
import { executeAutonomousActions } from '../autonomousAI';
import { v5 as uuidv5 } from 'uuid';
import { QDRANT_POINT_NAMESPACE } from '../../qdrant/utils';
import { UserContextManager } from '../../context/userContext';
import { PredictionModel } from '../../schemas/prediction.schema';
import { ticketCollectionConfig } from '../../qdrant/schemas/ticket';
import { CRMService } from '../crm';

const DEFAULT_CONFIDENCE_SCORE = 0.3;

/**
 * Generate real-time predictions for ticket escalation and CSAT risk
 */
async function generateTicketPredictions({
  ticketId,
  organizationId,
  similarTickets,
  sentimentScore,
  embedding,
  longResolutionPredicted = false,
  predictionConfidence = 0
}: {
  ticketId: string;
  organizationId: string;
  similarTickets: any[];
  sentimentScore: number;
  embedding: number[];
  longResolutionPredicted?: boolean;
  predictionConfidence?: number;
}): Promise<void> {
  console.log(`Generating predictions for ticket ${ticketId} based on ${similarTickets.length} similar tickets`);

  // Analyze similar tickets for prediction patterns
  let escalatedCount = 0;
  let lowCsatCount = 0;
  let highPriorityCount = 0;
  let negativeSentimentCount = 0;

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

  // Factor in current ticket's sentiment
  if (sentimentScore < -0.2) {
    negativeSentimentCount++;
  }

  const totalTickets = Math.max(similarTickets.length, 1); // Avoid division by zero
  
  // Calculate confidence scores
  let escalationRiskConfidence = escalatedCount / totalTickets;
  let csatRiskConfidence = lowCsatCount / totalTickets;

  // Boost confidence based on current ticket sentiment
  if (sentimentScore < -0.3) {
    escalationRiskConfidence = Math.min(1, escalationRiskConfidence + 0.2);
    csatRiskConfidence = Math.min(1, csatRiskConfidence + 0.3);
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
    longResolutionPredicted,
    predictionConfidence,
    createdAt: new Date(),
  };

  // Save prediction to MongoDB with upsert to handle duplicate tickets
  await PredictionModel.findOneAndUpdate(
    { ticketId },
    newPrediction,
    { upsert: true, new: true }
  );

  console.log(`Prediction saved for ticket ${ticketId}: Escalation=${escalationRisk}(${escalationRiskConfidence}), CSAT=${csatRisk}(${csatRiskConfidence}), LongResolution=${longResolutionPredicted}(${predictionConfidence})`);
}

/**
 * Process intent classification for a ticket
 */
async function processTicketIntent(ticketPayload: { subject: string; description: string }) {
  const intents = await classifyIntent(ticketPayload);
  return intents;
}

async function getAgentSuggestion(userId: string, ticketPayload: { subject: string; description: string }, product: any, similarTickets: any[]) : Promise<IAgentSuggestion> {
  const prompt = buildAgentSuggestionPrompt(ticketPayload, product, similarTickets);
  const response = await callLLM({
    userId,
    prompt,
    maxTokens: 1000,
    temperature: 0,
    isChat: true,
    systemMsg: 'You are a helpful AI assistant that can answer questions and help with tasks.',
  });
  const data = response.data || '';
  const parsedResponse = JSON.parse(data) as IAgentSuggestion;
  return parsedResponse;
}

/**
 * Generate AI response for the ticket using similar tickets and product context
 */
async function generateTicketResponse(
  userId: string,
  ticketPayload: { subject: string; description: string },
  similarTickets: any[],
  product: any
): Promise<string> {
  const prompt = buildPrompt(ticketPayload.description, similarTickets, product);
  
  const response = await callLLM({
    userId,
    prompt,
    maxTokens: 1000,
    temperature: 0.2,
    isChat: true,
    systemMsg: 'You are a helpful AI assistant that can answer questions and help with tasks.',
  });
  
  // Return the LLM response as-is, expecting it to include confidence
  const baseResponse = response.data || '';
  try {
    const parsed = JSON.parse(sanitizeText(baseResponse));
    // Ensure confidence is present, use default if not
    if (typeof parsed.confidence !== 'number') {
      parsed.confidence = DEFAULT_CONFIDENCE_SCORE;
    }
    return JSON.stringify(parsed);
  } catch (error) {
    // If parsing fails, return the original response with default confidence
    return JSON.stringify({
      response: baseResponse,
      action: 'commentOnly',
      confidence: DEFAULT_CONFIDENCE_SCORE
    });
  }
}

/**
 * Extract and summarize comments from similar tickets
 */
async function extractAndSummarizeTicketComments(similarTickets: any[]): Promise<void> {
  // Extract and summarize comments from similar tickets
  const commentsForSummarization = similarTickets
    .filter(ticket => ticket.comments && Array.isArray(ticket.comments) && ticket.comments.length > 0)
    .map(ticket => {
      // Extract all comment bodies and join them
      const commentTexts = (ticket.comments as any[])
        .filter(comment => comment.body && comment.body.trim())
        .map(comment => comment.body)
        .join('\n\n');
      
      return {
        subject: `Comments from ticket ${ticket.externalId}`,
        description: commentTexts
      };
    });

  // Summarize comments if there are any
  let commentsSummary: string[] = [];
  if (commentsForSummarization.length > 0) {
    console.log(`Summarizing comments from ${commentsForSummarization.length} similar tickets`);
    commentsSummary = await summarizeTickets(commentsForSummarization);
  }

  // Add summarized comments to each ticket's context
  similarTickets.forEach((sTicket, index) => {
    if (commentsSummary[index]) {
      // Append the summarized comments to the ticket description
      sTicket.description = sTicket.description + '\n\nConversation Summary: ' + commentsSummary[index];
      console.log(`Added conversation summary to ticket ${sTicket.externalId}`);
    }
  });
}

/**
 * Analyze similar tickets and predict long resolution time
 */
async function analyzeResolutionTimePrediction({
  ticket,
  similarTickets,
  organizationId
}: {
  ticket: ZendeskTicketWebhookPayload;
  similarTickets: any[];
  organizationId: string;
}): Promise<{
  longResolutionPredicted: boolean;
  predictionConfidence: number;
}> {
  let longResolutionPredicted = false;
  let predictionConfidence = 0;
  
  if (similarTickets.length === 0) {
    return { longResolutionPredicted, predictionConfidence };
  }

  // Get resolution time data from Qdrant for similar tickets
  try {
    const similarTicketIds = similarTickets.map(t => t.externalId).filter(Boolean);
    
    // Get Qdrant points for similar tickets to check resolution times
    const qdrantPoints = await Promise.all(
      similarTicketIds.map(async (ticketId) => {
        try {
          const qdrantPointId = uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
          const result = await retrieveTicketPoints([qdrantPointId], true);
          
          if (result && result.length > 0) {
            const point = result[0];
            return {
              ticketId,
              resolution_time_ms: point.payload?.resolution_time_ms,
              resolved_at: point.payload?.resolved_at,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error retrieving Qdrant point for ticket ${ticketId}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results and tickets with resolution data
    const resolvedTickets = qdrantPoints.filter((p): p is NonNullable<typeof p> => p !== null && p.resolution_time_ms && p.resolution_time_ms > 0);
    
    if (resolvedTickets.length > 0) {
      const avgResolutionTime = resolvedTickets.reduce((sum, t) => sum + (t.resolution_time_ms || 0), 0) / resolvedTickets.length;
      const longResolutionThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // Predict long resolution if average is above threshold
      if (avgResolutionTime > longResolutionThreshold) {
        longResolutionPredicted = true;
        // Calculate confidence based on how many similar tickets had long resolution
        const longResolutionCount = resolvedTickets.filter(t => (t.resolution_time_ms || 0) > longResolutionThreshold).length;
        predictionConfidence = longResolutionCount / resolvedTickets.length;
        
        console.log(`Long resolution predicted for ticket ${ticket.ticket_id} with ${(predictionConfidence * 100).toFixed(1)}% confidence`);
        
        // Add comment to Zendesk ticket
        try {
          await addCommentToTicket(ticket.ticket_id.toString(), 
            `⚠️ AI Prediction: This ticket may take longer than usual to resolve based on similar historical tickets. Average resolution time for similar tickets: ${Math.round(avgResolutionTime / (1000 * 60 * 60))} hours.`, 
            false
          );
          console.log(`Added long resolution prediction comment to ticket ${ticket.ticket_id}`);
        } catch (tagError: any) {
          console.error(`Failed to add long resolution prediction to ticket ${ticket.ticket_id}:`, tagError.message);
        }
      }
    }
  } catch (qdrantError) {
    console.error(`Error analyzing resolution times from Qdrant:`, qdrantError);
  }

  return { longResolutionPredicted, predictionConfidence };
}

/**
 * Update Qdrant point with long resolution prediction information
 */
async function updateQdrantWithPrediction({
  ticketId,
  longResolutionPredicted,
  predictionConfidence
}: {
  ticketId: string;
  longResolutionPredicted: boolean;
  predictionConfidence: number;
}): Promise<void> {
  if (!longResolutionPredicted) {
    return;
  }

  try {
    const qdrantPointId = uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
    
    const updateSuccess = await updateTicketPoint(qdrantPointId, {
      long_resolution_predicted: true,
      prediction_confidence: predictionConfidence,
      prediction_added_at: Date.now(),
    });

    if (updateSuccess) {
      console.log(`Successfully updated Qdrant point for ticket ${ticketId} with long resolution prediction`);
    } else {
      console.error(`Failed to update Qdrant point for ticket ${ticketId} with prediction`);
    }
  } catch (qdrantError) {
    console.error(`Error updating Qdrant prediction for ticket ${ticketId}:`, qdrantError);
  }
}

/**
 * Update Qdrant point with resolution information
 */
async function updateQdrantWithResolution({
  ticketId,
  resolutionTimeMs,
  resolvedAt
}: {
  ticketId: string;
  resolutionTimeMs: number;
  resolvedAt: number;
}): Promise<void> {
  try {
    const qdrantPointId = uuidv5(ticketId.toString(), QDRANT_POINT_NAMESPACE);
    
    const updateSuccess = await updateTicketPoint(qdrantPointId, {
      resolution_time_ms: resolutionTimeMs,
      resolved_at: resolvedAt,
    });

    if (updateSuccess) {
      console.log(`Successfully updated Qdrant point for ticket ${ticketId} with resolution time`);
    } else {
      console.error(`Failed to update Qdrant point for ticket ${ticketId}`);
    }
  } catch (qdrantError) {
    console.error(`Error updating Qdrant for ticket ${ticketId}:`, qdrantError);
    // Continue processing even if Qdrant update fails
  }
}

/**
 * Handle new ticket creation webhook
 */
async function handleNewTicketWebhook(ticket: ZendeskTicketWebhookPayload): Promise<IResponse> {
  try {
    // Get user ID and organization ID from context
    const userId = UserContextManager.getCurrentUserId();
    const organizationId = UserContextManager.getCurrentOrganizationId();
    
    if (!userId || !organizationId) {
      throw new Error('User context not available');
    }
    
    console.log(`Processing webhook for ticket ${ticket.ticket_id}`);
    
    // Extract ticket payload
    const ticketPayload = {
      subject: ticket.subject,
      description: extractCustomerMessage(ticket.description),
    };

    // Analyze sentiment
    const sentimentResult = analyzeSentiment(ticketPayload.subject + ' ' + ticketPayload.description);

    // Process intent classification
    const intents = await processTicketIntent(ticketPayload);
    const summary = await summarizeTickets([ticketPayload]);

    const [sbertEmbedding] = await getSBERTEmbedding([ticketPayload]);
    // Save ticket point in qdrant
    // Generate a UUID for the Qdrant point ID based on the ticket ID
    const qdrantPointId = uuidv5(ticket.ticket_id.toString(), QDRANT_POINT_NAMESPACE);
    
    const qdrantPoint: QdrantTicketPoint = {
      id: qdrantPointId,
      vector: sbertEmbedding,
      payload: {
        ticket_id: ticket.ticket_id,
        organization: organizationId,
        sentiment_score: sentimentResult.score,
        sentiment: sentimentResult.sentiment,
        created_at: ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now(),
        timestamp: ticket.created_at || new Date().toISOString(),
        tags: typeof ticket.tags === 'string' ? ticket.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        intent: Array.isArray(intents) && intents.length > 0 ? intents[0] : '',
      },
    };
    const qdrantResult = await addSingleTicket(qdrantPoint);
    if (qdrantResult) {
      console.log(`Ticket ${ticket.ticket_id} added to Qdrant.`);
    } else {
      console.error(`Failed to add ticket ${ticket.ticket_id} to Qdrant.`);
    }
    // Find similar tickets
    const similarTickets = await findZendeskSimilarTickets({
      ticket: ticketPayload,
      k: 5,
      embedding: sbertEmbedding,
      fetchComments: true,
    });

    // Analyze similar tickets for resolution time prediction
    const { longResolutionPredicted, predictionConfidence } = await analyzeResolutionTimePrediction({
      ticket,
      similarTickets: similarTickets.payload,
      organizationId,
    });

    // Update Qdrant point with prediction information if applicable
    if (longResolutionPredicted) {
      await updateQdrantWithPrediction({
        ticketId: ticket.ticket_id.toString(),
        longResolutionPredicted,
        predictionConfidence
      });
    }

    // Filter similar tickets to only include subject and description for summarization
    const ticketsForSummarization = similarTickets.payload.map(ticket => ({
      subject: ticket.subject || '',
      description: ticket.description || ''
    }));
    
    // Summarize similar tickets to reduce llm token usage
    const similarTicketsSummary = await summarizeTickets(ticketsForSummarization);
    similarTickets.payload.forEach((sTicket, index) => {
      if (similarTicketsSummary[index]) {
        sTicket.description = similarTicketsSummary[index];
      }
    });

    // Extract and summarize comments from similar tickets
    await extractAndSummarizeTicketComments(similarTickets.payload);
    
    // -----------------------------------------------------------
    // NEW LOGIC: Generate real-time predictions for escalation and CSAT risk
    // -----------------------------------------------------------
    try {
      await generateTicketPredictions({
        ticketId: ticket.ticket_id.toString(),
        organizationId,
        similarTickets: similarTickets.payload,
        sentimentScore: sentimentResult.score,
        embedding: sbertEmbedding,
        longResolutionPredicted,
        predictionConfidence
      });
    } catch (predictionError) {
      console.error(`Failed to generate predictions for ticket ${ticket.ticket_id}:`, predictionError);
      // Don't fail the entire webhook if predictions fail
    }
    
    // TODO: extract product information from similar tickets
    // Generate or extract product information
    const product = generateMockProduct();

    const agentSuggestion = await getAgentSuggestion(userId, {
      subject: ticketPayload.subject,
      description: summary[0] || ticketPayload.description,
    }, product, similarTickets.payload);
    
    // Add comment to Zendesk ticket with better error handling
    try {
      // Collect similar ticket numbers
      const similarTicketNumbers = similarTickets.payload.map(t => t.externalId).filter(Boolean);
      let comment = agentSuggestion.reasoning;
      if (similarTicketNumbers.length > 0) {
        comment += `\n\nSimilar tickets used for this response: ${similarTicketNumbers.join(", ")}`;
      }
      await addCommentToTicket(ticket.ticket_id.toString(), comment, false);
      console.log(`Successfully added agent suggestion comment to ticket ${ticket.ticket_id}`);
    } catch (commentError: any) {
      console.error(`Failed to add comment to Zendesk ticket ${ticket.ticket_id}:`, commentError.message);
      // Continue processing even if comment fails
    }
    
    // Generate AI response
    const aiResponse = await generateTicketResponse(
      userId,
      ticketPayload,
      similarTickets.payload,
      product
    );

    // Parse the AI response to extract action
    let parsedResponse;
    let actionType = 'commentOnly';
    let confidenceScore = DEFAULT_CONFIDENCE_SCORE;
    
    try {
      parsedResponse = JSON.parse(aiResponse);
      actionType = parsedResponse.action || 'commentOnly';
      confidenceScore = parsedResponse.confidence || DEFAULT_CONFIDENCE_SCORE;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Default to commentOnly if parsing fails
    }

    // Execute autonomous actions based on thresholds
    const executedActions = await executeAutonomousActions(
      ticket.ticket_id.toString(),
      organizationId,
      actionType,
      confidenceScore,
      userId
    );

    console.log(`Successfully processed webhook for ticket ${ticket.ticket_id}`);

    return {
      status: 200,
      payload: {
        response: aiResponse,
        agentSuggestion,
        similarTickets: similarTickets.payload,
        product,
        executedActions,
      },
    };
  } catch (error: any) {
    console.error('Error handling webhook:', {
      ticketId: ticket?.ticket_id,
      error: error.message,
      stack: error.stack,
      userId: UserContextManager.getCurrentUserId() || 'unknown'
    });
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message,
        ticketId: ticket?.ticket_id
      },
    };
  }
}

/**
 * Handle status changed webhook to track prediction accuracy
 */
async function handleStatusChangedWebhook(ticket: ZendeskTicketWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing status change webhook for ticket ${ticket.ticket_id}, new status: ${ticket.status}`);
    
    // Check if ticket is closed/solved to compare with initial prediction
    const closedStatuses = ['closed', 'solved'];
    if (!closedStatuses.includes(ticket.status.toLowerCase())) {
      console.log(`Ticket ${ticket.ticket_id} status changed to ${ticket.status} but not closed yet`);
      return {
        status: 200,
        payload: {
          message: 'Status change recorded but ticket not closed yet',
          ticketId: ticket.ticket_id,
          newStatus: ticket.status
        }
      };
    }

    // Calculate resolution time
    const createdAt = ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now();
    const resolvedAt = Date.now();
    const resolutionTimeMs = resolvedAt - createdAt;

    console.log(`Ticket ${ticket.ticket_id} resolved in ${resolutionTimeMs}ms (${Math.round(resolutionTimeMs / (1000 * 60 * 60))} hours)`);

    // Update Qdrant point with resolution information
    await updateQdrantWithResolution({
      ticketId: ticket.ticket_id.toString(),
      resolutionTimeMs,
      resolvedAt
    });

    // Fetch the initial prediction for this ticket
    const prediction = await PredictionModel.findOne({ ticketId: ticket.ticket_id.toString() });
    
    if (!prediction) {
      console.log(`No prediction found for ticket ${ticket.ticket_id}`);
      return {
        status: 200,
        payload: {
          message: 'No prediction found for this ticket',
          ticketId: ticket.ticket_id,
          resolutionTimeMs,
          resolvedAt
        }
      };
    }

    // Determine if ticket was actually escalated
    // You can customize this logic based on your escalation criteria
    const isEscalated = determineIfTicketWasEscalated(ticket);
    
    // Determine CSAT risk outcome (this would need actual CSAT data from Zendesk)
    // For now, we'll use priority and tags as proxy indicators
    const csatRiskOutcome = determineCsatRiskOutcome(ticket);
    
    // Compare predictions with actual outcomes
    const escalationAccuracy = compareEscalationPrediction(prediction.predictedEscalation.risk, isEscalated);
    const csatAccuracy = compareCsatPrediction(prediction.predictedCSAT.risk, csatRiskOutcome);

    // Update the prediction with actual outcome
    const updatedPrediction = await PredictionModel.findOneAndUpdate(
      { ticketId: ticket.ticket_id.toString() },
      {
        $set: {
          actualOutcome: {
            finalStatus: ticket.status,
            isEscalated,
            resolvedAt: new Date(),
            resolutionTimeMs,
            accuracyEscalation: escalationAccuracy,
            accuracyCSAT: csatAccuracy,
            checkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    console.log(`Prediction accuracy updated for ticket ${ticket.ticket_id}: Escalation=${escalationAccuracy}, CSAT=${csatAccuracy}`);

    return {
      status: 200,
      payload: {
        message: 'Prediction accuracy updated successfully',
        ticketId: ticket.ticket_id,
        prediction: updatedPrediction,
        resolutionTimeMs,
        resolvedAt,
        accuracy: {
          escalation: escalationAccuracy,
          csat: csatAccuracy
        }
      }
    };

  } catch (error: any) {
    console.error('Error handling status change webhook:', {
      ticketId: ticket?.ticket_id,
      error: error.message,
      stack: error.stack
    });
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message,
        ticketId: ticket?.ticket_id
      }
    };
  }
}

/**
 * Determine if a ticket was escalated based on priority, tags, or other indicators
 */
function determineIfTicketWasEscalated(ticket: ZendeskTicketWebhookPayload): boolean {
  // Check for escalation indicators
  const escalationTags = ['escalated', 'urgent', 'complaint', 'angry', 'supervisor'];
  const hasEscalationTags = Array.isArray(ticket.tags) 
    ? ticket.tags.some(tag => escalationTags.includes(tag.toLowerCase()))
    : typeof ticket.tags === 'string' 
      ? ticket.tags.split(',').some(tag => escalationTags.includes(tag.trim().toLowerCase()))
      : false;
  
  const isHighPriority = ticket.priority === 'urgent' || ticket.priority === 'high';
  
  return hasEscalationTags || isHighPriority;
}

/**
 * Determine CSAT risk outcome based on available ticket data
 */
function determineCsatRiskOutcome(ticket: ZendeskTicketWebhookPayload): 'Low' | 'Medium' | 'High' {
  // Since we don't have actual CSAT scores in the webhook, we use proxy indicators
  const negativeTags = ['complaint', 'bug', 'error', 'frustrated', 'angry', 'disappointed'];
  const hasNegativeTags = Array.isArray(ticket.tags) 
    ? ticket.tags.some(tag => negativeTags.includes(tag.toLowerCase()))
    : typeof ticket.tags === 'string' 
      ? ticket.tags.split(',').some(tag => negativeTags.includes(tag.trim().toLowerCase()))
      : false;
  
  const isHighPriority = ticket.priority === 'urgent' || ticket.priority === 'high';
  
  if (hasNegativeTags && isHighPriority) {
    return 'High';
  } else if (hasNegativeTags || isHighPriority) {
    return 'Medium';
  }
  return 'Low';
}

/**
 * Compare escalation prediction with actual outcome
 */
function compareEscalationPrediction(predictedRisk: 'Low' | 'Medium' | 'High', actualEscalated: boolean): boolean {
  if (actualEscalated) {
    // If ticket was escalated, high prediction is correct
    return predictedRisk === 'High';
  } else {
    // If ticket was not escalated, low prediction is correct
    return predictedRisk === 'Low';
  }
}

/**
 * Compare CSAT prediction with actual outcome
 */
function compareCsatPrediction(predictedRisk: 'Low' | 'Medium' | 'High', actualRisk: 'Low' | 'Medium' | 'High'): boolean {
  return predictedRisk === actualRisk;
}

/**
 * Convert any webhook payload to Zendesk format for compatibility
 */
function normalizeTicketFormat(payload: any): ZendeskTicketWebhookPayload {
  // If it's already in Zendesk format, return as-is
  if (payload.event_type && payload.ticket_id) {
    return payload;
  }
  
  // Convert CRM-agnostic format to Zendesk format
  return {
    event_type: payload.eventType || payload.event_type || 'ticket_created',
    ticket_id: payload.ticketId || payload.ticket_id || payload.id || '',
    subject: payload.subject || '',
    status: payload.status || 'new',
    description: payload.description || '',
    priority: payload.priority,
    tags: payload.tags || [],
    created_at: payload.created_at || payload.createdAt || new Date().toISOString(),
    external_id: payload.external_id || payload.externalId || payload.ticketId || payload.ticket_id || '',
    requester: payload.requester || {},
    via: payload.via || 'webhook'
  };
}

/**
 * Main webhook handler that determines CRM type from organization context
 */
export async function handleWebhook(ticket: any): Promise<IResponse> {
  try {
    // Get the organization's CRM type from context
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('Organization context not available');
    }

    // Get organization's CRM configuration
    const crmData = await CRMService.getOrganizationCRM(organizationId);
    if (!crmData) {
      throw new Error(`No CRM configuration found for organization ${organizationId}`);
    }

    const { crm } = crmData;
    console.log(`Processing webhook for ${crm.type} CRM, organization: ${organizationId}`);

    // Normalize the payload to Zendesk format for compatibility
    const normalizedTicket = normalizeTicketFormat(ticket);
    
    // Route based on CRM type - all currently use the existing Zendesk logic
    switch (crm.type.toLowerCase()) {
      case 'zendesk':
      case 'salesforce':
      default:
        // For now, all CRM types use the existing Zendesk logic
        // This can be extended later with CRM-specific handlers
        return await handleWebhookLegacy(normalizedTicket);
    }
  } catch (error: any) {
    console.error('Error in main webhook handler:', {
      ticket: ticket,
      error: error.message,
      stack: error.stack
    });
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message
      }
    };
  }
}

/**
 * Legacy webhook handler that maintains existing functionality
 */
async function handleWebhookLegacy(ticket: ZendeskTicketWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing webhook for ticket ${ticket.ticket_id} with event_type: ${ticket.event_type}`);
    
    switch (ticket.event_type) {
      case 'ticket_created':
        return await handleNewTicketWebhook(ticket);
      
      case 'status_changed':
        return await handleStatusChangedWebhook(ticket);
      
      default:
        console.warn(`Unknown event_type: ${ticket.event_type} for ticket ${ticket.ticket_id}`);
        return {
          status: 400,
          payload: {
            error: 'Unknown event type',
            event_type: ticket.event_type,
            ticketId: ticket.ticket_id
          }
        };
    }
  } catch (error: any) {
    console.error('Error in legacy webhook handler:', {
      ticketId: ticket?.ticket_id,
      event_type: ticket?.event_type,
      error: error.message,
      stack: error.stack
    });
    return {
      status: 500,
      payload: { 
        error: 'Internal server error',
        message: error.message,
        ticketId: ticket?.ticket_id,
        event_type: ticket?.event_type
      }
    };
  }
} 