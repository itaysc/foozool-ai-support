import { ProblemCluster } from './types';
import { callLLM } from 'src/services/llm';
import { UserContextManager } from 'src/context/userContext';

export async function generateSpecificMessage(cluster: ProblemCluster, customerName: string): Promise<string> {
  try {
    const prompt = `
    Create a specific, actionable message for a recurring problem insight.
    
    Problem Details:
    - Pattern: ${cluster.pattern}
    - Frequency: ${cluster.frequency} tickets
    - Affected Customers: ${cluster.affectedCustomers.size}
    - Business Impact: ${cluster.businessImpact}
    - Time Pattern: ${cluster.timePattern}
    - Error Messages: ${cluster.errorMessages.slice(0, 3).join('; ')}
    
    Customer: ${customerName}
    
    Write a clear, specific message that tells the user:
    1. What the actual problem is (not just generic "recurring issue")
    2. How many tickets/customers are affected
    3. What the business impact is
    4. When the problem typically occurs
    
    Be specific and actionable. Avoid vague language like "systematic problem" or "needs attention".
    
    Example format: "API authentication failures affecting 8 tickets from 3 customers since last week. Customers reporting login issues between 9-11 AM EST, with 'INVALID_TOKEN' errors in Stripe integration."
    
    Return only the message, no other text.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at creating clear, actionable problem descriptions for customer success teams.',
      prompt,
      maxTokens: 300,
      temperature: 0.3,
    });

    return response.data || `Recurring issue detected: ${cluster.pattern} appears in ${cluster.frequency} tickets. ${cluster.businessImpact}.`;
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error generating specific message:', error);
    return `Recurring issue detected: ${cluster.pattern} appears in ${cluster.frequency} tickets. ${cluster.businessImpact}.`;
  }
}

export async function generateInvestigationSteps(cluster: ProblemCluster): Promise<string[]> {
  try {
    const prompt = `
    Generate specific investigation steps for this recurring problem.
    
    Problem: ${cluster.pattern}
    Error Messages: ${cluster.errorMessages.join('; ')}
    Time Pattern: ${cluster.timePattern}
    Business Impact: ${cluster.businessImpact}
    
    Provide 3-5 specific, actionable steps that a customer success manager can take to investigate this issue. Each step should be concrete and specific.
    
    Focus on:
    1. Immediate actions (check specific logs, verify configurations)
    2. Root cause analysis (what to look for, where to look)
    3. Customer communication (who to contact, what to ask)
    
    Return as a JSON array of strings. Each string should be a complete, actionable step.
    
    Example: ["Check authentication service logs for the last 7 days for INVALID_TOKEN errors", "Verify OAuth token expiration settings in customer configuration", "Contact affected customers to understand the impact on their workflows"]
    
    Return only valid JSON, no other text.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at creating investigation plans for technical support issues.',
      prompt,
      maxTokens: 500,
      temperature: 0.2,
    });

    return JSON.parse(response.data || '["Review the issue and contact the customer for more details"]');
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error generating investigation steps:', error);
    return ['Review the issue and contact the customer for more details'];
  }
}

export async function generateRecommendation(cluster: ProblemCluster): Promise<string> {
  try {
    const prompt = `
    Generate a specific recommendation for this recurring problem.
    
    Problem: ${cluster.pattern}
    Frequency: ${cluster.frequency} tickets
    Business Impact: ${cluster.businessImpact}
    Error Messages: ${cluster.errorMessages.join('; ')}
    
    Provide a specific, actionable recommendation that addresses the root cause or provides a clear path forward.
    
    Be specific about:
    1. What action to take
    2. Who should take it
    3. What the expected outcome is
    
    Avoid generic recommendations like "investigate further" or "contact stakeholder".
    
    Return only the recommendation text, no other formatting.
    `;

    const response = await callLLM({
      userId: UserContextManager.getCurrentUserId() || '',
      isChat: false,
      systemMsg: 'You are an expert at providing specific, actionable recommendations for technical issues.',
      prompt,
      maxTokens: 200,
      temperature: 0.3,
    });

    return response.data || 'Investigate the root cause and implement a permanent solution';
    
  } catch (error) {
    console.error('[Enhanced Recurring Problems] Error generating recommendation:', error);
    return 'Investigate the root cause and implement a permanent solution';
  }
}
