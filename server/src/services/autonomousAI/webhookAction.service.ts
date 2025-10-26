import { ActionThresholdModel, ActionLogModel, ThresholdMissModel } from '../../schemas';
import { Types } from 'mongoose';
import { addCommentToTicket } from '../zendesk';
import { WebhookService } from '../webhook';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && (id.length === 24);
}

/**
 * Execute autonomous actions based on action thresholds
 */
export async function executeAutonomousActions(
  ticketId: string,
  organizationId: string,
  actionType: string,
  confidenceScore: number,
  userId: string,
  ticketMetadata?: {
    subject?: string;
    status?: string;
    priority?: string;
    customerTier?: string;
  }
): Promise<any[]> {
  try {
    console.log(`Checking action thresholds for ticket ${ticketId}, action: ${actionType}, confidence: ${confidenceScore}`);

    // Get applicable action thresholds
    let thresholds = await ActionThresholdModel.find({
      organization: new Types.ObjectId(organizationId),
    }).sort({ priority: -1 }).lean();
    
    // Track threshold misses for thresholds that don't meet the confidence score
    const thresholdMisses: any[] = [];
    
    for (const threshold of thresholds) {
      if (threshold.actionType === actionType && threshold.isActive) {
        if (threshold.threshold > confidenceScore) {
          // Threshold not met - track this miss with enhanced metadata
          thresholdMisses.push({
            organization: new Types.ObjectId(organizationId),
            ticketId: isValidObjectId(ticketId) ? new Types.ObjectId(ticketId) : ticketId,
            actionType: actionType as any,
            thresholdId: threshold._id,
            thresholdName: threshold.name,
            thresholdValue: threshold.threshold,
            confidenceScore,
            missedBy: threshold.threshold - confidenceScore,
            ticketSubject: ticketMetadata?.subject,
            ticketStatus: ticketMetadata?.status,
            ticketPriority: ticketMetadata?.priority,
            customerTier: ticketMetadata?.customerTier,
            occurredAt: new Date()
          });
        }
      }
    }
    
    // Save threshold misses to database
    if (thresholdMisses.length > 0) {
      try {
        await ThresholdMissModel.insertMany(thresholdMisses);
        console.log(`Tracked ${thresholdMisses.length} threshold misses for action ${actionType}`);
      } catch (error) {
        console.error('Failed to save threshold misses:', error);
      }
    }
    
    // Filter thresholds that meet the confidence score
    thresholds = thresholds.filter(threshold => (
        threshold.actionType === actionType &&
        threshold.isActive &&
        threshold.threshold <= confidenceScore
    ));
    
    if (thresholds.length === 0) {
      console.log(`No applicable thresholds found for action ${actionType}`);
      return [];
    }

    const executedActions: any[] = [];

    for (const threshold of thresholds) {
      try {
        console.log(`Executing action ${actionType} based on threshold "${threshold.name}"`);
        
        // Execute the action based on type
        const result = await executeActionByType(actionType, ticketId, organizationId, threshold, userId);
        
        if (result) {
          executedActions.push({
            actionType,
            thresholdName: threshold.name,
            confidenceScore,
            status: 'executed',
            result
          });
          
          // Log the action
          await ActionLogModel.create({
            organization: new Types.ObjectId(organizationId),
            ticketId: isValidObjectId(ticketId) ? new Types.ObjectId(ticketId) : ticketId,
            actionThresholdId: threshold._id,
            actionType: actionType as any,
            confidenceScore,
            executedAt: new Date(),
            status: 'executed',
            details: result,
            metadata: {
              triggeredBy: 'ai_analysis',
              processingTimeMs: 0,
              externalSystemResponse: result
            }
          });

          // Fire webhook for action execution
          await WebhookService.fireWebhooks(organizationId, 'action.executed', {
            ticketId,
            actionType,
            confidenceScore,
            thresholdName: threshold.name,
            result,
            organizationId
          });
        }
      } catch (error) {
        console.error(`Failed to execute action ${actionType}:`, error);
        executedActions.push({
          actionType,
          thresholdName: threshold.name,
          confidenceScore,
          status: 'failed',
          error: (error as Error).message
        });
      }
    }

    return executedActions;
  } catch (error) {
    console.error('Error executing autonomous actions:', error);
    return [];
  }
}

/**
 * Execute specific action based on type
 */
async function executeActionByType(
  actionType: string,
  ticketId: string,
  organizationId: string,
  threshold: any,
  userId: string
): Promise<any> {
  switch (actionType) {
    case 'refund':
      return await processRefundAction(ticketId, organizationId, threshold);
    case 'coupon':
      return await processCouponAction(ticketId, organizationId, threshold);
    case 'auto_resolve':
      return await processAutoResolveAction(ticketId, organizationId, threshold);
    case 'escalate':
      return await processEscalationAction(ticketId, organizationId, threshold);
    case 'priority_change':
      return await processPriorityChangeAction(ticketId, organizationId, threshold);
    case 'auto_reply':
      return await processAutoReplyAction(ticketId, organizationId, threshold);
    default:
      console.log(`Action type ${actionType} not implemented yet`);
      return { message: `Action type ${actionType} not implemented yet` };
  }
}

/**
 * Process refund action
 */
async function processRefundAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing refund action for ticket ${ticketId}`);
  // TODO: Integrate with payment system
  return {
    message: 'Refund action not implemented yet - requires payment system integration',
    refundAmount: threshold.actionConfig?.refundAmount || 0
  };
}

/**
 * Process coupon action
 */
async function processCouponAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing coupon action for ticket ${ticketId}`);
  // TODO: Integrate with coupon/discount system
  return {
    message: 'Coupon action not implemented yet - requires discount system integration',
    couponCode: threshold.actionConfig?.couponCode || 'APOLOGY_COUPON',
    couponDiscount: threshold.actionConfig?.couponDiscount || 10
  };
}

/**
 * Process auto-resolve action
 */
async function processAutoResolveAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing auto-resolve action for ticket ${ticketId}`);
  // TODO: Update ticket status in Zendesk
  return {
    message: 'Auto-resolve action not implemented yet - requires Zendesk status update integration'
  };
}

/**
 * Process escalation action
 */
async function processEscalationAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing escalation action for ticket ${ticketId}`);
  // TODO: Update ticket priority in Zendesk
  return {
    message: 'Escalation action not implemented yet - requires Zendesk priority update integration',
    escalationLevel: threshold.actionConfig?.escalationLevel || 'high'
  };
}

/**
 * Process priority change action
 */
async function processPriorityChangeAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing priority change action for ticket ${ticketId}`);
  // TODO: Update ticket priority in Zendesk
  return {
    message: 'Priority change action not implemented yet - requires Zendesk priority update integration',
    newPriority: threshold.actionConfig?.newPriority || 'high'
  };
}

/**
 * Process auto-reply action
 */
async function processAutoReplyAction(ticketId: string, organizationId: string, threshold: any): Promise<any> {
  console.log(`Processing auto-reply action for ticket ${ticketId}`);
  try {
    const replyContent = threshold.actionConfig?.autoReplyTemplate || 
      'Thank you for contacting us. We are working on resolving your issue.';
    
    // Add comment to Zendesk ticket
    await addCommentToTicket(ticketId, replyContent, true);
    
    return {
      message: 'Auto-reply sent successfully',
      replyContent
    };
  } catch (error) {
    console.error('Failed to send auto-reply:', error);
    throw error;
  }
}

 