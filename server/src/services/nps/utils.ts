import { NPSResponse, NPSSurvey, NPSInsights } from '../../types/nps';
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
 * Free memory after processing batch
 */
export function freeBatchMemory<T>(batch: T[]): void {
  // Clear array references to help garbage collection
  batch.length = 0;
}

/**
 * Calculate NPS score from responses
 */
export function calculateNPS(responses: NPSResponse[]): number {
  let promoters = 0;
  let detractors = 0;
  
  for (const response of responses) {
    const npsResponse = response.responses.find(r => 
      r.questionId === 'nps' || r.questionId === 'nps_score'
    );
    
    if (npsResponse && typeof npsResponse.value === 'number') {
      const score = npsResponse.value;
      if (score >= 9) {
        promoters++;
      } else if (score <= 6) {
        detractors++;
      }
    }
  }
  
  const total = responses.length;
  return total > 0 ? ((promoters - detractors) / total) * 100 : 0;
}

/**
 * Calculate segment breakdown
 */
export function calculateSegmentBreakdown(responses: NPSResponse[]): { 
  promoters: number; 
  passives: number; 
  detractors: number 
} {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  
  for (const response of responses) {
    const npsResponse = response.responses.find(r => 
      r.questionId === 'nps' || r.questionId === 'nps_score'
    );
    
    if (npsResponse && typeof npsResponse.value === 'number') {
      const score = npsResponse.value;
      if (score >= 9) {
        promoters++;
      } else if (score >= 7) {
        passives++;
      } else {
        detractors++;
      }
    }
  }
  
  return { promoters, passives, detractors };
}

/**
 * Generate trends from responses
 */
export function generateTrends(responses: NPSResponse[]): Array<{ 
  date: Date; 
  nps: number; 
  responses: number 
}> {
  // Group responses by date (day)
  const dailyGroups = new Map<string, NPSResponse[]>();
  
  for (const response of responses) {
    const date = new Date(response.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyGroups.has(dateKey)) {
      dailyGroups.set(dateKey, []);
    }
    dailyGroups.get(dateKey)!.push(response);
  }
  
  // Calculate NPS for each day
  const trends: Array<{ date: Date; nps: number; responses: number }> = [];
  
  for (const [dateKey, dayResponses] of dailyGroups) {
    const nps = calculateNPS(dayResponses);
    trends.push({
      date: new Date(dateKey),
      nps,
      responses: dayResponses.length
    });
  }
  
  // Sort by date
  return trends.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generate insight text
 */
export function generateInsightText(responses: NPSResponse[], currentNPS: number, npsChange: number): string[] {
  const insights: string[] = [];
  
  if (currentNPS >= 50) {
    insights.push('Excellent customer satisfaction with high promoter percentage');
  } else if (currentNPS >= 30) {
    insights.push('Good customer satisfaction with room for improvement');
  } else if (currentNPS >= 0) {
    insights.push('Moderate customer satisfaction, focus on reducing detractors');
  } else {
    insights.push('Customer satisfaction needs immediate attention');
  }
  
  if (npsChange > 10) {
    insights.push('Significant improvement in customer satisfaction');
  } else if (npsChange < -10) {
    insights.push('Decline in customer satisfaction requires investigation');
  }
  
  if (responses.length < 100) {
    insights.push('Consider collecting more responses for statistical significance');
  }
  
  return insights;
}

/**
 * Generate actionable recommendations
 */
export function generateRecommendations(responses: NPSResponse[], currentNPS: number, npsChange: number): string[] {
  const recommendations: string[] = [];
  
  if (currentNPS < 50) {
    recommendations.push('Focus on addressing common pain points identified in feedback');
    recommendations.push('Implement immediate improvements for detractor segment');
  }
  
  if (npsChange < 0) {
    recommendations.push('Investigate recent changes that may have impacted satisfaction');
    recommendations.push('Review customer support processes and response times');
  }
  
  if (responses.length > 0) {
    recommendations.push('Analyze qualitative feedback for specific improvement areas');
    recommendations.push('Set up regular NPS monitoring and trend analysis');
  }
  
  return recommendations;
}

/**
 * Get empty insights structure
 */
export function getEmptyInsights(): NPSInsights {
  return {
    currentNPS: 0,
    npsChange: 0,
    responseRate: 0,
    segmentBreakdown: { promoters: 0, passives: 0, detractors: 0 },
    trends: [],
    insights: ['No data available'],
    recommendations: ['Upload NPS data to generate insights'],
    totalResponses: 0,
    processedAt: new Date()
  };
}

/**
 * Validate response against survey questions
 */
export function validateResponse(response: NPSResponse, survey: NPSSurvey): NPSResponse | null {
  // TODO: Implement response validation
  // For now, return the response as-is
  return response;
}

/**
 * AI-powered data format detection and mapping
 * Uses LLM to automatically detect customer data format and map it to our standard
 */
export async function detectAndMapDataFormat(
  data: any, 
  dataType: 'csv' | 'json' | 'webhook',
  userId: string
): Promise<{ survey: NPSSurvey; responses: NPSResponse[] }> {
  try {
    let dataSample: string;
    
    // Prepare data sample for LLM analysis
    if (dataType === 'csv') {
      // For CSV, send first few rows as sample
      const csvContent = data.buffer.toString('utf-8');
      const lines = csvContent.split('\n').slice(0, 5); // First 5 lines including header
      dataSample = lines.join('\n');
    } else {
      // For JSON/webhook, stringify with sample data
      dataSample = JSON.stringify(data, null, 2);
    }
    
    const prompt = `Analyze this ${dataType.toUpperCase()} data and convert it to our NPS format.

DATA TO ANALYZE:
${dataSample}

REQUIRED OUTPUT FORMAT (respond with ONLY valid JSON):
{
  "mapping": {
    "survey": {
      "surveyId": "generated_id",
      "surveyName": "NPS Survey",
      "questions": [
        {
          "questionId": "nps_score",
          "questionText": "How likely are you to recommend our service?",
          "questionType": "nps",
          "required": true,
          "scale": 10
        }
      ]
    },
    "responses": [
      {
        "surveyId": "generated_id",
        "timestamp": "2024-01-01T09:15:00Z",
        "customerId": "customer_email_or_id",
        "responses": [
          {
            "questionId": "nps_score",
            "value": 9
          }
        ]
      }
    ]
  },
  "confidence": "high",
  "notes": "Mapping completed successfully"
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

    console.log('🤖 Sending prompt to LLM:', {
      promptLength: prompt.length,
      dataType,
      userId
    });
    
    const llmResponse = await callLLM({
      userId,
      prompt,
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistent mapping
      isChat: false
    });

    console.log('🤖 LLM Response received:', {
      data: llmResponse.data,
      dataLength: llmResponse.data?.length || 0,
      dataType: typeof llmResponse.data
    });

    if (!llmResponse.data) {
      throw new Error('LLM failed to provide mapping response');
    }

    if (llmResponse.data.trim() === '') {
      throw new Error('LLM returned empty response');
    }

    let mappingResult: any;
    try {
      // Try to parse the LLM response as JSON
      const cleanedResponse = llmResponse.data.trim();
      console.log('🧹 Attempting to parse cleaned response:', cleanedResponse);
      mappingResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('🔍 Raw LLM response:', JSON.stringify(llmResponse.data));
      throw new Error(`LLM response is not valid JSON: ${llmResponse.data}`);
    }

    // Check if LLM detected an error
    if (mappingResult.error) {
      throw new Error(`Data mapping failed: ${mappingResult.error}. ${mappingResult.suggestions || ''}`);
    }

    // Validate the mapped data structure
    if (!mappingResult.mapping || !mappingResult.mapping.survey || !mappingResult.mapping.responses) {
      throw new Error('LLM provided invalid mapping structure');
    }

    // Validate confidence level
    if (mappingResult.confidence === 'low') {
      console.warn(`⚠️ Low confidence mapping detected for ${dataType} data. Review the results carefully.`);
    }

    console.log(`🤖 AI mapping completed with ${mappingResult.confidence} confidence: ${mappingResult.notes || 'No notes provided'}`);

    return {
      survey: mappingResult.mapping.survey,
      responses: mappingResult.mapping.responses
    };

  } catch (error) {
    console.error('❌ AI mapping failed, attempting fallback mapping:', error);
    
    // Fallback: Try to detect common patterns and map them manually
    try {
      const fallbackResult = await fallbackDataMapping(data, dataType);
      if (fallbackResult) {
        console.log('✅ Fallback mapping successful');
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback mapping also failed:', fallbackError);
    }
    
    throw new Error(`AI-powered data mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fallback data mapping for common patterns when AI mapping fails
 */
async function fallbackDataMapping(
  data: any, 
  dataType: 'csv' | 'json' | 'webhook'
): Promise<{ survey: NPSSurvey; responses: NPSResponse[] } | null> {
  try {
    console.log('🔄 Attempting fallback mapping for data type:', dataType);
    
    if (dataType === 'json' && data.metadata && data.feedback_data) {
      console.log('📋 Detected alternative JSON format with feedback_data');
      
      // Create survey structure
      const survey: NPSSurvey = {
        surveyId: 'fallback_survey',
        surveyName: 'NPS Survey (Fallback Mapping)',
        questions: [
          {
            questionId: 'nps_rating',
            questionText: 'How likely are you to recommend our service?',
            questionType: 'nps',
            required: true,
            scale: 10
          },
          {
            questionId: 'improvement_suggestions',
            questionText: 'What can we improve?',
            questionType: 'open_text',
            required: false
          }
        ]
      };
      
      // Transform responses
      const responses: NPSResponse[] = data.feedback_data.map((item: any, index: number) => ({
        surveyId: 'fallback_survey',
        timestamp: item.submission_time || new Date().toISOString(),
        customerId: item.customer_email || `customer_${index}`,
        responses: [
          {
            questionId: 'nps_rating',
            value: item.responses?.nps_rating || 0
          },
          {
            questionId: 'improvement_suggestions',
            value: item.responses?.improvement_suggestions || ''
          }
        ]
      }));
      
      console.log(`✅ Fallback mapping created ${responses.length} responses`);
      return { survey, responses };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Fallback mapping failed:', error);
    return null;
  }
}

/**
 * Enhanced CSV parser that uses AI for format detection
 */
export async function parseCSVFile(file: Express.Multer.File, userId: string): Promise<{ 
  survey: NPSSurvey; 
  responses: NPSResponse[] 
}> {
  try {
    // First, try AI-powered mapping
    const aiResult = await detectAndMapDataFormat(file, 'csv', userId);
    
    // If AI mapping succeeds, return the result
    if (aiResult.survey && aiResult.responses.length > 0) {
      return aiResult;
    }
    
    // Fallback to traditional parsing if AI fails
    console.log('🔄 AI mapping failed, falling back to traditional CSV parsing');
    return parseCSVFileTraditional(file);
    
  } catch (error) {
    console.error('❌ AI mapping failed:', error);
    
    // If AI fails completely, try traditional parsing
    try {
      console.log('🔄 Attempting traditional CSV parsing as fallback');
      return parseCSVFileTraditional(file);
    } catch (fallbackError) {
      throw new Error(`Both AI and traditional CSV parsing failed. AI error: ${error instanceof Error ? error.message : 'Unknown'}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown'}`);
    }
  }
}

/**
 * Traditional CSV parser (fallback method)
 */
function parseCSVFileTraditional(file: Express.Multer.File): { 
  survey: NPSSurvey; 
  responses: NPSResponse[] 
} {
  try {
    const csvContent = file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);
    
    // Basic column detection
    const timestampIndex = headers.findIndex(h => 
      h.includes('timestamp') || h.includes('date') || h.includes('created') || h.includes('submitted')
    );
    
    const valueIndex = headers.findIndex(h => 
      h.includes('nps') || h.includes('score') || h.includes('rating') || h.includes('value')
    );
    
    if (timestampIndex === -1 || valueIndex === -1) {
      throw new Error('CSV must contain timestamp and NPS score columns');
    }
    
    // Create basic survey structure
    const survey: NPSSurvey = {
      surveyId: 'csv_import',
      surveyName: 'CSV NPS Import',
      questions: [{
        questionId: 'nps_score',
        questionText: 'How likely are you to recommend our service?',
        questionType: 'nps',
        required: true,
        scale: 10
      }]
    };
    
    // Parse responses
    const responses: NPSResponse[] = [];
    for (const row of dataRows) {
      if (!row.trim()) continue;
      
      const values = row.split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const timestamp = new Date(values[timestampIndex]);
      const value = parseInt(values[valueIndex]);
      
      if (!isNaN(timestamp.getTime()) && !isNaN(value)) {
        responses.push({
          surveyId: 'csv_import',
          timestamp,
          customerId: `csv_customer_${Date.now()}_${Math.random()}`,
          responses: [{
            questionId: 'nps_score',
            value
          }]
        });
      }
    }
    
    return { survey, responses };
    
  } catch (error) {
    throw new Error(`Traditional CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced webhook transformer that uses AI for format detection
 */
export async function transformWebhookData(
  npsData: any, 
  userId: string
): Promise<{ survey: NPSSurvey; responses: NPSResponse[] }> {
  try {
    // Use AI-powered mapping for webhook data
    return await detectAndMapDataFormat(npsData, 'webhook', userId);
  } catch (error) {
    console.error('❌ AI webhook mapping failed:', error);
    
    // Fallback to basic transformation
    const survey: NPSSurvey = {
      surveyId: 'webhook_import',
      surveyName: 'Webhook NPS Import',
      questions: [{
        questionId: 'nps_score',
        questionText: 'How likely are you to recommend our service?',
        questionType: 'nps',
        required: true,
        scale: 10
      }]
    };
    
    const responses: NPSResponse[] = [];
    
    // Try to extract basic response data
    if (npsData && typeof npsData === 'object') {
      const timestamp = npsData.timestamp || npsData.date || npsData.created_at || new Date();
      const value = npsData.value || npsData.score || npsData.rating || npsData.nps;
      const customerId = npsData.customerId || npsData.userId || npsData.email || `webhook_user_${Date.now()}`;
      
      if (value !== undefined) {
        responses.push({
          surveyId: 'webhook_import',
          timestamp: new Date(timestamp),
          customerId,
          responses: [{
            questionId: 'nps_score',
            value
          }]
        });
      }
    }
    
    return { survey, responses };
  }
}
