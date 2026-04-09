/**
 * Normalize model output for on-screen reading (no markdown markers).
 * Used for all human-facing AI text returned through the gateway unless preserveRaw is set.
 */

export function formatAiResponseForDisplay(input: string): string {
  let t = input.replace(/\r\n/g, "\n").trim();
  if (!t) return "";

  t = t.replace(/^```(?:[\w-]*)?\n([\s\S]*?)\n```$/gm, "$1");
  t = t.replace(/```(?:[\w-]*)?\n([\s\S]*?)\n```/g, "$1");

  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/^[ \t]*\d+\.\s+/gm, "");

  for (let i = 0; i < 4; i++) {
    t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
    t = t.replace(/__([^_]+)__/g, "$1");
  }

  t = t.replace(/^[ \t]*[*•-][ \t]+/gm, "");
  t = t.replace(/^[ \t]*\*\s*/gm, "");

  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/^[-*_]{3,}\s*$/gm, "");

  t = t.replace(/[ \t]+$/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/** Paragraphs for AI insight panels (plain text, logical breaks). */
export function toDisplayParagraphs(input: string): string[] {
  const plain = formatAiResponseForDisplay(input);
  if (!plain) return [];
  const blocks = plain
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;
  const lines = plain
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  return lines.length ? lines : [plain];
}

/** Event copy: keep wording; split on blank lines or single newlines for layout. */
export function toDescriptionParagraphs(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length > 1) return blocks;
  return normalized
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}
