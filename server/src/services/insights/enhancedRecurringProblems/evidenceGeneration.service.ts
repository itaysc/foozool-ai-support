import { ProblemCluster, EvidenceLink } from './types';

export async function generateEvidenceLinks(cluster: ProblemCluster, organizationId: string): Promise<EvidenceLink[]> {
  const links: EvidenceLink[] = [];

  try {
    // Generate ticket links
    if (cluster.tickets.length > 0) {
      const ticketIds = cluster.tickets.map(t => t.payload.ticket_id).filter(Boolean);
      if (ticketIds.length > 0) {
        links.push({
          label: `View ${ticketIds.length} Related Tickets`,
          url: `/tickets?ids=${ticketIds.slice(0, 5).join(',')}`, // Limit to first 5 tickets
          type: 'ticket',
          description: `Direct links to tickets: ${ticketIds.slice(0, 3).join(', ')}${ticketIds.length > 3 ? '...' : ''}`
        });
      }
    }

    // Generate log links based on error patterns
    if (cluster.errorMessages.length > 0) {
      const errorTypes = extractErrorTypes(cluster.errorMessages);
      for (const errorType of errorTypes) {
        links.push({
          label: `View ${errorType} Logs`,
          url: `/logs?filter=${encodeURIComponent(errorType)}&timeframe=7d`,
          type: 'log',
          description: `Recent logs containing ${errorType} errors`
        });
      }
    }

    // Generate system monitoring links
    if (cluster.pattern.toLowerCase().includes('api') || cluster.pattern.toLowerCase().includes('authentication')) {
      links.push({
        label: 'API Health Dashboard',
        url: `/dashboard/api-health`,
        type: 'dashboard',
        description: 'Monitor API performance and error rates'
      });
    }

    if (cluster.pattern.toLowerCase().includes('database') || cluster.pattern.toLowerCase().includes('connection')) {
      links.push({
        label: 'Database Monitoring',
        url: `/dashboard/database`,
        type: 'dashboard',
        description: 'Database performance and connection metrics'
      });
    }

    // Generate documentation links based on patterns
    const docLinks = generateDocumentationLinks(cluster.pattern);
    links.push(...docLinks);

    // Generate customer-specific links
    const customerIds = Array.from(cluster.affectedCustomers);
    if (customerIds.length > 0) {
      links.push({
        label: `Customer Details (${customerIds.length} affected)`,
        url: `/customers?ids=${customerIds.slice(0, 3).join(',')}`,
        type: 'system',
        description: `View details for affected customers`
      });
    }

    // Limit to most relevant links (max 8)
    return links.slice(0, 8);

  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error generating evidence links:', error);
    return [];
  }
}

function extractErrorTypes(errorMessages: string[]): string[] {
  const errorTypes = new Set<string>();
  
  for (const message of errorMessages) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('invalid_token') || lowerMessage.includes('authentication')) {
      errorTypes.add('authentication');
    }
    if (lowerMessage.includes('timeout') || lowerMessage.includes('connection')) {
      errorTypes.add('timeout');
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('sql')) {
      errorTypes.add('database');
    }
    if (lowerMessage.includes('api') || lowerMessage.includes('http')) {
      errorTypes.add('api');
    }
    if (lowerMessage.includes('memory') || lowerMessage.includes('resource')) {
      errorTypes.add('resource');
    }
  }
  
  return Array.from(errorTypes);
}

function generateDocumentationLinks(pattern: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];

  const lowerPattern = pattern.toLowerCase();

  if (lowerPattern.includes('authentication') || lowerPattern.includes('login')) {
    links.push({
      label: 'Authentication Troubleshooting Guide',
      url: '/docs/authentication-troubleshooting',
      type: 'documentation',
      description: 'Common authentication issues and solutions'
    });
  }

  if (lowerPattern.includes('api') || lowerPattern.includes('integration')) {
    links.push({
      label: 'API Integration Best Practices',
      url: '/docs/api-integration',
      type: 'documentation',
      description: 'API integration guidelines and troubleshooting'
    });
  }

  if (lowerPattern.includes('database') || lowerPattern.includes('connection')) {
    links.push({
      label: 'Database Connection Issues',
      url: '/docs/database-troubleshooting',
      type: 'documentation',
      description: 'Database connectivity and performance issues'
    });
  }

  if (lowerPattern.includes('performance') || lowerPattern.includes('slow')) {
    links.push({
      label: 'Performance Optimization Guide',
      url: '/docs/performance-optimization',
      type: 'documentation',
      description: 'System performance tuning and optimization'
    });
  }

  // Always include general troubleshooting
  links.push({
    label: 'General Troubleshooting Guide',
    url: '/docs/troubleshooting',
    type: 'documentation',
    description: 'General issue resolution procedures'
  });

  return links;
}
