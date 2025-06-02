import { ITicket, IProduct } from "@common/types";

type ActionType = "refund" | "commentOnly" | "escalate" | "reship" | "noAction";

/**
 * Builds a cost-optimized prompt for a Retrieval-Augmented Generation (RAG) support agent.
 * @param newTicketText The incoming customer message.
 * @param similarTickets Array of past similar tickets and responses.
 * @returns The full prompt string to send to the LLM.
 */
export function buildPrompt(
  newTicketText: string,
  similarTickets: ITicket[],
  product?: IProduct
): string {
  const validActions: ActionType[] = ["refund", "commentOnly", "escalate", "reship", "noAction"];

  const header = `
You are a helpful and friendly customer support agent.

Your task is to write a JSON object with:
• "response": your message to the customer.
• "action": one of [${validActions.map(a => `"${a}"`).join(", ")}].

${product ? `Here is the product details the customer purchased: ${JSON.stringify(product)}` : ""}

Rules:
- Only use the info below (new ticket + similar tickets).
- Never guess or make up facts.
- If unclear, use action "escalate" and reply naturally.
- Be warm and understanding. Don't sound like a bot.

Only output a valid JSON. No extra text.

Example:
{ "response": "Thanks for reaching out. We've shipped you a replacement.", "action": "reship" }

---
`;

  const ticketSection = `\nNew ticket:\nCustomer: "${newTicketText}"\n`;

  const similarTicketLimit = 3;
  const descriptionLimit = 200;

  const pastTicketsSection = similarTickets.length
    ? `\nSimilar past tickets:\n${similarTickets
        .slice(0, similarTicketLimit)
        .map(
          (t) =>
            `– Customer: "subject: ${t.subject} description: ${t.description.slice(
              0,
              descriptionLimit
            )}..."`
        )
        .join("\n")}`
    : "\nNo similar past tickets found.";

  const instruction = `\n\nContext ends here.\nNow write the JSON.\n`;

  return header + ticketSection + pastTicketsSection + instruction;
}

export function buildProductPromptFromTicket(ticket: ITicket): string {
  return `
You are given a support ticket for an electronics product (e.g. phone, camera, console).

The store sells electronics like smartphones, cameras, gaming consoles, and accessories.

Use the ticket below to **create a realistic JSON object representing the purchased product.
The JSON **must** be in the following format:
{
  productName (string)
  serialNumber (string)
  purchaseDate (ISO 8601 string)
  price (number)
  currency (e.g. "USD"/"EUR"/"GBP")
  refundPolicy (e.g. {unit: "days", value: 30})
  warrantyPeriod (e.g. {unit: "years", value: 1})
  storeLocation (city name or "Online")
  customerName (string)
  customerEmail (string)
  metadata (Record<string, string> with e.g. color, model, variant, etc.)
}

You must return **exactly one** JSON object and one product, and nothing else.
Do NOT include any text, explanation, or multiple JSON objects.
Do NOT include anything other than the product fields.
Example output:
{
  "productName": "Canon EOS M50 Mirrorless Camera",
  "serialNumber": "CNSM50-8349234",
  "purchaseDate": "2024-12-05T00:00:00Z",
  "price": 649.99,
  "currency": "USD",
  "refundPolicy": { "unit": "days", "value": 30 },
  "warrantyPeriod": { "unit": "years", "value": 1 },
  "storeLocation": "Los Angeles",
  "customerName": "Emily Carter",
  "customerEmail": "emily.carter@example.com",
  "metadata": { "color": "Black", "model": "M50 Kit with 15-45mm lens" }
}

Use this ticket to create the product:
Subject: ${ticket.subject}
Description: ${ticket.description}

Return **only one valid JSON object** now.
`;
}

export function buildAgentSuggestionPrompt(
  newTicket: Partial<ITicket>,
  product: IProduct,
  similarTickets: ITicket[]
): string {
  const validActions: ActionType[] = ["refund", "commentOnly", "escalate", "reship", "noAction"];

  const header = `
You are an AI assistant helping human customer support agents make informed decisions.

Analyze the new ticket below along with similar past tickets and product information to provide a recommendation.

Your task is to write a JSON object with:
• "action": one of [${validActions.map(a => `"${a}"`).join(", ")}]
• "confidence": percentage (0-100) of how confident you are in this recommendation
• "reasoning": brief explanation of why this action is recommended
• "pastTicketsContext": summary of how similar past tickets were resolved
• "escalationNote": (only if action is "escalate") specific reason why escalation is needed

Product Information:
${JSON.stringify(product, null, 2)}

Guidelines:
- Base recommendations on patterns from similar past tickets
- Consider product warranty, refund policy, and purchase date
- Higher confidence for actions that match successful past resolutions
- **Order Retention Priority**: If customer is requesting refund or cancellation:
  * First analyze tone and context to determine if agent can assist to resolve underlying issues
  * Look for opportunities to offer solutions (replacement, troubleshooting, discount, etc.)
  * Only suggest "refund" if customer seems firm/final or issue cannot be reasonably resolved
  * Use "commentOnly" when suggesting retention attempts with specific assistance offers
- Use "escalate" for complex/unclear cases or policy violations
- Be concise but informative

Only output valid JSON. No extra text.

Example:
{
  "action": "refund",
  "confidence": 85,
  "reasoning": "Item is within 30-day return window and customer reports defect",
  "pastTicketsContext": "2 similar defect tickets were resolved with refunds",
  "escalationNote": null
}

---
`;

  const newTicketSection = `
New Ticket to Analyze:
Subject: ${newTicket.subject}
Description: ${newTicket.description}
Status: ${newTicket.status}
Created: ${newTicket.createdAt}
`;

  const similarTicketLimit = 5;
  const descriptionLimit = 150;

  const pastTicketsSection = similarTickets.length
    ? `
Similar Past Tickets (for context):
${similarTickets
  .slice(0, similarTicketLimit)
  .map(
    (t, index) =>
      `${index + 1}. Subject: "${t.subject}"
   Description: "${t.description.slice(0, descriptionLimit)}${t.description.length > descriptionLimit ? '...' : ''}"
   Status: ${t.status}
   Resolution: ${t.comments.length > 0 ? t.comments[t.comments.length - 1] : 'No resolution recorded'}`
  )
  .join('\n\n')}`
    : `
No similar past tickets found.`;

  const instruction = `

Based on the above information, provide your recommendation as a JSON object.
`;

  return header + newTicketSection + pastTicketsSection + instruction;
}
