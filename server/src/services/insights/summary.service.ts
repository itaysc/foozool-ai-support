import { callLLM } from '../llm';
import { UserContextManager } from '../../context/userContext';

/**
 * Generate a summary/description from a representative vector and related ticket data
 */
export async function getSummaryFromVector(
  representativeVector: number[],
  relatedTickets?: Array<{ payload: any }>,
  userId?: string
): Promise<string> {
  try {
    // If we have related tickets, use their subject/description for context
    let contextText = '';
    if (relatedTickets && relatedTickets.length > 0) {
      const ticketTexts = relatedTickets
        .slice(0, 5) // Limit to first 5 tickets to avoid token limits
        .map(ticket => {
          const subject = ticket.payload?.ticket_id || 'Unknown Subject';
          const description = ticket.payload?.description || 'No description available';
          return `Subject: ${subject}\nDescription: ${description}`;
        })
        .join('\n\n');
      
      contextText = `Based on these related support tickets:\n\n${ticketTexts}\n\n`;
    }

    const prompt = `${contextText}Analyze the pattern in these support tickets and provide a concise, actionable description of the main issue or theme. 

The description should:
- Be 1-2 sentences maximum
- Focus on the core problem or pattern
- Be specific and actionable
- Use business-friendly language

Example: "Users experiencing login failures due to password reset email delays" or "Mobile app crashes when uploading large images"

Description:`;

    // Get userId from parameter or user context (guaranteed by middleware)
    const effectiveUserId = userId || UserContextManager.getCurrentUserId();
    
    if (!effectiveUserId) {
      throw new Error('User ID is required for LLM operations');
    }

    const response = await callLLM({
      userId: effectiveUserId,
      prompt,
      maxTokens: 150,
      temperature: 0.1, // Low temperature for consistent, factual descriptions
      isChat: false,
      systemMsg: 'You are an AI assistant that analyzes support ticket patterns and creates concise issue descriptions for business stakeholders.'
    });

    // Clean up the response and ensure it's concise
    let description = response.data?.trim() || 'Unable to determine issue pattern';
    
    // Remove any prefixes like "Description:" if the model included them
    description = description.replace(/^(Description:|Issue:|Problem:)\s*/i, '');
    
    // Ensure it's not too long (truncate if necessary)
    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }

    return description;
  } catch (error) {
    console.error('Error generating summary from vector:', error);
    return 'Unable to generate issue description';
  }
}

/**
 * Calculate growth rate based on historical ticket volumes
 * This is a placeholder implementation - you might want to enhance with actual historical data
 */
export function calculateGrowthRate(
  currentVolume: number,
  historicalVolume?: number
): number {
  if (!historicalVolume || historicalVolume === 0) {
    return 0; // No historical data
  }
  
  return ((currentVolume - historicalVolume) / historicalVolume) * 100;
}