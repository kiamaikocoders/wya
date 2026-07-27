import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { callAiChat } from '@/lib/ai-gateway-client';

const PLAIN =
  'Respond in plain English only: no markdown, no asterisks, no bold markers, no bullet asterisks. Use short paragraphs and line breaks between ideas. Be concise and actionable.';

const COPY =
  'You write for Where You At (WYA), a Kenya events platform. Tone: clear, warm, urban, not corporate. Plain text only — no markdown.';

/** Keep model clock aligned with the real calendar (do not treat the current year as “the future”). */
function clockContext(): string {
  const now = new Date();
  const ymd = format(now, 'yyyy-MM-dd');
  const year = now.getFullYear();
  return (
    `Current real-world date: ${ymd} (${year}). ` +
    `Timestamps in ${year} (and earlier) are normal and expected. ` +
    `Never call a date “in the future” unless it is strictly after ${ymd}. ` +
    `Do not treat the year ${year} itself as a risk flag or data integrity issue.`
  );
}

function describeTimestamp(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return iso;
    return `${format(d, 'yyyy-MM-dd')} (${formatDistanceToNow(d, { addSuffix: true })})`;
  } catch {
    return iso;
  }
}

async function ask(system: string, user: string, maxTokens = 1024): Promise<string> {
  return callAiChat({
    system: `${system} ${clockContext()} ${PLAIN}`,
    user,
    maxTokens,
  });
}

/** Shared admin insight generation (Analytics, Users, Sponsors, etc.). */
export async function runAdminInsightsAnalysis(userPrompt: string): Promise<string> {
  return ask(
    'You are an analytics assistant for an event platform.',
    userPrompt,
    2048
  );
}

export async function draftAnnouncementBody(input: {
  subject: string;
  audience?: string;
  channel?: string;
  link?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Write a short announcement body (2–4 sentences) for this subject line.',
      `Subject: ${input.subject}`,
      input.audience ? `Audience: ${input.audience}` : '',
      input.channel ? `Channel: ${input.channel}` : '',
      input.link ? `Optional link to mention once: ${input.link}` : '',
      'Do not repeat the subject as a heading. No sign-off.',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function draftNotificationBody(input: {
  title: string;
  audience?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Write a short push/in-app notification body (1–3 sentences).',
      `Title: ${input.title}`,
      input.audience ? `Audience: ${input.audience}` : '',
      'No subject line. No emoji spam.',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function improveEmailTemplateSubject(input: {
  name: string;
  currentSubject: string;
  description?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Rewrite this email subject line to be clearer and more clickable. Return only the subject line.',
      `Template: ${input.name}`,
      `Current subject: ${input.currentSubject}`,
      input.description ? `Context: ${input.description}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    256
  );
}

export async function draftEventDescription(input: {
  title: string;
  location?: string;
  date?: string;
  category?: string;
  existing?: string;
}): Promise<string> {
  const mode = input.existing?.trim()
    ? 'Improve and polish this event description while keeping the facts. Keep under 1800 characters.'
    : 'Write an engaging event description (3–5 short paragraphs or dense sentences). Keep under 1800 characters.';
  return ask(
    COPY,
    [
      mode,
      `Title: ${input.title}`,
      input.location ? `Location: ${input.location}` : '',
      input.date ? `Date: ${input.date}` : '',
      input.category ? `Category: ${input.category}` : '',
      input.existing?.trim() ? `Current draft:\n${input.existing}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function draftWhatToExpect(input: {
  title: string;
  description?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Write 4–6 short “what to expect” lines for this event.',
      'One idea per line. No bullets or numbering — plain lines only.',
      `Title: ${input.title}`,
      input.description ? `Description:\n${input.description}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function draftGhostStoryCaption(input: {
  hint?: string;
  eventTitle?: string;
  existing?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Write a short ghost-user story caption for a nightlife/events feed (1–3 sentences). Casual Kenya vibe.',
      input.eventTitle ? `Event: ${input.eventTitle}` : '',
      input.hint ? `Direction: ${input.hint}` : '',
      input.existing?.trim() ? `Current draft:\n${input.existing}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    512
  );
}

export async function analyzeUserForAdmin(user: {
  name: string;
  email?: string;
  role: string;
  status: string;
  location?: string;
  events_attended?: number;
  events_created?: number;
  followers_count?: number;
  created_at?: string;
  last_active?: string;
  account_status_reason?: string | null;
}): Promise<string> {
  const payload = {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    location: user.location,
    events_attended: user.events_attended,
    events_created: user.events_created,
    followers_count: user.followers_count,
    created_at: describeTimestamp(user.created_at),
    last_active: describeTimestamp(user.last_active),
    account_status_reason: user.account_status_reason,
  };

  return ask(
    'You are a trust & safety assistant for an event platform admin.',
    [
      'Summarize this user for an admin in 3–5 short sentences: activity level, role fit, and any real risk flags.',
      'Do not invent timestamp anomalies. Account dates that are on or before today are normal.',
      'End with one recommended next action (monitor, activate, suspend, or none).',
      JSON.stringify(payload, null, 2),
    ].join('\n')
  );
}

export async function analyzeModerationItem(input: {
  title: string;
  meta: string;
  kind: string;
}): Promise<string> {
  return ask(
    'You are a content moderation assistant. Be cautious but fair.',
    [
      'Given this flagged item, explain in 2–4 sentences what might be wrong and recommend Approve or Remove with a short reason.',
      `Kind: ${input.kind}`,
      `Content: ${input.title}`,
      `Context: ${input.meta}`,
    ].join('\n')
  );
}

export async function analyzeProposal(input: {
  title: string;
  category?: string | null;
  description?: string | null;
  location?: string | null;
  submitter?: string;
  status?: string;
}): Promise<string> {
  return ask(
    'You help admins review event proposals on a Kenya events platform.',
    [
      'Summarize this proposal and recommend Approve or Reject with a short rationale (3–5 sentences).',
      `Title: ${input.title}`,
      input.category ? `Category: ${input.category}` : '',
      input.location ? `Location: ${input.location}` : '',
      input.submitter ? `Submitter: ${input.submitter}` : '',
      input.status ? `Status: ${input.status}` : '',
      input.description ? `Description:\n${input.description}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function clusterFeedbackThemes(
  messages: Array<{ category?: string; message: string; status?: string }>
): Promise<string> {
  const sample = messages.slice(0, 40).map((m, i) => ({
    i: i + 1,
    category: m.category,
    status: m.status,
    message: m.message.slice(0, 280),
  }));
  return ask(
    'You help product admins triage app feedback.',
    [
      'Cluster these feedback messages into 3–6 themes.',
      'For each theme: name it, note approximate volume, and suggest one admin reply tone or action.',
      JSON.stringify(sample, null, 2),
    ].join('\n'),
    2048
  );
}

export async function draftFeedbackReply(input: {
  message: string;
  category?: string;
  name?: string;
}): Promise<string> {
  return ask(
    COPY,
    [
      'Draft a short, empathetic admin reply to this app feedback (3–5 sentences).',
      'Do not invent refunds or promises you cannot keep. Offer next steps when useful.',
      input.name ? `User: ${input.name}` : '',
      input.category ? `Category: ${input.category}` : '',
      `Feedback:\n${input.message}`,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function summarizeSponsorAnalytics(input: {
  period: string;
  impressions: number;
  interactions: number;
  storyMentions: number;
  zoneCheckins: number;
  activity: Array<{ sponsor: string; visitors: number; interactions: number }>;
}): Promise<string> {
  return ask(
    'You are a sponsorship analytics assistant for an events platform.',
    [
      `Summarize sponsor performance for period: ${input.period}.`,
      'Highlight leaders, lagging sponsors, and 2 concrete optimization ideas.',
      JSON.stringify(input, null, 2),
    ].join('\n'),
    2048
  );
}

export async function summarizePlatformAnalytics(input: {
  totalEvents: number;
  activeUsers: number;
  revenueKes: number;
  tickets: number;
  transfersCompleted: number;
  organizers: number;
}): Promise<string> {
  return ask(
    'You are an analytics assistant for Where You At (WYA), a Kenya events platform.',
    [
      'Write 3 short insight cards worth of analysis from these KPIs.',
      'Cover growth opportunities, marketplace/tickets, and user/organizer health.',
      'Do not invent numbers not present in the data.',
      JSON.stringify(input, null, 2),
    ].join('\n'),
    2048
  );
}
