import { callLLM } from '../../llm';
import { UserContextManager } from '../../../context/userContext';
import { MeetingPrepV2Data } from './types';
import convertSnakeToSpacedCase from 'src/utils/snakeToSpacedCase';

/**
 * Generate enhanced meeting prep content with structured sections
 */
export async function generateEnhancedMeetingPrepContent(data: MeetingPrepV2Data): Promise<string> {
  const { customer, insights, healthScore, ticketStats, customerNews, generatedAt } = data;
  
  const content: string[] = [];

  // 1. Executive Summary
  content.push(`EXECUTIVE SUMMARY`);
  content.push(`\nCustomer: ${customer.name}`);
  content.push(`Industry: ${customer.industry || 'Not specified'}`);
  content.push(`Company Size: ${customer.companySize || 'Not specified'}`);
  content.push(`Segment: ${customer.segment || 'Not specified'}`);
  content.push(`Account Manager: ${customer.accountManager || 'Not assigned'}`);
  
  if (customer.financialMetrics?.contractValue) {
    content.push(`Contract Value: $${customer.financialMetrics.contractValue.toLocaleString()}`);
  }
  
  if (customer.startDate) {
    content.push(`Customer Since: ${new Date(customer.startDate).toLocaleDateString()}`);
  }

  // Generate LLM summary for executive summary
  const executiveSummaryPrompt = `Based on the following customer data, provide a one-paragraph natural language summary for a meeting prep document:

Customer: ${customer.name}
Industry: ${customer.industry || 'Not specified'}
Company Size: ${customer.companySize || 'Not specified'}
Health Score: ${healthScore.overallScore}/10
Health Trend: ${healthScore.trend}
Active Users: ${customer.usageData?.activeUsersCount || 'Unknown'}
Seats Used: ${customer.usageData?.seatsUsed || 'Unknown'}
Contract Value: ${customer.financialMetrics?.contractValue ? '$' + customer.financialMetrics.contractValue.toLocaleString() : 'Not specified'}

Provide a concise, professional summary highlighting key metrics and any notable trends or concerns.`;

  try {
    const executiveSummary = await callLLM({
      userId: UserContextManager.getCurrentUserId() || 'system',
      prompt: executiveSummaryPrompt,
      isChat: true,
      systemMsg: 'You are a customer success manager preparing for a client meeting.',
      maxTokens: 200
    });
    content.push(`\nSummary: ${executiveSummary.data || 'Summary not available'}`);
  } catch (error) {
    console.warn('Failed to generate executive summary:', error);
    content.push(`\nSummary: Customer health score is ${healthScore.overallScore}/10 with ${healthScore.trend} trend.`);
  }

  content.push(`\n\n`);

  // 2. Recent News & Market Context
  content.push(`RECENT NEWS & MARKET CONTEXT`);
  
  if ((customerNews as any)?.items && (customerNews as any).items.length > 0) {
    // Group news by category
    const newsByCategory = (customerNews as any).items.reduce((acc: any, item: any) => {
      const category = item.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    // Display news by category
    Object.entries(newsByCategory).forEach(([category, items]: [string, any]) => {
      items.forEach((item: any) => {
        const relevance = item.relevance === 'high' ? '[HIGH]' : item.relevance === 'medium' ? '[MED]' : '[LOW]';
        content.push(`- ${relevance} ${item.title}: ${item.summary}`);
      });
    });
    
    if ((customerNews as any).generated) {
      content.push(`\n*Note: This news summary was generated using AI based on publicly available information.*`);
    }
  } else {
    content.push(`\nNo recent news information available.`);
  }

  content.push(`\n\n`);

  // 3. Health & Usage Overview
  content.push(`HEALTH & USAGE OVERVIEW`);
  
  content.push(`\nOverall Health Score: ${healthScore.overallScore}/10`);
  content.push(`Health Trend: ${healthScore.trend}`);
  content.push(`Support Health: ${healthScore.supportHealth.score}/10`);
  content.push(`Engagement Health: ${healthScore.engagementHealth.score}/10`);
  content.push(`Business Health: ${healthScore.businessHealth.score}/10`);

  if (customer.usageData) {
    content.push(`\nUsage Metrics:`);
    content.push(`- Active Users: ${customer.usageData.activeUsersCount || 'Unknown'}`);
    content.push(`- Seats Purchased: ${customer.usageData.seatsPurchased || 'Unknown'}`);
    content.push(`- Seats Used: ${customer.usageData.seatsUsed || 'Unknown'}`);
    
    if (customer.usageData.seatsPurchased && customer.usageData.seatsUsed) {
      const utilizationRate = Math.round((customer.usageData.seatsUsed / customer.usageData.seatsPurchased) * 100);
      content.push(`- Utilization Rate: ${utilizationRate}%`);
    }
  }

  // Add stakeholder engagement data if available
  if (customer.stakeholders && customer.stakeholders.length > 0) {
    const activeStakeholders = customer.stakeholders.filter(s => s.engagement?.level === 'high').length;
    const totalStakeholders = customer.stakeholders.length;
    content.push(`\nStakeholder Engagement:`);
    content.push(`- Total Stakeholders: ${totalStakeholders}`);
    content.push(`- Highly Engaged: ${activeStakeholders}`);
    
    // Find last contact date
    const lastContacts = customer.stakeholders
      .map(s => s.engagement?.lastContact)
      .filter(date => date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (lastContacts.length > 0) {
      content.push(`- Last Contact: ${new Date(lastContacts[0]).toLocaleDateString()}`);
    }
  }

  content.push(`\n\n`);

  // 4. Unusual Behavior & Alerts
  content.push(`UNUSUAL BEHAVIOR & ALERTS`);
  
  if (insights && insights.length > 0) {
    const highSeverityInsights = insights.filter(insight => insight.severity === 'red' || insight.severity === 'high');
    const mediumSeverityInsights = insights.filter(insight => insight.severity === 'yellow' || insight.severity === 'medium');
    
    let alertCounter = 1;
    
    if (highSeverityInsights.length > 0) {
      content.push(`\nHigh Priority Alerts:`);
      highSeverityInsights.slice(0, 3).forEach((insight) => {
        content.push(`${alertCounter}. ${insight.message}`);
        if (insight.category) {
          content.push(`   - Category: ${convertSnakeToSpacedCase(insight.category)}`);
        }
        alertCounter++;
      });
    }
    
    if (mediumSeverityInsights.length > 0) {
      content.push(`\nMedium Priority Alerts:`);
      mediumSeverityInsights.slice(0, 3).forEach((insight) => {
        content.push(`${alertCounter}. ${insight.message}`);
        if (insight.category) {
          content.push(`   - Category: ${convertSnakeToSpacedCase(insight.category)}`);
        }
        alertCounter++;
      });
    }

    // Generate LLM summary for anomalies
    if (insights.length > 0) {
      const insightsSummary = insights.slice(0, 5).map(insight => 
        `${insight.severity.toUpperCase()}: ${insight.message}`
      ).join('\n');

      const anomalyPrompt = `Given these customer insights from the last 4 weeks, summarize anomalies and possible causes in 2-3 bullet points:

${insightsSummary}

Provide concise, actionable insights for a customer success manager.`;

      try {
        const anomalySummary = await callLLM({
          userId: UserContextManager.getCurrentUserId() || 'system',
          prompt: anomalyPrompt,
          isChat: true,
          systemMsg: 'You are a customer success analyst identifying key issues.',
          maxTokens: 150
        });
        content.push(`\nAnalysis:`);
        content.push(anomalySummary.data || 'Analysis not available');
      } catch (error) {
        console.warn('Failed to generate anomaly summary:', error);
      }
    }
  } else {
    content.push(`\nNo unusual behavior detected in the last 30 days.`);
  }

  content.push(`\n\n`);

  // 5. Product Adaptations & Feedback
  content.push(`PRODUCT ADAPTATIONS & FEEDBACK`);
  
  // Extract product-related insights
  const productInsights = insights?.filter(insight => 
    insight.category === 'product_adoption' || 
    insight.category === 'user_engagement' ||
    insight.type?.includes('adoption') ||
    insight.type?.includes('usage')
  ) || [];

  if (productInsights.length > 0) {
    content.push(`\nRecent Product Activity:`);
    productInsights.slice(0, 5).forEach((insight, index) => {
      content.push(`${index + 1}. ${insight.message}`);
    });
  }

  // Extract support-related insights for feedback
  const supportInsights = insights?.filter(insight => 
    insight.category === 'support_health' ||
    insight.type?.includes('ticket') ||
    insight.type?.includes('support')
  ) || [];

  if (supportInsights.length > 0) {
    content.push(`\nSupport Feedback Indicators:`);
    supportInsights.slice(0, 3).forEach((insight, index) => {
      content.push(`${index + 1}. ${insight.message}`);
    });
  }

  if (productInsights.length === 0 && supportInsights.length === 0) {
    content.push(`\nNo specific product adaptation or feedback data available.`);
  }

  content.push(`\n\n`);

  // 6. Financial Health Indicators
  content.push(`FINANCIAL HEALTH INDICATORS`);
  
  if (customer.financialMetrics) {
    content.push(`\nPayment Health:`);
    content.push(`- Payment Reliability: ${customer.financialMetrics.paymentReliability || 'Not specified'}`);
    content.push(`- Average Payment Days: ${customer.financialMetrics.averagePaymentDays || 'Not specified'} days`);
    content.push(`- Payment Terms: ${customer.financialMetrics.paymentTerms || 'Not specified'}`);
    
    if (customer.financialMetrics.lastPaymentDate) {
      content.push(`- Last Payment: ${new Date(customer.financialMetrics.lastPaymentDate).toLocaleDateString()}`);
    }
    
    if (customer.financialMetrics.outstandingBalance && customer.financialMetrics.outstandingBalance > 0) {
      content.push(`- Outstanding Balance: $${customer.financialMetrics.outstandingBalance.toLocaleString()}`);
    }
    
    if (customer.financialMetrics.creditScore) {
      content.push(`- Credit Score: ${customer.financialMetrics.creditScore}`);
    }
    
    content.push(`\nContract Details:`);
    if (customer.financialMetrics.contractRenewalDate) {
      const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      content.push(`- Renewal Date: ${renewalDate.toLocaleDateString()}`);
      content.push(`- Days Until Renewal: ${daysUntilRenewal}`);
      
      if (daysUntilRenewal <= 90) {
        content.push(`- ⚠️ Renewal approaching - schedule renewal discussion`);
      }
    }
    
    if (customer.financialMetrics.annualRecurringRevenue) {
      content.push(`- Annual Recurring Revenue: $${customer.financialMetrics.annualRecurringRevenue.toLocaleString()}`);
    }
    
    if (customer.financialMetrics.monthlyRecurringRevenue) {
      content.push(`- Monthly Recurring Revenue: $${customer.financialMetrics.monthlyRecurringRevenue.toLocaleString()}`);
    }
  } else {
    content.push(`\nNo financial metrics available.`);
  }

  content.push(`\n\n`);

  // 7. Usage & Adoption Analytics
  content.push(`USAGE & ADOPTION ANALYTICS`);
  
  if (customer.usageData) {
    content.push(`\nSeat Utilization:`);
    content.push(`- Active Users: ${customer.usageData.activeUsersCount || 'Unknown'}`);
    content.push(`- Seats Purchased: ${customer.usageData.seatsPurchased || 'Unknown'}`);
    content.push(`- Seats Used: ${customer.usageData.seatsUsed || 'Unknown'}`);
    
    if (customer.usageData.seatsPurchased && customer.usageData.seatsUsed) {
      const utilizationRate = Math.round((parseInt(customer.usageData.seatsUsed.toString()) / parseInt(customer.usageData.seatsPurchased.toString())) * 100);
      content.push(`- Utilization Rate: ${utilizationRate}%`);
      
      if (utilizationRate > 90) {
        content.push(`- 💡 High utilization - expansion opportunity`);
      } else if (utilizationRate < 50) {
        content.push(`- ⚠️ Low utilization - training opportunity`);
      }
    }
  }
  
  if (customer.featureUsage && customer.featureUsage.length > 0) {
    content.push(`\nFeature Adoption:`);
    customer.featureUsage.forEach((feature, index) => {
      content.push(`${index + 1}. ${feature.feature}: ${feature.utilizationPercent || 0}% adoption`);
      if (feature.activeUsersCount) {
        content.push(`   - Active Users: ${feature.activeUsersCount}`);
      }
    });
  }
  
  if (customer.stakeholders && customer.stakeholders.length > 0) {
    const totalStakeholders = customer.stakeholders.length;
    const activeStakeholders = customer.stakeholders.filter(s => s.engagement?.level === 'high').length;
    const mediumStakeholders = customer.stakeholders.filter(s => s.engagement?.level === 'medium').length;
    
    content.push(`\nStakeholder Engagement:`);
    content.push(`- Total Stakeholders: ${totalStakeholders}`);
    content.push(`- Highly Engaged: ${activeStakeholders}`);
    content.push(`- Medium Engagement: ${mediumStakeholders}`);
    content.push(`- Low/Inactive: ${totalStakeholders - activeStakeholders - mediumStakeholders}`);
    
    // Show decision makers
    const decisionMakers = customer.stakeholders.filter(s => s.influence?.decisionPower && s.influence.decisionPower >= 7);
    if (decisionMakers.length > 0) {
      content.push(`\nKey Decision Makers:`);
      decisionMakers.forEach((stakeholder, index) => {
        content.push(`${index + 1}. ${stakeholder.name} (${stakeholder.title}) - Decision Power: ${stakeholder.influence?.decisionPower}/10`);
      });
    }
  }

  content.push(`\n\n`);

  // 8. Support Intelligence
  content.push(`SUPPORT INTELLIGENCE`);
  
  if (ticketStats) {
    content.push(`\nTicket Statistics:`);
    content.push(`- Total Tickets: ${ticketStats.totalTickets || 0}`);
    content.push(`- Open Tickets: ${ticketStats.openTickets || 0}`);
    content.push(`- Resolved Tickets: ${ticketStats.resolvedTickets || 0}`);
    
    if (ticketStats.averageResolutionTime) {
      content.push(`- Average Resolution Time: ${ticketStats.averageResolutionTime} hours`);
    }
    
    if (ticketStats.topCategories && ticketStats.topCategories.length > 0) {
      content.push(`\nTop Ticket Categories:`);
      ticketStats.topCategories.slice(0, 3).forEach((category, index) => {
        content.push(`${index + 1}. ${category.name}: ${category.count} tickets`);
      });
    }

    if (ticketStats.satisfactionScore) {
      content.push(`\nCustomer Satisfaction: ${ticketStats.satisfactionScore}/5`);
    }
  } else {
    content.push(`\nNo support ticket data available.`);
  }

  content.push(`\n\n`);

  // 9. Account Sentiment
  content.push(`ACCOUNT SENTIMENT`);
  
  // Look for NPS/CSAT insights
  const sentimentInsights = insights?.filter(insight => 
    insight.category === 'customer_success' ||
    insight.type?.includes('nps') ||
    insight.type?.includes('csat') ||
    insight.type?.includes('satisfaction')
  ) || [];

  if (sentimentInsights.length > 0) {
    content.push(`\nSentiment Indicators:`);
    sentimentInsights.slice(0, 3).forEach((insight, index) => {
      content.push(`${index + 1}. ${insight.message}`);
    });
  }

  // Contract renewal information
  if (customer.financialMetrics?.contractRenewalDate) {
    const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    content.push(`\nContract Information:`);
    content.push(`- Renewal Date: ${renewalDate.toLocaleDateString()}`);
    content.push(`- Days Until Renewal: ${daysUntilRenewal}`);
    
    if (daysUntilRenewal < 90) {
      content.push(`- ⚠️ Renewal approaching - schedule renewal discussion`);
    }
  }

  // Payment reliability
  if (customer.financialMetrics?.paymentReliability) {
    content.push(`\nPayment Reliability: ${customer.financialMetrics.paymentReliability}`);
    
    if (customer.financialMetrics.outstandingBalance > 0) {
      content.push(`- Outstanding Balance: $${customer.financialMetrics.outstandingBalance.toLocaleString()}`);
    }
  }

  if (sentimentInsights.length === 0 && !customer.financialMetrics?.contractRenewalDate) {
    content.push(`\nNo specific sentiment or renewal data available.`);
  }

  content.push(`\n\n`);

  // 10. Recommended Action Items
  content.push(`RECOMMENDED ACTION ITEMS`);
  
  const actionItems: string[] = [];
  
  // Health score actions
  if (healthScore.overallScore < 50) {
    actionItems.push(`Schedule urgent health check meeting`);
  } else if (healthScore.overallScore < 70) {
    actionItems.push(`Review health score improvement plan`);
  }
  
  // Ticket actions
  if (ticketStats?.openTickets > 0) {
    actionItems.push(`Review and prioritize ${ticketStats.openTickets} open tickets`);
  }
  
  // Renewal actions
  if (customer.financialMetrics?.contractRenewalDate) {
    const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRenewal < 90) {
      actionItems.push(`Schedule renewal discussion`);
    }
  }
  
  // High priority insights actions
  const highPriorityInsights = insights?.filter(insight => insight.severity === 'red' || insight.severity === 'high') || [];
  if (highPriorityInsights.length > 0) {
    actionItems.push(`Address ${highPriorityInsights.length} high-priority insights`);
  }
  
  if (actionItems.length > 0) {
    actionItems.forEach((item) => {
      content.push(`- ${item}`);
    });
  } else {
    content.push(`No specific action items identified.`);
  }

  return content.join('\n');
}

/**
 * Generate minimal enhanced content (streamlined version)
 */
export async function generateMinimalEnhancedContent(data: MeetingPrepV2Data): Promise<string> {
  const { customer, insights, healthScore, ticketStats, generatedAt } = data;
  
  const content: string[] = [];

  // Executive Summary (minimal)
  content.push(`${customer.name.toUpperCase()} - MEETING PREP`);
  content.push(`\nHealth Score: ${healthScore.overallScore}/10 (${healthScore.trend})`);
  content.push(`Account Manager: ${customer.accountManager || 'Not assigned'}`);
  
  if (customer.financialMetrics?.contractValue) {
    content.push(`Contract Value: $${customer.financialMetrics.contractValue.toLocaleString()}`);
  }

  // Key Metrics
    content.push(`\nKEY METRICS`);
  
  if (customer.usageData) {
    content.push(`- Active Users: ${customer.usageData.activeUsersCount || 'Unknown'}`);
    content.push(`- Utilization: ${customer.usageData.seatsUsed}/${customer.usageData.seatsPurchased || 'Unknown'}`);
  }
  
  if (ticketStats) {
    content.push(`- Open Tickets: ${ticketStats.openTickets || 0}`);
    content.push(`- Avg Resolution: ${ticketStats.averageResolutionTime || 'Unknown'} hours`);
  }

  // Top 3 Insights
  if (insights && insights.length > 0) {
    content.push(`\nTOP INSIGHTS`);
    insights.slice(0, 3).forEach((insight, index) => {
      content.push(`${index + 1}. ${insight.message}`);
    });
  }

  // Quick Actions
  content.push(`\nQUICK ACTIONS`);
  
  const quickActions: string[] = [];
  
  if (healthScore.overallScore < 70) {
    quickActions.push(`Review health score`);
  }
  
  if (ticketStats?.openTickets > 0) {
    quickActions.push(`Check open tickets`);
  }
  
  if (customer.financialMetrics?.contractRenewalDate) {
    const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
    const daysUntilRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRenewal < 90) {
      quickActions.push(`Schedule renewal discussion`);
    }
  }
  
  if (quickActions.length > 0) {
    quickActions.forEach((action) => {
      content.push(`- ${action}`);
    });
  } else {
    content.push(`No immediate actions required.`);
  }

  return content.join('\n');
}
