/**
 * Prompt utility functions for news services
 * Contains all LLM prompts used in the news module
 */

/**
 * Generate prompt for creating search terms for organization news monitoring
 */
export function generateSearchTermsPrompt(details: string, country: string, regions: string[]): string {
  return `
Generate comprehensive search terms for news monitoring that will help identify business-impacting news for customer support and operations.

Organization Details: ${details}
Country: ${country}
Regions: ${regions.join(', ')}

Generate 15-25 search terms that cover:

1. **Business Operations Impact**:
   - Supply chain disruptions, logistics issues, manufacturing delays
   - Raw materials shortages, cost increases, pricing changes
   - Quality issues, product availability, delivery problems

2. **Customer Support Relevance**:
   - Customer complaints, satisfaction issues, service quality
   - Delivery delays, product defects, warranty issues
   - Customer expectations, service standards, support challenges

3. **Industry-Specific Factors**:
   - Industry regulations, compliance requirements, legal changes
   - Competitor issues, market disruptions, industry trends
   - Technology changes affecting the business or customers

4. **Economic and Regional Factors**:
   - Inflation, currency fluctuations, economic sanctions
   - Geopolitical events, trade restrictions, regional conflicts
   - Local market conditions, regional business climate

5. **Digital and Technology Impact**:
   - E-commerce trends, online shopping behavior
   - Digital transformation, automation, customer experience
   - Technology adoption, digital customer support trends

Focus on terms that would help identify news that:
- Could impact customer support operations
- Might affect product availability or quality
- Could influence customer expectations or complaints
- May require proactive customer communication
- Could impact business operations and costs

Return only the search terms as a JSON array of strings, no explanations:
["term1", "term2", "term3"]

Make terms specific and actionable for business intelligence.
`;
}

/**
 * Generate prompt for analyzing organization news items
 */
export function generateNewsAnalysisPrompt(
  combinedText: string,
  organizationDetails: string,
  country: string,
  regions: string[]
): string {
  return `
Analyze this news item for an organization that operates in ${organizationDetails || 'various industries'} 
in ${country || 'multiple countries'} and regions: ${regions?.join(', ') || 'global'}.

News: ${combinedText}

Provide analysis in JSON format:
{
  "relevance": "high|medium|low",
  "impact": "positive|negative|neutral", 
  "categories": ["category1", "category2"],
  "reasoning": "brief explanation"
}

Focus on business impact factors that could affect customer support and operations:

**High Relevance Criteria:**
- Direct impact on product availability, quality, or delivery
- Supply chain disruptions affecting the business
- Customer complaints or satisfaction issues in the industry
- Regulatory changes affecting operations or compliance
- Significant price increases or cost changes
- Technology changes affecting customer experience

**Medium Relevance Criteria:**
- Indirect impact on business operations
- Market trends that could influence customer behavior
- Economic factors affecting purchasing power
- Industry-wide changes or disruptions
- Regional events affecting business climate

**Low Relevance Criteria:**
- General news with minimal business impact
- Unrelated industry developments
- Events with no direct connection to operations

Consider how this news might:
- Generate customer complaints or support requests
- Affect product delivery or availability
- Impact customer expectations or satisfaction
- Require proactive customer communication
- Influence support team workload or processes
- Affect business costs or pricing strategies
`;
}

/**
 * Generate prompt for creating action items from organization news
 */
export function generateOrganizationActionItemsPrompt(
  relevantItems: any[],
  organizationDetails: string,
  country: string,
  regions: string[]
): string {
  return `
Based on the following news items for an organization that operates in ${organizationDetails || 'various industries'} 
in ${country || 'multiple countries'} and regions: ${regions?.join(', ') || 'global'},
generate specific action items focused on customer support and business operations.

News Items:
${relevantItems.map(item => `- ${item.title}: ${item.contentSnippet} (Impact: ${item.impact})`).join('\n')}

Provide action items in JSON format:
[
  {
    "title": "Action item title",
    "description": "Detailed description of the action needed",
    "priority": "high|medium|low",
    "category": "customer_support|supply_chain|operations|communication|risk_management|strategy",
    "impact": "Description of potential impact on business and customers",
    "suggestedActions": ["specific action 1", "specific action 2", "specific action 3"]
  }
]

Focus on actionable insights that can help the organization:

**Customer Support Focus:**
- Prepare support teams for potential customer complaints
- Develop proactive communication strategies
- Update customer-facing information and policies
- Enhance support processes for new challenges
- Train support staff on new issues or policies

**Business Operations Focus:**
- Mitigate supply chain and delivery risks
- Address quality or availability issues
- Optimize operations for new market conditions
- Prepare for regulatory or compliance changes
- Manage cost and pricing implications

**Communication Focus:**
- Develop customer communication strategies
- Update website and marketing materials
- Prepare FAQ and support documentation
- Plan internal communication to staff

**Risk Management Focus:**
- Identify and mitigate potential risks
- Develop contingency plans
- Monitor and track emerging issues
- Prepare for worst-case scenarios

Prioritize actions that will:
- Reduce customer complaints and support workload
- Improve customer satisfaction and experience
- Protect business operations and reputation
- Enable proactive rather than reactive responses
- Support long-term business sustainability
`;
}

/**
 * Generate prompt for analyzing customer company news (CS perspective)
 */
export function generateCustomerNewsAnalysisPrompt(
  combinedText: string,
  customerName: string,
  customerIndustry: string,
  customerSegment: string,
  healthScore: number
): string {
  return `
Analyze this news about ${customerName || 'the customer company'} from a Customer Success perspective.

Customer Context:
- Name: ${customerName}
- Industry: ${customerIndustry || 'N/A'}
- Segment: ${customerSegment || 'N/A'}
- Health Score: ${healthScore || 'N/A'}/10

News: ${combinedText}

Provide analysis in JSON format:
{
  "relevance": "high|medium|low",
  "impact": "positive|negative|neutral",
  "categories": ["category1", "category2"]
}

**High Relevance** - Major events affecting the company:
- Layoffs, restructuring, leadership changes
- Acquisitions, mergers, IPO, funding rounds
- Major product launches or failures
- Financial results (earnings, revenue changes)
- Security breaches, lawsuits, regulatory issues
- Expansion, office closures, market entry/exit

**Medium Relevance** - Notable but less impactful:
- Awards, rankings, certifications
- Partnership announcements
- Minor product updates
- Hiring announcements
- Industry conference participation

**Low Relevance** - General mentions:
- Brief industry mentions
- Third-party analysis
- Unrelated news

Impact Assessment:
- **Positive**: Growth, success, good news
- **Negative**: Challenges, losses, problems
- **Neutral**: Factual announcements
`;
}

/**
 * Generate prompt for creating CS action items from customer news
 */
export function generateCustomerActionItemsPrompt(
  relevantItems: any[],
  customerName: string,
  customerIndustry: string,
  healthScore: number
): string {
  return `
You are a Customer Success Manager preparing for a meeting. Generate 2-4 actionable insights based on recent news about ${customerName}.

Customer Info:
- Name: ${customerName}
- Industry: ${customerIndustry || 'N/A'}
- Health Score: ${healthScore || 'N/A'}/10

Recent News:
${relevantItems.slice(0, 5).map(item => `- [${item.impact.toUpperCase()}] ${item.title}\n  ${item.contentSnippet}`).join('\n\n')}

Generate action items in JSON format:
[
  {
    "title": "Brief action title",
    "description": "What the CS team should do or discuss",
    "priority": "high|medium|low",
    "category": "conversation_starter|risk_assessment|opportunity|relationship",
    "impact": "Why this matters",
    "suggestedActions": ["specific talking point 1", "specific question to ask", "follow-up action"]
  }
]

Focus on:
- Showing you're aware of their company situation
- Building rapport through relevant conversations
- Identifying how their news affects their needs
- Finding opportunities to provide value
- Demonstrating empathy for challenges
`;
}

