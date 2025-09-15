import { SurveyResponse, SurveyType, NPSInsights, CSATInsights } from '../../types/surveys';
import { callLLM } from '../llm';

/**
 * Create batches for memory-efficient processing
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Calculate NPS score from responses
 */
export function calculateNPS(responses: SurveyResponse[]): number {
  let promoters = 0;
  let detractors = 0;
  let totalResponses = 0;

  responses.forEach(response => {
    const npsResponse = response.responses.find(r => 
      r.questionId === 'nps' || 
      r.questionId === 'recommendation' ||
      r.questionId.toLowerCase().includes('recommend')
    );
    
    if (npsResponse && typeof npsResponse.value === 'number') {
      const score = npsResponse.value;
      totalResponses++;
      
      if (score >= 9) {
        promoters++;
      } else if (score <= 6) {
        detractors++;
      }
    }
  });

  if (totalResponses === 0) return 0;
  
  const promoterPercentage = (promoters / totalResponses) * 100;
  const detractorPercentage = (detractors / totalResponses) * 100;
  
  return Math.round((promoterPercentage - detractorPercentage) * 10) / 10;
}

/**
 * Calculate CSAT score from responses
 */
export function calculateCSAT(responses: SurveyResponse[]): number {
  let totalScore = 0;
  let totalResponses = 0;

  responses.forEach(response => {
    response.responses.forEach(resp => {
      if (typeof resp.value === 'number') {
        totalScore += resp.value;
        totalResponses++;
      }
    });
  });

  if (totalResponses === 0) return 0;
  
  return Math.round((totalScore / totalResponses) * 10) / 10;
}

/**
 * Calculate score distribution for CSAT
 */
export function calculateScoreDistribution(responses: SurveyResponse[]): {
  excellent: number;
  good: number;
  average: number;
  poor: number;
  terrible: number;
} {
  const distribution = {
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
    terrible: 0
  };

  responses.forEach(response => {
    response.responses.forEach(resp => {
      if (typeof resp.value === 'number') {
        const score = resp.value;
        if (score >= 5) distribution.excellent++;
        else if (score >= 4) distribution.good++;
        else if (score >= 3) distribution.average++;
        else if (score >= 2) distribution.poor++;
        else distribution.terrible++;
      }
    });
  });

  return distribution;
}

/**
 * Generate trends from responses
 */
export function generateTrends(responses: SurveyResponse[], surveyType: SurveyType): Array<{
  date: Date;
  nps?: number;
  csat?: number;
  responses: number;
}> {
  // Group responses by date
  const dailyGroups = new Map<string, SurveyResponse[]>();
  
  responses.forEach(response => {
    const date = new Date(response.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyGroups.has(dateKey)) {
      dailyGroups.set(dateKey, []);
    }
    dailyGroups.get(dateKey)!.push(response);
  });
  
  // Calculate trends for each day
  const trends: Array<{
    date: Date;
    nps?: number;
    csat?: number;
    responses: number;
  }> = [];
  
  for (const dateKey of dailyGroups.keys()) {
    const dayResponses = dailyGroups.get(dateKey)!;
    const responsesCount = dayResponses.length;
    
    const trend: any = {
      date: new Date(dateKey),
      responses: responsesCount
    };

    if (surveyType === 'nps') {
      trend.nps = calculateNPS(dayResponses);
    } else if (surveyType === 'csat') {
      trend.csat = calculateCSAT(dayResponses);
    }

    trends.push(trend);
  }
  
  return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Parse CSV data
 */
export async function parseCSVData(file: Express.Multer.File, userId: string): Promise<SurveyResponse[]> {
  try {
    const csv = require('csv-parser');
    const fs = require('fs');
    const results: any[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => {
          // Transform CSV data to survey responses
          const responses = results.map((row, index) => ({
            surveyId: row.surveyId || `survey_${Date.now()}`,
            timestamp: row.timestamp || new Date().toISOString(),
            customerId: row.customerId,
            responses: Object.entries(row)
              .filter(([key, value]) => key !== 'surveyId' && key !== 'timestamp' && key !== 'customerId')
              .map(([questionId, value]) => ({
                questionId,
                value: typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value
              })),
            metadata: { source: 'csv', rowIndex: index }
          }));
          
          resolve(responses as SurveyResponse[]);
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    throw error;
  }
}

/**
 * Parse JSON data
 */
export async function parseJSONData(file: Express.Multer.File, userId: string): Promise<SurveyResponse[]> {
  try {
    const fs = require('fs');
    const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    
    if (Array.isArray(jsonData)) {
      return jsonData;
    } else if (jsonData.responses && Array.isArray(jsonData.responses)) {
      return jsonData.responses;
    } else {
      throw new Error('Invalid JSON format. Expected array of responses or object with responses array.');
    }
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    throw error;
  }
}

/**
 * Transform webhook data
 */
export async function transformWebhookData(webhookData: any, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
  try {
    // This would be customized based on the webhook provider
    // For now, return a basic transformation
    return [{
      surveyId: webhookData.surveyId || `webhook_${Date.now()}`,
      surveyType,
      timestamp: webhookData.timestamp || new Date().toISOString(),
      customerId: webhookData.customerId,
      responses: webhookData.responses || [],
      metadata: { source: 'webhook', ...webhookData.metadata }
    }];
  } catch (error) {
    console.error('Error transforming webhook data:', error);
    throw error;
  }
}

/**
 * Map generic data with AI
 */
export async function mapGenericDataWithAI(genericData: any, userId: string, surveyType: SurveyType): Promise<SurveyResponse[]> {
  try {
    const prompt = `
    Map this generic survey data to ${surveyType.toUpperCase()} format:
    
    Data: ${JSON.stringify(genericData, null, 2)}
    
    Return a JSON object with this structure:
    {
      "survey": {
        "surveyId": "string",
        "surveyName": "string",
        "surveyType": "${surveyType}",
        "questions": [
          {
            "questionId": "string",
            "questionText": "string",
            "questionType": "${surveyType}",
            "required": boolean,
            "scale": number
          }
        ]
      },
      "responses": [
        {
          "surveyId": "string",
          "surveyType": "${surveyType}",
          "timestamp": "ISO string",
          "customerId": "string",
          "responses": [
            {
              "questionId": "string",
              "value": number
            }
          ]
        }
      ]
    }
    
    Map rating questions to ${surveyType.toUpperCase()} scale (0-10 for NPS, 1-5 for CSAT).
    Identify satisfaction-related questions.
    `;
    
    const result = await callLLM({
      userId: userId,
      prompt: prompt,
      maxTokens: 2000,
      temperature: 0.3
    });
    
    try {
      const parsed = JSON.parse(result.data || '{}');
      return parsed.responses || [];
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI mapping response');
    }
  } catch (error) {
    console.error('Error in AI mapping:', error);
    throw error;
  }
}

/**
 * Generate NPS insights using AI
 */
export async function generateNPSInsights(responses: SurveyResponse[], userId: string): Promise<{
  insights: string[];
  recommendations: string[];
}> {
  try {
    const nps = calculateNPS(responses);
    const distribution = calculateScoreDistribution(responses);
    const trends = generateTrends(responses, 'nps');
    
    const prompt = `
    Analyze this NPS data and provide insights and recommendations:
    
    Current NPS: ${nps}
    Total Responses: ${responses.length}
    Score Distribution: ${JSON.stringify(distribution)}
    Trends: ${JSON.stringify(trends.slice(-7))} // Last 7 days
    
    Provide:
    1. Key insights about customer satisfaction trends
    2. Specific recommendations for improvement
    3. Focus areas based on the data
    
    Format as JSON:
    {
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
    }
    `;
    
    const result = await callLLM({
      userId: userId,
      prompt: prompt,
      maxTokens: 2000,
      temperature: 0.3
    });
    
    try {
      const parsed = JSON.parse(result.data || '{}');
      return {
        insights: parsed.insights || ['No insights available'],
        recommendations: parsed.recommendations || ['No recommendations available']
      };
    } catch (parseError) {
      console.error('Error parsing NPS insights:', parseError);
      return {
        insights: ['Error generating insights'],
        recommendations: ['Error generating recommendations']
      };
    }
  } catch (error) {
    console.error('Error generating NPS insights:', error);
    return {
      insights: ['Error generating insights'],
      recommendations: ['Error generating recommendations']
    };
  }
}

/**
 * Generate CSAT insights using AI
 */
export async function generateCSATInsights(responses: SurveyResponse[], userId: string): Promise<{
  insights: string[];
  recommendations: string[];
}> {
  try {
    const csat = calculateCSAT(responses);
    const distribution = calculateScoreDistribution(responses);
    const trends = generateTrends(responses, 'csat');
    
    const prompt = `
    Analyze this CSAT data and provide insights and recommendations:
    
    Current CSAT: ${csat}
    Total Responses: ${responses.length}
    Score Distribution: ${JSON.stringify(distribution)}
    Trends: ${JSON.stringify(trends.slice(-7))} // Last 7 days
    
    Provide:
    1. Key insights about customer satisfaction trends
    2. Specific recommendations for improvement
    3. Focus areas based on the data
    4. Category-specific insights (product, support, onboarding, etc.)
    
    Format as JSON:
    {
      "insights": ["insight1", "insight2", "insight3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
    }
    `;
    
    const result = await callLLM({
      userId: userId,
      prompt: prompt,
      maxTokens: 2000,
      temperature: 0.3
    });
    
    try {
      const parsed = JSON.parse(result.data || '{}');
      return {
        insights: parsed.insights || ['No insights available'],
        recommendations: parsed.recommendations || ['No recommendations available']
      };
    } catch (parseError) {
      console.error('Error parsing CSAT insights:', parseError);
      return {
        insights: ['Error generating insights'],
        recommendations: ['Error generating recommendations']
      };
    }
  } catch (error) {
    console.error('Error generating CSAT insights:', error);
    return {
      insights: ['Error generating insights'],
      recommendations: ['Error generating recommendations']
    };
  }
}

/**
 * Get empty NPS insights structure
 */
export function getEmptyNPSInsights(): NPSInsights {
  return {
    currentNPS: 0,
    npsChange: 0,
    responseRate: 0,
    segmentBreakdown: {
      promoters: 0,
      passives: 0,
      detractors: 0
    },
    trends: [],
    insights: ['No NPS data available'],
    recommendations: ['Upload NPS data to generate insights'],
    totalResponses: 0,
    processedAt: new Date()
  };
}

/**
 * Get empty CSAT insights structure
 */
export function getEmptyCSATInsights(): CSATInsights {
  return {
    currentCSAT: 0,
    csatChange: 0,
    responseRate: 0,
    totalResponses: 0,
    averageScores: {
      overall: 0,
      product: 0,
      support: 0,
      onboarding: 0,
      value: 0,
      relationship: 0
    },
    scoreDistribution: {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
      terrible: 0
    },
    trends: [],
    insights: ['No CSAT data available'],
    recommendations: ['Upload CSAT data to generate insights'],
    processedAt: new Date()
  };
}
