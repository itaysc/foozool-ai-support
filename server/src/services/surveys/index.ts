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
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType, userId);
      
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
      
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType, userId);
      
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
   * Process JSON data directly from request body and generate insights
   */
  async processJSONData(
    jsonData: any, 
    organizationId: string, 
    userId: string, 
    surveyType: SurveyType
  ): Promise<ProcessedSurveyData> {
    try {
      const { uploadId, upload } = await UploadManager.createUpload(organizationId, 'json', {
        filename: 'direct-json-data',
        originalSize: JSON.stringify(jsonData).length,
        surveyType
      });

      console.log(`🔍 Processing ${surveyType.toUpperCase()} JSON data ${uploadId} for organization ${organizationId}`);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 10, 'Processing JSON data...');
      
      // Process the JSON data directly (no file parsing needed)
      const processedData = await DataProcessor.processSurveyData(jsonData.responses, organizationId, surveyType);
      
      await UploadManager.updateUploadStatus(uploadId, 'processing', 60, 'Generating insights...');
      
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType, userId);
      
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
      console.error(`❌ Error processing ${surveyType.toUpperCase()} JSON data:`, error);
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
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType, userId);
      
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
      const insights = await InsightsManager.generateInsights(processedData.responses, organizationId, surveyType, userId);
      
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
        const cachedInsights = this.memoryCache.get(cacheKey)!;
        
        // Validate cached insights - only use if they have valid data
        if (this.hasValidInsights(cachedInsights, surveyType)) {
          return cachedInsights;
        } else {
          console.log(`🔄 Cached ${surveyType.toUpperCase()} insights are invalid, regenerating...`);
          this.memoryCache.delete(cacheKey); // Remove invalid cache
        }
      }

      const insights = await InsightsManager.getLatestInsights(organizationId, surveyType);
      
      if (insights && this.hasValidInsights(insights, surveyType)) {
        this.memoryCache.set(cacheKey, insights);
        return insights;
      } else if (insights) {
        console.log(`🔄 Database ${surveyType.toUpperCase()} insights are invalid, clearing them...`);
        // Clear invalid insights from database and cache
        await this.clearInvalidInsights(organizationId, surveyType);
      }

      return null;
    } catch (error) {
      console.error(`Error getting ${surveyType.toUpperCase()} insights:`, error);
      return null;
    }
  }

  /**
   * Validate if insights contain valid data (not errors or empty)
   */
  private hasValidInsights(insights: SurveyInsights, surveyType: SurveyType): boolean {
    if (!insights) return false;
    
    // Check if insights contain error messages
    const hasErrorInsights = insights.insights?.some(insight => 
      insight.toLowerCase().includes('error') || 
      insight.toLowerCase().includes('no insights available')
    );
    
    const hasErrorRecommendations = insights.recommendations?.some(rec => 
      rec.toLowerCase().includes('error') || 
      rec.toLowerCase().includes('no recommendations available')
    );
    
    if (hasErrorInsights || hasErrorRecommendations) {
      return false;
    }
    
    // Check if insights are essentially empty (no real data)
    if (surveyType === 'nps') {
      const npsInsights = insights as any;
      return npsInsights.currentNPS !== 0 || 
             npsInsights.totalResponses > 0 || 
             (npsInsights.insights && npsInsights.insights.length > 0 && 
              !npsInsights.insights.every((i: string) => i.toLowerCase().includes('no nps data')));
    } else if (surveyType === 'csat') {
      const csatInsights = insights as any;
      return csatInsights.currentCSAT !== 0 || 
             csatInsights.totalResponses > 0 || 
             (csatInsights.insights && csatInsights.insights.length > 0 && 
              !csatInsights.insights.every((i: string) => i.toLowerCase().includes('no csat data')));
    }
    
    return true;
  }

  /**
   * Clear invalid insights from database and cache
   */
  private async clearInvalidInsights(organizationId: string, surveyType: SurveyType): Promise<void> {
    try {
      console.log(`🗑️ Clearing invalid ${surveyType.toUpperCase()} insights for organization ${organizationId}`);
      
      const insightType = surveyType === 'nps' ? 'nps_analysis' : 'customer_satisfaction';
      
      // Remove from database
      await InsightsManager.deleteLatestInsights(organizationId, insightType);
      
      // Clear from cache
      const cacheKey = `${organizationId}_${surveyType}`;
      this.memoryCache.delete(cacheKey);
      
      console.log(`✅ Cleared invalid ${surveyType.toUpperCase()} insights`);
    } catch (error) {
      console.error(`❌ Error clearing invalid ${surveyType.toUpperCase()} insights:`, error);
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
