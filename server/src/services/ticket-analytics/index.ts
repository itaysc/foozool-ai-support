import { ITicketAnalytics } from '@common/types';
import { TicketAnalyticsModel } from '../../schemas/ticket-analytics.schema';
import { classifyIntent } from '../call-python';

export interface TicketContentInput {
  ticketId: string;
  subject: string;
  description: string;
  organization?: string;
  productId?: string;
  attachments?: any[];
  channelSource?: string;
  createdAt?: Date;
}

export class TicketAnalyticsService {
  
  /**
   * Process a new ticket and extract analytics metadata
   */
  async processTicketForAnalytics(ticketData: TicketContentInput): Promise<ITicketAnalytics> {
    // Extract analytics data from ticket content
    const analytics = await this.extractAnalyticsData(ticketData);
    
    // Save to analytics collection
    const ticketAnalytics = new TicketAnalyticsModel({
      externalTicketId: ticketData.ticketId,
      organization: ticketData.organization,
      productId: ticketData.productId,
      channelSource: ticketData.channelSource || 'web',
      hasAttachments: !!(ticketData.attachments?.length),
      createdAt: ticketData.createdAt || new Date(),
      ...analytics
    });
    
    await ticketAnalytics.save();
    return ticketAnalytics;
  }
  
  /**
   * Extract analytics metadata from ticket content
   */
  private async extractAnalyticsData(ticketData: TicketContentInput) {
    const text = `${ticketData.subject} ${ticketData.description}`.toLowerCase();
    
    // Classify intent using existing ML service
    const intents = await this.classifyTicketIntent(ticketData);
    
    // Basic analytics (existing)
    const sentiment = this.analyzeSentiment(text);
    const keywords = this.extractKeywords(text);
    const topics = this.extractTopics(text);
    const category = this.categorizeTicket(text, intents);
    const severity = this.analyzeSeverity(text);
    const urgency = this.analyzeUrgency(text);
    const insightFlags = this.extractInsightFlags(text);
    
    // === ADVANCED ANALYTICS ===
    
    // Customer Behavior Insights
    const customerBehavior = await this.analyzeCustomerBehavior(text, ticketData);
    
    // Operational Intelligence
    const operationalInsights = this.analyzeOperationalMetrics(text, intents, severity, urgency);
    
    // Business Intelligence
    const businessInsights = this.analyzeBusinessIntelligence(text, keywords, topics);
    
    // Predictive Analysis
    const predictiveFlags = this.analyzePredictiveFactors(text, sentiment, severity, intents);
    
    // Quality Assurance Analysis
    const qualityInsights = this.analyzeQualityFactors(text, topics, intents);
    
    // Communication Analysis
    const communicationAnalysis = this.analyzeCommunicationStyle(text);
    
    // Pattern Recognition
    const patternAnalysis = this.analyzePatterns(text, ticketData);
    
    // Advanced Metrics
    const advancedMetrics = this.calculateAdvancedMetrics(text, sentiment, intents);
    
    return {
      // Basic analytics
      sentiment,
      intents,
      keywords,
      topics,
      category,
      severity,
      urgency,
      language: this.detectLanguage(text),
      ...insightFlags,
      
      // Advanced analytics
      ...customerBehavior,
      ...operationalInsights,
      ...businessInsights,
      ...predictiveFlags,
      ...qualityInsights,
      ...communicationAnalysis,
      ...patternAnalysis,
      ...advancedMetrics,
      
      // Metadata
      analyticsVersion: '2.0'
    };
  }
  
  /**
   * Classify ticket intent using ML service
   */
  private async classifyTicketIntent(ticketData: TicketContentInput): Promise<string[]> {
    try {
      const intentResult = await classifyIntent({
        subject: ticketData.subject,
        description: ticketData.description
      });
      
      // Extract intent labels (handle different response formats)
      if (Array.isArray(intentResult)) {
        return intentResult.map((intent: any) => intent.label || intent.toString());
      } else if (intentResult && typeof intentResult === 'object' && 'intents' in intentResult) {
        const intents = (intentResult as any).intents;
        if (Array.isArray(intents)) {
          return intents.map((intent: any) => intent.label || intent.toString());
        }
      }
      
      return ['general_inquiry'];
    } catch (error) {
      console.error('Error classifying intent:', error);
      return ['general_inquiry'];
    }
  }
  
  /**
   * Analyze sentiment from text
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Negative indicators
    const negativeWords = [
      'terrible', 'awful', 'horrible', 'hate', 'worst', 'disgusting',
      'frustrated', 'angry', 'disappointed', 'annoyed', 'upset',
      'broken', 'doesn\'t work', 'not working', 'failed', 'error',
      'slow', 'bad', 'poor', 'useless', 'waste'
    ];
    
    // Positive indicators
    const positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'perfect', 'awesome', 'brilliant', 'outstanding',
      'helpful', 'quick', 'fast', 'easy', 'smooth', 'good'
    ];
    
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    
    if (negativeCount > positiveCount && negativeCount > 0) return 'negative';
    if (positiveCount > negativeCount && positiveCount > 0) return 'positive';
    return 'neutral';
  }
  
  /**
   * Extract relevant keywords (anonymized)
   */
  private extractKeywords(text: string): string[] {
    // Remove sensitive data patterns first
    const cleanText = this.anonymizeText(text);
    
    // Common technical/product keywords
    const keywords: string[] = [];
    const wordMatches = cleanText.match(/\b\w{3,}\b/g) || [];
    
    // Filter for relevant non-sensitive keywords
    const relevantWords = wordMatches.filter(word => {
      return !this.isSensitiveWord(word) && this.isRelevantKeyword(word);
    });
    
    // Get most frequent keywords
    const wordCounts = relevantWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Remove/anonymize sensitive information
   */
  private anonymizeText(text: string): string {
    return text
      // Remove email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      // Remove phone numbers
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
      // Remove credit card numbers
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
      // Remove names (simple heuristic - capitalized words)
      .replace(/\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g, '[NAME]');
  }
  
  /**
   * Check if word contains sensitive information
   */
  private isSensitiveWord(word: string): boolean {
    const sensitivePatterns = [
      /\d{4,}/, // Numbers with 4+ digits
      /[A-Z]{2,}[a-z]+[A-Z]/, // CamelCase (might be names)
      /^[A-Z][a-z]+$/ // Capitalized words (might be names)
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(word));
  }
  
  /**
   * Check if keyword is relevant for analysis
   */
  private isRelevantKeyword(word: string): boolean {
    const relevantCategories = [
      // Technical terms
      'login', 'password', 'account', 'payment', 'billing', 'subscription',
      'feature', 'function', 'button', 'page', 'screen', 'app', 'website',
      'error', 'bug', 'issue', 'problem', 'loading', 'slow', 'fast',
      
      // Product terms
      'product', 'service', 'order', 'delivery', 'shipping', 'return',
      'refund', 'cancel', 'upgrade', 'downgrade',
      
      // Quality indicators
      'quality', 'broken', 'working', 'fixed', 'update', 'improve'
    ];
    
    return word.length >= 3 && (
      relevantCategories.includes(word.toLowerCase()) ||
      /^(un|re|pre|post|sub|over|under)/.test(word) // Prefixes
    );
  }
  
  /**
   * Extract topics/themes from text
   */
  private extractTopics(text: string): string[] {
    const topicMappings = {
      'authentication': ['login', 'password', 'signin', 'logout', 'access'],
      'billing': ['payment', 'billing', 'invoice', 'charge', 'subscription', 'refund'],
      'technical_issue': ['error', 'bug', 'broken', 'not working', 'crash', 'freeze'],
      'performance': ['slow', 'loading', 'timeout', 'speed', 'performance'],
      'feature_request': ['feature', 'add', 'include', 'would like', 'suggestion'],
      'user_interface': ['button', 'page', 'screen', 'navigation', 'menu', 'interface'],
      'account_management': ['account', 'profile', 'settings', 'preferences'],
      'product_quality': ['quality', 'defective', 'damaged', 'poor', 'excellent']
    };
    
    const topics: string[] = [];
    for (const [topic, keywords] of Object.entries(topicMappings)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  /**
   * Categorize ticket based on content
   */
  private categorizeTicket(text: string, intents: string[]): string {
    // Use intents first
    if (intents.includes('complaint')) return 'complaint';
    if (intents.includes('question')) return 'question';
    if (intents.includes('request')) return 'request';
    
    // Fallback to text analysis
    if (text.includes('refund') || text.includes('billing')) return 'billing';
    if (text.includes('bug') || text.includes('error')) return 'technical_issue';
    if (text.includes('how to') || text.includes('help')) return 'question';
    
    return 'general';
  }
  
  /**
   * Analyze severity based on content
   */
  private analyzeSeverity(text: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalWords = ['critical', 'urgent', 'emergency', 'down', 'outage'];
    const highWords = ['important', 'asap', 'immediately', 'broken', 'not working'];
    const lowWords = ['minor', 'small', 'cosmetic', 'suggestion'];
    
    if (criticalWords.some(word => text.includes(word))) return 'critical';
    if (highWords.some(word => text.includes(word))) return 'high';
    if (lowWords.some(word => text.includes(word))) return 'low';
    
    return 'medium';
  }
  
  /**
   * Analyze urgency based on content
   */
  private analyzeUrgency(text: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const lowUrgencyWords = ['whenever', 'no rush', 'future', 'eventually'];
    
    if (urgentWords.some(word => text.includes(word))) return 'high';
    if (lowUrgencyWords.some(word => text.includes(word))) return 'low';
    
    return 'medium';
  }
  
  /**
   * Extract insight-specific flags
   */
  private extractInsightFlags(text: string) {
    return {
      isComplaint: /\b(complaint|complain|unhappy|disappointed|terrible|awful)\b/.test(text),
      isFeatureRequest: /\b(feature|add|include|would like|wish|hope|suggest)\b/.test(text),
      hasQualityIssue: /\b(quality|defective|broken|damaged|poor|faulty)\b/.test(text),
      hasInformationGap: /\b(how to|where is|can't find|help|instructions|guide)\b/.test(text)
    };
  }
  
  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    // Very basic language detection - could be enhanced
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'por'];
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en'];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const frenchCount = words.filter(word => frenchWords.includes(word)).length;
    
    if (spanishCount > 2) return 'es';
    if (frenchCount > 2) return 'fr';
    return 'en';
  }
  
  /**
   * Get analytics for insights processing
   */
  async getAnalyticsForInsights(filters: {
    organization?: string;
    productId?: string;
    daysBack?: number;
    limit?: number;
  } = {}): Promise<ITicketAnalytics[]> {
    const query: any = {};
    
    if (filters.organization) {
      query.organization = filters.organization;
    }
    
    if (filters.productId) {
      query.productId = filters.productId;
    }
    
    if (filters.daysBack) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - filters.daysBack);
      query.createdAt = { $gte: dateLimit };
    }
    
    return await TicketAnalyticsModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 1000)
      .lean();
  }

  // ========== ADVANCED ANALYTICS METHODS ==========

  /**
   * Analyze customer behavior patterns
   */
  private async analyzeCustomerBehavior(text: string, ticketData: TicketContentInput) {
    // Check if this is a repeat customer by looking at organization history
    const isRepeatCustomer = await this.checkRepeatCustomer(ticketData.organization, ticketData.ticketId);
    
    // Determine customer journey stage
    const customerJourneyStage = this.determineJourneyStage(text, isRepeatCustomer);
    
    // Calculate escalation risk
    const escalationRisk = this.calculateEscalationRisk(text);
    
    // Predict satisfaction
    const satisfactionPrediction = this.predictSatisfaction(text);
    
    // Determine customer segment
    const customerSegment = this.determineCustomerSegment(ticketData.organization);
    
    return {
      customerJourneyStage,
      escalationRisk,
      satisfactionPrediction,
      isRepeatCustomer,
      customerSegment
    };
  }

  /**
   * Analyze operational metrics
   */
  private analyzeOperationalMetrics(text: string, intents: string[], severity: string, urgency: string) {
    const complexityScore = this.calculateComplexityScore(text, intents);
    const resolutionPrediction = this.predictResolutionTime(text, severity, urgency);
    const workloadImpact = this.assessWorkloadImpact(complexityScore, severity);
    
    return {
      complexityScore,
      resolutionPrediction,
      workloadImpact,
      agentMatchScore: {} // Will be populated by agent matching algorithm
    };
  }

  /**
   * Analyze business intelligence factors
   */
  private analyzeBusinessIntelligence(text: string, keywords: string[], topics: string[]) {
    const revenueImpact = this.assessRevenueImpact(text, topics);
    const featuresAffected = this.extractAffectedFeatures(text, keywords);
    const competitorAnalysis = this.analyzeCompetitorMentions(text);
    const priceRelated = this.checkPriceRelated(text, topics);
    const integrationRelated = this.checkIntegrationRelated(text, topics);
    
    return {
      revenueImpact,
      featuresAffected,
      competitorMentioned: competitorAnalysis.mentioned,
      competitorNames: competitorAnalysis.names,
      priceRelated,
      integrationRelated
    };
  }

  /**
   * Analyze predictive factors
   */
  private analyzePredictiveFactors(text: string, sentiment: string, severity: string, intents: string[]) {
    const likelyToEscalate = this.predictEscalation(text, sentiment, severity);
    const churnRisk = this.assessChurnRisk(text, sentiment, intents);
    const upsellOpportunity = this.identifyUpsellOpportunity(text, intents);
    const requiresSpecialist = this.checkSpecialistRequired(text, intents);
    
    return {
      likelyToEscalate,
      churnRisk,
      upsellOpportunity,
      requiresSpecialist
    };
  }

  /**
   * Analyze quality assurance factors
   */
  private analyzeQualityFactors(text: string, topics: string[], intents: string[]) {
    const documentationGap = this.identifyDocumentationGap(text, topics);
    const knowledgeBaseGap = this.identifyKnowledgeBaseGap(text, intents);
    const trainingOpportunity = this.identifyTrainingOpportunity(text, topics);
    const processImprovement = this.identifyProcessImprovement(text, intents);
    
    return {
      documentationGap,
      knowledgeBaseGap,
      trainingOpportunity,
      processImprovement
    };
  }

  /**
   * Analyze communication style and preferences
   */
  private analyzeCommunicationStyle(text: string) {
    const communicationStyle = this.determineCommunicationStyle(text);
    const responseExpectation = this.determineResponseExpectation(text);
    const preferredTone = this.determinePreferredTone(text);
    
    return {
      communicationStyle,
      responseExpectation,
      preferredTone
    };
  }

  /**
   * Analyze patterns for grouping and trend identification
   */
  private analyzePatterns(text: string, ticketData: TicketContentInput) {
    const similarTicketPattern = this.identifySimilarPattern(text);
    const seasonalPattern = this.identifySeasonalPattern(ticketData.createdAt);
    const behavioralPattern = this.identifyBehavioralPattern(text);
    
    return {
      similarTicketPattern,
      seasonalPattern,
      behavioralPattern
    };
  }

  /**
   * Calculate advanced metrics
   */
  private calculateAdvancedMetrics(text: string, sentiment: string, intents: string[]) {
    const emotionalIntensity = this.calculateEmotionalIntensity(text, sentiment);
    const technicalComplexity = this.calculateTechnicalComplexity(text);
    const businessCriticality = this.calculateBusinessCriticality(text, intents);
    const resolutionConfidence = this.calculateResolutionConfidence(text, intents);
    
    return {
      emotionalIntensity,
      technicalComplexity,
      businessCriticality,
      resolutionConfidence
    };
  }

  // ========== HELPER METHODS ==========

  private async checkRepeatCustomer(organization?: string, currentTicketId?: string): Promise<boolean> {
    if (!organization) return false;
    
    const existingTickets = await TicketAnalyticsModel.countDocuments({
      organization,
      externalTicketId: { $ne: currentTicketId }
    });
    
    return existingTickets > 0;
  }

  private determineJourneyStage(text: string, isRepeatCustomer: boolean): string {
    if (!isRepeatCustomer) {
      if (/\b(new|first time|getting started|setup|onboard)\b/.test(text)) {
        return 'onboarding';
      }
    }
    
    if (/\b(cancel|refund|unsubscribe|leave|switch|competitor)\b/.test(text)) {
      return 'churning';
    }
    
    if (/\b(frustrated|disappointed|considering|alternatives)\b/.test(text)) {
      return 'at_risk';
    }
    
    return isRepeatCustomer ? 'active' : 'unknown';
  }

  private calculateEscalationRisk(text: string): number {
    let risk = 0.3; // Base risk
    
    // Negative sentiment increases risk
    if (/\b(terrible|awful|horrible|disgusted|furious|livid)\b/.test(text)) risk += 0.3;
    if (/\b(frustrated|disappointed|annoyed|upset)\b/.test(text)) risk += 0.2;
    
    // Urgency indicators
    if (/\b(urgent|asap|immediately|emergency|critical)\b/.test(text)) risk += 0.2;
    
    // Management escalation keywords
    if (/\b(manager|supervisor|escalate|higher|authority)\b/.test(text)) risk += 0.4;
    
    // Legal/complaint keywords
    if (/\b(lawyer|legal|complaint|report|review)\b/.test(text)) risk += 0.3;
    
    return Math.min(1.0, risk);
  }

  private predictSatisfaction(text: string): number {
    let score = 5; // Neutral baseline
    
    // Positive indicators
    if (/\b(great|excellent|amazing|wonderful|love|perfect)\b/.test(text)) score += 2;
    if (/\b(good|helpful|quick|easy|satisfied)\b/.test(text)) score += 1;
    
    // Negative indicators
    if (/\b(terrible|awful|horrible|hate|worst)\b/.test(text)) score -= 3;
    if (/\b(bad|poor|slow|difficult|frustrated)\b/.test(text)) score -= 2;
    if (/\b(disappointed|confused|annoyed)\b/.test(text)) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  private determineCustomerSegment(organization?: string): string | undefined {
    // This would typically integrate with CRM data
    // For now, use simple heuristics based on organization info
    if (!organization) return undefined;
    
    // Enterprise indicators (would be better with actual data)
    if (organization.includes('corp') || organization.includes('enterprise')) {
      return 'enterprise';
    }
    
    // Trial indicators
    if (organization.includes('trial') || organization.includes('demo')) {
      return 'trial';
    }
    
    return 'smb'; // Default assumption
  }

  private calculateComplexityScore(text: string, intents: string[]): number {
    let complexity = 3; // Base complexity
    
    // Technical complexity indicators
    const technicalTerms = (text.match(/\b(api|integration|webhook|database|server|authentication|ssl|json|xml|oauth)\b/g) || []).length;
    complexity += Math.min(3, technicalTerms * 0.5);
    
    // Multiple intents indicate complexity
    complexity += Math.min(2, intents.length * 0.5);
    
    // Long text indicates complexity
    if (text.length > 500) complexity += 1;
    if (text.length > 1000) complexity += 1;
    
    // Error codes or technical issues
    if (/\b(error|exception|stack trace|logs|debug)\b/.test(text)) complexity += 2;
    
    return Math.min(10, Math.max(1, Math.round(complexity)));
  }

  private predictResolutionTime(text: string, severity: string, urgency: string): number {
    let baseTime = 60; // 1 hour baseline
    
    // Adjust by severity
    switch (severity) {
      case 'critical': baseTime = 30; break;
      case 'high': baseTime = 45; break;
      case 'medium': baseTime = 60; break;
      case 'low': baseTime = 120; break;
    }
    
    // Adjust by urgency
    switch (urgency) {
      case 'high': baseTime *= 0.5; break;
      case 'medium': baseTime *= 1; break;
      case 'low': baseTime *= 2; break;
    }
    
    // Complexity adjustments
    if (/\b(integration|api|custom|complex)\b/.test(text)) baseTime *= 2;
    if (/\b(simple|quick|basic)\b/.test(text)) baseTime *= 0.7;
    
    return Math.round(baseTime);
  }

  private assessWorkloadImpact(complexityScore: number, severity: string): string {
    if (complexityScore >= 8 || severity === 'critical') return 'high';
    if (complexityScore >= 6 || severity === 'high') return 'medium';
    return 'low';
  }

  private assessRevenueImpact(text: string, topics: string[]): string {
    // High impact indicators
    if (/\b(billing|payment|charge|subscription|revenue|money|refund)\b/.test(text)) {
      return 'high';
    }
    
    if (topics.includes('billing') || topics.includes('account_management')) {
      return 'medium';
    }
    
    // Critical business functionality
    if (/\b(production|live|customer facing|downtime|outage)\b/.test(text)) {
      return 'critical';
    }
    
    return 'low';
  }

  private extractAffectedFeatures(text: string, keywords: string[]): string[] {
    const features: string[] = [];
    
    // Common feature patterns
    const featurePatterns = [
      'login', 'signup', 'dashboard', 'reporting', 'analytics', 'export',
      'integration', 'api', 'webhook', 'notification', 'email', 'sms',
      'billing', 'payment', 'subscription', 'account', 'profile', 'settings'
    ];
    
    featurePatterns.forEach(feature => {
      if (text.includes(feature) || keywords.includes(feature)) {
        features.push(feature);
      }
    });
    
    return features;
  }

  private analyzeCompetitorMentions(text: string): { mentioned: boolean; names: string[] } {
    const competitorKeywords = [
      'competitor', 'alternative', 'switch to', 'instead of', 'compared to',
      'other solution', 'different platform', 'moving to'
    ];
    
    const mentioned = competitorKeywords.some(keyword => text.includes(keyword));
    
    // Extract specific competitor names (anonymized)
    const names: string[] = [];
    if (mentioned) {
      // This would typically use a database of known competitors
      // For now, just flag that competitors were mentioned
      names.push('competitor_mentioned');
    }
    
    return { mentioned, names };
  }

  private checkPriceRelated(text: string, topics: string[]): boolean {
    return /\b(price|pricing|cost|expensive|cheap|budget|money|fee|charge)\b/.test(text) ||
           topics.includes('billing');
  }

  private checkIntegrationRelated(text: string, topics: string[]): boolean {
    return /\b(integration|integrate|api|webhook|connect|sync|import|export)\b/.test(text);
  }

  private predictEscalation(text: string, sentiment: string, severity: string): boolean {
    let escalationScore = 0;
    
    if (sentiment === 'negative') escalationScore += 2;
    if (severity === 'critical' || severity === 'high') escalationScore += 2;
    if (/\b(manager|escalate|supervisor)\b/.test(text)) escalationScore += 3;
    if (/\b(unacceptable|ridiculous|terrible)\b/.test(text)) escalationScore += 2;
    
    return escalationScore >= 4;
  }

  private assessChurnRisk(text: string, sentiment: string, intents: string[]): boolean {
    if (sentiment === 'negative' && 
        (/\b(cancel|unsubscribe|refund|leave|switch)\b/.test(text) ||
         intents.includes('complaint'))) {
      return true;
    }
    
    return /\b(considering alternatives|looking elsewhere|not worth it)\b/.test(text);
  }

  private identifyUpsellOpportunity(text: string, intents: string[]): boolean {
    return /\b(upgrade|more features|enterprise|premium|additional)\b/.test(text) ||
           intents.includes('request');
  }

  private checkSpecialistRequired(text: string, intents: string[]): boolean {
    return /\b(technical|complex|integration|custom|advanced|enterprise)\b/.test(text);
  }

  private identifyDocumentationGap(text: string, topics: string[]): boolean {
    return /\b(how to|where is|documentation|docs|guide|tutorial|instructions)\b/.test(text);
  }

  private identifyKnowledgeBaseGap(text: string, intents: string[]): boolean {
    return intents.includes('question') && 
           /\b(how|what|where|when|why|can I|is it possible)\b/.test(text);
  }

  private identifyTrainingOpportunity(text: string, topics: string[]): boolean {
    return topics.includes('user_interface') && 
           /\b(confused|don't understand|unclear|difficult)\b/.test(text);
  }

  private identifyProcessImprovement(text: string, intents: string[]): boolean {
    return /\b(slow|inefficient|cumbersome|too many steps|complicated process)\b/.test(text);
  }

  private determineCommunicationStyle(text: string): string {
    if (/\b(please|thank you|kindly|appreciate|grateful)\b/.test(text)) return 'formal';
    if (/\b(hey|hi|thanks|cool|awesome)\b/.test(text)) return 'casual';
    if (/\b(api|technical|integration|code|debug)\b/.test(text)) return 'technical';
    if (/\b(frustrated|angry|upset|disappointed)\b/.test(text)) return 'emotional';
    
    return 'casual';
  }

  private determineResponseExpectation(text: string): string {
    if (/\b(urgent|asap|immediately|emergency|critical|now)\b/.test(text)) return 'immediate';
    if (/\b(today|soon|quick|fast)\b/.test(text)) return 'same_day';
    return 'flexible';
  }

  private determinePreferredTone(text: string): string {
    if (/\b(sorry|apologize|disappointed|upset)\b/.test(text)) return 'apologetic';
    if (/\b(technical|api|integration|code)\b/.test(text)) return 'technical';
    if (/\b(worried|concerned|anxious)\b/.test(text)) return 'reassuring';
    return 'helpful';
  }

  private identifySimilarPattern(text: string): string | undefined {
    // Create a pattern ID based on key terms
    const keyTerms = text.match(/\b(login|payment|integration|bug|feature|account)\b/g) || [];
    if (keyTerms.length > 0) {
      return keyTerms.sort().join('_');
    }
    return undefined;
  }

  private identifySeasonalPattern(createdAt?: Date): string | undefined {
    if (!createdAt) return undefined;
    
    const date = new Date(createdAt);
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    
    // Holiday seasons
    if (month === 11 || month === 0) return 'holiday_season';
    
    // End/beginning of month patterns
    if (dayOfMonth <= 3 || dayOfMonth >= 28) return 'month_end';
    
    // Quarter end
    if ((month === 2 || month === 5 || month === 8 || month === 11) && dayOfMonth >= 25) {
      return 'quarter_end';
    }
    
    return undefined;
  }

  private identifyBehavioralPattern(text: string): string | undefined {
    if (/\b(always|constantly|repeatedly|every time)\b/.test(text)) return 'frequent_user';
    if (/\b(new|first time|getting started|beginner)\b/.test(text)) return 'new_user';
    if (/\b(advanced|complex|technical|api|integration)\b/.test(text)) return 'power_user';
    if (/\b(confused|don't understand|help|lost)\b/.test(text)) return 'confused_user';
    
    return undefined;
  }

  private calculateEmotionalIntensity(text: string, sentiment: string): number {
    let intensity = 5; // Neutral baseline
    
    if (sentiment === 'positive') {
      if (/\b(amazing|incredible|fantastic|outstanding)\b/.test(text)) intensity = 9;
      else if (/\b(great|excellent|wonderful|love)\b/.test(text)) intensity = 7;
      else intensity = 6;
    } else if (sentiment === 'negative') {
      if (/\b(terrible|awful|horrible|hate|disgusting)\b/.test(text)) intensity = 9;
      else if (/\b(bad|poor|frustrated|disappointed)\b/.test(text)) intensity = 7;
      else intensity = 6;
    }
    
    // Exclamation marks and caps increase intensity
    const exclamations = (text.match(/!/g) || []).length;
    const capsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    
    intensity += Math.min(2, exclamations * 0.5 + capsWords * 0.3);
    
    return Math.min(10, Math.max(1, Math.round(intensity)));
  }

  private calculateTechnicalComplexity(text: string): number {
    const technicalTerms = [
      'api', 'integration', 'webhook', 'database', 'server', 'authentication',
      'ssl', 'json', 'xml', 'oauth', 'sdk', 'framework', 'library', 'code',
      'debug', 'logs', 'error', 'exception', 'stack trace'
    ];
    
    const foundTerms = technicalTerms.filter(term => text.includes(term)).length;
    const complexity = Math.min(10, 3 + foundTerms * 0.7);
    
    return Math.round(complexity);
  }

  private calculateBusinessCriticality(text: string, intents: string[]): number {
    let criticality = 3; // Baseline
    
    // Business impact keywords
    if (/\b(production|live|customer|revenue|billing|payment)\b/.test(text)) criticality += 3;
    if (/\b(downtime|outage|broken|critical|urgent)\b/.test(text)) criticality += 2;
    if (/\b(enterprise|business|commercial)\b/.test(text)) criticality += 1;
    
    // Intent-based criticality
    if (intents.includes('complaint')) criticality += 2;
    
    return Math.min(10, Math.max(1, criticality));
  }

  private calculateResolutionConfidence(text: string, intents: string[]): number {
    let confidence = 0.7; // Baseline confidence
    
    // Clear problem description increases confidence
    if (/\b(error|bug|not working|problem with)\b/.test(text)) confidence += 0.1;
    
    // Vague descriptions decrease confidence
    if (/\b(something|somehow|sometimes|might be|maybe)\b/.test(text)) confidence -= 0.2;
    
    // Simple requests have higher confidence
    if (intents.includes('question') && text.length < 200) confidence += 0.1;
    
    // Complex technical issues have lower confidence
    if (text.includes('integration') || text.includes('api')) confidence -= 0.1;
    
    return Math.min(1.0, Math.max(0.1, confidence));
  }
}

export const ticketAnalyticsService = new TicketAnalyticsService(); 