import { 
  ActionType,
  ActionStatus,
  TriggerSource
} from '../../types/autonomousAI';
import { ActionThresholdModel, ActionLogModel, CustomerTierModel, TicketModel, OrganizationModel } from '../../schemas';
import { callLLM } from '../llm';
import { UserContextManager } from '../../context/userContext';
import { Types } from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && (id.length === 24);
}

export class SimpleAutonomousAIService {
  /**
   * Analyze a ticket and recommend actions
   */
  static async analyzeTicket(ticketId: string, organizationId: string): Promise<any> {
    try {
      // Get ticket context
      const context = await this.getTicketContext(ticketId, organizationId);
      
      // Analyze with AI
      const analysis = await this.performAIAnalysis(context);
      
      // Get applicable thresholds
      const thresholds = await this.getApplicableThresholds(organizationId, context);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(analysis, thresholds, context);
      
      return {
        ticketId: ticketId,
        confidenceScore: analysis.confidenceScore,
        recommendedActions: recommendations,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        customerSatisfaction: analysis.customerSatisfaction,
        issueComplexity: analysis.issueComplexity,
        estimatedResolutionTime: analysis.estimatedResolutionTime,
        keywords: analysis.keywords,
        intent: analysis.intent,
        suggestedTags: analysis.suggestedTags
      };
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      throw error as Error;
    }
  }

  /**
   * Execute a recommended action
   */
  static async executeAction(request: any): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Validate action permissions
      await this.validateActionPermissions(request);
      
      // Check daily limits
      await this.checkDailyLimits(request);
      
      // Execute the action
      const result = await this.performAction(request);
      
      // Log the action
      await this.logAction(request, 'executed', startTime, result);
      
      return true;
    } catch (error) {
      console.error('Error executing action:', error);
      
      // Log failed action
      await this.logAction(request, 'failed', startTime, null, (error as Error).message);
      
      throw error;
    }
  }

  /**
   * Get ticket context for analysis
   */
  private static async getTicketContext(ticketId: string, organizationId: string): Promise<any> {
    const ticket = await TicketModel.findById(ticketId).lean();
    const organization = await OrganizationModel.findById(organizationId).lean();
    
    if (!ticket || !organization) {
      throw new Error('Ticket or organization not found');
    }

    // Get customer tier (you might need to implement customer lookup)
    const customerTier = await this.getCustomerTier(organizationId, ticket.customerId);
    
    // Get historical actions
    const historicalActions = await ActionLogModel.find({
      ticketId: isValidObjectId(ticketId) ? new Types.ObjectId(ticketId) : ticketId,
      organization: new Types.ObjectId(organizationId)
    }).sort({ createdAt: -1 }).limit(10).lean();

    return {
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        tags: ticket.tags || [],
        satisfactionRating: ticket.satisfactionRating,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt)
      },
      customer: {
        tier: customerTier?.name,
        satisfactionHistory: [ticket.satisfactionRating || 3], // Simplified
        previousTickets: 1, // Simplified
        averageResolutionTime: 24 // Simplified
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        autoActionSettings: {
          organization: organization._id,
          isEnabled: true,
          maxActionsPerTicket: 3,
          maxActionsPerDay: 100,
          requireHumanApproval: false,
          approvalThreshold: 0.8,
          blacklistedActions: [],
          whitelistedActions: [],
          emergencyStop: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      historicalActions
    };
  }

  /**
   * Perform AI analysis on ticket
   */
  private static async performAIAnalysis(context: any): Promise<any> {
    // Get user agent analytics for additional context
    let userAgentContext = '';
    // User agent analytics service was removed with insights functionality
    try {
      // Placeholder - user agent analytics functionality disabled
      userAgentContext = '';
    } catch (error) {
      console.warn('User agent analytics disabled:', error);
    }

    const prompt = `
      Analyze this customer support ticket and provide detailed insights:
      
      Ticket Subject: ${context.ticket.subject}
      Ticket Description: ${context.ticket.description}
      Priority: ${context.ticket.priority}
      Status: ${context.ticket.status}
      Tags: ${context.ticket.tags.join(', ')}
      Customer Tier: ${context.customer.tier || 'unknown'}
      
      ${userAgentContext}
      
      Consider user agent patterns when analyzing:
      - If there are platform-specific issues (iOS, Android, Windows, macOS)
      - If browser-specific problems are common
      - If mobile vs desktop usage patterns affect the issue
      - If device-specific optimizations are needed
      
      Return a JSON object with the following structure:
      {
        "confidenceScore": number (0-1),
        "sentiment": "positive" | "neutral" | "negative",
        "urgency": "low" | "medium" | "high" | "critical",
        "customerSatisfaction": number (1-5),
        "issueComplexity": "simple" | "moderate" | "complex",
        "estimatedResolutionTime": number (hours),
        "keywords": string[],
        "intent": string,
        "suggestedTags": string[],
        "userAgentInsights": {
          "platformSpecific": boolean,
          "browserSpecific": boolean,
          "deviceSpecific": boolean,
          "recommendedActions": string[]
        }
      }
      
      Analyze the customer's tone, urgency, and the complexity of their issue.
      Consider their tier level when assessing satisfaction and urgency.
      Include user agent insights if the issue appears to be platform, browser, or device specific.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: true,
      systemMsg: 'You are an AI support analyst. Analyze tickets and provide structured insights.',
      prompt,
      maxTokens: 1000,
      temperature: 0.3,
      topP: 0.9,
      stop: ['\n\n']
    });

    if (!response.data) {
      throw new Error('No response from AI analysis');
    }

    return JSON.parse(response.data);
  }

  /**
   * Get applicable action thresholds
   */
  private static async getApplicableThresholds(organizationId: string, context: any) {
    return await ActionThresholdModel.find({
      organization: new Types.ObjectId(organizationId),
      isActive: true
    }).sort({ priority: -1 }).lean();
  }

  /**
   * Generate action recommendations
   */
  private static async generateRecommendations(
    analysis: any, 
    thresholds: any[], 
    context: any
  ): Promise<any[]> {
    const recommendations: any[] = [];

    for (const threshold of thresholds) {
      // Check if conditions are met
      const conditionsMet = this.evaluateConditions(threshold.conditions, context);
      
      if (conditionsMet && analysis.confidenceScore >= threshold.threshold) {
        recommendations.push({
          actionType: threshold.actionType,
          confidenceScore: analysis.confidenceScore,
          threshold: threshold._id,
          priority: threshold.priority,
          reasoning: `Threshold "${threshold.name}" conditions met with ${(analysis.confidenceScore * 100).toFixed(1)}% confidence`,
          estimatedImpact: this.estimateImpact(threshold.actionType, context),
          riskLevel: this.assessRisk(threshold.actionType, context),
          parameters: threshold.actionConfig
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate threshold conditions
   */
  private static evaluateConditions(conditions: any[], context: any): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, context);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Get field value from context
   */
  private static getFieldValue(field: string, context: any): any {
    const fieldMap: any = {
      'priority': context.ticket.priority,
      'satisfaction_rating': context.ticket.satisfactionRating,
      'ticket_age_hours': (Date.now() - new Date(context.ticket.createdAt).getTime()) / (1000 * 60 * 60),
      'customer_tier': context.customer.tier,
      'status': context.ticket.status
    };
    
    return fieldMap[field] || null;
  }

  /**
   * Estimate action impact
   */
  private static estimateImpact(actionType: ActionType, context: any): 'low' | 'medium' | 'high' {
    const impactMap: Record<ActionType, 'low' | 'medium' | 'high'> = {
      'refund': 'high',
      'coupon': 'medium',
      'auto_resolve': 'medium',
      'escalate': 'high',
      'priority_change': 'low',
      'auto_reply': 'low'
    };
    
    return impactMap[actionType];
  }

  /**
   * Assess action risk
   */
  private static assessRisk(actionType: ActionType, context: any): 'low' | 'medium' | 'high' {
    const riskMap: Record<ActionType, 'low' | 'medium' | 'high'> = {
      'refund': 'high',
      'coupon': 'medium',
      'auto_resolve': 'medium',
      'escalate': 'low',
      'priority_change': 'low',
      'auto_reply': 'low'
    };
    
    return riskMap[actionType];
  }

  /**
   * Validate action permissions
   */
  private static async validateActionPermissions(request: any): Promise<void> {
    const customerTier = await this.getCustomerTier(request.organizationId.toString(), 'default');
    
    if (!customerTier) {
      throw new Error('Customer tier not found');
    }

    const permissions = customerTier.autoActionPermissions;
    const actionPermission = permissions[request.actionType as keyof typeof permissions];
    
    if (!actionPermission?.enabled) {
      throw new Error(`Action ${request.actionType} not permitted for customer tier ${customerTier.name}`);
    }
  }

  /**
   * Check daily action limits
   */
  private static async checkDailyLimits(request: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const dailyCount = await ActionLogModel.countDocuments({
      organization: new Types.ObjectId(request.organizationId.toString()),
      actionType: request.actionType,
      executedAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'executed'
    });

    const threshold = await ActionThresholdModel.findById(request.thresholdId);
    if (threshold?.maxDailyActions && dailyCount >= threshold.maxDailyActions) {
      throw new Error(`Daily limit reached for action ${request.actionType}`);
    }
  }

  /**
   * Perform the actual action
   */
  private static async performAction(request: any): Promise<any> {
    switch (request.actionType) {
      case 'refund':
        return await this.processRefund(request);
      case 'coupon':
        return await this.processCoupon(request);
      case 'auto_resolve':
        return await this.processAutoResolve(request);
      case 'escalate':
        return await this.processEscalation(request);
      case 'priority_change':
        return await this.processPriorityChange(request);
      case 'auto_reply':
        return await this.processAutoReply(request);
      default:
        throw new Error(`Unknown action type: ${request.actionType}`);
    }
  }

  /**
   * Process refund action
   */
  private static async processRefund(request: any): Promise<any> {
    // Implement refund logic here
    // This would typically integrate with payment systems
    console.log(`Processing refund for ticket ${request.ticketId}`);
    return { refundAmount: request.parameters?.refundAmount };
  }

  /**
   * Process coupon action
   */
  private static async processCoupon(request: any): Promise<any> {
    // Implement coupon generation logic here
    console.log(`Generating coupon for ticket ${request.ticketId}`);
    return { 
      couponCode: request.parameters?.couponCode || `AUTO_${Date.now()}`,
      discount: request.parameters?.couponDiscount 
    };
  }

  /**
   * Process auto resolve action
   */
  private static async processAutoResolve(request: any): Promise<any> {
    await TicketModel.findByIdAndUpdate(request.ticketId, {
      status: 'solved',
      updatedAt: new Date()
    });
    
    return { status: 'solved' };
  }

  /**
   * Process escalation action
   */
  private static async processEscalation(request: any): Promise<any> {
    // Implement escalation logic here
    console.log(`Escalating ticket ${request.ticketId} to level ${request.parameters?.escalationLevel}`);
    return { escalationLevel: request.parameters?.escalationLevel };
  }

  /**
   * Process priority change action
   */
  private static async processPriorityChange(request: any): Promise<any> {
    const originalTicket = await TicketModel.findById(request.ticketId);
    const newPriority = request.parameters?.newPriority;
    
    if (originalTicket && newPriority) {
      await TicketModel.findByIdAndUpdate(request.ticketId, {
        priority: newPriority,
        updatedAt: new Date()
      });
      
      return { 
        originalPriority: originalTicket.priority,
        newPriority: newPriority 
      };
    }
    
    return null;
  }

  /**
   * Process auto reply action
   */
  private static async processAutoReply(request: any): Promise<any> {
    // Implement auto reply logic here
    // This would typically add a comment to the ticket
    console.log(`Adding auto reply to ticket ${request.ticketId}`);
    return { 
      replyContent: request.parameters?.autoReplyTemplate || 'Thank you for contacting us. We are processing your request.' 
    };
  }

  /**
   * Log action execution
   */
  private static async logAction(
    request: any, 
    status: ActionStatus, 
    startTime: number, 
    result: any = null, 
    errorMessage?: string
  ): Promise<void> {
    const processingTime = Date.now() - startTime;
    
    await ActionLogModel.create({
      organization: new Types.ObjectId(request.organizationId.toString()),
      ticketId: isValidObjectId(request.ticketId.toString()) ? new Types.ObjectId(request.ticketId.toString()) : request.ticketId.toString(),
      actionThresholdId: new Types.ObjectId(request.thresholdId.toString()),
      actionType: request.actionType,
      confidenceScore: request.confidenceScore,
      executedAt: new Date(),
      status,
      details: {
        ...request.parameters,
        ...result
      },
      metadata: {
        triggeredBy: request.userId ? 'manual_trigger' : 'ai_analysis',
        processingTimeMs: processingTime,
        errorMessage,
        externalSystemResponse: result
      }
    });
  }

  /**
   * Get customer tier
   */
  private static async getCustomerTier(organizationId: string, customerId: string): Promise<any> {
    // This is a simplified implementation
    // In a real system, you'd look up the customer's tier based on their history
    return await CustomerTierModel.findOne({
      organization: new Types.ObjectId(organizationId),
      name: 'silver' // Default tier
    }).lean();
  }
} 