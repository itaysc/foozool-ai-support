import { ICRMWebhookPayload } from '../../types/crm';
import { IResponse } from '../../types';

/**
 * Handle Salesforce webhook for case created
 */
async function handleSalesforceCaseCreated(payload: ICRMWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing Salesforce case created webhook for case ${payload.ticketId}`);
    
    // TODO: Implement Salesforce-specific logic for case creation
    // This would include:
    // - Creating ticket in Qdrant
    // - Generating predictions
    // - Processing intent classification
    // - etc.
    
    return {
      status: 200,
      payload: {
        success: true,
        message: 'Salesforce case created webhook processed successfully',
        caseId: payload.ticketId,
        eventType: payload.eventType
      }
    };
  } catch (error: any) {
    console.error('Error processing Salesforce case created webhook:', error);
    return {
      status: 500,
      payload: {
        error: 'Failed to process Salesforce case created webhook',
        message: error.message,
        caseId: payload.ticketId
      }
    };
  }
}

/**
 * Handle Salesforce webhook for case updated
 */
async function handleSalesforceCaseUpdated(payload: ICRMWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing Salesforce case updated webhook for case ${payload.ticketId}`);
    
    // TODO: Implement Salesforce-specific logic for case updates
    // This would include:
    // - Updating ticket in Qdrant
    // - Re-evaluating predictions
    // - Processing status changes
    // - etc.
    
    return {
      status: 200,
      payload: {
        success: true,
        message: 'Salesforce case updated webhook processed successfully',
        caseId: payload.ticketId,
        eventType: payload.eventType
      }
    };
  } catch (error: any) {
    console.error('Error processing Salesforce case updated webhook:', error);
    return {
      status: 500,
      payload: {
        error: 'Failed to process Salesforce case updated webhook',
        message: error.message,
        caseId: payload.ticketId
      }
    };
  }
}

/**
 * Main Salesforce webhook handler that routes based on event_type
 */
export async function handleSalesforceWebhook(payload: ICRMWebhookPayload): Promise<IResponse> {
  try {
    console.log(`Processing Salesforce webhook for case ${payload.ticketId} with event_type: ${payload.eventType}`);
    
    switch (payload.eventType) {
      case 'case_created':
        return await handleSalesforceCaseCreated(payload);
      
      case 'case_updated':
        return await handleSalesforceCaseUpdated(payload);
      
      default:
        console.warn(`Unknown Salesforce event_type: ${payload.eventType} for case ${payload.ticketId}`);
        return {
          status: 400,
          payload: {
            error: 'Unknown Salesforce event type',
            event_type: payload.eventType,
            caseId: payload.ticketId
          }
        };
    }
  } catch (error: any) {
    console.error('Error in Salesforce webhook handler:', {
      caseId: payload?.ticketId,
      event_type: payload?.eventType,
      error: error.message,
      stack: error.stack
    });
    
    return {
      status: 500,
      payload: {
        error: 'Internal server error',
        message: error.message,
        caseId: payload?.ticketId,
        event_type: payload?.eventType
      }
    };
  }
}
