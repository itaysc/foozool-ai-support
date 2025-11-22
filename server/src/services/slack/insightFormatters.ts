/**
 * Formatters for converting and formatting insights for Slack
 */

/**
 * Format insight type for display
 */
export function formatInsightType(type: string): string {
  const typeMap: Record<string, string> = {
    'ticket_cluster': '🎫 Ticket Clusters',
    'nps_analysis': '⭐ NPS Analysis',
    'customer_satisfaction': '😊 Customer Satisfaction',
    'trend_analysis': '📈 Trend Analysis',
    'anomaly_detection': '⚠️ Anomaly Detection',
    'customer_success': '🎯 Customer Success',
    'nps_insight': '⭐ NPS Insights',
    'nps_recommendation': '💡 NPS Recommendations',
    'csat_insight': '😊 CSAT Insights',
    'csat_recommendation': '💡 CSAT Recommendations'
  };
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get emoji for severity
 */
export function getSeverityEmoji(severity?: string): string {
  const emojiMap: Record<string, string> = {
    'red': '🔴',
    'yellow': '🟡',
    'info': '🔵',
    'high': '🔴',
    'medium': '🟡',
    'low': '🔵'
  };
  return emojiMap[severity?.toLowerCase() || ''] || '📌';
}

/**
 * Format insight metadata
 */
export function formatInsightMetadata(insight: any): string {
  const parts: string[] = [];

  // NPS data
  if (insight.meta?.npsScore !== undefined) {
    parts.push(`NPS: *${insight.meta.npsScore}*`);
    if (insight.meta.npsChange !== undefined) {
      const change = insight.meta.npsChange >= 0 ? `+${insight.meta.npsChange}` : `${insight.meta.npsChange}`;
      parts.push(`Change: ${change}`);
    }
  }

  // CSAT data
  if (insight.meta?.csatScore !== undefined) {
    parts.push(`CSAT: *${insight.meta.csatScore}/5*`);
    if (insight.meta.csatChange !== undefined) {
      const change = insight.meta.csatChange >= 0 ? `+${insight.meta.csatChange}` : `${insight.meta.csatChange}`;
      parts.push(`Change: ${change}`);
    }
  }

  // Ticket volume
  if (insight.ticketVolume !== undefined) {
    parts.push(`Tickets: *${insight.ticketVolume}*`);
  }

  // Growth rate
  if (insight.growthRate !== undefined) {
    const growth = insight.growthRate >= 0 ? `+${insight.growthRate}%` : `${insight.growthRate}%`;
    parts.push(`Growth: ${growth}`);
  }

  return parts.length > 0 ? parts.join(' • ') : '';
}

/**
 * Get insight fields for Slack section
 */
export function getInsightFields(insight: any): any[] {
  const fields: any[] = [];

  // Date information
  if (insight.createdAt || insight.firstDetectedAt || insight.lastUpdatedAt) {
    const date = insight.createdAt || insight.firstDetectedAt || insight.lastUpdatedAt;
    const dateStr = new Date(date).toLocaleDateString();
    fields.push({
      type: 'mrkdwn',
      text: `*Created:*\n${dateStr}`
    });
  }

  // Category
  if (insight.category) {
    fields.push({
      type: 'mrkdwn',
      text: `*Category:*\n${insight.category}`
    });
  }

  // Response rate (for surveys)
  if (insight.meta?.responseRate !== undefined) {
    fields.push({
      type: 'mrkdwn',
      text: `*Response Rate:*\n${(insight.meta.responseRate * 100).toFixed(1)}%`
    });
  }

  // Total responses
  if (insight.meta?.totalResponses !== undefined) {
    fields.push({
      type: 'mrkdwn',
      text: `*Total Responses:*\n${insight.meta.totalResponses}`
    });
  }

  return fields;
}

/**
 * Convert NPS insights to unified format
 */
export function convertNPSInsightsToUnified(npsInsights: any, customerId: string, customerName?: string): any[] {
  const insights: any[] = [];
  
  if (npsInsights.insights && npsInsights.insights.length > 0) {
    npsInsights.insights.forEach((insight: string, index: number) => {
      insights.push({
        id: `nps_${customerId}_${index}_${Date.now()}`,
        type: 'nps_insight',
        message: insight,
        severity: npsInsights.currentNPS < 0 ? 'red' : npsInsights.currentNPS < 50 ? 'yellow' : 'info',
        category: 'customer_success',
        meta: {
          npsScore: npsInsights.currentNPS,
          npsChange: npsInsights.npsChange,
          responseRate: npsInsights.responseRate,
          totalResponses: npsInsights.totalResponses,
          processedAt: npsInsights.processedAt
        },
        status: 'new',
        createdAt: npsInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'nps_analysis'
      });
    });
  }

  if (npsInsights.recommendations && npsInsights.recommendations.length > 0) {
    npsInsights.recommendations.forEach((recommendation: string, index: number) => {
      insights.push({
        id: `nps_rec_${customerId}_${index}_${Date.now()}`,
        type: 'nps_recommendation',
        message: recommendation,
        severity: 'info',
        category: 'opportunity',
        meta: {
          npsScore: npsInsights.currentNPS,
          npsChange: npsInsights.npsChange,
          responseRate: npsInsights.responseRate,
          totalResponses: npsInsights.totalResponses,
          processedAt: npsInsights.processedAt
        },
        status: 'new',
        createdAt: npsInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'nps_analysis'
      });
    });
  }

  return insights;
}

/**
 * Convert CSAT insights to unified format
 */
export function convertCSATInsightsToUnified(csatInsights: any, customerId: string, customerName?: string): any[] {
  const insights: any[] = [];
  
  if (csatInsights.insights && csatInsights.insights.length > 0) {
    csatInsights.insights.forEach((insight: string, index: number) => {
      insights.push({
        id: `csat_${customerId}_${index}_${Date.now()}`,
        type: 'csat_insight',
        message: insight,
        severity: csatInsights.currentCSAT < 3 ? 'red' : csatInsights.currentCSAT < 4 ? 'yellow' : 'info',
        category: 'customer_success',
        meta: {
          csatScore: csatInsights.currentCSAT,
          csatChange: csatInsights.csatChange,
          responseRate: csatInsights.responseRate,
          totalResponses: csatInsights.totalResponses,
          processedAt: csatInsights.processedAt
        },
        status: 'new',
        createdAt: csatInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'customer_satisfaction'
      });
    });
  }

  if (csatInsights.recommendations && csatInsights.recommendations.length > 0) {
    csatInsights.recommendations.forEach((recommendation: string, index: number) => {
      insights.push({
        id: `csat_rec_${customerId}_${index}_${Date.now()}`,
        type: 'csat_recommendation',
        message: recommendation,
        severity: 'info',
        category: 'opportunity',
        meta: {
          csatScore: csatInsights.currentCSAT,
          csatChange: csatInsights.csatChange,
          responseRate: csatInsights.responseRate,
          totalResponses: csatInsights.totalResponses,
          processedAt: csatInsights.processedAt
        },
        status: 'new',
        createdAt: csatInsights.processedAt?.toISOString() || new Date().toISOString(),
        customerId: customerId,
        customerName: customerName || 'Unknown Customer',
        insightType: 'customer_satisfaction'
      });
    });
  }

  return insights;
}

/**
 * Deduplicate insights keeping only the latest by period
 */
export function deduplicateInsightsByPeriod(insights: any[]): any[] {
  const insightGroups = new Map<string, any[]>();
  
  for (const insight of insights) {
    const key = JSON.stringify({
      type: insight.type,
      message: insight.message,
      severity: insight.severity,
      category: insight.category,
      customerId: insight.customerId,
      insightType: insight.insightType
    });
    
    if (!insightGroups.has(key)) {
      insightGroups.set(key, []);
    }
    insightGroups.get(key)!.push(insight);
  }
  
  const deduplicatedInsights: any[] = [];
  for (const [key, group] of insightGroups.entries()) {
    if (group.length === 1) {
      deduplicatedInsights.push(group[0]);
    } else {
      const sortedGroup = group.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.processedAt || 0);
        const dateB = new Date(b.createdAt || b.processedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      deduplicatedInsights.push(sortedGroup[0]);
    }
  }
  
  return deduplicatedInsights;
}

