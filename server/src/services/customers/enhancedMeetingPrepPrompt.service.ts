import { CustomerData, InsightData } from '../insights/prompts';
import { RiskAssessment } from './riskAssessment.service';
import { HealthScoreFactors } from '../insights/healthScore.service';

/**
 * Enhanced meeting prep prompt generator with risk-focused content
 */
export class EnhancedMeetingPrepPromptGenerator {
  
  /**
   * Generate comprehensive meeting prep prompt with risk alerts
   */
  generateEnhancedMeetingPrepPrompt(
    customer: CustomerData,
    healthScore: HealthScoreFactors,
    risks: RiskAssessment,
    insights: InsightData[],
    csatInsights?: any,
    customerNews?: any,
    ticketData?: any
  ): string {
    const riskAlerts = this.generateRiskAlerts(risks);
    const talkingPoints = this.generateTalkingPoints(customer, customerNews, ticketData);
    const actionItems = this.generateActionItems(customer, risks, insights);
    const questions = this.generateQuestions(customer, risks, insights, customerNews);

    return `
You are an experienced Customer Success Manager preparing for a customer check-in meeting with ${customer.name || 'this customer'}.

${riskAlerts}

CUSTOMER PROFILE:
- Name: ${customer.name || 'N/A'}
- Industry: ${customer.industry || 'N/A'}
- Company Size: ${customer.companySize || 'N/A'}
- Contract Value: ${customer.financialMetrics?.contractValue ? `$${customer.financialMetrics.contractValue.toLocaleString()}` : 'N/A'}
- Annual Recurring Revenue: ${customer.financialMetrics?.annualRecurringRevenue ? `$${customer.financialMetrics.annualRecurringRevenue.toLocaleString()}` : 'N/A'}
- Monthly Recurring Revenue: ${customer.financialMetrics?.monthlyRecurringRevenue ? `$${customer.financialMetrics.monthlyRecurringRevenue.toLocaleString()}` : 'N/A'}
- Contract Renewal Date: ${customer.financialMetrics?.contractRenewalDate ? new Date(customer.financialMetrics.contractRenewalDate).toLocaleDateString() : 'N/A'}
- Payment Terms: ${customer.financialMetrics?.paymentTerms || 'N/A'}
- Payment Reliability: ${customer.financialMetrics?.paymentReliability || 'N/A'}
- Outstanding Balance: ${customer.financialMetrics?.outstandingBalance ? `$${customer.financialMetrics.outstandingBalance.toLocaleString()}` : 'N/A'}
- Credit Score: ${customer.financialMetrics?.creditScore || 'N/A'}
- Health Score: ${healthScore.overallScore}/100 (${healthScore.trend})
- Account Manager: ${customer.accountManager || 'N/A'}

HEALTH SCORE BREAKDOWN:
- Support Health: ${healthScore.supportHealth.score}/100
- Engagement Health: ${healthScore.engagementHealth.score}/100
- Business Health: ${healthScore.businessHealth.score}/100

${talkingPoints}

${actionItems}

${questions}

RECENT NEWS CONTEXT:
${customerNews && customerNews.news && customerNews.news.length > 0 ? `
Recent developments about ${customer.name}:
${customerNews.news
  .filter((item: any) => item.relevance === 'high' || item.relevance === 'medium')
  .slice(0, 5)
  .map((item: any, idx: number) => `
${idx + 1}. [${item.impact.toUpperCase()}] ${item.title}
   Published: ${new Date(item.pubDate).toLocaleDateString()}
   Summary: ${item.contentSnippet}
`).join('\n')}

News Summary: ${customerNews.summary || 'No summary available'}
` : `No recent news available about ${customer.name || 'this customer'}.`}

CUSTOMER SUCCESS INSIGHTS:
${insights.length > 0 ? insights.map(insight => `
- ${insight.type.replace(/_/g, ' ').toUpperCase()} (${insight.category}, ${insight.severity} severity)
  ${insight.message}
`).join('\n') : 'No insights available'}

CSAT INSIGHTS:
${csatInsights ? `
- Overall CSAT Score: ${csatInsights.currentCSAT || 0}%
- Change from Previous Period: ${csatInsights.csatChange > 0 ? '+' : ''}${csatInsights.csatChange || 0}%
- Total Responses: ${csatInsights.totalResponses || 0}
- Key Insights: ${csatInsights.insights?.join(', ') || 'No insights available'}
` : 'No CSAT data available'}

INSTRUCTIONS:
Create a comprehensive meeting prep document with these EXACT sections (use this exact format):

1. CRITICAL RISK ALERTS
2. CUSTOMER HEALTH ASSESSMENT  
3. TALKING POINTS
4. STRATEGIC OPPORTUNITIES
5. RISK MITIGATION
6. QUESTIONS TO ASK
7. ACTION ITEMS
8. SUCCESS METRICS
9. FOLLOW-UP PLAN

IMPORTANT FORMATTING RULES:
- Start each section with the EXACT title above (numbered format)
- Use clear line breaks between sections
- Make each section detailed and actionable
- Prioritize risk alerts at the top - these need immediate attention
- Use specific data points and numbers from the health score
- Reference actual news articles to show you're paying attention
- Make recommendations actionable with clear next steps
- Focus on saving the CS team time with pre-researched talking points
- End with "END OF DOCUMENT" to signal completion

Generate detailed, actionable content that will help the CS team have a productive conversation and address any risks proactively.`;
  }

  /**
   * Generate risk alerts section
   */
  private generateRiskAlerts(risks: RiskAssessment): string {
    const alerts: string[] = [];

    if (risks.overallRisk.level === 'critical') {
      alerts.push(`🚨 CRITICAL RISK ALERT: ${risks.overallRisk.score}/100`);
      alerts.push(`Primary Concerns: ${risks.overallRisk.primaryConcerns.join(', ')}`);
      alerts.push(`Immediate Actions Required:`);
      risks.overallRisk.immediateActions.forEach(action => {
        alerts.push(`  • ${action}`);
      });
    } else if (risks.overallRisk.level === 'high') {
      alerts.push(`⚠️ HIGH RISK ALERT: ${risks.overallRisk.score}/100`);
      alerts.push(`Primary Concerns: ${risks.overallRisk.primaryConcerns.join(', ')}`);
    }

    if (risks.churnRisk.level === 'high' || risks.churnRisk.level === 'critical') {
      alerts.push(`\n🔄 CHURN RISK: ${risks.churnRisk.level.toUpperCase()} (${risks.churnRisk.score}/100)`);
      alerts.push(`Evidence: ${risks.churnRisk.evidence.join(', ')}`);
      alerts.push(`Recommended Actions:`);
      risks.churnRisk.recommendations.forEach(rec => {
        alerts.push(`  • ${rec}`);
      });
    }

    if (risks.satisfactionRisk.level === 'high' || risks.satisfactionRisk.level === 'critical') {
      alerts.push(`\n😞 SATISFACTION RISK: ${risks.satisfactionRisk.level.toUpperCase()} (${risks.satisfactionRisk.score}/100)`);
      alerts.push(`Evidence: ${risks.satisfactionRisk.evidence.join(', ')}`);
      alerts.push(`Recommended Actions:`);
      risks.satisfactionRisk.recommendations.forEach(rec => {
        alerts.push(`  • ${rec}`);
      });
    }

    if (risks.engagementRisk.level === 'high' || risks.engagementRisk.level === 'critical') {
      alerts.push(`\n📞 ENGAGEMENT RISK: ${risks.engagementRisk.level.toUpperCase()} (${risks.engagementRisk.score}/100)`);
      alerts.push(`Evidence: ${risks.engagementRisk.evidence.join(', ')}`);
      alerts.push(`Recommended Actions:`);
      risks.engagementRisk.recommendations.forEach(rec => {
        alerts.push(`  • ${rec}`);
      });
    }

    return alerts.length > 0 ? `\n${alerts.join('\n')}\n` : '';
  }

  /**
   * Generate data-driven talking points
   */
  private generateTalkingPoints(customer: CustomerData, customerNews?: any, ticketData?: any): string {
    const points: string[] = [];

    // News-based talking points
    if (customerNews?.news) {
      const recentNews = customerNews.news
        .filter((item: any) => item.relevance === 'high')
        .slice(0, 3);

      if (recentNews.length > 0) {
        points.push(`📰 NEWS-BASED TALKING POINTS:`);
        recentNews.forEach((item: any, idx: number) => {
          if (item.impact === 'positive') {
            points.push(`  • Congratulations on ${item.title} - this is great news!`);
            points.push(`  • How does this development affect your priorities?`);
          } else if (item.impact === 'negative') {
            points.push(`  • I saw the news about ${item.title} - how can we help?`);
            points.push(`  • What support do you need during this challenging time?`);
          } else {
            points.push(`  • I noticed ${item.title} - what are your thoughts on this?`);
          }
        });
      }
    }

    // Health score talking points
    points.push(`\n📊 HEALTH SCORE DISCUSSION POINTS:`);
    points.push(`  • Your current health score is ${customer.healthScore || 'N/A'}/100`);
    points.push(`  • What factors do you think contribute most to your satisfaction?`);
    points.push(`  • Are there areas where you'd like to see improvement?`);

    // Usage and engagement points
    if (customer.usageData) {
      points.push(`\n💻 USAGE & ENGAGEMENT POINTS:`);
      points.push(`  • You have ${customer.usageData.activeUsersCount || 'N/A'} active users`);
      points.push(`  • Usage rate: ${customer.usageData.seatsUsed || 'N/A'}/${customer.usageData.seatsPurchased || 'N/A'} seats`);
      points.push(`  • How is the team adapting to our platform?`);
      points.push(`  • Are there features you'd like to explore more?`);
    }

    // Financial talking points
    if (customer.financialMetrics) {
      points.push(`\n💰 FINANCIAL DISCUSSION POINTS:`);
      
      // Contract renewal
      if (customer.financialMetrics.contractRenewalDate) {
        const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
        const daysToRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToRenewal <= 90 && daysToRenewal > 0) {
          points.push(`  • Contract renewal coming up in ${daysToRenewal} days - let's discuss your plans`);
          points.push(`  • What are your thoughts on renewing and any potential changes?`);
        }
      }
      
      // Outstanding balance
      if (customer.financialMetrics.outstandingBalance && customer.financialMetrics.outstandingBalance > 0) {
        points.push(`  • I notice there's an outstanding balance of $${customer.financialMetrics.outstandingBalance.toLocaleString()}`);
        points.push(`  • Let's discuss payment arrangements and any concerns you might have`);
      }
      
      // Payment reliability
      if (customer.financialMetrics.paymentReliability && customer.financialMetrics.paymentReliability !== 'excellent') {
        points.push(`  • I'd like to discuss our payment terms and see if we can improve the process`);
        points.push(`  • Are there any challenges with our current payment arrangements?`);
      }
      
      // Revenue growth opportunity
      if (customer.financialMetrics.annualRecurringRevenue && customer.financialMetrics.monthlyRecurringRevenue) {
        points.push(`  • Your ARR is $${customer.financialMetrics.annualRecurringRevenue.toLocaleString()} - great growth!`);
        points.push(`  • What are your expansion plans for the coming year?`);
      }
      
      // Credit score discussion
      if (customer.financialMetrics.creditScore && customer.financialMetrics.creditScore < 700) {
        points.push(`  • I'd like to understand your financial health and see how we can support you`);
        points.push(`  • Are there any financial challenges we should be aware of?`);
      }
    }

    return points.join('\n');
  }

  /**
   * Generate specific action items
   */
  private generateActionItems(customer: CustomerData, risks: RiskAssessment, insights: InsightData[]): string {
    const actions: string[] = [];

    actions.push(`📋 IMMEDIATE ACTION ITEMS:`);

    // Risk-based actions
    if (risks.overallRisk.level === 'critical') {
      actions.push(`  • Schedule executive escalation call within 24 hours`);
      actions.push(`  • Prepare retention action plan`);
      actions.push(`  • Assign dedicated account manager`);
    }

    if (risks.churnRisk.level === 'high' || risks.churnRisk.level === 'critical') {
      actions.push(`  • Implement churn prevention measures`);
      actions.push(`  • Review contract terms and renewal timeline`);
      actions.push(`  • Identify key stakeholders for retention conversations`);
    }

    if (risks.satisfactionRisk.level === 'high' || risks.satisfactionRisk.level === 'critical') {
      actions.push(`  • Implement customer satisfaction improvement plan`);
      actions.push(`  • Review support processes and response times`);
      actions.push(`  • Conduct customer feedback survey`);
    }

    if (risks.engagementRisk.level === 'high' || risks.engagementRisk.level === 'critical') {
      actions.push(`  • Increase meeting frequency to bi-weekly`);
      actions.push(`  • Re-engage key stakeholders with personalized outreach`);
      actions.push(`  • Schedule product training sessions`);
    }

    // Insight-based actions
    const criticalInsights = insights.filter(insight => insight.severity === 'red');
    if (criticalInsights.length > 0) {
      actions.push(`\n🔍 INSIGHT-BASED ACTIONS:`);
      criticalInsights.forEach(insight => {
        actions.push(`  • Address ${insight.type.replace(/_/g, ' ')}: ${insight.message}`);
      });
    }

    return actions.join('\n');
  }

  /**
   * Generate contextual questions
   */
  private generateQuestions(customer: CustomerData, risks: RiskAssessment, insights: InsightData[], customerNews?: any): string {
    const questions: string[] = [];

    questions.push(`❓ STRATEGIC QUESTIONS TO ASK:`);

    // Risk-based questions
    if (risks.churnRisk.level === 'high' || risks.churnRisk.level === 'critical') {
      questions.push(`  • What would make you consider renewing/extending your contract?`);
      questions.push(`  • Are there any concerns about our service that we should address?`);
      questions.push(`  • What would need to change for you to be completely satisfied?`);
    }

    if (risks.satisfactionRisk.level === 'high' || risks.satisfactionRisk.level === 'critical') {
      questions.push(`  • How would you rate your overall satisfaction with our support?`);
      questions.push(`  • What's been your biggest challenge with our platform?`);
      questions.push(`  • How can we improve your experience?`);
    }

    if (risks.engagementRisk.level === 'high' || risks.engagementRisk.level === 'critical') {
      questions.push(`  • How often would you like to meet to discuss your needs?`);
      questions.push(`  • Who else from your team should we be engaging with?`);
      questions.push(`  • What would make our relationship more valuable to you?`);
    }

    // News-based questions
    if (customerNews?.news) {
      const recentNews = customerNews.news.filter((item: any) => item.relevance === 'high').slice(0, 2);
      if (recentNews.length > 0) {
        questions.push(`\n📰 NEWS-BASED QUESTIONS:`);
        recentNews.forEach((item: any) => {
          if (item.impact === 'positive') {
            questions.push(`  • How does ${item.title} affect your business priorities?`);
            questions.push(`  • Are there new opportunities we should explore together?`);
          } else if (item.impact === 'negative') {
            questions.push(`  • How is ${item.title} impacting your operations?`);
            questions.push(`  • What support do you need during this challenging time?`);
          }
        });
      }
    }

    // Financial questions
    if (customer.financialMetrics) {
      questions.push(`\n💰 FINANCIAL QUESTIONS:`);
      
      // Contract renewal questions
      if (customer.financialMetrics.contractRenewalDate) {
        const renewalDate = new Date(customer.financialMetrics.contractRenewalDate);
        const daysToRenewal = Math.ceil((renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToRenewal <= 90 && daysToRenewal > 0) {
          questions.push(`  • What are your plans for contract renewal?`);
          questions.push(`  • Are you considering any changes to your current plan?`);
          questions.push(`  • What factors will influence your renewal decision?`);
        }
      }
      
      // Payment and billing questions
      if (customer.financialMetrics.outstandingBalance && customer.financialMetrics.outstandingBalance > 0) {
        questions.push(`  • What's the best way to resolve the outstanding balance?`);
        questions.push(`  • Are there any billing or payment issues we should address?`);
      }
      
      if (customer.financialMetrics.paymentReliability && customer.financialMetrics.paymentReliability !== 'excellent') {
        questions.push(`  • How can we make the payment process smoother for you?`);
        questions.push(`  • Would different payment terms work better for your business?`);
      }
      
      // Revenue and growth questions
      if (customer.financialMetrics.annualRecurringRevenue) {
        questions.push(`  • What's driving your revenue growth this year?`);
        questions.push(`  • How can we support your expansion plans?`);
        questions.push(`  • Are there additional services that would add value?`);
      }
    }

    // Growth and expansion questions
    questions.push(`\n🚀 GROWTH & EXPANSION QUESTIONS:`);
    questions.push(`  • What are your key business objectives for the next quarter?`);
    questions.push(`  • Are there new features or capabilities you'd like to explore?`);
    questions.push(`  • How can we help you achieve your goals more effectively?`);
    questions.push(`  • Are there other teams or departments that could benefit from our solution?`);

    return questions.join('\n');
  }
}

export default EnhancedMeetingPrepPromptGenerator;
