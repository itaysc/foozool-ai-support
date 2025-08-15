import { IResponse, ITicket } from '../../types';
import { CRMService } from '../crm';
import { fetchZendeskTickets } from '../zendesk';
import { fetchSalesforceCases } from '../salesforce';

export interface TicketFetchOptions {
  maxPages?: number;
  perPage?: number;
  fromPage?: number;
  fetchComments?: boolean;
}

/**
 * CRM-agnostic ticket fetching service
 */
export class CRMTicketService {
  /**
   * Fetch tickets from the organization's configured CRM
   */
  static async fetchTickets(
    organizationId: string,
    options: TicketFetchOptions = {}
  ): Promise<IResponse<ITicket[]>> {
    try {
      // Get organization's CRM configuration
      const crmData = await CRMService.getOrganizationCRM(organizationId);
      if (!crmData) {
        throw new Error(`No CRM configuration found for organization ${organizationId}`);
      }

      const { crm } = crmData;
      
      // Route to appropriate CRM service based on type
      switch (crm.type.toLowerCase()) {
        case 'zendesk':
          return await fetchZendeskTickets(organizationId, options);
        
        case 'salesforce':
          return await fetchSalesforceCases(organizationId, options);
        
        default:
          throw new Error(`Ticket fetching not implemented for CRM type: ${crm.type}`);
      }
    } catch (error: any) {
      console.error(`Error fetching tickets for organization ${organizationId}:`, error);
      return {
        status: 500,
        payload: []
      };
    }
  }

  /**
   * Fetch tickets by external IDs from the organization's configured CRM
   */
  static async fetchTicketsByExternalIds(
    organizationId: string,
    ids: string[],
    options: { fetchComments?: boolean } = {}
  ): Promise<any[]> {
    try {
      // Get organization's CRM configuration
      const crmData = await CRMService.getOrganizationCRM(organizationId);
      if (!crmData) {
        throw new Error(`No CRM configuration found for organization ${organizationId}`);
      }

      const { crm } = crmData;
      
      // Route to appropriate CRM service based on type
      switch (crm.type.toLowerCase()) {
        case 'zendesk':
          // Import dynamically to avoid circular dependencies
          const { fetchTicketsByExternalIds: fetchZendeskTicketsByIds } = await import('../zendesk');
          return await fetchZendeskTicketsByIds(ids, options);
        
        case 'salesforce':
          // Import dynamically to avoid circular dependencies
          const { fetchCasesByExternalIds: fetchSalesforceCasesByIds } = await import('../salesforce');
          return await fetchSalesforceCasesByIds(ids, options);
        
        default:
          throw new Error(`Ticket fetching by IDs not implemented for CRM type: ${crm.type}`);
      }
    } catch (error: any) {
      console.error(`Error fetching tickets by IDs for organization ${organizationId}:`, error);
      return [];
    }
  }

  /**
   * Validate if the organization's CRM supports ticket fetching
   */
  static async isTicketFetchingSupported(organizationId: string): Promise<boolean> {
    try {
      const crmData = await CRMService.getOrganizationCRM(organizationId);
      if (!crmData) return false;

      const supportedCRMs = ['zendesk', 'salesforce'];
      return supportedCRMs.includes(crmData.crm.type.toLowerCase());
    } catch (error) {
      console.error(`Error checking ticket fetching support for organization ${organizationId}:`, error);
      return false;
    }
  }
}
