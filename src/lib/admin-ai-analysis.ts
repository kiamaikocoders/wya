import { callAiChat } from "@/lib/ai-gateway-client";

const SYSTEM =
  "You are an analytics assistant for an event platform. Respond in plain English only: no markdown, no asterisks, no bold markers, no bullet asterisks. Use short paragraphs and line breaks between ideas. Be concise and actionable.";

/**
 * Shared admin insight generation (Analytics dashboard, User management, etc.).
 */
export async function runAdminInsightsAnalysis(userPrompt: string): Promise<string> {
  return callAiChat({
    system: SYSTEM,
    user: userPrompt,
    maxTokens: 2048,
  });
}
