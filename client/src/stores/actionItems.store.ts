import { makeAutoObservable, runInAction } from 'mobx';
import { actionItemsService, IActionItem, UpdateActionItemPayload } from '@/services/action-items-service';

interface ActionItemFilters {
  customerId?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  severity?: string;
}

class ActionItemsStore {
  actionItems: IActionItem[] = [];
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Filters
  filters: ActionItemFilters = {
    customerId: undefined,
    status: undefined,
    assignee: undefined,
    priority: undefined,
    severity: undefined,
  };

  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  setSaving = (saving: boolean) => {
    this.isSaving = saving;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  setActionItems = (items: IActionItem[]) => {
    this.actionItems = items;
    this.lastUpdated = new Date();
  };

  setFilters = (filters: Partial<ActionItemFilters>) => {
    this.filters = { ...this.filters, ...filters };
  };

  // Fetch all action items
  fetchAllActionItems = async () => {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await actionItemsService.getAllActionItems(this.filters);
      
      runInAction(() => {
        this.actionItems = response.data || [];
        this.lastUpdated = new Date();
      });

      return response.data || [];
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to fetch action items';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  // Fetch action items by customer
  fetchActionItemsByCustomer = async (customerId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await actionItemsService.getActionItemsByCustomer(customerId, this.filters);
      
      runInAction(() => {
        this.actionItems = response.data || [];
        this.lastUpdated = new Date();
      });

      return response.data || [];
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to fetch action items';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  // Helper to fetch action items for the current context (all vs. specific customer)
  fetchActionItemsForContext = async (customerId?: string | null) => {
    if (customerId) {
      return this.fetchActionItemsByCustomer(customerId);
    }
    return this.fetchAllActionItems();
  };

  // Fetch action items by insight
  fetchActionItemsByInsight = async (insightId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await actionItemsService.getActionItemsByInsight(insightId);
      
      runInAction(() => {
        // Merge with existing items, avoiding duplicates
        const newItems = response.data || [];
        const existingIds = new Set(this.actionItems.map(item => item._id));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item._id));
        this.actionItems = [...this.actionItems, ...uniqueNewItems];
        this.lastUpdated = new Date();
      });

      return response.data || [];
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to fetch action items';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  // Fetch single action item
  fetchActionItem = async (actionItemId: string) => {
    try {
      this.setLoading(true);
      this.setError(null);

      const item = await actionItemsService.getActionItemById(actionItemId);
      
      runInAction(() => {
        const index = this.actionItems.findIndex(i => i._id === actionItemId);
        if (index !== -1) {
          this.actionItems[index] = item;
        } else {
          this.actionItems.push(item);
        }
        this.lastUpdated = new Date();
      });

      return item;
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to fetch action item';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  // Update action item
  updateActionItem = async (actionItemId: string, updates: UpdateActionItemPayload) => {
    try {
      this.setSaving(true);
      this.setError(null);

      const updated = await actionItemsService.updateActionItem(actionItemId, updates);
      
      runInAction(() => {
        this.actionItems = this.actionItems.map(item => 
          item._id === actionItemId ? { ...item, ...updated } : item
        );
        this.lastUpdated = new Date();
      });

      return updated;
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to update action item';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Update status
  updateStatus = async (actionItemId: string, status: IActionItem['status']) => {
    try {
      this.setSaving(true);
      this.setError(null);

      await actionItemsService.updateActionItemStatus(actionItemId, status);
      
      // No need to update local state - optimistic update already did it
      runInAction(() => {
        this.lastUpdated = new Date();
        this.isSaving = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to update status';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Update assignee
  updateAssignee = async (actionItemId: string, assignee: string | null) => {
    try {
      this.setSaving(true);
      this.setError(null);

      await actionItemsService.updateActionItemAssignee(actionItemId, assignee);
      
      // No need to update local state - optimistic update already did it
      runInAction(() => {
        this.lastUpdated = new Date();
        this.isSaving = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to update assignee';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Update priority
  updatePriority = async (actionItemId: string, priority: IActionItem['priority']) => {
    try {
      this.setSaving(true);
      this.setError(null);

      const updated = await actionItemsService.updateActionItemPriority(actionItemId, priority);
      
      runInAction(() => {
        this.actionItems = this.actionItems.map(item => 
          item._id === actionItemId ? { ...item, ...updated } : item
        );
        this.lastUpdated = new Date();
      });

      return updated;
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to update priority';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Delete action item
  deleteActionItem = async (actionItemId: string) => {
    try {
      this.setSaving(true);
      this.setError(null);

      await actionItemsService.deleteActionItem(actionItemId);
      
      runInAction(() => {
        this.actionItems = this.actionItems.filter(item => item._id !== actionItemId);
        this.lastUpdated = new Date();
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to delete action item';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Create action item
  createActionItem = async (actionItem: Partial<IActionItem>) => {
    try {
      this.setSaving(true);
      this.setError(null);

      const created = await actionItemsService.createActionItem(actionItem);
      
      runInAction(() => {
        this.actionItems.push(created);
        this.lastUpdated = new Date();
      });

      return created;
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to create action item';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Complete action item
  completeActionItem = async (actionItemId: string) => {
    try {
      this.setSaving(true);
      this.setError(null);

      const completed = await actionItemsService.completeActionItem(actionItemId);
      
      runInAction(() => {
        const index = this.actionItems.findIndex(i => i._id === actionItemId);
        if (index !== -1) {
          this.actionItems[index] = completed;
        }
        this.lastUpdated = new Date();
      });

      return completed;
    } catch (error: any) {
      runInAction(() => {
        this.error = error?.message || 'Failed to complete action item';
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isSaving = false;
      });
    }
  };

  // Clear action items
  clearActionItems = () => {
    this.actionItems = [];
    this.lastUpdated = null;
  };

  // Computed properties
  get hasActionItems(): boolean {
    return this.actionItems.length > 0;
  }

  get actionItemsByStatus() {
    return this.actionItems.reduce((acc, item) => {
      const status = item.status || 'new';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(item);
      return acc;
    }, {} as Record<string, IActionItem[]>);
  }

  get actionItemsByPriority() {
    return this.actionItems.reduce((acc, item) => {
      const priority = item.priority || 'P2';
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(item);
      return acc;
    }, {} as Record<string, IActionItem[]>);
  }

  get actionItemsBySeverity() {
    return this.actionItems.reduce((acc, item) => {
      const severity = item.severity || 'medium';
      if (!acc[severity]) {
        acc[severity] = [];
      }
      acc[severity].push(item);
      return acc;
    }, {} as Record<string, IActionItem[]>);
  }
}

const actionItemsStore = new ActionItemsStore();
export default actionItemsStore;
