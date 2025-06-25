export interface IAgentSuggestion {
  action: "refund" | "commentOnly" | "escalate" | "reship" | "noAction";
  reasoning: string;
  confidence: number;
  escalationNote: string;
}