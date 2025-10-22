import { CustomerSuccessInsight } from '../../types/customerSuccessInsight';
import { IDocument } from '../../schemas/document.schema';
import { ObjectId } from 'mongoose';

interface EvidenceLink {
  label: string;
  url: string;
  type: 'document' | 'dashboard' | 'customer' | 'tickets' | 'system' | 'other';
  description?: string;
}

/**
 * Generate evidence links for document insights
 */
function generateDocumentEvidenceLinks(document: IDocument, customerId?: string): EvidenceLink[] {
  const links: EvidenceLink[] = [];
  
  // Link to the specific document
  links.push({
    label: `View Document: ${document.title}`,
    url: `/docs/${document._id}`,
    type: 'document',
    description: `Direct link to the analyzed document: ${document.title}`
  });
  
  // Link to customer dashboard if customer is associated
  if (customerId) {
    links.push({
      label: 'Customer Dashboard',
      url: `/customers/${customerId}`,
      type: 'customer',
      description: `View customer profile and all associated insights`
    });
    
    links.push({
      label: 'Customer Documents',
      url: `/docs?customer=${customerId}`,
      type: 'document',
      description: `View all documents associated with this customer`
    });
  }
  
  // Link to documents folder if document is in a folder
  if (document.folderPath && document.folderPath !== '/') {
    links.push({
      label: `View Folder: ${document.folderPath}`,
      url: `/docs/folders${document.folderPath}`,
      type: 'document',
      description: `Browse documents in the same folder`
    });
  }
  
  // Link to customer tickets if customer is associated
  if (customerId) {
    links.push({
      label: 'Customer Tickets',
      url: `/tickets?customer=${customerId}`,
      type: 'tickets',
      description: `View all support tickets for this customer`
    });
    
    links.push({
      label: 'Customer Insights',
      url: `/insights?customer=${customerId}`,
      type: 'dashboard',
      description: `View all insights for this customer`
    });
  }
  
  // Link to all documents for the organization
  links.push({
    label: 'All Documents',
    url: '/docs',
    type: 'document',
    description: 'Browse all documents in the organization'
  });
  
  return links;
}

/**
 * Generate document-based customer insights
 */
export function generateDocumentInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  
  if (!analysis || !analysis.autoClassification) {
    return insights;
  }

  const { autoClassification } = analysis;
  const now = new Date();

  // Generate insights based on document type and analysis results
  switch (document.documentType) {
    case 'meeting_summary':
      insights.push(...generateMeetingSummaryInsights(document, autoClassification, customerName));
      break;
    case 'note':
      insights.push(...generateNoteInsights(document, autoClassification, customerName));
      break;
    case 'report':
      insights.push(...generateReportInsights(document, autoClassification, customerName));
      break;
    case 'other':
      insights.push(...generateCustomerFeedbackInsights(document, autoClassification, customerName));
      break;
    default:
      insights.push(...generateGeneralDocumentInsights(document, autoClassification, customerName));
  }

  // Generate sentiment-based insights
  if (autoClassification.sentiment) {
    insights.push(...generateSentimentInsights(document, autoClassification, customerName));
  }

  // Generate topic-based insights
  if (autoClassification.topics && autoClassification.topics.length > 0) {
    insights.push(...generateTopicInsights(document, autoClassification, customerName));
  }

  // Generate business relevance insights
  if (autoClassification.businessRelevance > 0.7) {
    insights.push(...generateHighRelevanceInsights(document, autoClassification, customerName));
  }

  console.log(`[Document Insights] 📄 Generated ${insights.length} insights for document: ${document.title}`);
  return insights;
}

/**
 * Generate insights from meeting summaries
 */
function generateMeetingSummaryInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // High engagement meeting insight
  if (analysis.businessRelevance > 0.8 && analysis.sentiment === 'positive') {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    
    insights.push({
      type: 'stakeholder_engagement_gap',
      message: `High-value meeting detected with ${customerDisplay} - Strong engagement and positive sentiment indicates active collaboration`,
      severity: 'info',
      category: 'customer_success',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        meetingType: document.meetingType,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          meetingType: document.meetingType,
          sentiment: analysis.sentiment,
          businessRelevance: analysis.businessRelevance,
          confidence: analysis.confidence,
          topics: analysis.topics,
          meetingDate: document.createdAt,
          documentType: document.documentType
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `This meeting shows strong customer engagement with positive sentiment and high business relevance`,
        whyItMatters: 'High-value meetings indicate active collaboration and potential for deeper relationship building',
        signals: [
          `Positive sentiment detected in meeting content`,
          `High business relevance score: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Meeting topics: ${analysis.topics?.join(', ') || 'General discussion'}`,
          `Meeting confidence: ${Math.round(analysis.confidence * 100)}%`
        ],
        recommendedActions: [
          'Schedule follow-up meeting to maintain momentum',
          'Share meeting summary with relevant team members',
          'Add action items to customer success plan',
          'Update customer health score based on positive engagement',
          'Review meeting notes for specific commitments and next steps'
        ],
        investigationPath: [
          'Review meeting agenda and outcomes',
          'Check if action items were completed',
          'Assess customer satisfaction with meeting',
          'Identify next steps for relationship development',
          'Follow up on any commitments made during the meeting'
        ],
        considerations: [
          'Monitor for sustained engagement patterns',
          'Ensure follow-through on commitments made',
          'Leverage positive momentum for upselling opportunities',
          'Document successful engagement strategies for future meetings'
        ],
        owner: 'Customer Success Manager',
        sla: { name: 'Follow-up Meeting', amount: 3, unit: 'days' }
      }
    });
  }

  // Meeting sentiment decline insight
  if (analysis.sentiment === 'negative' && analysis.businessRelevance > 0.6) {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    
    insights.push({
      type: 'sentiment_decline',
      message: `Meeting with ${customerDisplay} shows concerning sentiment - Negative feedback detected in recent meeting`,
      severity: 'red',
      category: 'risk',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        meetingType: document.meetingType,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          meetingType: document.meetingType,
          sentiment: analysis.sentiment,
          businessRelevance: analysis.businessRelevance,
          confidence: analysis.confidence,
          topics: analysis.topics,
          meetingDate: document.createdAt,
          documentType: document.documentType,
          urgencyLevel: 'high'
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `Negative sentiment detected in customer meeting requires immediate attention`,
        whyItMatters: 'Negative sentiment in meetings can indicate underlying issues that may lead to churn',
        signals: [
          `Negative sentiment detected in meeting content`,
          `High business relevance indicates this is a significant concern`,
          `Topics discussed: ${analysis.topics?.join(', ') || 'General discussion'}`,
          `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`
        ],
        recommendedActions: [
          'Schedule immediate follow-up call with customer',
          'Escalate to account manager or customer success director',
          'Review recent service delivery and support interactions',
          'Prepare action plan to address concerns raised',
          'Document specific issues mentioned in meeting for resolution tracking'
        ],
        investigationPath: [
          'Analyze specific issues mentioned in meeting',
          'Check recent ticket history and resolution times',
          'Review contract terms and service level agreements',
          'Assess impact on customer satisfaction and retention risk',
          'Identify root causes of negative sentiment'
        ],
        considerations: [
          'Monitor for additional negative feedback',
          'Prepare for potential escalation or churn risk',
          'Consider offering additional support or resources',
          'Implement immediate mitigation strategies'
        ],
        owner: 'Customer Success Manager',
        sla: { name: 'Urgent Follow-up', amount: 4, unit: 'hours' }
      }
    });
  }

  return insights;
}

/**
 * Generate insights from notes
 */
function generateNoteInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // Feature request or requirement insight
  if (analysis.topics?.some((topic: string) => 
    ['feature', 'requirement', 'enhancement', 'improvement'].includes(topic.toLowerCase())
  )) {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    const featureTopics = analysis.topics?.filter((t: string) => 
      ['feature', 'requirement', 'enhancement', 'improvement'].includes(t.toLowerCase())
    ) || [];
    
    insights.push({
      type: 'solution_gap',
      message: `Feature request documented for ${customerDisplay} - Customer has identified potential solution gaps`,
      severity: 'yellow',
      category: 'upsell',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence,
        featureTopics: featureTopics,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          featureTopics: featureTopics,
          sentiment: analysis.sentiment,
          businessRelevance: analysis.businessRelevance,
          confidence: analysis.confidence,
          documentType: document.documentType,
          documentDate: document.createdAt,
          urgencyLevel: analysis.businessRelevance > 0.8 ? 'high' : 'medium'
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `Customer has documented feature requests or requirements that could indicate solution gaps`,
        whyItMatters: 'Feature requests often indicate areas where current solution may not fully meet customer needs',
        signals: [
          `Feature-related topics identified: ${featureTopics.join(', ') || 'General requirements'}`,
          `Business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Sentiment: ${analysis.sentiment}`,
          `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`
        ],
        recommendedActions: [
          'Review feature roadmap and existing capabilities',
          'Assess if requests align with product development plans',
          'Identify potential workarounds or alternative solutions',
          'Schedule product demo or consultation if needed',
          'Document specific feature requests for product team review'
        ],
        investigationPath: [
          'Analyze specific feature requests mentioned in document',
          'Check if similar requests exist from other customers',
          'Evaluate current solution limitations',
          'Assess potential for custom development or integration',
          'Review customer usage patterns to validate need'
        ],
        considerations: [
          'Balance customer needs with product roadmap priorities',
          'Consider impact on customer satisfaction and retention',
          'Explore partnership opportunities or third-party integrations',
          'Assess potential for upselling additional features'
        ],
        owner: 'Product Manager',
        sla: { name: 'Feature Request Review', amount: 5, unit: 'days' }
      }
    });
  }

  return insights;
}

/**
 * Generate insights from reports
 */
function generateReportInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // High-value report insight
  if (analysis.businessRelevance > 0.8) {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    
    insights.push({
      type: 'correlation_to_value',
      message: `High-value report generated for ${customerDisplay} - Comprehensive analysis indicates strong customer engagement`,
      severity: 'info',
      category: 'strategic',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          reportType: document.documentType,
          sentiment: analysis.sentiment,
          businessRelevance: analysis.businessRelevance,
          confidence: analysis.confidence,
          topics: analysis.topics,
          reportDate: document.createdAt,
          valueLevel: 'high'
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `High-value report indicates strong customer engagement and strategic importance`,
        whyItMatters: 'Comprehensive reports often indicate customers are deriving significant value from the solution',
        signals: [
          `High business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Report topics: ${analysis.topics?.join(', ') || 'General analysis'}`,
          `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`,
          `Report sentiment: ${analysis.sentiment}`
        ],
        recommendedActions: [
          'Share report insights with executive team',
          'Use report as success story for other customers',
          'Schedule strategic review meeting with customer',
          'Identify opportunities for expanded partnership',
          'Document key findings for future reference'
        ],
        investigationPath: [
          'Review report content and key findings',
          'Assess customer satisfaction with solution',
          'Identify areas for further collaboration',
          'Evaluate potential for expanded engagement',
          'Analyze report for case study potential'
        ],
        considerations: [
          'Leverage positive engagement for relationship building',
          'Consider customer for case study or reference',
          'Monitor for continued high-value interactions',
          'Use insights to improve solution delivery'
        ],
        owner: 'Customer Success Director',
        sla: { name: 'Strategic Review', amount: 7, unit: 'days' }
      }
    });
  }

  return insights;
}

/**
 * Generate insights from customer feedback
 */
function generateCustomerFeedbackInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // Positive feedback insight
  if (analysis.sentiment === 'positive') {
    insights.push({
      type: 'positive_feedback',
      message: `Positive feedback received from ${customerDisplay} - Customer satisfaction indicators are strong`,
      severity: 'info',
      category: 'customer_success',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      guidance: {
        summary: `Positive customer feedback indicates strong satisfaction and potential for growth`,
        whyItMatters: 'Positive feedback is valuable for retention, upselling, and generating references',
        signals: [
          `Positive sentiment detected in feedback`,
          `Business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Feedback topics: ${analysis.topics?.join(', ') || 'General satisfaction'}`
        ],
        recommendedActions: [
          'Share positive feedback with internal teams',
          'Request permission to use as testimonial',
          'Identify opportunities for case study development',
          'Schedule check-in to maintain positive relationship'
        ],
        investigationPath: [
          'Review specific positive feedback points',
          'Identify what is driving customer satisfaction',
          'Assess potential for expanded engagement',
          'Evaluate customer for reference or case study'
        ],
        considerations: [
          'Maintain momentum of positive relationship',
          'Leverage feedback for team recognition',
          'Use insights to improve service delivery'
        ],
        owner: 'Customer Success Manager',
        sla: { name: 'Feedback Follow-up', amount: 2, unit: 'days' }
      }
    });
  }

  return insights;
}

/**
 * Generate general document insights
 */
function generateGeneralDocumentInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // High engagement document insight
  if (analysis.businessRelevance > 0.7) {
    insights.push({
      type: 'engagement_trends',
      message: `High-engagement document created for ${customerDisplay} - Strong business relevance indicates active collaboration`,
      severity: 'info',
      category: 'customer_success',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        confidence: analysis.confidence
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      guidance: {
        summary: `High-engagement document indicates strong customer collaboration and business relevance`,
        whyItMatters: 'High-engagement documents often indicate customers are actively using and deriving value from the solution',
        signals: [
          `High business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Document topics: ${analysis.topics?.join(', ') || 'General discussion'}`,
          `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`
        ],
        recommendedActions: [
          'Review document content for insights',
          'Schedule follow-up discussion if needed',
          'Share relevant information with team',
          'Update customer success plan based on content'
        ],
        investigationPath: [
          'Analyze document content and key points',
          'Assess customer engagement level',
          'Identify opportunities for further collaboration',
          'Evaluate document for knowledge sharing'
        ],
        considerations: [
          'Maintain high engagement levels',
          'Leverage insights for relationship building',
          'Monitor for continued active collaboration'
        ],
        owner: 'Customer Success Manager',
        sla: { name: 'Content Review', amount: 3, unit: 'days' }
      }
    });
  }

  return insights;
}

/**
 * Generate sentiment-based insights
 */
function generateSentimentInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // Negative sentiment insight
  if (analysis.sentiment === 'negative' && analysis.confidence > 0.6) {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    
    insights.push({
      type: 'sentiment_decline',
      message: `Negative sentiment detected in ${customerDisplay} communication - Requires immediate attention`,
      severity: 'red',
      category: 'risk',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          businessRelevance: analysis.businessRelevance,
          topics: analysis.topics,
          documentType: document.documentType,
          documentDate: document.createdAt,
          urgencyLevel: 'critical'
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `Negative sentiment in customer communication requires immediate attention`,
        whyItMatters: 'Negative sentiment can indicate underlying issues that may lead to customer churn',
        signals: [
          `Negative sentiment detected with ${Math.round(analysis.confidence * 100)}% confidence`,
          `Business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Topics: ${analysis.topics?.join(', ') || 'General communication'}`,
          `Document type: ${document.documentType}`
        ],
        recommendedActions: [
          'Schedule immediate follow-up call with customer',
          'Escalate to customer success manager or director',
          'Review recent interactions and service delivery',
          'Prepare action plan to address concerns',
          'Document specific issues mentioned for resolution tracking'
        ],
        investigationPath: [
          'Analyze specific issues mentioned in communication',
          'Check recent ticket history and support interactions',
          'Review contract terms and service level agreements',
          'Assess overall customer satisfaction and retention risk',
          'Identify root causes of negative sentiment'
        ],
        considerations: [
          'Monitor for additional negative communications',
          'Prepare for potential escalation or churn risk',
          'Consider offering additional support or resources',
          'Implement immediate mitigation strategies'
        ],
        owner: 'Customer Success Manager',
        sla: { name: 'Urgent Follow-up', amount: 4, unit: 'hours' }
      }
    });
  }

  return insights;
}

/**
 * Generate topic-based insights
 */
function generateTopicInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // Check for specific high-impact topics
  const highImpactTopics = ['billing', 'payment', 'contract', 'renewal', 'churn', 'competitor'];
  const hasHighImpactTopics = analysis.topics?.some((topic: string) => 
    highImpactTopics.some(impactTopic => topic.toLowerCase().includes(impactTopic))
  );

  if (hasHighImpactTopics) {
    const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
    const detectedHighImpactTopics = analysis.topics?.filter((topic: string) => 
      highImpactTopics.some(impactTopic => topic.toLowerCase().includes(impactTopic))
    ) || [];
    
    insights.push({
      type: 'renewal_warning',
      message: `High-impact topics discussed with ${customerDisplay} - Billing, contract, or competitive concerns detected`,
      severity: 'yellow',
      category: 'risk',
      meta: {
        documentId: document._id,
        documentTitle: document.title,
        sentiment: analysis.sentiment,
        businessRelevance: analysis.businessRelevance,
        topics: analysis.topics,
        highImpactTopics: detectedHighImpactTopics,
        evidenceLinks: evidenceLinks
      },
      status: 'new',
      createdAt: new Date().toISOString(),
      customerId: document.customerId?.toString(),
      customerName: customerName,
      evidence: {
        supportingData: {
          highImpactTopics: detectedHighImpactTopics,
          sentiment: analysis.sentiment,
          businessRelevance: analysis.businessRelevance,
          allTopics: analysis.topics,
          documentType: document.documentType,
          documentDate: document.createdAt,
          riskLevel: 'high'
        },
        relatedLinks: evidenceLinks.map(link => ({
          title: link.label,
          url: link.url
        }))
      },
      guidance: {
        summary: `High-impact topics indicate potential business or relationship concerns`,
        whyItMatters: 'Topics like billing, contracts, and competitors often indicate underlying business concerns',
        signals: [
          `High-impact topics detected: ${detectedHighImpactTopics.join(', ') || 'General concerns'}`,
          `Business relevance: ${Math.round(analysis.businessRelevance * 100)}%`,
          `Sentiment: ${analysis.sentiment}`,
          `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`
        ],
        recommendedActions: [
          'Schedule urgent follow-up with customer',
          'Review billing and contract status',
          'Prepare competitive analysis and value proposition',
          'Engage sales team for relationship support',
          'Document specific concerns for resolution tracking'
        ],
        investigationPath: [
          'Analyze specific concerns mentioned in document',
          'Check billing and payment history',
          'Review contract terms and renewal timeline',
          'Assess competitive landscape and positioning',
          'Identify potential contract risks or opportunities'
        ],
        considerations: [
          'Monitor for escalation or churn signals',
          'Prepare for potential contract negotiations',
          'Ensure clear communication of value proposition',
          'Assess impact on renewal probability'
        ],
        owner: 'Account Manager',
        sla: { name: 'Urgent Review', amount: 2, unit: 'days' }
      }
    });
  }

  return insights;
}

/**
 * Generate high business relevance insights
 */
function generateHighRelevanceInsights(
  document: IDocument, 
  analysis: any, 
  customerName?: string
): CustomerSuccessInsight[] {
  const insights: CustomerSuccessInsight[] = [];
  const customerDisplay = customerName || 'Customer';

  // High business relevance insight
  const evidenceLinks = generateDocumentEvidenceLinks(document, document.customerId?.toString());
  
  insights.push({
    type: 'correlation_to_value',
    message: `High business relevance document from ${customerDisplay} - Strong indication of solution value and engagement`,
    severity: 'info',
    category: 'strategic',
    meta: {
      documentId: document._id,
      documentTitle: document.title,
      sentiment: analysis.sentiment,
      businessRelevance: analysis.businessRelevance,
      topics: analysis.topics,
      confidence: analysis.confidence,
      evidenceLinks: evidenceLinks
    },
    status: 'new',
    createdAt: new Date().toISOString(),
    customerId: document.customerId?.toString(),
    customerName: customerName,
    evidence: {
      supportingData: {
        businessRelevance: analysis.businessRelevance,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        topics: analysis.topics,
        documentType: document.documentType,
        documentDate: document.createdAt,
        valueLevel: 'high'
      },
      relatedLinks: evidenceLinks.map(link => ({
        title: link.label,
        url: link.url
      }))
    },
    guidance: {
      summary: `High business relevance indicates strong customer engagement and solution value`,
      whyItMatters: 'High business relevance documents often indicate customers are deriving significant value and actively engaged',
      signals: [
        `Business relevance score: ${Math.round(analysis.businessRelevance * 100)}%`,
        `Document topics: ${analysis.topics?.join(', ') || 'General discussion'}`,
        `Analysis confidence: ${Math.round(analysis.confidence * 100)}%`,
        `Document sentiment: ${analysis.sentiment}`
      ],
      recommendedActions: [
        'Review document for strategic insights',
        'Share insights with executive team',
        'Identify opportunities for expanded engagement',
        'Consider customer for case study or reference',
        'Document key findings for future reference'
      ],
      investigationPath: [
        'Analyze document content and business impact',
        'Assess customer satisfaction and value realization',
        'Identify potential for deeper partnership',
        'Evaluate customer for success story development',
        'Review document for best practices to share'
      ],
      considerations: [
        'Leverage high engagement for relationship building',
        'Monitor for continued high-value interactions',
        'Consider customer for strategic initiatives',
        'Use insights to improve solution delivery'
      ],
      owner: 'Customer Success Director',
      sla: { name: 'Strategic Review', amount: 5, unit: 'days' }
    }
  });

  return insights;
}
