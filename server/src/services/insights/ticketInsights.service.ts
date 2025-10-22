import { UserContextManager } from 'src/context/userContext';
import { getCustomerTicketStats, searchTicketsByCustomer } from '../../qdrant/service';

// Threshold constants for ticket insights
const THRESHOLDS = {
  // Ticket volume thresholds
  HIGH_TICKET_VOLUME_WARNING: 20,
  HIGH_TICKET_VOLUME_CRITICAL: 50,
  
  // Recent ticket escalation thresholds
  RECENT_TICKETS_WARNING: 5,
  RECENT_TICKETS_CRITICAL: 10,
  
  // Sentiment thresholds (0-1 scale)
  SENTIMENT_DECLINE_WARNING: 0.3,
  SENTIMENT_DECLINE_CRITICAL: 0.1,
  SENTIMENT_POSITIVE_THRESHOLD: 0.7,
  
  // Recurring issues thresholds
  RECURRING_ISSUE_WARNING: 3,
  RECURRING_ISSUE_CRITICAL: 5,
  
  // Support pattern thresholds
  SUPPORT_PATTERN_FREQUENCY: 4,
  
  // Resolution time thresholds (in hours)
  RESOLUTION_DELAY_WARNING: 24,
  RESOLUTION_DELAY_CRITICAL: 72,
  
  // Urgent ticket thresholds (percentage)
  URGENT_TICKETS_WARNING: 20,
  URGENT_TICKETS_CRITICAL: 40,
  
  // Mobile usage thresholds (percentage)
  MOBILE_USAGE_THRESHOLD: 60,
  
  // Integration issues thresholds (percentage)
  INTEGRATION_ISSUES_WARNING: 30,
  
  // Performance issues thresholds (percentage)
  PERFORMANCE_ISSUES_WARNING: 25
} as const;

export interface TicketInsight {
  type: 'high_ticket_volume' | 'escalating_issues' | 'sentiment_decline' | 'recurring_problems' | 
        'resolution_delays' | 'support_patterns' | 'urgent_trends' | 'positive_feedback' | 
        'technical_debt' | 'user_experience_issues' | 'integration_problems' | 'performance_concerns';
  message: string;
  severity: 'red' | 'yellow' | 'info';
  category: 'risk' | 'upsell' | 'customer_success' | 'strategic';
  meta?: Record<string, any>;
}

export async function generateTicketInsights(customerId: string): Promise<TicketInsight[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  console.log(`[Ticket Insights] ▶️ start | org=${organizationId} customer=${customerId}`);
  const insights: TicketInsight[] = [];
  
  if (!organizationId) {
    console.log(`[Ticket Insights] ⚠️ no organization context`);
    return insights;
  }

  try {
    // Get ticket statistics for the customer
    const ticketStats = await getCustomerTicketStats(customerId);
    console.log(`[Ticket Insights] 📊 stats | total=${ticketStats.totalTickets} avgSentiment=${ticketStats.avgSentiment.toFixed(2)}`);
    
    if (ticketStats.totalTickets === 0) {
      console.log(`[Ticket Insights] ℹ️ no tickets found for customer`);
      return insights;
    }

    // Get recent tickets for detailed analysis
    const recentTickets = await searchTicketsByCustomer(customerId, 100);
    
    // Analyze ticket volume patterns
    await analyzeTicketVolume(insights, ticketStats, recentTickets);
    
    // Analyze sentiment trends
    await analyzeSentimentTrends(insights, ticketStats, recentTickets);
    
    // Analyze recurring issues
    await analyzeRecurringIssues(insights, recentTickets);
    
    // Analyze resolution patterns
    await analyzeResolutionPatterns(insights, recentTickets);
    
    // Analyze support patterns
    await analyzeSupportPatterns(insights, recentTickets);
    
    console.log(`[Ticket Insights] ✅ generated ${insights.length} insights`);
    return insights;
    
  } catch (error) {
    console.error(`[Ticket Insights] ❌ error:`, error);
    return insights;
  }
}

async function analyzeTicketVolume(insights: TicketInsight[], stats: any, recentTickets: any[]): Promise<void> {
  const totalTickets = stats.totalTickets;
  
  // High ticket volume alert
  if (totalTickets > THRESHOLDS.HIGH_TICKET_VOLUME_WARNING) {
    insights.push({
      type: 'high_ticket_volume',
      message: `High ticket volume detected: ${totalTickets} tickets in the system. This may indicate underlying issues that need attention.`,
      severity: totalTickets > THRESHOLDS.HIGH_TICKET_VOLUME_CRITICAL ? 'red' : 'yellow',
      category: 'risk',
      meta: {
        totalTickets,
        recommendation: 'Schedule a health check call to identify root causes'
      }
    });
  }
  
  // Recent ticket spike
  const last7Days = recentTickets.filter(t => 
    t.payload.created_at > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  
  if (last7Days > THRESHOLDS.RECENT_TICKETS_WARNING) {
    insights.push({
      type: 'escalating_issues',
      message: `${last7Days} tickets created in the last 7 days. This escalation pattern requires immediate attention.`,
      severity: last7Days > THRESHOLDS.RECENT_TICKETS_CRITICAL ? 'red' : 'yellow',
      category: 'risk',
      meta: {
        recentTickets: last7Days,
        recommendation: 'Investigate recent changes or incidents that may have caused this spike'
      }
    });
  }
}

async function analyzeSentimentTrends(insights: TicketInsight[], stats: any, recentTickets: any[]): Promise<void> {
  const avgSentiment = stats.avgSentiment;
  const sentimentBreakdown = stats.sentimentBreakdown;
  
  // Sentiment decline alert
  if (avgSentiment < THRESHOLDS.SENTIMENT_DECLINE_WARNING) {
    insights.push({
      type: 'sentiment_decline',
      message: `Customer sentiment is concerning (${(avgSentiment * 100).toFixed(1)}% positive). This indicates potential satisfaction issues.`,
      severity: avgSentiment < THRESHOLDS.SENTIMENT_DECLINE_CRITICAL ? 'red' : 'yellow',
      category: 'customer_success',
      meta: {
        avgSentiment: avgSentiment.toFixed(3),
        sentimentBreakdown,
        recommendation: 'Schedule a satisfaction call and review recent interactions'
      }
    });
  }
  
  // Positive feedback recognition
  const positiveTickets = sentimentBreakdown.positive || 0;
  const totalWithSentiment = Object.values(sentimentBreakdown).reduce((sum: number, count: any) => sum + count, 0);
  
  if (positiveTickets > 0 && (positiveTickets / totalWithSentiment) > THRESHOLDS.SENTIMENT_POSITIVE_THRESHOLD) {
    insights.push({
      type: 'positive_feedback',
      message: `Strong positive sentiment detected (${((positiveTickets / totalWithSentiment) * 100).toFixed(1)}% positive tickets). Customer appears satisfied.`,
      severity: 'info',
      category: 'customer_success',
      meta: {
        positivePercentage: ((positiveTickets / totalWithSentiment) * 100).toFixed(1),
        recommendation: 'Consider this customer for case studies or testimonials'
      }
    });
  }
}

async function analyzeRecurringIssues(insights: TicketInsight[], recentTickets: any[]): Promise<void> {
  // Analyze tags to find recurring issues
  const tagFrequency: { [key: string]: number } = {};
  const intentFrequency: { [key: string]: number } = {};
  
  recentTickets.forEach(ticket => {
    if (ticket.payload.tags) {
      ticket.payload.tags.forEach((tag: string) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    }
    if (ticket.payload.intent) {
      intentFrequency[ticket.payload.intent] = (intentFrequency[ticket.payload.intent] || 0) + 1;
    }
  });
  
  // Find most frequent tags (recurring issues)
  const sortedTags = Object.entries(tagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  sortedTags.forEach(([tag, count]) => {
    if (count >= THRESHOLDS.RECURRING_ISSUE_WARNING) {
      insights.push({
        type: 'recurring_problems',
        message: `Recurring issue detected: "${tag}" appears in ${count} tickets. This suggests a systematic problem.`,
        severity: count >= THRESHOLDS.RECURRING_ISSUE_CRITICAL ? 'red' : 'yellow',
        category: 'risk',
        meta: {
          issue: tag,
          frequency: count,
          recommendation: 'Investigate root cause and implement permanent solution'
        }
      });
    }
  });
  
  // Find most frequent intents
  const sortedIntents = Object.entries(intentFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2);
  
  sortedIntents.forEach(([intent, count]) => {
    if (count >= THRESHOLDS.SUPPORT_PATTERN_FREQUENCY) {
      insights.push({
        type: 'support_patterns',
        message: `Support pattern identified: ${count} tickets related to "${intent}". Consider proactive support in this area.`,
        severity: 'info',
        category: 'customer_success',
        meta: {
          pattern: intent,
          frequency: count,
          recommendation: 'Develop self-service resources or training for this topic'
        }
      });
    }
  });
}

async function analyzeResolutionPatterns(insights: TicketInsight[], recentTickets: any[]): Promise<void> {
  // Analyze resolution times
  const ticketsWithResolution = recentTickets.filter(t => t.payload.resolution_time_ms);
  
  if (ticketsWithResolution.length > 0) {
    const avgResolutionTime = ticketsWithResolution.reduce((sum, t) => sum + t.payload.resolution_time_ms, 0) / ticketsWithResolution.length;
    const avgResolutionHours = avgResolutionTime / (1000 * 60 * 60);
    
    // Long resolution times
    if (avgResolutionHours > THRESHOLDS.RESOLUTION_DELAY_WARNING) {
      insights.push({
        type: 'resolution_delays',
        message: `Average resolution time is ${avgResolutionHours.toFixed(1)} hours. This may indicate process inefficiencies.`,
        severity: avgResolutionHours > THRESHOLDS.RESOLUTION_DELAY_CRITICAL ? 'red' : 'yellow',
        category: 'customer_success',
        meta: {
          avgResolutionHours: avgResolutionHours.toFixed(1),
          ticketsAnalyzed: ticketsWithResolution.length,
          recommendation: 'Review support processes and consider escalation procedures'
        }
      });
    }
    
    // Predicted long resolutions
    const longResolutionPredicted = recentTickets.filter(t => t.payload.long_resolution_predicted).length;
    if (longResolutionPredicted > 0) {
      insights.push({
        type: 'technical_debt',
        message: `${longResolutionPredicted} tickets are predicted to have long resolution times. These may be complex technical issues.`,
        severity: 'yellow',
        category: 'strategic',
        meta: {
          predictedLongResolutions: longResolutionPredicted,
          recommendation: 'Allocate senior resources and consider architectural improvements'
        }
      });
    }
  }
}

async function analyzeSupportPatterns(insights: TicketInsight[], recentTickets: any[]): Promise<void> {
  // Analyze user agents for support patterns
  const userAgents = recentTickets
    .map(t => t.payload.user_agent)
    .filter(Boolean);
  
  if (userAgents.length > 0) {
    const mobileTickets = userAgents.filter(ua => 
      ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android') || ua.toLowerCase().includes('iphone')
    ).length;
    
    const mobilePercentage = (mobileTickets / userAgents.length) * 100;
    
    if (mobilePercentage > THRESHOLDS.MOBILE_USAGE_THRESHOLD) {
      insights.push({
        type: 'user_experience_issues',
        message: `${mobilePercentage.toFixed(1)}% of tickets come from mobile devices. Consider mobile-specific support resources.`,
        severity: 'info',
        category: 'customer_success',
        meta: {
          mobilePercentage: mobilePercentage.toFixed(1),
          recommendation: 'Develop mobile-optimized documentation and support tools'
        }
      });
    }
  }
  
  // Analyze ticket urgency patterns
  const urgentTickets = recentTickets.filter(t => 
    t.payload.tags && t.payload.tags.includes('urgent')
  ).length;
  
  if (urgentTickets > 0) {
    const urgentPercentage = (urgentTickets / recentTickets.length) * 100;
    
    if (urgentPercentage > THRESHOLDS.URGENT_TICKETS_WARNING) {
      insights.push({
        type: 'urgent_trends',
        message: `${urgentPercentage.toFixed(1)}% of tickets are marked urgent. This may indicate systemic issues or unclear priority guidelines.`,
        severity: urgentPercentage > THRESHOLDS.URGENT_TICKETS_CRITICAL ? 'red' : 'yellow',
        category: 'risk',
        meta: {
          urgentPercentage: urgentPercentage.toFixed(1),
          urgentCount: urgentTickets,
          recommendation: 'Review priority classification and identify common urgent issue patterns'
        }
      });
    }
  }
  
  // Analyze integration-related issues
  const integrationTickets = recentTickets.filter(t => 
    t.payload.tags && (
      t.payload.tags.includes('integration') || 
      t.payload.tags.includes('api') || 
      t.payload.tags.includes('sso')
    )
  ).length;
  
  if (integrationTickets > 0) {
    const integrationPercentage = (integrationTickets / recentTickets.length) * 100;
    
    if (integrationPercentage > THRESHOLDS.INTEGRATION_ISSUES_WARNING) {
      insights.push({
        type: 'integration_problems',
        message: `${integrationPercentage.toFixed(1)}% of tickets are integration-related. Consider dedicated integration support.`,
        severity: 'yellow',
        category: 'strategic',
        meta: {
          integrationPercentage: integrationPercentage.toFixed(1),
          integrationCount: integrationTickets,
          recommendation: 'Develop integration best practices and provide specialized support'
        }
      });
    }
  }
  
  // Analyze performance-related issues
  const performanceTickets = recentTickets.filter(t => 
    t.payload.tags && (
      t.payload.tags.includes('performance') || 
      t.payload.tags.includes('slow') || 
      t.payload.tags.includes('timeout')
    )
  ).length;
  
  if (performanceTickets > 0) {
    const performancePercentage = (performanceTickets / recentTickets.length) * 100;
    
    if (performancePercentage > THRESHOLDS.PERFORMANCE_ISSUES_WARNING) {
      insights.push({
        type: 'performance_concerns',
        message: `${performancePercentage.toFixed(1)}% of tickets are performance-related. This may indicate infrastructure issues.`,
        severity: 'yellow',
        category: 'strategic',
        meta: {
          performancePercentage: performancePercentage.toFixed(1),
          performanceCount: performanceTickets,
          recommendation: 'Conduct performance audit and consider infrastructure improvements'
        }
      });
    }
  }
}
