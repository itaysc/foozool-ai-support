import { InsightModel } from '../../schemas/insights.schema';
import { Types } from 'mongoose';
import { NPSInsights, ProcessedNPSData } from '../../types/nps';
import { 
  calculateNPS, 
  calculateSegmentBreakdown, 
  generateTrends, 
  generateInsightText, 
  generateRecommendations,
  getEmptyInsights 
} from './utils';
import { ResponseClusteringService } from './response-clustering';

export class InsightsManager {
  /**
   * Validate and transform NPS data from database to ensure it matches NPSInsights interface
   */
  private static validateNPSData(npsData: any): NPSInsights | null {
    console.log('🔍 Validating NPS data structure...');
    console.log('📊 NPS data received:', {
      hasData: !!npsData,
      dataType: typeof npsData,
      keys: npsData ? Object.keys(npsData) : 'No data'
    });
    
    // Check if all required properties exist
    const validations = {
      currentNPS: typeof npsData?.currentNPS === 'number',
      npsChange: typeof npsData?.npsChange === 'number',
      responseRate: typeof npsData?.responseRate === 'number',
      segmentBreakdown: !!npsData?.segmentBreakdown,
      trends: Array.isArray(npsData?.trends),
      insights: Array.isArray(npsData?.insights),
      recommendations: Array.isArray(npsData?.recommendations),
      totalResponses: typeof npsData?.totalResponses === 'number',
      processedAt: !!npsData?.processedAt
    };
    
    console.log('✅ Validation results:', validations);
    
    if (!validations.currentNPS ||
        !validations.npsChange ||
        !validations.responseRate ||
        !validations.segmentBreakdown ||
        !validations.trends ||
        !validations.insights ||
        !validations.recommendations ||
        !validations.totalResponses ||
        !validations.processedAt) {
      
      console.log('❌ Validation failed for fields:', Object.entries(validations)
        .filter(([_, valid]) => !valid)
        .map(([field, _]) => field)
      );
      return null;
    }

    // Return validated NPS insights
    return {
      currentNPS: npsData.currentNPS,
      npsChange: npsData.npsChange,
      responseRate: npsData.responseRate,
      segmentBreakdown: {
        promoters: npsData.segmentBreakdown.promoters || 0,
        passives: npsData.segmentBreakdown.passives || 0,
        detractors: npsData.segmentBreakdown.detractors || 0
      },
      trends: npsData.trends.map((trend: any) => ({
        date: new Date(trend.date),
        nps: trend.nps || 0,
        responses: trend.responses || 0
      })),
      insights: npsData.insights || [],
      recommendations: npsData.recommendations || [],
      totalResponses: npsData.totalResponses,
      processedAt: new Date(npsData.processedAt)
    };
  }

  /**
   * Generate insights from processed NPS data
   */
  static async generateInsights(responses: any[], organizationId: string, userId?: string): Promise<NPSInsights> {
    if (responses.length === 0) {
      return getEmptyInsights();
    }

    // Calculate current NPS
    const currentNPS = calculateNPS(responses);
    
    // Get previous NPS for comparison
    const previousNPS = await this.getPreviousNPS(organizationId);
    const npsChange = currentNPS - previousNPS;
    
    // Calculate segment breakdown
    const segmentBreakdown = calculateSegmentBreakdown(responses);
    
    // Generate trends
    const trends = generateTrends(responses);
    
    // Generate insights and recommendations
    const insights = generateInsightText(responses, currentNPS, npsChange);
    const recommendations = generateRecommendations(responses, currentNPS, npsChange);
    
    // Generate response clustering insights if userId is provided
    let responseClustering;
    if (userId) {
      try {
        console.log('🔍 Starting response clustering analysis...');
        const clusteringService = ResponseClusteringService.getInstance();
        const clusteringResult = await clusteringService.clusterAndAnalyzeResponses(responses, userId);
        
        if (clusteringResult.clusters.length > 0) {
          const clusteringStats = clusteringService.getClusteringStats(clusteringResult.clusters);
          
          responseClustering = {
            clusters: clusteringResult.clusters.map(cluster => ({
              id: cluster.id,
              questionId: cluster.questionId,
              questionText: cluster.questionText,
              count: cluster.count,
              representativeResponse: cluster.representativeResponse,
              priority: cluster.priority,
              insights: cluster.insights
            })),
            clusteringQuality: clusteringResult.clusteringQuality,
            totalClusters: clusteringStats.totalClusters,
            highPriorityClusters: clusteringStats.highPriorityClusters,
            mediumPriorityClusters: clusteringStats.mediumPriorityClusters,
            lowPriorityClusters: clusteringStats.lowPriorityClusters,
            totalClusteredResponses: clusteringStats.totalClusteredResponses,
            averageClusterSize: clusteringStats.averageClusterSize
          };
          
          console.log(`✅ Response clustering completed: ${clusteringResult.clusters.length} clusters found`);
        }
      } catch (error) {
        console.error('❌ Error in response clustering:', error);
        // Continue without clustering if it fails
      }
    }
    
    const result = {
      currentNPS,
      npsChange,
      responseRate: 1, // For uploaded data, response rate is 100%
      segmentBreakdown,
      trends,
      insights,
      recommendations,
      totalResponses: responses.length,
      processedAt: new Date(),
      responseClustering
    };
    
    // Debug: Log what we're returning
    console.log('🎯 Generated NPS insights:', {
      hasTotalResponses: typeof result.totalResponses === 'number',
      hasProcessedAt: !!result.processedAt,
      totalResponses: result.totalResponses,
      processedAt: result.processedAt,
      responseCount: responses.length
    });
    
    return result;
  }

  /**
   * Save insights to database
   */
  static async saveInsights(processedData: ProcessedNPSData, organizationId: string): Promise<void> {
    try {
      const { insights, surveyId } = processedData;
      
      // Debug: Log what we're about to save
      console.log('💾 About to save NPS insights:', {
        surveyId,
        insightsKeys: Object.keys(insights),
        hasTotalResponses: typeof insights.totalResponses === 'number',
        hasProcessedAt: !!insights.processedAt,
        totalResponses: insights.totalResponses,
        processedAt: insights.processedAt
      });
      
      // Check if we already have an NPS insight for this organization
      const existingInsight = await InsightModel.findOne({
        organizationId: new Types.ObjectId(organizationId),
        insightType: 'nps_analysis'
      });
      
      if (existingInsight) {
        // Update existing insight
        existingInsight.issueDescription = `NPS Analysis - ${surveyId}`;
        existingInsight.ticketVolume = insights.totalResponses;
        existingInsight.growthRate = insights.npsChange;
        existingInsight.lastUpdatedAt = new Date();
        existingInsight.npsData = insights;
        existingInsight.metadata = {
          ...existingInsight.metadata,
          lastSurveyId: surveyId,
          totalSurveys: (existingInsight.metadata?.totalSurveys || 0) + 1
        };
        
        // Debug: Log what we're actually saving
        console.log('💾 Saving existing insight with npsData:', {
          npsDataKeys: existingInsight.npsData ? Object.keys(existingInsight.npsData) : 'No npsData',
          hasTotalResponses: existingInsight.npsData ? typeof (existingInsight.npsData as any).totalResponses === 'number' : false,
          hasProcessedAt: existingInsight.npsData ? !!(existingInsight.npsData as any).processedAt : false,
          totalResponses: existingInsight.npsData ? (existingInsight.npsData as any).totalResponses : 'No npsData',
          processedAt: existingInsight.npsData ? (existingInsight.npsData as any).processedAt : 'No npsData'
        });
        
        // Debug: Log the exact object being saved
        console.log('💾 Final object being saved to database (update):', {
          npsData: existingInsight.npsData,
          npsDataKeys: existingInsight.npsData ? Object.keys(existingInsight.npsData) : 'No npsData',
          npsDataStringified: JSON.stringify(existingInsight.npsData, null, 2)
        });
        
        await existingInsight.save();
        console.log(`✅ Updated existing NPS insight for organization ${organizationId}`);
      } else {
        // Create new insight
        const newInsight = new InsightModel({
          clusterId: `nps_${organizationId}_${Date.now()}`,
          organizationId: new Types.ObjectId(organizationId),
          insightType: 'nps_analysis',
          issueDescription: `NPS Analysis - ${surveyId}`,
          ticketVolume: insights.totalResponses,
          growthRate: insights.npsChange,
          firstDetectedAt: new Date(),
          lastUpdatedAt: new Date(),
          npsData: insights,
          metadata: {
            firstSurveyId: surveyId,
            totalSurveys: 1
          }
        });
        
        // Debug: Log what we're actually saving
        console.log('💾 Saving new insight with npsData:', {
          npsDataKeys: newInsight.npsData ? Object.keys(newInsight.npsData) : 'No npsData',
          hasTotalResponses: newInsight.npsData ? typeof (newInsight.npsData as any).totalResponses === 'number' : false,
          hasProcessedAt: newInsight.npsData ? !!(newInsight.npsData as any).processedAt : false,
          totalResponses: newInsight.npsData ? (newInsight.npsData as any).totalResponses : 'No npsData',
          processedAt: newInsight.npsData ? (newInsight.npsData as any).processedAt : 'No npsData'
        });
        
        // Debug: Log the exact object being saved
        console.log('💾 Final object being saved to database:', {
          npsData: newInsight.npsData,
          npsDataKeys: newInsight.npsData ? Object.keys(newInsight.npsData) : 'No npsData',
          npsDataStringified: JSON.stringify(newInsight.npsData, null, 2)
        });
        
        await newInsight.save();
        console.log(`✅ Created new NPS insight for organization ${organizationId}`);
      }
    } catch (error: unknown) {
      console.error('Error saving insights to database:', error);
      throw error;
    }
  }



  /**
   * Get previous NPS score for comparison
   */
  static async getPreviousNPS(organizationId: string): Promise<number> {
    try {
      const previousInsight = await InsightModel.findOne({
        organizationId: new Types.ObjectId(organizationId),
        insightType: 'nps_analysis'
      }).sort({ lastUpdatedAt: -1 });
      
      return previousInsight?.npsData?.currentNPS || 0;
    } catch (error: unknown) {
      console.error('Error getting previous NPS:', error);
      return 0;
    }
  }

  /**
   * Get NPS insights for an organization
   */
  static async getNPSInsights(organizationId: string): Promise<NPSInsights | null> {
    try {
      console.log(`🔍 Searching for NPS insights for organization: ${organizationId}`);
      
      // First, let's see what insight types exist for this organization
      const allInsights = await InsightModel.find({
        organizationId: new Types.ObjectId(organizationId)
      }).select('insightType clusterId lastUpdatedAt');
      
      console.log(`📊 Found ${allInsights.length} total insights for organization:`, allInsights.map(i => ({
        type: i.insightType,
        clusterId: i.clusterId,
        lastUpdated: i.lastUpdatedAt
      })));
      
      const insight = await InsightModel.findOne({
        organizationId: new Types.ObjectId(organizationId),
        insightType: 'nps_analysis'
      }).sort({ lastUpdatedAt: -1 });
      
      console.log(`🎯 NPS analysis insight found:`, insight ? 'Yes' : 'No');
      if (insight) {
        console.log(`📋 Insight details:`, {
          clusterId: insight.clusterId,
          hasNpsData: !!insight.npsData,
          npsDataKeys: insight.npsData ? Object.keys(insight.npsData) : 'No npsData',
          lastUpdated: insight.lastUpdatedAt
        });
      }
      
      if (!insight?.npsData) {
        console.log(`❌ No NPS insight or npsData found for organization ${organizationId}`);
        return null;
      }

      // Validate and transform the npsData
      console.log(`🔍 Validating NPS data...`);
      const validatedData = this.validateNPSData(insight.npsData);
      
      if (!validatedData) {
        console.warn(`❌ Incomplete NPS data found for organization ${organizationId}, returning null`);
        return null;
      }

      console.log(`✅ NPS insights validated successfully for organization ${organizationId}`);
      return validatedData;
    } catch (error: unknown) {
      console.error('❌ Error getting NPS insights:', error);
      return null;
    }
  }

  /**
   * Get NPS insights history for an organization
   */
  static async getNPSInsightsHistory(
    organizationId: string, 
    options: { limit: number; offset: number } = { limit: 10, offset: 0 }
  ): Promise<any> {
    try {
      const { limit, offset } = options;
      
      const insights = await InsightModel.find({
        organizationId: new Types.ObjectId(organizationId),
        insightType: 'nps_analysis'
      })
        .sort({ lastUpdatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('npsData lastUpdatedAt metadata');

      const total = await InsightModel.countDocuments({
        organizationId: new Types.ObjectId(organizationId),
        insightType: 'nps_analysis'
      });

      // Validate and transform each insight's npsData
      const validatedInsights = insights.map(insight => {
        const validatedData = this.validateNPSData(insight.npsData);
        
        if (!validatedData) {
          console.warn(`Skipping incomplete NPS data in history for organization ${organizationId}`);
          return null;
        }

        // Return validated NPS insights
        return {
          npsData: validatedData,
          lastUpdatedAt: insight.lastUpdatedAt,
          metadata: insight.metadata
        };
      }).filter(Boolean); // Remove null entries

      return {
        insights: validatedInsights,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error: unknown) {
      console.error('Error getting NPS insights history:', error);
      throw error;
    }
  }
}
