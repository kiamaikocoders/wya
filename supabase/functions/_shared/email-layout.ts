/**
 * Figma WYA email layout (file 9RMXZrqarVf6A3t4Lug70v, page "16 — Emails").
 * Light theme: bg #f6f8fa, accent #ff6b35, text #1f2328 / #656d76.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ACCENT = "#ff6b35";
const TEXT = "#1f2328";
const MUTED = "#656d76";
const PAGE_BG = "#f6f8fa";
const CARD_SOFT = "#eff2f5";

export type DetailRow = { label: string; value: string };

export type FigmaEmailOpts = {
  /** Absolute site origin, e.g. https://www.wya254.com */
  siteUrl: string;
  badge: string;
  headlineLine1: string;
  /** Second headline line — rendered in accent orange */
  headlineLine2: string;
  heroSub: string;
  greeting?: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  details?: DetailRow[];
  noticeTitle?: string;
  noticeBody?: string;
  /** Use taller hero image slot (event-style) */
  tallHero?: boolean;
  /** Override hero image absolute URL */
  heroImageUrl?: string;
  /** When true, CTA href uses Go template for Auth */
  authCtaHref?: string;
};

/** Join site origin + path into an absolute asset URL. */
function asset(siteUrl: string, path: string): string {
  const base = (siteUrl || "https://www.wya254.com").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Per-template Figma hero under /emails/heroes/{id}.jpg */
export function emailHeroPath(templateId: string): string {
  return `/emails/heroes/${templateId}.jpg`;
}

export function emailHeroUrl(siteUrl: string, templateId: string): string {
  return asset(siteUrl, emailHeroPath(templateId));
}

function detailsBlock(rows: DetailRow[]): string {
  if (!rows.length) return "";
  const inner = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:${MUTED};width:100px;vertical-align:top;">${escapeHtml(r.label)}</td>
          <td style="padding:6px 0;font-family:Inter,Arial,sans-serif;font-size:13px;color:${TEXT};font-weight:600;">${escapeHtml(r.value)}</td>
        </tr>`
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:${CARD_SOFT};border-radius:10px;">
      <tr><td style="padding:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table>
      </td></tr>
    </table>`;
}

export function renderFigmaEmail(opts: FigmaEmailOpts): string {
  const site = opts.siteUrl.replace(/\/$/, "") || "https://www.wya254.com";
  const logo = asset(site, "/emails/wya-logo.png");
  const hero =
    opts.heroImageUrl ||
    asset(site, "/emails/heroes/confirm-signup.jpg");
  const heroH = opts.tallHero ? 220 : 180;
  const greeting = opts.greeting ?? "Hello there,";
  const ctaHref = opts.authCtaHref || opts.ctaUrl || site;
  const cta =
    opts.ctaLabel && ctaHref
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;">
        <tr>
          <td style="background:${ACCENT};border-radius:999px;">
            <a href="${opts.authCtaHref ? ctaHref : escapeHtml(ctaHref)}" style="display:inline-block;padding:12px 32px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(opts.ctaLabel)}</a>
          </td>
        </tr>
      </table>`
      : "";

  const notice =
    opts.noticeTitle && opts.noticeBody
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_SOFT};border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 8px 0;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:${ACCENT};">${escapeHtml(opts.noticeTitle)}</p>
          <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">${escapeHtml(opts.noticeBody)}</p>
        </td></tr>
      </table>`
      : "";

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WYA</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 14px 0;">
              <img src="${logo}" alt="WYA" width="96" height="64" style="display:block;border:0;height:64px;width:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <img src="${hero}" alt="" width="520" height="${heroH}" style="display:block;width:100%;max-width:520px;height:${heroH}px;object-fit:cover;border-radius:12px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_SOFT};border-radius:12px;">
                <tr><td style="padding:20px;">
                  <span style="display:inline-block;background:${ACCENT};color:#fff;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;letter-spacing:0.02em;">${escapeHtml(opts.badge)}</span>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:${TEXT};">${escapeHtml(opts.headlineLine1)}</p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:30px;line-height:36px;font-weight:800;color:${ACCENT};">${escapeHtml(opts.headlineLine2)}</p>
                  <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:20px;color:${MUTED};">${escapeHtml(opts.heroSub)}</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:25px;font-weight:700;color:${TEXT};">${escapeHtml(greeting)}</p>
                  ${opts.bodyHtml}
                  ${detailsBlock(opts.details ?? [])}
                  ${cta}
                  ${notice}
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_SOFT};border-radius:12px;">
                <tr><td style="padding:16px;text-align:center;">
                  <p style="margin:0 0 6px 0;font-family:Inter,Arial,sans-serif;font-size:11px;color:${MUTED};">
                    <a href="${site}/faq" style="color:${MUTED};text-decoration:none;">Support</a>
                    ·
                    <a href="${site}/privacy-policy" style="color:${MUTED};text-decoration:none;">Privacy</a>
                    ·
                    <a href="${site}/terms-of-service" style="color:${MUTED};text-decoration:none;">Terms</a>
                  </p>
                  <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:11px;color:${MUTED};">© ${year} WYA Kenya. All rights reserved.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">${escapeHtml(text)}</p>`;
}

export function pHtml(html: string): string {
  return `<p style="margin:0 0 16px 0;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">${html}</p>`;
}

/** Legacy helper — maps to Figma layout. Prefer `renderFigmaEmail`. */
export function wrapEmail(opts: {
  title: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
  siteUrl?: string;
  badge?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  heroSub?: string;
  greeting?: string;
  details?: DetailRow[];
  tallHero?: boolean;
}): string {
  const titleParts = opts.title.trim().split(/\s+/);
  const mid = Math.max(1, Math.ceil(titleParts.length / 2));
  const line1 = opts.headlineLine1 ?? titleParts.slice(0, mid).join(" ");
  const line2 = opts.headlineLine2 ?? (titleParts.slice(mid).join(" ") || ".");
  return renderFigmaEmail({
    siteUrl: opts.siteUrl || "https://www.wya254.com",
    badge: opts.badge ?? "WYA",
    headlineLine1: line1,
    headlineLine2: line2,
    heroSub: opts.heroSub ?? "",
    greeting: opts.greeting,
    bodyHtml: opts.bodyHtml,
    ctaUrl: opts.ctaUrl,
    ctaLabel: opts.ctaLabel,
    details: opts.details,
    noticeTitle: opts.footerNote ? "NOTE" : undefined,
    noticeBody: opts.footerNote,
    tallHero: opts.tallHero,
  });
}
