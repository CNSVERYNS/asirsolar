import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppContact } from "../lib/whatsapp.ts";

test("WhatsApp links normalize Turkish mobiles and encode the introductory message", () => {
  for (const input of ["0532 000 00 00", "5320000000", "+90 (532) 000-00-00", "00905320000000"]) {
    const contact = buildWhatsAppContact(input, "Örnek Mühendis");
    const link = new URL(contact.href);
    assert.equal(link.origin, "https://wa.me");
    assert.equal(link.pathname, "/905320000000");
    assert.equal(link.searchParams.size, 1);
    assert.ok(link.searchParams.get("text").includes("Asır Solar"));
  }
});
test("WhatsApp remains unavailable without both confirmed name and a usable number", () => {
  for (const [phone, name] of [[undefined, undefined], ["05320000000", " "], ["", "Test"], ["abc05320000000", "Test"], ["https://example.com", "Test"], ["05320000000?text=oops", "Test"], ["123", "Test"]]) {
    assert.equal(buildWhatsAppContact(phone, name), null);
  }
});
