import axios from '@/services/axios';
import config from '@/config';

export interface IActionItem {
  _id?: string;
  insightId?: string;
  organizationId: string;
  customerId?: string;
  title: string;
  description: string;
  assignee?: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  dueDate?: Date | string;
  createdBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  completedAt?: Date | string;
  completedBy?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ActionItemsResponse {
  success: boolean;
  data: IActionItem[];
  count?: number;
}

export interface UpdateActionItemPayload {
  assignee?: string;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  dueDate?: Date | string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

class ActionItemsService {
  private readonly baseUrl = `${config.apiUrl}/action-items`;


  /**
   * Fetch all action items for the organization
   */
  async getAllActionItems(params?: {
    customerId?: string;
    status?: string;
    assignee?: string;
    priority?: string;
    severity?: string;
  }): Promise<ActionItemsResponse> {
    try {
      const response = await axios.get<ActionItemsResponse>(this.baseUrl, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all action items:', error);
      throw error;
    }
  }

  /**
   * Fetch action items for a specific customer
   */
  async getActionItemsByCustomer(customerId: string, params?: {
    status?: string;
    assignee?: string;
    priority?: string;
    severity?: string;
  }): Promise<ActionItemsResponse> {
    try {
      const response = await axios.get<ActionItemsResponse>(
        `${this.baseUrl}/customer/${customerId}`,
        {
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching action items by customer:', error);
      throw error;
    }
  }

  /**
   * Fetch action items for a specific insight
   */
  async getActionItemsByInsight(insightId: string): Promise<ActionItemsResponse> {
    try {
      const response = await axios.get<ActionItemsResponse>(
        `${this.baseUrl}/insight/${insightId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching action items by insight:', error);
      throw error;
    }
  }

  /**
   * Fetch a single action item by ID
   */
  async getActionItemById(actionItemId: string): Promise<IActionItem> {
    try {
      const response = await axios.get<IActionItem>(
        `${this.baseUrl}/${actionItemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching action item by ID:', error);
      throw error;
    }
  }

  /**
   * Update an action item
   */
  async updateActionItem(
    actionItemId: string,
    updates: UpdateActionItemPayload
  ): Promise<IActionItem> {
    try {
      const response = await axios.put<IActionItem>(
        `${this.baseUrl}/${actionItemId}`,
        updates,
      );
      return response.data;
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  }

  /**
   * Update action item status
   */
  async updateActionItemStatus(
    actionItemId: string,
    status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened'
  ): Promise<IActionItem> {
    try {
      const response = await axios.patch<IActionItem>(
        `${this.baseUrl}/${actionItemId}/status`,
        { status },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating action item status:', error);
      throw error;
    }
  }

  /**
   * Update action item assignee
   */
  async updateActionItemAssignee(
    actionItemId: string,
    assignee: string | null
  ): Promise<IActionItem> {
    try {
      const response = await axios.patch<IActionItem>(
        `${this.baseUrl}/${actionItemId}/assignee`,
        { assignee },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating action item assignee:', error);
      throw error;
    }
  }

  /**
   * Update action item priority
   */
  async updateActionItemPriority(
    actionItemId: string,
    priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'
  ): Promise<IActionItem> {
    try {
      const response = await axios.patch<IActionItem>(
        `${this.baseUrl}/${actionItemId}/priority`,
        { priority },
      );
      return response.data;
    } catch (error) {
      console.error('Error updating action item priority:', error);
      throw error;
    }
  }

  /**
   * Delete an action item
   */
  async deleteActionItem(actionItemId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${actionItemId}`);
    } catch (error) {
      console.error('Error deleting action item:', error);
      throw error;
    }
  }

  /**
   * Create a new action item
   */
  async createActionItem(actionItem: Partial<IActionItem>): Promise<IActionItem> {
    try {
      const response = await axios.post<IActionItem>(
        this.baseUrl,
        actionItem,
      );
      return response.data;
    } catch (error) {
      console.error('Error creating action item:', error);
      throw error;
    }
  }

  /**
   * Mark action item as completed
   */
  async completeActionItem(actionItemId: string): Promise<IActionItem> {
    try {
      const response = await axios.post<IActionItem>(
        `${this.baseUrl}/${actionItemId}/complete`,
        {},
      );
      return response.data;
    } catch (error) {
      console.error('Error completing action item:', error);
      throw error;
    }
  }
}

export const actionItemsService = new ActionItemsService();
