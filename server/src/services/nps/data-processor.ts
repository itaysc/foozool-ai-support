import { NPSSurvey, NPSResponse } from '../../types/nps';
import { validateResponse, parseCSVFile, transformWebhookData, detectAndMapDataFormat } from './utils';
import { createBatches, freeBatchMemory } from './utils';

export class DataProcessor {
  /**
   * Core NPS data processing with in-memory optimization
   */
  static async processNPSData(
    data: { survey: NPSSurvey; responses: NPSResponse[] }, 
    organizationId: string
  ): Promise<{
    surveyId: string;
    organizationId: string;
    responses: NPSResponse[];
    metadata: Record<string, any>;
  }> {
    const { survey, responses } = data;
    
    // Process in batches to manage memory
    const batchSize = 1000;
    const batches = createBatches(responses, batchSize);
    
    let allProcessedResponses: NPSResponse[] = [];
    
    // Process each batch
    for (const batch of batches) {
      const processedBatch = await this.processBatch(batch, survey);
      allProcessedResponses.push(...processedBatch);
      
      // Free memory after each batch
      freeBatchMemory(processedBatch);
    }
    
    return {
      surveyId: survey.surveyId || `survey_${Date.now()}`,
      organizationId,
      responses: allProcessedResponses,
      metadata: {
        surveyName: survey.surveyName,
        questionCount: survey.questions.length,
        processingMethod: 'batch_processing',
        batchSize
      }
    };
  }

  /**
   * Process a batch of responses
   */
  private static async processBatch(responses: NPSResponse[], survey: NPSSurvey): Promise<NPSResponse[]> {
    const processedResponses: NPSResponse[] = [];
    
    for (const response of responses) {
      // Validate response against survey questions
      const validatedResponse = validateResponse(response, survey);
      if (validatedResponse) {
        processedResponses.push(validatedResponse);
      }
    }
    
    return processedResponses;
  }

  /**
   * Process CSV file data
   */
  static async processCSVData(file: Express.Multer.File, userId: string): Promise<{ survey: NPSSurvey; responses: NPSResponse[] }> {
    return await parseCSVFile(file, userId);
  }

  /**
   * Process webhook data
   */
  static async processWebhookData(npsData: any, userId: string): Promise<{ survey: NPSSurvey; responses: NPSResponse[] }> {
    return await transformWebhookData(npsData, userId);
  }

  /**
   * Process generic data with AI mapping
   */
  static async processGenericData(rawData: any, userId: string): Promise<{ survey: NPSSurvey; responses: NPSResponse[] }> {
    console.log('🔍 Processing generic data with AI mapping...');
    console.log('📊 Raw data keys:', Object.keys(rawData));
    
    // Use AI mapping to detect and transform the data
    const { survey, responses } = await detectAndMapDataFormat(rawData, 'json', userId);
    
    console.log('✅ AI mapping completed successfully');
    console.log('📋 Survey structure:', { surveyId: survey.surveyId, questionCount: survey.questions.length });
    console.log('📝 Response count:', responses.length);
    
    return { survey, responses };
  }

  /**
   * Process JSON data
   */
  static processJSONData(survey: NPSSurvey, responses: NPSResponse[]): { survey: NPSSurvey; responses: NPSResponse[] } {
    // JSON data is already in the correct format, just return it
    return { survey, responses };
  }

  /**
   * Validate data structure before processing
   */
  static validateDataStructure(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('No data provided');
      return { isValid: false, errors };
    }
    
    if (!data.survey) {
      errors.push('Survey data is missing');
    }
    
    if (!data.responses || !Array.isArray(data.responses)) {
      errors.push('Responses data is missing or not an array');
    }
    
    if (data.responses && data.responses.length === 0) {
      errors.push('No responses provided');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(responses: NPSResponse[]): {
    totalResponses: number;
    validResponses: number;
    invalidResponses: number;
    responseRate: number;
  } {
    const totalResponses = responses.length;
    const validResponses = responses.filter(r => r && r.responses && r.responses.length > 0).length;
    const invalidResponses = totalResponses - validResponses;
    const responseRate = totalResponses > 0 ? (validResponses / totalResponses) * 100 : 0;
    
    return {
      totalResponses,
      validResponses,
      invalidResponses,
      responseRate
    };
  }
}
