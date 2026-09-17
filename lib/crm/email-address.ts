import { isValidEmail } from "../enquiry.ts";

export type EmailAddress = { address: string; name: string };
const controls = /[\u0000-\u001f\u007f]/;

// Accept a single mailbox, optionally "Display name <address>". Never a list/group.
export function parseEmailAddress(value: string | undefined): EmailAddress | null {
  if (!value || controls.test(value)) return null;
  const text = value.trim();
  const match = /^(.*?)\s*<([^<>]+)>$/.exec(text);
  const address = (match ? match[2] : text).trim();
  const name = match ? match[1].trim().replace(/^"(.*)"$/, "$1") : "";
  if (!isValidEmail(address) || /[<>]/.test(name) || name.length > 250) return null;
  return { address, name };
}
