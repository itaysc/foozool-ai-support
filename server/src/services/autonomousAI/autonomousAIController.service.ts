import { SimpleAutonomousAIService } from './simple.service';
import { ActionThresholdService } from './actionThreshold.service';
import { CustomerTierService } from './customerTier.service';
import { ActionLogService } from './actionLog.service';
import { IActionExecutionRequest, IActionThresholdInput, ICustomerTierInput } from '../../types/autonomousAI';
import { UserContextManager } from '../../context/userContext';

export interface AnalysisRequest {
  ticketId: string;
}

export interface ExecuteActionRequest {
  ticketId: string;
  actionType: string;
  thresholdId: string;
  confidenceScore: number;
  parameters?: any;
}

export interface CreateThresholdRequest {
  thresholdData: Omit<IActionThresholdInput, 'organization'>;
}

export interface UpdateThresholdRequest {
  thresholdId: string;
  updateData: Partial<IActionThresholdInput>;
}

export interface CreateCustomerTierRequest {
  tierData: Omit<ICustomerTierInput, 'organization'>;
}

export interface UpdateCustomerTierRequest {
  tierId: string;
  updateData: Partial<ICustomerTierInput>;
}

export class AutonomousAIControllerService {
  /**
   * Analyze a ticket and get AI recommendations
   */
  static async analyzeTicket(request: AnalysisRequest) {
    const { ticketId } = request;
    
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await SimpleAutonomousAIService.analyzeTicket(ticketId, organizationId);
  }

  /**
   * Execute a recommended action
   */
  static async executeAction(request: ExecuteActionRequest) {
    const { ticketId, actionType, thresholdId, confidenceScore, parameters } = request;
    
    const organizationId = UserContextManager.getCurrentOrganizationId();
    const userId = UserContextManager.getCurrentUserId();
    
    if (!organizationId || !userId) {
      throw new Error('User context not available');
    }

    const actionRequest: IActionExecutionRequest = {
      ticketId,
      organizationId,
      actionType: actionType as any,
      thresholdId,
      confidenceScore,
      parameters,
      userId
    };

    return await SimpleAutonomousAIService.executeAction(actionRequest);
  }

  /**
   * Get all action thresholds for organization
   */
  static async getThresholds() {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionThresholdService.getThresholdsByOrganization(organizationId);
  }

  /**
   * Create a new action threshold
   */
  static async createThreshold(request: CreateThresholdRequest) {
    const { thresholdData } = request;
    
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    const fullThresholdData: IActionThresholdInput = {
      ...thresholdData,
      organization: organizationId
    };

    // Validate threshold data
    const errors = ActionThresholdService.validateThresholdData(fullThresholdData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return await ActionThresholdService.createThreshold(fullThresholdData);
  }

  /**
   * Update an action threshold
   */
  static async updateThreshold(request: UpdateThresholdRequest) {
    const { thresholdId, updateData } = request;

    // Validate threshold data
    const errors = ActionThresholdService.validateThresholdData(updateData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const threshold = await ActionThresholdService.updateThreshold(thresholdId, updateData);
    if (!threshold) {
      throw new Error('Threshold not found');
    }

    return threshold;
  }

  /**
   * Delete an action threshold
   */
  static async deleteThreshold(thresholdId: string) {
    const deleted = await ActionThresholdService.deleteThreshold(thresholdId);
    
    if (!deleted) {
      throw new Error('Threshold not found');
    }

    return { success: true, message: 'Threshold deleted successfully' };
  }

  /**
   * Toggle threshold active status
   */
  static async toggleThresholdStatus(thresholdId: string) {
    const threshold = await ActionThresholdService.toggleThresholdStatus(thresholdId);
    
    if (!threshold) {
      throw new Error('Threshold not found');
    }

    return threshold;
  }

  /**
   * Update threshold value specifically
   */
  static async updateThresholdValue(thresholdId: string, newThreshold: number) {
    // Validate threshold value
    if (typeof newThreshold !== 'number' || newThreshold < 0 || newThreshold > 1) {
      throw new Error('Invalid threshold value. Must be a number between 0 and 1.');
    }

    const threshold = await ActionThresholdService.updateThresholdValue(thresholdId, newThreshold);
    
    if (!threshold) {
      throw new Error('Threshold not found');
    }

    return threshold;
  }

  /**
   * Get all customer tiers for organization
   */
  static async getCustomerTiers() {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await CustomerTierService.getTiersByOrganization(organizationId);
  }

  /**
   * Create a new customer tier
   */
  static async createCustomerTier(request: CreateCustomerTierRequest) {
    const { tierData } = request;
    
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    const fullTierData: ICustomerTierInput = {
      ...tierData,
      organization: organizationId
    };

    // Validate tier data
    const errors = CustomerTierService.validateTierData(fullTierData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return await CustomerTierService.createTier(fullTierData);
  }

  /**
   * Update a customer tier
   */
  static async updateCustomerTier(request: UpdateCustomerTierRequest) {
    const { tierId, updateData } = request;

    // Validate tier data
    const errors = CustomerTierService.validateTierData(updateData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const tier = await CustomerTierService.updateTier(tierId, updateData);
    if (!tier) {
      throw new Error('Customer tier not found');
    }

    return tier;
  }

  /**
   * Delete a customer tier
   */
  static async deleteCustomerTier(tierId: string) {
    const deleted = await CustomerTierService.deleteTier(tierId);
    
    if (!deleted) {
      throw new Error('Customer tier not found');
    }

    return { success: true, message: 'Customer tier deleted successfully' };
  }

  /**
   * Get customer tier by ID
   */
  static async getCustomerTierById(tierId: string) {
    const tier = await CustomerTierService.getTierById(tierId);
    
    if (!tier) {
      throw new Error('Customer tier not found');
    }

    return tier;
  }

  /**
   * Get action logs for organization
   */
  static async getActionLogs(limit: number = 50, offset: number = 0) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getLogsByOrganization(organizationId, limit, offset);
  }

  /**
   * Get action logs for a specific ticket
   */
  static async getTicketActionLogs(ticketId: string, limit: number = 20) {
    return await ActionLogService.getLogsByTicket(ticketId, limit);
  }

  /**
   * Get action logs by action type
   */
  static async getActionLogsByType(actionType: string, limit: number = 50) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getLogsByActionType(organizationId, actionType as any, limit);
  }

  /**
   * Get action logs by status
   */
  static async getActionLogsByStatus(status: string, limit: number = 50) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getLogsByStatus(organizationId, status as any, limit);
  }

  /**
   * Get failed actions for review
   */
  static async getFailedActions(limit: number = 20) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getFailedActions(organizationId, limit);
  }

  /**
   * Get high-confidence actions
   */
  static async getHighConfidenceActions(confidenceThreshold: number = 0.8, limit: number = 20) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getHighConfidenceActions(organizationId, confidenceThreshold, limit);
  }

  /**
   * Get daily action statistics
   */
  static async getDailyStats(date: Date) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getDailyStats(organizationId, date);
  }

  /**
   * Get action success rate
   */
  static async getSuccessRate(startDate: Date, endDate: Date) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getSuccessRate(organizationId, startDate, endDate);
  }

  /**
   * Get action performance metrics
   */
  static async getPerformanceMetrics(days: number = 30) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.getPerformanceMetrics(organizationId, days);
  }

  /**
   * Clean old action logs
   */
  static async cleanOldLogs(daysToKeep: number = 90) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.cleanOldLogs(organizationId, daysToKeep);
  }

  /**
   * Export action logs for analysis
   */
  static async exportLogs(startDate: Date, endDate: Date) {
    const organizationId = UserContextManager.getCurrentOrganizationId();
    if (!organizationId) {
      throw new Error('User context not available');
    }

    return await ActionLogService.exportLogs(organizationId, startDate, endDate);
  }
} 