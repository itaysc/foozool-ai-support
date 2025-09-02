import { NPSInsights, ProcessedNPSData, NPSSurvey, NPSResponse } from '../../types/nps';
import { UploadManager } from './upload-manager';
import { InsightsManager } from './insights-manager';
import { DataProcessor } from './data-processor';

export class NPSService {
  private static instance: NPSService;
  private memoryCache: Map<string, NPSInsights> = new Map();

  static getInstance(): NPSService {
    if (!NPSService.instance) {
      NPSService.instance = new NPSService();
    }
    return NPSService.instance;
  }

  /**
   * Process CSV file upload and generate insights
   */
  async processCSVUpload(file: Express.Multer.File, organizationId: string, userId: string): Promise<ProcessedNPSData> {
    try {
      // Create upload record
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'csv', {
        filename: file.originalname,
        originalSize: file.size
      });

      console.log(`🔍 Processing CSV upload ${uploadId} for organization ${organizationId}`);
      
      // Update status to processing
      await UploadManager.updateUploadStatus(uploadId, 'processing', 10, 'Parsing CSV file...');
      
      // Parse CSV data
      const csvData = await DataProcessor.processCSVData(file, userId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 30, 'Processing NPS data...');
      
      // Process the data
      const processedData = await DataProcessor.processNPSData(csvData, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      // Generate insights
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      // Save insights to database
      await InsightsManager.saveInsights({
        ...processedData,
        insights
      }, organizationId);
      
      // Update upload as completed
      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'CSV processing completed successfully', {
        surveyId: processedData.surveyId,
        responsesCount: processedData.responses.length,
        processingTime: Date.now() - upload.createdAt.getTime()
      });
      
      // Clear memory cache to free up space
      this.clearMemoryCache(organizationId);
      
      return {
        ...processedData,
        insights
      };
    } catch (error: unknown) {
      console.error(`Error processing CSV upload:`, error);
      
      // Update upload as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      // Note: We can't get uploadId here since it's created in the try block
      // In a real implementation, you might want to pass uploadId as a parameter
      
      throw error;
    }
  }

  /**
   * Process JSON bulk import and generate insights
   */
  async processJSONUpload(survey: NPSSurvey, responses: NPSResponse[], organizationId: string, userId: string): Promise<ProcessedNPSData> {
    try {
      // Create upload record
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'json', {
        originalSize: JSON.stringify({ survey, responses }).length
      });

      console.log(`🔍 Processing JSON upload ${uploadId} for organization ${organizationId}, ${responses.length} responses`);
      
      // Update status to processing
      await UploadManager.updateUploadStatus(uploadId, 'processing', 20, 'Processing NPS data...');
      
      // Process the data
      const processedData = await DataProcessor.processNPSData({
        survey,
        responses
      }, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      // Generate insights
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      // Save insights to database
      await InsightsManager.saveInsights({
        ...processedData,
        insights
      }, organizationId);
      
      // Update upload as completed
      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'JSON processing completed successfully', {
        surveyId: processedData.surveyId,
        responsesCount: processedData.responses.length,
        processingTime: Date.now() - upload.createdAt.getTime()
      });
      
      // Clear memory cache to free up space
      this.clearMemoryCache(organizationId);
      
      return {
        ...processedData,
        insights
      };
    } catch (error: unknown) {
      console.error(`Error processing JSON upload:`, error);
      throw error;
    }
  }

  /**
   * Process webhook data and generate insights
   */
  async processWebhookData(npsData: any, organizationId: string, userId: string): Promise<ProcessedNPSData> {
    try {
      // Create upload record
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'webhook', {
        originalSize: JSON.stringify(npsData).length
      });

      console.log(`🔍 Processing webhook data ${uploadId} for organization ${organizationId}`);
      
      // Update status to processing
      await UploadManager.updateUploadStatus(uploadId, 'processing', 20, 'Transforming webhook data...');
      
      // Transform webhook data to standard format
      const transformedData = await DataProcessor.processWebhookData(npsData, userId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 40, 'Processing NPS data...');
      
      // Process the data
      const processedData = await DataProcessor.processNPSData(transformedData, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      // Generate insights
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      // Save insights to database
      await InsightsManager.saveInsights({
        ...processedData,
        insights
      }, organizationId);
      
      // Update upload as completed
      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'Webhook processing completed successfully', {
        surveyId: processedData.surveyId,
        responsesCount: processedData.responses.length,
        processingTime: Date.now() - upload.createdAt.getTime()
      });
      
      // Clear memory cache to free up space
      this.clearMemoryCache(organizationId);
      
      return {
        ...processedData,
        insights
      };
    } catch (error: unknown) {
      console.error(`Error processing webhook data:`, error);
      throw error;
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string, organizationId: string): Promise<any> {
    return UploadManager.getUploadStatus(uploadId, organizationId);
  }

  /**
   * Get upload history for organization
   */
  async getUploadHistory(organizationId: string, options: { limit: number; offset: number; status?: string }): Promise<any> {
    return UploadManager.getUploadHistory(organizationId, options);
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: string, organizationId: string): Promise<void> {
    return UploadManager.deleteUpload(uploadId, organizationId);
  }

  /**
   * Cancel an in-progress upload
   */
  async cancelUpload(uploadId: string, organizationId: string): Promise<void> {
    return UploadManager.cancelUpload(uploadId, organizationId);
  }

  /**
   * Get NPS insights for an organization
   */
  async getNPSInsights(organizationId: string): Promise<NPSInsights | null> {
    return InsightsManager.getNPSInsights(organizationId);
  }

  /**
   * Get NPS insights history for an organization
   */
  async getNPSInsightsHistory(
    organizationId: string, 
    options: { limit: number; offset: number } = { limit: 10, offset: 0 }
  ): Promise<any> {
    return InsightsManager.getNPSInsightsHistory(organizationId, options);
  }

  /**
   * Get upload statistics for an organization
   */
  async getUploadStats(organizationId: string): Promise<any> {
    return UploadManager.getUploadStats(organizationId);
  }

  /**
   * Verify that an upload belongs to a specific organization
   */
  async verifyUploadOwnership(uploadId: string, organizationId: string): Promise<boolean> {
    return UploadManager.verifyUploadOwnership(uploadId, organizationId);
  }

  /**
   * Clean up orphaned uploads (admin function)
   */
  async cleanupOrphanedUploads(): Promise<number> {
    return UploadManager.cleanupOrphanedUploads();
  }

  /**
   * Process generic data upload with AI mapping
   */
  async processGenericDataUpload(rawData: any, organizationId: string, userId: string): Promise<ProcessedNPSData> {
    try {
      console.log('🔄 Processing generic NPS data with AI mapping...');
      console.log('📊 Raw data structure:', Object.keys(rawData));
      
      // Create upload record
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'generic', {
        originalSize: JSON.stringify(rawData).length
      });

      console.log(`🔍 Processing generic upload ${uploadId} for organization ${organizationId}`);
      
      // Update status to processing
      await UploadManager.updateUploadStatus(uploadId, 'processing', 20, 'Analyzing data structure with AI...');
      
      // Use AI mapping to detect and transform the data
      const transformedData = await DataProcessor.processGenericData(rawData, userId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 40, 'Processing NPS data...');
      
      // Process the transformed data
      const processedData = await DataProcessor.processNPSData(transformedData, organizationId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      // Generate insights
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, userId);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      // Save insights to database
      await InsightsManager.saveInsights({
        ...processedData,
        insights
      }, organizationId);
      
      // Update upload as completed
      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'Generic data processing completed successfully with AI mapping', {
        surveyId: processedData.surveyId,
        responsesCount: processedData.responses.length,
        processingTime: Date.now() - upload.createdAt.getTime(),
        aiMappingUsed: true
      });
      
      // Clear memory cache to free up space
      this.clearMemoryCache(organizationId);
      
      return {
        ...processedData,
        insights
      };
    } catch (error: unknown) {
      console.error(`Error processing generic data upload:`, error);
      throw error;
    }
  }

  /**
   * Clear memory cache for organization
   */
  private clearMemoryCache(organizationId: string): void {
    this.memoryCache.delete(organizationId);
  }
}

// Export all NPS service components
export { UploadManager } from './upload-manager';
export { InsightsManager } from './insights-manager';
export { DataProcessor } from './data-processor';

export default NPSService;
