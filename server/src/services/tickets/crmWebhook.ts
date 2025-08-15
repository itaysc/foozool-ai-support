import { ICRMWebhookPayload } from '../../types/crm';
import { IResponse } from '../../types';
import { CRMService } from '../crm';
import { handleWebhook } from './webhook';
import { handleSalesforceWebhook } from './salesforceWebhook';

/**
 * CRM-agnostic webhook handler that routes to appropriate CRM handler
 */
export async function handleCRMWebhook(
  payload: ICRMWebhookPayload,
  organizationId: string
): Promise<IResponse> {
  try {
    const { crmType } = payload;
    
    // Validate that the CRM is supported
    const isSupported = await CRMService.isCRMSupported(crmType);
    if (!isSupported) {
      return {
        status: 400,
        payload: {
          error: 'Unsupported CRM type',
          crmType,
          message: `CRM type '${crmType}' is not supported. Please contact support to add support for this CRM.`
        }
      };
    }

    // Get organization's CRM configuration
    const crmData = await CRMService.getOrganizationCRM(organizationId);
    if (!crmData) {
      return {
        status: 400,
        payload: {
          error: 'No CRM configuration found',
          organizationId,
          message: 'This organization has not configured a CRM. Please configure a CRM before processing webhooks.'
        }
      };
    }

    // Validate that the organization is using the correct CRM type
    if (crmData.crm.type !== crmType) {
      return {
        status: 400,
        payload: {
          error: 'CRM type mismatch',
          expectedCRM: crmData.crm.type,
          receivedCRM: crmType,
          message: `This organization is configured to use '${crmData.crm.type}' but received webhook from '${crmType}'`
        }
      };
    }

    // Route to appropriate CRM handler based on type
    switch (crmType.toLowerCase()) {
      case 'zendesk':
        return await handleWebhook(payload);
      
      case 'salesforce':
        return await handleSalesforceWebhook(payload);
      
      default:
        return {
          status: 400,
          payload: {
            error: 'Unsupported CRM type',
            crmType,
            message: `Handler for CRM type '${crmType}' is not implemented yet.`
          }
        };
    }
  } catch (error: any) {
    console.error('Error in CRM webhook handler:', {
      crmType: payload?.crmType,
      organizationId,
      error: error.message,
      stack: error.stack
    });
    
    return {
      status: 500,
      payload: {
        error: 'Internal server error',
        message: error.message,
        crmType: payload?.crmType,
        organizationId
      }
    };
  }
}

/**
 * Convert Zendesk webhook payload to CRM-agnostic format
 */
export function convertZendeskToCRMWebhook(zendeskPayload: any): ICRMWebhookPayload {
  return {
    crmType: 'zendesk',
    eventType: zendeskPayload.event_type,
    ticketId: zendeskPayload.ticket_id,
    subject: zendeskPayload.subject,
    status: zendeskPayload.status,
    description: zendeskPayload.description,
    priority: zendeskPayload.priority,
    tags: zendeskPayload.tags,
    created_at: zendeskPayload.created_at,
    external_id: zendeskPayload.external_id,
    requester: zendeskPayload.requester,
    custom_fields: zendeskPayload.custom_fields,
    via: zendeskPayload.via,
    ...zendeskPayload // Include any additional fields
  };
}

/**
 * Convert Salesforce webhook payload to CRM-agnostic format
 */
export function convertSalesforceToCRMWebhook(salesforcePayload: any): ICRMWebhookPayload {
  return {
    crmType: 'salesforce',
    eventType: salesforcePayload.event_type,
    ticketId: salesforcePayload.case_id,
    subject: salesforcePayload.subject,
    status: salesforcePayload.status,
    description: salesforcePayload.description,
    priority: salesforcePayload.priority,
    tags: salesforcePayload.tags || [],
    created_at: salesforcePayload.created_date,
    external_id: salesforcePayload.case_id,
    requester: salesforcePayload.contact,
    custom_fields: salesforcePayload.custom_fields || {},
    via: salesforcePayload.via || 'api',
    ...salesforcePayload // Include any additional fields
  };
}
