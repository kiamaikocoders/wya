/**
 * Public proposal intake + decision emails.
 * verify_jwt = false — submit is public; notify_decision requires admin JWT.
 *
 * Actions:
 *   submit — create proposal, email contact (+ account if different)
 *   notify_decision — approved/rejected emails to contact (+ account)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadEmailSettings,
  sendRawEmail,
  logEmailSend,
  getResendApiKey,
} from "../_shared/resend.ts";
import { renderTransactionalTemplate } from "../_shared/email-templates.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@wya.local");
}

async function resolveAuthUserId(
  admin: ReturnType<typeof createClient>,
  req: Request
): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function isAdmin(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username === "admin";
}

async function sendProposalTemplateEmail(opts: {
  admin: ReturnType<typeof createClient>;
  to: string;
  template:
    | "proposal-submitted"
    | "proposal-approved"
    | "proposal-rejected";
  userId?: string | null;
  vars: Record<string, string | undefined>;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  if (!getResendApiKey()) return { sent: false, skipped: "resend_not_configured" };
  const settings = await loadEmailSettings(opts.admin);
  if (!settings.notificationsEnabled) {
    return { sent: false, skipped: "platform_disabled" };
  }

  const rendered = renderTransactionalTemplate(opts.template, {
    siteUrl: settings.siteUrl,
    userName: "there",
    ...opts.vars,
  });

  const result = await sendRawEmail({
    to: opts.to,
    subject: rendered.subject,
    html: rendered.html,
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    tags: [{ name: "template", value: opts.template.slice(0, 40) }],
  });

  await logEmailSend(opts.admin, {
    user_id: opts.userId ?? null,
    to_email: opts.to,
    template_id: opts.template,
    subject: rendered.subject,
    status: result.sent ? "sent" : result.skipped ? "skipped" : "error",
    provider_id: result.messageId,
    error: result.error ?? result.skipped ?? null,
  });

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "Misconfigured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "submit");

  try {
    if (action === "submit") {
      const title = String(body.title ?? "").trim();
      const description = String(body.description ?? "").trim();
      const category = String(body.category ?? "").trim();
      const contactEmail = String(body.contact_email ?? "").trim().toLowerCase();
      const contactPhone = String(body.contact_phone ?? "").trim() || null;
      const location = String(body.location ?? "").trim() || null;
      const estimatedDate = String(body.estimated_date ?? "").trim() || null;
      const sponsorNeeds = String(body.sponsor_needs ?? "").trim() || null;
      const imageUrl = String(body.image_url ?? "").trim();
      const expectedRaw = body.expected_attendees;
      const expectedAttendees =
        expectedRaw === null || expectedRaw === undefined || expectedRaw === ""
          ? null
          : Number.parseInt(String(expectedRaw), 10);

      if (!title || !description || !category) {
        return json({ error: "Title, description, and category are required" }, 400);
      }
      if (!isValidEmail(contactEmail)) {
        return json({ error: "A valid contact email is required" }, 400);
      }
      if (!imageUrl) {
        return json({ error: "Cover image is required" }, 400);
      }

      const jwtUserId = await resolveAuthUserId(admin, req);

      const { data: matchedId, error: lookupError } = await admin.rpc(
        "lookup_auth_user_id_by_email",
        { p_email: contactEmail }
      );
      if (lookupError) {
        console.warn("lookup_auth_user_id_by_email:", lookupError.message);
      }

      const registeredUserId =
        (typeof matchedId === "string" ? matchedId : null) || jwtUserId;
      const isRegistered = Boolean(registeredUserId);

      const { data: inserted, error: insertError } = await admin
        .from("proposals")
        .insert({
          title,
          description,
          category,
          estimated_date: estimatedDate,
          location,
          expected_attendees:
            expectedAttendees != null && !Number.isNaN(expectedAttendees)
              ? expectedAttendees
              : null,
          sponsor_needs: sponsorNeeds,
          image_url: imageUrl,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          submitted_by: registeredUserId,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        console.error(insertError);
        return json({ error: insertError?.message || "Could not save proposal" }, 500);
      }

      const emailsSent: string[] = [];
      const ack = await sendProposalTemplateEmail({
        admin,
        to: contactEmail,
        template: "proposal-submitted",
        userId: registeredUserId,
        vars: {
          eventTitle: title,
          message:
            "Thanks for submitting. We will email you when there is a decision.",
          link: `${(await loadEmailSettings(admin)).siteUrl}/request-event`,
          statusLabel: "In review",
        },
      });
      if (ack.sent) emailsSent.push(contactEmail);

      // Also notify account inbox + in-app when registered and account email differs
      if (registeredUserId) {
        try {
          const { data: authData } = await admin.auth.admin.getUserById(
            registeredUserId
          );
          const accountEmail = authData.user?.email?.trim().toLowerCase() ?? "";
          if (accountEmail && accountEmail !== contactEmail && isValidEmail(accountEmail)) {
            const second = await sendProposalTemplateEmail({
              admin,
              to: accountEmail,
              template: "proposal-submitted",
              userId: registeredUserId,
              vars: {
                eventTitle: title,
                message:
                  "Thanks for submitting. We will email you when there is a decision.",
                link: `${(await loadEmailSettings(admin)).siteUrl}/request-event`,
                statusLabel: "In review",
              },
            });
            if (second.sent) emailsSent.push(accountEmail);
          }

          await admin.from("notifications").insert({
            user_id: registeredUserId,
            type: "proposal_submitted",
            title: "Proposal Submitted",
            message: `Your event proposal "${title}" has been submitted successfully. We'll review it and get back to you soon!`,
            resource_id: inserted.id,
            resource_type: "proposal",
            link: "/request-event",
            data: {
              proposal_id: inserted.id,
              proposal_title: title,
              contact_email: contactEmail,
            },
            read: false,
          });
        } catch (e) {
          console.warn("registered follow-up failed", e);
        }
      }

      // Notify admin inbox that a proposal needs review
      try {
        const { data: admins } = await admin
          .from("profiles")
          .select("id")
          .eq("username", "admin");
        if (admins?.length) {
          await admin.from("notifications").insert(
            admins.map((a) => ({
              user_id: a.id,
              type: "proposal_submitted",
              title: "New event proposal",
              message: `"${title}" is awaiting review.`,
              resource_id: inserted.id,
              resource_type: "proposal",
              link: "/admin/proposals",
              data: {
                proposal_id: inserted.id,
                proposal_title: title,
                contact_email: contactEmail,
              },
              read: false,
            }))
          );
        }
      } catch (e) {
        console.warn("admin proposal notify failed", e);
      }

      return json({
        ok: true,
        proposal_id: inserted.id,
        is_registered: isRegistered,
        emails_sent: emailsSent,
        email: ack,
      });
    }

    if (action === "notify_decision") {
      const callerId = await resolveAuthUserId(admin, req);
      if (!callerId || !(await isAdmin(admin, callerId))) {
        return json({ error: "Admin only" }, 403);
      }

      const proposalId = Number(body.proposal_id);
      const decision = String(body.decision ?? "");
      const reasonRaw = String(body.reason ?? body.admin_notes ?? "").trim();
      if (!proposalId || (decision !== "approved" && decision !== "rejected")) {
        return json({ error: "proposal_id and decision required" }, 400);
      }
      if (decision === "rejected" && reasonRaw.length < 8) {
        return json(
          { error: "Rejection feedback is required (tell them what to change)." },
          400
        );
      }

      const { data: proposal, error } = await admin
        .from("proposals")
        .select("id, title, contact_email, submitted_by, admin_notes, status")
        .eq("id", proposalId)
        .maybeSingle();

      if (error || !proposal) return json({ error: "Proposal not found" }, 404);

      const feedback =
        reasonRaw ||
        String(proposal.admin_notes ?? "").trim() ||
        (decision === "approved"
          ? "The WYA team approved your event proposal."
          : "We cannot approve this proposal yet.");

      if (reasonRaw) {
        const { error: notesError } = await admin
          .from("proposals")
          .update({ admin_notes: reasonRaw, status: decision })
          .eq("id", proposalId);
        if (notesError) {
          console.warn("admin_notes update failed", notesError.message);
        }
      }

      const contactEmail = String(proposal.contact_email ?? "").trim().toLowerCase();
      const template =
        decision === "approved" ? "proposal-approved" : "proposal-rejected";
      const settings = await loadEmailSettings(admin);
      const emailsSent: string[] = [];
      const emailErrors: string[] = [];

      const decisionVars = {
        eventTitle: proposal.title,
        message:
          decision === "approved"
            ? reasonRaw
              ? `Approved. Note from the WYA team: ${feedback}`
              : "The WYA team approved your event proposal."
            : feedback,
        link: `${settings.siteUrl}/request-event`,
        reasonLabel: decision === "rejected" ? feedback : undefined,
        nextLabel:
          decision === "approved"
            ? "We'll follow up on next steps"
            : "Fix the notes and resubmit",
      };

      if (isValidEmail(contactEmail)) {
        const result = await sendProposalTemplateEmail({
          admin,
          to: contactEmail,
          template,
          userId: proposal.submitted_by,
          vars: decisionVars,
        });
        if (result.sent) emailsSent.push(contactEmail);
        else {
          emailErrors.push(
            `${contactEmail}: ${result.error || result.skipped || "not sent"}`
          );
        }
      } else {
        emailErrors.push("Missing or invalid contact email on proposal");
      }

      if (proposal.submitted_by) {
        try {
          const { data: authData } = await admin.auth.admin.getUserById(
            proposal.submitted_by
          );
          const accountEmail = authData.user?.email?.trim().toLowerCase() ?? "";
          if (
            accountEmail &&
            accountEmail !== contactEmail &&
            isValidEmail(accountEmail)
          ) {
            const result = await sendProposalTemplateEmail({
              admin,
              to: accountEmail,
              template,
              userId: proposal.submitted_by,
              vars: decisionVars,
            });
            if (result.sent) emailsSent.push(accountEmail);
            else {
              emailErrors.push(
                `${accountEmail}: ${result.error || result.skipped || "not sent"}`
              );
            }
          }

          const notifMessage =
            decision === "approved"
              ? reasonRaw
                ? `Your proposal "${proposal.title}" was approved. ${feedback}`
                : `Your event proposal "${proposal.title}" has been approved.`
              : `Your proposal "${proposal.title}" needs changes: ${feedback}`;

          await admin.from("notifications").insert({
            user_id: proposal.submitted_by,
            type:
              decision === "approved" ? "proposal_approved" : "proposal_rejected",
            title:
              decision === "approved" ? "Proposal Approved!" : "Proposal needs changes",
            message: notifMessage,
            resource_id: proposal.id,
            resource_type: "proposal",
            link: "/request-event",
            data: {
              proposal_id: proposal.id,
              decision,
              admin_notes: feedback,
            },
            read: false,
          });
        } catch (e) {
          console.warn("decision account notify failed", e);
        }
      }

      return json({
        ok: true,
        emails_sent: emailsSent,
        email_errors: emailErrors,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const err = e instanceof Error ? e : new Error("Unknown error");
    console.error("submit-proposal:", err.message);
    return json({ error: "Internal server error" }, 500);
  }
});
