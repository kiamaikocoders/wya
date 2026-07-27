/**
 * Transactional email templates — copy + structure from Figma
 * (9RMXZrqarVf6A3t4Lug70v · page "16 — Emails").
 */
import {
  p,
  pHtml,
  renderFigmaEmail,
  emailHeroUrl,
  type DetailRow,
} from "./email-layout.ts";

export type EmailTemplateId =
  | "ticket-confirmation"
  | "event-reminder"
  | "event-updated"
  | "event-cancelled"
  | "proposal-submitted"
  | "proposal-approved"
  | "proposal-rejected"
  | "marketplace-buyer-receipt"
  | "marketplace-seller-sold"
  | "announcement"
  | "new-event"
  | "organizer-assigned"
  | "media-share"
  | "dsar-export-ready"
  | "account-deleted"
  | "message-digest"
  | "ai-digest"
  | "newsletter"
  | "survey-invite"
  | "survey-reminder"
  | "checkin-confirmation"
  | "feedback-reply"
  | "welcome"
  | "follower"
  | "story-like"
  | "partner-pitch"
  | "community-highlight"
  | "waitlist-confirmation"
  | "admin-system-test"
  | "generic";

export type TemplateVars = Record<string, string | undefined>;

/** Map notification.type → transactional template (when emailing via dispatch). */
export const NOTIFICATION_TYPE_TO_TEMPLATE: Record<string, EmailTemplateId> = {
  ticket: "ticket-confirmation",
  event_update: "event-updated",
  event_cancelled: "event-cancelled",
  proposal_submitted: "proposal-submitted",
  proposal_approved: "proposal-approved",
  proposal_rejected: "proposal-rejected",
  marketplace_buyer: "marketplace-buyer-receipt",
  marketplace_seller: "marketplace-seller-sold",
  announcement: "announcement",
  system: "announcement",
  new_event: "new-event",
  event_created: "new-event",
  organizer_assigned: "organizer-assigned",
  media_share: "media-share",
  dsar_export: "dsar-export-ready",
  account_deleted: "account-deleted",
  message: "message-digest",
  message_digest: "message-digest",
  ai_digest: "ai-digest",
  newsletter: "newsletter",
  survey_invite: "survey-invite",
  survey_reminder: "survey-reminder",
  checkin: "checkin-confirmation",
  feedback_reply: "feedback-reply",
  welcome: "welcome",
  follow: "follower",
  story_like: "story-like",
  partner_pitch: "partner-pitch",
  community_highlight: "community-highlight",
  waitlist: "waitlist-confirmation",
};

/** Types that default to email OFF (noisy social). Override with send_email: true. */
export const EMAIL_OPT_IN_TYPES = new Set([
  "follow",
  "story_like",
  "partner_pitch",
  "community_highlight",
]);

/** Types that require marketing_consent. */
export const MARKETING_TYPES = new Set([
  "newsletter",
  "ai_digest",
  "partner_pitch",
  "community_highlight",
  "waitlist",
]);

function v(vars: TemplateVars, key: string, fallback = ""): string {
  return String(vars[key] ?? fallback);
}

function detailRows(
  pairs: Array<[string, string | undefined]>
): DetailRow[] | undefined {
  const rows = pairs
    .filter(([, val]) => val && String(val).trim())
    .map(([label, val]) => ({ label, value: String(val) }));
  return rows.length ? rows : undefined;
}

/** Templates that share a Figma hero when no dedicated asset exists. */
const HERO_FALLBACK: Partial<Record<EmailTemplateId, string>> = {
  welcome: "confirm-signup",
  "survey-invite": "event-reminder",
  "survey-reminder": "event-reminder",
  "checkin-confirmation": "ticket-confirmation",
  "feedback-reply": "announcement",
  follower: "message-digest",
  "story-like": "message-digest",
  "partner-pitch": "newsletter",
  "community-highlight": "ai-digest",
  "waitlist-confirmation": "newsletter",
  generic: "announcement",
};


function figma(
  id: EmailTemplateId,
  vars: TemplateVars,
  opts: {
    badge: string;
    line1: string;
    line2: string;
    heroSub: string;
    body: string;
    ctaUrl?: string;
    ctaLabel?: string;
    details?: DetailRow[];
    noticeTitle?: string;
    noticeBody?: string;
    tallHero?: boolean;
    greeting?: string;
    bodyIsHtml?: boolean;
  }
): string {
  const siteUrl = v(vars, "siteUrl", "https://www.wya254.com");
  const userName = v(vars, "userName", "there");
  const greeting =
    opts.greeting ??
    (userName && userName !== "there" ? `Hello ${userName},` : "Hello there,");
  const heroSlug = HERO_FALLBACK[id] ?? id;
  return renderFigmaEmail({
    siteUrl,
    badge: opts.badge,
    headlineLine1: opts.line1,
    headlineLine2: opts.line2,
    heroSub: opts.heroSub,
    greeting,
    bodyHtml: opts.bodyIsHtml ? pHtml(opts.body) : p(opts.body),
    ctaUrl: opts.ctaUrl,
    ctaLabel: opts.ctaLabel,
    details: opts.details,
    noticeTitle: opts.noticeTitle,
    noticeBody: opts.noticeBody,
    tallHero: opts.tallHero,
    heroImageUrl: emailHeroUrl(siteUrl, heroSlug),
  });
}

export function renderTransactionalTemplate(
  id: EmailTemplateId,
  vars: TemplateVars
): { subject: string; html: string } {
  const siteUrl = v(vars, "siteUrl", "https://www.wya254.com");
  const link = v(vars, "link", siteUrl);
  const title = v(vars, "title", "WYA");
  const message = v(vars, "message", "");
  const eventTitle = v(vars, "eventTitle", "your event");
  const userName = v(vars, "userName", "there");

  switch (id) {
    case "ticket-confirmation":
      return {
        subject: `Your tickets for ${eventTitle}`,
        html: figma(id, vars, {
          badge: "TICKETS",
          line1: "Your tickets",
          line2: "are confirmed.",
          heroSub: "Payment successful.",
          body:
            message ||
            "Thanks for buying with WYA. Your tickets are ready in the app.",
          details: detailRows([
            ["Event", eventTitle],
            ["Date", v(vars, "eventWhen")],
            ["Tickets", v(vars, "ticketSummary")],
            ["Paid", v(vars, "amountPaid")],
            ["Order", v(vars, "orderId")],
          ]),
          ctaUrl: link || `${siteUrl}/tickets`,
          ctaLabel: "View tickets",
          noticeTitle: "AT THE DOOR",
          noticeBody:
            "Show your QR code from the WYA app. Keep this email for your records.",
          tallHero: true,
        }),
      };

    case "event-reminder":
      return {
        subject: `Reminder: ${eventTitle} ${v(vars, "whenLabel", "soon")}`,
        html: figma(id, vars, {
          badge: "REMINDER",
          line1: v(vars, "headlineLine1", "Tomorrow night"),
          line2: v(vars, "headlineLine2", "you are going."),
          heroSub: v(vars, "whenLabel", "T−24h reminder."),
          body:
            message ||
            "Your event starts soon. Arrive early with your QR ticket ready.",
          details: detailRows([
            ["Event", eventTitle],
            ["When", v(vars, "eventWhen")],
            ["Where", v(vars, "eventWhere")],
          ]),
          ctaUrl: link,
          ctaLabel: "Open event",
          tallHero: true,
        }),
      };

    case "event-updated":
      return {
        subject: `Update: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "UPDATE",
          line1: "This event",
          line2: "was updated.",
          heroSub: "Details changed.",
          body:
            message ||
            "An organizer changed details for an event you hold tickets for. Review the new info.",
          details: detailRows([
            ["Event", eventTitle],
            ["Was", v(vars, "wasLabel")],
            ["Now", v(vars, "nowLabel")],
          ]),
          ctaUrl: link,
          ctaLabel: "See changes",
          noticeTitle: "YOUR TICKETS",
          noticeBody:
            "Existing tickets remain valid for the updated time and venue.",
          tallHero: true,
        }),
      };

    case "event-cancelled":
      return {
        subject: `Cancelled: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "CANCELLED",
          line1: "This event",
          line2: "was cancelled.",
          heroSub: "Refund in progress.",
          body:
            message ||
            "Unfortunately an event you had tickets for has been cancelled by the organizer.",
          details: detailRows([
            ["Event", eventTitle],
            ["Refund", v(vars, "refundLabel")],
          ]),
          ctaUrl: link || `${siteUrl}/tickets`,
          ctaLabel: "View refund",
          noticeTitle: "NEED HELP?",
          noticeBody:
            "Contact support if you do not see funds within 5 business days.",
          tallHero: true,
        }),
      };

    case "proposal-submitted":
      return {
        subject: "We received your event proposal",
        html: figma(id, vars, {
          badge: "RECEIVED",
          line1: "We got",
          line2: "your proposal.",
          heroSub: "In review.",
          body:
            message ||
            "Thanks for submitting. We will email you when there is a decision.",
          details: detailRows([
            ["Proposal", eventTitle],
            ["Status", v(vars, "statusLabel", "In review")],
          ]),
          ctaUrl: link || `${siteUrl}/request-event`,
          ctaLabel: "Track proposal",
          tallHero: true,
        }),
      };

    case "proposal-approved":
      return {
        subject: `Approved: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "APPROVED",
          line1: "Your proposal",
          line2: "was approved.",
          heroSub: "Ready to publish.",
          body:
            message ||
            "The WYA team approved your event proposal. Finish setup and go live.",
          details: detailRows([
            ["Proposal", eventTitle],
            ["Next", v(vars, "nextLabel", "Add tickets & publish")],
          ]),
          ctaUrl: link,
          ctaLabel: "Open proposal",
          tallHero: true,
        }),
      };

    case "proposal-rejected":
      return {
        subject: `Update on your proposal: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "NEEDS CHANGES",
          line1: "Your proposal",
          line2: "needs work.",
          heroSub: "Review feedback.",
          body:
            message ||
            "We cannot approve this proposal yet. See notes and resubmit when ready.",
          details: detailRows([
            ["Proposal", eventTitle],
            ["Reason", v(vars, "reasonLabel", message)],
          ]),
          ctaUrl: link || `${siteUrl}/request-event`,
          ctaLabel: "Review feedback",
          noticeTitle: "YOU CAN RESUBMIT",
          noticeBody:
            "Fix the issues noted by admin and submit again from Request Event.",
          tallHero: true,
        }),
      };

    case "marketplace-buyer-receipt":
      return {
        subject: "Marketplace purchase confirmed",
        html: figma(id, vars, {
          badge: "TRANSFER",
          line1: "Transfer",
          line2: "complete.",
          heroSub: "Tickets are yours.",
          body:
            message ||
            "Your marketplace transfer or gift claim succeeded. Tickets are now in your wallet.",
          details: detailRows([
            ["Event", eventTitle],
            ["Tickets", v(vars, "ticketSummary")],
            ["Type", v(vars, "transferType", "Transfer")],
          ]),
          ctaUrl: link || `${siteUrl}/tickets`,
          ctaLabel: "View tickets",
          tallHero: true,
        }),
      };

    case "marketplace-seller-sold":
      return {
        subject: "Your listing sold",
        html: figma(id, vars, {
          badge: "SALE",
          line1: "Your listing",
          line2: "sold.",
          heroSub: "Payout pending.",
          body:
            message || "Someone bought or claimed your marketplace listing.",
          details: detailRows([
            ["Listing", v(vars, "listingLabel", eventTitle)],
            ["Amount", v(vars, "amountPaid")],
            ["Payout", v(vars, "payoutLabel", "Pending")],
          ]),
          ctaUrl: link || `${siteUrl}/marketplace`,
          ctaLabel: "View sale",
          tallHero: true,
        }),
      };

    case "announcement":
      return {
        subject: title || "Announcement from WYA",
        html: figma(id, vars, {
          badge: "ANNOUNCEMENT",
          line1: v(vars, "headlineLine1", "Important"),
          line2: v(vars, "headlineLine2", "platform update."),
          heroSub: "From the WYA team.",
          body: message || "We are sharing an update from the WYA team.",
          details: detailRows([
            ["Topic", v(vars, "topicLabel", title)],
            ["When", v(vars, "whenLabel")],
          ]),
          ctaUrl: link || siteUrl,
          ctaLabel: "Read announcement",
          noticeTitle: "ACTION NEEDED?",
          noticeBody:
            v(vars, "noticeBody") ||
            "No action required unless noted in the announcement.",
          tallHero: true,
        }),
      };

    case "new-event":
      return {
        subject: title || `New event: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "FOR YOU",
          line1: "New event",
          line2: "near you.",
          heroSub: "Matches your interests.",
          body:
            message ||
            "A new event near you matches your vibe. Check it before tickets sell out.",
          details: detailRows([
            ["Event", eventTitle],
            ["When", v(vars, "eventWhen")],
            ["Area", v(vars, "eventArea")],
          ]),
          ctaUrl: link || `${siteUrl}/events`,
          ctaLabel: "Explore event",
          tallHero: true,
        }),
      };

    case "organizer-assigned":
      return {
        subject: `You're organizing ${eventTitle}`,
        html: figma(id, vars, {
          badge: "ORGANIZER",
          line1: "You're now",
          line2: "the organizer.",
          heroSub: "New permissions.",
          body:
            message ||
            "An admin assigned you as organizer. You can manage tickets, media, and updates.",
          details: detailRows([
            ["Event", eventTitle],
            ["Role", "Organizer"],
          ]),
          ctaUrl: link,
          ctaLabel: "Open tools",
          tallHero: true,
        }),
      };

    case "media-share":
      return {
        subject: `Media gallery: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "GALLERY",
          line1: "Fresh media",
          line2: "shared with you.",
          heroSub: "Review the gallery.",
          body:
            message ||
            "An admin shared event media with you. Open the gallery to review photos and clips.",
          details: detailRows([
            ["Event", eventTitle],
            ["Items", v(vars, "mediaSummary")],
          ]),
          ctaUrl: link,
          ctaLabel: "Open gallery",
          tallHero: true,
        }),
      };

    case "dsar-export-ready":
      return {
        subject: "Your data export is ready",
        html: figma(id, vars, {
          badge: "PRIVACY",
          line1: "Your export",
          line2: "is ready.",
          heroSub: "Secure download.",
          body:
            message ||
            "Your personal data export finished processing. Download it with the secure link below.",
          details: detailRows([
            ["Request", v(vars, "requestId")],
            ["Expires", v(vars, "expiresLabel", "7 days")],
          ]),
          ctaUrl: link || `${siteUrl}/settings`,
          ctaLabel: "Download export",
          noticeTitle: "PRIVACY",
          noticeBody:
            "Do not forward this link. It is single-user and time-limited.",
          tallHero: true,
        }),
      };

    case "account-deleted":
      return {
        subject: "Your WYA account has been deleted",
        html: figma(id, vars, {
          badge: "ACCOUNT",
          line1: "Your account",
          line2: "was deleted.",
          heroSub: "Deletion confirmed.",
          body:
            message ||
            "We confirmed deletion of your WYA account. You will no longer receive product emails unless you create a new account.",
          details: detailRows([["Completed", v(vars, "completedAt")]]),
          noticeTitle: "WAS THIS A MISTAKE?",
          noticeBody:
            "Contact support@wyakenya.com within 14 days if you did not request this.",
          tallHero: true,
        }),
      };

    case "message-digest":
      return {
        subject: title || "You have unread messages",
        html: figma(id, vars, {
          badge: "MESSAGES",
          line1: "You have",
          line2: "unread chats.",
          heroSub: "Catch up on WYA.",
          body:
            message ||
            "While you were away, people messaged you. Open the app so you do not miss plans.",
          details: detailRows([
            ["Unread", v(vars, "unreadLabel")],
            ["Latest", v(vars, "latestLabel")],
          ]),
          ctaUrl: link || `${siteUrl}/chat`,
          ctaLabel: "Open messages",
          noticeTitle: "PREFERENCES",
          noticeBody: "Digest emails respect your notification settings.",
          tallHero: true,
        }),
      };

    case "ai-digest":
      return {
        subject: title || "Your weekly WYA digest",
        html: figma(id, vars, {
          badge: "DIGEST",
          line1: "Your week",
          line2: "on WYA.",
          heroSub: "Personalized picks.",
          body:
            message ||
            "A short digest tailored to you — based on your AI digest preference.",
          bodyIsHtml: Boolean(message && /<[a-z]/i.test(message)),
          details: detailRows([
            ["Nearby", v(vars, "nearbyLabel")],
            ["Trending", v(vars, "trendingLabel")],
          ]),
          ctaUrl: link || siteUrl,
          ctaLabel: "See picks",
          noticeTitle: "PREFERENCES",
          noticeBody: "Turn this off anytime in Settings → Notifications.",
          tallHero: true,
        }),
      };

    case "newsletter":
      return {
        subject: title || "WYA newsletter",
        html: figma(id, vars, {
          badge: "NEWSLETTER",
          line1: "This week's",
          line2: "pulse.",
          heroSub: "For subscribers only.",
          body:
            message ||
            "Hand-picked nights, new drops, and community highlights for people with marketing consent.",
          bodyIsHtml: Boolean(message && /<[a-z]/i.test(message)),
          details: detailRows([
            ["Hot", v(vars, "hotLabel")],
            ["New", v(vars, "newLabel")],
          ]),
          ctaUrl: link || siteUrl,
          ctaLabel: "Browse this week",
          noticeTitle: "UNSUBSCRIBE ANYTIME",
          noticeBody:
            "Manage preferences from Settings or the unsubscribe link in live sends.",
          tallHero: true,
        }),
      };

    case "admin-system-test":
      return {
        subject: title || "WYA — System test email",
        html: figma(id, vars, {
          badge: "SYSTEM TEST",
          line1: "Delivery",
          line2: "looks good.",
          heroSub: "Resend connectivity check.",
          body:
            message ||
            "This is a test email from WYA Admin System. If you received it, email delivery is working.",
          ctaUrl: link || `${siteUrl}/admin/communications`,
          ctaLabel: "Open Admin",
          noticeTitle: "NO ACTION NEEDED",
          noticeBody:
            "This message was triggered manually from the admin panel.",
        }),
      };

    case "survey-invite":
      return {
        subject: `Survey: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "SURVEY",
          line1: "We'd love",
          line2: "your feedback.",
          heroSub: "Short survey.",
          body:
            message || `Please take a short survey about ${eventTitle}.`,
          ctaUrl: link,
          ctaLabel: "Take survey",
          tallHero: true,
        }),
      };

    case "survey-reminder":
      return {
        subject: `Reminder: survey for ${eventTitle}`,
        html: figma(id, vars, {
          badge: "REMINDER",
          line1: "Don't forget",
          line2: "your survey.",
          heroSub: "Feedback pending.",
          body:
            message ||
            `Don't forget to complete the survey for ${eventTitle}.`,
          ctaUrl: link,
          ctaLabel: "Take survey",
          tallHero: true,
        }),
      };

    case "checkin-confirmation":
      return {
        subject: `Checked in: ${eventTitle}`,
        html: figma(id, vars, {
          badge: "CHECK-IN",
          line1: "You're",
          line2: "checked in.",
          heroSub: "Enjoy the night.",
          body: message || `You're checked in at ${eventTitle}. Enjoy!`,
          ctaUrl: link,
          ctaLabel: "View event",
          tallHero: true,
        }),
      };

    case "feedback-reply":
      return {
        subject: title || "Update on your feedback",
        html: figma(id, vars, {
          badge: "FEEDBACK",
          line1: "Update on",
          line2: "your feedback.",
          heroSub: "From the WYA team.",
          body:
            message || "There's an update on the feedback you sent us.",
          ctaUrl: link || `${siteUrl}/feedback`,
          ctaLabel: "View details",
        }),
      };

    case "welcome":
      return {
        subject: "Welcome to WYA",
        html: figma(id, vars, {
          badge: "WELCOME",
          line1: "Your night",
          line2: "starts here.",
          heroSub: "Welcome to WYA.",
          body:
            message ||
            "Your profile is ready — discover events across Kenya.",
          ctaUrl: link || `${siteUrl}/home`,
          ctaLabel: "Explore",
        }),
      };

    case "follower":
      return {
        subject: title || "New follower on WYA",
        html: figma(id, vars, {
          badge: "SOCIAL",
          line1: "Someone new",
          line2: "followed you.",
          heroSub: "On WYA.",
          body: message || "Someone started following you on WYA.",
          ctaUrl: link || `${siteUrl}/notifications`,
          ctaLabel: "View",
        }),
      };

    case "story-like":
      return {
        subject: title || "Someone liked your story",
        html: figma(id, vars, {
          badge: "SOCIAL",
          line1: "Your story",
          line2: "got a like.",
          heroSub: "On WYA.",
          body: message || "Someone liked your story on WYA.",
          ctaUrl: link || `${siteUrl}/discover`,
          ctaLabel: "View",
        }),
      };

    case "partner-pitch":
      return {
        subject: title || "Partner opportunity on WYA",
        html: figma(id, vars, {
          badge: "PARTNER",
          line1: "A partner",
          line2: "opportunity.",
          heroSub: "Opted-in pitches.",
          body: message || "A partner opportunity you might like.",
          bodyIsHtml: Boolean(message && /<[a-z]/i.test(message)),
          ctaUrl: link || siteUrl,
          ctaLabel: "Learn more",
          noticeTitle: "PREFERENCES",
          noticeBody:
            "You're receiving this because you opted into partner pitches.",
        }),
      };

    case "community-highlight":
      return {
        subject: title || "Community highlight",
        html: figma(id, vars, {
          badge: "COMMUNITY",
          line1: "Community",
          line2: "highlight.",
          heroSub: "From WYA.",
          body: message || "A community highlight from WYA.",
          bodyIsHtml: Boolean(message && /<[a-z]/i.test(message)),
          ctaUrl: link || siteUrl,
          ctaLabel: "Check it out",
          noticeTitle: "PREFERENCES",
          noticeBody:
            "You're receiving this because you opted into community highlights.",
        }),
      };

    case "waitlist-confirmation":
      return {
        subject: "You're on the WYA waitlist",
        html: figma(id, vars, {
          badge: "WAITLIST",
          line1: "You're on",
          line2: "the list.",
          heroSub: "We'll be in touch.",
          body: message || "We'll email you when there's news.",
          greeting: userName !== "there" ? `Hello ${userName},` : "Hello there,",
          noticeTitle: "PREFERENCES",
          noticeBody:
            "You're receiving this because you joined the WYA waitlist.",
        }),
      };

    case "generic":
    default:
      return {
        subject: title || "Message from WYA",
        html: figma(id, vars, {
          badge: "WYA",
          line1: title || "Message",
          line2: "from WYA.",
          heroSub: "",
          body: message || "You have a new message from WYA.",
          ctaUrl: link || siteUrl,
          ctaLabel: "Open WYA",
        }),
      };
  }
}
