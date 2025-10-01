import { InsightModel } from '../../schemas/insights.schema';
import { SurveyInsights, SurveyResponse, SurveyType, ProcessedSurveyData, NPSInsights, CSATInsights } from '../../types/surveys';
import { 
  calculateNPS, 
  calculateCSAT, 
  calculateScoreDistribution, 
  generateTrends, 
  generateNPSInsights, 
  generateCSATInsights,
  getEmptyNPSInsights,
  getEmptyCSATInsights
} from './utils';

export class InsightsManager {
  /**
   * Generate insights for survey responses
   */
  static async generateInsights(
    responses: SurveyResponse[], 
    organizationId: string, 
    surveyType: SurveyType,
    userId: string
  ): Promise<SurveyInsights> {
    try {
      if (!responses || responses.length === 0) {
        return surveyType === 'nps' ? getEmptyNPSInsights() : getEmptyCSATInsights();
      }

      if (surveyType === 'nps') {
        return await this.generateNPSInsights(responses, organizationId, userId);
      } else if (surveyType === 'csat') {
        return await this.generateCSATInsights(responses, organizationId, userId);
      } else {
        throw new Error(`Unsupported survey type: ${surveyType}`);
      }
    } catch (error) {
      console.error(`Error generating ${surveyType.toUpperCase()} insights:`, error);
      return surveyType === 'nps' ? getEmptyNPSInsights() : getEmptyCSATInsights();
    }
  }

  /**
   * Generate NPS-specific insights
   */
  private static async generateNPSInsights(responses: SurveyResponse[], organizationId: string, userId: string): Promise<NPSInsights> {
    try {
      const currentNPS = calculateNPS(responses);
      const previousNPS = await this.getPreviousNPS(organizationId);
      const npsChange = currentNPS - previousNPS;
      
      const segmentBreakdown = this.calculateNPSSegments(responses);
      const trends = generateTrends(responses, 'nps') as Array<{
        date: Date;
        nps: number;
        responses: number;
      }>;
      const { insights, recommendations } = await generateNPSInsights(responses, userId);

      return {
        currentNPS,
        npsChange,
        responseRate: this.calculateResponseRate(responses),
        segmentBreakdown,
        trends,
        insights,
        recommendations,
        totalResponses: responses.length,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating NPS insights:', error);
      return getEmptyNPSInsights();
    }
  }

  /**
   * Generate CSAT-specific insights
   */
  private static async generateCSATInsights(responses: SurveyResponse[], organizationId: string, userId: string): Promise<CSATInsights> {
    try {
      const currentCSAT = calculateCSAT(responses);
      const previousCSAT = await this.getPreviousCSAT(organizationId);
      const csatChange = currentCSAT - previousCSAT;
      
      const averageScores = this.calculateCSATAverageScores(responses);
      const scoreDistribution = calculateScoreDistribution(responses);
      const trends = generateTrends(responses, 'csat') as Array<{
        date: Date;
        csat: number;
        responses: number;
      }>;
      const { insights, recommendations } = await generateCSATInsights(responses, userId);

      return {
        currentCSAT,
        csatChange,
        responseRate: this.calculateResponseRate(responses),
        totalResponses: responses.length,
        averageScores,
        scoreDistribution,
        trends,
        insights,
        recommendations,
        processedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating CSAT insights:', error);
      return getEmptyCSATInsights();
    }
  }

  /**
   * Save insights to database
   */
  static async saveInsights(processedData: ProcessedSurveyData, organizationId: string): Promise<void> {
    try {
      // Extract customerId from responses (if all responses are from the same customer)
      const customerIds = processedData.responses
        .map(r => r.customerId)
        .filter((id): id is string => !!id);
      
      const uniqueCustomerIds = [...new Set(customerIds)];
      const customerId = uniqueCustomerIds.length === 1 ? uniqueCustomerIds[0] : undefined;
      
      // If we have a customerId, try to get the customer name
      let customerName: string | undefined;
      if (customerId) {
        try {
          const { CustomerModel } = await import('../../schemas');
          const customer = await CustomerModel.findOne({ 
            _id: customerId, 
            organizationId 
          }).select('name').lean();
          customerName = customer?.name;
        } catch (error) {
          console.log(`Could not fetch customer name for customerId ${customerId}`);
        }
      }
      
      const clusterId = customerId 
        ? `survey_${processedData.surveyType}_${organizationId}_${customerId}_${Date.now()}`
        : `survey_${processedData.surveyType}_${organizationId}_${Date.now()}`;
      
      const insightData: any = {
        clusterId,
        organizationId,
        insightType: processedData.surveyType === 'nps' ? 'nps_analysis' : 'customer_satisfaction',
        issueDescription: customerName 
          ? `${processedData.surveyType.toUpperCase()} Survey Analysis for ${customerName}`
          : `${processedData.surveyType.toUpperCase()} Survey Analysis`,
        ticketVolume: processedData.responses.length,
        growthRate: 0, // Could be calculated based on previous data
        firstDetectedAt: new Date(),
        lastUpdatedAt: new Date(),
        metadata: processedData.metadata
      };
      
      // Add customerId and customerName if available
      if (customerId) {
        insightData.customerId = customerId;
      }
      if (customerName) {
        insightData.customerName = customerName;
      }

      // Add survey-specific data
      if (processedData.surveyType === 'nps') {
        insightData.npsData = processedData.insights as NPSInsights;
      } else if (processedData.surveyType === 'csat') {
        insightData.csatData = processedData.insights as CSATInsights;
      }

      await InsightModel.create(insightData);
      console.log(`✅ Saved ${processedData.surveyType.toUpperCase()} insights to database${customerId ? ` for customer ${customerName || customerId}` : ''}`);
    } catch (error) {
      console.error(`Error saving ${processedData.surveyType.toUpperCase()} insights:`, error);
      throw error;
    }
  }

  /**
   * Get latest insights for organization (optionally filtered by customer)
   */
  static async getLatestInsights(organizationId: string, surveyType: SurveyType, customerId?: string): Promise<SurveyInsights | null> {
    try {
      const insightType = surveyType === 'nps' ? 'nps_analysis' : 'customer_satisfaction';
      
      const query: any = {
        organizationId,
        insightType
      };
      
      // Add customerId filter if provided
      if (customerId) {
        query.customerId = customerId;
      }
      
      const insight = await InsightModel.findOne(query)
        .sort({ lastUpdatedAt: -1 }).lean();

      if (!insight) {
        return null;
      }

      if (surveyType === 'nps' && insight.npsData) {
        return insight.npsData as NPSInsights;
      } else if (surveyType === 'csat' && insight.csatData) {
        return insight.csatData as CSATInsights;
      }

      return null;
    } catch (error) {
      console.error(`Error getting latest ${surveyType.toUpperCase()} insights:`, error);
      return null;
    }
  }

  /**
   * Get the latest insight record (including responses) for regeneration
   */
  static async getLatestInsightRecord(organizationId: string, surveyType: SurveyType): Promise<any | null> {
    try {
      const insightType = surveyType === 'nps' ? 'nps_analysis' : 'customer_satisfaction';
      
      const insight = await InsightModel.findOne({
        organizationId,
        insightType
      }).sort({ lastUpdatedAt: -1 }).lean();

      return insight;
    } catch (error) {
      console.error(`Error getting latest ${surveyType.toUpperCase()} insight record:`, error);
      return null;
    }
  }


  /**
   * Delete latest insights from database
   */
  static async deleteLatestInsights(organizationId: string, insightType: string): Promise<void> {
    try {
      await InsightModel.deleteOne({
        organizationId,
        insightType
      });

      console.log(`✅ Deleted ${insightType} insights from database`);
    } catch (error) {
      console.error(`Error deleting ${insightType} insights:`, error);
      throw error;
    }
  }

  /**
   * Get insights history
   */
  static async getInsightsHistory(organizationId: string, surveyType: SurveyType): Promise<any[]> {
    try {
      const insightType = surveyType === 'nps' ? 'nps_analysis' : 'customer_satisfaction';
      
      const insights = await InsightModel.find({
        organizationId,
        insightType
      })
      .sort({ lastUpdatedAt: -1 })
      .limit(50)
      .lean();
      
      return insights.map(insight => ({
        id: insight._id,
        surveyId: insight.metadata?.surveyId,
        currentScore: surveyType === 'nps' 
          ? (insight.npsData as any)?.currentNPS 
          : (insight.csatData as any)?.currentCSAT,
        scoreChange: surveyType === 'nps' 
          ? (insight.npsData as any)?.npsChange 
          : (insight.csatData as any)?.csatChange,
        totalResponses: surveyType === 'nps' 
          ? (insight.npsData as any)?.totalResponses 
          : (insight.csatData as any)?.totalResponses,
        processedAt: surveyType === 'nps' 
          ? (insight.npsData as any)?.processedAt 
          : (insight.csatData as any)?.processedAt || insight.firstDetectedAt,
        createdAt: insight.firstDetectedAt
      }));
    } catch (error) {
      console.error(`Error getting ${surveyType.toUpperCase()} insights history:`, error);
      return [];
    }
  }

  /**
   * Get previous NPS score for comparison
   */
  private static async getPreviousNPS(organizationId: string): Promise<number> {
    try {
      const previousInsight = await InsightModel.findOne({
        organizationId,
        insightType: 'nps_analysis'
      }).sort({ lastUpdatedAt: -1 }).lean();

      if (previousInsight && previousInsight.npsData) {
        return (previousInsight.npsData as any).currentNPS || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting previous NPS:', error);
      return 0;
    }
  }

  /**
   * Get previous CSAT score for comparison
   */
  private static async getPreviousCSAT(organizationId: string): Promise<number> {
    try {
      const previousInsight = await InsightModel.findOne({
        organizationId,
        insightType: 'customer_satisfaction'
      }).sort({ lastUpdatedAt: -1 }).lean();

      if (previousInsight && previousInsight.csatData) {
        return (previousInsight.csatData as any).currentCSAT || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting previous CSAT:', error);
      return 0;
    }
  }

  /**
   * Calculate NPS segments
   */
  private static calculateNPSSegments(responses: SurveyResponse[]): { promoters: number; passives: number; detractors: number } {
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    responses.forEach(response => {
      const npsResponse = response.responses.find(r => r.questionId === 'nps' || r.questionId === 'recommendation');
      if (npsResponse && typeof npsResponse.value === 'number') {
        const score = npsResponse.value;
        if (score >= 9) promoters++;
        else if (score >= 7) passives++;
        else detractors++;
      }
    });

    return { promoters, passives, detractors };
  }

  /**
   * Calculate CSAT average scores by category
   */
  private static calculateCSATAverageScores(responses: SurveyResponse[]): {
    overall: number;
    product: number;
    support: number;
    onboarding: number;
    value: number;
    relationship: number;
  } {
    const categories = ['overall', 'product', 'support', 'onboarding', 'value', 'relationship'];
    const scores: Record<string, number[]> = {};
    
    categories.forEach(cat => scores[cat] = []);

    responses.forEach(response => {
      response.responses.forEach(resp => {
        if (typeof resp.value === 'number') {
          const category = resp.questionId.toLowerCase();
          if (scores[category]) {
            scores[category].push(resp.value);
          }
          scores.overall.push(resp.value);
        }
      });
    });

    const averages: Record<string, number> = {};
    categories.forEach(cat => {
      averages[cat] = scores[cat].length > 0 
        ? scores[cat].reduce((sum, score) => sum + score, 0) / scores[cat].length 
        : 0;
    });

    return averages as any;
  }

  /**
   * Calculate response rate
   */
  private static calculateResponseRate(responses: SurveyResponse[]): number {
    // This would typically be calculated based on total invitations sent
    // For now, we'll return a placeholder value
    return responses.length > 0 ? 100 : 0;
  }
}
