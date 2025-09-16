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
      filename: string;
      originalSize: number;
      surveyType?: string;
    }
  ): Promise<{ uploadId: string; upload: any }> {
    const uploadId = uuidv4();
    
    const upload = new UploadModel({
      uploadId,
      organizationId: new Types.ObjectId(organizationId),
      type,
      status: 'pending',
      progress: 0,
      metadata: {
        ...metadata,
        createdAt: new Date()
      }
    });

    await upload.save();
    
    return { uploadId, upload };
  }

  /**
   * Update upload status
   */
  static async updateUploadStatus(
    uploadId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    progress: number,
    message?: string
  ): Promise<void> {
    await UploadModel.findOneAndUpdate(
      { uploadId },
      {
        status,
        progress,
        message,
        updatedAt: new Date()
      }
    );
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(uploadId: string): Promise<any> {
    const upload = await UploadModel.findOne({ uploadId }).lean();
    return upload;
  }

  /**
   * Get upload history
   */
  static async getUploadHistory(organizationId: string, surveyType?: string): Promise<any[]> {
    const query: any = { organizationId: new Types.ObjectId(organizationId) };
    
    if (surveyType) {
      query['metadata.surveyType'] = surveyType;
    }

    const uploads = await UploadModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    return uploads;
  }

  /**
   * Cancel upload
   */
  static async cancelUpload(uploadId: string): Promise<void> {
    await UploadModel.findOneAndUpdate(
      { uploadId },
      {
        status: 'cancelled',
        updatedAt: new Date()
      }
    );
  }

  /**
   * Delete upload
   */
  static async deleteUpload(uploadId: string): Promise<void> {
    await UploadModel.findOneAndDelete({ uploadId });
  }

  /**
   * Get upload statistics
   */
  static async getUploadStatistics(organizationId: string, surveyType?: string): Promise<any> {
    const query: any = { organizationId: new Types.ObjectId(organizationId) };
    
    if (surveyType) {
      query['metadata.surveyType'] = surveyType;
    }

    const stats = await UploadModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSize: { $sum: '$metadata.originalSize' }
        }
      }
    ]);

    return {
      totalUploads: await UploadModel.countDocuments(query),
      statusBreakdown: stats,
      surveyType: surveyType || 'all'
    };
  }
}
