import { UserContextManager } from 'src/context/userContext';
import { searchTicketsByCustomer } from 'src/qdrant/service';
import { CustomerModel } from 'src/schemas';
import { EnhancedRecurringProblem, ProblemCluster, ENHANCED_THRESHOLDS } from './types';
import { analyzeRecurringPatterns } from './patternAnalysis.service';
import { generateEvidenceLinks } from './evidenceGeneration.service';
import { generateSpecificMessage, generateInvestigationSteps, generateRecommendation } from './messageGeneration.service';

export async function generateEnhancedRecurringProblemsInsights(customerId: string): Promise<EnhancedRecurringProblem[]> {
  const organizationId = UserContextManager.getCurrentOrganizationId();
  console.log(`[Enhanced Recurring Problems] ▶️ start | org=${organizationId} customer=${customerId}`);
  
  const insights: EnhancedRecurringProblem[] = [];
  
  if (!organizationId) {
    console.log(`[Enhanced Recurring Problems] ⚠️ no organization context`);
    return insights;
  }

  try {
    
    // Get recent tickets for the customer
    const recentTickets = await searchTicketsByCustomer(customerId, 100);
    
    if (recentTickets.length === 0) {
      console.log(`[Enhanced Recurring Problems] ℹ️ no tickets found for customer`);
      return insights;
    }

    // Filter tickets within the analysis window
    const analysisWindow = new Date();
    analysisWindow.setDate(analysisWindow.getDate() - ENHANCED_THRESHOLDS.PATTERN_TIME_WINDOW_DAYS);
    const windowStartTime = analysisWindow.getTime();
    
    const recentTicketsInWindow = recentTickets.filter(ticket => 
      ticket.payload.created_at > windowStartTime
    );

    console.log(`[Enhanced Recurring Problems] 📊 analyzing ${recentTicketsInWindow.length} tickets in ${ENHANCED_THRESHOLDS.PATTERN_TIME_WINDOW_DAYS} day window`);

    if (recentTicketsInWindow.length < ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS) {
      console.log(`[Enhanced Recurring Problems] ℹ️ insufficient tickets for pattern analysis`);
      return insights;
    }

    // Analyze for recurring patterns using multiple approaches
    const problemClusters = await analyzeRecurringPatterns(recentTicketsInWindow, organizationId);
    
    // Convert clusters to insights
    for (const cluster of problemClusters) {
      const insight = await createInsightFromCluster(cluster, customerId, organizationId);
      if (insight) {
        insights.push(insight);
      }
    }

    console.log(`[Enhanced Recurring Problems] ✅ generated ${insights.length} enhanced insights`);
    return insights;
    
  } catch (error) {
    console.error(`[Enhanced Recurring Problems] ❌ error:`, error);
    return insights;
  }
}

async function createInsightFromCluster(cluster: ProblemCluster, customerId: string, organizationId: string): Promise<EnhancedRecurringProblem | null> {
  try {
    // Get customer name for context
    const customer = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
    const customerName = customer?.name || 'Customer';
    
    // Generate specific message based on cluster analysis
    const message = await generateSpecificMessage(cluster, customerName);
    
    // Generate investigation steps
    const investigationSteps = await generateInvestigationSteps(cluster);
    
    // Generate recommendation
    const recommendation = await generateRecommendation(cluster);
    
    // Prepare evidence
    const evidence = {
      sampleTickets: cluster.tickets.slice(0, 3).map(ticket => ({
        id: ticket.payload.ticket_id || 'unknown',
        subject: ticket.payload.subject || 'No subject',
        description: (ticket.payload.description || 'No description').substring(0, 200) + '...',
        createdAt: new Date(ticket.payload.created_at).toISOString(),
        customerId: ticket.payload.customer_id || 'unknown',
      })),
      errorMessages: cluster.errorMessages,
      timePattern: cluster.timePattern,
      links: await generateEvidenceLinks(cluster, organizationId),
    };
    
    return {
      type: 'recurring_problems',
      message,
      severity: cluster.severity === 'high' ? 'red' : cluster.severity === 'medium' ? 'yellow' : 'info',
      category: 'risk',
      meta: {
        issue: cluster.pattern,
        frequency: cluster.frequency,
        affectedCustomers: Array.from(cluster.affectedCustomers),
        timeRange: `${ENHANCED_THRESHOLDS.PATTERN_TIME_WINDOW_DAYS} days`,
        errorPatterns: cluster.errorMessages,
        businessImpact: cluster.businessImpact,
        ticketIds: cluster.tickets.map(t => t.payload.ticket_id).filter(Boolean),
        resolutionPattern: 'TBD', // Could be enhanced to analyze resolution patterns
        recommendation,
        investigationSteps,
        evidence,
      },
    };
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error creating insight from cluster:', error);
    return null;
  }
}
