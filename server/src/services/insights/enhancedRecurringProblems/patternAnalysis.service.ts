import { ProblemCluster, ProblemTheme, ENHANCED_THRESHOLDS } from './types';
import { summarizeTickets } from 'src/services/call-python';
import { callLLM } from 'src/services/llm';
import { UserContextManager } from 'src/context/userContext';

export async function analyzeRecurringPatterns(tickets: any[], organizationId: string): Promise<ProblemCluster[]> {
  const clusters: ProblemCluster[] = [];
  
  // Approach 1: Content-based clustering using LLM analysis
  const contentClusters = await analyzeContentPatterns(tickets);
  
  // Approach 2: Error message pattern detection
  const errorClusters = await analyzeErrorPatterns(tickets);
  
  // Approach 3: Intent-based grouping
  const intentClusters = await analyzeIntentPatterns(tickets);
  
  // Approach 4: Time-based pattern detection
  const temporalClusters = await analyzeTemporalPatterns(tickets);
  
  // Combine and deduplicate clusters
  const allClusters = [...contentClusters, ...errorClusters, ...intentClusters, ...temporalClusters];
  const mergedClusters = mergeSimilarClusters(allClusters);
  
  // Filter clusters that meet our thresholds
  const validClusters = mergedClusters.filter(cluster => 
    cluster.frequency >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS &&
    cluster.affectedCustomers.size >= 1 // At least one customer (could be the same customer with multiple issues)
  );
  
  console.log(`[Enhanced Recurring Problems] 📊 found ${validClusters.length} valid problem clusters`);
  return validClusters;
}

async function analyzeContentPatterns(tickets: any[]): Promise<ProblemCluster[]> {
  const clusters: ProblemCluster[] = [];
  
  try {
    // Use LLM to identify common problem themes
    const ticketSummaries = await summarizeTickets(tickets.map(t => ({
      subject: t.payload.subject || '',
      description: t.payload.description || ''
    })));
    
    // Group tickets by similarity using LLM analysis
    const problemThemes = await identifyProblemThemes(tickets, ticketSummaries);
    
    for (const theme of problemThemes) {
      if (theme.tickets.length >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS) {
        const cluster = await createClusterFromTheme(theme, tickets);
        if (cluster) {
          clusters.push(cluster);
        }
      }
    }
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error in content pattern analysis:', error);
  }
  
  return clusters;
}

async function analyzeErrorPatterns(tickets: any[]): Promise<ProblemCluster[]> {
  const clusters: ProblemCluster[] = [];
  const errorPatterns: { [pattern: string]: any[] } = {};
  
  // Extract error messages and patterns from ticket content
  for (const ticket of tickets) {
    const content = `${ticket.payload.subject || ''} ${ticket.payload.description || ''}`.toLowerCase();
    
    // Look for common error patterns
    const patterns = extractErrorPatterns(content);
    
    for (const pattern of patterns) {
      if (!errorPatterns[pattern]) {
        errorPatterns[pattern] = [];
      }
      errorPatterns[pattern].push(ticket);
    }
  }
  
  // Create clusters for significant error patterns
  for (const [pattern, patternTickets] of Object.entries(errorPatterns)) {
    if (patternTickets.length >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS) {
      const cluster = createErrorCluster(pattern, patternTickets);
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

async function analyzeIntentPatterns(tickets: any[]): Promise<ProblemCluster[]> {
  const clusters: ProblemCluster[] = [];
  const intentGroups: { [intent: string]: any[] } = {};
  
  // Group tickets by intent
  for (const ticket of tickets) {
    const intent = ticket.payload.intent || 'unknown';
    if (!intentGroups[intent]) {
      intentGroups[intent] = [];
    }
    intentGroups[intent].push(ticket);
  }
  
  // Create clusters for frequent intents
  for (const [intent, intentTickets] of Object.entries(intentGroups)) {
    if (intentTickets.length >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS && intent !== 'unknown') {
      const cluster = createIntentCluster(intent, intentTickets);
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

async function analyzeTemporalPatterns(tickets: any[]): Promise<ProblemCluster[]> {
  const clusters: ProblemCluster[] = [];
  
  // Group tickets by time patterns (hour of day, day of week)
  const timeGroups: { [pattern: string]: any[] } = {};
  
  for (const ticket of tickets) {
    const date = new Date(ticket.payload.created_at);
    const hourPattern = `hour_${date.getHours()}`;
    const dayPattern = `day_${date.getDay()}`;
    const timePattern = `${dayPattern}_${hourPattern}`;
    
    if (!timeGroups[timePattern]) {
      timeGroups[timePattern] = [];
    }
    timeGroups[timePattern].push(ticket);
  }
  
  // Create clusters for significant time patterns
  for (const [pattern, patternTickets] of Object.entries(timeGroups)) {
    if (patternTickets.length >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS) {
      const cluster = createTemporalCluster(pattern, patternTickets);
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

async function identifyProblemThemes(tickets: any[], summaries: string[]): Promise<ProblemTheme[]> {
  try {
    const prompt = `
    Analyze these ticket summaries and identify recurring problem themes. Group tickets that describe similar issues.
    
    Ticket Summaries:
    ${summaries.map((summary, i) => `${i + 1}. ${summary}`).join('\n')}
    
    Return a JSON array where each object has:
    - "theme": A clear description of the recurring problem
    - "ticketIndices": Array of ticket indices (0-based) that belong to this theme
    
    Focus on identifying:
    1. Technical issues (errors, failures, bugs)
    2. Process problems (confusion, workflow issues)
    3. Integration issues (API problems, data sync issues)
    4. Performance problems (slow responses, timeouts)
    5. Authentication/access issues
    
    Only group tickets that clearly describe the same underlying problem. Be specific about what the problem actually is.
    
    Return only valid JSON, no other text.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at analyzing support tickets and identifying recurring problem patterns.',
      prompt,
      maxTokens: 2000,
      temperature: 0.1,
    });

    if (!response.data) {
      throw new Error('No response from LLM');
    }

    const themes = JSON.parse(response.data);
    
    // Convert indices back to actual tickets
    return themes.map((theme: any) => ({
      theme: theme.theme,
      tickets: theme.ticketIndices.map((index: number) => tickets[index]).filter(Boolean)
    }));
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error identifying problem themes:', error);
    return [];
  }
}

function extractErrorPatterns(content: string): string[] {
  const patterns: string[] = [];
  
  // Common error patterns
  const errorRegexes = [
    { pattern: /error\s+(\d+)/gi, name: 'HTTP_ERROR' },
    { pattern: /exception:\s*([^\n]+)/gi, name: 'EXCEPTION' },
    { pattern: /failed\s+to\s+([^\n]+)/gi, name: 'FAILURE' },
    { pattern: /timeout/gi, name: 'TIMEOUT' },
    { pattern: /unauthorized/gi, name: 'AUTH_ERROR' },
    { pattern: /not\s+found/gi, name: 'NOT_FOUND' },
    { pattern: /connection\s+refused/gi, name: 'CONNECTION_ERROR' },
    { pattern: /invalid\s+([^\n]+)/gi, name: 'INVALID_DATA' },
    { pattern: /api\s+key/gi, name: 'API_KEY_ISSUE' },
    { pattern: /authentication\s+failed/gi, name: 'AUTH_FAILED' },
  ];
  
  for (const { pattern, name } of errorRegexes) {
    const matches = content.match(pattern);
    if (matches) {
      patterns.push(name);
    }
  }
  
  return patterns;
}

async function createClusterFromTheme(theme: ProblemTheme, allTickets: any[]): Promise<ProblemCluster | null> {
  const tickets = theme.tickets;
  
  if (tickets.length < ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS) {
    return null;
  }
  
  // Analyze the cluster
  const affectedCustomers = new Set(tickets.map(t => t.payload.customer_id).filter(Boolean));
  const errorMessages = extractErrorMessages(tickets);
  const timePattern = analyzeTimePattern(tickets);
  const businessImpact = assessBusinessImpact(tickets, affectedCustomers.size);
  
  return {
    pattern: theme.theme,
    tickets,
    frequency: tickets.length,
    severity: determineSeverity(tickets.length, affectedCustomers.size, errorMessages.length),
    errorMessages,
    timePattern,
    affectedCustomers,
    businessImpact,
  };
}

function createErrorCluster(pattern: string, tickets: any[]): ProblemCluster {
  const affectedCustomers = new Set(tickets.map(t => t.payload.customer_id).filter(Boolean));
  const errorMessages = extractErrorMessages(tickets);
  const timePattern = analyzeTimePattern(tickets);
  const businessImpact = assessBusinessImpact(tickets, affectedCustomers.size);
  
  return {
    pattern: `Error Pattern: ${pattern}`,
    tickets,
    frequency: tickets.length,
    severity: determineSeverity(tickets.length, affectedCustomers.size, errorMessages.length),
    errorMessages,
    timePattern,
    affectedCustomers,
    businessImpact,
  };
}

function createIntentCluster(intent: string, tickets: any[]): ProblemCluster {
  const affectedCustomers = new Set(tickets.map(t => t.payload.customer_id).filter(Boolean));
  const errorMessages = extractErrorMessages(tickets);
  const timePattern = analyzeTimePattern(tickets);
  const businessImpact = assessBusinessImpact(tickets, affectedCustomers.size);
  
  return {
    pattern: `Intent Pattern: ${intent}`,
    tickets,
    frequency: tickets.length,
    severity: determineSeverity(tickets.length, affectedCustomers.size, errorMessages.length),
    errorMessages,
    timePattern,
    affectedCustomers,
    businessImpact,
  };
}

function createTemporalCluster(pattern: string, tickets: any[]): ProblemCluster {
  const affectedCustomers = new Set(tickets.map(t => t.payload.customer_id).filter(Boolean));
  const errorMessages = extractErrorMessages(tickets);
  const timePattern = analyzeTimePattern(tickets);
  const businessImpact = assessBusinessImpact(tickets, affectedCustomers.size);
  
  return {
    pattern: `Time Pattern: ${pattern}`,
    tickets,
    frequency: tickets.length,
    severity: determineSeverity(tickets.length, affectedCustomers.size, errorMessages.length),
    errorMessages,
    timePattern,
    affectedCustomers,
    businessImpact,
  };
}

function extractErrorMessages(tickets: any[]): string[] {
  const messages: string[] = [];
  
  for (const ticket of tickets) {
    const content = `${ticket.payload.subject || ''} ${ticket.payload.description || ''}`;
    
    // Extract specific error messages
    const errorMatches = content.match(/error[^.!?]*[.!?]/gi);
    if (errorMatches) {
      messages.push(...errorMatches.map(msg => msg.trim()));
    }
    
    const exceptionMatches = content.match(/exception[^.!?]*[.!?]/gi);
    if (exceptionMatches) {
      messages.push(...exceptionMatches.map(msg => msg.trim()));
    }
  }
  
  // Remove duplicates and limit to most relevant
  return Array.from(new Set(messages)).slice(0, 5);
}

function analyzeTimePattern(tickets: any[]): string {
  if (tickets.length === 0) return 'No pattern';
  
  const hours = tickets.map(t => new Date(t.payload.created_at).getHours());
  const days = tickets.map(t => new Date(t.payload.created_at).getDay());
  
  const avgHour = hours.reduce((sum, h) => sum + h, 0) / hours.length;
  const avgDay = days.reduce((sum, d) => sum + d, 0) / days.length;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return `Average: ${dayNames[Math.round(avgDay)]} at ${Math.round(avgHour)}:00`;
}

function assessBusinessImpact(tickets: any[], customerCount: number): string {
  if (customerCount >= ENHANCED_THRESHOLDS.CRITICAL_IMPACT_CUSTOMERS) {
    return 'Critical - Multiple customers affected';
  } else if (customerCount >= ENHANCED_THRESHOLDS.HIGH_IMPACT_CUSTOMERS) {
    return 'High - Several customers affected';
  } else if (tickets.length >= ENHANCED_THRESHOLDS.CRITICAL_PATTERN_TICKETS) {
    return 'High - Frequent occurrence';
  } else {
    return 'Medium - Recurring pattern detected';
  }
}

function determineSeverity(frequency: number, customerCount: number, errorCount: number): 'high' | 'medium' | 'low' {
  if (frequency >= ENHANCED_THRESHOLDS.CRITICAL_PATTERN_TICKETS || 
      customerCount >= ENHANCED_THRESHOLDS.CRITICAL_IMPACT_CUSTOMERS ||
      errorCount >= 3) {
    return 'high';
  } else if (frequency >= ENHANCED_THRESHOLDS.MIN_PATTERN_TICKETS + 2 ||
             customerCount >= ENHANCED_THRESHOLDS.HIGH_IMPACT_CUSTOMERS ||
             errorCount >= 1) {
    return 'medium';
  } else {
    return 'low';
  }
}

function mergeSimilarClusters(clusters: ProblemCluster[]): ProblemCluster[] {
  // Simple deduplication - in a real implementation, you'd want more sophisticated merging
  const merged: ProblemCluster[] = [];
  const seen = new Set<string>();
  
  for (const cluster of clusters) {
    const key = `${cluster.pattern}_${cluster.frequency}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(cluster);
    }
  }
  
  return merged;
}
