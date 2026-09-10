import test from "node:test";
import assert from "node:assert/strict";
import { buildEnquiryDraft, resolveProjectType, validateEnquiry } from "../lib/enquiry.ts";

const valid = { name: "Örnek Müşteri", phone: "+90 (532) 123 45 67", email: "test@example.com", company: "Örnek & Ortakları", projectType: "İşletme / Fabrika", message: "Gebze'deki fabrika çatımız için keşif talep ediyoruz.", consent: true };

test("accepts a complete enquiry including Turkish names and a formatted phone", () => {
  assert.deepEqual(validateEnquiry(valid), {});
});
test("requires contact details, a useful message, and consent", () => {
  const errors = validateEnquiry({ ...valid, name: " ", phone: "123", email: "not-an-email", message: " ", consent: false });
  assert.deepEqual(Object.keys(errors).sort(), ["consent", "email", "message", "name", "phone"]);
});
test("rejects alphabetic phone numbers and oversized messages", () => {
  assert.ok(validateEnquiry({ ...valid, phone: "abc5321234567" }).phone);
  assert.ok(validateEnquiry({ ...valid, message: "a".repeat(1501) }).message);
});
test("allows only supported project types from an incoming URL", () => {
  assert.equal(resolveProjectType("Konut / Villa"), "Konut / Villa");
  for (const input of [undefined, ["Arazi Tipi", "Konut / Villa"], "<script>", "Unknown"]) {
    assert.equal(resolveProjectType(input), "Diğer / Bilmiyorum");
  }
});
test("mailto keeps accents, line breaks, and query punctuation without injecting fields", () => {
  const values = { ...valid, message: "Çatı & pano?\nEk satır: #keşif&bcc=other@example.com" };
  const draft = buildEnquiryDraft(values, "team@example.com");
  const link = new URL(draft.mailto);
  assert.equal(link.pathname, "team@example.com");
  assert.equal(link.searchParams.size, 2);
  assert.equal(link.searchParams.get("body"), draft.body);
  assert.ok(draft.body.includes(values.message));
  assert.ok(draft.body.includes(values.projectType));
  assert.equal(link.searchParams.get("bcc"), null);
});
test("trims surrounding whitespace and handles an optional company", () => {
  const draft = buildEnquiryDraft({ ...valid, name: "  Örnek  ", company: "  " }, "team@example.com");
  assert.equal(draft.subject, "Keşif Talebi — Örnek");
  assert.ok(draft.body.includes("Firma / Kurum: —"));
});
