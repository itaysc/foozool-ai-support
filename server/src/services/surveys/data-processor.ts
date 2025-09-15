import { SurveyResponse, SurveyType } from '../../types/surveys';
import { parseCSVData, parseJSONData, transformWebhookData, mapGenericDataWithAI } from './utils';

export class DataProcessor {
  /**
   * Process CSV data for surveys
   */
  static async processCSVData(file: Express.Multer.File, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
    try {
      const csvData = await parseCSVData(file, userId);
      return this.validateSurveyResponses(csvData, surveyType);
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} CSV data:`, error);
      throw error;
    }
  }

  /**
   * Process JSON data for surveys
   */
  static async processJSONData(file: Express.Multer.File, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
    try {
      const jsonData = await parseJSONData(file, userId);
      return this.validateSurveyResponses(jsonData, surveyType);
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} JSON data:`, error);
      throw error;
    }
  }

  /**
   * Transform webhook data for surveys
   */
  static async transformWebhookData(webhookData: any, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
    try {
      const transformedData = await transformWebhookData(webhookData, userId, surveyType);
      return this.validateSurveyResponses(transformedData, surveyType);
    } catch (error) {
      console.error(`Error transforming ${surveyType.toUpperCase()} webhook data:`, error);
      throw error;
    }
  }

  /**
   * Map generic data with AI for surveys
   */
  static async mapGenericDataWithAI(genericData: any, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
    try {
      const mappedData = await mapGenericDataWithAI(genericData, userId, surveyType);
      return this.validateSurveyResponses(mappedData, surveyType);
    } catch (error) {
      console.error(`Error mapping ${surveyType.toUpperCase()} generic data:`, error);
      throw error;
    }
  }

  /**
   * Process survey data and return processed data structure
   */
  static async processSurveyData(
    responses: SurveyResponse[], 
    organizationId: string, 
    surveyType: SurveyType
  ): Promise<{
    surveyId: string;
    surveyType: SurveyType;
    organizationId: string;
    responses: SurveyResponse[];
    metadata: Record<string, any>;
  }> {
    try {
      const surveyId = `survey_${surveyType}_${organizationId}_${Date.now()}`;
      
      return {
        surveyId,
        surveyType,
        organizationId,
        responses,
        metadata: {
          totalResponses: responses.length,
          surveyType,
          processedAt: new Date(),
          organizationId
        }
      };
    } catch (error) {
      console.error(`Error processing ${surveyType.toUpperCase()} survey data:`, error);
      throw error;
    }
  }

  /**
   * Validate survey responses
   */
  private static validateSurveyResponses(responses: any[], surveyType: SurveyType): SurveyResponse[] {
    try {
      return responses.map((response, index) => {
        // Ensure surveyType is set
        if (!response.surveyType) {
          response.surveyType = surveyType;
        }

        // Validate timestamp
        if (!response.timestamp) {
          response.timestamp = new Date().toISOString();
        }

        // Validate responses array
        if (!response.responses || !Array.isArray(response.responses)) {
          response.responses = [];
        }

        return response as SurveyResponse;
      });
    } catch (error) {
      console.error(`Error validating ${surveyType.toUpperCase()} survey responses:`, error);
      throw error;
    }
  }
}
