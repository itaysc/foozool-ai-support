import { SurveyInsights, ProcessedSurveyData, Survey, SurveyResponse, SurveyType } from '../../types/surveys';
import { UploadManager } from './upload-manager';
import { InsightsManager } from './insights-manager';
import { DataProcessor } from './data-processor';

export class SurveysService {
  private static instance: SurveysService;
  private memoryCache: Map<string, SurveyInsights> = new Map();

  static getInstance(): SurveysService {
    if (!SurveysService.instance) {
      SurveysService.instance = new SurveysService();
    }
    return SurveysService.instance;
  }

  /**
   * Process CSV file upload and generate insights
   */
  async processCSVUpload(
    file: Express.Multer.File, 
    organizationId: string, 
    userId: string, 
    surveyType: SurveyType
  ): Promise<ProcessedSurveyData> {
    try {
      // Create upload record
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'csv', {
        filename: file.originalname,
        originalSize: file.size,
        surveyType
      });

      console.log(`🔍 Processing ${surveyType.toUpperCase()} CSV upload ${uploadId} for organization ${organizationId}`);
      
      // Update status to processing
      await UploadManager.updateUploadStatus(uploadId, 'processing', 10, 'Parsing CSV file...');
      
      // Parse CSV data
      const csvData = await DataProcessor.processCSVData(file, userId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 30, `Processing ${surveyType.toUpperCase()} data...`);
      
      // Process the data
      const processedData = await DataProcessor.processSurveyData(csvData, organizationId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      // Generate insights
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      // Save insights to database
      await InsightsManager.saveInsights({
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          uploadId,
          surveyType,
          processedAt: new Date()
        }
      }, organizationId);

      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'Upload completed successfully');

      return {
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          uploadId,
          surveyType,
          processedAt: new Date()
        }
      };
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} CSV upload:`, error);
      throw error;
    }
  }

  /**
   * Process JSON file upload and generate insights
   */
  async processJSONUpload(
    file: Express.Multer.File, 
    organizationId: string, 
    userId: string, 
    surveyType: SurveyType
  ): Promise<ProcessedSurveyData> {
    try {
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'json', {
        filename: file.originalname,
        originalSize: file.size,
        surveyType
      });

      console.log(`🔍 Processing ${surveyType.toUpperCase()} JSON upload ${uploadId} for organization ${organizationId}`);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 10, 'Parsing JSON file...');
      
      const jsonData = await DataProcessor.processJSONData(file, userId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 30, `Processing ${surveyType.toUpperCase()} data...`);
      
      const processedData = await DataProcessor.processSurveyData(jsonData, organizationId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 80, 'Saving insights to database...');
      
      await InsightsManager.saveInsights({
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          uploadId,
          surveyType,
          processedAt: new Date()
        }
      }, organizationId);

      await UploadManager.updateUploadStatus(uploadId, 'completed', 100, 'Upload completed successfully');

      return {
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          uploadId,
          surveyType,
          processedAt: new Date()
        }
      };
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} JSON upload:`, error);
      throw error;
    }
  }

  /**
   * Process webhook data and generate insights
   */
  async processWebhookData(
    webhookData: any, 
    organizationId: string, 
    userId: string, 
    surveyType: SurveyType
  ): Promise<ProcessedSurveyData> {
    try {
      console.log(`🔍 Processing ${surveyType.toUpperCase()} webhook data for organization ${organizationId}`);
      
      const transformedData = await DataProcessor.transformWebhookData(webhookData, userId, surveyType);
      const processedData = await DataProcessor.processSurveyData(transformedData, organizationId, surveyType);
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType);
      
      await InsightsManager.saveInsights({
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          surveyType,
          processedAt: new Date(),
          source: 'webhook'
        }
      }, organizationId);

      return {
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          surveyType,
          processedAt: new Date(),
          source: 'webhook'
        }
      };
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} webhook data:`, error);
      throw error;
    }
  }

  /**
   * Process generic data with AI mapping and generate insights
   */
  async processGenericData(
    genericData: any, 
    organizationId: string, 
    userId: string, 
    surveyType: SurveyType
  ): Promise<ProcessedSurveyData> {
    try {
      console.log(`🔍 Processing ${surveyType.toUpperCase()} generic data for organization ${organizationId}`);
      
      const mappedData = await DataProcessor.mapGenericDataWithAI(genericData, userId, surveyType);
      const processedData = await DataProcessor.processSurveyData(mappedData, organizationId, surveyType);
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType);
      
      await InsightsManager.saveInsights({
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          surveyType,
          processedAt: new Date(),
          source: 'generic'
        }
      }, organizationId);

      return {
        ...processedData,
        insights,
        metadata: {
          ...processedData.metadata,
          surveyType,
          processedAt: new Date(),
          source: 'generic'
        }
      };
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} generic data:`, error);
      throw error;
    }
  }

  /**
   * Get survey insights for an organization
   */
  async getSurveyInsights(organizationId: string, surveyType: SurveyType): Promise<SurveyInsights | null> {
    try {
      const cacheKey = `${organizationId}_${surveyType}`;
      
      // Check memory cache first
      if (this.memoryCache.has(cacheKey)) {
        return this.memoryCache.get(cacheKey)!;
      }

      const insights = await InsightsManager.getLatestInsights(organizationId, surveyType);
      
      if (insights) {
        this.memoryCache.set(cacheKey, insights);
      }

      return insights;
    } catch (error) {
      console.error(`Error getting ${surveyType.toUpperCase()} insights:`, error);
      return null;
    }
  }

  /**
   * Get survey insights history
   */
  async getSurveyInsightsHistory(organizationId: string, surveyType: SurveyType): Promise<any[]> {
    try {
      return await InsightsManager.getInsightsHistory(organizationId, surveyType);
    } catch (error) {
      console.error(`Error getting ${surveyType.toUpperCase()} insights history:`, error);
      return [];
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<any> {
    try {
      return await UploadManager.getUploadStatus(uploadId);
    } catch (error) {
      console.error('Error getting upload status:', error);
      throw error;
    }
  }

  /**
   * Get upload history
   */
  async getUploadHistory(organizationId: string, surveyType?: SurveyType): Promise<any[]> {
    try {
      return await UploadManager.getUploadHistory(organizationId, surveyType);
    } catch (error) {
      console.error('Error getting upload history:', error);
      return [];
    }
  }

  /**
   * Cancel upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    try {
      await UploadManager.cancelUpload(uploadId);
    } catch (error) {
      console.error('Error canceling upload:', error);
      throw error;
    }
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: string): Promise<void> {
    try {
      await UploadManager.deleteUpload(uploadId);
    } catch (error) {
      console.error('Error deleting upload:', error);
      throw error;
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStatistics(organizationId: string, surveyType?: SurveyType): Promise<any> {
    try {
      return await UploadManager.getUploadStatistics(organizationId, surveyType);
    } catch (error) {
      console.error('Error getting upload statistics:', error);
      return null;
    }
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(organizationId: string, surveyType: SurveyType): void {
    const cacheKey = `${organizationId}_${surveyType}`;
    this.memoryCache.delete(cacheKey);
  }
}
