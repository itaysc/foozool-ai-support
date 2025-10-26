import { ActionItemModel, IActionItem } from '../../schemas/actionItem.schema';
import { InsightModel } from '../../schemas/insights.schema';
import { UserContextManager } from '../../context/userContext';

export interface ActionItemsQuery {
  customerId?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  severity?: string;
  organizationId: string;
}

export interface UpdateActionItemData {
  assignee?: string;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  dueDate?: Date | string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

class ActionItemsService {
  /**
   * Get all action items for an organization with filters
   */
  async getAllActionItems(query: ActionItemsQuery) {
    const filter: any = { organizationId: query.organizationId };

    if (query.customerId) {
      filter.customerId = query.customerId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.assignee) {
      filter.assignee = query.assignee;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.severity) {
      filter.severity = query.severity;
    }

    const actionItems = await ActionItemModel.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .populate('insightId', 'issueDescription')
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .lean();

    return {
      success: true,
      data: actionItems,
      count: actionItems.length
    };
  }

  /**
   * Get action items by customer
   */
  async getActionItemsByCustomer(customerId: string, organizationId: string, filters?: ActionItemsQuery) {
    const filter: any = { 
      organizationId,
      customerId 
    };

    if (filters?.status) filter.status = filters.status;
    if (filters?.assignee) filter.assignee = filters.assignee;
    if (filters?.priority) filter.priority = filters.priority;
    if (filters?.severity) filter.severity = filters.severity;

    const actionItems = await ActionItemModel.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .populate('insightId', 'issueDescription')
      .populate('assignee', 'name email')
      .lean();

    return {
      success: true,
      data: actionItems,
      count: actionItems.length
    };
  }

  /**
   * Get action items by insight
   */
  async getActionItemsByInsight(insightId: string, organizationId: string) {
    const insight = await InsightModel.findById(insightId);
    
    if (!insight) {
      throw new Error('Insight not found');
    }

    if (String(insight.organizationId) !== organizationId) {
      throw new Error('Unauthorized: Insight does not belong to your organization');
    }

    const actionItems = await ActionItemModel.find({ 
      insightId,
      organizationId 
    })
      .sort({ priority: 1, createdAt: -1 })
      .populate('assignee', 'name email')
      .lean();

    return {
      success: true,
      data: actionItems,
      count: actionItems.length
    };
  }

  /**
   * Get single action item by ID
   */
  async getActionItemById(actionItemId: string, organizationId: string) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    })
      .populate('insightId', 'issueDescription')
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('completedBy', 'name email')
      .lean();

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    return actionItem;
  }

  /**
   * Update action item
   */
  async updateActionItem(actionItemId: string, organizationId: string, updates: UpdateActionItemData) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    // Update fields
    if (updates.assignee !== undefined) actionItem.assignee = updates.assignee;
    if (updates.status !== undefined) actionItem.status = updates.status;
    if (updates.severity !== undefined) actionItem.severity = updates.severity;
    if (updates.priority !== undefined) actionItem.priority = updates.priority;
    if (updates.dueDate !== undefined) actionItem.dueDate = new Date(updates.dueDate);
    if (updates.tags !== undefined) actionItem.tags = updates.tags;
    if (updates.metadata !== undefined) actionItem.metadata = updates.metadata;

    await actionItem.save();

    return actionItem;
  }

  /**
   * Update action item status
   */
  async updateStatus(actionItemId: string, organizationId: string, status: IActionItem['status']) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    actionItem.status = status;

    // Set completion fields if resolved or closed
    if (status === 'resolved' || status === 'closed') {
      actionItem.completedAt = new Date();
      const userId = UserContextManager.getCurrentUserId();
      if (userId) {
        actionItem.completedBy = userId;
      }
    }

    await actionItem.save();

    return actionItem;
  }

  /**
   * Update action item assignee
   */
  async updateAssignee(actionItemId: string, organizationId: string, assignee: string | null) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    actionItem.assignee = assignee || undefined;
    await actionItem.save();

    return actionItem;
  }

  /**
   * Update action item priority
   */
  async updatePriority(actionItemId: string, organizationId: string, priority: IActionItem['priority']) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    actionItem.priority = priority;
    await actionItem.save();

    return actionItem;
  }

  /**
   * Delete action item
   */
  async deleteActionItem(actionItemId: string, organizationId: string) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    await ActionItemModel.deleteOne({ _id: actionItemId });
  }

  /**
   * Create action item
   */
  async createActionItem(data: Partial<IActionItem>, organizationId: string, userId?: string) {
    const actionItem = await ActionItemModel.create({
      ...data,
      organizationId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return actionItem;
  }

  /**
   * Complete action item
   */
  async completeActionItem(actionItemId: string, organizationId: string) {
    const actionItem = await ActionItemModel.findOne({
      _id: actionItemId,
      organizationId
    });

    if (!actionItem) {
      throw new Error('Action item not found');
    }

    actionItem.status = 'resolved';
    actionItem.completedAt = new Date();
    
    const userId = UserContextManager.getCurrentUserId();
    if (userId) {
      actionItem.completedBy = userId;
    }

    await actionItem.save();

    return actionItem;
  }
}

const actionItemsService = new ActionItemsService();
export default actionItemsService;
