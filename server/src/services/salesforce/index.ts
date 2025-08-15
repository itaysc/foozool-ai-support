import axios from 'axios';
import { IResponse, ITicket } from '../../types';
import { CRMService } from '../crm';
import { OrganizationModel } from '../../schemas';

/**
 * Fetch Salesforce cases for an organization
 */
export async function fetchSalesforceCases(
  organizationId: string,
  options: { maxPages?: number; perPage?: number; fromPage?: number; fetchComments?: boolean } = {}
): Promise<IResponse<ITicket[]>> {
  try {
    const { maxPages = 5, perPage = 100, fromPage = 1 } = options;
    
    // Get organization's CRM configuration
    const crmData = await CRMService.getOrganizationCRM(organizationId);
    if (!crmData) {
      throw new Error(`No CRM configuration found for organization ${organizationId}`);
    }

    const { crm, config } = crmData;
    
    // Validate CRM type
    if (crm.type !== 'salesforce') {
      throw new Error(`Organization ${organizationId} is not configured to use Salesforce`);
    }

    // Get Salesforce configuration
    const { instanceUrl, accessToken, apiVersion } = config.config;
    
    if (!instanceUrl || !accessToken || !apiVersion) {
      throw new Error('Salesforce configuration is incomplete. Missing instanceUrl, accessToken, or apiVersion.');
    }

    // Create Salesforce API client
    const salesforceClient = axios.create({
      baseURL: `${instanceUrl}/services/data/v${apiVersion}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Get organization details
    const org = await OrganizationModel.findById(organizationId).lean();
    if (!org) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    let allCases: ITicket[] = [];
    let hasMore = true;
    let currentPage = fromPage;

    while (hasMore && currentPage <= fromPage + maxPages - 1) {
      console.log(`Fetching Salesforce cases page ${currentPage} of ${maxPages}`);
      
      try {
        // Query Salesforce for cases
        const response = await salesforceClient.get('/query', {
          params: {
            q: `SELECT Id, Subject, Status, Description, Priority, CreatedDate, Contact.Name, Contact.Email FROM Case ORDER BY CreatedDate DESC LIMIT ${perPage} OFFSET ${(currentPage - 1) * perPage}`
          }
        });

        const { records, done } = response.data;
        
        if (!records || records.length === 0) {
          hasMore = false;
          break;
        }

        // Transform Salesforce cases to ITicket format
        const casesData: ITicket[] = records.map((sfCase: any) => ({
          _id: sfCase.Id,
          subject: sfCase.Subject || 'No Subject',
          description: sfCase.Description || 'No Description',
          status: sfCase.Status || 'New',
          createdAt: sfCase.CreatedDate || new Date().toISOString(),
          tags: [], // Salesforce doesn't have tags like Zendesk
          channel: 'api', // Default channel for Salesforce
          priority: sfCase.Priority || 'Normal',
          customerId: sfCase.Contact?.Id || '',
          satisfactionRating: 0, // Not available in Salesforce
          organization: org._id!,
          externalId: sfCase.Id,
          updatedAt: sfCase.CreatedDate || new Date().toISOString(),
          comments: [],
          chatHistory: [],
        }));

        allCases = allCases.concat(casesData);
        hasMore = !done;
        currentPage++;

      } catch (error: any) {
        console.error(`Error fetching Salesforce cases page ${currentPage}:`, error);
        hasMore = false;
        break;
      }
    }

    console.log(`Successfully fetched ${allCases.length} Salesforce cases for organization ${organizationId}`);

    return {
      status: 200,
      payload: allCases
    };

  } catch (error: any) {
    console.error(`Error fetching Salesforce cases for organization ${organizationId}:`, error);
    return {
      status: 500,
      payload: []
    };
  }
}

/**
 * Fetch Salesforce cases by external IDs
 */
export async function fetchCasesByExternalIds(
  ids: string[],
  options: { fetchComments?: boolean } = {}
): Promise<(ITicket & { comments?: any[] })[]> {
  try {
    // This would need to be implemented based on the specific organization's Salesforce configuration
    // For now, return empty array as this is a placeholder implementation
    console.log('Salesforce fetchCasesByExternalIds not yet implemented');
    return [];
  } catch (error: any) {
    console.error('Error fetching Salesforce cases by IDs:', error);
    return [];
  }
}
