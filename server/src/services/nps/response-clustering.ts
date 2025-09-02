import { NPSResponse } from '../../types/nps';
import { callLLM } from '../llm';
import { getSBERTEmbedding } from '../call-python';
import { cosineSimilarity } from '../tickets/utils';
import sanitizeJSON from 'src/utils/sanitizeJson';

export interface ResponseCluster {
  id: string;
  questionId: string;
  questionText: string;
  responses: string[];
  count: number;
  representativeResponse: string;
  embedding: number[];
  insights: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ClusteringResult {
  clusters: ResponseCluster[];
  totalClusters: number;
  totalResponses: number;
  clusteringQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Cluster NPS responses using SBERT embeddings and analyze each cluster
 */
export class ResponseClusteringService {
  private static instance: ResponseClusteringService;
  private readonly MIN_CLUSTER_SIZE = 2; // Minimum responses to form a cluster
  private readonly SIMILARITY_THRESHOLD = 0.7; // Cosine similarity threshold for clustering
  private readonly MAX_CLUSTERS_PER_QUESTION = 10; // Maximum clusters per question

  static getInstance(): ResponseClusteringService {
    if (!ResponseClusteringService.instance) {
      ResponseClusteringService.instance = new ResponseClusteringService();
    }
    return ResponseClusteringService.instance;
  }

  /**
   * Main method to cluster responses and generate insights
   */
  async clusterAndAnalyzeResponses(
    responses: NPSResponse[],
    userId: string
  ): Promise<ClusteringResult> {
    try {
      console.log(`🔍 Starting response clustering for ${responses.length} responses`);
      
      // Extract open-ended responses
      const openResponses = this.extractOpenResponses(responses);
      
      if (openResponses.length === 0) {
        console.log('📝 No open-ended responses found for clustering');
        return {
          clusters: [],
          totalClusters: 0,
          totalResponses: 0,
          clusteringQuality: 'excellent'
        };
      }

      // Generate SBERT embeddings
      const embeddings = await this.generateEmbeddings(openResponses);
      
      // Cluster responses
      const clusters = await this.clusterResponses(openResponses, embeddings);
      
      // Analyze each cluster with LLM
      const analyzedClusters = await this.analyzeClusters(clusters, userId);
      
      // Calculate clustering quality
      const clusteringQuality = this.calculateClusteringQuality(clusters, responses.length);
      
      console.log(`✅ Clustering completed: ${clusters.length} clusters found`);
      
      return {
        clusters: analyzedClusters,
        totalClusters: clusters.length,
        totalResponses: responses.length,
        clusteringQuality
      };
      
    } catch (error) {
      console.error('❌ Error in response clustering:', error);
      throw new Error(`Response clustering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract open-ended responses from NPS data
   */
  private extractOpenResponses(responses: NPSResponse[]): Array<{
    responseId: string;
    questionId: string;
    questionText: string;
    response: string;
    timestamp: Date;
    customerId: string;
  }> {
    const openResponses: Array<{
      responseId: string;
      questionId: string;
      questionText: string;
      response: string;
      timestamp: Date;
      customerId: string;
    }> = [];

    for (const response of responses) {
      for (const answer of response.responses) {
        // Look for open-ended responses (text-based, not NPS scores)
        if (typeof answer.value === 'string' && answer.value.trim().length > 10) {
          openResponses.push({
            responseId: response.surveyId || 'unknown',
            questionId: answer.questionId,
            questionText: this.getQuestionText(answer.questionId, response),
            response: answer.value.trim(),
            timestamp: new Date(response.timestamp),
            customerId: response.customerId || 'unknown'
          });
        }
      }
    }

    return openResponses;
  }

  /**
   * Get question text from the response context
   */
  private getQuestionText(questionId: string, response: NPSResponse): string {
    // For now, return a generic text. In a full implementation,
    // you'd want to get this from the survey questions
    return `Question about ${questionId}`;
  }

  /**
   * Generate SBERT embeddings for open responses
   */
  private async generateEmbeddings(openResponses: Array<{ response: string }>): Promise<number[][]> {
    try {
      console.log(`🤖 Generating SBERT embeddings for ${openResponses.length} responses`);
      
      // Prepare data for SBERT service
      const texts = openResponses.map(r => ({ 
        subject: '', 
        description: r.response 
      }));
      
      const embeddings = await getSBERTEmbedding(texts);
      
      console.log(`✅ Generated ${embeddings.length} embeddings`);
      return embeddings;
      
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cluster responses using cosine similarity
   */
  private async clusterResponses(
    openResponses: Array<{ responseId: string; questionId: string; questionText: string; response: string; timestamp: Date; customerId: string }>,
    embeddings: number[][]
  ): Promise<ResponseCluster[]> {
    const clusters: ResponseCluster[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < openResponses.length; i++) {
      if (processed.has(i)) continue;

      const currentResponse = openResponses[i];
      const currentEmbedding = embeddings[i];
      
      // Find similar responses
      const similarIndices: number[] = [i];
      const similarResponses: string[] = [currentResponse.response];
      
      for (let j = i + 1; j < openResponses.length; j++) {
        if (processed.has(j)) continue;
        
        const similarity = cosineSimilarity(currentEmbedding, embeddings[j]);
        
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          similarIndices.push(j);
          similarResponses.push(openResponses[j].response);
          processed.add(j);
        }
      }

      // Only create cluster if we have enough similar responses
      if (similarResponses.length >= this.MIN_CLUSTER_SIZE) {
        const cluster: ResponseCluster = {
          id: `cluster_${clusters.length + 1}`,
          questionId: currentResponse.questionId,
          questionText: currentResponse.questionText,
          responses: similarResponses,
          count: similarResponses.length,
          representativeResponse: this.selectRepresentativeResponse(similarResponses),
          embedding: currentEmbedding,
          insights: [],
          priority: this.calculatePriority(similarResponses.length)
        };
        
        clusters.push(cluster);
        processed.add(i);
        
        // Limit clusters per question to avoid overwhelming
        const questionClusters = clusters.filter(c => c.questionId === currentResponse.questionId);
        if (questionClusters.length >= this.MAX_CLUSTERS_PER_QUESTION) {
          break;
        }
      }
    }

    return clusters;
  }



  /**
   * Select a representative response from the cluster
   */
  private selectRepresentativeResponse(responses: string[]): string {
    // Select the response with median length as representative
    const sortedByLength = [...responses].sort((a, b) => a.length - b.length);
    const medianIndex = Math.floor(sortedByLength.length / 2);
    return sortedByLength[medianIndex];
  }

  /**
   * Calculate cluster priority based on size
   */
  private calculatePriority(count: number): 'high' | 'medium' | 'low' {
    if (count >= 10) return 'high';
    if (count >= 5) return 'medium';
    return 'low';
  }

  /**
   * Analyze each cluster using LLM to generate insights
   */
  private async analyzeClusters(clusters: ResponseCluster[], userId: string): Promise<ResponseCluster[]> {
    const analyzedClusters: ResponseCluster[] = [];

    for (const cluster of clusters) {
      try {
        console.log(`🧠 Analyzing cluster ${cluster.id} with ${cluster.count} responses`);
        
        const insights = await this.analyzeClusterWithLLM(cluster, userId);
        analyzedClusters.push({
          ...cluster,
          insights
        });
        
      } catch (error) {
        console.error(`❌ Error analyzing cluster ${cluster.id}:`, error);
        // Continue with other clusters even if one fails
        analyzedClusters.push({
          ...cluster,
          insights: ['Analysis failed - manual review recommended']
        });
      }
    }

    return analyzedClusters;
  }

  /**
   * Analyze a single cluster with LLM
   */
  private async analyzeClusterWithLLM(cluster: ResponseCluster, userId: string): Promise<string[]> {
    const prompt = `You are an expert customer insights analyst. Analyze the following cluster of customer feedback responses.

CLUSTER INFORMATION:
- Question: ${cluster.questionText}
- Number of customers: ${cluster.count}
- Priority: ${cluster.priority.toUpperCase()}

REPRESENTATIVE RESPONSES (${cluster.responses.length} total):
${cluster.responses.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

ANALYSIS TASK:
1. Identify the main theme or issue being discussed
2. Determine if this is positive feedback, negative feedback, or a suggestion
3. Extract actionable insights for the business
4. Suggest specific improvements or actions
5. Assess the business impact (high/medium/low)

RESPOND WITH ONLY A JSON object in this format:
{
  "main_theme": "Brief description of the main topic",
  "sentiment": "positive|negative|neutral|mixed",
  "business_impact": "high|medium|low",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "actionable_recommendations": ["recommendation 1", "recommendation 2"],
  "customer_count_context": "Brief explanation of why ${cluster.count} customers mentioned this"
}`;

    try {
      const llmResponse = await callLLM({
        userId,
        prompt,
        maxTokens: 1000,
        temperature: 0.3,
        isChat: false
      });

      if (!llmResponse.data) {
        throw new Error('LLM failed to provide analysis');
      }

      const analysis = JSON.parse(sanitizeJSON(llmResponse.data));
      
      // Convert analysis to insights array
      const insights: string[] = [
        `Theme: ${analysis.main_theme}`,
        `Sentiment: ${analysis.sentiment}`,
        `Business Impact: ${analysis.business_impact}`,
        `Customer Count: ${cluster.count} customers`,
        ...analysis.key_insights.map((insight: string) => `💡 ${insight}`),
        ...analysis.actionable_recommendations.map((rec: string) => `🎯 ${rec}`),
        analysis.customer_count_context
      ];

      return insights;

    } catch (error) {
      console.error('❌ Error in LLM analysis:', error);
      return [
        `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        `Manual review recommended for ${cluster.count} similar responses`
      ];
    }
  }

  /**
   * Calculate clustering quality metrics
   */
  private calculateClusteringQuality(clusters: ResponseCluster[], totalResponses: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (clusters.length === 0) return 'excellent';
    
    const totalClusteredResponses = clusters.reduce((sum, cluster) => sum + cluster.count, 0);
    const clusteringRatio = totalClusteredResponses / totalResponses;
    
    if (clusteringRatio >= 0.8) return 'excellent';
    if (clusteringRatio >= 0.6) return 'good';
    if (clusteringRatio >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Get clustering statistics for insights
   */
  getClusteringStats(clusters: ResponseCluster[]): {
    totalClusters: number;
    highPriorityClusters: number;
    mediumPriorityClusters: number;
    lowPriorityClusters: number;
    totalClusteredResponses: number;
    averageClusterSize: number;
  } {
    const highPriority = clusters.filter(c => c.priority === 'high').length;
    const mediumPriority = clusters.filter(c => c.priority === 'medium').length;
    const lowPriority = clusters.filter(c => c.priority === 'low').length;
    const totalClusteredResponses = clusters.reduce((sum, cluster) => sum + cluster.count, 0);
    const averageClusterSize = clusters.length > 0 ? totalClusteredResponses / clusters.length : 0;

    return {
      totalClusters: clusters.length,
      highPriorityClusters: highPriority,
      mediumPriorityClusters: mediumPriority,
      lowPriorityClusters: lowPriority,
      totalClusteredResponses,
      averageClusterSize: Math.round(averageClusterSize * 100) / 100
    };
  }
}
