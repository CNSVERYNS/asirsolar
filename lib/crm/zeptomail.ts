import { isValidEmail } from "../enquiry.ts";
import { parseEmailAddress, type EmailAddress } from "./email-address.ts";
import { DeliveryError } from "./notification-errors.ts";

// Server-only via notifications.server.ts. No configurable host or redirects:
// the Send Mail Token may only be sent to the verified provider API origin.
// Contract: https://www.zoho.com/zeptomail/help/api/email-sending.html
const endpoint = "https://api.zeptomail.com/v1.1/email";
export type TransactionalEmail = {
  from: string; to: EmailAddress; replyTo: string | EmailAddress;
  subject: string; text: string; html: string; messageId: string;
};

export async function sendZeptoMail(message: TransactionalEmail, reference: string) {
  const token = process.env.CRM_ZEPTOMAIL_TOKEN;
  if (!token || /\s/.test(token)) throw new DeliveryError("zeptomail_not_configured");
  const from = parseEmailAddress(message.from);
  const replyTo = typeof message.replyTo === "string" ? parseEmailAddress(message.replyTo) : message.replyTo;
  const addresses = [from, message.to, replyTo];
  if (addresses.some(value => !value || !isValidEmail(value.address) || /[\u0000-\u001f\u007f]/.test(value.name) || value.name.length > 250)
    || /[\u0000-\u001f\u007f]/.test(message.subject + message.messageId + reference)) {
    throw new DeliveryError("email_address_or_header_invalid");
  }
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Zoho-enczapikey ${token}` },
      body: JSON.stringify({
        from, to: [{ email_address: message.to }], reply_to: [replyTo],
        subject: message.subject, textbody: message.text, htmlbody: message.html,
        client_reference: reference,
        mime_headers: { "Message-ID": message.messageId, "Auto-Submitted": "auto-generated", "X-Auto-Response-Suppress": "All" },
        track_opens: false, track_clicks: false,
      }),
    });
  } catch {
    // Acceptance may have happened before a timeout/disconnect. Do not auto resend.
    throw new DeliveryError("zeptomail_response_unknown", false, true);
  }
  // Never log or persist a provider body: it may echo addresses, input or credentials.
  if (response.status === 429) throw new DeliveryError("zeptomail_rate_limited", true);
  if ([400, 401, 403, 404, 405, 413, 422].includes(response.status)) throw new DeliveryError(`zeptomail_http_${response.status}`);
  if (!response.ok) throw new DeliveryError("zeptomail_response_unknown", false, true);
  let data: { data?: { code?: unknown }[]; request_id?: unknown };
  try { data = await response.json(); }
  catch { throw new DeliveryError("zeptomail_response_invalid", false, true); }
  if (!data || !Array.isArray(data.data) || data.data.length !== 1 || data.data[0]?.code !== "EM_104"
    || typeof data.request_id !== "string" || !/^[\w.-]{1,200}$/.test(data.request_id)) {
    throw new DeliveryError("zeptomail_response_invalid", false, true);
  }
  // client_reference is for correlation, not a provider idempotency guarantee.
  return { requestId: data.request_id };
}
