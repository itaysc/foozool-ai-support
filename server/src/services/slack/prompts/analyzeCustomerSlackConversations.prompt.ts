export interface AnalyzeCustomerSlackConversationsPromptArgs {
  customerName: string;
  conversationText: string;
}

/**
 * Prompt for analyzing Slack conversations mentioning a customer and producing meaningful, evidence-backed insights.
 *
 * Important:
 * - Only generate insights that are directly supported by the provided conversation text.
 * - If there are no meaningful insights, explicitly say so and do not invent any.
 */
export function buildAnalyzeCustomerSlackConversationsPrompt(
  args: AnalyzeCustomerSlackConversationsPromptArgs
): string {
  return `You are a senior customer success analyst.

Your task: read Slack message excerpts that mention the customer "${args.customerName}" and produce a concise set of meaningful insights.

Rules:
- Only use information present in the excerpts. Do NOT guess or hallucinate.
- Each insight must be supported by evidence (quote or reference the message snippet) and include the channel + permalink when available.
- Focus on actionable insights: risks, blockers, sentiment, feature requests, bugs, timeline/urgency, stakeholder dynamics.
- Ignore trivial chatter, greetings, jokes, or unrelated mentions.
- If the excerpts do not support any meaningful insights, output exactly: "No meaningful insights found."

Output format:
- A short title line: "Insights for <customer>"
- Then 3–8 bullet points (or fewer if warranted). Each bullet:
  - Insight (1 sentence)
  - Evidence: (1 short quote/snippet)
  - Source: #channel + permalink (if permalink is missing, just include channel name)

Slack excerpts:
${args.conversationText}
`;
}


