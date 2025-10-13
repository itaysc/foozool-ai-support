import mongoose from 'mongoose';
import { InsightModel } from '../../schemas/insights.schema';
import { UserContextManager } from '../../context/userContext';

/**
 * Update the assignee for a specific insight
 */
export async function updateInsightAssignee(insightId: string, assignee?: string): Promise<{ status: number; data?: any; error?: string }> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(insightId)) {
      return { status: 400, error: 'Invalid insight ID format' };
    }

    if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
      return { status: 400, error: 'Invalid assignee ID format' };
    }

    // Find the insight and ensure it belongs to the current organization
    const insight = await InsightModel.findOne({
      _id: insightId,
      organizationId: organizationId
    });

    if (!insight) {
      return { status: 404, error: 'Insight not found' };
    }

    // Update the assignee
    const updatedInsight = await InsightModel.findByIdAndUpdate(
      insightId,
      { 
        assignee: assignee ? new mongoose.Types.ObjectId(assignee) : null,
        lastUpdatedAt: new Date()
      },
      { new: true }
    ).populate('assignee', 'name email').lean();

    // Handle the populated assignee data
    const assigneeData = updatedInsight?.assignee && typeof updatedInsight.assignee === 'object' && !Array.isArray(updatedInsight.assignee) 
      ? {
          _id: (updatedInsight.assignee as any)._id,
          name: (updatedInsight.assignee as any).name,
          email: (updatedInsight.assignee as any).email
        }
      : null;

    return {
      status: 200,
      data: {
        insightId: updatedInsight?._id,
        assignee: assigneeData,
        lastUpdatedAt: updatedInsight?.lastUpdatedAt
      }
    };
  } catch (error: any) {
    console.error('Error updating insight assignee:', error);
    return { status: 500, error: 'Internal server error' };
  }
}

/**
 * Update the status for a specific insight
 */
export async function updateInsightStatus(insightId: string, status: string): Promise<{ status: number; data?: any; error?: string }> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  if (!organizationId) {
    return { status: 400, error: 'Organization ID not found in user context' };
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(insightId)) {
      return { status: 400, error: 'Invalid insight ID format' };
    }
    
    const validStatuses = ['new', 'in_progress', 'resolved', 'closed', 'reopened'];
    if (!validStatuses.includes(status)) {
      return { status: 400, error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') };
    }
    
    const insight = await InsightModel.findOne({ _id: insightId, organizationId: organizationId });
    if (!insight) {
      return { status: 404, error: 'Insight not found' };
    }
    
    const updatedInsight = await InsightModel.findByIdAndUpdate(
      insightId,
      { 
        status: status,
        lastUpdatedAt: new Date()
      },
      { new: true }
    ).lean();
    
    return {
      status: 200,
      data: {
        insightId: updatedInsight?._id,
        status: updatedInsight?.status,
        lastUpdatedAt: updatedInsight?.lastUpdatedAt
      }
    };
  } catch (error: any) {
    console.error('Error updating insight status:', error);
    return { status: 500, error: 'Internal server error' };
  }
}

