import { emailEnabled, smsEnabled } from "../crm/notification-config.ts";
export function quoteSendingEnabled() { return process.env.CRM_QUOTES_SEND_ENABLED === "true"; }
export function quoteCapabilities() { return { sending: quoteSendingEnabled(), email: emailEnabled(), sms: smsEnabled() }; }
