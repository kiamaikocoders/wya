import { callAiChat } from "@/lib/ai-gateway-client";

const SYSTEM =
  "You are an analytics assistant for an event platform. Respond in clear markdown or bullet points. Be concise and actionable.";

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
