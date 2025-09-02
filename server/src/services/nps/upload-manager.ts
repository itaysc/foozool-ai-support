import { UploadModel } from '../../schemas/upload.schema';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export class UploadManager {
  /**
   * Create a new upload record
   */
  static async createUpload(
    organizationId: string,
    type: 'csv' | 'json' | 'webhook' | 'generic',
    metadata: {
      filename?: string;
      originalSize?: number;
      [key: string]: any;
    } = {}
  ): Promise<{ uploadId: string; upload: any }> {
    const uploadId = uuidv4();
    
    const upload = new UploadModel({
      uploadId,
      organizationId: new Types.ObjectId(organizationId),
      type,
      filename: metadata.filename,
      originalSize: metadata.originalSize,
      status: 'pending',
      progress: 0,
      message: 'Upload created',
      metadata: metadata
    });
    
    await upload.save();
    
    return { uploadId, upload };
  }

  /**
   * Update upload status and progress
   */
  static async updateUploadStatus(
    uploadId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    progress: number,
    message: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        progress,
        message,
        updatedAt: new Date()
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      if (additionalMetadata) {
        updateData.metadata = additionalMetadata;
      }

      // Use findOneAndUpdate to ensure we don't lose any existing data
      const result = await UploadModel.findOneAndUpdate(
        { uploadId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!result) {
        console.error(`Upload ${uploadId} not found during status update`);
        return;
      }

      console.log(`📊 Upload ${uploadId}: ${status} - ${progress}% - ${message}`);
    } catch (error: unknown) {
      console.error(`Error updating upload status for ${uploadId}:`, error);
    }
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(uploadId: string, organizationId: string): Promise<any> {
    try {
      // Ensure organizationId is provided
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const upload = await UploadModel.findOne({
        uploadId,
        organizationId: new Types.ObjectId(organizationId)
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      // Verify the upload belongs to the requested organization
      if (upload.organizationId.toString() !== organizationId) {
        throw new Error('Upload does not belong to the specified organization');
      }

      return {
        uploadId: upload.uploadId,
        organizationId: upload.organizationId.toString(),
        status: upload.status,
        progress: upload.progress,
        message: upload.message,
        error: upload.error,
        filename: upload.filename,
        originalSize: upload.originalSize,
        metadata: upload.metadata,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
        completedAt: upload.completedAt,
        type: upload.type
      };
    } catch (error: unknown) {
      console.error('Error getting upload status:', error);
      throw error;
    }
  }

  /**
   * Get upload history for organization
   */
  static async getUploadHistory(
    organizationId: string, 
    options: { limit: number; offset: number; status?: string }
  ): Promise<any> {
    try {
      // Ensure organizationId is provided
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const { limit, offset, status } = options;
      
      const query: any = {
        organizationId: new Types.ObjectId(organizationId)
      };

      if (status) {
        query.status = status;
      }

      const uploads = await UploadModel.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-__v');

      const total = await UploadModel.countDocuments(query);

      return {
        uploads: uploads.map(upload => ({
          uploadId: upload.uploadId,
          organizationId: upload.organizationId.toString(),
          type: upload.type,
          filename: upload.filename,
          status: upload.status,
          progress: upload.progress,
          message: upload.message,
          originalSize: upload.originalSize,
          createdAt: upload.createdAt,
          updatedAt: upload.updatedAt,
          completedAt: upload.completedAt
        })),
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error: unknown) {
      console.error('Error getting upload history:', error);
      throw error;
    }
  }

  /**
   * Delete upload
   */
  static async deleteUpload(uploadId: string, organizationId: string): Promise<void> {
    try {
      // Ensure organizationId is provided
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const result = await UploadModel.findOneAndDelete({
        uploadId,
        organizationId: new Types.ObjectId(organizationId)
      });

      if (!result) {
        throw new Error('Upload not found or already deleted');
      }

      // Verify the upload belonged to the requested organization
      if (result.organizationId.toString() !== organizationId) {
        throw new Error('Upload does not belong to the specified organization');
      }

      console.log(`🗑️ Deleted upload ${uploadId} for organization ${organizationId}`);
    } catch (error: unknown) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  }

  /**
   * Cancel an in-progress upload
   */
  static async cancelUpload(uploadId: string, organizationId: string): Promise<void> {
    try {
      // Ensure organizationId is provided
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const upload = await UploadModel.findOne({
        uploadId,
        organizationId: new Types.ObjectId(organizationId),
        status: { $in: ['pending', 'processing'] }
      });

      if (!upload) {
        throw new Error('Upload not found or cannot be cancelled');
      }

      // Verify the upload belongs to the requested organization
      if (upload.organizationId.toString() !== organizationId) {
        throw new Error('Upload does not belong to the specified organization');
      }

      await this.updateUploadStatus(uploadId, 'cancelled', 0, 'Upload cancelled by user');
      
      console.log(`❌ Cancelled upload ${uploadId} for organization ${organizationId}`);
    } catch (error: unknown) {
      console.error('Error cancelling upload:', error);
      throw error;
    }
  }

  /**
   * Verify that an upload belongs to a specific organization
   */
  static async verifyUploadOwnership(uploadId: string, organizationId: string): Promise<boolean> {
    try {
      if (!organizationId) {
        return false;
      }

      const upload = await UploadModel.findOne({
        uploadId,
        organizationId: new Types.ObjectId(organizationId)
      });

      return upload !== null;
    } catch (error: unknown) {
      console.error(`Error verifying upload ownership for ${uploadId}:`, error);
      return false;
    }
  }

  /**
   * Get upload statistics for an organization
   */
  static async getUploadStats(organizationId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    recentActivity: number;
  }> {
    try {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const orgObjectId = new Types.ObjectId(organizationId);

      // Get total uploads
      const total = await UploadModel.countDocuments({ organizationId: orgObjectId });

      // Get counts by status
      const statusStats = await UploadModel.aggregate([
        { $match: { organizationId: orgObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Get counts by type
      const typeStats = await UploadModel.aggregate([
        { $match: { organizationId: orgObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      // Get recent activity (uploads in last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await UploadModel.countDocuments({
        organizationId: orgObjectId,
        createdAt: { $gte: sevenDaysAgo }
      });

      // Convert to expected format
      const byStatus: Record<string, number> = {};
      statusStats.forEach(stat => {
        byStatus[stat._id] = stat.count;
      });

      const byType: Record<string, number> = {};
      typeStats.forEach(stat => {
        byType[stat._id] = stat.count;
      });

      return {
        total,
        byStatus,
        byType,
        recentActivity
      };
    } catch (error: unknown) {
      console.error('Error getting upload stats:', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned uploads (uploads without organization ID)
   */
  static async cleanupOrphanedUploads(): Promise<number> {
    try {
      const result = await UploadModel.deleteMany({
        organizationId: { $exists: false }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} orphaned uploads`);
      }

      return result.deletedCount;
    } catch (error: unknown) {
      console.error('Error cleaning up orphaned uploads:', error);
      return 0;
    }
  }
}
